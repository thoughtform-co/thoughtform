import { describe, expect, it } from "vitest";

import { isFigmaFileKey } from "@/lib/figma/client";

/**
 * A Figma file key is part of a URL PATH, and every `/api/figma/*` route took
 * it straight from `?fileKey=` (2026-09-24 review): `../me` walked the request
 * to `https://api.figma.com/v1/me` under the site's own token. The routes gate
 * on this predicate, and the client URL-encodes the key besides.
 */
describe("isFigmaFileKey", () => {
  it("accepts a real-shaped key", () => {
    expect(isFigmaFileKey("AbC123xYz789KlMnOpQrSt")).toBe(true);
    expect(isFigmaFileKey("a1b2c3d4")).toBe(true);
  });

  it("refuses anything that could leave the path segment", () => {
    for (const bad of [
      "../me",
      "abc/versions",
      "abc?x=",
      "abc#frag",
      "abc%2Fme",
      "a b c d e f g h",
    ])
      expect(isFigmaFileKey(bad), bad).toBe(false);
  });

  it("refuses the empty, the short and the absurd", () => {
    expect(isFigmaFileKey("")).toBe(false);
    expect(isFigmaFileKey("abc1234")).toBe(false);
    expect(isFigmaFileKey("a".repeat(100))).toBe(false);
  });
});
