import { describe, expect, it } from "vitest";

import {
  configExt,
  configLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import {
  CARRIER_CHIP_K,
  carrierChipMorphIn,
  carrierChipMorphOut,
  carrierLayout,
  carrierPlate,
  carrierSkillDock,
  carrierSkillNameRect,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaCarrier";
import {
  CHIP_FS,
  SKILL_CHIP_H,
  SKILL_CHIP_W,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import {
  gridRect,
  workExt,
  workLayout,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  PDA_FLIGHT_GUARD_MS,
  PDA_FLIGHT_MS,
  PDA_MORPH_MS,
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

/**
 * The three boards this field actually renders — one measurement, as production.
 *
 * ⚠ **THE WORK CARD LOST ITS THIRD HOME** (ADR-071, 2026-08-19). U33's seat
 * in the carrier's hub is gone; on the CARRIER path, 1↔3 and 2↔3 for the
 * work card fall through to bloom / raster. The chip is what flies to the
 * carrier now, and since ADR-070 U34 the carrier is the ONLY reading-03
 * drawing — U25's SECTION, which did give the work card a third home, was
 * retired with its flag.
 */
const boards = (box: { width: number; height: number }) => {
  const aspect = box.height / box.width;
  return {
    one: workLayout(workExt(aspect)),
    two: configLayout(configExt(aspect)),
    carrier: carrierPlate(aspect),
    three: { crop: carrierPlate(aspect).crop },
  };
};

/**
 * ⚠ **READING 03 HAS NO WORK HOME AT ALL, AND THIS IS THE FUNCTION THAT SAYS
 * SO.** It is kept as a named constant rather than inlined because the claim
 * it makes is ADR-071's central one — the work card is a 1↔2 object and the
 * SKILL chip is the 2↔3 one — and a test that simply omitted reading 03
 * would assert nothing about it.
 */
const workThirdHome = (_works: readonly { id: string }[], _id: string): FlightRect | null => null;

function shownWorks() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return selectWorks(visual.districts, visual.works, visual.skills);
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

describe("the skill chip flies between reading 02 and 03 (ADR-071)", () => {
  /**
   * ⚠ **THE SKILL IS THE SECOND FLYING OBJECT** (2026-08-19). The work card's
   * 1↔2 flight is unchanged; the chip takes the 2↔3 axis, landing on the
   * cell whose skill matches the config's `skillId`. The chip's arithmetic
   * is the same `pdaFlight`, but its rects live in DIFFERENT crops (the
   * config board and the carrier), and its landing scale is derived from
   * `CARRIER_LABEL_FS / CHIP_FS` — the flown text lands at the rung the 47
   * arc labels around it sit at.
   */
  const works = shownWorks();
  const configuredWork = works.find((w) => w.configured && w.skillId) ?? works[0];
  const skillId = configuredWork.skillId!;

  const CASES = [
    { label: "1280x720", box: { width: 611, height: 356 } },
    { label: "the owner's (tall)", box: { width: 845, height: 950 } },
  ];
  /** The binding field, named once for the single-case morph assertions. */
  const box611 = { width: 611, height: 356 };

  /** Stub shapes — `carrierLayout` reads only `key` and `name` off them. */
  const STUB_SHAPES = [
    {
      key: "voice",
      name: "VOICE",
      skills: 7,
      gloss: "",
      evalMethod: "",
      meaning: "",
      teams: 0,
      trenchedBy: "",
    },
    {
      key: "judgment",
      name: "JUDGMENT",
      skills: 12,
      gloss: "",
      evalMethod: "",
      meaning: "",
      teams: 0,
      trenchedBy: "",
    },
    {
      key: "validation",
      name: "VALIDATION",
      skills: 9,
      gloss: "",
      evalMethod: "",
      meaning: "",
      teams: 0,
      trenchedBy: "",
    },
    {
      key: "stakeholder",
      name: "STAKEHOLDER",
      skills: 5,
      gloss: "",
      evalMethod: "",
      meaning: "",
      teams: 0,
      trenchedBy: "",
    },
    {
      key: "pattern",
      name: "PATTERN",
      skills: 14,
      gloss: "",
      evalMethod: "",
      meaning: "",
      teams: 0,
      trenchedBy: "",
    },
  ] as const;

  const liveCells = () => carrierLayout({ shapes: STUB_SHAPES, skills: liveSkills() }).cells;

  /* The chip's homes at one field. Reading 02's is the SKILL slot; the
     carrier's is the arc midpoint of the cell that letters this skillId. */
  const chipHomes = (box: { width: number; height: number }) => {
    const two = configLayout(configExt(box.height / box.width));
    const carrier = carrierPlate(box.height / box.width);
    const cell = liveCells().find((c) => c.skill.id === skillId);
    if (!cell) return null;
    return {
      twoCrop: two.crop,
      chip: two.skillChip,
      carrierCrop: carrier.crop,
      dock: carrierSkillDock(cell),
      cell,
    };
  };

  {
    for (const { label, box } of CASES) {
      it(`2 to 3 lands the chip on its cell (${label})`, () => {
        const homes = chipHomes(box);
        expect(homes, `no chip home resolved @ ${label}`).not.toBeNull();
        if (!homes) return;
        const v = pdaFlight(box, homes.twoCrop, homes.chip, homes.carrierCrop, homes.dock);
        expect(v, "2→3 produced no flight").not.toBeNull();
        const was = centre(box, homes.twoCrop, homes.chip);
        const start = posed(box, homes.carrierCrop, homes.dock, v!);
        /* CENTRE ALIGNMENT — the chip visually enters the flight from its
           config home. `pdaFlight` is centre-to-centre, so both terms match. */
        expect(start.x, `2→3 x @ ${label}`).toBeCloseTo(was.x, 6);
        expect(start.y, `2→3 y @ ${label}`).toBeCloseTo(was.y, 6);
        expect(start.w, `2→3 width @ ${label}`).toBeCloseTo(was.w, 6);
      });

      it(`3 to 2 lands the chip back at its config home (${label})`, () => {
        const homes = chipHomes(box);
        expect(homes, `no chip home resolved @ ${label}`).not.toBeNull();
        if (!homes) return;
        const v = pdaFlight(box, homes.carrierCrop, homes.dock, homes.twoCrop, homes.chip);
        expect(v, "3→2 produced no flight").not.toBeNull();
        const was = centre(box, homes.carrierCrop, homes.dock);
        const start = posed(box, homes.twoCrop, homes.chip, v!);
        expect(start.x, `3→2 x @ ${label}`).toBeCloseTo(was.x, 6);
        expect(start.y, `3→2 y @ ${label}`).toBeCloseTo(was.y, 6);
        expect(start.w, `3→2 width @ ${label}`).toBeCloseTo(was.w, 6);
      });

      it(`2↔3 is a round trip (${label})`, () => {
        const homes = chipHomes(box);
        expect(homes, `no chip home resolved @ ${label}`).not.toBeNull();
        if (!homes) return;
        const out = pdaFlight(box, homes.twoCrop, homes.chip, homes.carrierCrop, homes.dock)!;
        const back = pdaFlight(box, homes.carrierCrop, homes.dock, homes.twoCrop, homes.chip)!;
        expect(out.dk * back.dk, "the two scales are reciprocal").toBeCloseTo(1, 9);
      });
    }

    it("the chip's landing dock is EXACTLY similar to its source", () => {
      /* The chip is a fixed silhouette (`SKILL_CHIP_W × SKILL_CHIP_H`), and
         the carrier dock is that box × `CARRIER_CHIP_K`. Similarity is by
         construction: one uniform `dk` carries it without distortion. */
      const homes = chipHomes({ width: 611, height: 356 });
      expect(homes).not.toBeNull();
      if (!homes) return;
      const src = homes.chip;
      const dst = homes.dock;
      expect(src.w / src.h, "the source is the chip's own aspect").toBeCloseTo(
        SKILL_CHIP_W / SKILL_CHIP_H,
        12
      );
      expect(dst.w, "the dock is the chip × CARRIER_CHIP_K").toBeCloseTo(
        SKILL_CHIP_W * CARRIER_CHIP_K,
        9
      );
      expect(dst.h).toBeCloseTo(SKILL_CHIP_H * CARRIER_CHIP_K, 9);
      expect(dst.w / dst.h).toBeCloseTo(src.w / src.h, 12);
    });

    it("CARRIER_CHIP_K is the plate's own label rung over the chip's type", () => {
      /* Same rule the seat card followed one revision earlier: the flown
         text lands at the size the labels around it letter at. */
      expect(CARRIER_CHIP_K * CHIP_FS).toBeCloseTo(13, 9);
      expect(CARRIER_CHIP_K).toBeLessThan(1); // a shrinking flight, always
    });

    /* ── THE MORPH (ADR-071 U1) ──────────────────────────────────────────
       The plate's journey is the path itself: CSS `d` interpolates from the
       chip's rectangle into the cell's own ring. That interpolation has ONE
       precondition — identical command structure on both ends — and failing
       it does not error, it snaps the animation to a discrete jump, which is
       the floating-frame defect this pass exists to remove. So the structure
       is pinned here for EVERY configured stream's cell, not just the one a
       viewer happened to open. */

    const points = (d: string) =>
      [...d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((m) => ({
        x: Number(m[1]),
        y: Number(m[2]),
      }));
    const structure = (d: string) => ({
      m: (d.match(/M/g) ?? []).length,
      l: (d.match(/L/g) ?? []).length,
      z: (d.match(/Z/g) ?? []).length,
    });
    const bounds = (pts: readonly { x: number; y: number }[]) => ({
      x0: Math.min(...pts.map((p) => p.x)),
      y0: Math.min(...pts.map((p) => p.y)),
      x1: Math.max(...pts.map((p) => p.x)),
      y1: Math.max(...pts.map((p) => p.y)),
    });

    it("both morph directions share ONE command structure, for every configured stream", () => {
      const box = { width: 611, height: 356 };
      const two = configLayout(configExt(box.height / box.width));
      const carrier = carrierPlate(box.height / box.width);
      const cells = liveCells();
      for (const w of works) {
        if (!w.configured || !w.skillId) continue;
        const cell = cells.find((c) => c.skill.id === w.skillId);
        expect(cell, `${w.id}'s skill has no cell`).toBeDefined();
        if (!cell) continue;
        const inVars = pdaFlight(
          box,
          two.crop,
          two.skillChip,
          carrier.crop,
          carrierSkillDock(cell)
        )!;
        const outVars = pdaFlight(
          box,
          carrier.crop,
          carrierSkillDock(cell),
          two.crop,
          two.skillChip
        )!;
        for (const [dir, morph] of [
          ["in", carrierChipMorphIn(cell, inVars)],
          ["out", carrierChipMorphOut(cell, outVars, two.skillChip)],
        ] as const) {
          const from = structure(morph.from);
          const to = structure(morph.to);
          expect(from, `${w.id} ${dir}: command structures differ`).toEqual(to);
          expect(from.m, `${w.id} ${dir}: not a single subpath`).toBe(1);
          expect(from.z, `${w.id} ${dir}: not closed`).toBe(1);
          expect(
            points(morph.from).length,
            `${w.id} ${dir}: point counts differ — CSS d snaps discrete`
          ).toBe(points(morph.to).length);
        }
      }
    });

    it("the arriving morph settles into the cell's OWN d — the same string", () => {
      /* Not "a path that looks like the cell" — the SAME string the drawn
         cell carries, byte for byte, so the closing fade removes a layer
         that is pixel-identical to what is beneath it. */
      const homes = chipHomes({ width: 611, height: 356 });
      expect(homes).not.toBeNull();
      if (!homes) return;
      const vars = pdaFlight(box611, homes.twoCrop, homes.chip, homes.carrierCrop, homes.dock)!;
      const morph = carrierChipMorphIn(homes.cell, vars);
      expect(morph.to).toBe(homes.cell.d);
    });

    it("the arriving morph enters at the flight's own pose", () => {
      /* The morph's `from` rect IS the pose `dx/dy/dk` describe — the chip
         appears where the reader last saw it. A drifted derivation would
         make the plate jump at liftoff, before any animation plays. */
      const homes = chipHomes({ width: 611, height: 356 });
      if (!homes) return;
      const vars = pdaFlight(box611, homes.twoCrop, homes.chip, homes.carrierCrop, homes.dock)!;
      const morph = carrierChipMorphIn(homes.cell, vars);
      const b = bounds(points(morph.from));
      const cx = homes.dock.x + homes.dock.w / 2 + vars.dx;
      const cy = homes.dock.y + homes.dock.h / 2 + vars.dy;
      expect((b.x0 + b.x1) / 2, "entry centre x").toBeCloseTo(cx, 1);
      expect((b.y0 + b.y1) / 2, "entry centre y").toBeCloseTo(cy, 1);
      expect(b.x1 - b.x0, "entry width").toBeCloseTo(homes.dock.w * vars.dk, 1);
      expect(b.y1 - b.y0, "entry height").toBeCloseTo(homes.dock.h * vars.dk, 1);
    });

    it("the departing morph settles into the chip's own rect", () => {
      const homes = chipHomes({ width: 611, height: 356 });
      if (!homes) return;
      const vars = pdaFlight(box611, homes.carrierCrop, homes.dock, homes.twoCrop, homes.chip)!;
      const morph = carrierChipMorphOut(homes.cell, vars, homes.chip);
      const b = bounds(points(morph.to));
      expect(b.x0, "landing left").toBeCloseTo(homes.chip.x, 1);
      expect(b.y0, "landing top").toBeCloseTo(homes.chip.y, 1);
      expect(b.x1 - b.x0, "landing width").toBeCloseTo(homes.chip.w, 1);
      expect(b.y1 - b.y0, "landing height").toBeCloseTo(homes.chip.h, 1);
    });

    it("the flying name lands centred on the cell's own arc-label point", () => {
      /* The name's landing box and the plate's dock are both centred on the
         label arc's midpoint — the name hands over to the arc label at the
         exact point where that label letters. */
      const homes = chipHomes({ width: 611, height: 356 });
      if (!homes) return;
      const name = homes.cell.skill.short.toUpperCase();
      const nameBox = carrierSkillNameRect(homes.cell, name);
      expect(nameBox.x + nameBox.w / 2).toBeCloseTo(homes.dock.x + homes.dock.w / 2, 9);
      expect(nameBox.y + nameBox.h / 2).toBeCloseTo(homes.dock.y + homes.dock.h / 2, 9);
    });
  }

  it("the work card has no home on the carrier (ADR-071)", () => {
    /* ⚠ ADR-071 EXPLICITLY REMOVES THE WORK CARD FROM READING 03. The
       carrier's cells letter Skills, not work streams, and the seat card is
       gone. `workThirdHome` returns `null` for every stream and the console
       blooms 3↔1 / 3↔2 in that case. */
    for (const w of works) {
      expect(
        workThirdHome(works, w.id),
        `${w.id} still has a work-card home on the carrier`
      ).toBeNull();
    }
  });
});

function liveSkills() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return visual.skills;
}

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
    // ⚠ AND THE MORPH'S OWN CLOCK (ADR-071 U1) — the chip flies longer than
    // the dock, and an interrupt inside ITS window is the same teleport.
    expect(PDA_FLIGHT_GUARD_MS).toBeGreaterThanOrEqual(PDA_MORPH_MS);
  });
});
