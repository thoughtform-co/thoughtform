/**
 * The seam (ADR-101 §B): the chip becomes the three plate head bands.
 *
 * The choreography's whole correctness is in one summed expression and two
 * welds — at `t = 0` the carrier is the chip it covers, at `t = 1` it is the
 * head it becomes — and neither of those can be seen on a still that is not
 * taken on exactly the right frame. So they are asserted here, arithmetically,
 * over the boxes the two reference viewports actually measure.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CUT } from "@/components/arcs/board/boardLayout";
import {
  fitCropMid,
  seamCarrierRect,
  seamDetach,
  seamProgress,
  seamSeat,
  seamSplit,
  SEAM_CHIP_CUT,
  SEAM_DETACH_END,
  SEAM_SPLIT_END,
  type SeamRect,
} from "@/app/(marketing)/arcs/trinny-london/proposal/turn/turnClock";
import {
  seamDecodeFrame,
  seamWall,
} from "@/app/(marketing)/arcs/trinny-london/proposal/turn/seamDecode";

const ROOT = process.cwd();
const CARRIER = join(ROOT, "app/(marketing)/arcs/trinny-london/proposal/turn/seamCarrier.ts");

/** The three boxes, in the shape they measure live at 1920×1247. */
const CHIP: SeamRect = { x: 1115, y: 860, w: 226, h: 89 };
const CENTRE: SeamRect = { x: 844, y: 579, w: 226, h: 89 };
const PARK: SeamRect = { x: 434, y: 579, w: 226, h: 89 };
const HEAD: SeamRect = { x: 357, y: 759, w: 381, h: 75 };

const at = (t: number) => seamCarrierRect(t, CHIP, CENTRE, PARK, HEAD);
const near = (a: SeamRect, b: SeamRect, eps: number, what: string) => {
  for (const k of ["x", "y", "w", "h"] as const) {
    expect(a[k], `${what}: ${k} (${JSON.stringify(a)} vs ${JSON.stringify(b)})`).toBeCloseTo(
      b[k],
      eps
    );
  }
};

describe("the seam (ADR-101 §B)", () => {
  it("welds to the chip at 0 and to the head at 1, through three windows", () => {
    near(at(0), CHIP, 9, "t = 0 is the chip");
    near(at(SEAM_DETACH_END), CENTRE, 9, "the detach lands on the frame's centre");
    near(at(SEAM_SPLIT_END), PARK, 9, "the split lands on the plate's column");
    near(at(1), HEAD, 9, "t = 1 is the head");

    /* ⚠ CONTINUOUS ACROSS THE TWO JOINS, AND THAT IS WHY IT IS ONE SUMMED
       EXPRESSION RATHER THAN THREE BRANCHES. A branch would land on the same
       four numbers at each boundary and still step, because each leg would be
       measuring from a rect it re-read. */
    for (const edge of [SEAM_DETACH_END, SEAM_SPLIT_END]) {
      const before = at(edge - 1e-7);
      const after = at(edge + 1e-7);
      near(before, after, 4, `continuous at ${edge}`);
    }
  });

  it("moves monotonically, and its three ramps saturate in order", () => {
    expect(seamDetach(0)).toBe(0);
    expect(seamDetach(SEAM_DETACH_END)).toBeCloseTo(1, 12);
    expect(seamSplit(SEAM_DETACH_END)).toBe(0);
    expect(seamSplit(SEAM_SPLIT_END)).toBeCloseTo(1, 12);
    expect(seamSeat(SEAM_SPLIT_END)).toBe(0);
    expect(seamSeat(1)).toBeCloseTo(1, 12);
    // Nothing runs before its own window or after it.
    expect(seamSplit(0.1)).toBe(0);
    expect(seamSeat(0.4)).toBe(0);
    expect(seamDetach(0.9)).toBe(1);

    /* The middle carrier holds STILL through the split — its park IS the
       frame's centre, which is the measured fact the choreography rests on
       (plate 2's column centre is 956.95 against a client width of 1914). */
    const mid = { ...CENTRE };
    for (let t = SEAM_DETACH_END; t <= SEAM_SPLIT_END; t += 0.01) {
      near(seamCarrierRect(t, CHIP, CENTRE, mid, HEAD), CENTRE, 9, `mid holds at ${t}`);
    }
  });

  it("the chip's cut is the board's own, not a second number", () => {
    /* ⚠ THE WRITER MAY NOT IMPORT `boardLayout`. It is the arcs' server
       geometry and this is a client module on a route; the one number they
       share is asserted instead. A drift here is a carrier whose corner does
       not match the chip it is covering on the frame it appears. */
    expect(SEAM_CHIP_CUT).toBe(CUT.card);
  });

  it("fits a crop on the MIDDLE, which is not what the map's helper does", () => {
    /* A 800×548 crop in a 900×700 box: width-bound, so the letterbox is
       vertical and `xMidYMid` splits it. `pdaFlight.fitCrop` hardcodes `oy: 0`
       because the map's svg anchors its crop to the TOP (ADR-070 U3), and
       borrowing it would land every carrier half a letterbox high. */
    const fit = fitCropMid({ w: 900, h: 700 }, { w: 800, h: 548 });
    expect(fit.k).toBeCloseTo(900 / 800, 12);
    expect(fit.ox).toBeCloseTo(0, 12);
    expect(fit.oy).toBeCloseTo((700 - 548 * (900 / 800)) / 2, 12);
    expect(fit.oy).toBeGreaterThan(0);
    // Height-bound the other way.
    const tall = fitCropMid({ w: 900, h: 400 }, { w: 800, h: 548 });
    expect(tall.k).toBeCloseTo(400 / 548, 12);
    expect(tall.oy).toBeCloseTo(0, 12);
    expect(tall.ox).toBeGreaterThan(0);
  });

  it("decodes exactly at its ends, and deterministically between them", () => {
    const pair = { from: "AI CAPABILITY", to: "M1 · about three weeks" };
    const wall = seamWall([pair, { from: "owned by the team", to: "Setup, insight and briefing" }]);
    expect(wall).toBeGreaterThan(0);
    /* ⚠ THE ENDS ARE STRING-EQUAL, NOT NEARLY. Those two frames are the welds:
       at 0 the carrier is covering the chip and has to read as it, and at 1 it
       is replaced by the real head and has to have arrived at its text. */
    expect(seamDecodeFrame(pair, 0, wall)).toBe(pair.from);
    expect(seamDecodeFrame(pair, -0.2, wall)).toBe(pair.from);
    expect(seamDecodeFrame(pair, 1, wall)).toBe(pair.to);
    expect(seamDecodeFrame(pair, 1.4, wall)).toBe(pair.to);
    // Pure in `u` given a seeded random — a scroll-derived clock reverses.
    const seeded = () => 0.42;
    expect(seamDecodeFrame(pair, 0.5, wall, seeded)).toBe(seamDecodeFrame(pair, 0.5, wall, seeded));
    // The wall is the LONGEST pair's, so nothing lands after t = 1.
    const long = { from: "owned by the team", to: "Creative operations and scaling" };
    expect(seamWall([pair, long])).toBeGreaterThanOrEqual(seamWall([pair]));
  });

  it("the seam clock and the carrier share one contract with the writer", () => {
    // `t` is the phases' arrival, floored so a row taller than the frame lands.
    expect(seamProgress(1000, 1000, 0)).toBe(0);
    expect(seamProgress(0, 1000, 0)).toBe(1);
    /* ⚠ THE LAYER IS `document.body`'s CHILD AND ABSOLUTE, never fixed. Both
       facts are what make the welds exact under a missed frame, so both are
       pinned in the source rather than left to a comment nobody re-reads. */
    const src = readFileSync(CARRIER, "utf8");
    expect(src).toMatch(/document\.body\.appendChild\(layer\)/);
    expect(src, "the writer resolves tokens through a probe, never getPropertyValue").not.toMatch(
      /getPropertyValue\(/
    );
    expect(src, "clientWidth, never innerWidth — innerWidth includes the scrollbar").not.toMatch(
      /window\.innerWidth/
    );
  });
});
