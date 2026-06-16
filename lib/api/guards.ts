/**
 * Shared API guards for `app/api/**`.
 *
 * Wraps the existing primitives in `lib/auth-server.ts` and
 * `lib/supabase.ts` into small composable helpers so route handlers
 * stop re-implementing the same `isAuthorized → createServerClient →
 * jsonError` boilerplate. The intent is regression-safe: every helper
 * preserves the previous behavior of the routes it replaces:
 *
 *   - `requireAdmin(request)` mirrors `isAuthorized(request)` and
 *     returns `null` on success / a 401 `NextResponse` on failure.
 *     In development, `isAuthorized` returns `true` for all callers
 *     (preserving the dev DX bypass documented in
 *     `lib/auth-server.ts`).
 *   - `requireUser(request)` returns the Supabase user (with `id`)
 *     for a valid Bearer token, or a 401 `NextResponse`. It does
 *     NOT short-circuit in development — assistant/survey routes
 *     need a stable `user.id` to scope rows.
 *   - `requireServiceClient()` returns the service-role Supabase
 *     client or a 503 `NextResponse` so callers do not need to
 *     re-implement the `if (!supabase) return 500/503` guard.
 *   - `jsonError()` and `jsonSuccess()` keep the response shape
 *     consistent across routes.
 *
 * These helpers are intentionally additive — existing routes can be
 * migrated one at a time without changing observable behavior.
 */

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getServerUser, isAuthorized } from "@/lib/auth-server";
import { createServerClient } from "@/lib/supabase";

/** Standard JSON error body shape. */
export interface ApiErrorBody {
  error: string;
  code?: string;
}

/** Standard "no body" success indicator. */
export type ApiOk<T> = T;

/**
 * Build a NextResponse with the canonical `{ error }` body shape.
 * Always sets `Cache-Control: no-store` because every route using
 * this helper is dynamic (auth-gated or mutating).
 */
export function jsonError(message: string, status = 500, code?: string): NextResponse {
  const body: ApiErrorBody = code ? { error: message, code } : { error: message };
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Build a JSON success response. Helper exists so callers don't need
 * to remember to set `Cache-Control: no-store` — every server route
 * in this codebase is per-user / dynamic and should never be cached
 * at the edge by default.
 */
export function jsonSuccess<T>(body: T, init?: { status?: number }): NextResponse {
  return NextResponse.json(body as ApiOk<T>, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Admin gate. Returns `null` when the request is authorized for the
 * single allowlisted admin (or all callers in dev — see
 * `lib/auth-server.ts`); otherwise returns a 401 `NextResponse` the
 * caller should return immediately.
 *
 * Usage:
 *   const denied = await requireAdmin(request);
 *   if (denied) return denied;
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const ok = await isAuthorized(request);
  return ok ? null : jsonError("Unauthorized - admin access required", 401, "unauthorized");
}

/**
 * Authenticated-user gate. Returns the Supabase user object
 * (`{ id, email, ... }`) when a valid Bearer token is present; a 401
 * `NextResponse` otherwise.
 *
 * NOTE: Unlike `requireAdmin`, this does NOT bypass in dev unless a
 * real Bearer token is present. Routes that key rows by `user.id`
 * (assistant conversations, survey items, foundry documents) need a
 * stable id to filter on, so the dev bypass would silently break
 * row scoping.
 */
export type RequireUserResult =
  | { ok: true; user: User & { id: string } }
  | { ok: false; response: NextResponse };

export async function requireUser(request: Request): Promise<RequireUserResult> {
  const user = await getServerUser(request);
  // `getServerUser` may return a partial dev shim with no `id`. Reject
  // anything that doesn't carry a real Supabase user id.
  if (
    !user ||
    typeof user !== "object" ||
    !("id" in user) ||
    typeof (user as { id?: unknown }).id !== "string" ||
    !(user as { id: string }).id
  ) {
    return {
      ok: false,
      response: jsonError("Unauthorized", 401, "unauthorized"),
    };
  }
  return { ok: true, user: user as User & { id: string } };
}

/**
 * Service-role Supabase client gate.
 *
 * Returns either the configured service-role client or a 503
 * `NextResponse` so the caller can short-circuit. Critical: every
 * use-site that opts into the service client is bypassing RLS, so
 * `requireAdmin` (or `requireUser` with explicit row scoping) must
 * be called BEFORE this helper for any mutating route.
 */
export type RequireServiceClientResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

export function requireServiceClient(): RequireServiceClientResult {
  const supabase = createServerClient();
  if (!supabase) {
    return {
      ok: false,
      response: jsonError("Database not configured", 503, "service_unavailable"),
    };
  }
  return { ok: true, supabase };
}

/**
 * Composite admin guard: validates the admin AND yields a
 * service-role Supabase client in one step. Most admin mutation
 * routes need both; this avoids two near-identical guard blocks at
 * the top of every handler.
 */
export type RequireAdminClientResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

export async function requireAdminAndServiceClient(
  request: Request
): Promise<RequireAdminClientResult> {
  const denied = await requireAdmin(request);
  if (denied) return { ok: false, response: denied };

  const sc = requireServiceClient();
  if (!sc.ok) return sc;
  return { ok: true, supabase: sc.supabase };
}
