// ═══════════════════════════════════════════════════════════════
// SURVEY SEGMENTS GENERATE API
// Call SAM service and store segments in database
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const SEGMENTER_URL = process.env.SEGMENTER_URL || "http://localhost:8001";

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

    // Call the SAM segmenter service
    let samResponse: SAMResponse;
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
          error: "Segmentation service unavailable. Ensure the SAM service is running.",
          serviceUrl: SEGMENTER_URL,
        },
        { status: 503 }
      );
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
