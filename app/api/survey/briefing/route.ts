// ═══════════════════════════════════════════════════════════════
// SURVEY BRIEFING API
// Generate implementation-ready frontend briefing from analysis
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";

const BUCKET_NAME = "survey-media";

const SYSTEM_PROMPT = `You are a senior frontend engineer writing implementation briefings for a design system team at Thoughtform.

Your task is to synthesize all available information about a design reference into a concise, actionable implementation briefing. The briefing should be written for another engineer who will implement components inspired by this reference.

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

    // Get signed URL for the image
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, 300);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to access image" }, { status: 500 });
    }

    // Download image and convert to base64
    const imageResponse = await fetch(signedData.signedUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Determine media type
    const mediaType = (item.image_mime || "image/png") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

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

    if (item.annotations && Array.isArray(item.annotations)) {
      const annotationNotes = (item.annotations as Array<{ note?: string }>)
        .filter((a) => a.note)
        .map((a, i) => `  ${i + 1}. ${a.note}`)
        .join("\n");
      if (annotationNotes) {
        contextParts.push(`Annotation Notes:\n${annotationNotes}`);
      }
    }

    if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
      contextParts.push(`User Tags: ${item.tags.join(", ")}`);
    }

    const contextText = contextParts.join("\n\n");

    // Call Claude with image + context
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
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
              text: `Generate an implementation briefing for this design reference.

Available context:
${contextText || "(No additional context provided)"}

Write a concise, actionable briefing that another engineer could use to implement components inspired by this reference. Focus on what's transferable to Thoughtform's HUD-inspired aesthetic.`,
            },
          ],
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
    });
  } catch (error) {
    console.error("POST /api/survey/briefing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
