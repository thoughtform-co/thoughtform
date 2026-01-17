import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION MESSAGES API
// Phase 3: Add messages to a conversation
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assistant/conversations/[id]/messages
 * List messages in a conversation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { data: messages, error } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/assistant/conversations/[id]/messages
 * Add a message to a conversation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, content, structured_data, model, tokens_used } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Missing required fields: role, content" },
        { status: 400 }
      );
    }

    if (!["user", "assistant", "system"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("assistant_messages")
      .insert({
        conversation_id: id,
        role,
        content,
        structured_data: structured_data || null,
        model: model || null,
        tokens_used: tokens_used || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create message:", error);
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
