// ═══════════════════════════════════════════════════════════════
// SURVEY ITEM BY ID API
// Fetch full data for a single item (includes large text fields)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized, getServerUser } from "@/lib/auth-server";

const BUCKET_NAME = "survey-media";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// GET - Fetch full item data by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const itemId = params.id;

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

    // Generate signed URL for image
    if (item.image_path) {
      const { data: signedData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(item.image_path, SIGNED_URL_EXPIRY);
      return NextResponse.json({
        item: { ...item, image_url: signedData?.signedUrl },
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("GET /api/survey/items/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
