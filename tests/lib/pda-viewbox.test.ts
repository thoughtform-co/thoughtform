import { describe, expect, it } from "vitest";

import {
  CONFIG_MAX_BARS,
  configSpecWidth,
  configurationLettering,
  drawnShapes,
  substrateReach,
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
  type PdaShape,
  type PdaWork,
  crossing,
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

/** The five shapes with their derived counts — what reading 02 draws bars
 *  from, and the same projection `PdaConsole` hands it. */
function allShapes(): readonly PdaShape[] {
  const v = mapVisual();
  return crossing(v.shapes, v.districts, v.works, []).shapes;
}

describe("the readings' crops", () => {
  /* Declared extents, from each view's own geometry. 01 is the 4x5 grid
     (`GX`/`GY` + the 176x136 cartridge); 03 from its top rule to the bottom
     section label. */
  const CONTENT = {
    1: { x: 12, y: 22, right: 12 + 3 * 192 + 176, bottom: 22 + 4 * 158 + 136 },
    /* 02 is the SWITCHBOARD since 2026-08-09. Its lettered content spans the
       chrome's own left edge to the right-aligned chrome, and from the top
       chrome's line box down through the readout's. The ghost ribbons run off
       all four edges DELIBERATELY and are not content. */
    2: { x: 60, y: 28, right: 962, bottom: 755 },
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

  it("reading 02's crop is TIGHT — the type it buys is the whole reason", () => {
    /* The switchboard is authored in 1000x760 and cropped onto what it draws.
       At the binding field (603x493, the real console at 1280x720) that is
       worth 10 % of rendered type over the full authoring box — the difference
       between this reading sitting on the smoke's 4.3px floor and sitting
       comfortably above it. */
    const b = box(2);
    const meet = Math.min(603 / b.w, 493 / b.h);
    expect(7.5 * meet, "the smallest rung fell under the smoke's floor").toBeGreaterThan(4.6);
    expect(b.w, "the crop grew back toward the authoring width").toBeLessThanOrEqual(920);
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
 * READING 02 IS THE SWITCHBOARD (2026-08-09).
 *
 * It declares every string it letters together with the measure that string
 * has to fit (`configurationLettering`), so this guard measures THE DRAWING'S
 * OWN INPUTS rather than re-deriving them — a guard that re-derives cannot
 * notice the drawing pointing at the wrong field. Package values wrap to two
 * lines and a third is declared with a ZERO measure, so a tail the wrapper
 * would slice off fails here loudly instead of vanishing on screen.
 */
describe("the configuration letters into its boxes", () => {
  it("every string on every stream fits its measure", () => {
    const shapes = allShapes();
    const works = allWorks();
    expect(works.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const w of works) {
      const specs = configurationLettering(w, shapes);
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

  it("nothing letters under the drawing's own floor", () => {
    /* The binding field is 603x493 against a 910-wide crop, so the meet is
       0.663 and 7 units would render 4.64px. The smoke's floor is 4.3, but
       this reading answers the offer and should not carry the surface's
       smallest type — so the drawing's own floor is 7.5. */
    for (const spec of configurationLettering(allWorks()[0], allShapes())) {
      expect(spec.fs, `${spec.slot} letters at ${spec.fs}`).toBeGreaterThanOrEqual(7.5);
    }
  });

  it("the readout outranks the board it explains", () => {
    // It is the only prose on the reading, and prose loses to nothing here.
    const specs = configurationLettering(allWorks()[0], allShapes());
    const readout = specs.find((s) => s.slot === "readout.rest")!.fs;
    const values = specs.filter((s) => /\.L\d$/.test(s.slot)).map((s) => s.fs);
    expect(readout).toBeGreaterThan(Math.max(...values));
  });

  it("the substrate row draws one bar per tap, and never more than it seats", () => {
    /* ⚠ SLOTS ARE AUTHORED PER COUNT. A stream that tapped a fourth shape
       would silently lose a bar, so the record's own maximum is pinned here
       rather than discovered on screen. */
    const shapes = allShapes();
    for (const w of allWorks()) {
      const n = drawnShapes(w, shapes).length;
      expect(n, `${w.id} taps nothing`).toBeGreaterThanOrEqual(1);
      expect(n, `${w.id} taps ${n} shapes; the row seats ${CONFIG_MAX_BARS}`).toBeLessThanOrEqual(
        CONFIG_MAX_BARS
      );
      const bars = configurationLettering(w, shapes).filter((s) => s.slot.startsWith("bus."));
      expect(bars.length, `${w.id} draws ${bars.length} bars for ${n} taps`).toBe(n);
    }
  });

  it("the reach caption counts shapes, never the reservoir's Skills", () => {
    /* Three bars reading 12, 9 and 14 sum to 35, so a caption claiming the
       estate's 47 beside them would publish two totals a reader can subtract.
       Reading 03 owns the reservoir; this one owns what the stream reaches. */
    const shapes = allShapes();
    for (const w of allWorks()) {
      const caption = substrateReach(w, shapes);
      expect(caption).toMatch(/^DRAWS ON [1-3] OF 5 SHAPES$/);
      expect(caption, "the reservoir total leaked onto reading 02").not.toMatch(/\b47\b/);
    }
  });

  it("no package value wants a third line", () => {
    /* `wrapLines` SLICES at its cap, so a value that wanted three lines would
       lose its tail silently and every fit assertion above would still pass.
       The third line is declared with a zero measure for exactly that reason:
       this is the assertion that sees it. */
    const shapes = allShapes();
    for (const w of allWorks()) {
      for (const spec of configurationLettering(w, shapes)) {
        expect(
          spec.measure,
          `${w.id} ${spec.slot} wants a third line: "${spec.text}"`
        ).toBeGreaterThan(0);
      }
    }
  });
});

describe("the readout holds a whole sentence", () => {
  it("every rest state and every hover note fits one line", () => {
    /* One line is the point: a status line that wraps is not a status line,
       and the substrate row sits directly above it. */
    const shapes = allShapes();
    for (const w of allWorks()) {
      const notes = configurationLettering(w, shapes).filter((s) => s.slot.startsWith("readout."));
      expect(notes.length, `${w.id} has no readout states`).toBe(5);
      for (const spec of notes) {
        expect(
          configSpecWidth(spec),
          `${w.id} ${spec.slot}: "${spec.text}" runs past the readout's measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
    }
  });

  it("carries what the board could not", () => {
    /* The strings that drove the split: `k` joined and `evals` cannot be
       lettered in a 104-unit package at any legible size, so the packages
       letter ONE element and the readout takes the whole of both. If these
       ever fit a package, the split is worth revisiting; until then it is
       arithmetic. */
    const worst = (pick: (w: PdaWork) => string) =>
      Math.max(...allWorks().map((w) => pick(w).length));
    const packageChars = Math.floor(104 / (8 * MONO_ADVANCE));
    expect(worst((w) => w.cfg.rchNote)).toBeGreaterThan(packageChars);
    expect(worst((w) => w.cfg.gatNote)).toBeGreaterThan(packageChars);
    expect(worst((w) => w.cfg.why)).toBeGreaterThan(packageChars);
  });
});

describe("person-led work answers all four questions", () => {
  it("prints what is not bound rather than emptying out", () => {
    /* The negative space is the reading leadership takes (ADR-062), so a
       stream with no configuration still fills every package — an empty one
       would read as a drawing that failed to load — and its bars still draw,
       because a person-led stream draws on the same shapes by hand. */
    const shapes = allShapes();
    const person = allWorks().filter((w) => !w.configured);
    expect(person.length, "the record lost its person-led work").toBe(3);
    for (const w of person) {
      for (const spec of configurationLettering(w, shapes)) {
        expect(spec.text.length, `${w.id} ${spec.slot} is blank`).toBeGreaterThan(0);
        expect(
          configSpecWidth(spec),
          `${w.id} ${spec.slot}: "${spec.text}" runs past its measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
      expect(drawnShapes(w, shapes).length, `${w.id} draws no substrate`).toBeGreaterThanOrEqual(1);
      expect(w.cfg.why.length, `${w.id} has no rest state`).toBeGreaterThan(0);
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
