// ═══════════════════════════════════════════════════════════════
// SURVEY BRIEFING API
// Generate implementation-ready frontend briefing from analysis
// Now includes annotation crops for focused design inspiration
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";
import { prepareImageForAnthropic } from "../_utils/prepareImageForAnthropic";

const BUCKET_NAME = "survey-media";
const MAX_ANNOTATION_CROPS = 3; // Maximum number of annotation crops to include

interface AnnotationWithCrop {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  note?: string;
  created_at?: string;
  crop_path?: string;
  crop_mime?: string;
  crop_width?: number;
  crop_height?: number;
}

const SYSTEM_PROMPT = `You are a senior frontend engineer writing implementation briefings for a design system team at Thoughtform.

Your task is to synthesize all available information about a design reference into a concise, actionable implementation briefing. The briefing should be written for another engineer who will implement components inspired by this reference.

You will receive:
1. The main reference image showing the full design
2. Optionally, cropped annotation images highlighting specific areas the user found notable or inspiring
3. Optionally, detected UI segments with AI-generated labels (e.g., "profile icon", "close button", "search input") - these are automatically detected interface elements

Pay special attention to:
- The annotated areas - these represent specific elements the user wants to capture or adapt
- The detected UI segments - these provide a structured inventory of interface elements present in the design

Consider what makes each annotated element and detected segment effective and how it could translate to Thoughtform's design system.

Thoughtform's aesthetic:
- Celestial navigation metaphors (astrolabes, compasses, star maps)
- Retrofuturistic sci-fi (cockpit HUDs, terminal interfaces, spacecraft controls)
- Corner brackets and frame elements (targeting reticles, viewport borders)
- Diamond (◇) markers, gold (#caa554) accents on dark void (#0a0908) backgrounds
- Typography: PP Mondwest for display, IBM Plex for body, PT Mono for data
- Sharp corners only - NEVER rounded corners
- Subtle gradients, low opacity borders, depth through layering

Output a structured briefing in this format:

## Reference Summary
One paragraph summarizing what this reference offers and how it relates to Thoughtform.

## Key Visual Elements
- Bullet list of the most important visual patterns to capture
- Focus on transferable techniques, not literal copying

## Annotated Highlights
If annotation crops were provided, describe what makes each highlighted area notable and how to adapt it:
- For each annotation, explain the design pattern and suggest implementation approach

## Detected UI Elements
If segments were detected, reference the automatically identified UI elements in your briefing:
- Mention notable patterns in the detected elements (e.g., "The interface uses a consistent set of icon styles...")
- Reference specific detected elements when relevant to implementation
- Note how these elements relate to Thoughtform's component library

## Component Recommendations
If this reference suggests specific components:
- Component name: brief description of what to build

## Token Suggestions
Suggest relevant design token values:
- Colors (with hex/rgba values)
- Spacing/sizing patterns
- Typography treatments

## Implementation Notes
- Specific technical considerations
- CSS/animation techniques to use
- Accessibility considerations

## Constraints
- What to avoid
- What doesn't fit Thoughtform's aesthetic`;

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { itemId, force = false } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Get item
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if briefing exists and force is false
    if (item.briefing && !force) {
      return NextResponse.json(
        {
          error: "Briefing already exists",
          requiresConfirmation: true,
          existingBriefing: item.briefing,
        },
        { status: 409 }
      );
    }

    // Get signed URL for the main image
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, 300);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to access image" }, { status: 500 });
    }

    // Download main image and convert to base64
    const imageResponse = await fetch(signedData.signedUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const rawBuffer = Buffer.from(await imageResponse.arrayBuffer());

    let base64Image: string;
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    try {
      const prepared = await prepareImageForAnthropic({
        buffer: rawBuffer,
        mediaType: item.image_mime,
      });
      base64Image = prepared.base64;
      mediaType = prepared.mediaType;
    } catch {
      const mb = Math.round((rawBuffer.length / 1024 / 1024) * 10) / 10;
      return NextResponse.json(
        { error: `Image is too large to brief (${mb}MB). Please upload a smaller image.` },
        { status: 413 }
      );
    }

    // Collect annotation crops (prioritize those with notes, then by recency)
    const annotations = (item.annotations || []) as AnnotationWithCrop[];
    const annotationsWithCrops = annotations
      .filter((a) => a.crop_path)
      .sort((a, b) => {
        // Prioritize annotations with notes
        const aHasNote = a.note ? 1 : 0;
        const bHasNote = b.note ? 1 : 0;
        if (aHasNote !== bHasNote) return bHasNote - aHasNote;
        // Then by creation date (most recent first)
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, MAX_ANNOTATION_CROPS);

    // Fetch annotation crop images in parallel
    const cropImages: Array<{
      index: number;
      note: string;
      base64: string;
      mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    }> = [];

    if (annotationsWithCrops.length > 0) {
      const cropPromises = annotationsWithCrops.map(async (annotation, idx) => {
        try {
          const { data: cropSignedData } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(annotation.crop_path!, 60);

          if (!cropSignedData?.signedUrl) return null;

          const cropResponse = await fetch(cropSignedData.signedUrl);
          if (!cropResponse.ok) return null;

          const cropRaw = Buffer.from(await cropResponse.arrayBuffer());
          const preparedCrop = await prepareImageForAnthropic({
            buffer: cropRaw,
            mediaType: annotation.crop_mime,
          });

          return {
            index: idx + 1,
            note: annotation.note || "(No note)",
            base64: preparedCrop.base64,
            mediaType: preparedCrop.mediaType,
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(cropPromises);
      results.forEach((r) => {
        if (r) cropImages.push(r);
      });
    }

    // Build context from all available fields
    const contextParts: string[] = [];

    if (item.title) {
      contextParts.push(`Title: ${item.title}`);
    }

    if (item.category_id) {
      contextParts.push(`Category: ${item.category_id}`);
    }

    if (item.component_key) {
      contextParts.push(`Component Type: ${item.component_key}`);
    }

    if (item.description) {
      contextParts.push(`Visual Description:\n${item.description}`);
    }

    if (item.analysis && typeof item.analysis === "object") {
      const analysis = item.analysis as Record<string, unknown>;
      if (analysis.summary) {
        contextParts.push(`AI Summary: ${analysis.summary}`);
      }
      if (analysis.transferNotes) {
        contextParts.push(`Transfer Notes: ${analysis.transferNotes}`);
      }
      if (analysis.tags && Array.isArray(analysis.tags)) {
        contextParts.push(`AI Tags: ${(analysis.tags as string[]).join(", ")}`);
      }
    }

    if (item.notes) {
      contextParts.push(`User Notes:\n${item.notes}`);
    }

    // Include annotation notes in context
    if (annotations.length > 0) {
      const annotationNotes = annotations
        .filter((a) => a.note)
        .map((a, i) => `  ${i + 1}. ${a.note}`)
        .join("\n");
      if (annotationNotes) {
        contextParts.push(`Annotation Notes:\n${annotationNotes}`);
      }
    }

    // Load and include segments (detected UI elements) in context
    const { data: segments } = await supabase
      .from("survey_segments")
      .select("id, ai_label, ai_description, label")
      .eq("survey_item_id", itemId)
      .order("area", { ascending: false })
      .limit(50); // Limit to top 50 by area

    if (segments && segments.length > 0) {
      const segmentLabels = segments
        .filter((s) => s.ai_label || s.label)
        .map((s) => {
          const label = s.ai_label || s.label || "unlabeled";
          const desc = s.ai_description ? ` (${s.ai_description})` : "";
          return `  - ${label}${desc}`;
        })
        .join("\n");
      if (segmentLabels) {
        contextParts.push(`Detected UI Elements (${segments.length} segments):\n${segmentLabels}`);
      }
    }

    if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
      contextParts.push(`User Tags: ${item.tags.join(", ")}`);
    }

    const contextText = contextParts.join("\n\n");

    // Build the message content with main image + annotation crops
    const messageContent: Anthropic.MessageParam["content"] = [
      // Main reference image
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Image,
        },
      },
      {
        type: "text",
        text: "This is the main reference image.",
      },
    ];

    // Add annotation crop images with context
    for (const crop of cropImages) {
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: crop.mediaType,
          data: crop.base64,
        },
      });
      messageContent.push({
        type: "text",
        text: `Annotation #${crop.index}: "${crop.note}" - This cropped area highlights a specific element the user found notable.`,
      });
    }

    // Add the main prompt
    messageContent.push({
      type: "text",
      text: `Generate an implementation briefing for this design reference.

${cropImages.length > 0 ? `The user has annotated ${cropImages.length} specific area(s) they find particularly inspiring or relevant. Pay special attention to these highlighted elements.` : ""}

Available context:
${contextText || "(No additional context provided)"}

Write a concise, actionable briefing that another engineer could use to implement components inspired by this reference. Focus on what's transferable to Thoughtform's HUD-inspired aesthetic.`,
    });

    // Call Claude with image + context
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: messageContent,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No briefing returned" }, { status: 500 });
    }

    const briefing = textContent.text;

    // Update item with briefing
    const { data: updatedItem, error: updateError } = await supabase
      .from("survey_items")
      .update({
        briefing,
        briefing_updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to save briefing:", updateError);
      return NextResponse.json({ error: "Failed to save briefing" }, { status: 500 });
    }

    // Get signed URL for response
    const { data: responseSignedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(updatedItem.image_path, 3600);

    return NextResponse.json({
      item: { ...updatedItem, image_url: responseSignedData?.signedUrl },
      briefing,
      annotationCropsIncluded: cropImages.length,
    });
  } catch (error) {
    console.error("POST /api/survey/briefing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
