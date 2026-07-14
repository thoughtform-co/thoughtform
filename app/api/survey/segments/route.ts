// ═══════════════════════════════════════════════════════════════
// SURVEY SEGMENTS API
// List and update segments for a survey item
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

// GET - List segments for an item
export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Fetch segments
    const { data: segments, error } = await supabase
      .from("survey_segments")
      .select("*")
      .eq("survey_item_id", itemId)
      .order("segment_index", { ascending: true });

    if (error) {
      console.error("Failed to fetch segments:", error);
      return NextResponse.json({ error: "Failed to fetch segments" }, { status: 500 });
    }

    return NextResponse.json({
      itemId,
      segments: segments || [],
      count: segments?.length || 0,
    });
  } catch (error) {
    console.error("GET /api/survey/segments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a segment (label, visibility, etc.)
export async function PATCH(request: NextRequest) {
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
    const { segmentId, updates } = body;

    if (!segmentId) {
      return NextResponse.json({ error: "Missing segmentId" }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = ["label", "is_visible", "is_selected"];
    const sanitizedUpdates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in updates) {
        sanitizedUpdates[field] = updates[field];
        if (field === "label") {
          sanitizedUpdates.label_updated_at = new Date().toISOString();
        }
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const { data: segment, error } = await supabase
      .from("survey_segments")
      .update(sanitizedUpdates)
      .eq("id", segmentId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update segment:", error);
      return NextResponse.json({ error: "Failed to update segment" }, { status: 500 });
    }

    return NextResponse.json({ segment });
  } catch (error) {
    console.error("PATCH /api/survey/segments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a specific segment
export async function DELETE(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const segmentId = searchParams.get("segmentId");

    if (!segmentId) {
      return NextResponse.json({ error: "Missing segmentId" }, { status: 400 });
    }

    const { error } = await supabase.from("survey_segments").delete().eq("id", segmentId);

    if (error) {
      console.error("Failed to delete segment:", error);
      return NextResponse.json({ error: "Failed to delete segment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/survey/segments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
