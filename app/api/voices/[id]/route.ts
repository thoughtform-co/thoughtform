/**
 * Individual Voice API Route
 *
 * GET    /api/voices/[id] - Get a single voice
 * PUT    /api/voices/[id] - Update a voice (admin only)
 * DELETE /api/voices/[id] - Delete a voice (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/voices/[id]
 * Get a single voice by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("manifesto_voices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Voice not found" }, { status: 404 });
      }
      console.error("[voices] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ voice: data });
  } catch (error) {
    console.error("[voices] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch voice" }, { status: 500 });
  }
}

/**
 * PUT /api/voices/[id]
 * Update an existing voice (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check for admin authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // Only include fields that were provided
    const allowedFields = [
      "title",
      "description",
      "full_text",
      "role",
      "type",
      "video_url",
      "thumbnail_url",
      "order_index",
      "is_active",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("manifesto_voices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Voice not found" }, { status: 404 });
      }
      console.error("[voices] Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, voice: data });
  } catch (error) {
    console.error("[voices] PUT error:", error);
    return NextResponse.json({ error: "Failed to update voice" }, { status: 500 });
  }
}

/**
 * DELETE /api/voices/[id]
 * Delete a voice (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check for admin authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { error } = await supabase.from("manifesto_voices").delete().eq("id", id);

    if (error) {
      console.error("[voices] Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[voices] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete voice" }, { status: 500 });
  }
}
