import { describe, expect, it } from "vitest";

import {
  BOARD,
  BOARD_CHIP_SLOTS,
  BOARD_INDEX,
  MAP_REFERENCE_BOX,
  MONO_ADVANCE,
  SHEET_VIEWBOX,
  SHEET_VIEWBOX_FULL,
  SEAT,
  UG,
  UNIT,
  UNIT_RAIL_LABELS,
  boardIndexLines,
  byDepth,
  charsIn,
  districtShapes,
  districtTrenched,
  districtsTapping,
  iso,
  isPersonLed,
  mapTotals,
  orderShapes,
  pad2,
  placeBoardDistricts,
  placeRisers,
  poly,
  sheetView,
  stampBox,
  textWidth,
  trenchedBy,
  viewBoxOf,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import { RATCHET } from "@/components/landing/home-v2/services/casefile/map/MapSheetGrade";
import { getCase } from "@/lib/cases/registry";
import type { CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

/**
 * The work-to-intelligence map's geometry and arithmetic (ADR-062).
 *
 * `mapProjection.ts` was built pure precisely so this file could exist. The
 * sheets are TECHNICAL DRAWINGS made of SVG `<text>`, and `<text>` does not
 * wrap, does not ellipsise and does not report its own overflow — a label
 * that runs past a crop simply vanishes at the edge with nothing on screen
 * to say it happened. Reviewing that by eye is how the first cut shipped
 * with all five of sheet 03's mains overlapping and three of sheet 02's
 * rail labels off the right edge, at the ONE viewport that binds while
 * looking correct at 1920.
 *
 * So the fit is asserted arithmetically here, against the same constants
 * the components draw from, and `tests/visual/services-ring-smoke.spec.ts`
 * checks the rendered result. Text extents use `MONO_ADVANCE`, which is
 * PT Mono's advance plus the sheets' tracking.
 */

const loop = getCase("loop-earplugs");
const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
if (!visual || visual.kind !== "intelligence-map") {
  throw new Error("the map projection test needs Loop's intelligence-map track");
}
const shapes: readonly CaseMapShape[] = visual.shapes;
const districts: readonly CaseMapDistrict[] = visual.districts;
const works: readonly CaseMapWork[] = visual.works;

/** Two baselines must clear a line box, or the type collides. */
const LINE_CLEARANCE = 0.9;

/** A rectangle in authoring units. */
interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * The box a left-anchored line of type occupies.
 *
 * The ascent and descent factors are MEASURED off rendered `getBBox()`
 * results, not assumed: PT Mono's em box runs 1.02x the type size above the
 * baseline and 0.28x below it. Using the type size alone under-reports the
 * ascender, which is how a header can sit outside its own crop while every
 * arithmetic check passes.
 */
const textBox = (x: number, baseline: number, text: string, type: number): Box => ({
  left: x,
  right: x + textWidth(text, type),
  top: baseline - type * 1.02,
  bottom: baseline + type * 0.28,
});

const inside = (inner: Box, outer: Box) =>
  inner.left >= outer.left &&
  inner.right <= outer.right &&
  inner.top >= outer.top &&
  inner.bottom <= outer.bottom;

const cropBox = (v: { x: number; y: number; w: number; h: number }): Box => ({
  left: v.x,
  right: v.x + v.w,
  top: v.y,
  bottom: v.y + v.h,
});

describe("map projection — the isometric (ADR-062)", () => {
  it("iso() is one deterministic affine projection", () => {
    // The SAME call twice is the SAME point. Nothing here samples a clock
    // or a random, because a drawing that moves between renders cannot be
    // compared against a screenshot or a spec.
    expect(iso(100, 50, 20, 10)).toEqual(iso(100, 50, 20, 10));

    // `a` runs right-and-down, `b` runs left-and-down, both at the 2:1
    // axonometric's half-rate in y.
    expect(iso(0, 0, 1, 0)).toEqual([1, 0.5]);
    expect(iso(0, 0, 0, 1)).toEqual([-1, 0.5]);

    // Linear in a and b, so a plate's corners stay a parallelogram.
    const [x1, y1] = iso(0, 0, 3, 5);
    const [x2, y2] = iso(0, 0, 6, 10);
    expect([x2, y2]).toEqual([x1 * 2, y1 * 2]);

    // ⚠ THE PROPERTY SHEET 03 DEPENDS ON: `cy` is pure screen-vertical, so
    // depth below the spine costs nothing in x. Hang the mains off a
    // second projection and the set stops reading as one hand.
    const flat = iso(200, 100, 40, 25);
    const deep = iso(200, 100 + 300, 40, 25);
    expect(deep[0]).toBe(flat[0]);
    expect(deep[1] - flat[1]).toBe(300);
  });

  it("byDepth paints far to near, without mutating its input", () => {
    const items = [
      { id: "near", a: 10, b: 10 },
      { id: "far", a: -10, b: -10 },
      { id: "mid", a: 5, b: -5 },
    ];
    const snapshot = [...items];
    expect(byDepth(items).map((i) => i.id)).toEqual(["far", "mid", "near"]);
    expect(items).toEqual(snapshot);
  });

  it("poly, diamond-free helpers and chrome formatters hold their shape", () => {
    expect(
      poly([
        [1, 2],
        [3, 4],
      ])
    ).toBe("1,2 3,4");
    expect(viewBoxOf({ x: 1, y: 2, w: 3, h: 4 })).toBe("1 2 3 4");
    expect(pad2(5)).toBe("05");
    expect(pad2(27)).toBe("27");
  });

  it("the text metric is the one the drawings are fitted against", () => {
    expect(textWidth("ABCDE", 20)).toBeCloseTo(5 * 20 * MONO_ADVANCE, 6);
    // charsIn is the inverse, floored — a partial character does not fit.
    expect(charsIn(textWidth("ABCDEFGHIJ", 19), 19)).toBe(10);
    // Never returns a measure so small that wrapping degenerates.
    expect(charsIn(1, 19)).toBeGreaterThanOrEqual(6);
  });

  it("wrapLines never exceeds its measure, and never drops a word", () => {
    const text = "Not a loop that closes — a ratchet. Each new stream starts closer to done.";
    for (const measure of [12, 20, 34, 58]) {
      const lines = wrapLines(text, measure);
      expect(lines.join(" ")).toBe(text);
      for (const line of lines) {
        // A single word longer than the measure is allowed to exceed it —
        // greedy wrap cannot break a word — but nothing else may.
        if (line.includes(" ")) expect(line.length).toBeLessThanOrEqual(measure);
      }
    }
  });
});

describe("map projection — derived totals (ADR-062)", () => {
  it("every published total is computed from the record", () => {
    const totals = mapTotals(shapes, districts, works);
    expect(totals.modules).toBe(works.length);
    expect(totals.configured).toBe(works.filter((w) => !isPersonLed(w)).length);
    expect(totals.personLed).toBe(totals.modules - totals.configured);
    expect(totals.districts).toBe(districts.length);
    expect(totals.mains).toBe(shapes.length);
    expect(totals.skills).toBe(shapes.reduce((n, s) => n + s.skills, 0));

    // THE RATCHET, AS ARITHMETIC. Each main is trenched exactly once by its
    // `first`, so every other configured stream tapped one that already
    // existed. The prototype hard-coded this; a hard-coded total on this
    // surface is a confidentiality problem, not a typo.
    expect(totals.reused).toBe(totals.configured - totals.mains);
    expect(new Set(shapes.map((s) => s.first)).size).toBe(shapes.length);

    // Taps are counted per district, so the figure cannot exceed the grid.
    expect(totals.taps).toBe(
      districts.reduce((n, d) => n + districtShapes(shapes, works, d.id).length, 0)
    );
    expect(totals.taps).toBeLessThanOrEqual(districts.length * shapes.length);
  });

  it("trenched and tapped are disjoint readings of the same district", () => {
    for (const d of districts) {
      const all = districtShapes(shapes, works, d.id);
      const trenched = districtTrenched(shapes, works, d.id);
      // A district can only have trenched a main its own work taps.
      for (const key of trenched) expect(all).toContain(key);
      // No duplicates: the drawing puts ONE marker per (district, main).
      expect(new Set(all).size).toBe(all.length);
      // Drawing order, always — the strata read the same on every render.
      expect(all).toEqual(orderShapes(shapes, all));
    }

    // Each shape's `first` is the only stream that trenched it.
    for (const s of shapes) {
      expect(trenchedBy(shapes, s.first).map((x) => x.key)).toContain(s.key);
    }
    const trenchers = districts.flatMap((d) => districtTrenched(shapes, works, d.id));
    expect(trenchers.length).toBe(shapes.length);

    // A main nobody taps would be drawn at zero stroke weight.
    for (const s of shapes) {
      expect(
        districtsTapping(shapes, works, districts, s.key).length,
        `no district taps "${s.key}"`
      ).toBeGreaterThan(0);
    }
  });
});

describe("map projection — sheet 01, the board (ADR-062)", () => {
  const placed = placeBoardDistricts(districts);

  it("seats eight districts on distinct, non-overlapping plates", () => {
    expect(placed).toHaveLength(districts.length);
    expect(new Set(placed.map((p) => `${p.a}:${p.b}`)).size).toBe(districts.length);

    // NON-OVERLAPPING IN (a, b) — the plates are drawn on one board, so
    // two seats that intersect draw one plate through the other and the
    // painter sort cannot save it.
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const p = placed[i];
        const q = placed[j];
        const apart = Math.abs(p.a - q.a) >= 2 * BOARD.da || Math.abs(p.b - q.b) >= 2 * BOARD.db;
        expect(apart, `${p.district.id} and ${q.district.id} plates intersect`).toBe(true);
      }
    }
  });

  it("every module seats on its plate, in one of six slots", () => {
    expect(BOARD_CHIP_SLOTS).toBe(BOARD.chip.length);
    for (const d of districts) {
      const n = works.filter((w) => w.dist === d.id).length;
      expect(n, `${d.name} overruns its plate`).toBeLessThanOrEqual(BOARD_CHIP_SLOTS);
    }

    // A CHIP MUST LAND ON THE PLATE IT NAMES. The seats are offsets in
    // (a, b), so this is the only thing standing between a sixth module
    // and a chip floating over the board.
    for (const [oa, ob] of BOARD.chip) {
      expect(Math.abs(oa) + BOARD.chipHalf).toBeLessThanOrEqual(BOARD.da);
      expect(Math.abs(ob) + BOARD.chipHalf).toBeLessThanOrEqual(BOARD.db);
    }
    // …and no two chips overlap each other.
    for (let i = 0; i < BOARD.chip.length; i++) {
      for (let j = i + 1; j < BOARD.chip.length; j++) {
        const [ax, ay] = BOARD.chip[i];
        const [bx, by] = BOARD.chip[j];
        const apart =
          Math.abs(ax - bx) >= 2 * BOARD.chipHalf || Math.abs(ay - by) >= 2 * BOARD.chipHalf;
        expect(apart, `chip slots ${i} and ${j} overlap`).toBe(true);
      }
    }
  });

  it("the board and its plaques stay inside the panel crop", () => {
    const crop = cropBox(SHEET_VIEWBOX.board);
    const corners = [
      iso(BOARD.cx, BOARD.cy, BOARD.A, BOARD.B),
      iso(BOARD.cx, BOARD.cy, BOARD.A, -BOARD.B),
      iso(BOARD.cx, BOARD.cy, -BOARD.A, -BOARD.B),
      iso(BOARD.cx, BOARD.cy, -BOARD.A, BOARD.B),
    ];
    for (const [x, y] of corners) {
      expect(x).toBeGreaterThanOrEqual(crop.left);
      expect(x).toBeLessThanOrEqual(crop.right);
      expect(y).toBeGreaterThanOrEqual(crop.top);
      expect(y).toBeLessThanOrEqual(crop.bottom);
    }

    // BACK-ROW PLAQUES HANG ABOVE THEIR PLATE. The rows leave ~18 screen
    // units of gap and a plaque needs 40; hung below, a back-row plaque
    // lands on the front row's plate. Both placements have to stay in the
    // crop, and the plaque box is derived from the sheet's type size.
    const type = SHEET_VIEWBOX.board.type;
    for (const p of placed) {
      const back = p.b < 0;
      const anchor = back
        ? iso(BOARD.cx, BOARD.cy, p.a - BOARD.da, p.b - BOARD.db)
        : iso(BOARD.cx, BOARD.cy, p.a + BOARD.da, p.b + BOARD.db);
      const w = textWidth(p.district.name, type) + 16;
      const top = back ? anchor[1] - 42 : anchor[1] + 10;
      const box: Box = {
        left: anchor[0] - w / 2,
        right: anchor[0] + w / 2,
        top,
        bottom: top + 40,
      };
      expect(inside(box, crop), `${p.district.name}'s plaque leaves the crop`).toBe(true);
    }
  });

  it("the parts index fits the expanded crop, and names every module", () => {
    const lines = boardIndexLines(districts, works);
    expect(lines.filter((l) => l.kind === "head")).toHaveLength(districts.length);
    expect(lines.filter((l) => l.kind === "row")).toHaveLength(works.length);
    // A schedule that skipped a module would be worse than no schedule.
    expect(new Set(lines.filter((l) => l.kind === "row").map((l) => l.id)).size).toBe(works.length);

    const crop = cropBox(SHEET_VIEWBOX_FULL.board);
    // The index letters at the SHEET's type — see BOARD_INDEX.
    const type = SHEET_VIEWBOX_FULL.board.type;
    const last = lines[lines.length - 1];
    expect(last.y + type * 0.25, "the index runs off the expanded sheet").toBeLessThanOrEqual(
      crop.bottom
    );
    expect(lines[0].y - type).toBeGreaterThanOrEqual(crop.top);

    // The column is 268 units wide, and a row is a label plus a
    // right-aligned tail. They must not meet in the middle.
    for (const line of lines) {
      const labelX = line.kind === "row" ? BOARD_INDEX.x + 14 : BOARD_INDEX.x;
      const labelRight = labelX + textWidth(line.label, type);
      const tailLeft = BOARD_INDEX.x + BOARD_INDEX.w - textWidth(line.tail, type);
      expect(labelRight, `index row "${line.label}" runs into its tail`).toBeLessThan(tailLeft);
    }

    // The index column must not reach the board it indexes.
    expect(BOARD_INDEX.x + BOARD_INDEX.w).toBeLessThan(
      iso(BOARD.cx, BOARD.cy, -BOARD.A, BOARD.B)[0]
    );
  });
});

describe("map projection — sheet 02, the unit (ADR-062)", () => {
  const configured = works.filter((w) => !isPersonLed(w));
  const plateBox = (cy: number): Box => ({
    left: UNIT.cx - (UNIT.A + UNIT.B),
    right: UNIT.cx + (UNIT.A + UNIT.B),
    top: cy - (UNIT.A + UNIT.B) / 2,
    bottom: cy + (UNIT.A + UNIT.B) / 2 + UNIT.thickness,
  });

  it("the four plates stack without intersecting", () => {
    // ⚠ THE FIRST CUT SHIPPED A 108-UNIT STRIDE UNDER A 142-UNIT PLATE.
    // Consecutive plates overlapped by 34 units, which reads as a stack
    // rather than an exploded assembly — the one thing this sheet exists
    // to show.
    for (let i = 1; i < UNIT.plateY.length; i++) {
      const above = plateBox(UNIT.plateY[i - 1]);
      const below = plateBox(UNIT.plateY[i]);
      expect(
        above.bottom,
        `plate ${i} intersects plate ${i - 1} by ${(above.bottom - below.top).toFixed(1)} units`
      ).toBeLessThanOrEqual(below.top);
    }
    // …and the whole stack sits inside the panel crop.
    const crop = cropBox(SHEET_VIEWBOX.unit);
    for (const cy of UNIT.plateY) expect(inside(plateBox(cy), crop)).toBe(true);
  });

  it("the label rail carries the words the plates cannot", () => {
    // The plate face is narrower than the values that used to be lettered
    // on it — the arithmetic that moved them to the rail. If this ever
    // stops being true, reconsider; do not letter a plate on a hunch.
    const face = 2 * (UNIT.A + UNIT.B);
    const widest = Math.max(
      ...configured.map((w) => textWidth(w.cfg?.g[0] ?? "", SHEET_VIEWBOX.unit.type))
    );
    expect(widest).toBeGreaterThan(face / 2);

    for (const view of [SHEET_VIEWBOX.unit, SHEET_VIEWBOX_FULL.unit]) {
      const measure = charsIn(UNIT.right - UNIT.railText, view.type);
      const railBox: Box = {
        left: UNIT.railText,
        right: UNIT.right,
        top: view.y,
        bottom: view.y + view.h,
      };
      for (const w of configured) {
        const c = w.cfg!;
        const answers = [
          `${UNIT_RAIL_LABELS.skill} · ${c.s[0]}`,
          `${UNIT_RAIL_LABELS.model} · ${c.m[0]}`,
          `${UNIT_RAIL_LABELS.context} · ${c.c[0]}`,
          `${UNIT_RAIL_LABELS.graph} · ${c.g[0]}`,
          `${UNIT_RAIL_LABELS.connectors} · ${c.k[0]}`,
          `${UNIT_RAIL_LABELS.surfaces} · ${c.u[0]}`,
          c.p[0],
        ];
        for (const answer of answers) {
          for (const line of wrapLines(answer, measure)) {
            const box = textBox(UNIT.railText, view.y + 100, line, view.type);
            expect(
              box.right,
              `${w.id}: rail line "${line}" runs past the crop at type ${view.type}`
            ).toBeLessThanOrEqual(railBox.right);
          }
        }
      }
    }
  });

  it("no rail block runs into the next plate's block", () => {
    const view = SHEET_VIEWBOX.unit;
    const measure = charsIn(UNIT.right - UNIT.railText, view.type);
    // The worst case is the module whose two answers both wrap.
    const worst = Math.max(
      ...configured.map((w) => {
        const c = w.cfg!;
        return Math.max(
          wrapLines(`${UNIT_RAIL_LABELS.graph} · ${c.g[0]}`, measure).length +
            wrapLines(`${UNIT_RAIL_LABELS.context} · ${c.c[0]}`, measure).length,
          wrapLines(`${UNIT_RAIL_LABELS.connectors} · ${c.k[0]}`, measure).length +
            wrapLines(`${UNIT_RAIL_LABELS.surfaces} · ${c.u[0]}`, measure).length
        );
      })
    );
    const leaderY = (cy: number) => cy + (UNIT.A - UNIT.B) / 2;
    for (let i = 1; i < UNIT.plateY.length; i++) {
      const blockBottom = leaderY(UNIT.plateY[i - 1]) + 14 + (worst - 1) * 16 + view.type * 0.25;
      const nextTop = leaderY(UNIT.plateY[i]) - 16;
      expect(blockBottom, `rail block ${i - 1} (${worst} lines) runs into block ${i}`).toBeLessThan(
        nextTop
      );
    }
  });

  it("the readout columns do not collide with each other or the drawing", () => {
    const view = SHEET_VIEWBOX.unit;
    const crop = cropBox(view);
    const stack = plateBox(UNIT.plateY[0]);

    // The dimension line lives between the readout copy and the plates.
    expect(UNIT.left + textWidth("Decides alone", view.type)).toBeLessThan(UNIT.dimX);
    expect(UNIT.dimX + 8).toBeLessThan(stack.left);

    // The gate sits BELOW the last plate, not beside it.
    expect(plateBox(UNIT.plateY[3]).bottom).toBeLessThanOrEqual(UNIT.gate.top);

    // The draw meter has its own band below the gate — the first cut put
    // it beside one and the band text ran through the gate's marks.
    expect(UNIT.gate.bottom).toBeLessThan(UNIT.meterY - view.type);

    // Longest gate copy in the record still fits.
    const evals = works.map((w) => w.evals).sort((a, b) => b.length - a.length)[0];
    expect(textBox(UNIT.cx + 6, UNIT.gate.top + 30, evals, view.type).right).toBeLessThanOrEqual(
      crop.right
    );

    // The confidentiality caption stays ON the panel, inside the crop and
    // clear of the stamp — it is the one line most likely to be read as
    // money, at BOTH detail levels.
    for (const [v, box] of [
      [SHEET_VIEWBOX.unit, MAP_REFERENCE_BOX.panel],
      [SHEET_VIEWBOX_FULL.unit, MAP_REFERENCE_BOX.full],
    ] as const) {
      const caption = textBox(
        UNIT.left,
        UNIT.meterY + 38,
        "Read against the workload. Never a price.",
        v.type
      );
      expect(inside(caption, cropBox(v)), "the draw caption leaves the crop").toBe(true);
      expect(overlaps(caption, stampBox(v, box)), "the draw caption runs into the stamp").toBe(
        false
      );
    }
    expect(crop.bottom).toBeGreaterThan(UNIT.meterY);
  });

  it("the header band clears itself at both detail levels", () => {
    for (const [view, subtitle] of [
      [SHEET_VIEWBOX.unit, "Height is authority, not importance."],
      [SHEET_VIEWBOX_FULL.unit, "One module taken apart. Height is authority, not importance."],
    ] as const) {
      const longest = works
        .map((w) => `${w.id} / ${w.title}`)
        .sort((a, b) => b.length - a.length)[0];
      const rightStart = UNIT.right - textWidth(longest, view.type);
      expect(
        UNIT.left + textWidth("Sheet 02 / the unit — the configuration", view.type),
        `the sheet title runs into the module id at type ${view.type}`
      ).toBeLessThan(rightStart);

      const longestDistrict = districts
        .map((d) => `${d.name} / Person-led`)
        .sort((a, b) => b.length - a.length)[0];
      expect(
        UNIT.left + textWidth(subtitle, view.type),
        `the subtitle runs into the district line at type ${view.type}`
      ).toBeLessThan(UNIT.right - textWidth(longestDistrict, view.type));
    }
  });

  it("every seat depth indexes a real plate", () => {
    for (const key of Object.keys(SEAT) as (keyof typeof SEAT)[]) {
      expect(UNIT.plateY[SEAT[key].depth]).toBeDefined();
    }
    // Person-led work sits at depth 0 — no distance between the owner and
    // a machine, because there is no machine.
    expect(SEAT.PERSON.depth).toBe(0);
    for (const w of works) {
      expect(isPersonLed(w) ? w.seat === "PERSON" : w.seat !== "PERSON", `${w.id} seat`).toBe(true);
    }
  });
});

describe("map projection — sheet 03, below grade (ADR-062)", () => {
  const placed = placeRisers(districts);
  const view = SHEET_VIEWBOX.grade;
  const keys = shapes.map((s) => s.key);
  const mainY = (key: (typeof keys)[number]) => UG.cy + UG.depth[key] - UG.A / 2;

  it("one riser per district, spread along the spine without crossing", () => {
    expect(placed).toHaveLength(districts.length);
    expect(new Set(placed.map((p) => p.district.id)).size).toBe(districts.length);

    // Drops are ordered by the district's own (a, b), which is what keeps
    // the laterals from crossing on their way to the spine.
    const sorted = [...placed].sort((x, y) => x.a - y.a || x.b - y.b);
    expect(sorted.map((p) => p.drop)).toEqual([...sorted.map((p) => p.drop)].sort((a, b) => a - b));
    expect(placed.map((p) => p.drop).sort((a, b) => a - b)[0]).toBe(UG.dropFrom);
    expect(placed.map((p) => p.drop).sort((a, b) => b - a)[0]).toBe(UG.dropTo);

    // Footprints stay on the ghosted board and clear of each other.
    for (const p of placed) {
      expect(Math.abs(p.a) + UG.da).toBeLessThanOrEqual(UG.A);
      expect(Math.abs(p.b) + UG.db).toBeLessThanOrEqual(UG.B);
    }
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const apart =
          Math.abs(placed[i].a - placed[j].a) >= 2 * UG.da ||
          Math.abs(placed[i].b - placed[j].b) >= 2 * UG.db;
        expect(apart, `${placed[i].district.id}/${placed[j].district.id} footprints overlap`).toBe(
          true
        );
      }
    }
  });

  it("the five mains clear a line of type between them", () => {
    // ⚠ THE FIRST CUT STACKED NAME AND COUNTS AT THE LEFT END, 20 units
    // apart on a 30-unit stride — every pair of mains collided. The counts
    // now read out of the far end, so the stride only has to clear ONE
    // line, which it must still actually do.
    const ys = keys.map(mainY).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i] - ys[i - 1], "two mains are within a line of each other").toBeGreaterThanOrEqual(
        view.type * LINE_CLEARANCE
      );
    }
    expect(new Set(keys.map((k) => UG.depth[k])).size).toBe(shapes.length);
  });

  it("the first main starts below the ghosted board", () => {
    // Its label is drawn ABOVE the main; hung any higher it is lettered
    // across the board it is meant to run underneath.
    const boardBottom = UG.cy + (UG.A + UG.B) / 2;
    const firstLabelTop = Math.min(...keys.map(mainY)) - 4 - view.type;
    expect(firstLabelTop, "the first main's label lands on the ghosted board").toBeGreaterThan(
      boardBottom
    );
    // …and the board's own top vertex stays inside the crop.
    expect(UG.cy - (UG.A + UG.B) / 2).toBeGreaterThan(view.y);
  });

  it("main labels fit their margins at both ends", () => {
    const crop = cropBox(view);
    const left = UG.cx - UG.A - 14;
    const right = UG.cx + UG.A + 14;
    for (const s of shapes) {
      const tapping = districtsTapping(shapes, works, districts, s.key).length;
      expect(
        left - textWidth(s.label, view.type),
        `"${s.label}" runs off the left`
      ).toBeGreaterThan(crop.left);
      const counts = `${s.skills} skills / ${tapping} districts`;
      expect(right + textWidth(counts, view.type), `"${counts}" runs off the right`).toBeLessThan(
        crop.right
      );
    }
  });

  it("the annotation band sits below the deepest riser", () => {
    // ⚠ THE FIRST CUT PUT IT AT y 590 WITH RISERS REACHING 615 — the
    // deepest riser and its taps were drawn straight through the sentence
    // that carries the sheet's whole economic argument.
    const deepest = Math.max(...keys.map((k) => UG.depth[k]));
    const lowestRiser = UG.cy + UG.dropTo / 2 + deepest;
    const hitBottom = lowestRiser + 6;
    expect(UG.noteY - view.type, "a riser crosses the annotation band").toBeGreaterThan(hitBottom);

    const crop = cropBox(view);
    const totals = mapTotals(shapes, districts, works);
    const lines: [number, string][] = [
      [UG.noteY, "Trenched the main — this district paid to encode the shape"],
      [UG.noteY + 22, "Tapped an existing main — inherited it, added nothing to the bill"],
      [
        UG.noteY + 46,
        `${totals.reused} of ${totals.configured} configured streams tapped a main that already existed.`,
      ],
    ];
    for (const [y, text] of lines) {
      const box = textBox(UG.left + 16, y, text, view.type);
      expect(inside(box, crop), `the annotation line "${text.slice(0, 24)}…" clips`).toBe(true);
    }
  });

  it("the expanded sheet's ratchet prose fits below the marker sentences", () => {
    const fullView = SHEET_VIEWBOX_FULL.grade;
    const crop = cropBox(fullView);
    const stamp = stampBox(fullView, MAP_REFERENCE_BOX.full);
    const measure = charsIn(UG.right - UG.left, fullView.type);
    const lines = wrapLines(RATCHET, measure);
    lines.forEach((line, i) => {
      const box = textBox(UG.left, UG.noteY + 66 + i * 16, line, fullView.type);
      expect(inside(box, crop), `the ratchet prose clips on line ${i + 1}`).toBe(true);
      expect(overlaps(box, stamp), `the ratchet prose runs into the stamp on line ${i + 1}`).toBe(
        false
      );
    });
  });

  it("nothing on the annotation band is printed through the provenance stamp", () => {
    // ⚠ THE FIRST CUT PRINTED THE SHEET'S WHOLE ARGUMENT — the derived
    // reuse sentence — straight through the words "illustrative record".
    // The stamp is DOM chrome pinned in SCREEN pixels, so it eats MORE of
    // the drawing as the console shrinks: 1280x720 is the binding case and
    // 1920 hides it completely.
    const view = SHEET_VIEWBOX.grade;
    const stamp = stampBox(view, MAP_REFERENCE_BOX.panel);
    const totals = mapTotals(shapes, districts, works);
    const band: [number, number, string][] = [
      [UG.left + 16, UG.noteY, "Trenched the main — this district paid to encode the shape"],
      [
        UG.left + 16,
        UG.noteY + 22,
        "Tapped an existing main — inherited it, added nothing to the bill",
      ],
      [
        UG.left,
        UG.noteY + 46,
        `${totals.reused} of ${totals.configured} configured streams tapped a main that already existed.`,
      ],
    ];
    for (const [x, y, text] of band) {
      const box = textBox(x, y, text, view.type);
      expect(overlaps(box, stamp), `"${text.slice(0, 30)}…" is printed through the stamp`).toBe(
        false
      );
    }

    // The deepest main's own counts hang from the far end of the main,
    // which is A/2 LOWER than the depth line — the annotation band's real
    // floor, and not where anyone looking at the strata would expect it.
    const deepest = Math.max(...keys.map((k) => UG.depth[k]));
    const countsBaseline = UG.cy + deepest + UG.A / 2 - 4;
    const counts = textBox(UG.cx + UG.A + 14, countsBaseline, "14 skills / 8 districts", view.type);
    expect(
      counts.bottom,
      "the annotation band starts above the deepest main's counts"
    ).toBeLessThan(textBox(UG.left, UG.noteY, "x", view.type).top);
  });

  it("no annotation overlaps the header band on either sheet", () => {
    const totals = mapTotals(shapes, districts, works);
    for (const [v, subtitle] of [
      [SHEET_VIEWBOX.grade, "What every district drops into."],
      [SHEET_VIEWBOX_FULL.grade, "The same board, one level down. What every district drops into."],
    ] as const) {
      const counts = `${pad2(totals.mains)} mains / ${totals.skills} skills / ${totals.taps} taps`;
      expect(
        textBox(UG.left, 66, "Sheet 03 / below grade — the substrate", v.type).right
      ).toBeLessThan(UG.right - textWidth(counts, v.type));
      expect(textBox(UG.left, 84, subtitle, v.type).right).toBeLessThan(
        UG.right - textWidth("Encoded once, tapped by many", v.type)
      );
    }
  });
});

describe("map projection — the two detail levels (ADR-062)", () => {
  it("sheetView returns the panel crop by default and the authored one on expand", () => {
    for (const sheet of ["board", "unit", "grade"] as const) {
      expect(sheetView(sheet, "panel")).toBe(SHEET_VIEWBOX[sheet]);
      expect(sheetView(sheet, "full")).toBe(SHEET_VIEWBOX_FULL[sheet]);
      // EXPAND buys ROOM, not magnification: the full crop is wider in
      // authoring units AND letters smaller, so it fits more characters at
      // roughly the same rendered size. A `full` crop that letters larger
      // would make the overlay a zoom, which ADR-062 closed.
      expect(SHEET_VIEWBOX_FULL[sheet].type).toBeLessThan(SHEET_VIEWBOX[sheet].type);
      expect(charsIn(SHEET_VIEWBOX_FULL[sheet].w, SHEET_VIEWBOX_FULL[sheet].type)).toBeGreaterThan(
        charsIn(SHEET_VIEWBOX[sheet].w, SHEET_VIEWBOX[sheet].type)
      );
    }
    // Only the expanded board reaches back to the index column.
    expect(SHEET_VIEWBOX_FULL.board.x).toBeLessThanOrEqual(BOARD_INDEX.x);
    expect(SHEET_VIEWBOX.board.x).toBeGreaterThan(BOARD_INDEX.x + BOARD_INDEX.w);
  });
});
