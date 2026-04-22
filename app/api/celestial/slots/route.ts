import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth-server";

export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data, error } = await supabase.from("celestial_slots").select(`
        slot_id,
        design_id,
        orientation,
        enabled,
        updated_at,
        celestial_designs ( id, name, config )
      `);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ slots: data ?? [] });
  } catch (err) {
    console.error("[GET /api/celestial/slots]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slot_id, design_id, orientation, enabled } = body;

    if (!slot_id || typeof slot_id !== "string") {
      return NextResponse.json({ error: "slot_id is required" }, { status: 400 });
    }

    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (design_id !== undefined) update.design_id = design_id;
    if (orientation !== undefined) update.orientation = orientation;
    if (enabled !== undefined) update.enabled = enabled;

    const { data, error } = await supabase
      .from("celestial_slots")
      .upsert({ slot_id, ...update }, { onConflict: "slot_id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slot: data });
  } catch (err) {
    console.error("[POST /api/celestial/slots]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
