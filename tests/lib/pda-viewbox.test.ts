import { describe, expect, it } from "vitest";

import {
  MODULE_BOX,
  READOUT_TYPE,
  VIEW_BOX,
  configurationLines,
  readoutMeasure,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import {
  CART_TYPE,
  MODULE_TYPE,
  MONO_ADVANCE,
  MONO_LINE_BOX,
  cartTitleChars,
  moduleAnswerBaselines,
  moduleAnswerChars,
  moduleAnswerMeasure,
  moduleHeadBaseline,
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
     (`GX`/`GY` + the 176x136 cartridge); 02 runs from the owner plate down
     past the draw meter; 03 from its top rule to the bottom section label. */
  const CONTENT = {
    1: { x: 12, y: 22, right: 12 + 3 * 192 + 176, bottom: 22 + 4 * 158 + 136 },
    2: { x: 8, y: 126, right: 797, bottom: 686 },
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

  it("reading 02 is cropped WIDER than the authoring space, because it draws past it", () => {
    // Its content runs to x=797 against a 780-unit authoring width. A crop of
    // 780 clips the right-hand modules, silently — SVG text past a crop just
    // vanishes.
    expect(box(2).right).toBeGreaterThanOrEqual(797);
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

describe("the configuration's answers fit their modules", () => {
  /* ⚠ THE MODULE IS THE TIGHT BOX ON THIS SURFACE, and its measure is
     arithmetic: the divider sits a full `h` from the inboard edge (the gauge
     needs the room), the text is inset 11 past it, and the cartridge title's
     own 6-unit wall clearance applies — so 224x56 letters into 151 units.
     A `<text>` past that runs through the module wall with nothing on screen
     to say so, exactly like a label past a crop. */
  const MEASURE = moduleAnswerMeasure(MODULE_BOX.w, MODULE_BOX.h);
  const PER = moduleAnswerChars(MODULE_BOX.w, MODULE_BOX.h);

  it("the measure is the one the drawing is built on", () => {
    expect(MEASURE).toBe(151);
    expect(PER).toBe(27);
  });

  it("every answer line on every stream fits one line", () => {
    const works = allWorks();
    expect(works.length).toBeGreaterThanOrEqual(PDA_SHOWN);
    for (const w of works) {
      for (const part of configurationLines(w)) {
        expect(part.lines.length, `${w.id} ${part.k} answers with nothing`).toBeGreaterThan(0);
        // Two is the module's whole capacity — a third line would land on the
        // contact row below it.
        expect(
          part.lines.length,
          `${w.id} ${part.k} wants ${part.lines.length} lines`
        ).toBeLessThanOrEqual(2);
        for (const line of part.lines) {
          const width = line.length * MODULE_TYPE.answer * MONO_ADVANCE;
          expect(
            width,
            `${w.id} ${part.k}: "${line}" runs past the module wall`
          ).toBeLessThanOrEqual(MEASURE);
        }
      }
    }
  });

  it("the bar wraps rather than truncating — no word is dropped", () => {
    /* `wrapLines` SLICES at its cap, so a bar that wanted three lines would
       lose its tail silently and every fit assertion above would still pass.
       Rejoining is the only check that sees it. The longest live bar is 46
       characters ("CONSISTENT EVIDENCE / NO UNSUPPORTED INFERENCE"). */
    for (const w of allWorks()) {
      const lines = wrapLines(w.cfg.bar, PER);
      expect(lines.join(" "), `${w.id}'s bar lost its tail at ${PER} characters`).toBe(w.cfg.bar);
    }
  });

  it("the question fits above its answer, at its own tracking", () => {
    // The header keeps the module label's .14em, so its advance is 0.74 —
    // NOT the answers' 0.68. Different tracking is a different measure.
    const HEAD_ADVANCE = 0.74;
    for (const part of configurationLines(allWorks()[0])) {
      const width = part.head.length * MODULE_TYPE.head * HEAD_ADVANCE;
      expect(width, `"${part.head}" runs past the module wall`).toBeLessThanOrEqual(MEASURE);
    }
  });

  it("the stacked lines clear each other's LINE BOXES, not their font sizes", () => {
    /* ⚠ THE MEASUREMENT THAT THE SMOKE CANNOT MAKE FOR YOU. The overlap sweep
       compares rendered glyph boxes at a 0.5-unit tolerance, so a pitch that
       leaves one unit passes today and fails on a font metric change. A line
       box is ~1.3 em, and the pair whose 13 units became a collision at size
       10 (PdaViews) is the precedent. Ask for a whole line box of daylight. */
    const y0 = 0;
    const h = MODULE_BOX.h;
    const box = MODULE_TYPE.answer * MONO_LINE_BOX;
    const [a, b] = moduleAnswerBaselines(y0, h, 2);
    const head = moduleHeadBaseline(y0, h);

    // Ascent is the bulk of a line box; descent is the rest.
    const top = (baseline: number, size: number) => baseline - size * MONO_LINE_BOX * 0.79;
    const bottom = (baseline: number, size: number) => baseline + size * MONO_LINE_BOX * 0.21;

    expect(
      top(a, MODULE_TYPE.answer) - bottom(head, MODULE_TYPE.head),
      "the first answer sits in the question's descender"
    ).toBeGreaterThan(1);
    expect(
      top(b, MODULE_TYPE.answer) - bottom(a, MODULE_TYPE.answer),
      "the two answers share a line box"
    ).toBeGreaterThan(box * 0.5);
    expect(bottom(b, MODULE_TYPE.answer), "the last answer runs into the contact row").toBeLessThan(
      h - 3
    );
    expect(
      top(head, MODULE_TYPE.head),
      "the question runs out of the module's top edge"
    ).toBeGreaterThan(0);
    /* One centred answer stays inside the same walls. */
    const [only] = moduleAnswerBaselines(y0, h, 1);
    expect(top(only, MODULE_TYPE.answer)).toBeGreaterThan(bottom(head, MODULE_TYPE.head) + 1);
    expect(bottom(only, MODULE_TYPE.answer)).toBeLessThan(h - 3);
  });

  it("the answer outranks the question that asked it", () => {
    // The question is chrome and repeats on every stream; the answer is the
    // record. A configuration whose labels letter larger than its values is a
    // configuration about labels.
    expect(MODULE_TYPE.answer).toBeGreaterThan(MODULE_TYPE.head);
  });
});

describe("the readout holds a whole sentence", () => {
  const MEASURE = readoutMeasure();

  it("every rest state and every hover note fits one line", () => {
    /* One line is the point: a status line that wraps is not a status line,
       and there is no room under it — the draw meter is 66 units below. */
    for (const w of allWorks()) {
      const strings = [
        [`${w.id} rest`, w.cfg.why] as const,
        ...configurationLines(w).map((p) => [`${w.id} ${p.k}`, p.note] as const),
      ];
      for (const [label, s] of strings) {
        const width = s.length * READOUT_TYPE * MONO_ADVANCE;
        expect(width, `${label}: "${s}" runs past the readout's measure`).toBeLessThanOrEqual(
          MEASURE
        );
      }
    }
  });

  it("carries what the modules could not", () => {
    /* The two strings that drove the split. `k` joined runs to 121 % of a
       module's measure and `evals` to 142 %, so the module letters one element
       and the bar while the readout takes the whole of both. If these ever fit
       the module, the split is worth revisiting; until then it is arithmetic. */
    const worst = (pick: (w: PdaWork) => string) =>
      Math.max(...allWorks().map((w) => pick(w).length));
    const moduleChars = Math.floor(
      moduleAnswerMeasure(MODULE_BOX.w, MODULE_BOX.h) / (MODULE_TYPE.answer * MONO_ADVANCE)
    );
    expect(worst((w) => w.cfg.rchNote)).toBeGreaterThan(moduleChars);
    expect(worst((w) => w.cfg.gatNote)).toBeGreaterThan(moduleChars);
    expect(worst((w) => w.cfg.why)).toBeGreaterThan(moduleChars);
  });

  it("is the largest type in the configuration's chrome", () => {
    // It is the only prose on the reading, and prose loses to nothing here.
    expect(READOUT_TYPE).toBeGreaterThanOrEqual(MODULE_TYPE.answer);
  });
});

describe("person-led work answers all four questions", () => {
  it("prints what is not bound rather than emptying out", () => {
    /* The negative space is the reading leadership takes (ADR-062), so a
       stream with no configuration still fills its modules. An empty module
       would read as a drawing that failed to load. */
    const person = allWorks().filter((w) => !w.configured);
    expect(person.length, "the record lost its person-led work").toBe(3);
    for (const w of person) {
      for (const part of configurationLines(w)) {
        for (const line of part.lines) {
          expect(line.length, `${w.id} ${part.k} is blank`).toBeGreaterThan(0);
          expect(
            line.length * MODULE_TYPE.answer * MONO_ADVANCE,
            `${w.id} ${part.k}: "${line}" runs past the module wall`
          ).toBeLessThanOrEqual(moduleAnswerMeasure(MODULE_BOX.w, MODULE_BOX.h));
        }
      }
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
