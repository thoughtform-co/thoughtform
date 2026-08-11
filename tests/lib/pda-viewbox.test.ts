import { describe, expect, it } from "vitest";

import {
  configSpecWidth,
  configurationLettering,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaConfiguration";
import { VIEW_BOX } from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  CART_TYPE,
  MONO_ADVANCE,
  cartTitleChars,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import {
  PDA_SHOWN,
  type PdaWork,
  toPdaWork,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type { CaseMapDistrict, CaseMapWork } from "@/lib/cases/types";
import { getCase } from "@/lib/cases/registry";

/**
 * THE MAP'S CROPS AND ITS TYPE (ADR-063 U1).
 *
 * The arithmetic half of a two-part guard. This checks the crops contain what
 * the drawings declare and that the type sizes fit the boxes they sit in; the
 * smoke measures real glyph boxes in a real browser. NEITHER IS SUFFICIENT —
 * the arithmetic cannot see a CSS change, and the smoke cannot tell you which
 * constant to move.
 */

/**
 * ⚠ THE FLOOR THE OWNER SET (ADR-070 U10, 2026-08-11). U4's floor was 10,
 * which is 5.4px at the binding preset and 8.3px at 1920 — under the 8.5px
 * chrome floor ADR-063 already records as this surface's standing defect.
 * The verdict on the keys was "utterly illegible", and it is arithmetic
 * rather than taste: a label nobody can read is not a quiet label, it is an
 * absent one.
 */
const FS_FLOOR = 12;

function box(v: 1 | 2 | 3) {
  const [x, y, w, h] = VIEW_BOX[v].split(" ").map(Number);
  return { x, y, w, h, right: x + w, bottom: y + h };
}

function mapVisual() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return visual;
}

/** Live work titles — the drawing letters these, so they set the measure. */
function workTitles(): string[] {
  return mapVisual().works.map((w) => w.title.toUpperCase());
}

/**
 * ALL TWENTY-SEVEN, projected the way the drawing projects them.
 *
 * Reading 01 shows twenty, but reading 02 will letter ANY of them — the reader
 * chooses — so the fit guard has to walk the whole record. The seven the grid
 * leaves out are exactly where an over-long string would hide.
 */
function allWorks(): PdaWork[] {
  const visual = mapVisual();
  const districts: readonly CaseMapDistrict[] = visual.districts;
  return visual.works.map((w: CaseMapWork) =>
    toPdaWork(
      w,
      districts.find((d) => d.id === w.dist)
    )
  );
}

describe("the readings' crops", () => {
  /* Declared extents, from each view's own geometry. 01 is the 4x5 grid
     (`GX`/`GY` + the 176x136 cartridge); 03 from its top rule to the bottom
     section label. */
  const CONTENT = {
    1: { x: 12, y: 22, right: 12 + 3 * 192 + 176, bottom: 22 + 4 * 158 + 136 },
    /* 02 is the owner's unit board, PORTRAIT since ADR-070 U4. Content runs
       from the chrome's own left edge (40) and the left node (36) across to
       the right node's outer wall (864), and from the chrome's line box down
       through the base node's floor (990). */
    /* Since U8 the board opens on the OWNER PLATE — the top-left chrome is
       deleted, so the first content is the plate's own top edge at 72 and
       the leftmost is the left node's wall at 60. */
    2: { x: 60, y: 72, right: 840, bottom: 945 },
    // 03 lost its two section rules 2026-08-06 (owner) — the foot already
    // said it — and the crop tightened from 718 units to 632 behind them.
    3: { x: 10, y: 93, right: 766, bottom: 702 },
  } as const;

  for (const v of [1, 2, 3] as const) {
    it(`reading ${v} contains everything it draws`, () => {
      const b = box(v);
      const c = CONTENT[v];
      expect(b.x, `crop starts right of the content`).toBeLessThanOrEqual(c.x);
      expect(b.y, `crop starts below the content`).toBeLessThanOrEqual(c.y);
      expect(b.right, `crop ends left of the content`).toBeGreaterThanOrEqual(c.right);
      expect(b.bottom, `crop ends above the content`).toBeGreaterThanOrEqual(c.bottom);
    });

    it(`reading ${v} does not waste height it could spend on type`, () => {
      // The drawing is HEIGHT-BOUND at every desktop viewport, so slack here
      // is a direct tax on rendered type. 40 units is breathing room; the
      // pre-crop box wasted 82, 288 and 132.
      const b = box(v);
      const c = CONTENT[v];
      expect(b.h - (c.bottom - c.y), `reading ${v} wastes vertical units`).toBeLessThanOrEqual(40);
    });
  }

  it("reading 02's crop is LANDSCAPE — it has to fill a laptop panel", () => {
    /* ⚠ THE ASPECT IS STILL THE CONTRACT — IT INVERTED (ADR-070 U10, owner).
       `meet` scales by the minimum ratio, so the crop's aspect decides which
       axis wastes. The console's field is capped at 850px wide but grows with
       viewport height, so it is LANDSCAPE on laptops and PORTRAIT on tall
       screens. Measured on the live landing:

         viewport     field       aspect   828x912 waste   1000x912 waste
         1280x720     603x493     1.223    155 across      62 across
         1440x800     679x548     1.239    181 across      78 across
         1920x1080    850x760     1.118    160 across      17 across
         2560x1440    850x1120    0.759    184 down        345 down

       One crop cannot fill both ends. U4 chose portrait and paid on laptops;
       U10 is the owner's call the other way — the laptop and the 1920
       reference win, at the named cost of more vertical letterbox and ~17 %
       smaller type on tall large monitors. The contract did not disappear,
       so neither does the assertion. */
    const b = box(2);
    expect(b.w / b.h, "reading 02's crop went portrait again").toBeGreaterThanOrEqual(1.05);

    /* ⚠ AND THE COST AT THE OTHER END IS BOUNDED. At the tall field the fit
       is WIDTH-bound, so a crop that keeps widening shrinks the type there
       without limit. At 850x1120 the smallest rung has to stay over the
       smoke's 4.3px floor with room to spare. */
    const tall = Math.min(850 / b.w, 1120 / b.h);
    expect(FS_FLOOR * tall, "the tall field's type fell toward the floor").toBeGreaterThan(9);

    /* The binding short-wide field, where the drawing is height-bound. */
    const meet = Math.min(603 / b.w, 493 / b.h);
    expect(FS_FLOOR * meet, "the smallest rung fell under the smoke's floor").toBeGreaterThan(4.6);
  });
});

describe("the cartridge's type fits its box", () => {
  /* 176-unit cartridge: the title is anchored to the left wall alone and runs
     to `w - 19`; the metadata rows are PAIRS pinned to opposite walls and
     share one `w - 25` measure between them. */
  const W = 176;
  const TITLE_MEASURE = W - 19;
  const PAIR_MEASURE = W - 25;

  it("every live title fits one line", () => {
    const titles = workTitles();
    expect(titles.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const t of titles.slice(0, PDA_SHOWN)) {
      const width = t.length * CART_TYPE.title * MONO_ADVANCE;
      expect(width, `"${t}" runs past the cartridge wall`).toBeLessThanOrEqual(TITLE_MEASURE);
      // ...and the wrapper agrees, so no title splits onto a second line.
      // A wrapped title collided with its own second line and with the lane
      // rail when this was 12 — measured, not supposed.
      expect(wrapLines(t, cartTitleChars(W)), `"${t}" wrapped`).toHaveLength(1);
    }
  });

  it("the metadata pairs leave a gap in the middle", () => {
    // Worst case per row, from the live record's shapes.
    const code = 3 * CART_TYPE.code * 0.8 + 5 * CART_TYPE.code * 0.76;
    const lane = 8 * CART_TYPE.lane * 0.76 + 7 * CART_TYPE.lane * 0.76;
    expect(code, "the team code and stream id meet in the middle").toBeLessThan(PAIR_MEASURE * 0.9);
    expect(lane, "the lane and autonomy labels meet in the middle").toBeLessThan(
      PAIR_MEASURE * 0.9
    );
  });

  it("the title is the largest thing in the cartridge", () => {
    // The name of the work outranks its metadata. A record whose id letters
    // larger than its title is a record about ids.
    expect(CART_TYPE.title).toBeGreaterThan(CART_TYPE.code);
    expect(CART_TYPE.code).toBeGreaterThan(CART_TYPE.lane);
  });
});

/**
 * READING 02 IS THE OWNER'S UNIT BOARD, PORTRAIT (ADR-070 U4).
 *
 * It declares every string it letters together with the measure that string
 * has to fit (`configurationLettering`), so this guard measures THE DRAWING'S
 * OWN INPUTS rather than re-deriving them — a guard that re-derives cannot
 * notice the drawing pointing at the wrong field. Sub-card values wrap to
 * three lines and THE BAR to two; the line past each cap is declared with a
 * ZERO measure, so a tail the wrapper would slice off fails here loudly
 * instead of vanishing on screen.
 */
describe("the configuration letters into its boxes", () => {
  it("every string on every stream fits its measure", () => {
    const works = allWorks();
    expect(works.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const w of works) {
      const specs = configurationLettering(w);
      expect(specs.length, `${w.id} letters nothing`).toBeGreaterThan(20);
      for (const spec of specs) {
        expect(spec.text.length, `${w.id} ${spec.slot} is blank`).toBeGreaterThan(0);
        expect(
          configSpecWidth(spec),
          `${w.id} ${spec.slot}: "${spec.text}" runs past its ${spec.measure}u measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("no single WORD runs through a sub-card wall", () => {
    /* ⚠ THE BINDING NUMBER IS A WORD, NOT A STRING — `wrapLines` breaks on
       spaces only, so a word longer than the measure overflows however well
       the whole value wraps, and every per-line assertion above still passes
       because each LINE is short. INTELLIGENCE (12 chars) is the record's
       longest and it is what fixes the value size at 11 and the node at 228. */
    for (const w of allWorks()) {
      for (const spec of configurationLettering(w)) {
        if (spec.measure === 0) continue;
        const longest = spec.text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");
        expect(
          longest.length * spec.fs * (0.6 + spec.track),
          `${w.id} ${spec.slot}: the word "${longest}" is wider than its ${spec.measure}u box`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("nothing letters under the floor the owner set", () => {
    /* ⚠ 12 SINCE U10 — see `FS_FLOOR`. U4's 10 rendered 5.4px at the binding
       preset and 8.3px at 1920, under the 8.5px chrome floor; the owner ruled
       the keys illegible and the ladder was rebuilt around this rung. */
    for (const spec of configurationLettering(allWorks()[0])) {
      expect(spec.fs, `${spec.slot} letters at ${spec.fs}`).toBeGreaterThanOrEqual(FS_FLOOR);
    }
  });

  it("no value wants a line past its cap", () => {
    /* `wrapLines` SLICES at its cap, so a value that wanted one more line
       would lose its tail silently and every fit assertion above would still
       pass. The line past the cap is declared with a zero measure for exactly
       that reason: this is the assertion that sees it. */
    for (const w of allWorks()) {
      for (const spec of configurationLettering(w)) {
        expect(
          spec.measure,
          `${w.id} ${spec.slot} wants a line past the cap: "${spec.text}"`
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("what the owner deleted stays deleted", () => {
  it("no readout, no draw meter, no derived caption", () => {
    /* ⚠ ADR-070 U3/U4 (owner, quoted at the ADR): the reactive readout
       sentence, the DRAW PER RUN meter with NEVER A PRICE, and the
       DRAWS ON n OF m caption are all GONE. The notes stay in the RECORD; the
       DRAWING declares no slot for any of them. Each returning is a
       deliberate decision, not a drift. */
    for (const w of allWorks()) {
      const slots = configurationLettering(w).map((s) => s.slot);
      const texts = configurationLettering(w).map((s) => s.text);
      expect(
        slots.some((s) => s.startsWith("readout.")),
        `${w.id} letters a readout slot`
      ).toBe(false);
      expect(
        texts.some((t) => /DRAW PER RUN|NEVER A PRICE|DRAWS ON/.test(t)),
        `${w.id} letters a deleted chrome string`
      ).toBe(false);
    }
  });
});

describe("person-led work answers all four questions", () => {
  it("prints what is not bound rather than emptying out", () => {
    /* The negative space is the reading leadership takes (ADR-062), so a
       stream with no configuration still fills every sub-card — an empty one
       would read as a drawing that failed to load. */
    const person = allWorks().filter((w) => !w.configured);
    expect(person.length, "the record lost its person-led work").toBe(3);
    for (const w of person) {
      for (const spec of configurationLettering(w)) {
        expect(spec.text.length, `${w.id} ${spec.slot} is blank`).toBeGreaterThan(0);
        expect(
          configSpecWidth(spec),
          `${w.id} ${spec.slot}: "${spec.text}" runs past its measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("never claims a lane it does not run on", () => {
    for (const w of allWorks()) {
      if (w.configured) continue;
      expect(w.cfg.laneRun).toBe("NO LANE");
      expect(w.cfg.skill).toContain("NOT BOUND");
    }
  });
});
