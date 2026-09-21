/**
 * scripts/owner-pass/signPass — the owner's pass, signed by a script (ADR-117).
 *
 * ⚠ A DELIBERATE SECOND IMPLEMENTATION of `lib/auth/ownerPass.ts`'s format:
 * a script that imported the module would agree with it by construction and
 * could never notice the format drifting. `verify-owner-gate.mjs` proves a
 * pass signed here is accepted by the real server, which is the lockstep.
 *
 * The secret comes from the caller's environment and is never printed.
 */

import { createHmac, hkdfSync } from "node:crypto";

const KEY_INFO = "thoughtform/owner-pass/v1";
export const COOKIE = "tf_owner";
export const TTL_S = 7 * 24 * 60 * 60;

export function keyFrom(root) {
  return Buffer.from(hkdfSync("sha256", root, "", KEY_INFO, 32));
}

export function signPass(root, expSec, version = "v1") {
  const mac = createHmac("sha256", keyFrom(root))
    .update(`${version}.${expSec}`)
    .digest("base64url");
  return `${version}.${expSec}.${mac}`;
}

/** A valid pass for the next hour, as a `Cookie` header value. */
export function passCookieHeader(root, nowSec = Math.floor(Date.now() / 1000)) {
  return `${COOKIE}=${signPass(root, nowSec + 3600)}`;
}
