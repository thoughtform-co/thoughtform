import { describe, expect, it } from "vitest";

import {
  OWNER_PASS_COOKIE,
  OWNER_PASS_PATH,
  OWNER_PASS_TTL_S,
  decideOwnerGate,
  ownerGateEnforced,
  ownerPassCookie,
  ownerPassKey,
  signOwnerPass,
  verifyOwnerPass,
} from "@/lib/auth/ownerPass";
import { OWNER_PASS_REMINT_BELOW_S } from "@/lib/auth/ownerPassClient";

/**
 * The owner's pass (ADR-117): the cookie that opens `/arcs`.
 *
 * ⚠ EVERY WAY A PASS CAN BE WRONG IS A 404, and each one is pinned here: an
 * expired pass, a forged one, a pass from another key, a pass from a future
 * format, a pass claiming a life no mint ever gives, and — the one that
 * matters most — a gate with NO key, which must deny rather than open.
 */

const ROOT = "a-root-secret-long-enough-to-be-a-real-one-0123456789";
const NOW = 1_790_000_000;

const key = ownerPassKey({ OWNER_PASS_SECRET: ROOT })!;
const pass = (exp = NOW + 3600) => signOwnerPass(key, exp);

describe("the owner's pass (ADR-117)", () => {
  it("a pass this key signed verifies until it expires", () => {
    expect(verifyOwnerPass(key, pass(), NOW)).toBe(true);
    expect(verifyOwnerPass(key, pass(NOW + OWNER_PASS_TTL_S), NOW)).toBe(true);
    expect(verifyOwnerPass(key, pass(NOW + 1), NOW)).toBe(true);
    expect(verifyOwnerPass(key, pass(NOW), NOW)).toBe(false);
    expect(verifyOwnerPass(key, pass(NOW - 1), NOW)).toBe(false);
  });

  it("a forged, foreign, future-format or malformed pass never verifies", () => {
    const good = pass();
    const [v, exp, mac] = good.split(".");
    const flip = mac[0] === "A" ? "B" : "A";
    expect(verifyOwnerPass(key, `${v}.${exp}.${flip}${mac.slice(1)}`, NOW), "tampered mac").toBe(
      false
    );
    expect(verifyOwnerPass(key, `${v}.${Number(exp) + 1}.${mac}`, NOW), "moved expiry").toBe(false);
    expect(verifyOwnerPass(key, `v2.${exp}.${mac}`, NOW), "another version").toBe(false);
    const other = ownerPassKey({ OWNER_PASS_SECRET: `${ROOT}-rotated` })!;
    expect(verifyOwnerPass(other, good, NOW), "another key").toBe(false);
    for (const bad of [
      "",
      "v1",
      `v1.${exp}`,
      `v1.${exp}.${mac}.extra`,
      `v1.soon.${mac}`,
      `v1.${exp}.short`,
      `v1.-${exp}.${mac}`,
      `${good}${"x".repeat(200)}`,
    ])
      expect(verifyOwnerPass(key, bad, NOW), JSON.stringify(bad)).toBe(false);
    expect(verifyOwnerPass(key, null, NOW)).toBe(false);
    expect(verifyOwnerPass(key, undefined, NOW)).toBe(false);
  });

  it("a pass claiming a longer life than any mint gives is refused", () => {
    expect(verifyOwnerPass(key, pass(NOW + OWNER_PASS_TTL_S + 3600), NOW)).toBe(false);
  });

  it("no key, no pass: the gate FAILS CLOSED", () => {
    expect(verifyOwnerPass(null, pass(), NOW)).toBe(false);
    expect(ownerPassKey({})).toBeNull();
    expect(ownerPassKey({ OWNER_PASS_SECRET: "  " })).toBeNull();
    // A dedicated secret that is too short is a misconfiguration: refused,
    // and it does NOT fall back to the service role key behind it.
    expect(
      ownerPassKey({ OWNER_PASS_SECRET: "short", SUPABASE_SERVICE_ROLE_KEY: ROOT })
    ).toBeNull();
    expect(decideOwnerGate({ enforced: true, key: null, token: pass(), nowSec: NOW })).toBe("deny");
  });

  it("the key is DERIVED, deterministic, and never the raw root", () => {
    const again = ownerPassKey({ OWNER_PASS_SECRET: ROOT })!;
    expect(again.equals(key)).toBe(true);
    expect(key).toHaveLength(32);
    expect(key.equals(Buffer.from(ROOT).subarray(0, 32))).toBe(false);
    // With no dedicated secret the service role key is the root, and one
    // root yields one key whichever variable carried it.
    const fromService = ownerPassKey({ SUPABASE_SERVICE_ROLE_KEY: ROOT })!;
    expect(fromService.equals(key)).toBe(true);
    // A dedicated secret wins over the service role key.
    const both = ownerPassKey({
      OWNER_PASS_SECRET: ROOT,
      SUPABASE_SERVICE_ROLE_KEY: "x".repeat(40),
    })!;
    expect(both.equals(key)).toBe(true);
  });

  it("the gate is open in development, and nothing turns it off in production", () => {
    expect(ownerGateEnforced({ NODE_ENV: "production" })).toBe(true);
    expect(ownerGateEnforced({ NODE_ENV: "production", OWNER_GATE: "off" })).toBe(true);
    expect(ownerGateEnforced({ NODE_ENV: "development" })).toBe(false);
    expect(ownerGateEnforced({ NODE_ENV: "development", OWNER_GATE: "enforce" })).toBe(true);
    expect(decideOwnerGate({ enforced: false, key: null, token: null, nowSec: NOW })).toBe("open");
    expect(decideOwnerGate({ enforced: true, key, token: pass(), nowSec: NOW })).toBe("pass");
    expect(decideOwnerGate({ enforced: true, key, token: null, nowSec: NOW })).toBe("deny");
  });

  it("the cookie is HttpOnly, Lax, scoped to /arcs, Secure in production", () => {
    const prod = ownerPassCookie("v", OWNER_PASS_TTL_S, { NODE_ENV: "production" });
    expect(prod).toEqual({
      name: OWNER_PASS_COOKIE,
      value: "v",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/arcs",
      maxAge: OWNER_PASS_TTL_S,
    });
    expect(OWNER_PASS_PATH).toBe("/arcs");
    expect(ownerPassCookie("v", 0, { NODE_ENV: "development" }).secure).toBe(false);
  });

  it("the browser re-mints at half the pass's life (a restated constant)", () => {
    expect(OWNER_PASS_REMINT_BELOW_S).toBe(OWNER_PASS_TTL_S / 2);
  });
});
