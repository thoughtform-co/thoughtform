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

  it("reading 02's crop is PORTRAIT — it has to fill a portrait panel", () => {
    /* ⚠ THE ASPECT IS THE CONTRACT (ADR-070 U4). The console's field is
       PORTRAIT where this is read (792x948 = 0.835 at a tall window), and
       `meet` scales by the minimum ratio — so a LANDSCAPE crop is
       width-bound there and letterboxes the difference as dead panel below
       the drawing. The old 910x740 (1.23) left 304px of it. Anything at or
       under ~0.95 fills that field to within a few percent. */
    const b = box(2);
    expect(b.w / b.h, "reading 02's crop went landscape again").toBeLessThanOrEqual(0.95);

    /* The price of the portrait crop is meet at the SHORT-wide fields, where
       the drawing is height-bound instead: 603x493 at 1280x720. The drawing's
       own floor is 10 units, and it still has to clear the smoke's 4.3px. */
    const meet = Math.min(603 / b.w, 493 / b.h);
    expect(10 * meet, "the smallest rung fell under the smoke's floor").toBeGreaterThan(4.6);
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

  it("nothing letters under the drawing's own floor", () => {
    /* ⚠ THE FLOOR ROSE TO 10 WITH THE PORTRAIT CROP (ADR-070 U4). At the
       short-wide field (603x493) a portrait crop is height-bound, so the meet
       drops to ~0.52 — 7.5 units would render 3.89px and fail the smoke's
       4.3px floor outright. 10 renders 5.19. */
    for (const spec of configurationLettering(allWorks()[0])) {
      expect(spec.fs, `${spec.slot} letters at ${spec.fs}`).toBeGreaterThanOrEqual(10);
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
