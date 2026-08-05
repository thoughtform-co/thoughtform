import { describe, expect, it } from "vitest";

import { BOARD_RATCHET } from "@/components/landing/home-v2/services/casefile/map/board/BoardPlane";
import {
  BOARD_SHEETS,
  BOARD_SPACE,
  ELEV,
  ELEV_RAIL_KEYS,
  ELEV_RAIL_PANEL,
  PLACE,
  PLANE,
  autonomySpan,
  boardMargins,
  boardView,
  cellIndex,
  charsIn,
  clip,
  elevBoxes,
  elevRail,
  personTierCopy,
  placeRegisters,
  planeBottom,
  planeCell,
  planeColumns,
  planeRows,
  railChars,
  routeChains,
  tierFits,
  tierLines,
  trenchNotes,
  typeBox,
  typeBoxMid,
  typeBoxRight,
} from "@/components/landing/home-v2/services/casefile/map/board/boardProjection";
import {
  MAP_REFERENCE_BOX,
  MASS_BAND,
  SEAT,
  isPersonLed,
  mapTotals,
  pad2,
  stampBox,
  textWidth,
  wrapLines,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import { getCase } from "@/lib/cases/registry";
import type { CaseMapChain, CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

/**
 * The BOARD archetype's geometry and arithmetic.
 *
 * `boardProjection.ts` was built pure precisely so this file could exist.
 * The sheets are TECHNICAL DRAWINGS made of SVG `<text>`, and `<text>` does
 * not wrap, does not ellipsise and does not report its own overflow — a
 * label that runs past a crop simply vanishes at the edge with nothing on
 * screen to say it happened. That is how the isometric city shipped with all
 * five of its mains overlapping and three of its rail labels off the right
 * edge, at the ONE viewport that binds while looking correct at 1920.
 *
 * ⚠ EVERY ASSERTION USES THE REAL RECORD, not a fixture. A drawing checked
 * against invented data is a drawing that fits numbers the case does not
 * publish.
 */

const loop = getCase("loop-earplugs");
const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
if (!visual || visual.kind !== "intelligence-map") {
  throw new Error("the board projection test needs Loop's intelligence-map track");
}
const shapes: readonly CaseMapShape[] = visual.shapes;
const districts: readonly CaseMapDistrict[] = visual.districts;
const works: readonly CaseMapWork[] = visual.works;
const chains: readonly CaseMapChain[] = visual.chains ?? [];
const totals = mapTotals(shapes, districts, works);

const PANEL = boardView("panel");
const FULL = boardView("full");
const LEVELS = [
  { name: "panel", view: PANEL, box: MAP_REFERENCE_BOX.panel },
  { name: "full", view: FULL, box: MAP_REFERENCE_BOX.full },
] as const;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

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

/** Authoring units to CSS pixels, the way `xMidYMid meet` computes it. */
const scaleOf = (view: { w: number; h: number }, box: { w: number; h: number }) =>
  Math.min(box.w / view.w, box.h / view.h);

/* ── The crops ──────────────────────────────────────────────────────── */

describe("board projection — one space, two readings", () => {
  it("each crop matches its console's aspect, so `meet` wastes nothing", () => {
    // A crop whose aspect disagrees with its box letterboxes, and every
    // letterboxed pixel is type size the drawing does not get.
    for (const { name, view, box } of LEVELS) {
      const drift = Math.abs(view.w / view.h - box.w / box.h) / (box.w / box.h);
      expect(drift, `${name} crop aspect drift`).toBeLessThan(0.02);
    }
  });

  it("EXPAND buys room, never magnification", () => {
    // The contract ADR-062 landed on, and the one that keeps the overlay
    // from becoming the zoom ladder the ADR closed: the expanded crop
    // letters SMALLER in authoring units and holds MORE characters across.
    expect(FULL.type).toBeLessThan(PANEL.type);
    expect(charsIn(FULL.w, FULL.type)).toBeGreaterThan(charsIn(PANEL.w, PANEL.type));

    // …and the two therefore render at about the same size on screen, which
    // is what makes the reduction a question of WHAT IS DRAWN.
    const panelPx = PANEL.type * scaleOf(PANEL, MAP_REFERENCE_BOX.panel);
    const fullPx = FULL.type * scaleOf(FULL, MAP_REFERENCE_BOX.full);
    expect(Math.abs(panelPx - fullPx)).toBeLessThan(1.2);
  });

  it("type renders above the reading floor at the binding viewport", () => {
    // 1280x720 is the case that binds. Identity rows on this surface start
    // at 11px by `rules/proof.md`'s type law; 10px is the absolute floor for
    // anything a reader has to read rather than glance at.
    for (const { name, view, box } of LEVELS) {
      expect(view.type * scaleOf(view, box), `${name} rendered type`).toBeGreaterThan(9.9);
    }
  });

  it("no two header lines letter through each other, on any sheet", () => {
    // ⚠ THE CHECK NO EXISTING GUARD ON THIS SURFACE MAKES. The city's smoke
    // asserts crop containment and stamp clearance — both of which its
    // sheets pass — while its plaques letter through each other 10 to 13
    // times per sheet at every viewport. That is the complaint that started
    // this archetype, and a 22-unit header spacing against a 23.4-unit line
    // box reproduced it here in miniature.
    for (const head of [PLACE.head, ELEV.head, PLANE.head]) {
      for (const { name, view } of LEVELS) {
        const lineBox = view.type * 1.02 + view.type * 0.28;
        expect(head.sub - head.title, `${name} header spacing`).toBeGreaterThan(lineBox);
        expect(head.rule - head.sub, `${name} rule below the subtitle`).toBeGreaterThan(
          view.type * 0.28
        );
      }
    }
  });

  it("the drawing sits inside both crops, and `full` only adds margin", () => {
    const core: Box = { left: 0, right: BOARD_SPACE.w, top: 0, bottom: BOARD_SPACE.h };
    expect(inside(core, cropBox(PANEL))).toBe(true);
    expect(inside(core, cropBox(FULL))).toBe(true);
    // The notes column has to be wide enough to be a column.
    expect(boardMargins(FULL).left.w).toBeGreaterThan(300);
    expect(boardMargins(PANEL).left.w).toBeLessThanOrEqual(0);
  });

  it("names three sheets, three operations", () => {
    expect(BOARD_SHEETS.map((s) => s.id)).toEqual(["place", "unit", "plane"]);
    expect(BOARD_SHEETS.map((s) => s.note)).toEqual(["Locate + cross", "Dissect", "Tabulate"]);
    // ⚠ The tab strip's tail is `overflow: hidden` and yields first, so a
    // long sub pushes the operation until it renders as a FRAGMENT — `OSS`
    // out of "Locate + cross", which reads as a defect rather than as
    // yielding. One word per sub.
    for (const sheet of BOARD_SHEETS) {
      expect(sheet.sub.split(" "), `sub for ${sheet.id}`).toHaveLength(1);
    }
  });
});

/* ── Sheet 01, placement ────────────────────────────────────────────── */

describe("board projection — sheet 01, placement", () => {
  const registers = placeRegisters(districts, works);

  it("seats every department exactly once, in two balanced columns", () => {
    expect(registers).toHaveLength(districts.length);
    expect(registers.flatMap((r) => r.cells)).toHaveLength(works.length);

    const rows = [0, 1].map((col) =>
      registers.filter((r) => r.col === col).reduce((n, r) => n + 1 + r.cells.length, 0)
    );
    // Greedy-balanced: the columns cannot drift more than one department's
    // worth apart, which is what stops a ninth department running a column
    // off the bottom of the crop.
    expect(Math.abs(rows[0] - rows[1])).toBeLessThanOrEqual(6);
  });

  it("no two registers overlap, and the stack clears the provenance stamp", () => {
    const boxes = registers.map((r) => ({
      left: r.x,
      right: r.x + PLACE.colW,
      top: r.y,
      bottom: r.y + r.h,
    }));
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(overlaps(boxes[i], boxes[j]), `registers ${i} and ${j}`).toBe(false);
      }
    }

    const deepest = Math.max(...boxes.map((b) => b.bottom));
    expect(deepest).toBeLessThan(cropBox(PANEL).bottom);

    // ⚠ THE STAMP IS AN OBSTACLE, AND A MOVING ONE. It is DOM chrome pinned
    // bottom-right in SCREEN pixels over an SVG that scales, so its
    // footprint in authoring units GROWS as the console shrinks. The panel
    // is the binding case; 1920 hides it entirely.
    const stamp = stampBox(PANEL, MAP_REFERENCE_BOX.panel);
    const overStamp = boxes.filter((b) => overlaps(b, stamp));
    expect(overStamp).toEqual([]);
  });

  it("every cell holds its identity AND its lane, at both type sizes", () => {
    for (const { name, view } of LEVELS) {
      for (const reg of registers) {
        for (const cell of reg.cells) {
          const idText = `${cell.work.id} ${cell.work.title}`;
          const lane = cell.work.lane ?? "Person";
          const left = typeBox(cell.x + PLACE.pad, 0, idText, view.type);
          const right = typeBoxRight(cell.x + cell.w - PLACE.pad, 0, lane, view.type);
          // A positive gap, not merely "does not overflow": two labels that
          // meet exactly read as one string.
          expect(
            right.left - left.right,
            `${name} / ${cell.work.id} identity meets its lane`
          ).toBeGreaterThan(view.type);
        }
      }
    }
  });

  it("every register head holds its name AND its count", () => {
    // ⚠ Provenance is sheet 03's operation, not this one. A `First: …` tail
    // was tried here and dropped for two reasons that agree: it runs to 46
    // characters against a 45-character head at expanded type, AND it says
    // what the plane already says. One sheet, one job.
    const trenched = trenchNotes(shapes, works);
    expect([...trenched.values()].join(" / ").split(" / ")).toHaveLength(shapes.length);

    for (const { name, view } of LEVELS) {
      for (const reg of registers) {
        const head = `${reg.district.id} · ${reg.district.name}`;
        const left = typeBox(reg.x + PLACE.pad, 0, head, view.type);
        const right = typeBoxRight(
          reg.x + PLACE.colW - PLACE.pad,
          0,
          pad2(reg.cells.length),
          view.type
        );
        expect(
          right.left - left.right,
          `${name} / ${reg.district.id} head meets its count`
        ).toBeGreaterThan(view.type);
      }
    }
  });

  it("the header band does not letter its title through its counts", () => {
    const counts = `${totals.modules} modules / ${pad2(totals.districts)} departments / ${totals.personLed} person-led`;
    const sub = "Placement / every stream on record, by department";
    for (const { name, view } of LEVELS) {
      const title = typeBox(PLACE.left, PLACE.head.title, "01 · The work", view.type);
      const right = typeBoxRight(PLACE.right, PLACE.head.title, counts, view.type);
      expect(overlaps(title, right), `${name} header`).toBe(false);
      expect(right.left).toBeGreaterThan(title.right);

      const subBox = typeBox(PLACE.left, PLACE.head.sub, sub, view.type);
      expect(subBox.right, `${name} subtitle`).toBeLessThan(PLACE.right);
      expect(inside(subBox, cropBox(view))).toBe(true);
      // The rule sits below both, and the first register below the rule.
      expect(PLACE.head.rule).toBeGreaterThan(subBox.bottom);
      expect(PLACE.top).toBeGreaterThan(PLACE.head.rule);
    }
  });

  it("every chain resolves, and the runs stay in the gutter", () => {
    expect(chains.length).toBeGreaterThan(0);
    const cells = cellIndex(registers);

    for (const chain of chains) {
      expect(chain.steps.length).toBeGreaterThanOrEqual(2);
      for (const id of chain.steps) {
        expect(cells.get(id), `${chain.id} step ${id}`).toBeDefined();
      }
      // A run from a stream to itself is a record error, not a drawing one.
      expect(new Set(chain.steps).size).toBe(chain.steps.length);
      expect(chain.note.length).toBeLessThanOrEqual(150);
    }

    const routes = routeChains(chains, registers);
    for (const route of routes) {
      expect(route.steps).toHaveLength(route.chain.steps.length - 1);
      // The whole reason this sheet draws chains: a run that never leaves
      // its department proves nothing the clustering did not already show.
      expect(route.crossings, `${route.chain.id} crossings`).toBeGreaterThan(0);
      expect(route.laneX).toBeGreaterThan(PLACE.gutter.x);
      expect(route.laneX).toBeLessThan(PLACE.gutter.x + PLACE.gutter.w);
    }
    // Two chains never share a lane, or they draw as one line.
    expect(new Set(routes.map((r) => r.laneX)).size).toBe(routes.length);
  });

  it("the notes column holds every chain's note, expanded", () => {
    const margin = boardMargins(FULL);
    const per = charsIn(margin.left.w, FULL.type);
    const routes = routeChains(chains, registers);

    for (const [r, route] of routes.entries()) {
      const lines = wrapLines(route.chain.note, per);
      for (const line of lines) {
        expect(textWidth(line, FULL.type)).toBeLessThanOrEqual(margin.left.w);
      }
      const top = PLACE.top + r * 240;
      const last = top + 52 + lines.length * (FULL.type * 1.5);
      expect(last, `${route.chain.id} notes fit the crop`).toBeLessThan(cropBox(FULL).bottom);
      if (r > 0) {
        const previousTop = PLACE.top + (r - 1) * 240;
        expect(top).toBeGreaterThan(previousTop + 52 + lines.length * (FULL.type * 1.5) - 240);
      }
    }
  });
});

/* ── Sheet 02, elevation ────────────────────────────────────────────── */

describe("board projection — sheet 02, elevation", () => {
  const box = elevBoxes();
  const tiers = [box.person, box.work, box.pair, box.ground, box.reach];

  it("the tiers stack without intersecting, person on top", () => {
    for (let i = 0; i < tiers.length - 1; i += 1) {
      const gap = tiers[i + 1].y - (tiers[i].y + tiers[i].h);
      expect(gap, `gap below tier ${i}`).toBeGreaterThan(0);
    }
    // HEIGHT IS AUTHORITY. The person is above everything that performs.
    expect(box.person.y).toBeLessThan(Math.min(...tiers.slice(1).map((t) => t.y)));
    // …and the pair is ONE member, so there is no altitude between a Skill
    // and its model to argue about.
    expect(box.pair.w).toBe(ELEV.tier.pair.w);
  });

  it("the whole assembly, gate and meter fit the crop and clear the stamp", () => {
    const stamp = stampBox(PANEL, MAP_REFERENCE_BOX.panel);
    const crop = cropBox(PANEL);

    for (const tier of tiers) {
      const b = { left: tier.x, right: tier.x + tier.w, top: tier.y, bottom: tier.y + tier.h };
      expect(inside(b, crop)).toBe(true);
      expect(overlaps(b, stamp)).toBe(false);
    }

    expect(ELEV.gate.y).toBeGreaterThan(box.reach.y + box.reach.h);
    const meterCells: Box = {
      left: ELEV.meter.x,
      right: ELEV.meter.x + 5 * ELEV.meter.cell + 4 * ELEV.meter.gap,
      top: ELEV.meter.y,
      bottom: ELEV.meter.y + ELEV.meter.h,
    };
    expect(inside(meterCells, crop)).toBe(true);
    expect(overlaps(meterCells, stamp)).toBe(false);

    // The confidentiality caption stays at BOTH detail levels, so it has to
    // fit at both — it is not annotation to be reduced away.
    for (const { name, view } of LEVELS) {
      const caption = typeBox(ELEV.meter.x, ELEV.meter.caption, "Never a price.", view.type);
      expect(inside(caption, cropBox(view)), `${name} caption in crop`).toBe(true);
      expect(
        overlaps(
          caption,
          stampBox(view, name === "full" ? MAP_REFERENCE_BOX.full : MAP_REFERENCE_BOX.panel)
        ),
        `${name} caption under stamp`
      ).toBe(false);
    }
  });

  it("the meter's own readouts do not letter through each other", () => {
    for (const { name, view } of LEVELS) {
      const label = typeBox(ELEV.meter.x, ELEV.meter.label, "Draw", view.type);
      const band = typeBox(
        ELEV.meter.band,
        ELEV.meter.y + ELEV.meter.h - view.type * 0.2,
        MASS_BAND[MASS_BAND.length - 1],
        view.type
      );
      const gate = typeBoxMid(
        ELEV.cx,
        ELEV.gate.label,
        "Gate · Accepted examples + edge cases",
        view.type
      );
      expect(overlaps(label, band), `${name} draw label vs band`).toBe(false);
      expect(overlaps(label, gate), `${name} draw label vs gate label`).toBe(false);
      expect(band.right, `${name} band clear of the panel edge`).toBeLessThan(ELEV.railX);
    }
  });

  it("the gate label fits between the gate's own rules, uncut", () => {
    // ⚠ THE WORD AND THE VALUE ARE TWO MARKS. `Gate · ` in front of the
    // longest gate on record is 555 units against a 540-unit rule — this
    // assertion is what found that, and clipping it would have hidden it.
    const widest = works.reduce((a, w) => (w.evals.length > a.length ? w.evals : a), "");
    const span = ELEV.gate.x2 - ELEV.gate.x1;

    for (const { name, view } of LEVELS) {
      const drawn = clip(widest, charsIn(span, view.type));
      expect(drawn, `${name}: "${widest}" is too long for the gate rule`).toBe(widest);
      const b = typeBoxMid(ELEV.cx, ELEV.gate.label, drawn, view.type);
      expect(b.left, `${name} gate label left`).toBeGreaterThan(ELEV.gate.x1);
      expect(b.right, `${name} gate label right`).toBeLessThan(ELEV.gate.x2);
      // …and it must not run under the label rail, which starts at 712.
      expect(b.right).toBeLessThan(ELEV.railText);

      // The word marks the rule at its own left end, clear of the rules
      // themselves and of the tier above.
      const word = typeBox(ELEV.gate.x1 + 4, ELEV.gate.y - 6, "Gate", view.type);
      expect(word.bottom, `${name} gate word`).toBeLessThan(ELEV.gate.y);
      expect(word.top).toBeGreaterThan(ELEV.tier.reach.y + ELEV.tier.reach.h);
    }
  });

  it("every rail entry clears the next, at BOTH detail levels", () => {
    // ⚠ NEITHER READING IS AUTOMATICALLY THE BINDING ONE. `full` draws THREE
    // lines per entry against the panel's two, but the panel letters BIGGER,
    // so a pitch that clears at one type can collide at the other.
    for (const { name, view } of LEVELS) {
      const lines = name === "full" ? 3 : 2;
      const lastOffset = (lines - 1) * view.type * 1.4;
      const lineBox = view.type * 1.02 + view.type * 0.28;
      expect(ELEV.railRow, `${name} rail pitch`).toBeGreaterThan(lastOffset + lineBox);
    }
  });

  it("every tier holds its own copy — wrapped, never clipped", () => {
    // ⚠ TWO MEASUREMENTS SET THE TIER HEIGHTS, and the drawing was wrong
    // before either was known: the owner's note runs to 31 characters and
    // `bar` to 46, which wraps to THREE lines at panel type. A uniform
    // 58-unit tier clipped both, silently, because SVG text reports no
    // overflow. Boxes grow; type never shrinks.
    for (const { name, view } of LEVELS) {
      for (const work of works) {
        // From the projection, not retyped here: a literal duplicated in a
        // test passes while the drawing clips.
        const personLines = tierLines(box.person, view.type, ...personTierCopy(work));
        expect(
          tierFits(box.person, personLines, view.type),
          `${name} / ${work.id} person tier`
        ).toBe(true);

        const workLines = tierLines(box.work, view.type, `${work.id} ${work.title}`, work.bar);
        expect(tierFits(box.work, workLines, view.type), `${name} / ${work.id} work tier`).toBe(
          true
        );
      }
    }
  });

  it("every rail value fits the rail, and every leader runs forward", () => {
    const configured = works.filter((w) => !isPersonLed(w));
    expect(configured.length).toBeGreaterThan(0);

    for (const { name, view } of LEVELS) {
      const per = railChars(view.type);
      for (const work of configured) {
        const all = elevRail(work);
        expect(all).toHaveLength(ELEV_RAIL_KEYS.length);
        // THE PANEL SHOWS FOUR, THE EXPANDED READING SIX. Six at panel type
        // put the last entry inside the provenance stamp.
        const rail = name === "full" ? all : all.slice(0, ELEV_RAIL_PANEL);

        for (const entry of rail) {
          // A VALUE IS NEVER CLIPPED. Labels and values are the record; only
          // the note may lose its tail, and `tally()` is why the connector
          // and surface lists cannot.
          expect(
            ELEV.railText + textWidth(entry.value, view.type),
            `${name} / ${work.id} / ${entry.key} value is cut`
          ).toBeLessThanOrEqual(ELEV.right + 0.5);

          for (const text of [entry.label, entry.value, clip(entry.note, per)]) {
            expect(
              ELEV.railText + textWidth(text, view.type),
              `${name} / ${work.id} / ${entry.key}`
            ).toBeLessThanOrEqual(ELEV.right + 0.5);
          }
          // The leader elbows to the right of every tier, so it can never be
          // drawn across one.
          expect(entry.elbowX).toBeGreaterThan(elevBoxes().reach.x + elevBoxes().reach.w);
          expect(entry.elbowX).toBeLessThanOrEqual(ELEV.railX);
        }

        // No two leaders share a vertical, or they draw as one line.
        expect(new Set(rail.map((e) => e.elbowX)).size).toBe(rail.length);

        // The last rail line stays inside the crop.
        const last = rail[rail.length - 1];
        const lowest = last.y + view.type * (name === "full" ? 2.8 : 1.4);
        expect(lowest, `${name} / ${work.id} rail bottom`).toBeLessThan(cropBox(view).bottom);
      }
    }
  });

  it("the header names the subject without lettering through the lane", () => {
    for (const { name, view } of LEVELS) {
      for (const work of works) {
        const district = districts.find((d) => d.id === work.dist);
        const sub = `${work.id} ${work.title} / ${district?.name ?? ""}`;
        const right = isPersonLed(work)
          ? "Person-led / not encoded"
          : `${work.lane} lane / ${SEAT[work.seat].label} autonomy`;
        const title = typeBox(ELEV.left, ELEV.head.title, "02 · The configuration", view.type);
        const counts = typeBoxRight(ELEV.right, ELEV.head.title, right, view.type);
        expect(overlaps(title, counts), `${name} / ${work.id} header`).toBe(false);
        expect(
          typeBox(ELEV.left, ELEV.head.sub, sub, view.type).right,
          `${name} / ${work.id} subtitle`
        ).toBeLessThan(ELEV.right);
      }
    }
  });

  it("autonomy is a distance, and person-led work has none", () => {
    for (const work of works) {
      const span = autonomySpan(SEAT[work.seat].depth);
      if (isPersonLed(work)) {
        expect(work.seat, `${work.id}`).toBe("PERSON");
        expect(span).toBeNull();
        continue;
      }
      expect(span).not.toBeNull();
      expect(span!.top).toBe(box.person.y + box.person.h);
      expect(span!.bottom).toBeGreaterThan(span!.top);
      // The dimension line stays between the left readouts and the stack.
      const label = typeBox(ELEV.left, 0, "Decides alone", PANEL.type);
      expect(label.right).toBeLessThan(ELEV.dimX);
      expect(ELEV.dimX).toBeLessThan(box.work.x);
    }
  });

  it("the notes column holds `why this lane` and the seat note, expanded", () => {
    const margin = boardMargins(FULL);
    const per = charsIn(margin.left.w, FULL.type);
    for (const work of works.filter((w) => !isPersonLed(w))) {
      const why = wrapLines(work.cfg?.why ?? "", per);
      for (const line of why) expect(textWidth(line, FULL.type)).toBeLessThanOrEqual(margin.left.w);
      const bottom = ELEV.tier.person.y + 16 + why.length * FULL.type * 1.5;
      // The `why` block has to stop before the seat block starts.
      expect(bottom).toBeLessThan(ELEV.tier.work.y + 90 - FULL.type);
    }
    for (const seat of Object.values(SEAT)) {
      for (const line of wrapLines(seat.note, per)) {
        expect(textWidth(line, FULL.type)).toBeLessThanOrEqual(margin.left.w);
      }
    }
  });
});

/* ── Sheet 03, plane ────────────────────────────────────────────────── */

describe("board projection — sheet 03, plane", () => {
  const cols = planeColumns(districts);
  const rows = planeRows(shapes, districts, works);
  const bottom = planeBottom(rows);

  it("is five shapes against eight departments, and every total is derived", () => {
    expect(rows).toHaveLength(shapes.length);
    expect(cols).toHaveLength(districts.length);

    for (const row of rows) {
      // EXACTLY ONE department paid for each shape — that is what makes
      // `reused = configured - shapes` arithmetic a reader can check.
      const first = cols.filter((c) => planeCell(row, c.district.id) === "trenched");
      expect(first, `${row.shape.key} trenched by`).toHaveLength(1);
      // …and it draws on the shape it paid for.
      expect(row.tapped).toContain(first[0].district.id);
      // A row nothing draws on would render as an empty line with a name.
      expect(row.tapped.length).toBeGreaterThan(0);
    }

    const drawn = rows.reduce((n, r) => n + r.tapped.length, 0);
    expect(drawn).toBe(totals.taps);
    expect(totals.reused).toBe(totals.configured - shapes.length);
  });

  it("the row head holds the shape and its counts WITHOUT running into the grid", () => {
    // ⚠ The first cut printed `14 skills / 8 of 8 draw on it` here, which is
    // 335 units against a 250-unit column — 75 units INTO the grid, on a
    // sheet whose whole argument is the grid.
    for (const { name, view } of LEVELS) {
      for (const row of rows) {
        const label = typeBox(PLANE.row.x, row.cy - view.type * 0.25, row.shape.label, view.type);
        const counts = typeBox(
          PLANE.row.x,
          row.cy + view.type * 1.15,
          `${row.shape.skills} skills / ${row.tapped.length} draw`,
          view.type
        );
        expect(label.right, `${name} / ${row.shape.key} label`).toBeLessThan(PLANE.grid.x);
        expect(counts.right, `${name} / ${row.shape.key} counts`).toBeLessThan(PLANE.grid.x);
        // Two lines in one row, and the row has to hold them both.
        expect(counts.top).toBeGreaterThan(label.bottom);
        expect(counts.bottom).toBeLessThan(row.y + row.h);
        expect(label.top).toBeGreaterThan(row.y);
      }
    }
  });

  it("column heads sit centred in their own column, and marks fit their cells", () => {
    for (const { name, view } of LEVELS) {
      for (const col of cols) {
        const head = typeBoxMid(col.cx, PLANE.colHead, col.district.id, view.type);
        expect(head.left, `${name} / ${col.district.id}`).toBeGreaterThan(col.x);
        expect(head.right).toBeLessThan(col.x + col.w);
        expect(head.bottom).toBeLessThan(PLANE.grid.top);
      }
    }
    expect(PLANE.mark.square).toBeLessThan(cols[0].w);
    expect(PLANE.mark.square).toBeLessThan(PLANE.grid.rowH);
    expect(PLANE.mark.circle * 2).toBeLessThan(cols[0].w);
  });

  it("the annotation band clears the grid, the stamp and the crop", () => {
    const lines = [
      `${totals.reused} of ${totals.configured} configured streams drew on a shape that already existed.`,
      "Filled square / the department that paid to encode the shape.",
      "Open circle / a department that inherited it. Blank / nothing here draws on it.",
    ];

    expect(PLANE.note.y).toBeGreaterThan(bottom);

    for (const { name, view, box } of LEVELS) {
      const stamp = stampBox(view, box);
      for (const [i, line] of lines.entries()) {
        const b = typeBox(PLANE.note.x, PLANE.note.y + i * PLANE.note.line, line, view.type);
        expect(inside(b, cropBox(view)), `${name} / band line ${i} in crop`).toBe(true);
        expect(overlaps(b, stamp), `${name} / band line ${i} under stamp`).toBe(false);
        expect(b.right, `${name} / band line ${i} width`).toBeLessThan(PLANE.grid.right);
      }
    }
  });

  it("the header names the sheet without lettering through its counts", () => {
    const counts = `${pad2(totals.mains)} shapes / ${totals.skills} skills / ${totals.taps} draws`;
    const sub = "Plane / shapes of judgment against the departments that draw on them";
    for (const { name, view } of LEVELS) {
      const title = typeBox(PLANE.row.x, PLANE.head.title, "03 · The substrate", view.type);
      const right = typeBoxRight(PLANE.grid.right, PLANE.head.title, counts, view.type);
      expect(overlaps(title, right), `${name} header`).toBe(false);
      expect(
        typeBox(PLANE.row.x, PLANE.head.sub, sub, view.type).right,
        `${name} subtitle`
      ).toBeLessThan(PLANE.grid.right);
      expect(PLANE.grid.top).toBeGreaterThan(PLANE.colHead);
    }
  });

  it("the ratchet prose fits the expanded notes column", () => {
    const margin = boardMargins(FULL);
    const per = charsIn(margin.left.w, FULL.type);
    const lines = wrapLines(BOARD_RATCHET, per);
    for (const line of lines) {
      expect(textWidth(line, FULL.type)).toBeLessThanOrEqual(margin.left.w);
    }
    const ratchetBottom = PLANE.grid.top + lines.length * FULL.type * 1.5;
    const glossTop = PLANE.note.y - 60;
    expect(ratchetBottom).toBeLessThan(glossTop);

    // The glosses WRAP and carry a running y — the longest is 46 characters
    // against a 43-character column, so a fixed pitch would letter one
    // entry's second line through the next entry's first.
    let y = glossTop;
    for (const row of rows) {
      const lines = wrapLines(`${row.shape.label} · ${row.shape.gloss}`, per);
      for (const [i, line] of lines.entries()) {
        expect(textWidth(line, FULL.type)).toBeLessThanOrEqual(margin.left.w);
        const b = typeBox(margin.left.x, y + i * FULL.type * 1.4, line, FULL.type);
        expect(inside(b, cropBox(FULL)), `gloss ${row.shape.key}`).toBe(true);
      }
      y += lines.length * FULL.type * 1.4 + FULL.type * 0.5;
    }
    expect(y, "the gloss stack fits the crop").toBeLessThan(cropBox(FULL).bottom);
  });
});
