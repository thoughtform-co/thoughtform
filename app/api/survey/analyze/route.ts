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

const SYSTEM_PROMPT = `You are a visual design analyst. Your task is to provide an OBJECTIVE analysis of UI/UX reference images from a designer's perspective.

This is NOT about implementation or recommendations. This is a pure visual inventory and structural analysis.

Our design system categories (for classification only):
${buildCategoryContext()}

Respond ONLY with valid JSON matching this schema:
{
  "description": "2-4 paragraphs objectively describing what's visible in the image. Include: dominant colors and palette, composition and visual balance, typography styles observed, unique or notable elements, overall mood/aesthetic. Be specific and descriptive, not prescriptive.",
  "suggestedCategoryId": "string | null - which category this reference best fits",
  "suggestedComponentKey": "string | null - which component type this most resembles",
  "tags": ["array of descriptive tags - be specific: 'dark-theme', 'monospace-typography', 'radial-layout', 'data-visualization', etc."],
  "layout": {
    "columns": "number | null - grid column count if discernible",
    "gutters": "description of spacing patterns observed",
    "baselineRhythm": "any vertical rhythm or baseline grid patterns",
    "notes": "objective layout observations - what IS, not what should be"
  },
  "informationArchitecture": {
    "modules": ["list of UI modules/sections visible in the image"],
    "hierarchy": "how visual hierarchy IS established (size, color, position, etc.)",
    "notes": "IA observations - describe the structure, don't suggest changes"
  },
  "interactionPatterns": {
    "hudAffordances": ["any HUD-like elements: reticles, brackets, gauges, overlays"],
    "frames": ["frame and container patterns observed"],
    "notes": "describe what interaction patterns are IMPLIED by the visuals"
  },
  "transferNotes": "Summarize the key visual characteristics and design decisions that make this reference distinctive. What are the signature elements? What techniques are used? Stay descriptive, not prescriptive.",
  "summary": "One-sentence factual summary of what this image shows"
}

IMPORTANT: Be purely DESCRIPTIVE. Do not give recommendations, suggestions, or implementation guidance. That's for a separate briefing step.`;

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
              text: "Provide an objective visual analysis of this UI/UX reference image. Describe what you see: colors, typography, layout, composition, visual elements, and patterns. Be descriptive and specific, like a designer documenting a reference for their mood board.",
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
