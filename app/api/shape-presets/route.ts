import { NextRequest } from "next/server";

import {
  jsonError,
  jsonSuccess,
  requireAdmin,
  requireAdminAndServiceClient,
} from "@/lib/api/guards";

// Ensure this route is always dynamic (never statically cached)
export const dynamic = "force-dynamic";

// ═══════════════════════════════════════════════════════════════════
// SHAPE PRESETS API — admin-only CRUD for Orrery presets.
//
// 2026-06-16 hardening (Homepage Refactor And Hardening Plan, Phase
// 2): every method now goes through `requireAdmin` /
// `requireAdminAndServiceClient`. The previous implementation dropped
// the auth check entirely and fell back to the `NEXT_PUBLIC_SUPABASE_
// ANON_KEY` when the service role key was missing, which meant any
// internet caller could mutate the presets table whenever the env
// fell back. The route now ALWAYS requires the allowlisted admin and
// ALWAYS uses the service-role client (or 503s when it's unavailable).
// ═══════════════════════════════════════════════════════════════════

interface ShapePresetRow {
  id: string;
  name: string;
  shape_id: string;
  seed: number;
  point_count: number;
  density: number | null;
  particle_size: number | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

function rowToPreset(row: ShapePresetRow) {
  return {
    id: row.id,
    name: row.name,
    shapeId: row.shape_id,
    seed: row.seed,
    pointCount: row.point_count,
    density: row.density ?? 1.0,
    particleSize: row.particle_size ?? 1.0,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET — list presets (admin only)
export async function GET(request: NextRequest) {
  const guard = await requireAdminAndServiceClient(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  try {
    const { data, error } = await supabase
      .from("shape_presets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch shape presets:", error);
      return jsonError("Failed to fetch presets");
    }

    return jsonSuccess({ presets: (data ?? []).map(rowToPreset) });
  } catch (error) {
    console.error("Shape presets GET error:", error);
    return jsonError("Internal server error");
  }
}

// POST — create a new preset (admin only)
export async function POST(request: NextRequest) {
  const guard = await requireAdminAndServiceClient(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  try {
    const body = await request.json();
    const { name, shapeId, seed, pointCount, density, particleSize, category } = body ?? {};

    if (!name || !shapeId || seed === undefined || pointCount === undefined) {
      return jsonError("Missing required fields: name, shapeId, seed, pointCount", 400);
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
      return jsonError("Failed to create preset");
    }

    return jsonSuccess({ preset: rowToPreset(data as ShapePresetRow) }, { status: 201 });
  } catch (error) {
    console.error("Shape presets POST error:", error);
    return jsonError("Internal server error");
  }
}

// DELETE — delete a preset (admin only)
export async function DELETE(request: NextRequest) {
  // Re-check admin BEFORE we resolve the service client, so an
  // unauthorized DELETE never spins up a service-role connection.
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const guard = await requireAdminAndServiceClient(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Missing preset ID", 400);

    const { error } = await supabase.from("shape_presets").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete shape preset:", error);
      return jsonError("Failed to delete preset");
    }

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("Shape presets DELETE error:", error);
    return jsonError("Internal server error");
  }
}

// PUT — update a preset (admin only)
export async function PUT(request: NextRequest) {
  const guard = await requireAdminAndServiceClient(request);
  if (!guard.ok) return guard.response;
  const { supabase } = guard;

  try {
    const body = await request.json();
    const { id, name, shapeId, seed, pointCount, density, particleSize, category } = body ?? {};

    if (!id) return jsonError("Missing preset ID", 400);

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
      return jsonError("Failed to update preset");
    }

    return jsonSuccess({ preset: rowToPreset(data as ShapePresetRow) });
  } catch (error) {
    console.error("Shape presets PUT error:", error);
    return jsonError("Internal server error");
  }
}
