import { describe, expect, it } from "vitest";

import {
  configExt,
  configLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import {
  gridRect,
  workExt,
  workLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  PDA_FLIGHT_GUARD_MS,
  PDA_FLIGHT_MS,
  type FlightRect,
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
 *
 * ⚠ **BOTH BOARDS ARE LIVE NOW (ADR-070 U15), AND THIS FILE WALKS THEM.** Until
 * 2026-08-12 it passed the static `VIEW_BOX[1]` in eight places while reading
 * 02 had been elastic since U12. That was survivable only because reading 01
 * was static too; the moment its grid started moving with the field, a test
 * pinned to the resting crop would have gone VACUOUS rather than red — still
 * green, no longer guarding the string production renders. Every case below
 * derives both layouts from the field it is testing, exactly as `PdaConsole`
 * does.
 */

/** Where a rect's centre lands on screen. ⚠ `xMidYMin` — `fitCrop` hardcodes
 *  the anchor and the SVG's attribute repeats it; they move together. */
function centre(box: { width: number; height: number }, viewBox: string, r: FlightRect) {
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
  r: FlightRect,
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
   binding one, 1920x1080 the widest reference (ADR-067), and the owner's own
   window is the TALL case both elastic boards were written for. */
const FIELDS = [
  { label: "1280x720", box: { width: 611, height: 356 } },
  { label: "1440x800", box: { width: 688, height: 444 } },
  { label: "1920x1080", box: { width: 840, height: 596 } },
  { label: "the owner's (tall)", box: { width: 845, height: 950 } },
  { label: "square", box: { width: 500, height: 500 } },
];

/** The two boards this field actually renders — one measurement, as production. */
const boards = (box: { width: number; height: number }) => {
  const aspect = box.height / box.width;
  return { one: workLayout(workExt(aspect)), two: configLayout(configExt(aspect)) };
};

describe("the flight puts the object where it already was", () => {
  for (const { label, box } of FIELDS) {
    const { one, two } = boards(box);

    it(`1 to 2 leaves the core on the cartridge it grew from (${label})`, () => {
      for (let i = 0; i < PDA_SHOWN; i += 1) {
        const slot = gridRect(i, one);
        const v = pdaFlight(box, one.crop, slot, two.crop, two.core);
        expect(v, `slot ${i} produced no flight`).not.toBeNull();

        const was = centre(box, one.crop, slot);
        const start = posed(box, two.crop, two.core, v!);
        expect(start.x, `slot ${i} x`).toBeCloseTo(was.x, 6);
        expect(start.y, `slot ${i} y`).toBeCloseTo(was.y, 6);
        expect(start.w, `slot ${i} width`).toBeCloseTo(was.w, 6);
      }
    });

    it(`2 to 1 leaves the cartridge on the core it shrank from (${label})`, () => {
      for (let i = 0; i < PDA_SHOWN; i += 1) {
        const slot = gridRect(i, one);
        const v = pdaFlight(box, two.crop, two.core, one.crop, slot);
        expect(v, `slot ${i} produced no flight`).not.toBeNull();

        const was = centre(box, two.crop, two.core);
        const start = posed(box, one.crop, slot, v!);
        expect(start.x, `slot ${i} x`).toBeCloseTo(was.x, 6);
        expect(start.y, `slot ${i} y`).toBeCloseTo(was.y, 6);
        expect(start.w, `slot ${i} width`).toBeCloseTo(was.w, 6);
      }
    });
  }

  it("is a round trip — out and back cancel", () => {
    const box = { width: 611, height: 356 };
    const { one, two } = boards(box);
    const slot = gridRect(7, one);
    const out = pdaFlight(box, one.crop, slot, two.crop, two.core)!;
    const back = pdaFlight(box, two.crop, two.core, one.crop, slot)!;
    expect(out.dk * back.dk, "the two scales are reciprocal").toBeCloseTo(1, 9);
  });
});

describe("the flight ignores what the casefile does to this subtree", () => {
  it("a uniform ancestor scale cancels out", () => {
    /* The proof arrival ladder translates and the corridor can scale; only
       the box's SIZE may reach this arithmetic, and a uniform scale has to
       leave the deltas in user units untouched.
       ⚠ The two boxes below have the SAME aspect, so they resolve to the same
       pair of boards — which is the point: a scale is not a reshape. */
    const { one, two } = boards({ width: 611, height: 356 });
    const one_ = pdaFlight(
      { width: 611, height: 356 },
      one.crop,
      gridRect(3, one),
      two.crop,
      two.core
    )!;
    const twice = pdaFlight(
      { width: 1222, height: 712 },
      one.crop,
      gridRect(3, one),
      two.crop,
      two.core
    )!;
    expect(twice.dx).toBeCloseTo(one_.dx, 9);
    expect(twice.dy).toBeCloseTo(one_.dy, 9);
    expect(twice.dk).toBeCloseTo(one_.dk, 9);
  });

  it("the core grows into the field, so the cartridge flies in SMALLER", () => {
    /* Sanity on the direction, which a sign error would silently invert:
       reading 02 draws the same object at CORE_K, and its crop is looser, so
       the incoming pose must be under 1. */
    const box = { width: 611, height: 356 };
    const { one, two } = boards(box);
    const v = pdaFlight(box, one.crop, gridRect(0, one), two.crop, two.core)!;
    expect(v.dk).toBeLessThan(1);
    expect(v.dk).toBeGreaterThan(0.2);
  });
});

describe("the flight refuses rather than throws", () => {
  const { one, two } = boards({ width: 611, height: 356 });

  it("bails on a collapsed box, which is what the desktop gate leaves", () => {
    // Below 980px (and under reduced motion) the console is `display: none`,
    // so `getBoundingClientRect` reports zeros. A raster is the answer.
    expect(
      pdaFlight({ width: 0, height: 0 }, one.crop, gridRect(0, one), two.crop, two.core)
    ).toBeNull();
    expect(
      pdaFlight({ width: 611, height: 0 }, one.crop, gridRect(0, one), two.crop, two.core)
    ).toBeNull();
  });

  it("bails on a degenerate rect", () => {
    const box = { width: 611, height: 356 };
    expect(pdaFlight(box, one.crop, { x: 0, y: 0, w: 0, h: 10 }, two.crop, two.core)).toBeNull();
    expect(
      pdaFlight(box, one.crop, gridRect(0, one), two.crop, { x: 0, y: 0, w: 10, h: 0 })
    ).toBeNull();
  });
});

describe("the two homes are the same object", () => {
  it("the core is the cartridge, near enough that one scale carries it", () => {
    // If these ever diverge, the morph starts visibly changing the object's
    // proportion on the way across. ⚠ Checked at EVERY field shape: both
    // boards move now, and the card is the one thing on either that may not.
    for (const { label, box } of FIELDS) {
      const { one, two } = boards(box);
      const slot = gridRect(0, one);
      const ratio = two.core.w / two.core.h / (slot.w / slot.h);
      expect(Math.abs(ratio - 1), `${label}: the two rects stopped being similar`).toBeLessThan(
        0.005
      );
    }
  });

  it("every slot is inside reading 01's crop, at every field shape", () => {
    for (const { label, box } of FIELDS) {
      const { one } = boards(box);
      const c = cropOf(one.crop);
      for (let i = 0; i < PDA_SHOWN; i += 1) {
        const r = gridRect(i, one);
        expect(r.x, `${label} slot ${i}`).toBeGreaterThanOrEqual(c.x);
        expect(r.y, `${label} slot ${i}`).toBeGreaterThanOrEqual(c.y);
        expect(r.x + r.w, `${label} slot ${i}`).toBeLessThanOrEqual(c.x + c.w);
        expect(r.y + r.h, `${label} slot ${i}`).toBeLessThanOrEqual(c.y + c.h);
      }
    }
  });

  it("the guard outlasts the travel", () => {
    // A transition arriving mid-flight has to fall back to the raster, so the
    // guard window may never be shorter than the animation it protects.
    expect(PDA_FLIGHT_GUARD_MS).toBeGreaterThanOrEqual(PDA_FLIGHT_MS);
  });
});
