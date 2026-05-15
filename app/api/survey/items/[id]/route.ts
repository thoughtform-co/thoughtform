// ═══════════════════════════════════════════════════════════════
// SURVEY ITEM BY ID API
// Fetch full data for a single item (includes large text fields)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized, getServerUser } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

interface AnnotationWithCrop {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  note?: string;
  created_at?: string;
  crop_path?: string;
  crop_url?: string;
  crop_mime?: string;
  crop_width?: number;
  crop_height?: number;
  crop_caption?: string;
}

// GET - Fetch full item data by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Get authenticated user
    const user = await getServerUser(request);
    if ((!user || !("id" in user) || !user.id) && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { id: itemId } = await params;

    // Fetch full item data including large text fields
    const { data: item, error } = await supabase
      .from("survey_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (error) {
      console.error("Error fetching item:", error);
      return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
    }

    // Generate signed URL for main image
    let imageUrl: string | undefined;
    if (item.image_path) {
      const { data: signedData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);
      imageUrl = signedData?.signedUrl;
    }

    // Inject signed URLs into annotations that have crops
    let annotationsWithUrls = item.annotations;
    if (item.annotations && Array.isArray(item.annotations)) {
      const annotations = item.annotations as AnnotationWithCrop[];

      // Generate signed URLs for annotation crops in parallel
      annotationsWithUrls = await Promise.all(
        annotations.map(async (annotation) => {
          if (annotation.crop_path) {
            const { data: cropSignedData } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(annotation.crop_path, SIGNED_URL_EXPIRY);
            return {
              ...annotation,
              crop_url: cropSignedData?.signedUrl,
            };
          }
          return annotation;
        })
      );
    }

    return NextResponse.json({
      item: {
        ...item,
        image_url: imageUrl,
        annotations: annotationsWithUrls,
      },
    });
  } catch (error) {
    console.error("GET /api/survey/items/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
