// ═══════════════════════════════════════════════════════════════
// FOUNDRY ASSISTANT CHAT API
// AI assistant for styling and modifying components in Foundry
// Now with Survey embedding search and variant generation
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";
import { COMPONENTS, getComponentById, type PropDef } from "@/app/astrogation/catalog";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const DEFAULT_MODEL = "voyage-3";

// System prompt grounding the assistant in Thoughtform's design language
const SYSTEM_PROMPT = `You are a design assistant for Thoughtform's Foundry - a component workbench for building and styling UI components.

## Thoughtform Design Aesthetic

Thoughtform's design language draws from:
- HUD-inspired interfaces with celestial navigation metaphors
- Retrofuturistic sci-fi (cockpit displays, terminal interfaces, spacecraft controls)
- Corner brackets and frame elements from targeting reticles
- Diamond (◇) markers as navigation waypoints
- Sharp corners ONLY - never rounded corners

## Color Palette

Primary:
- Void (#0a0908) - infinite possibility, the background
- Dawn (#ebe3d6) - emergence into understanding, text and particles
- Gold (#caa554) - astrolabe brass, navigation and active states

Opacity variants for hierarchy: 8%, 15%, 30%, 50%, 70%
Use CSS variables: --void, --dawn, --gold, --dawn-08, --gold-30, etc.

## Typography

- PP Mondwest: Display/headlines (digital, pixelated, transmissions)
- IBM Plex Sans: Body text (human, readable, warm)
- PT Mono: Data, labels, metrics (precise, aligned)

## Frame System

ChamferedFrame component supports:
- Ticket notch shapes (inspectorTicket, inspectorTicketCompact)
- Cut corner shapes (cutCornersSm, cutCornersMd, cutCornersTopRight)
- Customizable stroke/fill colors and stroke width

## Your Role

When the user asks you to modify a component:
1. Understand what they want to achieve aesthetically
2. Suggest specific prop or frame changes that align with our design language
3. Return a structured patch that can be applied to the component

## Creating Variants

When the user asks for variants, alternatives, or multiple options:
1. Generate 2-4 distinct variants that explore different aesthetic directions
2. Each variant should have a unique name and clear description
3. Draw inspiration from the Survey references if provided
4. Ensure all variants stay true to Thoughtform's design language

Return variants in this JSON format inside a code block:
\`\`\`variants
[
  {
    "id": "variant-1",
    "name": "Minimal Terminal",
    "description": "Clean, sparse aesthetic with subtle stroke",
    "props": { "title": "SYSTEM", "strokeColor": "var(--dawn-30)" },
    "frame": { "shape": "cutCornersSm", "strokeWidth": 1 }
  }
]
\`\`\`

IMPORTANT: When returning a patch for direct changes, use this format:
\`\`\`json
{
  "setProps": { "propName": value },
  "setFrame": { "shape": "inspectorTicket", "strokeColor": "#caa554" }
}
\`\`\`

Only include properties you want to change. Be specific and actionable.
Keep your explanations concise but insightful.`;

interface FoundryFrameConfig {
  shape: string;
  notchWidthPx: number;
  notchHeightPx: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  componentId: string | null;
  props: Record<string, unknown>;
  frame: FoundryFrameConfig;
  history?: ChatMessage[];
  includeVariants?: boolean;
  searchSurvey?: boolean;
}

interface SurveyReference {
  id: string;
  title?: string;
  briefing?: string;
  tags?: string[];
  similarity?: number;
}

interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  props: Record<string, unknown>;
  frame?: Partial<FoundryFrameConfig>;
}

// Helper to search Survey embeddings for design inspiration
async function searchSurveyReferences(
  query: string,
  authHeader: string | null
): Promise<SurveyReference[]> {
  try {
    const voyageApiKey = process.env.VOYAGE_API_KEY;
    if (!voyageApiKey) {
      console.warn("VOYAGE_API_KEY not configured, skipping Survey search");
      return [];
    }

    const supabase = createServerClient();
    if (!supabase) {
      console.warn("Supabase not configured, skipping Survey search");
      return [];
    }

    // Generate embedding for the query
    const model = process.env.VOYAGE_EMBED_MODEL || DEFAULT_MODEL;
    const voyageResponse = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${voyageApiKey}`,
      },
      body: JSON.stringify({
        model,
        input: query,
        input_type: "query",
      }),
    });

    if (!voyageResponse.ok) {
      console.error("Voyage API error during Survey search");
      return [];
    }

    const voyageData = await voyageResponse.json();
    const queryEmbedding = voyageData.data?.[0]?.embedding;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return [];
    }

    // Format embedding for pgvector
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Search using briefing embeddings
    const { data: results, error } = await supabase.rpc("match_survey_items_briefing", {
      query_embedding: embeddingStr,
      match_threshold: 0.3,
      match_count: 5,
      filter_category_id: null,
      filter_component_key: null,
    });

    if (error) {
      // Try fallback to legacy RPC
      const { data: fallbackResults } = await supabase.rpc("match_survey_items", {
        query_embedding: embeddingStr,
        match_threshold: 0.3,
        match_count: 5,
        filter_category_id: null,
        filter_component_key: null,
      });

      if (fallbackResults) {
        return fallbackResults.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          title: item.title as string | undefined,
          briefing: item.briefing as string | undefined,
          tags: item.tags as string[] | undefined,
          similarity: item.similarity as number | undefined,
        }));
      }
      return [];
    }

    return (results || []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string | undefined,
      briefing: item.briefing as string | undefined,
      tags: item.tags as string[] | undefined,
      similarity: item.similarity as number | undefined,
    }));
  } catch (error) {
    console.error("Error searching Survey references:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const body: RequestBody = await request.json();
    const {
      message,
      componentId,
      props,
      frame,
      history = [],
      includeVariants = false,
      searchSurvey = false,
    } = body;

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // Build component context
    let componentContext = "";
    let propSchema: PropDef[] = [];

    if (componentId) {
      const def = getComponentById(componentId);
      if (def) {
        propSchema = def.props;
        componentContext = `
## Current Component: ${def.name}

Category: ${def.category}
Description: ${def.description || "N/A"}

### Design Rationale
${def.designRationale || "N/A"}

### Inspiration
${def.inspiration || "N/A"}

### Frontend Notes
${def.frontendNotes || "N/A"}

### Available Props
${def.props
  .map((p) => {
    let propInfo = `- ${p.name} (${p.type})`;
    if (p.options) propInfo += `: ${p.options.join(" | ")}`;
    if (p.min !== undefined) propInfo += ` [${p.min}-${p.max}]`;
    propInfo += ` (default: ${JSON.stringify(p.default)})`;
    return propInfo;
  })
  .join("\n")}

### Current Prop Values
${JSON.stringify(props, null, 2)}

### Current Frame Config
${JSON.stringify(frame, null, 2)}
`;
      }
    } else {
      // No component selected - provide available components
      componentContext = `
## No component selected

Available components:
${COMPONENTS.map((c) => `- ${c.id}: ${c.name} (${c.category})`).join("\n")}
`;
    }

    // Search Survey for design inspiration if requested
    let surveyContext = "";
    if (searchSurvey) {
      const authHeader = request.headers.get("authorization");
      const surveyRefs = await searchSurveyReferences(message, authHeader);

      if (surveyRefs.length > 0) {
        surveyContext = `

## Design References from Survey (for inspiration)

The following design references were found relevant to this request. Use them as inspiration for your suggestions:

${surveyRefs
  .map(
    (ref, i) => `
### Reference ${i + 1}${ref.title ? `: ${ref.title}` : ""} (similarity: ${((ref.similarity || 0) * 100).toFixed(0)}%)
${ref.briefing || "No briefing available"}
${ref.tags?.length ? `Tags: ${ref.tags.join(", ")}` : ""}
`
  )
  .join("\n")}

Draw inspiration from these references when suggesting modifications or variants.
`;
      }
    }

    // Add variant instruction if requested
    let variantInstruction = "";
    if (includeVariants) {
      variantInstruction = `

## IMPORTANT: The user is asking for variants/alternatives.

Please generate 2-4 distinct variants that explore different aesthetic directions while staying true to Thoughtform's design language. Return them in a \`\`\`variants code block as shown in the system prompt.
`;
    }

    // Initialize Anthropic
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Build messages
    const previousMessages: Anthropic.MessageParam[] = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message with additional context
    const enhancedMessage = variantInstruction ? `${message}${variantInstruction}` : message;

    const messages: Anthropic.MessageParam[] = [
      ...previousMessages,
      { role: "user", content: enhancedMessage },
    ];

    // Call Anthropic
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048, // Increased for variant generation
      system: SYSTEM_PROMPT + componentContext + surveyContext,
      messages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    const responseText = textContent.text;

    // Try to extract JSON patch from response
    let patch: {
      setProps?: Record<string, unknown>;
      setFrame?: Partial<FoundryFrameConfig>;
    } | null = null;

    // Look for JSON block in response (for direct modifications)
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        // Validate patch structure
        if (parsed.setProps || parsed.setFrame) {
          patch = {};

          // Validate setProps against schema
          if (parsed.setProps && typeof parsed.setProps === "object") {
            const validProps: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(parsed.setProps)) {
              const propDef = propSchema.find((p) => p.name === key);
              if (propDef) {
                // Basic type validation
                if (propDef.type === "number" && typeof value === "number") {
                  // Clamp to min/max if defined
                  let numVal = value;
                  if (propDef.min !== undefined) numVal = Math.max(propDef.min, numVal);
                  if (propDef.max !== undefined) numVal = Math.min(propDef.max, numVal);
                  validProps[key] = numVal;
                } else if (propDef.type === "boolean" && typeof value === "boolean") {
                  validProps[key] = value;
                } else if (propDef.type === "string" && typeof value === "string") {
                  validProps[key] = value;
                } else if (
                  propDef.type === "select" &&
                  propDef.options?.includes(value as string)
                ) {
                  validProps[key] = value;
                } else if (propDef.type === "color" && typeof value === "string") {
                  validProps[key] = value;
                } else if (propDef.type === "corners" && typeof value === "string") {
                  validProps[key] = value;
                }
              }
            }
            if (Object.keys(validProps).length > 0) {
              patch.setProps = validProps;
            }
          }

          // Validate setFrame
          if (parsed.setFrame && typeof parsed.setFrame === "object") {
            const validFrame: Partial<FoundryFrameConfig> = {};
            const frameKeys: (keyof FoundryFrameConfig)[] = [
              "shape",
              "notchWidthPx",
              "notchHeightPx",
              "strokeColor",
              "strokeWidth",
              "fillColor",
            ];
            for (const key of frameKeys) {
              if (key in parsed.setFrame) {
                validFrame[key] = parsed.setFrame[key];
              }
            }
            if (Object.keys(validFrame).length > 0) {
              patch.setFrame = validFrame;
            }
          }

          // Clear patch if nothing valid was extracted
          if (!patch.setProps && !patch.setFrame) {
            patch = null;
          }
        }
      } catch {
        // JSON parsing failed, no patch to apply
        patch = null;
      }
    }

    // Try to extract variants from response
    let variants: ComponentVariant[] | null = null;
    const variantsMatch = responseText.match(/```variants\s*([\s\S]*?)\s*```/);
    if (variantsMatch) {
      try {
        const parsedVariants = JSON.parse(variantsMatch[1]);
        if (Array.isArray(parsedVariants)) {
          variants = parsedVariants.map((v: Record<string, unknown>, i: number) => ({
            id: (v.id as string) || `variant-${i + 1}`,
            name: (v.name as string) || `Variant ${i + 1}`,
            description: (v.description as string) || "",
            props: (v.props as Record<string, unknown>) || {},
            frame: v.frame as Partial<FoundryFrameConfig> | undefined,
          }));
        }
      } catch {
        // Variants parsing failed
        variants = null;
      }
    }

    return NextResponse.json({
      response: responseText,
      patch,
      variants,
    });
  } catch (error) {
    console.error("POST /api/foundry/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
