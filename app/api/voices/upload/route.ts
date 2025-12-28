/**
 * Voice Media Upload API Route
 *
 * POST /api/voices/upload - Upload video/image for a voice
 * Handles file upload to Supabase Storage with thumbnail extraction for videos
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "voices-media";

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// NOTE: No file size limits enforced here - Supabase Storage handles its own limits
// For large files, prefer direct client-side uploads to Supabase (bypasses Vercel limits)

// Configure route for larger uploads
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large uploads

/**
 * POST /api/voices/upload
 * Upload media file for a voice (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      console.log("[voices/upload] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("fileType") as string | null; // 'video' or 'thumbnail'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
    // No file size limits - Supabase handles its own limits

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const prefix = fileType === "thumbnail" ? "thumb_" : "";
    const filePath = `uploads/${timestamp}_${prefix}${sanitizedName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error("[voices/upload] Storage error:", error);
      return NextResponse.json(
        { error: "Failed to upload file: " + error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
      mimeType: file.type,
      size: file.size,
      isVideo,
    });
  } catch (error) {
    console.error("[voices/upload] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/voices/upload
 * Remove uploaded media
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check for admin authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    // Get file path from request body
    const { path } = await request.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "File path required" }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    // Delete from storage
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("[voices/upload] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[voices/upload] Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
