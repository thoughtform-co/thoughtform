// ═══════════════════════════════════════════════════════════════
// ANNOTATION CAPTION API
// Generate AI caption for annotation crop (for embedding enrichment)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";

const BUCKET_NAME = "survey-media";

interface AnnotationData {
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
  crop_caption?: string;
}

const CAPTION_PROMPT = `Describe this UI element/design pattern in 1-2 concise sentences. Focus on:
- What type of UI element it is (button, panel, card, navigation, etc.)
- Its visual characteristics (colors, shapes, typography style)
- Any notable design patterns or techniques

Be specific and use design terminology. This description will be used for semantic search, so include relevant keywords.

Example responses:
- "A dark glassmorphic card with subtle gold border accents and monospace typography, featuring a hierarchical layout with header label and content area."
- "Navigation sidebar with vertical icon list using minimalist line icons, subtle hover states with background color shifts."
- "Data visualization panel with grid-based layout, numerical readouts in monospace font, and subtle scanline texture overlay."`;

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
    const { itemId, annotationId } = body;

    if (!itemId || !annotationId) {
      return NextResponse.json({ error: "Missing itemId or annotationId" }, { status: 400 });
    }

    // Fetch the survey item
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("annotations")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Find the annotation
    const annotations = (item.annotations || []) as AnnotationData[];
    const annotationIndex = annotations.findIndex((a) => a.id === annotationId);

    if (annotationIndex === -1) {
      return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    }

    const annotation = annotations[annotationIndex];

    if (!annotation.crop_path) {
      return NextResponse.json(
        { error: "Annotation has no crop - generate crop first" },
        { status: 400 }
      );
    }

    // Get signed URL for the crop
    const { data: cropSignedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(annotation.crop_path, 60);

    if (signError || !cropSignedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to access crop image" }, { status: 500 });
    }

    // Download crop and convert to base64
    const cropResponse = await fetch(cropSignedData.signedUrl);
    if (!cropResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch crop image" }, { status: 500 });
    }

    const cropBuffer = await cropResponse.arrayBuffer();
    const base64Crop = Buffer.from(cropBuffer).toString("base64");

    const mediaType = (annotation.crop_mime || "image/png") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    // Call Claude to generate caption
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const userContext = annotation.note
      ? `\n\nUser's note about this element: "${annotation.note}"`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Crop,
              },
            },
            {
              type: "text",
              text: CAPTION_PROMPT + userContext,
            },
          ],
        },
      ],
    });

    // Extract caption
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No caption returned" }, { status: 500 });
    }

    const caption = textContent.text.trim();

    // Update the annotation with caption
    const updatedAnnotations = [...annotations];
    updatedAnnotations[annotationIndex] = {
      ...annotation,
      crop_caption: caption,
    };

    // Save updated annotations
    const { error: updateError } = await supabase
      .from("survey_items")
      .update({ annotations: updatedAnnotations })
      .eq("id", itemId);

    if (updateError) {
      console.error("Failed to update annotation caption:", updateError);
      return NextResponse.json({ error: "Failed to save caption" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      annotation: updatedAnnotations[annotationIndex],
      caption,
    });
  } catch (error) {
    console.error("POST /api/survey/annotations/caption error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
