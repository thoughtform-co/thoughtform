import { describe, expect, it } from "vitest";

import { CORE_RECT } from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import {
  VIEW_BOX,
  gridRect,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  PDA_FLIGHT_GUARD_MS,
  PDA_FLIGHT_MS,
  cropOf,
  fitCrop,
  pdaFlight,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaFlight";
import { PDA_SHOWN } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

/**
 * THE FLIGHT'S ARITHMETIC.
 *
 * The morph's whole claim is that the object does not move on screen at the
 * instant the crop changes — it is in the same place, and then it travels.
 * That is an equality between two projections, so it is checkable here rather
 * than by eye; the smoke cannot tell you which term is wrong.
 */

/** Where a rect's centre lands on screen, per `xMidYMid meet`. */
function centre(box: { width: number; height: number }, viewBox: string, r: typeof CORE_RECT) {
  const c = cropOf(viewBox);
  const f = fitCrop(box, c);
  return {
    x: f.ox + (r.x + r.w / 2 - c.x) * f.k,
    y: f.oy + (r.y + r.h / 2 - c.y) * f.k,
    w: r.w * f.k,
  };
}

/** The pose `flPdaDock` starts from, resolved back to screen px. */
function posed(
  box: { width: number; height: number },
  viewBox: string,
  r: typeof CORE_RECT,
  v: { dx: number; dy: number; dk: number }
) {
  const c = cropOf(viewBox);
  const f = fitCrop(box, c);
  /* `transform: translate(dx, dy) scale(dk)` about the fill box's centre —
     the centre moves by the translate, the size scales. */
  const at = centre(box, viewBox, r);
  return { x: at.x + v.dx * f.k, y: at.y + v.dy * f.k, w: at.w * v.dk };
}

/* The console's real field at the reference viewports: 1280x720 is the
   binding one, 1920x1080 the widest reference (ADR-067). */
const FIELDS = [
  { label: "1280x720", box: { width: 611, height: 356 } },
  { label: "1440x800", box: { width: 688, height: 444 } },
  { label: "1920x1080", box: { width: 840, height: 596 } },
  { label: "square", box: { width: 500, height: 500 } },
];

describe("the flight puts the object where it already was", () => {
  for (const { label, box } of FIELDS) {
    it(`1 to 2 leaves the core on the cartridge it grew from (${label})`, () => {
      for (let i = 0; i < PDA_SHOWN; i += 1) {
        const slot = gridRect(i);
        const v = pdaFlight(box, VIEW_BOX[1], slot, VIEW_BOX[2], CORE_RECT);
        expect(v, `slot ${i} produced no flight`).not.toBeNull();

        const was = centre(box, VIEW_BOX[1], slot);
        const start = posed(box, VIEW_BOX[2], CORE_RECT, v!);
        expect(start.x, `slot ${i} x`).toBeCloseTo(was.x, 6);
        expect(start.y, `slot ${i} y`).toBeCloseTo(was.y, 6);
        expect(start.w, `slot ${i} width`).toBeCloseTo(was.w, 6);
      }
    });

    it(`2 to 1 leaves the cartridge on the core it shrank from (${label})`, () => {
      for (let i = 0; i < PDA_SHOWN; i += 1) {
        const slot = gridRect(i);
        const v = pdaFlight(box, VIEW_BOX[2], CORE_RECT, VIEW_BOX[1], slot);
        expect(v, `slot ${i} produced no flight`).not.toBeNull();

        const was = centre(box, VIEW_BOX[2], CORE_RECT);
        const start = posed(box, VIEW_BOX[1], slot, v!);
        expect(start.x, `slot ${i} x`).toBeCloseTo(was.x, 6);
        expect(start.y, `slot ${i} y`).toBeCloseTo(was.y, 6);
        expect(start.w, `slot ${i} width`).toBeCloseTo(was.w, 6);
      }
    });
  }

  it("is a round trip — out and back cancel", () => {
    const box = { width: 611, height: 356 };
    const slot = gridRect(7);
    const out = pdaFlight(box, VIEW_BOX[1], slot, VIEW_BOX[2], CORE_RECT)!;
    const back = pdaFlight(box, VIEW_BOX[2], CORE_RECT, VIEW_BOX[1], slot)!;
    expect(out.dk * back.dk, "the two scales are reciprocal").toBeCloseTo(1, 9);
  });
});

describe("the flight ignores what the casefile does to this subtree", () => {
  it("a uniform ancestor scale cancels out", () => {
    /* The proof arrival ladder translates and the corridor can scale; only
       the box's SIZE may reach this arithmetic, and a uniform scale has to
       leave the deltas in user units untouched. */
    const one = pdaFlight(
      { width: 611, height: 356 },
      VIEW_BOX[1],
      gridRect(3),
      VIEW_BOX[2],
      CORE_RECT
    )!;
    const twice = pdaFlight(
      { width: 1222, height: 712 },
      VIEW_BOX[1],
      gridRect(3),
      VIEW_BOX[2],
      CORE_RECT
    )!;
    expect(twice.dx).toBeCloseTo(one.dx, 9);
    expect(twice.dy).toBeCloseTo(one.dy, 9);
    expect(twice.dk).toBeCloseTo(one.dk, 9);
  });

  it("the core grows into the field, so the cartridge flies in SMALLER", () => {
    /* Sanity on the direction, which a sign error would silently invert:
       reading 02 draws the same object at CORE_K, and its crop is looser, so
       the incoming pose must be under 1. */
    const v = pdaFlight(
      { width: 611, height: 356 },
      VIEW_BOX[1],
      gridRect(0),
      VIEW_BOX[2],
      CORE_RECT
    )!;
    expect(v.dk).toBeLessThan(1);
    expect(v.dk).toBeGreaterThan(0.2);
  });
});

describe("the flight refuses rather than throws", () => {
  it("bails on a collapsed box, which is what the desktop gate leaves", () => {
    // Below 980px (and under reduced motion) the console is `display: none`,
    // so `getBoundingClientRect` reports zeros. A raster is the answer.
    expect(
      pdaFlight({ width: 0, height: 0 }, VIEW_BOX[1], gridRect(0), VIEW_BOX[2], CORE_RECT)
    ).toBeNull();
    expect(
      pdaFlight({ width: 611, height: 0 }, VIEW_BOX[1], gridRect(0), VIEW_BOX[2], CORE_RECT)
    ).toBeNull();
  });

  it("bails on a degenerate rect", () => {
    const box = { width: 611, height: 356 };
    expect(
      pdaFlight(box, VIEW_BOX[1], { x: 0, y: 0, w: 0, h: 10 }, VIEW_BOX[2], CORE_RECT)
    ).toBeNull();
    expect(
      pdaFlight(box, VIEW_BOX[1], gridRect(0), VIEW_BOX[2], { x: 0, y: 0, w: 10, h: 0 })
    ).toBeNull();
  });
});

describe("the two homes are the same object", () => {
  it("the core is the cartridge, near enough that one scale carries it", () => {
    // 250/193 against 176/136 — if these ever diverge, the morph starts
    // visibly changing the object's proportion on the way across.
    const slot = gridRect(0);
    const ratio = CORE_RECT.w / CORE_RECT.h / (slot.w / slot.h);
    expect(Math.abs(ratio - 1), "the two rects stopped being similar").toBeLessThan(0.005);
  });

  it("every slot is inside reading 01's crop", () => {
    const c = cropOf(VIEW_BOX[1]);
    for (let i = 0; i < PDA_SHOWN; i += 1) {
      const r = gridRect(i);
      expect(r.x).toBeGreaterThanOrEqual(c.x);
      expect(r.y).toBeGreaterThanOrEqual(c.y);
      expect(r.x + r.w).toBeLessThanOrEqual(c.x + c.w);
      expect(r.y + r.h).toBeLessThanOrEqual(c.y + c.h);
    }
  });

  it("the guard outlasts the travel", () => {
    // A transition arriving mid-flight has to fall back to the raster, so the
    // guard can never be shorter than the animation it is protecting.
    expect(PDA_FLIGHT_GUARD_MS).toBeGreaterThanOrEqual(PDA_FLIGHT_MS);
  });
});
