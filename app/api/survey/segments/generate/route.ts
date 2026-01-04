// ═══════════════════════════════════════════════════════════════
// SURVEY SEGMENTS GENERATE API
// Call SAM service and store segments in database
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import Replicate from "replicate";

const BUCKET_NAME = "survey-media";
const SEGMENTER_URL = process.env.SEGMENTER_URL || "http://localhost:8001";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

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
        // Run SAM-2 on Replicate
        // Version hash from https://replicate.com/meta/sam-2/api
        const output = (await replicate.run(
          "meta/sam-2:fe97b453a6455861e3bac769b441ca1f1086119da7466dbb65cf1eecfd00dc83",
          {
            input: {
              image: signedData.signedUrl,
            },
          }
        )) as any;

        console.log("Replicate output keys:", Object.keys(output || {}));

        // Replicate's SAM-2 output format can vary. It usually includes masks or segments.
        const rawSegments =
          output?.masks || output?.segments || output?.output?.masks || output?.output?.segments;

        if (!rawSegments || !Array.isArray(rawSegments)) {
          console.error(
            "Replicate returned unexpected format:",
            JSON.stringify(output).substring(0, 500)
          );
          throw new Error("Replicate returned no valid segments or masks");
        }

        const segments: SAMSegment[] = rawSegments.map((mask: any, index: number) => {
          // Bbox in Replicate is usually [x, y, w, h] or [y1, x1, y2, x2]
          let x = 0,
            y = 0,
            w = 0,
            h = 0;

          if (Array.isArray(mask.bbox)) {
            if (mask.bbox.length === 4) {
              [x, y, w, h] = mask.bbox;
            }
          } else if (mask.box_2d) {
            // Some models use box_2d
            [y, x, h, w] = mask.box_2d; // Some models use [y1, x1, y2, x2]
            w = w - x;
            h = h - y;
          }

          return {
            id: index,
            area: mask.area || w * h,
            bbox: [x, y, w, h],
            predicted_iou: mask.predicted_iou || 0.95,
            stability_score: mask.stability_score || 0.95,
            crop_bbox: [x, y, w, h], // Simple crop for now
          };
        });

        samResponse = {
          success: true,
          image_width: item.image_width || 0,
          image_height: item.image_height || 0,
          segment_count: segments.length,
          segments,
          model_used: "sam-2 (replicate)",
        };
      } catch (replicateError) {
        console.error("Replicate SAM-2 error:", replicateError);
        return NextResponse.json(
          {
            error: `Replicate segmentation failed: ${replicateError instanceof Error ? replicateError.message : "Unknown error"}`,
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
