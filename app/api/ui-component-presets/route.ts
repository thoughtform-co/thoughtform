// ═══════════════════════════════════════════════════════════════
// UI COMPONENT PRESETS API
// CRUD for Astrogation component presets
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

// GET - Fetch all presets or filter by component_key
export async function GET(request: Request) {
  try {
    // Check authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const componentKey = searchParams.get("component_key");

    let query = supabase
      .from("ui_component_presets")
      .select("*")
      .order("created_at", { ascending: false });

    if (componentKey) {
      query = query.eq("component_key", componentKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching presets:", error);
      return NextResponse.json({ error: "Failed to fetch presets" }, { status: 500 });
    }

    return NextResponse.json({ presets: data || [] });
  } catch (error) {
    console.error("GET /api/ui-component-presets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new preset
export async function POST(request: Request) {
  try {
    // Check authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { name, component_key, config } = body;

    if (!name || !component_key) {
      return NextResponse.json(
        { error: "Missing required fields: name, component_key" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("ui_component_presets")
      .insert({ name, component_key, config: config || {} })
      .select()
      .single();

    if (error) {
      console.error("Error creating preset:", error);
      return NextResponse.json({ error: "Failed to create preset" }, { status: 500 });
    }

    return NextResponse.json({ preset: data });
  } catch (error) {
    console.error("POST /api/ui-component-presets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update an existing preset
export async function PUT(request: Request) {
  try {
    // Check authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { id, name, config } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing preset id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (config !== undefined) updates.config = config;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ui_component_presets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating preset:", error);
      return NextResponse.json({ error: "Failed to update preset" }, { status: 500 });
    }

    return NextResponse.json({ preset: data });
  } catch (error) {
    console.error("PUT /api/ui-component-presets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a preset
export async function DELETE(request: Request) {
  try {
    // Check authorization
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing preset id" }, { status: 400 });
    }

    const { error } = await supabase.from("ui_component_presets").delete().eq("id", id);

    if (error) {
      console.error("Error deleting preset:", error);
      return NextResponse.json({ error: "Failed to delete preset" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ui-component-presets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
