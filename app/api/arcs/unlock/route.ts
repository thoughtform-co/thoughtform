import { NextResponse } from "next/server";

import {
  ARC_PASS_TTL_S,
  ARC_UNLOCK_PATH,
  arcGateKey,
  arcPassCookieName,
  arcPassToken,
  arcPasswordFor,
  safeArcNext,
} from "@/lib/arcs/arcGate";

/**
 * /api/arcs/unlock — checks an arc page's password and sets its pass
 * (ADR-135). The form on `/unlock` posts `password` and `next`; a match sets
 * an httpOnly cookie holding a hash of the key and the password (never the
 * password) and sends the reader back with a 303; a miss sends them back to
 * the form. `next` must be an arc page, so the route can never redirect off
 * the site.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = safeArcNext(String(form.get("next") ?? ""));
  if (!next) return NextResponse.redirect(new URL("/", request.url), 303);

  const key = arcGateKey(next.split(/[?#]/)[0]);
  const expected = key ? arcPasswordFor(key, process.env) : null;
  if (!key || !expected) return NextResponse.redirect(new URL(next, request.url), 303);

  if (password !== expected) {
    const back = new URL(ARC_UNLOCK_PATH, request.url);
    back.searchParams.set("next", next);
    back.searchParams.set("error", "1");
    return NextResponse.redirect(back, 303);
  }

  const res = NextResponse.redirect(new URL(next, request.url), 303);
  res.cookies.set({
    name: arcPassCookieName(key),
    value: await arcPassToken(key, expected),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ARC_PASS_TTL_S,
  });
  return res;
}
