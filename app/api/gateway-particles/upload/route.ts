/**
 * Gateway Particles Upload API Route
 *
 * POST /api/gateway-particles/upload - Upload baked TFPC file
 * Handles file upload to Supabase Storage for gateway particle point clouds
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

const BUCKET_NAME = "gateway-particles";

// Allowed file extensions
const ALLOWED_EXTENSIONS = [".tfpc"];

// Configure route for uploads
export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutes

/**
 * POST /api/gateway-particles/upload
 * Upload baked TFPC file (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      console.log("[gateway-particles/upload] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate TFPC magic bytes
    const arrayBuffer = await file.arrayBuffer();
    const view = new DataView(arrayBuffer);
    const magic = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );
    if (magic !== "TFPC") {
      return NextResponse.json(
        { error: "Invalid TFPC file format - missing magic header" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = (name || "gateway").replace(/[^a-zA-Z0-9-_]/g, "_");
    const filePath = `baked/${timestamp}_${safeName}.tfpc`;

    // Convert to buffer
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from(BUCKET_NAME).upload(filePath, buffer, {
      contentType: "application/octet-stream",
      upsert: false,
    });

    if (error) {
      console.error("[gateway-particles/upload] Storage error:", error);
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
      size: file.size,
    });
  } catch (error) {
    console.error("[gateway-particles/upload] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/gateway-particles/upload
 * Remove uploaded TFPC file
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
      console.error("[gateway-particles/upload] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[gateway-particles/upload] Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
