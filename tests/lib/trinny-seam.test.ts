/**
 * The scene (ADR-102): the configuration collapses into its chip, the chip
 * slides to the far left and becomes plate 1's head band, the plates unroll
 * out of their bands one after another, the title opens with the first and
 * the paragraph after the third — all a pure function of one scroll clock
 * inside a pinned stage.
 *
 * The choreography's correctness is in its ORDER and its WELDS: every
 * hand-over targets a box that is not moving, every window opens after the
 * one it depends on has closed, and at both ends of every travel the carrier
 * IS the thing it covers. None of that can be seen on a still that is not
 * taken on exactly the right frame, so it is asserted here, arithmetically.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CUT } from "@/components/arcs/board/boardLayout";
import {
  carrierWindow,
  chipAway,
  decodeClock,
  feather,
  fitCropMid,
  foldPose,
  foldWindow,
  introOpen,
  lerpRect,
  plateState,
  propClose,
  sceneProgress,
  scenePast,
  SCENE_CARRY,
  SCENE_DECODE_END,
  SCENE_DECODE_START,
  SCENE_DWELL_END,
  SCENE_END,
  SCENE_FOLD_MIN_SCALE,
  SCENE_FOLD_ORDER,
  SCENE_FOLD_TRAVEL_START,
  SCENE_HANDOVER,
  SCENE_INTRO,
  SCENE_TITLE,
  SCENE_UNROLL,
  SCENE_WITHDRAW,
  SEAM_CHIP_CUT,
  titleOpen,
  TURN_PROP_FEATHER_VH,
  unrollY,
  wireRetract,
  type SeamRect,
} from "@/app/(marketing)/arcs/trinny-london/proposal/turn/turnClock";
import {
  seamDecodeFrame,
  seamWall,
} from "@/app/(marketing)/arcs/trinny-london/proposal/turn/seamDecode";

const ROOT = process.cwd();
const CARRIER = join(ROOT, "app/(marketing)/arcs/trinny-london/proposal/turn/seamCarrier.ts");
const ROUTE_CSS = join(ROOT, "app/(marketing)/arcs/trinny-london/proposal/trinny-london.css");

/** The chip and plate 1's head, in the shape they measure at 1920×1247. */
const CHIP: SeamRect = { x: 1115, y: 860, w: 226, h: 89 };
const HEAD: SeamRect = { x: 357, y: 759, w: 381, h: 75 };

const near = (a: SeamRect, b: SeamRect, eps: number, what: string) => {
  for (const k of ["x", "y", "w", "h"] as const) {
    expect(a[k], `${what}: ${k} (${JSON.stringify(a)} vs ${JSON.stringify(b)})`).toBeCloseTo(
      b[k],
      eps
    );
  }
};

describe("the scene (ADR-102)", () => {
  it("runs in viewport units, and the runway in the sheet reaches its end", () => {
    const vh = 1000;
    /* ⚠ NOT NORMALISED. A 0 → 1 clock would let a runway edit rescale every
       window with nothing failing; in viewports, shortening the runway can
       only truncate the scene, and this pin is what says so. */
    expect(sceneProgress(0, vh, 4)).toBe(0);
    expect(sceneProgress(500, vh, 4)).toBe(0);
    expect(sceneProgress(-1500, vh, 4)).toBeCloseTo(1.5, 12);
    expect(sceneProgress(-9000, vh, 4)).toBe(4);
    const runway =
      Number(
        readFileSync(ROUTE_CSS, "utf8").match(/--tl-scene-runway:\s*(\d+(?:\.\d+)?)svh/)?.[1]
      ) / 100;
    expect(runway, "the sheet declares --tl-scene-runway in svh").toBeGreaterThan(0);
    expect(SCENE_END, "the scene ends before the stage releases").toBeLessThanOrEqual(runway);
    expect(
      runway - SCENE_END,
      "a release margin, not a whole viewport of dead scroll"
    ).toBeLessThan(0.2);
  });

  it("every window opens after the one it depends on, and every hand-over is stationary", () => {
    // The dwell is real: nothing moves before the withdraw.
    expect(SCENE_DWELL_END).toBeGreaterThan(0.25);
    expect(SCENE_WITHDRAW[0]).toBeGreaterThanOrEqual(SCENE_DWELL_END);
    expect(SCENE_WITHDRAW[1]).toBeGreaterThan(SCENE_WITHDRAW[0]);
    // The four folds are staggered in order and the last one ends before
    // the chip is handed to the carrier — with a margin, not on the frame.
    for (let k = 1; k < SCENE_FOLD_ORDER.length; k++) {
      expect(foldWindow(k)[0]).toBeGreaterThan(foldWindow(k - 1)[0]);
    }
    const lastFold = foldWindow(SCENE_FOLD_ORDER.length - 1);
    expect(SCENE_HANDOVER - lastFold[1]).toBeGreaterThanOrEqual(0.02);
    // The slide opens after the hand-over, and the copies travel one after
    // another, each peeling off a band that has already landed.
    expect(SCENE_CARRY[0][0]).toBeGreaterThanOrEqual(SCENE_HANDOVER);
    for (let i = 0; i < 3; i++) {
      expect(SCENE_CARRY[i][1]).toBeGreaterThan(SCENE_CARRY[i][0]);
      expect(SCENE_UNROLL[i][1]).toBeGreaterThan(SCENE_UNROLL[i][0]);
      // A plate unrolls only out of a band that has landed.
      expect(SCENE_UNROLL[i][0], `plate ${i} unrolls after its band lands`).toBeGreaterThanOrEqual(
        SCENE_CARRY[i][1]
      );
      if (i > 0) {
        expect(SCENE_CARRY[i][0], `copy ${i} peels off a landed band`).toBeGreaterThanOrEqual(
          SCENE_CARRY[i - 1][1]
        );
      }
    }
    // The title opens with the first band; the paragraph after the third plate.
    expect(SCENE_TITLE[0]).toBeGreaterThanOrEqual(SCENE_CARRY[0][0]);
    expect(SCENE_TITLE[1]).toBeLessThanOrEqual(SCENE_UNROLL[0][1]);
    expect(SCENE_INTRO[0]).toBeGreaterThanOrEqual(SCENE_UNROLL[2][1]);
    expect(SCENE_END).toBeGreaterThanOrEqual(SCENE_INTRO[1]);
    // The arrival strike leaves above the pin (q ≤ 0.96 is sv = 0), and the
    // deep-reload gate opens with the withdraw.
    expect(scenePast(SCENE_WITHDRAW[0] - 1e-9)).toBe(false);
    expect(scenePast(SCENE_WITHDRAW[0])).toBe(true);
  });

  it("the withdraw closes the board's head and the ledger, and the two openings follow", () => {
    expect(propClose(0)).toBe(1);
    expect(propClose(SCENE_WITHDRAW[0])).toBe(1);
    expect(propClose(SCENE_WITHDRAW[1])).toBeCloseTo(0, 12);
    expect(propClose(SCENE_END)).toBeCloseTo(0, 12);
    expect(titleOpen(SCENE_TITLE[0])).toBe(0);
    expect(titleOpen(SCENE_TITLE[1])).toBeCloseTo(1, 12);
    expect(introOpen(SCENE_INTRO[0])).toBe(0);
    expect(introOpen(SCENE_INTRO[1])).toBeCloseTo(1, 12);
    // Monotone: closing never re-opens, opening never re-closes.
    let prev = 2;
    for (let sv = 0; sv <= SCENE_END; sv += 0.01) {
      const v = propClose(sv);
      expect(v).toBeLessThanOrEqual(prev + 1e-12);
      prev = v;
    }
  });

  it("a node shrinks before it travels, rides its ribbon home, and is identity at rest", () => {
    /* The configured board's own geometry (`boardLayout`): the chip is
       264 × 104 on (416, 276); the tools sit 266 units to its right, 188
       wide; the seat 206 units above it, 92 tall. */
    const chip = { cx: 416, cy: 276 };
    const CHIP_HALF = { x: 132, y: 52 };
    const bodies = [
      { name: "tools", c: { cx: 682, cy: 276 }, half: { x: 94, y: 108 } },
      { name: "seat", c: { cx: 416, cy: 70 }, half: { x: 172, y: 46 } },
    ];
    for (let k = 0; k < SCENE_FOLD_ORDER.length; k++) {
      const [from, to] = foldWindow(k);
      for (const body of bodies) {
        const node = body.c;
        // ⚠ IDENTITY AT REST, exactly — the board's guards measure here.
        expect(foldPose(k, 0, node, chip)).toEqual({ fx: 0, fy: 0, scale: 1, opacity: 1 });
        expect(foldPose(k, from, node, chip)).toEqual({ fx: 0, fy: 0, scale: 1, opacity: 1 });
        // Home: on the chip's centre, a mark, gone.
        const end = foldPose(k, to, node, chip);
        expect(end.fx).toBeCloseTo(chip.cx - node.cx, 9);
        expect(end.fy).toBeCloseTo(chip.cy - node.cy, 9);
        expect(end.scale).toBeCloseTo(SCENE_FOLD_MIN_SCALE, 9);
        expect(end.opacity).toBeCloseTo(0, 9);
        /* ⚠ SHRINK LEADS TRAVEL, AND THE CLAIM IS GEOMETRIC. The tools and
           the reach paint OVER the chip, so a node still near full size when
           its near edge crosses the chip's edge reads as going over it, not
           into it. Walk the fold: on the first frame the node's near edge
           reaches the chip's edge it must already be a mark — a tenth of its
           size or less. */
        const dx = chip.cx - node.cx;
        const dy = chip.cy - node.cy;
        const axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        const D = Math.abs(axis === "x" ? dx : dy);
        const nodeHalf = axis === "x" ? body.half.x : body.half.y;
        const chipHalf = axis === "x" ? CHIP_HALF.x : CHIP_HALF.y;
        let crossedAt: number | null = null;
        let px = 0;
        let po = 2;
        for (let sv = from; sv <= to + 1e-9; sv += (to - from) / 200) {
          const p = foldPose(k, sv, node, chip);
          const travelled = Math.abs(axis === "x" ? p.fx : p.fy);
          const nearEdge = D - travelled - nodeHalf * p.scale;
          if (crossedAt === null && nearEdge <= chipHalf) {
            crossedAt = sv;
            expect(
              p.scale,
              `${body.name} crossing the chip's edge at sv ${sv.toFixed(3)}`
            ).toBeLessThanOrEqual(0.1);
          }
          // Monotone travel and opacity.
          expect(Math.abs(p.fx) + Math.abs(p.fy)).toBeGreaterThanOrEqual(px - 1e-9);
          expect(p.opacity).toBeLessThanOrEqual(po + 1e-12);
          px = Math.abs(p.fx) + Math.abs(p.fy);
          po = p.opacity;
        }
        expect(crossedAt, `${body.name} reaches the chip`).not.toBeNull();
        // And the travel does not begin at the window's start: the shrink has a lead.
        const early = foldPose(k, from + (to - from) * 0.2, node, chip);
        expect(Math.abs(early.fx) + Math.abs(early.fy)).toBeLessThan(1e-9);
        expect(early.scale).toBeLessThan(1);
      }
      // The ribbon follows the travel, not the shrink.
      expect(wireRetract(k, from)).toBe(0);
      expect(wireRetract(k, from + (to - from) * 0.2)).toBe(0);
      expect(wireRetract(k, to)).toBeCloseTo(1, 12);
      expect(SCENE_FOLD_TRAVEL_START).toBeGreaterThan(0);
    }
    // The chip's group is put away from the hand-over on.
    expect(chipAway(SCENE_HANDOVER - 1e-9)).toBe(false);
    expect(chipAway(SCENE_HANDOVER)).toBe(true);
  });

  it("carrier 0 is born on the chip at the hand-over and the copies exist only for their travel", () => {
    // Born welded, waiting.
    expect(carrierWindow(0, SCENE_HANDOVER - 1e-9).live).toBe(false);
    expect(carrierWindow(0, SCENE_HANDOVER)).toEqual({ e: 0, live: true });
    expect(carrierWindow(0, SCENE_CARRY[0][0])).toEqual({ e: 0, live: true });
    // Landed: the real band takes over on that frame.
    expect(carrierWindow(0, SCENE_CARRY[0][1] - 1e-9).e).toBeCloseTo(1, 6);
    expect(carrierWindow(0, SCENE_CARRY[0][1]).live).toBe(false);
    for (const i of [1, 2]) {
      expect(carrierWindow(i, SCENE_CARRY[i][0] - 1e-9).live).toBe(false);
      expect(carrierWindow(i, SCENE_CARRY[i][0])).toEqual({ e: 0, live: true });
      expect(carrierWindow(i, SCENE_CARRY[i][1]).live).toBe(false);
    }
    // The welds: at 0 the box IS `a`, at 1 it IS `b` — exact, never nearly.
    near(lerpRect(CHIP, HEAD, 0), CHIP, 12, "e = 0 is the chip");
    near(lerpRect(CHIP, HEAD, 1), HEAD, 12, "e = 1 is the head");
    const mid = lerpRect(CHIP, HEAD, 0.5);
    expect(mid.x).toBeCloseTo((CHIP.x + HEAD.x) / 2, 12);
    expect(mid.w).toBeCloseTo((CHIP.w + HEAD.w) / 2, 12);
  });

  it("a plate is held until its band lands, unrolls out of it, then rests", () => {
    for (let i = 0; i < 3; i++) {
      expect(plateState(i, 0)).toBe("held");
      expect(plateState(i, SCENE_CARRY[i][1] - 1e-9)).toBe("held");
      expect(plateState(i, SCENE_CARRY[i][1])).toBe("unroll");
      expect(plateState(i, SCENE_UNROLL[i][1] - 1e-9)).toBe("unroll");
      expect(plateState(i, SCENE_UNROLL[i][1])).toBeNull();
      // The clip's bottom runs from the head's height to the plate's.
      expect(unrollY(i, SCENE_CARRY[i][1], 75, 620)).toBe(75);
      expect(unrollY(i, SCENE_UNROLL[i][0], 75, 620)).toBe(75);
      expect(unrollY(i, SCENE_UNROLL[i][1], 75, 620)).toBeCloseTo(620, 9);
      expect(unrollY(i, (SCENE_UNROLL[i][0] + SCENE_UNROLL[i][1]) / 2, 75, 620)).toBeCloseTo(
        (75 + 620) / 2,
        9
      );
    }
  });

  it("the ground's feather follows its bottom edge into the frame, in the canvas's own fractions", () => {
    const vh = 1000;
    const F = TURN_PROP_FEATHER_VH;
    // Stuck at the top, the ground's end two viewports below the frame: untouched.
    let f = feather(vh + 2 * vh, vh, vh, vh);
    expect(f.hi).toBeLessThanOrEqual(0);
    // The ground's end exactly a feather's length below: the band begins.
    f = feather(vh + F * vh, vh, vh, vh);
    expect(f.hi).toBeCloseTo(0, 12);
    // Its end at the frame's bottom: the band is the bottom F of the frame.
    f = feather(vh, vh, vh, vh);
    expect(f.lo).toBeCloseTo(0, 12);
    expect(f.hi).toBeCloseTo(F, 12);
    // Unstuck and scrolling off, the canvas's bottom IS the ground's: same band.
    f = feather(600, 600, vh, vh);
    expect(f.lo).toBeCloseTo(0, 12);
    expect(f.hi).toBeCloseTo(F, 12);
    // On the old two-viewport canvas the same constant is the old 0.42 band.
    f = feather(2000, 2000, 2 * vh, vh);
    expect(f.lo).toBe(0);
    expect(f.hi).toBeCloseTo(0.42, 12);
    expect(F).toBeGreaterThan(0);
    expect(F).toBeLessThan(2);
  });

  it("the chip's cut is the board's own, not a second number", () => {
    /* ⚠ THE WRITER MAY NOT IMPORT `boardLayout`. It is the arcs' server
       geometry and this is a client module on a route; the one number they
       share is asserted instead. A drift here is a carrier whose corner does
       not match the chip it is covering on the frame it appears. */
    expect(SEAM_CHIP_CUT).toBe(CUT.card);
  });

  it("fits a crop on the MIDDLE, which is not what the map's helper does", () => {
    const fit = fitCropMid({ w: 900, h: 700 }, { w: 800, h: 548 });
    expect(fit.k).toBeCloseTo(900 / 800, 12);
    expect(fit.ox).toBeCloseTo(0, 12);
    expect(fit.oy).toBeCloseTo((700 - 548 * (900 / 800)) / 2, 12);
    expect(fit.oy).toBeGreaterThan(0);
    const tall = fitCropMid({ w: 900, h: 400 }, { w: 800, h: 548 });
    expect(tall.k).toBeCloseTo(400 / 548, 12);
    expect(tall.oy).toBeCloseTo(0, 12);
    expect(tall.ox).toBeGreaterThan(0);
  });

  it("decodes exactly at its ends, deterministically between, and lands before the box", () => {
    const pair = { from: "AI CAPABILITY", to: "M1 · about three weeks" };
    const wall = seamWall([pair, { from: "owned by the team", to: "Setup, insight and briefing" }]);
    expect(wall).toBeGreaterThan(0);
    expect(seamDecodeFrame(pair, 0, wall)).toBe(pair.from);
    expect(seamDecodeFrame(pair, -0.2, wall)).toBe(pair.from);
    expect(seamDecodeFrame(pair, 1, wall)).toBe(pair.to);
    expect(seamDecodeFrame(pair, 1.4, wall)).toBe(pair.to);
    const seeded = () => 0.42;
    expect(seamDecodeFrame(pair, 0.5, wall, seeded)).toBe(seamDecodeFrame(pair, 0.5, wall, seeded));
    // A copy's pair runs band to band, and lands before the travel does.
    const copy = { from: "M1 · about three weeks", to: "M2 · about three weeks" };
    expect(seamDecodeFrame(copy, 1, seamWall([copy]))).toBe(copy.to);
    expect(SCENE_DECODE_END).toBeLessThan(1);
    expect(SCENE_DECODE_END).toBeGreaterThan(0.75);
    /* ⚠ AND IT STARTS LATE: a copy is born ON the band it peels off, and a
       decode from 0 shuffles that band's own words under the reader before
       anything has moved (seen on the still). Words hold until the carrier
       has separated, then transform in flight. */
    expect(SCENE_DECODE_START).toBeGreaterThan(0.1);
    expect(SCENE_DECODE_START).toBeLessThan(SCENE_DECODE_END);
    expect(decodeClock(0)).toBe(0);
    expect(decodeClock(SCENE_DECODE_START)).toBe(0);
    expect(decodeClock(SCENE_DECODE_END)).toBe(1);
    expect(decodeClock(1)).toBe(1);
    expect(decodeClock((SCENE_DECODE_START + SCENE_DECODE_END) / 2)).toBeCloseTo(0.5, 12);
  });

  it("the carrier lives in the stage and reads no document-space value", () => {
    /* ⚠ THE LAYER IS THE STAGE'S CHILD, ABSOLUTE OVER ITS BOX, never on
       `document.body` and never posed from `scrollY`: both ends of every
       travel are stationary in the frame while the stage is pinned, and a
       document-space pose would put the carrier back on the compositor's
       clock. Pinned in the source rather than left to a comment. */
    const src = readFileSync(CARRIER, "utf8");
    expect(src).toMatch(/stage\.appendChild\(layer\)/);
    expect(src).not.toMatch(/document\.body\.appendChild/);
    expect(src).not.toMatch(/scrollY/);
    expect(src, "the writer resolves tokens through a probe, never getPropertyValue").not.toMatch(
      /getPropertyValue\(/
    );
    expect(src, "clientWidth, never innerWidth — innerWidth includes the scrollbar").not.toMatch(
      /window\.innerWidth/
    );
    expect(src, "the fold is the CSS property, never the attribute").not.toMatch(
      /setAttribute\(\s*["']transform["']/
    );
  });
});
