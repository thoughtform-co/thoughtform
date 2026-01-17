import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════
// ASSISTANT CONVERSATIONS API
// Phase 3: List and create conversations
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Extract user ID from Authorization header
 */
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * GET /api/assistant/conversations
 * List user's conversations with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const contextType = searchParams.get("context_type");
    const contextId = searchParams.get("context_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("assistant_conversations")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (contextType) {
      query = query.eq("context_type", contextType);
    }
    if (contextId) {
      query = query.eq("context_id", contextId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }

    return NextResponse.json({ conversations: data });
  } catch (error) {
    console.error("Conversations GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/assistant/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { context_type, context_id, title } = body;

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("assistant_conversations")
      .insert({
        user_id: userId,
        context_type: context_type || null,
        context_id: context_id || null,
        title: title || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create conversation:", error);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    return NextResponse.json({ conversation: data }, { status: 201 });
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
