import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE CONVERSATION API
// Phase 3: Get, update, delete specific conversation
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
 * GET /api/assistant/conversations/[id]
 * Get a specific conversation with its messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("assistant_conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Failed to fetch messages:", msgError);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Conversation GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/assistant/conversations/[id]
 * Update conversation (title, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    const supabase = getSupabaseClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Update
    const { data, error } = await supabase
      .from("assistant_conversations")
      .update({ title })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update conversation:", error);
      return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error("Conversation PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/assistant/conversations/[id]
 * Soft-delete a conversation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Verify ownership and soft-delete
    const { error } = await supabase
      .from("assistant_conversations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to delete conversation:", error);
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Conversation DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
