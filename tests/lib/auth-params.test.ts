import { describe, expect, it } from "vitest";

import { hasAuthParams } from "@/lib/auth/authParams";

/**
 * The URL test that decides whether an anonymous visitor loads the Supabase
 * client (2026-09-24 review): `search.includes("code=")` matched
 * `?promocode=LOOP` and fetched the ~34 kB chunk for nobody. Exact keys now.
 */
describe("hasAuthParams", () => {
  it("sees a magic-link return in the hash and a PKCE return in the query", () => {
    expect(hasAuthParams("", "#access_token=abc&type=magiclink")).toBe(true);
    expect(hasAuthParams("?code=abc", "")).toBe(true);
    expect(hasAuthParams("?theme=dark&code=abc", "#")).toBe(true);
  });

  it("does not see a substring", () => {
    expect(hasAuthParams("?promocode=LOOP", "")).toBe(false);
    expect(hasAuthParams("?zipcode=2000", "")).toBe(false);
    expect(hasAuthParams("?utm_content=code%3Dx", "")).toBe(false);
    expect(hasAuthParams("", "#x=access_token")).toBe(false);
    expect(hasAuthParams("", "#not_access_token=1")).toBe(false);
  });

  it("is quiet on an empty URL", () => {
    expect(hasAuthParams("", "")).toBe(false);
    expect(hasAuthParams("?", "#")).toBe(false);
  });
});
