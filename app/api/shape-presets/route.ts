import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";

// Ensure this route is always dynamic (never statically cached)
export const dynamic = "force-dynamic";

// ═══════════════════════════════════════════════════════════════════
// SHAPE PRESETS API - CRUD for shape lab presets
// Admin-only endpoint for managing shape configurations
// ═══════════════════════════════════════════════════════════════════

// Initialize Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

// GET - Fetch all presets
export async function GET() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const { data, error } = await supabase
      .from("shape_presets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch shape presets:", error);
      return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
    }

    // Transform snake_case to camelCase for frontend
    const presets = (data || []).map((preset) => ({
      id: preset.id,
      name: preset.name,
      shapeId: preset.shape_id,
      seed: preset.seed,
      pointCount: preset.point_count,
      density: preset.density ?? 1.0,
      particleSize: preset.particle_size ?? 1.0,
      category: preset.category,
      createdAt: preset.created_at,
      updatedAt: preset.updated_at,
    }));

    return NextResponse.json({ presets }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Shape presets GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// POST - Create a new preset
export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, shapeId, seed, pointCount, density, particleSize, category } = body;

    // Validate required fields
    if (!name || !shapeId || seed === undefined || pointCount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, shapeId, seed, pointCount" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shape_presets")
      .insert({
        name,
        shape_id: shapeId,
        seed,
        point_count: pointCount,
        density: density ?? 1.0,
        particle_size: particleSize ?? 1.0,
        category: category || "custom",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create shape preset:", error);
      return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
    }

    // Transform to camelCase for frontend
    const preset = {
      id: data.id,
      name: data.name,
      shapeId: data.shape_id,
      seed: data.seed,
      pointCount: data.point_count,
      density: data.density ?? 1.0,
      particleSize: data.particle_size ?? 1.0,
      category: data.category,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error("Shape presets POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a preset by ID
export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing preset ID" }, { status: 400 });
    }

    const { error } = await supabase.from("shape_presets").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete shape preset:", error);
      return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shape presets DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update an existing preset
export async function PUT(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, name, shapeId, seed, pointCount, density, particleSize, category } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing preset ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (shapeId !== undefined) updateData.shape_id = shapeId;
    if (seed !== undefined) updateData.seed = seed;
    if (pointCount !== undefined) updateData.point_count = pointCount;
    if (density !== undefined) updateData.density = density;
    if (particleSize !== undefined) updateData.particle_size = particleSize;
    if (category !== undefined) updateData.category = category;

    const { data, error } = await supabase
      .from("shape_presets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update shape preset:", error);
      return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
    }

    // Transform to camelCase for frontend
    const preset = {
      id: data.id,
      name: data.name,
      shapeId: data.shape_id,
      seed: data.seed,
      pointCount: data.point_count,
      density: data.density ?? 1.0,
      particleSize: data.particle_size ?? 1.0,
      category: data.category,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ preset });
  } catch (error) {
    console.error("Shape presets PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
