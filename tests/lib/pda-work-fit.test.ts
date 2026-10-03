import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  RUN_MODES,
  STREAM_ORDER,
  WORK_COLUMN_SLOTS,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import {
  CARD_BOX,
  CART_TYPE,
  cartTitleChars,
  laneLabel,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaGlyphs";
import { specWidth } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  COL_HEAD_FS,
  GROUP_FS,
  VIEW_BOX,
  ViewWork,
  WORK_LAYOUT_0,
  rowLabelLines,
  workArrangement,
  workExt,
  workLayout,
  workLayoutFor,
  workLettering,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaViews";
import { cropOf } from "@/components/landing/home-v2/services/casefile/map/pda/pdaFlight";
import {
  selectWorks,
  workPlan,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";

import { ENVELOPE } from "./helpers/mapEnvelope";

/**
 * READING 01 · THE MARKETING ESTATE (ADR-126) — the arithmetic half of its
 * guard. The drawing declares every string it letters beside the cards
 * (`workLettering`) with the measure it must fit; this walks that declaration
 * against the advance model, the envelope and the crop, and renders the view
 * to assert nothing prints that the declaration did not name. The smoke
 * measures real glyph boxes on the pile's map card.
 *
 * ⚠ 12 IS THE FLOOR THE OWNER SET (ADR-070 U10), and both heads letter at it.
 */
const FS_FLOOR = 12;

function mapVisual() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return visual;
}

const visual = mapVisual();
const shown = selectWorks(visual.districts, visual.works, visual.skills);
const plan = workPlan(shown);
const live = workLayout({ extW: 0, extH: 0 }, plan);

describe("the plan: three columns, each a run up the ladder", () => {
  it("is the marketing estate — twelve streams under the record's three workstreams", () => {
    expect(plan.columns.map((c) => c.stream)).toEqual([...STREAM_ORDER]);
    expect(plan.ids).toHaveLength(12);
    expect(new Set(plan.ids).size).toBe(12);
    for (const col of plan.columns) {
      const n = col.runs.reduce((a, r) => a + r.ids.length, 0);
      expect(n, `${col.stream} is empty`).toBeGreaterThanOrEqual(1);
      expect(n, `${col.stream} overflows its column`).toBeLessThanOrEqual(WORK_COLUMN_SLOTS);
      // The runs climb the ladder in order, each present at most once.
      const modes = col.runs.map((r) => r.mode);
      expect(new Set(modes).size).toBe(modes.length);
      const idx = modes.map((m) => RUN_MODES.indexOf(m));
      expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    }
    // The negative space stays: person-led work is on the reading, by hand.
    expect(plan.columns.some((c) => c.runs.some((r) => r.mode === "hand"))).toBe(true);
  });

  it("throws, never seats, a stream whose run mode the ladder does not place", () => {
    const stray = shown.map((w) => (w.id === plan.ids[0] ? { ...w, run: null } : w));
    expect(() => workPlan(stray)).toThrow(/does not place/);
  });
});

describe("the reading letters into its boxes", () => {
  for (const [name, layout] of [
    ["live", live],
    ["ceiling", WORK_LAYOUT_0],
  ] as const) {
    it(`every head fits its measure at the floor (${name})`, () => {
      const specs = workLettering(layout, visual.streams);
      expect(specs.length).toBeGreaterThanOrEqual(3);
      for (const spec of specs) {
        expect(spec.text.length, `${spec.slot} is blank`).toBeGreaterThan(0);
        expect(spec.fs, `${spec.slot} letters under the floor`).toBeGreaterThanOrEqual(FS_FLOOR);
        expect(
          specWidth(spec),
          `${spec.slot}: "${spec.text}" runs past its ${spec.measure}u measure`
        ).toBeLessThanOrEqual(spec.measure);
      }
    });
  }

  it("the column heads are the record's names, uppercased, and letter no digit", () => {
    const heads = workLettering(live, visual.streams).filter((s) => s.slot.endsWith(".head"));
    expect(heads.map((h) => h.text)).toEqual(visual.streams.map((s) => s.name.toUpperCase()));
    for (const spec of workLettering(live, visual.streams)) {
      expect(spec.text, `${spec.slot} composes a digit`).not.toMatch(/\d/);
      expect(spec.text, `${spec.slot} counts teams`).not.toMatch(/\d\s*teams?\b/i);
      for (const [label, re] of ENVELOPE) {
        expect(re.test(spec.text), `${spec.slot} letters ${label}`).toBe(false);
      }
    }
    expect(COL_HEAD_FS).toBeGreaterThanOrEqual(FS_FLOOR);
    expect(GROUP_FS).toBeGreaterThanOrEqual(FS_FLOOR);
  });
});

describe("the crop", () => {
  it("is the ceiling's, and the live block fits inside it, centred", () => {
    const c = cropOf(VIEW_BOX[1]);
    const ceiling = WORK_LAYOUT_0.block;
    expect(ceiling.y).toBeGreaterThanOrEqual(c.y);
    expect(ceiling.y + ceiling.h).toBeLessThanOrEqual(c.y + c.h);
    // The live reading is shorter than the ceiling on any record with fewer
    // than four runs in a column — and its crop is the SAME size.
    const lc = cropOf(live.crop);
    expect(lc.w).toBe(c.w);
    expect(lc.h).toBe(c.h);
    expect(live.block.h).toBeLessThanOrEqual(ceiling.h);
    // Centred: what is left is halved (ADR-070 U14's law, via `cropAround`).
    const top = live.block.y - lc.y;
    const bottom = lc.y + lc.h - (live.block.y + live.block.h);
    expect(top).toBeCloseTo(bottom, 1);
    expect(top).toBeGreaterThanOrEqual(8);
  });

  it("holds every card and every head, at every field shape", () => {
    for (const aspect of [493 / 603, 620 / 693, 926 / 693, 1.0, 0.6]) {
      const l = workLayout(workExt(aspect), plan);
      const c = cropOf(l.crop);
      for (const p of l.placed) {
        if (p.kind === "card") {
          expect(p.rect.x).toBeGreaterThanOrEqual(c.x);
          expect(p.rect.y).toBeGreaterThanOrEqual(c.y);
          expect(p.rect.x + p.rect.w).toBeLessThanOrEqual(c.x + c.w);
          expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(c.y + c.h);
          expect(p.rect.w).toBe(CARD_BOX.w);
          expect(p.rect.h).toBe(CARD_BOX.h);
        } else {
          expect(p.x).toBeGreaterThanOrEqual(c.x);
          expect(p.y).toBeGreaterThanOrEqual(c.y);
          expect(p.x + CARD_BOX.w).toBeLessThanOrEqual(c.x + c.w);
        }
      }
    }
  });

  it("buys type by density: the title rung at the pile's fields", () => {
    /* The reading's type is `meet × CART_TYPE.title`, on the pile's own
       fields (`capture-proof-stack.mjs` `mapField`). Recorded, not tuned:
       4.7px at 1280×720 (4.5 with the grid of twenty), 12.0px at the owner's
       1920×1247 (11.5) — `pda-viewbox` pins the estate against the grid. */
    const c = cropOf(VIEW_BOX[1]);
    const at = (w: number, h: number) => {
      const l = workLayout(workExt(h / w), plan);
      const lc = cropOf(l.crop);
      return Math.min(w / lc.w, h / lc.h) * CART_TYPE.title;
    };
    expect(c.w).toBeLessThan(600);
    expect(at(579, 307)).toBeGreaterThan(4.6);
    expect(at(814, 790)).toBeGreaterThan(11.9);
  });
});

describe("the view renders nothing its declaration did not name", () => {
  it("every <text> is a declared head or one of the card's own strings", () => {
    const markup = renderToStaticMarkup(
      createElement(ViewWork, {
        works: shown,
        streams: visual.streams,
        hover: null,
        onHover: () => {},
        onOpen: () => {},
        still: true,
        selId: "",
        showSel: false,
        entry: { kind: "raster" },
        layout: live,
      })
    );
    const texts = [...markup.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) =>
      m[1]
        .replace(/&amp;/g, "&")
        .replace(/&#x27;/g, "'")
        .trim()
    );
    expect(texts.length).toBeGreaterThan(12 * 3);
    const declared = new Set(workLettering(live, visual.streams).map((s) => s.text));
    const cards = new Set<string>();
    for (const w of shown) {
      cards.add(w.teamAb);
      cards.add(w.id);
      cards.add(laneLabel(w.lane));
      for (const line of wrapLines(w.title, cartTitleChars(CARD_BOX.w))) cards.add(line);
    }
    for (const t of texts) {
      expect(declared.has(t) || cards.has(t), `renders an undeclared "${t}"`).toBe(true);
    }
    // Twelve cartridges on the reading, each hit-testable as a button.
    expect((markup.match(/role="button"/g) ?? []).length).toBe(12);
  });
});

/**
 * THE ROWS ARRANGEMENT (2026-10-03, owner: on a MacBook Air the cards "feel too
 * small"). The same record turned a quarter for landscape fields: one row per
 * workstream, the name in a label column, the runs left to right. The console
 * picks whichever arrangement letters larger at the field's aspect.
 */
describe("the rows arrangement", () => {
  /* The pile's own fields (`capture-proof-stack.mjs` `mapField`). */
  const FIELDS = {
    "1280x720": [579, 307],
    "1470x830": [665, 408],
    "1440x900": [652, 479],
    "1920x1247": [814, 790],
  } as const;
  const title = (l: ReturnType<typeof workLayout>, w: number, h: number) => {
    const c = cropOf(l.crop);
    return Math.min(w / c.w, h / c.h) * CART_TYPE.title;
  };

  it("is chosen on every laptop field and never on the tall monitor's", () => {
    expect(workArrangement(307 / 579)).toBe("rows");
    expect(workArrangement(408 / 665)).toBe("rows");
    expect(workArrangement(479 / 652)).toBe("rows");
    expect(workArrangement(790 / 814)).toBe("columns");
    expect(workArrangement(0)).toBe("columns");
  });

  it("letters larger than the columns wherever it is chosen", () => {
    for (const [vp, [w, h]] of Object.entries(FIELDS)) {
      const chosen = workLayoutFor(h / w, plan, visual.streams);
      const cols = workLayout(workExt(h / w), plan);
      expect(title(chosen, w, h), vp).toBeGreaterThanOrEqual(title(cols, w, h));
    }
    // The MacBook Air's field: a third larger, at least.
    const [w, h] = FIELDS["1470x830"];
    const rows = workLayoutFor(h / w, plan, visual.streams);
    expect(title(rows, w, h) / title(workLayout(workExt(h / w), plan), w, h)).toBeGreaterThan(1.3);
  });

  it("seats every card once, inside the crop, and letters into its measures", () => {
    for (const aspect of [307 / 579, 408 / 665, 479 / 652, 0.4]) {
      const l = workLayoutFor(aspect, plan, visual.streams);
      expect(l.arrangement).toBe("rows");
      expect(Object.keys(l.slots).sort()).toEqual([...plan.ids].sort());
      const c = cropOf(l.crop);
      for (const p of l.placed) {
        if (p.kind !== "card") continue;
        expect(p.rect.x).toBeGreaterThanOrEqual(c.x);
        expect(p.rect.y).toBeGreaterThanOrEqual(c.y);
        expect(p.rect.x + p.rect.w).toBeLessThanOrEqual(c.x + c.w);
        expect(p.rect.y + p.rect.h).toBeLessThanOrEqual(c.y + c.h);
        expect(p.rect.w).toBe(CARD_BOX.w);
        expect(p.rect.h).toBe(CARD_BOX.h);
      }
      for (const spec of workLettering(l, visual.streams)) {
        expect(specWidth(spec), `${spec.slot}: "${spec.text}"`).toBeLessThanOrEqual(spec.measure);
      }
      // Each row's label spells the record's name, one word per line here.
      for (const s of visual.streams) {
        const lines = l.placed
          .filter((p) => p.kind === "row" && p.stream === s.key)
          .map((p) => (p.kind === "row" ? p.line : ""));
        expect(lines.join(" ")).toBe(s.name.toUpperCase());
        expect(rowLabelLines(s.name)).toEqual(lines);
      }
    }
  });

  it("never letters two cards or a head over a card", () => {
    const l = workLayoutFor(408 / 665, plan, visual.streams);
    const cards = l.placed.flatMap((p) => (p.kind === "card" ? [p.rect] : []));
    for (let a = 0; a < cards.length; a++) {
      for (let b = a + 1; b < cards.length; b++) {
        const A = cards[a];
        const B = cards[b];
        const apart = A.x + A.w <= B.x || B.x + B.w <= A.x || A.y + A.h <= B.y || B.y + B.h <= A.y;
        expect(apart, `cards ${a} and ${b} overlap`).toBe(true);
      }
    }
    // A run's head sits in the band above its cards, never inside one.
    for (const p of l.placed) {
      if (p.kind !== "head") continue;
      for (const r of cards) {
        const inside = p.x >= r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h;
        expect(inside, `${p.label} prints inside a card`).toBe(false);
      }
    }
  });
});
