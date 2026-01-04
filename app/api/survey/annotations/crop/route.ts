// ═══════════════════════════════════════════════════════════════
// ANNOTATION CROP API
// Generate and store cropped screenshots of annotation regions
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";
import sharp from "sharp";

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

    const body = await request.json();
    const { itemId, annotationId, bounds } = body;

    if (!itemId || !annotationId) {
      return NextResponse.json({ error: "Missing itemId or annotationId" }, { status: 400 });
    }

    // Fetch the survey item
    const { data: item, error: fetchError } = await supabase
      .from("survey_items")
      .select("image_path, image_mime, image_width, image_height, annotations")
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

    // Use provided bounds or the annotation's current bounds
    const cropBounds = bounds || {
      x: annotation.x,
      y: annotation.y,
      width: annotation.width,
      height: annotation.height,
    };

    // Get signed URL for the source image
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(item.image_path, 60);

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: "Failed to access source image" }, { status: 500 });
    }

    // Download the source image
    const imageResponse = await fetch(signedData.signedUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch source image" }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image metadata to calculate pixel coordinates
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: "Could not read image dimensions" }, { status: 500 });
    }

    // Convert percentage bounds to pixel coordinates
    const pixelX = Math.round((cropBounds.x / 100) * metadata.width);
    const pixelY = Math.round((cropBounds.y / 100) * metadata.height);
    const pixelWidth = Math.round((cropBounds.width / 100) * metadata.width);
    const pixelHeight = Math.round((cropBounds.height / 100) * metadata.height);

    // Ensure bounds are within image
    const safeX = Math.max(0, Math.min(pixelX, metadata.width - 1));
    const safeY = Math.max(0, Math.min(pixelY, metadata.height - 1));
    const safeWidth = Math.min(pixelWidth, metadata.width - safeX);
    const safeHeight = Math.min(pixelHeight, metadata.height - safeY);

    if (safeWidth < 1 || safeHeight < 1) {
      return NextResponse.json({ error: "Invalid crop dimensions" }, { status: 400 });
    }

    // Crop the image
    const croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: safeX,
        top: safeY,
        width: safeWidth,
        height: safeHeight,
      })
      .png()
      .toBuffer();

    // Determine the crop path
    const cropPath = `annotations/${itemId}/${annotationId}.png`;

    // Upload the cropped image
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(cropPath, croppedBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload crop:", uploadError);
      return NextResponse.json({ error: "Failed to upload crop" }, { status: 500 });
    }

    // Update the annotation with crop metadata
    const updatedAnnotations = [...annotations];
    updatedAnnotations[annotationIndex] = {
      ...annotation,
      crop_path: cropPath,
      crop_mime: "image/png",
      crop_width: safeWidth,
      crop_height: safeHeight,
    };

    // Save updated annotations back to the item
    const { error: updateError } = await supabase
      .from("survey_items")
      .update({ annotations: updatedAnnotations })
      .eq("id", itemId);

    if (updateError) {
      console.error("Failed to update annotations:", updateError);
      return NextResponse.json({ error: "Failed to update annotations" }, { status: 500 });
    }

    // Get signed URL for the crop
    const { data: cropSignedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(cropPath, 3600);

    return NextResponse.json({
      success: true,
      annotation: {
        ...updatedAnnotations[annotationIndex],
        crop_url: cropSignedData?.signedUrl,
      },
    });
  } catch (error) {
    console.error("POST /api/survey/annotations/crop error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 30;
