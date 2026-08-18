import { describe, expect, it } from "vitest";

import {
  configExt,
  configLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import {
  substrateExt,
  substrateLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaSubstrate";
import {
  ESTATE_CELL_H,
  ESTATE_CELL_W,
  estateFootprint,
} from "@/components/landing/home-v2/services/casefile/map/pda/estateBand";
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
import {
  PDA_SHOWN,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";

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

/** The three boards this field actually renders — one measurement, as
 *  production. Reading 03 landed with SECTION's promotion (ADR-070 U25),
 *  so the flight now has THREE homes for the selected work: reading 01's
 *  grid card, reading 02's core seat card, and reading 03's estate
 *  footprint. */
const boards = (box: { width: number; height: number }) => {
  const aspect = box.height / box.width;
  return {
    one: workLayout(workExt(aspect)),
    two: configLayout(configExt(aspect)),
    three: substrateLayout(substrateExt(aspect)),
  };
};

function shownWorks() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return selectWorks(visual.districts, visual.works);
}

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

describe("the flight has a THIRD home on reading 03", () => {
  /**
   * ⚠ **ADR-069 U2 (2026-08-17): the persistent object has three homes.**
   * SECTION promotes an estate band at the top of reading 03; every
   * configured stream on the record has a footprint there, so the flight
   * can fly for every pair — 01 ↔ 02, 01 ↔ 03, 02 ↔ 03.
   *
   * The three tests below are the round trips of each pair on the
   * OWNER'S OWN VIEWPORT — the shape that broke every previous flight
   * assumption (270px of dead panel on U11's crop; 265px on U15's).
   * If the third home ever lands on empty space, this catches it.
   */
  const works = shownWorks();
  const configuredId = works.find((w) => w.configured)?.id ?? works[0].id;
  const iForSlot = works.findIndex((w) => w.id === configuredId);
  const BAND_LEFT = 26;
  const BAND_WIDTH = 880;
  const BAND_Y = 26;

  const CASES = [
    { label: "1280x720", box: { width: 611, height: 356 } },
    { label: "the owner's (tall)", box: { width: 845, height: 950 } },
  ];

  for (const { label, box } of CASES) {
    const { one, two, three } = boards(box);
    const slot = gridRect(iForSlot, one);
    const foot = estateFootprint(works, configuredId, BAND_Y, BAND_LEFT, BAND_WIDTH)!;

    it(`1 to 3 puts the footprint on the cartridge it came from (${label})`, () => {
      const v = pdaFlight(box, one.crop, slot, three.crop, foot);
      expect(v, "1→3 produced no flight").not.toBeNull();
      const was = centre(box, one.crop, slot);
      const start = posed(box, three.crop, foot, v!);
      /* ⚠ HORIZONTAL AND WIDTH are exact; the footprint's aspect is
         within 3 % of the cartridge (40/30 = 1.333 vs 176/136 = 1.294),
         so Y is within `foot.h × 0.03` of the source centre. Same
         tolerance as the config↔grid flight because the seat and grid
         cards ARE the same aspect, and this is close enough that the
         mid-flight object never visibly distorts. */
      expect(start.x, `1→3 x @ ${label}`).toBeCloseTo(was.x, 6);
      expect(start.w, `1→3 width @ ${label}`).toBeCloseTo(was.w, 6);
    });

    it(`3 to 1 puts the cartridge on the footprint it grew from (${label})`, () => {
      const v = pdaFlight(box, three.crop, foot, one.crop, slot);
      expect(v, "3→1 produced no flight").not.toBeNull();
      const was = centre(box, three.crop, foot);
      const start = posed(box, one.crop, slot, v!);
      expect(start.x, `3→1 x @ ${label}`).toBeCloseTo(was.x, 6);
      expect(start.w, `3→1 width @ ${label}`).toBeCloseTo(was.w, 6);
    });

    it(`2 to 3 puts the footprint on the core it came from (${label})`, () => {
      const v = pdaFlight(box, two.crop, two.core, three.crop, foot);
      expect(v, "2→3 produced no flight").not.toBeNull();
      const was = centre(box, two.crop, two.core);
      const start = posed(box, three.crop, foot, v!);
      expect(start.x, `2→3 x @ ${label}`).toBeCloseTo(was.x, 6);
      expect(start.w, `2→3 width @ ${label}`).toBeCloseTo(was.w, 6);
    });

    it(`3 to 2 puts the core on the footprint it came from (${label})`, () => {
      const v = pdaFlight(box, three.crop, foot, two.crop, two.core);
      expect(v, "3→2 produced no flight").not.toBeNull();
      const was = centre(box, three.crop, foot);
      const start = posed(box, two.crop, two.core, v!);
      expect(start.x, `3→2 x @ ${label}`).toBeCloseTo(was.x, 6);
      expect(start.w, `3→2 width @ ${label}`).toBeCloseTo(was.w, 6);
    });
  }

  it("the footprint aspect is CLOSE to the cartridge — within 5 %", () => {
    /* ⚠ **THE THIRD RUNG'S ADR-069 PARITY** (2026-08-17). The card, the
     *  core seat card and the footprint are three sizes of one object.
     *  The two full cards are exactly similar (`CARD.cut × CORE_K` =
     *  `SEAT.cut`); the footprint is a simplified silhouette, so the
     *  parity here is weaker but real — a 5 % aspect delta is small
     *  enough that the flight's uniform `dk` carries the object without
     *  visible distortion. Any wider and the drawing at either home
     *  starts reading as a different shape mid-flight, which is exactly
     *  the defect ADR-069 U1 fixed on the 01 ↔ 02 pair.
     */
    const cartridge = 176 / 136;
    const footprint = ESTATE_CELL_W / ESTATE_CELL_H;
    const delta = Math.abs(cartridge - footprint) / cartridge;
    expect(
      delta,
      `footprint aspect ${footprint.toFixed(3)} vs cartridge ${cartridge.toFixed(3)}`
    ).toBeLessThan(0.05);
  });

  it("estateFootprint returns null when the stream is not on the board", () => {
    expect(
      estateFootprint(works, "W-ghost", BAND_Y, BAND_LEFT, BAND_WIDTH),
      "estateFootprint made up a home for a non-existent stream"
    ).toBeNull();
  });

  it("estateFootprint returns null when no stream is selected", () => {
    expect(estateFootprint(works, null, BAND_Y, BAND_LEFT, BAND_WIDTH)).toBeNull();
  });

  it("every configured stream has a lookup-able footprint", () => {
    /* ⚠ THE FLIGHT'S THIRD HOME MUST EXIST FOR EVERY STREAM THE READER
       CAN OPEN. If a `PdaWork` is on the projected board but not in the
       estate band, the flight would return null for 03 and fall back to
       raster — silently, so the reader would not notice. */
    for (const w of works) {
      const foot = estateFootprint(works, w.id, BAND_Y, BAND_LEFT, BAND_WIDTH);
      expect(foot, `${w.id} has no footprint on the estate band`).not.toBeNull();
    }
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
