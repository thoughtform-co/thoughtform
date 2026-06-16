import { NextRequest } from "next/server";

import { jsonError, jsonSuccess, requireServiceClient, requireUser } from "@/lib/api/guards";

// ═══════════════════════════════════════════════════════════════════════════
// ASSISTANT CONVERSATIONS API
// Phase 3: List and create conversations (per-user, scoped by Supabase id).
// 2026-06-16: routed through `lib/api/guards` so the service-client +
// user-token boilerplate lives in one place.
// ═══════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

/**
 * GET /api/assistant/conversations
 * List user's conversations with optional filtering
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const supabase = sc.supabase;
    const { searchParams } = new URL(request.url);

    const contextType = searchParams.get("context_type");
    const contextId = searchParams.get("context_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let query = supabase
      .from("assistant_conversations")
      .select("*")
      .eq("user_id", auth.user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (contextType) query = query.eq("context_type", contextType);
    if (contextId) query = query.eq("context_id", contextId);

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch conversations:", error);
      return jsonError("Failed to fetch conversations");
    }

    return jsonSuccess({ conversations: data });
  } catch (error) {
    console.error("Conversations GET error:", error);
    return jsonError("Internal server error");
  }
}

/**
 * POST /api/assistant/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  const sc = requireServiceClient();
  if (!sc.ok) return sc.response;

  try {
    const body = await request.json();
    const { context_type, context_id, title } = body ?? {};

    const { data, error } = await sc.supabase
      .from("assistant_conversations")
      .insert({
        user_id: auth.user.id,
        context_type: context_type || null,
        context_id: context_id || null,
        title: title || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create conversation:", error);
      return jsonError("Failed to create conversation");
    }

    return jsonSuccess({ conversation: data }, { status: 201 });
  } catch (error) {
    console.error("Conversations POST error:", error);
    return jsonError("Internal server error");
  }
}
