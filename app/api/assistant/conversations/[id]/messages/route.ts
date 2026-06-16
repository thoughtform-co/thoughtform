import { NextRequest } from "next/server";

import { jsonError, jsonSuccess, requireServiceClient, requireUser } from "@/lib/api/guards";

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION MESSAGES API
// Add / list messages for a specific conversation. Per-user scoped.
// 2026-06-16: routed through `lib/api/guards`.
// ═══════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assistant/conversations/[id]/messages
 * List messages in a conversation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const { id } = await params;
    const supabase = sc.supabase;

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!conversation) return jsonError("Conversation not found", 404);

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
      return jsonError("Failed to fetch messages");
    }

    return jsonSuccess({ messages: messages || [] });
  } catch (error) {
    console.error("Messages GET error:", error);
    return jsonError("Internal server error");
  }
}

/**
 * POST /api/assistant/conversations/[id]/messages
 * Add a message to a conversation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, content, structured_data, model, tokens_used } = body ?? {};

    if (!role || !content) {
      return jsonError("Missing required fields: role, content", 400);
    }

    if (!["user", "assistant", "system"].includes(role)) {
      return jsonError("Invalid role", 400);
    }

    const supabase = sc.supabase;

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!conversation) return jsonError("Conversation not found", 404);

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
      return jsonError("Failed to create message");
    }

    return jsonSuccess({ message }, { status: 201 });
  } catch (error) {
    console.error("Messages POST error:", error);
    return jsonError("Internal server error");
  }
}
