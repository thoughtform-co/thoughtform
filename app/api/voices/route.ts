/**
 * Manifesto Voices API Route
 *
 * GET  /api/voices - Get all active voices (public)
 * POST /api/voices - Create a new voice (admin only)
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isAuthorized, getServerUser } from "@/lib/auth-server";

// Voice type matching database schema
export interface ManifestoVoice {
  id: string;
  title: string;
  description: string | null;
  full_text: string | null;
  role: string | null;
  type: string;
  video_url: string | null;
  thumbnail_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Fallback data when database is not available
const FALLBACK_VOICES: Omit<ManifestoVoice, "id" | "created_at" | "updated_at">[] = [
  {
    title: "AI as Intelligence",
    description: "It leaps across dimensions we can't fathom.",
    full_text:
      "AI isn't just a tool—it's a strange, new intelligence that leaps across dimensions we can't fully comprehend. It sees patterns in places we've never looked.",
    role: "Manifesto",
    type: "Voice",
    video_url: null,
    thumbnail_url: null,
    order_index: 0,
    is_active: true,
  },
  {
    title: "Navigate Strangeness",
    description: "The source of truly novel ideas.",
    full_text:
      "In technical work, AI's strangeness must be constrained. But in creative and strategic work, that strangeness becomes the source of truly novel ideas.",
    role: "Manifesto",
    type: "Voice",
    video_url: null,
    thumbnail_url: null,
    order_index: 1,
    is_active: true,
  },
  {
    title: "Think WITH AI",
    description: "Navigating its strangeness for creative breakthroughs.",
    full_text:
      "Thoughtform teaches teams to think WITH that intelligence—not against it, not around it—navigating its strangeness for creative breakthroughs.",
    role: "Manifesto",
    type: "Voice",
    video_url: null,
    thumbnail_url: null,
    order_index: 2,
    is_active: true,
  },
];

/**
 * GET /api/voices
 * Returns all active voices for the manifesto section (public)
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      // Return fallback data with generated IDs
      return NextResponse.json({
        voices: FALLBACK_VOICES.map((v, i) => ({
          ...v,
          id: `fallback-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        source: "fallback",
      });
    }

    const { data, error } = await supabase
      .from("manifesto_voices")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[voices] Database error:", error);
      // Return fallback on error
      return NextResponse.json({
        voices: FALLBACK_VOICES.map((v, i) => ({
          ...v,
          id: `fallback-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        source: "fallback",
        error: error.message,
      });
    }

    return NextResponse.json({
      voices: data || [],
      source: "database",
    });
  } catch (error) {
    console.error("[voices] Error:", error);
    return NextResponse.json({
      voices: FALLBACK_VOICES.map((v, i) => ({
        ...v,
        id: `fallback-${i}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * POST /api/voices
 * Create a new voice (admin only)
 */
export async function POST(request: Request) {
  try {
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
    const { title, description, full_text, role, type, video_url, thumbnail_url, order_index } =
      body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get max order_index if not provided
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const { data: maxData } = await supabase
        .from("manifesto_voices")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)
        .single();

      finalOrderIndex = maxData ? maxData.order_index + 1 : 0;
    }

    const { data, error } = await supabase
      .from("manifesto_voices")
      .insert({
        title,
        description: description || null,
        full_text: full_text || null,
        role: role || null,
        type: type || "Voice",
        video_url: video_url || null,
        thumbnail_url: thumbnail_url || null,
        order_index: finalOrderIndex,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[voices] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, voice: data });
  } catch (error) {
    console.error("[voices] Create error:", error);
    return NextResponse.json({ error: "Failed to create voice" }, { status: 500 });
  }
}
