import { NextRequest } from "next/server";

import { jsonError, jsonSuccess, requireServiceClient, requireUser } from "@/lib/api/guards";

// ═══════════════════════════════════════════════════════════════════════════
// SINGLE CONVERSATION API
// Get / update / delete a specific conversation. Authorization is per-user
// (Supabase Bearer token) and the row filter scopes everything by `user_id`.
// 2026-06-16: routed through `lib/api/guards`.
// ═══════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/assistant/conversations/[id]
 * Get a specific conversation with its messages
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const { id } = await params;
    const supabase = sc.supabase;

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("assistant_conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .is("deleted_at", null)
      .single();

    if (convError || !conversation) {
      return jsonError("Conversation not found", 404);
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) {
      console.error("Failed to fetch messages:", msgError);
      return jsonError("Failed to fetch messages");
    }

    return jsonSuccess({
      conversation,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Conversation GET error:", error);
    return jsonError("Internal server error");
  }
}

/**
 * PATCH /api/assistant/conversations/[id]
 * Update conversation (title, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { title } = body ?? {};

    const supabase = sc.supabase;

    const { data: existing } = await supabase
      .from("assistant_conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!existing) return jsonError("Conversation not found", 404);

    const { data, error } = await supabase
      .from("assistant_conversations")
      .update({ title })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update conversation:", error);
      return jsonError("Failed to update conversation");
    }

    return jsonSuccess({ conversation: data });
  } catch (error) {
    console.error("Conversation PATCH error:", error);
    return jsonError("Internal server error");
  }
}

/**
 * DELETE /api/assistant/conversations/[id]
 * Soft-delete a conversation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const { id } = await params;

    const { error } = await sc.supabase
      .from("assistant_conversations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) {
      console.error("Failed to delete conversation:", error);
      return jsonError("Failed to delete conversation");
    }

    return jsonSuccess({ success: true });
  } catch (error) {
    console.error("Conversation DELETE error:", error);
    return jsonError("Internal server error");
  }
}
