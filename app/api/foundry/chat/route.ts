// ═══════════════════════════════════════════════════════════════
// FOUNDRY ASSISTANT CHAT API
// AI assistant for styling and modifying components in Foundry
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";
import { COMPONENTS, getComponentById, type PropDef } from "@/app/astrogation/catalog";

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

IMPORTANT: When returning a patch, use the exact prop names from the component schema.
Return JSON patches in this format:
{
  "setProps": { "propName": value },
  "setFrame": { "shape": "inspectorTicket", "strokeColor": "#caa554" }
}

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
    const { message, componentId, props, frame, history = [] } = body;

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

    // Initialize Anthropic
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Build messages
    const previousMessages: Anthropic.MessageParam[] = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message
    const messages: Anthropic.MessageParam[] = [
      ...previousMessages,
      { role: "user", content: message },
    ];

    // Call Anthropic
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + componentContext,
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

    // Look for JSON block in response
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

    return NextResponse.json({
      response: responseText,
      patch,
    });
  } catch (error) {
    console.error("POST /api/foundry/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
