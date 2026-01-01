// ═══════════════════════════════════════════════════════════════
// SURVEY CHAT API
// Chat with Claude about a design reference
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";

const BUCKET_NAME = "survey-media";

const SYSTEM_PROMPT = `You are a design advisor for Thoughtform, helping analyze and discuss UI/UX design references.

Thoughtform's design aesthetic:
- HUD-inspired interfaces with celestial navigation metaphors
- Retrofuturistic sci-fi (cockpit displays, terminal interfaces, spacecraft controls)
- Corner brackets and frame elements from targeting reticles
- Diamond (◇) markers, gold (#caa554) accents on dark void (#0a0908) backgrounds
- Typography: PP Mondwest for display, IBM Plex for body, PT Mono for data
- Sharp corners only - no rounded corners

When discussing references:
1. Identify what elements could transfer to our aesthetic
2. Suggest specific adaptations to fit our design language
3. Point out patterns, spacing, and layout insights
4. Be concise but specific and actionable`;

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
    const { itemId, message, history = [] } = body;

    if (!itemId || !message) {
      return NextResponse.json({ error: "Missing itemId or message" }, { status: 400 });
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

    const mediaType = (item.image_mime || "image/png") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    // Build context about the item
    let itemContext = "";
    if (item.title) itemContext += `Title: ${item.title}\n`;
    if (item.category_id) itemContext += `Category: ${item.category_id}\n`;
    if (item.component_key) itemContext += `Component: ${item.component_key}\n`;
    if (item.tags?.length > 0) itemContext += `Tags: ${item.tags.join(", ")}\n`;
    if (item.notes) itemContext += `User Notes: ${item.notes}\n`;
    if (item.analysis?.summary) itemContext += `Previous Analysis: ${item.analysis.summary}\n`;
    if (item.analysis?.transferNotes)
      itemContext += `Transfer Notes: ${item.analysis.transferNotes}\n`;

    // Build messages array
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Convert history to Anthropic format
    const previousMessages: Anthropic.MessageParam[] = history.map(
      (msg: { role: "user" | "assistant"; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })
    );

    // First message includes the image
    const firstUserMessage: Anthropic.MessageParam = {
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
          text: itemContext
            ? `Here's a design reference I'm studying.\n\n${itemContext}\nMy question: ${message}`
            : `Here's a design reference I'm studying.\n\nMy question: ${message}`,
        },
      ],
    };

    // If there's history, we need to structure messages differently
    let messages: Anthropic.MessageParam[];
    if (previousMessages.length > 0) {
      // Include image context in system prompt instead
      messages = [...previousMessages, { role: "user", content: message }];
    } else {
      messages = [firstUserMessage];
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        SYSTEM_PROMPT +
        (previousMessages.length > 0 && itemContext
          ? `\n\nContext about the current reference:\n${itemContext}`
          : ""),
      messages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    return NextResponse.json({
      response: textContent.text,
    });
  } catch (error) {
    console.error("POST /api/survey/chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
