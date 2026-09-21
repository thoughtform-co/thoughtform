/**
 * lib/auth/ownerPass — the owner's pass (ADR-117).
 *
 * `/arcs` lists every client's engagements and is the owner's page alone.
 * The site's auth is client-side (a Supabase session in localStorage,
 * ADR-003), which a server render cannot see, so the overview is gated on a
 * PASS: a short signed cookie the owner's own browser mints through
 * `POST /api/owner-pass` after that route has verified its Supabase session
 * and the allowlisted email.
 *
 * ⚠ A PASS IS NOT A SESSION. It carries no identity and no Supabase token —
 * `v1.<expiry>.<mac>` and nothing else — and it authorises exactly one thing:
 * rendering the overview. No API route may read it (`owner-gate-doctrine`
 * scans `app/api/**`), and its cookie is scoped `Path=/arcs`, so the browser
 * never sends it to `/api/*` in the first place.
 *
 * ⚠ SERVER-ONLY: `node:crypto`. A client component never imports this file —
 * `ownerPassClient.ts` is the browser's half, and it only fetches.
 *
 * ⚠ IT FAILS CLOSED. No key means no pass verifies and the overview is a 404,
 * the owner's own included. A misconfiguration shows up as his own 404,
 * never as a gate that quietly lets everyone in.
 */

import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";

export const OWNER_PASS_COOKIE = "tf_owner";
export const OWNER_PASS_VERSION = "v1";
/** Seven days, sliding — the browser re-mints below half (`ownerPassClient`). */
export const OWNER_PASS_TTL_S = 7 * 24 * 60 * 60;
/** The one path the cookie is ever sent to (and everything under it). */
export const OWNER_PASS_PATH = "/arcs";

/** A dedicated secret shorter than this is a misconfiguration, not a key. */
const MIN_SECRET_LENGTH = 32;
/** The HKDF context: a key derived for this purpose and no other. */
const KEY_INFO = "thoughtform/owner-pass/v1";
/** A clock-skew allowance on the "longer than we ever mint" check. */
const SKEW_S = 60;

type Env = Record<string, string | undefined>;

/**
 * The signing key, DERIVED — never a raw secret. The root is
 * `OWNER_PASS_SECRET` when set (one secret, one purpose), else the service
 * role key the API routes already hold, so the gate works on the first deploy
 * with nothing to configure. Either way HKDF gives a key that means "the
 * owner's pass" and nothing else, so a pass can never double as anything the
 * root signs.
 *
 * ⚠ A SHORT DEDICATED SECRET IS REFUSED, NOT PADDED, AND DOES NOT FALL BACK:
 * falling back would hide the misconfiguration behind a gate that still
 * works, and the only honest signal is the owner's own 404.
 */
export function ownerPassKey(env: Env = process.env): Buffer | null {
  const secret = env.OWNER_PASS_SECRET?.trim();
  let root: string | undefined;
  if (secret) {
    if (secret.length < MIN_SECRET_LENGTH) return null;
    root = secret;
  } else {
    root = env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;
  }
  if (!root) return null;
  return Buffer.from(hkdfSync("sha256", root, "", KEY_INFO, 32));
}

function macOf(key: Buffer, exp: number): string {
  return createHmac("sha256", key).update(`${OWNER_PASS_VERSION}.${exp}`).digest("base64url");
}

/** A pass that expires at `expSec` (epoch seconds). */
export function signOwnerPass(key: Buffer, expSec: number): string {
  if (!Number.isSafeInteger(expSec) || expSec <= 0) throw new Error("owner pass: bad expiry");
  return `${OWNER_PASS_VERSION}.${expSec}.${macOf(key, expSec)}`;
}

/**
 * True only for a pass this key signed, unexpired, and no longer-lived than
 * any pass this site mints. Constant-time on the MAC (`timingSafeEqual`);
 * everything before it is shape, which reveals nothing about the key.
 */
export function verifyOwnerPass(
  key: Buffer | null,
  token: string | null | undefined,
  nowSec: number
): boolean {
  if (!key || !token || token.length > 128) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, mac] = parts;
  if (version !== OWNER_PASS_VERSION) return false;
  if (!/^\d{1,12}$/.test(expRaw)) return false;
  const exp = Number(expRaw);
  if (exp <= nowSec) return false;
  if (exp - nowSec > OWNER_PASS_TTL_S + SKEW_S) return false;
  // 32 bytes of HMAC-SHA256 are 43 characters of unpadded base64url.
  if (!/^[A-Za-z0-9_-]{43}$/.test(mac)) return false;
  const given = Buffer.from(mac, "base64url");
  const expected = Buffer.from(macOf(key, exp), "base64url");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Enforced in production, and anywhere `OWNER_GATE=enforce` asks for it (the
 * way to exercise the gate on a dev server). Development is OPEN so the eval
 * capture and the smokes reach the page. ⚠ There is deliberately no value
 * that switches the gate OFF in production.
 */
export function ownerGateEnforced(env: Env = process.env): boolean {
  return env.NODE_ENV === "production" || env.OWNER_GATE === "enforce";
}

export type OwnerGateDecision = "open" | "pass" | "deny";

/** The whole decision, pure — `ownerGate.ts` only supplies the cookie and the clock. */
export function decideOwnerGate(input: {
  enforced: boolean;
  key: Buffer | null;
  token: string | null | undefined;
  nowSec: number;
}): OwnerGateDecision {
  if (!input.enforced) return "open";
  return verifyOwnerPass(input.key, input.token, input.nowSec) ? "pass" : "deny";
}

/**
 * The cookie, whole. HttpOnly (no script reads it), `SameSite=Lax` (Strict
 * would 404 the owner when he follows a link to the overview from Slack or
 * Notion), Secure in production, and `Path=/arcs`.
 */
export function ownerPassCookie(value: string, maxAge: number, env: Env = process.env) {
  return {
    name: OWNER_PASS_COOKIE,
    value,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: OWNER_PASS_PATH,
    maxAge,
  };
}
