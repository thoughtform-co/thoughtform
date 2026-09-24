import { describe, expect, it } from "vitest";

import { finiteNumber, intIn, numberIn } from "@/lib/api/numbers";

/**
 * The sieve every paid route reads its numbers through before it spends
 * (2026-09-24 review): `null` for anything that is not a real number in
 * range, and never a coercion — `"50"` is a caller bug, not fifty.
 */
describe("lib/api/numbers", () => {
  it("finiteNumber takes only a finite number", () => {
    expect(finiteNumber(0)).toBe(0);
    expect(finiteNumber(-2.5)).toBe(-2.5);
    for (const bad of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "50",
      "",
      true,
      null,
      undefined,
      {},
      [],
    ])
      expect(finiteNumber(bad), String(bad)).toBeNull();
  });

  it("numberIn is inclusive at both ends", () => {
    expect(numberIn(0, 0, 1)).toBe(0);
    expect(numberIn(1, 0, 1)).toBe(1);
    expect(numberIn(0.88, 0, 1)).toBe(0.88);
    expect(numberIn(1.0001, 0, 1)).toBeNull();
    expect(numberIn(-0.0001, 0, 1)).toBeNull();
    expect(numberIn("0.5", 0, 1)).toBeNull();
  });

  it("intIn wants an integer in range", () => {
    expect(intIn(50, 1, 200)).toBe(50);
    expect(intIn(1, 1, 200)).toBe(1);
    expect(intIn(200, 1, 200)).toBe(200);
    expect(intIn(0, 1, 200)).toBeNull();
    expect(intIn(201, 1, 200)).toBeNull();
    expect(intIn(32.5, 1, 64)).toBeNull();
    expect(intIn(Number.NaN, 1, 200)).toBeNull();
    expect(intIn("50", 1, 200)).toBeNull();
  });
});
