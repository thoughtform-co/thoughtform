import { NextResponse } from "next/server";

import { jsonError } from "@/lib/api/guards";
import { verifyAllowlistedBearer } from "@/lib/auth-server";
import {
  OWNER_PASS_TTL_S,
  ownerPassCookie,
  ownerPassKey,
  signOwnerPass,
} from "@/lib/auth/ownerPass";

/**
 * /api/owner-pass — mints and clears the owner's pass (ADR-117).
 *
 * `POST` answers only to a Bearer token that resolves to a real Supabase user
 * with the allowlisted email, through `verifyAllowlistedBearer` — the STRICT
 * verifier. ⚠ Never `requireAdmin` / `isAuthorized` here: those return true
 * for everyone in development, and a dev server that shares the production
 * key (the phone passes expose it on the LAN) would then mint a pass that is
 * valid in production.
 *
 * `DELETE` needs no auth: it only clears the caller's own cookie, and a
 * cross-origin DELETE cannot reach it without a preflight this route never
 * answers.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await verifyAllowlistedBearer(request))) {
    return jsonError("Unauthorized", 401, "unauthorized");
  }
  const key = ownerPassKey();
  if (!key) return jsonError("The owner's pass is not configured", 503, "unconfigured");

  const exp = Math.floor(Date.now() / 1000) + OWNER_PASS_TTL_S;
  const res = NextResponse.json({ exp }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(ownerPassCookie(signOwnerPass(key, exp), OWNER_PASS_TTL_S));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(ownerPassCookie("", 0));
  return res;
}
