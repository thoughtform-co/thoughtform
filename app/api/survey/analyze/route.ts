// ═══════════════════════════════════════════════════════════════
// SURVEY ANALYZE API
// Use Claude to analyze design references
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, getComponentsByCategory } from "@/app/astrogation/catalog";

const BUCKET_NAME = "survey-media";

// Build category context for the prompt
function buildCategoryContext(): string {
  const lines: string[] = [];
  for (const cat of CATEGORIES) {
    const components = getComponentsByCategory(cat.id);
    lines.push(`- ${cat.id}: ${cat.name} (${cat.description || ""})`);
    for (const comp of components) {
      lines.push(`  - ${comp.id}: ${comp.name}`);
    }
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are a design system analyst for Thoughtform, a company with a distinctive HUD-inspired aesthetic rooted in celestial navigation, retrofuturism, and sci-fi interfaces.

Your task is to analyze UI/UX reference images and extract actionable insights that can inform our design system.

Our design system categories:
${buildCategoryContext()}

Our aesthetic pillars:
- Celestial navigation metaphors (astrolabes, compasses, coordinates)
- Retrofuturistic sci-fi (cockpit HUDs, terminal interfaces, spacecraft controls)
- Corner brackets and frame elements from targeting reticles
- Diamond (◇) markers, gold (#caa554) accents on dark void (#0a0908) backgrounds
- Typography: PP Mondwest for display, IBM Plex for body, PT Mono for data
- Sharp corners only - no rounded corners

Respond ONLY with valid JSON matching this schema:
{
  "description": "1-3 short paragraphs describing what's visible in the image and what's most salient (colors, composition, unique elements). This is a visual inventory.",
  "suggestedCategoryId": "string | null - one of our category IDs",
  "suggestedComponentKey": "string | null - one of our component IDs",
  "tags": ["array of relevant tags"],
  "layout": {
    "columns": "number | null",
    "gutters": "description of spacing",
    "baselineRhythm": "any vertical rhythm patterns",
    "notes": "layout observations"
  },
  "informationArchitecture": {
    "modules": ["list of UI modules/sections identified"],
    "hierarchy": "how visual hierarchy is established",
    "notes": "IA observations"
  },
  "interactionPatterns": {
    "hudAffordances": ["HUD elements like reticles, brackets, gauges"],
    "frames": ["frame and container patterns"],
    "notes": "interaction pattern observations"
  },
  "transferNotes": "Specific guidance on what to borrow and how to adapt it to Thoughtform's aesthetic. Be concrete and actionable.",
  "summary": "One-sentence summary of what this reference offers"
}`;

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
    const { itemId } = body;

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

    // Call Claude
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
              text: "Analyze this UI/UX reference image. Extract design patterns, layout structures, and interaction patterns that could inform our design system. Focus on what's transferable to our HUD-inspired aesthetic.",
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No analysis returned" }, { status: 500 });
    }

    // Parse JSON response
    let analysis;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse analysis", raw: textContent.text },
        { status: 500 }
      );
    }

    // Add to history
    const existingAnalysis = item.analysis || {};
    const history = existingAnalysis.history || [];
    if (Object.keys(existingAnalysis).length > 0) {
      const { history: _, ...previousAnalysis } = existingAnalysis;
      if (Object.keys(previousAnalysis).length > 0) {
        history.unshift({
          timestamp: new Date().toISOString(),
          analysis: previousAnalysis,
        });
      }
    }

    // Keep only last 5 analyses
    const trimmedHistory = history.slice(0, 5);

    // Extract description from analysis (it's stored separately for easier access)
    const { description, ...analysisWithoutDescription } = analysis;

    const updatedAnalysis = {
      ...analysisWithoutDescription,
      history: trimmedHistory,
    };

    // Update item with analysis AND description
    const { data: updatedItem, error: updateError } = await supabase
      .from("survey_items")
      .update({
        analysis: updatedAnalysis,
        description: description || null,
      })
      .eq("id", itemId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to save analysis:", updateError);
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    // Get signed URL for response
    const { data: responseSignedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(updatedItem.image_path, 3600);

    return NextResponse.json({
      item: { ...updatedItem, image_url: responseSignedData?.signedUrl },
      analysis,
    });
  } catch (error) {
    console.error("POST /api/survey/analyze error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
