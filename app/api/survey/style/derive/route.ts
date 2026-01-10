// ═══════════════════════════════════════════════════════════════
// SURVEY STYLE DERIVE API
// Convert a Survey item into a StyleSignature with brand-projected params
// Mosaic-inspired: extract interpretable style features from references
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";
import { prepareImageForAnthropic } from "../../_utils/prepareImageForAnthropic";
import { styleParamsToVector } from "@/app/astrogation/_foundry/styleSpace";
import crypto from "crypto";

const BUCKET_NAME = "survey-media";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface AnnotationData {
  id: string;
  note?: string;
  crop_path?: string;
  crop_caption?: string;
}

interface SegmentData {
  id: string;
  ai_label?: string;
  ai_description?: string;
  label?: string;
  area: number;
}

// StyleParams structure - interpretable style features
export interface StyleParams {
  // Visual motifs present in the reference
  motifs: {
    brackets: "none" | "corners" | "full" | "targeting";
    reticles: "none" | "subtle" | "prominent";
    tick_marks: "none" | "sparse" | "dense";
    grids: "none" | "subtle" | "visible" | "prominent";
    scanlines: "none" | "subtle" | "visible";
    label_styles: "minimal" | "technical" | "ornate";
  };

  // Geometric characteristics
  geometry: {
    sharpness: number; // 0-1: rounded to sharp
    chamfer_prevalence: number; // 0-1: how much chamfering/cut corners
    corner_language: "squared" | "chamfered" | "notched" | "bracketed";
    line_weight: "hairline" | "light" | "medium" | "heavy";
  };

  // Composition and layout
  composition: {
    density: number; // 0-1: sparse to dense
    spacing_rhythm: "tight" | "balanced" | "loose";
    layering_depth: number; // 0-1: flat to deep
    panel_hierarchy: "flat" | "subtle" | "pronounced";
  };

  // Texture and effects (as 0-1 scalars)
  texture: {
    noise: number;
    scanlines: number;
    glow: number;
    grain: number;
  };

  // Color roles (semantic, not actual colors)
  color_roles: {
    background: "dark" | "mid" | "light";
    surface: "dark" | "mid" | "light";
    border: "subtle" | "accent" | "prominent";
    accent: "warm" | "cool" | "neutral";
    text: "high-contrast" | "medium" | "low-contrast";
  };

  // Typography treatments
  typography_roles: {
    display: "technical" | "elegant" | "bold" | "minimal";
    body: "readable" | "compact" | "spacious";
    mono: "prominent" | "subtle" | "none";
  };

  // Brand projection (Thoughtform tokens mapped from color_roles)
  brand_projection: {
    background: string; // CSS var like "var(--void)"
    surface: string;
    border: string;
    accent: string;
    text: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// BRAND PROJECTION LOGIC
// ═══════════════════════════════════════════════════════════════

function projectToBrandTokens(
  colorRoles: StyleParams["color_roles"]
): StyleParams["brand_projection"] {
  // Map semantic color roles to Thoughtform design tokens
  // Always uses --void, --dawn, --gold with opacity variants

  const backgroundMap: Record<string, string> = {
    dark: "var(--void)",
    mid: "var(--void-surface, rgba(10, 9, 8, 0.8))",
    light: "var(--dawn-08)",
  };

  const surfaceMap: Record<string, string> = {
    dark: "var(--void)",
    mid: "var(--dawn-08)",
    light: "var(--dawn-15)",
  };

  const borderMap: Record<string, string> = {
    subtle: "var(--dawn-15)",
    accent: "var(--gold-30)",
    prominent: "var(--gold)",
  };

  const accentMap: Record<string, string> = {
    warm: "var(--gold)",
    cool: "var(--dawn-70)",
    neutral: "var(--dawn-50)",
  };

  const textMap: Record<string, string> = {
    "high-contrast": "var(--dawn)",
    medium: "var(--dawn-70)",
    "low-contrast": "var(--dawn-50)",
  };

  return {
    background: backgroundMap[colorRoles.background] || "var(--void)",
    surface: surfaceMap[colorRoles.surface] || "var(--dawn-08)",
    border: borderMap[colorRoles.border] || "var(--dawn-15)",
    accent: accentMap[colorRoles.accent] || "var(--gold)",
    text: textMap[colorRoles.text] || "var(--dawn)",
  };
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR STYLE DERIVATION
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a design system analyst extracting interpretable style features from UI references.

Your task is to analyze a design reference and extract structured style parameters that can be:
1. Mixed with other references to create new styles
2. Procedurally varied to generate coherent alternatives
3. Applied to components in a brand-consistent way

Focus on TRANSFERABLE PATTERNS, not literal colors or specific implementations.

Respond ONLY with valid JSON matching this exact schema:

{
  "motifs": {
    "brackets": "none" | "corners" | "full" | "targeting",
    "reticles": "none" | "subtle" | "prominent",
    "tick_marks": "none" | "sparse" | "dense",
    "grids": "none" | "subtle" | "visible" | "prominent",
    "scanlines": "none" | "subtle" | "visible",
    "label_styles": "minimal" | "technical" | "ornate"
  },
  "geometry": {
    "sharpness": 0.0-1.0,
    "chamfer_prevalence": 0.0-1.0,
    "corner_language": "squared" | "chamfered" | "notched" | "bracketed",
    "line_weight": "hairline" | "light" | "medium" | "heavy"
  },
  "composition": {
    "density": 0.0-1.0,
    "spacing_rhythm": "tight" | "balanced" | "loose",
    "layering_depth": 0.0-1.0,
    "panel_hierarchy": "flat" | "subtle" | "pronounced"
  },
  "texture": {
    "noise": 0.0-1.0,
    "scanlines": 0.0-1.0,
    "glow": 0.0-1.0,
    "grain": 0.0-1.0
  },
  "color_roles": {
    "background": "dark" | "mid" | "light",
    "surface": "dark" | "mid" | "light",
    "border": "subtle" | "accent" | "prominent",
    "accent": "warm" | "cool" | "neutral",
    "text": "high-contrast" | "medium" | "low-contrast"
  },
  "typography_roles": {
    "display": "technical" | "elegant" | "bold" | "minimal",
    "body": "readable" | "compact" | "spacious",
    "mono": "prominent" | "subtle" | "none"
  }
}

IMPORTANT:
- Numeric values must be between 0.0 and 1.0
- Use the exact enum values provided
- Focus on the STRUCTURAL and RHYTHMIC qualities, not specific colors
- Consider what makes this design distinctive and transferable
- If a feature is not present, use "none" or 0.0 as appropriate`;

// ═══════════════════════════════════════════════════════════════
// MAIN ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════

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

    // ─── Load survey item ───
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // ─── Load annotations ───
    const annotations = (item.annotations || []) as AnnotationData[];

    // ─── Load segments ───
    const { data: segments } = await supabase
      .from("survey_segments")
      .select("id, ai_label, ai_description, label, area")
      .eq("survey_item_id", itemId)
      .order("area", { ascending: false })
      .limit(20);

    // ─── Compute source hash for cache invalidation ───
    const sourceData = JSON.stringify({
      briefing: item.briefing || "",
      description: item.description || "",
      notes: item.notes || "",
      analysis: item.analysis || {},
      annotations: annotations.map((a) => ({ note: a.note, caption: a.crop_caption })),
      segments: (segments || []).map((s) => ({
        label: s.ai_label || s.label,
        desc: s.ai_description,
      })),
    });
    const sourceHash = crypto.createHash("md5").update(sourceData).digest("hex");

    // ─── Check for existing signature (skip if not forcing and hash matches) ───
    if (!force) {
      const { data: existing } = await supabase
        .from("survey_style_signatures")
        .select("id, source_hash, style_params, generated_at")
        .eq("survey_item_id", itemId)
        .single();

      if (existing && existing.source_hash === sourceHash) {
        return NextResponse.json({
          item: { id: item.id, title: item.title },
          styleSignature: existing,
          cached: true,
        });
      }
    }

    // ─── Get signed URL for the image ───
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, 300);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to access image" }, { status: 500 });
    }

    // ─── Download and prepare image ───
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
        { error: `Image is too large to analyze (${mb}MB). Please upload a smaller image.` },
        { status: 413 }
      );
    }

    // ─── Build context from existing analysis ───
    const contextParts: string[] = [];

    if (item.briefing) {
      contextParts.push(`Implementation Briefing:\n${item.briefing}`);
    }

    if (item.description) {
      contextParts.push(`Visual Description:\n${item.description}`);
    }

    if (item.notes) {
      contextParts.push(`User Notes:\n${item.notes}`);
    }

    if (item.analysis && typeof item.analysis === "object") {
      const analysis = item.analysis as Record<string, unknown>;
      if (analysis.transferNotes) {
        contextParts.push(`Transfer Notes: ${analysis.transferNotes}`);
      }
    }

    // Include annotation notes and captions
    if (annotations.length > 0) {
      const annotationDetails = annotations
        .filter((a) => a.note || a.crop_caption)
        .map((a, i) => {
          const parts: string[] = [];
          if (a.note) parts.push(`Note: ${a.note}`);
          if (a.crop_caption) parts.push(`Visual: ${a.crop_caption}`);
          return `  ${i + 1}. ${parts.join(" | ")}`;
        })
        .join("\n");

      if (annotationDetails) {
        contextParts.push(`User Annotations:\n${annotationDetails}`);
      }
    }

    // Include segment labels
    if (segments && segments.length > 0) {
      const segmentLabels = (segments as SegmentData[])
        .filter((s) => s.ai_label || s.label)
        .map((s) => {
          const label = s.ai_label || s.label || "unlabeled";
          const desc = s.ai_description ? ` (${s.ai_description})` : "";
          return `  - ${label}${desc}`;
        })
        .join("\n");

      if (segmentLabels) {
        contextParts.push(`Detected UI Elements:\n${segmentLabels}`);
      }
    }

    const contextText =
      contextParts.length > 0
        ? `\n\nContext from prior analysis:\n${contextParts.join("\n\n")}`
        : "";

    // ─── Call Claude for style derivation ───
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
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
              text: `Analyze this UI reference and extract structured style parameters.${contextText}`,
            },
          ],
        },
      ],
    });

    // ─── Parse Claude response ───
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No response from Claude" }, { status: 500 });
    }

    let rawParams: Omit<StyleParams, "brand_projection">;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      rawParams = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse Claude response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse style parameters", raw: textContent.text },
        { status: 500 }
      );
    }

    // ─── Apply brand projection ───
    const styleParams: StyleParams = {
      ...rawParams,
      brand_projection: projectToBrandTokens(rawParams.color_roles),
    };

    // ─── Convert to style vector ───
    const styleVector = styleParamsToVector(styleParams);

    // ─── Persist to database ───
    const vectorStr = `[${styleVector.join(",")}]`;

    const { data: result, error: upsertError } = await supabase.rpc("upsert_style_signature", {
      p_survey_item_id: itemId,
      p_style_params: styleParams,
      p_style_vector: vectorStr,
      p_source_hash: sourceHash,
      p_model_version: "claude-sonnet-4-20250514",
    });

    if (upsertError) {
      console.error("Failed to save style signature:", upsertError);
      return NextResponse.json({ error: "Failed to save style signature" }, { status: 500 });
    }

    // ─── Fetch the saved signature ───
    const { data: savedSignature } = await supabase
      .from("survey_style_signatures")
      .select("*")
      .eq("survey_item_id", itemId)
      .single();

    return NextResponse.json({
      item: { id: item.id, title: item.title },
      styleSignature: savedSignature,
      styleParams,
      cached: false,
    });
  } catch (error) {
    console.error("POST /api/survey/style/derive error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
