import { describe, expect, it } from "vitest";

import { BAKE_H } from "@/components/landing/home-v2/services/hologram/ringCtaBox";
import {
  RASTER_QUIET_EASE,
  RASTER_QUIET_FOOT,
  RASTER_QUIET_FOOT_PHONE,
  RASTER_QUIET_HEAD,
  RASTER_QUIET_HEAD_PHONE,
  RASTER_QUIET_LEVEL,
  LEAD_PLATE_PAD_X,
  LEAD_PLATE_PAD_Y,
  leadPlateBox,
  REVEAL_DAMP_RATE,
  REVEAL_GRID_MIN,
  REVEAL_POP_GRID,
  rasterQuiet,
  rasterQuietAt,
  revealBandEaseUv,
  revealBandsUv,
  revealGrid,
  revealPop,
  smoothstep,
} from "@/lib/services-ring/reveal";

/* The type's occupancy on the display treatment, in bake px — the ring's own
   private constants restated so a move there fails here:
     title cap top   TITLE_HEAD_CAP_TOP = TIGHT_EXPAND_INSET + TIGHT_EXPAND_SIZE + 50 = 140
     title line 2    140 + 44 (the display cap) + 74 (its leading) = 258
     paragraph       four lines on a last baseline of TIGHT_COPY_BOTTOM = BAKE_H − 72 = 1288
                     at a 50px leading, cap ~25 → the block's top ≈ 1113 */
const TITLE_BOTTOM = 258;
const PARA_TOP = BAKE_H - 72 - 3 * 50 - 25;

describe("the portrait raster's quiet zones", () => {
  it("clear the title and the paragraph on the display treatment", () => {
    expect(RASTER_QUIET_HEAD).toBeGreaterThanOrEqual(TITLE_BOTTOM + 40);
    expect(RASTER_QUIET_FOOT).toBeLessThanOrEqual(PARA_TOP - 50);
    // And the ease stays inside the field, never reaching back into a band.
    expect(RASTER_QUIET_HEAD + RASTER_QUIET_EASE).toBeLessThan(
      RASTER_QUIET_FOOT - RASTER_QUIET_EASE
    );
  });

  it("are uniformly quiet in the bands, loud in the field, and eased between", () => {
    expect(rasterQuiet(0)).toBe(RASTER_QUIET_LEVEL);
    expect(rasterQuiet(RASTER_QUIET_HEAD)).toBe(RASTER_QUIET_LEVEL);
    expect(rasterQuiet(RASTER_QUIET_HEAD + RASTER_QUIET_EASE)).toBe(1);
    expect(rasterQuiet(BAKE_H / 2)).toBe(1);
    expect(rasterQuiet(RASTER_QUIET_FOOT - RASTER_QUIET_EASE)).toBe(1);
    expect(rasterQuiet(RASTER_QUIET_FOOT)).toBe(RASTER_QUIET_LEVEL);
    expect(rasterQuiet(BAKE_H)).toBe(RASTER_QUIET_LEVEL);
    // Monotonic through each ease.
    let prev = rasterQuiet(RASTER_QUIET_HEAD);
    for (let y = RASTER_QUIET_HEAD; y <= RASTER_QUIET_HEAD + RASTER_QUIET_EASE; y += 1) {
      const q = rasterQuiet(y);
      expect(q).toBeGreaterThanOrEqual(prev);
      prev = q;
    }
  });

  it("publish the same two bands to the shader, in the plane's flipped UV", () => {
    const [lo, hi] = revealBandsUv();
    expect(lo).toBeCloseTo(1 - RASTER_QUIET_FOOT / BAKE_H, 6);
    expect(hi).toBeCloseTo(1 - RASTER_QUIET_HEAD / BAKE_H, 6);
    expect(lo).toBeGreaterThan(0);
    expect(hi).toBeLessThan(1);
    expect(lo).toBeLessThan(hi);
    expect(revealBandEaseUv()).toBeCloseTo(RASTER_QUIET_EASE / BAKE_H, 6);
  });
});

describe("the reveal's ramps", () => {
  it("are GLSL's smoothstep, not the Perlin quintic", () => {
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 0.25)).toBeCloseTo(0.15625, 9); // 3t² − 2t³
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
  });

  it("start at nothing and end crisp, without ever going backwards", () => {
    expect(revealPop(0)).toBe(0);
    expect(revealGrid(0)).toBe(0);
    expect(revealPop(1)).toBe(1);
    expect(revealGrid(1)).toBe(1);
    // Every cell has popped before the mosaic finishes refining.
    expect(revealPop(0.85)).toBe(1);
    expect(revealGrid(0.85)).toBeLessThan(1);
    // The mosaic holds its coarsest grid while the first cells arrive.
    expect(revealGrid(0.15)).toBe(0);
    expect(revealPop(0.15)).toBeGreaterThan(0);
    let pop = 0;
    let grid = 0;
    for (let k = 0; k <= 200; k++) {
      const r = k / 200;
      const p = revealPop(r);
      const g = revealGrid(r);
      expect(p).toBeGreaterThanOrEqual(pop);
      expect(g).toBeGreaterThanOrEqual(grid);
      pop = p;
      grid = g;
    }
  });

  it("refine from a coarser grid than the pop grid, on a slower clock than the veil", () => {
    expect(REVEAL_GRID_MIN[0]).toBeLessThan(REVEAL_POP_GRID[0]);
    expect(REVEAL_GRID_MIN[1]).toBeLessThan(REVEAL_POP_GRID[1]);
    // Square cells on the 840 × 1360 face, both grids.
    expect(840 / REVEAL_POP_GRID[0]).toBeCloseTo(1360 / REVEAL_POP_GRID[1], 0);
    expect(840 / REVEAL_GRID_MIN[0]).toBeCloseTo(1360 / REVEAL_GRID_MIN[1], 0);
    // The veil's own rate is 7; the reveal must be slower or the mosaic is
    // never seen refining. Frame-stepped at 60 Hz: ≈ 0.49 at 150ms.
    expect(REVEAL_DAMP_RATE).toBeLessThan(7);
    let level = 0;
    for (let t = 0; t < 0.15; t += 1 / 60)
      level += (1 - level) * Math.min(1, REVEAL_DAMP_RATE / 60);
    expect(level).toBeGreaterThan(0.4);
    expect(level).toBeLessThan(0.6);
  });
});

describe("the lead plate sits inside the raster's quiet head (ADR-126 §4)", () => {
  /* The display name's cap block on both rungs, restated from the ring's
     private constants (see TITLE_BOTTOM above): cap top 140 on both; the
     desktop's cap 44 on a 74 leading, the phone's 52 on 88 (FACE_PHONE_RUNGS). */
  it("on the desktop, one line", () => {
    const box = leadPlateBox(140, 44, 1, 74);
    expect(box.top).toBe(140 - LEAD_PLATE_PAD_Y);
    expect(box.bottom).toBe(140 + 44 + LEAD_PLATE_PAD_Y);
    expect(box.bottom).toBeLessThanOrEqual(RASTER_QUIET_HEAD);
  });
  it("on the phone, even at two lines", () => {
    expect(leadPlateBox(140, 52, 1, 88).bottom).toBeLessThanOrEqual(RASTER_QUIET_HEAD_PHONE);
    expect(leadPlateBox(140, 52, 2, 88).bottom).toBeLessThanOrEqual(RASTER_QUIET_HEAD_PHONE);
  });
  it("pads the name, never the card", () => {
    // The plate is the type's box padded — narrower than the card by any
    // margin, so it can never read as a band across the face.
    expect(LEAD_PLATE_PAD_X).toBeLessThan(60);
    expect(LEAD_PLATE_PAD_Y).toBe(24);
  });
});

describe("the phone face's quiet zones (ADR-115 U2)", () => {
  it("are the same function with the phone's two bands bound; the desktop's is untouched", () => {
    for (let y = 0; y <= BAKE_H; y += 1) {
      expect(rasterQuiet(y)).toBe(rasterQuietAt(y, RASTER_QUIET_HEAD, RASTER_QUIET_FOOT));
    }
    // Two lines of 74/88 from a 140 cap top (+40 of ease); five lines of
    // 50/68 on the 1288 baseline (cap 35, 50 of air).
    expect(RASTER_QUIET_HEAD_PHONE).toBeGreaterThanOrEqual(140 + 52 + 88 + 40);
    expect(RASTER_QUIET_FOOT_PHONE).toBeLessThanOrEqual(BAKE_H - 72 - 4 * 68 - 35 - 50);
    expect(RASTER_QUIET_HEAD_PHONE + RASTER_QUIET_EASE).toBeLessThan(
      RASTER_QUIET_FOOT_PHONE - RASTER_QUIET_EASE
    );
    const q = (y: number) => rasterQuietAt(y, RASTER_QUIET_HEAD_PHONE, RASTER_QUIET_FOOT_PHONE);
    expect(q(RASTER_QUIET_HEAD_PHONE)).toBe(RASTER_QUIET_LEVEL);
    expect(q(RASTER_QUIET_HEAD_PHONE + RASTER_QUIET_EASE)).toBe(1);
    expect(q(RASTER_QUIET_FOOT_PHONE - RASTER_QUIET_EASE)).toBe(1);
    expect(q(RASTER_QUIET_FOOT_PHONE)).toBe(RASTER_QUIET_LEVEL);
  });
});
