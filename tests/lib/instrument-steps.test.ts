import { describe, expect, it } from "vitest";

import { SURI_INSTRUMENT } from "@/lib/instrument/records/suri";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";
import { insStepOf, insStepOrder } from "@/lib/instrument/steps";

/** The pinned engine's steps (the proposal system, 2026-10-10): derived,
 *  bottom-up, every part once, each slab before its parts, the owner last. */
describe("the engine's steps", () => {
  it("X-Bionic's organisation lights in nine steps, bottom-up", () => {
    const order = insStepOrder(X_BIONIC_INSTRUMENT);
    expect(order).toEqual([
      "slab-org",
      "model",
      "data",
      "interface",
      "slab-layer",
      "context",
      "evals",
      "tiles",
      "owner",
    ]);
    expect(new Set(order).size).toBe(order.length);
    expect(order.indexOf("slab-org")).toBeLessThan(order.indexOf("model"));
    expect(order.indexOf("slab-layer")).toBeLessThan(order.indexOf("context"));
    expect(order.at(-1)).toBe("owner");
    expect(insStepOf(order, "tiles")).toBe(8);
    expect(insStepOf(order, "slab-org")).toBe(1);
  });

  it("a record without an organisation has no tiles step", () => {
    const order = insStepOrder(SURI_INSTRUMENT);
    for (const id of order) expect(typeof id).toBe("string");
    if (!SURI_INSTRUMENT.org) expect(order).not.toContain("tiles");
  });
});
