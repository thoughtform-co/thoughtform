import { describe, expect, it } from "vitest";

import {
  ARC_TERMINAL_MEDIA,
  FORCE_BLANK_OUT,
  OUT_END,
  OUT_START,
  RETYPE_OUT,
  TAIL_INTER,
  TAIL_STD,
  UNTYPE_OUT,
  beatIn,
  beatOut,
  headPinOffset,
  ladder,
  noTail,
  rung,
  smootherBand,
  smootherstep,
  tailFor,
} from "@/components/arcs/arcMotion";

/**
 * Beat clock math (ADR-057). These are the numbers the whole grammar
 * hangs off, and the invariants below are the ones that fail SILENTLY in
 * the browser — a residual transform at rest reads as a drift bug, and a
 * clock that never saturates leaves a beat mid-fold forever.
 */
describe("arc terminal motion clocks (ADR-057)", () => {
  it("smootherstep clamps and hits its endpoints exactly", () => {
    expect(smootherstep(-1)).toBe(0);
    expect(smootherstep(0)).toBe(0);
    expect(smootherstep(1)).toBe(1);
    expect(smootherstep(2)).toBe(1);
    expect(smootherstep(0.5)).toBeCloseTo(0.5, 6);
    // The flat first third is the settle hold — never add one explicitly.
    expect(smootherstep(0.1)).toBeLessThan(0.02);
  });

  it("smootherBand normalises into its edges", () => {
    expect(smootherBand(0.1, 0.2, 0.8)).toBe(0);
    expect(smootherBand(0.9, 0.2, 0.8)).toBe(1);
    expect(smootherBand(0.5, 0.2, 0.8)).toBeCloseTo(0.5, 6);
  });

  it("the arrival clock saturates BEFORE the park", () => {
    const vh = 900;
    // Section top at the viewport bottom — nothing has arrived.
    expect(beatIn(vh, vh)).toBe(0);
    // Saturated by 12% of a viewport ahead of the park, so the last rung
    // has landed by the time the stage stops.
    expect(beatIn(vh * 0.12, vh)).toBe(1);
    // At the park, and past it, it stays exactly 1.
    expect(beatIn(0, vh)).toBe(1);
    expect(beatIn(-500, vh)).toBe(1);
  });

  it("the departure clock is one formula for short and tall stages", () => {
    const vh = 900;
    const tail = 630;
    // A stage that FITS parks when its top reaches the viewport top.
    expect(beatOut(1, vh, vh, tail)).toBe(0);
    expect(beatOut(0, vh, vh, tail)).toBe(0);
    // A TALL stage parks when its BOTTOM meets the viewport bottom —
    // i.e. later, at a negative topVp — and not one pixel before.
    const tallH = 1500;
    expect(beatOut(vh - tallH + 1, vh, tallH, tail)).toBe(0);
    expect(beatOut(vh - tallH - tail, vh, tallH, tail)).toBe(1);
  });

  it("the fold saturates before the release and never leaves a beat mid-fold", () => {
    const vh = 900;
    const tail = 630;
    // Fully folded with tail to spare (OUT_END < 1), so what scrolls
    // away is an empty plane — the whole reason the beats can be opaque.
    expect(beatOut(-tail * OUT_END, vh, vh, tail)).toBe(1);
    expect(beatOut(-tail, vh, vh, tail)).toBe(1);
    // And it does not start immediately: OUT_START is the settle hold.
    expect(beatOut(-tail * OUT_START * 0.5, vh, vh, tail)).toBe(0);
  });

  it("a beat with no tail never folds", () => {
    expect(beatOut(-5000, 900, 900, 0)).toBe(0);
    expect(noTail("close")).toBe(true);
    expect(noTail("cards")).toBe(false);
  });

  it("interstitials get the shorter tail", () => {
    expect(tailFor("interstitial")).toBe(TAIL_INTER);
    expect(tailFor("cards")).toBe(TAIL_STD);
    expect(TAIL_INTER).toBeLessThan(TAIL_STD);
  });

  it("rung emits NOTHING in reveal mode — v1 byte-identity", () => {
    expect(rung("reveal", 0.3, 10, 20)).toEqual({});
  });

  it("rung carries the ladder position and only the axes it is given", () => {
    const r = rung("terminal", 0.16, 0, 36);
    expect(r["data-arc-panel"]).toBe("");
    expect(r.style).toMatchObject({ "--ci-off": 0.16, "--dy": "36px" });
    expect(r.style).not.toHaveProperty("--dx");
  });

  it("every rung stays at or below the 0.56 LIFO mirror", () => {
    // The departure offset is derived as `0.56 - --ci-off`; a rung above
    // it would produce a NEGATIVE offset and leave before the fold began.
    const rungs = [
      ladder(0.16, 0.06, 99, 0.46), // cards, capped
      ladder(0.44, 0.04, 99, 0.54), // tips, capped
      ladder(0.16, 0.08, 99, 0.5), // groups, capped
      ladder(0.18, 0.05, 99, 0.48), // anatomy rows, capped
      ladder(0.34, 0.05, 99, 0.48), // portrait copy, capped
      0.38, // the dossier's last record panel (ADR-072: 0.18 → 0.38, console 0.12)
      0.56, // the footnote — the mirror itself
    ];
    for (const value of rungs) expect(value).toBeLessThanOrEqual(0.56);
  });

  it("the JS gate names the same tier the CSS releases at", () => {
    // The CSS release is `(max-width: 960px)`; a mismatch would leave a
    // viewport band with sticky beats and no clock writing to them.
    expect(ARC_TERMINAL_MEDIA).toContain("min-width: 961px");
    expect(ARC_TERMINAL_MEDIA).toContain("prefers-reduced-motion: no-preference");
  });

  it("the masthead-law thresholds keep their derivation and ORDERING", () => {
    // The ordering IS the contract: a beat can type while the fold has
    // barely begun, holds through the visible fold (the masthead is the
    // TOP of the LIFO ladder, so it leaves LAST), un-types, and is
    // guaranteed blank before the iris could crop it.
    expect(RETYPE_OUT).toBeLessThan(UNTYPE_OUT);
    expect(UNTYPE_OUT).toBeLessThan(FORCE_BLANK_OUT);
    expect(FORCE_BLANK_OUT).toBeLessThan(0.56); // the iris
    // Derived, never a free literal (ADR-056 U3).
    expect(RETYPE_OUT).toBe(UNTYPE_OUT * 0.4);
  });

  it("the dwell survives a real scroll into the tail — the blank-masthead bug", () => {
    // Regression: keying the un-type to the RAW ramp fired ~107px into
    // an 888px tail, while the SMOOTHED channel still read ~0.001 and
    // nothing else had moved — the masthead vanished off a parked,
    // fully-legible section. A beat one-fifth into its tail must still
    // be in the dwell, and must NOT be leaving.
    const vh = 900;
    const tail = 630;
    const outAt = (px: number) => beatOut(-px, vh, vh, tail);
    expect(outAt(tail * 0.2)).toBeLessThanOrEqual(RETYPE_OUT);
    expect(outAt(tail * 0.2)).toBeLessThan(UNTYPE_OUT);
    // …and by two-thirds of the tail it is genuinely on its way out.
    expect(outAt(tail * 0.67)).toBeGreaterThan(UNTYPE_OUT);
  });

  it("the tall-head pin offset clamps to its band", () => {
    expect(headPinOffset(500)).toBe(40); // 7% would be 35 — floor wins
    expect(headPinOffset(900)).toBe(63);
    expect(headPinOffset(2000)).toBe(88); // ceiling
  });
});
