// ═══════════════════════════════════════════════════════════════
// SURVEY SEGMENTS LABEL API
// Use Claude to generate concise labels for SAM-generated segments
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { clamp } from "@/lib/math";

const BUCKET_NAME = "survey-media";

type SegmentRow = {
  id: string;
  survey_item_id: string;
  segment_index: number;
  bbox_x: number;
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  area: number;
  label: string | null;
  ai_label: string | null;
  ai_description: string | null;
};

interface LabelRequestBody {
  itemId: string;
  segmentIds?: string[];
  maxSegments?: number;
  force?: boolean;
}

// `clamp` now comes from `@/lib/math` (Phase-5 consolidation).

function extractJson(text: string): unknown {
  // Handle possible ```json fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced ? fenced[1] : text).trim();

  // Fast path
  try {
    return JSON.parse(raw);
  } catch {
    // Fallback: attempt to locate the first JSON object in the string
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const slice = raw.slice(first, last + 1);
      return JSON.parse(slice);
    }
    throw new Error("Failed to parse JSON");
  }
}

function sanitizeLabel(label: unknown): string {
  if (typeof label !== "string") return "unknown";
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.,"'`]/g, "");

  if (!cleaned) return "unknown";
  return cleaned.slice(0, 48);
}

function sanitizeDescription(desc: unknown): string | null {
  if (typeof desc !== "string") return null;
  const cleaned = desc.trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, 140) : null;
}

const SYSTEM_PROMPT = `You are a UI element labeler.

Your job: assign a short, clear label to each cropped UI segment from a larger interface screenshot.

Rules:
- ai_label must be 1–4 words, lowercase, no punctuation, no leading articles ("a", "an", "the").
- Prefer specific UI nouns: "profile icon", "close button", "search input", "nav tab", "status badge".
- If uncertain, use "unknown".
- ai_description is optional: <= 12 words, concise, what it is + role.

Return ONLY valid JSON in this exact shape:
{
  "results": [
    { "id": "segment-id", "ai_label": "label", "ai_description": "optional description or null" }
  ]
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

    const body = (await request.json()) as LabelRequestBody;
    const { itemId, segmentIds, maxSegments = 60, force = false } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Fetch item context
    const { data: item, error: itemError } = await supabase
      .from("survey_items")
      .select("id, title, notes, tags, analysis, description, image_path, image_mime")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Load segments to label (default: those missing ai_label)
    let segQuery = supabase
      .from("survey_segments")
      .select(
        "id, survey_item_id, segment_index, bbox_x, bbox_y, bbox_width, bbox_height, area, label, ai_label, ai_description"
      )
      .eq("survey_item_id", itemId)
      .order("area", { ascending: false });

    if (!force) {
      segQuery = segQuery.is("ai_label", null);
    }
    if (Array.isArray(segmentIds) && segmentIds.length > 0) {
      segQuery = segQuery.in("id", segmentIds);
    }
    segQuery = segQuery.limit(Math.max(1, Math.min(60, maxSegments)));

    const { data: segmentsToLabel, error: segError } = await segQuery;

    if (segError) {
      console.error("Failed to fetch segments for labeling:", segError);
      return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
    }

    if (!segmentsToLabel || segmentsToLabel.length === 0) {
      // Nothing to do; return current segments
      const { data: existing, error: existingError } = await supabase
        .from("survey_segments")
        .select("*")
        .eq("survey_item_id", itemId)
        .order("segment_index", { ascending: true });

      if (existingError) {
        return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        labeled: 0,
        segments: existing || [],
      });
    }

    // Signed URL for source image (valid for 5 minutes)
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, 300);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to access image" }, { status: 500 });
    }

    const imageRes = await fetch(signedData.signedUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }

    const imageArrayBuffer = await imageRes.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    const metadata = await sharp(imageBuffer).metadata();
    const imgW = typeof metadata.width === "number" ? metadata.width : null;
    const imgH = typeof metadata.height === "number" ? metadata.height : null;
    if (!imgW || !imgH) {
      return NextResponse.json({ error: "Failed to determine image dimensions" }, { status: 500 });
    }

    // Build context text (use existing analysis/description if present)
    const contextParts: string[] = [];
    if (item.title) contextParts.push(`Title: ${item.title}`);
    if (item.description) contextParts.push(`Visual description:\n${item.description}`);
    if (item.analysis && typeof item.analysis === "object") {
      const analysis = item.analysis as Record<string, unknown>;
      if (analysis.summary) contextParts.push(`AI summary: ${String(analysis.summary)}`);
      if (analysis.transferNotes)
        contextParts.push(`Transfer notes: ${String(analysis.transferNotes)}`);
      if (analysis.tags && Array.isArray(analysis.tags)) {
        contextParts.push(`AI tags: ${(analysis.tags as string[]).join(", ")}`);
      }
    }
    if (item.notes) contextParts.push(`User notes:\n${item.notes}`);
    if (Array.isArray(item.tags) && item.tags.length > 0) {
      contextParts.push(`User tags: ${item.tags.join(", ")}`);
    }
    const contextText = contextParts.join("\n\n");

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Batch crops into a few Claude calls to avoid payload limits.
    const BATCH_SIZE = 6;
    const nowIso = new Date().toISOString();
    let labeledCount = 0;

    for (let i = 0; i < segmentsToLabel.length; i += BATCH_SIZE) {
      const batch = segmentsToLabel.slice(i, i + BATCH_SIZE) as SegmentRow[];

      const messageContent: Anthropic.MessageParam["content"] = [
        {
          type: "text",
          text: `Context for these segments (optional, may help disambiguate icons):\n${contextText || "(no extra context)"}`,
        },
      ];

      for (const seg of batch) {
        // Add padding so icons get a bit of surrounding context
        const pad = clamp(Math.round(Math.min(seg.bbox_width, seg.bbox_height) * 0.12), 6, 48);
        const left = clamp(seg.bbox_x - pad, 0, imgW - 1);
        const top = clamp(seg.bbox_y - pad, 0, imgH - 1);
        const right = clamp(seg.bbox_x + seg.bbox_width + pad, 1, imgW);
        const bottom = clamp(seg.bbox_y + seg.bbox_height + pad, 1, imgH);
        const width = clamp(right - left, 1, imgW - left);
        const height = clamp(bottom - top, 1, imgH - top);

        const crop = await sharp(imageBuffer)
          .extract({ left, top, width, height })
          .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toBuffer();

        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: crop.toString("base64"),
          },
        });
        messageContent.push({
          type: "text",
          text: `Segment id: ${seg.id}\nBBox(px): [${seg.bbox_x}, ${seg.bbox_y}, ${seg.bbox_width}, ${seg.bbox_height}]\nArea(px²): ${seg.area}\nUser label (if any): ${seg.label ?? "(none)"}\nReturn a concise ai_label for this crop.`,
        });
      }

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: messageContent }],
        system: SYSTEM_PROMPT,
      });

      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      let parsed: unknown;
      try {
        parsed = extractJson(textContent.text);
      } catch (e) {
        console.error("Failed to parse segment labels:", textContent.text);
        throw e instanceof Error ? e : new Error("Failed to parse segment labels");
      }

      const results = (parsed as { results?: unknown })?.results;
      if (!Array.isArray(results)) {
        console.error("Unexpected label response shape:", parsed);
        throw new Error("Unexpected Claude response shape");
      }

      type LabelResult = {
        id?: unknown;
        ai_label?: unknown;
        ai_description?: unknown;
      };
      const updates = (results as LabelResult[])
        .filter((r): r is LabelResult & { id: string } => !!r && typeof r.id === "string")
        .map((r) => ({
          id: r.id,
          ai_label: sanitizeLabel(r.ai_label),
          ai_description: sanitizeDescription(r.ai_description),
          ai_labeled_at: nowIso,
        }));

      if (updates.length > 0) {
        // Use UPDATE (not UPSERT). Postgres checks NOT NULL constraints before conflict resolution,
        // so upserting partial rows can fail even when the row exists.
        const updateResults = await Promise.all(
          updates.map((u) =>
            supabase
              .from("survey_segments")
              .update({
                ai_label: u.ai_label,
                ai_description: u.ai_description,
                ai_labeled_at: u.ai_labeled_at,
              })
              .eq("id", u.id)
              .eq("survey_item_id", itemId)
          )
        );

        const firstError = updateResults.find((r) => r.error)?.error;
        if (firstError) {
          console.error("Failed to save segment labels:", firstError);
          throw new Error("Failed to save segment labels");
        }
        labeledCount += updates.length;
      }
    }

    // Return updated segments for the item
    const { data: updatedSegments, error: updatedError } = await supabase
      .from("survey_segments")
      .select("*")
      .eq("survey_item_id", itemId)
      .order("segment_index", { ascending: true });

    if (updatedError) {
      return NextResponse.json({ error: "Failed to fetch updated segments" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      labeled: labeledCount,
      segments: updatedSegments || [],
    });
  } catch (error) {
    console.error("POST /api/survey/segments/label error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
