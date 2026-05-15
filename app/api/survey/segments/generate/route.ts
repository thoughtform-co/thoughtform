// ═══════════════════════════════════════════════════════════════
// SURVEY SEGMENTS GENERATE API
// Call SAM service and store segments in database
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Replicate from "replicate";
import sharp from "sharp";

const BUCKET_NAME = "survey-media";
const SEGMENTER_URL = process.env.SEGMENTER_URL || "http://localhost:8001";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
// Allow overriding the model/version via env for easy hotfixes without redeploy.
// Default version copied from Replicate's API page (Node.js example).
const REPLICATE_SAM2_MODEL =
  process.env.REPLICATE_SAM2_MODEL ||
  "meta/sam-2:fe97b453a6455861e3bac769b441ca1f1086110da7466dbb65cf1eecfd60dc83";

// Initialize Replicate if token is available
const replicate = REPLICATE_API_TOKEN ? new Replicate({ auth: REPLICATE_API_TOKEN }) : null;

interface SAMSegment {
  id: number;
  area: number;
  bbox: number[]; // [x, y, width, height]
  predicted_iou: number;
  stability_score: number;
  crop_bbox: number[]; // [x, y, width, height]
  mask_png_base64?: string;
}

interface SAMResponse {
  success: boolean;
  image_width: number;
  image_height: number;
  segment_count: number;
  segments: SAMSegment[];
  model_used: string;
}

interface GenerateRequest {
  itemId: string;
  pointsPerSide?: number;
  predIouThresh?: number;
  stabilityScoreThresh?: number;
  minMaskRegionArea?: number;
  maxSegments?: number;
}

type MaskStats = {
  width: number;
  height: number;
  area: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
};

async function computeMaskStatsFromUrl(maskUrl: string): Promise<MaskStats | null> {
  const res = await fetch(maskUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch mask (${res.status})`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let area = 0;

  // Heuristic: treat "on-mask" pixels as bright pixels (white) with any alpha.
  // This works for both (a) white-on-black masks and (b) white-on-transparent masks.
  const ON_THRESHOLD = 127;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      const a = data[idx + 3] ?? 0;

      if (a > 0 && (r + g + b) / 3 > ON_THRESHOLD) {
        area++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (area === 0 || maxX < minX || maxY < minY) {
    return null;
  }

  const bbox: [number, number, number, number] = [minX, minY, maxX - minX + 1, maxY - minY + 1];
  return { width, height, area, bbox };
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = (await request.json()) as GenerateRequest;
    const {
      itemId,
      pointsPerSide = 32,
      predIouThresh = 0.88,
      stabilityScoreThresh = 0.95,
      minMaskRegionArea = 100,
      maxSegments = 50,
    } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Fetch the survey item
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("id, image_path, image_width, image_height")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Create signed URL for the image (valid for 5 minutes)
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, 300);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
    }

    let samResponse: SAMResponse;

    // OPTION 1: Use Replicate (Online)
    if (replicate) {
      console.log("Using Replicate for segmentation...");
      try {
        // Run SAM-2 on Replicate.
        // NOTE: This model returns mask image URLs (combined_mask, individual_masks), not bbox objects.
        const output = (await replicate.run(
          REPLICATE_SAM2_MODEL as `${string}/${string}` | `${string}/${string}:${string}`,
          {
            input: {
              image: signedData.signedUrl,
              use_m2m: true,
              points_per_side: pointsPerSide,
              pred_iou_thresh: predIouThresh,
              stability_score_thresh: stabilityScoreThresh,
            },
          }
        )) as { individual_masks?: unknown } & Record<string, unknown>;

        console.log("Replicate output keys:", Object.keys(output || {}));

        const rawMasks = output?.individual_masks;
        if (!rawMasks || !Array.isArray(rawMasks) || rawMasks.length === 0) {
          console.error(
            "Replicate returned unexpected format:",
            JSON.stringify(output).substring(0, 500)
          );
          throw new Error("Replicate returned no individual_masks");
        }

        // Compute bbox + area from each returned mask image.
        // To avoid huge CPU/network costs, we process a capped number of masks then take the top areas.
        const maxMasksToProcess = Math.min(rawMasks.length, Math.max(maxSegments * 4, maxSegments));
        const maskUrls: string[] = rawMasks.slice(0, maxMasksToProcess);
        const computed: Array<{ stats: MaskStats; maskUrl: string }> = [];

        // Small concurrency to keep memory stable.
        const CONCURRENCY = 3;
        for (let i = 0; i < maskUrls.length; i += CONCURRENCY) {
          const batch = maskUrls.slice(i, i + CONCURRENCY);
          const batchResults = await Promise.all(
            batch.map(async (maskUrl) => {
              const stats = await computeMaskStatsFromUrl(maskUrl);
              return stats ? { stats, maskUrl } : null;
            })
          );
          for (const r of batchResults) {
            if (r) computed.push(r);
          }
        }

        if (computed.length === 0) {
          throw new Error("Replicate returned masks, but none contained any on-pixels");
        }

        computed.sort((a, b) => b.stats.area - a.stats.area);
        const top = computed.slice(0, maxSegments);

        const segments: SAMSegment[] = top.map(({ stats }, index) => ({
          id: index,
          area: stats.area,
          bbox: [...stats.bbox],
          predicted_iou: predIouThresh,
          stability_score: stabilityScoreThresh,
          crop_bbox: [...stats.bbox], // Simple crop for now
        }));

        samResponse = {
          success: true,
          image_width: item.image_width || top[0]!.stats.width || 0,
          image_height: item.image_height || top[0]!.stats.height || 0,
          segment_count: segments.length,
          segments,
          model_used: `sam-2 (replicate)`,
        };
      } catch (replicateError) {
        // IMPORTANT: do not log the full Replicate error object because it can contain the auth header.
        const message =
          replicateError instanceof Error ? replicateError.message : String(replicateError);
        console.error("Replicate SAM-2 error:", message);
        return NextResponse.json(
          {
            error: `Replicate segmentation failed: ${message}`,
            hint:
              message.includes("Invalid version") || message.includes("not permitted")
                ? "Check REPLICATE_SAM2_MODEL (or use the default from Replicate's API page)."
                : undefined,
          },
          { status: 502 }
        );
      }
    }
    // OPTION 2: Use Local Service (Docker)
    else {
      console.log("Using local service for segmentation...");
      try {
        const segmentResponse = await fetch(`${SEGMENTER_URL}/segment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: signedData.signedUrl,
            points_per_side: pointsPerSide,
            pred_iou_thresh: predIouThresh,
            stability_score_thresh: stabilityScoreThresh,
            min_mask_region_area: minMaskRegionArea,
          }),
        });

        if (!segmentResponse.ok) {
          const errorData = await segmentResponse.json().catch(() => ({}));
          console.error("SAM service error:", errorData);
          return NextResponse.json(
            { error: `Segmentation failed: ${errorData.detail || "Unknown error"}` },
            { status: 502 }
          );
        }

        samResponse = await segmentResponse.json();
      } catch (fetchError) {
        console.error("Failed to reach SAM service:", fetchError);
        return NextResponse.json(
          {
            error:
              "Segmentation service unavailable. Ensure the SAM service is running or provide REPLICATE_API_TOKEN.",
            serviceUrl: SEGMENTER_URL,
          },
          { status: 503 }
        );
      }
    }

    if (!samResponse.success || !samResponse.segments) {
      return NextResponse.json({ error: "Segmentation returned no results" }, { status: 500 });
    }

    // Delete existing segments for this item
    const { error: deleteError } = await supabase
      .from("survey_segments")
      .delete()
      .eq("survey_item_id", itemId);

    if (deleteError) {
      console.warn("Failed to delete existing segments:", deleteError);
      // Continue anyway - might be first time
    }

    // Limit segments and prepare for insert
    const segmentsToInsert = samResponse.segments.slice(0, maxSegments).map((seg, index) => ({
      survey_item_id: itemId,
      segment_index: index,
      bbox_x: seg.bbox[0],
      bbox_y: seg.bbox[1],
      bbox_width: seg.bbox[2],
      bbox_height: seg.bbox[3],
      crop_x: seg.crop_bbox[0],
      crop_y: seg.crop_bbox[1],
      crop_width: seg.crop_bbox[2],
      crop_height: seg.crop_bbox[3],
      area: seg.area,
      predicted_iou: seg.predicted_iou,
      stability_score: seg.stability_score,
      is_visible: true,
      is_selected: false,
    }));

    // Insert segments
    const { data: insertedSegments, error: insertError } = await supabase
      .from("survey_segments")
      .insert(segmentsToInsert)
      .select();

    if (insertError) {
      console.error("Failed to insert segments:", insertError);
      return NextResponse.json({ error: "Failed to save segments" }, { status: 500 });
    }

    // Update item to mark as having segments
    await supabase.from("survey_items").update({ has_segments: true }).eq("id", itemId);

    return NextResponse.json({
      success: true,
      itemId,
      imageSize: {
        width: samResponse.image_width,
        height: samResponse.image_height,
      },
      segmentCount: insertedSegments?.length || 0,
      segments: insertedSegments,
      model: samResponse.model_used,
    });
  } catch (error) {
    console.error("POST /api/survey/segments/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 120;
