import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
} from "@/lib/cases/types";

/**
 * The work-to-intelligence map's geometry and arithmetic (ADR-062).
 *
 * PURE. No react, no DOM, no three — the three sheets import it and so does
 * `tests/lib/map-projection.test.ts`, which is the point: a drawing whose
 * layout can only be checked by looking at it is a drawing nobody checks.
 *
 * ONE PROJECTION ACROSS ALL THREE SHEETS. `iso()` is the only way a point
 * reaches screen space. Mixing projections is what broke the drawing-set
 * prototype that preceded this one — the plan/section/field trio read as
 * three different hands because the third sheet was orthographic.
 */

/**
 * The authoring space. Every constant below is in these units — the PRD's
 * numbers, verbatim, so the drawing can be checked against the spec.
 */
export const MAP_SPACE = { w: 1160, h: 700 } as const;

/**
 * THE TWO READINGS OF EVERY SHEET (ADR-062 Outstanding 1).
 *
 * `panel` is the casefile's 611x390 console. `full` is the EXPAND overlay,
 * which is the drawing as authored — every annotation, plus the board's
 * parts index.
 *
 * The expanded view is NOT a zoom of the panel: at 1280x720 it buys only
 * ~1.36x of scale (0.80 px/unit against the panel's 0.59), which is nowhere
 * near enough to make a suppressed sentence readable by magnification. What
 * it buys is ROOM — 119 characters across the sheet instead of 80 — and the
 * reduction is therefore a matter of WHAT IS DRAWN, not how big it is.
 */
export type MapDetail = "panel" | "full";

/**
 * Advance width of one character, as a fraction of the type size.
 *
 * PT Mono advances 0.6em and the sheets track at 0.08em, so a character
 * occupies 0.68em. This is the whole reason the sheets can be fitted
 * arithmetically instead of by eye: `<text>` does not wrap, does not
 * ellipsise and does not report its own overflow, so a label that runs off
 * a crop simply vanishes at the edge with nothing to catch it. Every
 * annotation on these sheets is wrapped or placed against this number, and
 * `tests/lib/map-projection.test.ts` re-checks the placements with it.
 */
export const MONO_ADVANCE = 0.68;

/** Width of `text` in authoring units at a given type size. */
export const textWidth = (text: string, type: number) => text.length * type * MONO_ADVANCE;

/** How many characters fit in `w` authoring units at a given type size. */
export const charsIn = (w: number, type: number) =>
  Math.max(6, Math.floor(w / (type * MONO_ADVANCE)));

/**
 * PER-SHEET CROPS — the one adaptation the casefile forced.
 *
 * MEASURED, not chosen: the casefile's viz box is 611x390 at 1280x720 and
 * 688x444 at 1440x800, against the ~950px console the drawing was authored
 * for. Fitting the whole 1160x700 space into 611px puts every label at
 * 6.8px, which is below even the 8.5px chrome floor — the drawing was
 * legible at 1920 and illegible at the binding viewport.
 *
 * Pixels cannot be conjured by viewBox maths, so each sheet crops to the
 * region it actually draws in and the wasted margin goes back to scale.
 * The board's crop also drops the parts index, which is the densest thing
 * on the sheet: 27 rows at a readable size need ~700 units of height in a
 * box that has 560. The index is not lost — it is the mobile fallback's
 * whole content, the expanded sheet's left column, and the hover card names
 * any module on demand.
 *
 * ⚠ Changing a crop changes the rendered type size of that sheet. Re-run
 * the measurement rather than eyeballing it; 1920 hides every defect here.
 *
 * `type` is the label size IN AUTHORING UNITS, and it differs per sheet ON
 * PURPOSE: the crops are different sizes, so the same unit value would
 * render at a different pixel size on each sheet. These are tuned so all of
 * them land at roughly the same rendered size — re-tune by measuring, never
 * by eye.
 */
export const SHEET_VIEWBOX = {
  /* The board plate plus its plaques and bus label — no index column. */
  board: { x: 330, y: 88, w: 800, h: 570, type: 16 },
  /* The assembly, its label rail and the two left-column readouts. */
  unit: { x: 40, y: 44, w: 1080, h: 668, type: 19 },
  /* Mains labelled at both ends; the annotation sits below every riser AND
     clear of the provenance stamp, which is what the extra height buys. */
  grade: { x: 40, y: 44, w: 1080, h: 700, type: 19 },
} as const;

/**
 * The expanded crops. All three take the WHOLE authoring space — the board
 * gains its index column back at x 40, and the other two gain the margin
 * their suppressed annotation needs.
 *
 * `type` is smaller in authoring units precisely BECAUSE the box is bigger:
 * the two changes multiply, so 14 units here renders at about the same
 * pixel size as 19 units does in the panel while buying half again as many
 * characters across the sheet.
 */
export const SHEET_VIEWBOX_FULL = {
  board: { x: 20, y: 30, w: 1130, h: 770, type: 14 },
  unit: { x: 20, y: 34, w: 1130, h: 720, type: 14 },
  grade: { x: 20, y: 34, w: 1130, h: 730, type: 14 },
} as const;

export interface SheetView {
  x: number;
  y: number;
  w: number;
  h: number;
  type: number;
}

export function sheetView(sheet: keyof typeof SHEET_VIEWBOX, detail: MapDetail): SheetView {
  return detail === "full" ? SHEET_VIEWBOX_FULL[sheet] : SHEET_VIEWBOX[sheet];
}

export const viewBoxOf = (v: { x: number; y: number; w: number; h: number }) =>
  `${v.x} ${v.y} ${v.w} ${v.h}`;

/**
 * THE PROVENANCE STAMP IS AN OBSTACLE IN THE DRAWING, and a moving one.
 *
 * `.fl-imap__stamp` is DOM chrome pinned to the canvas's bottom-right in
 * SCREEN pixels, so its footprint in AUTHORING units grows as the canvas
 * shrinks — the smaller the console, the more of the sheet it eats. That is
 * why the binding case is 1280x720 and why sheet 03's annotation band is
 * budgeted against `stampBox` rather than placed by eye: the first cut had
 * the derived reuse sentence, which is the sheet's whole argument, printed
 * straight through the words "illustrative record".
 *
 * The stamp cannot simply move: the tab strip's tail holds the projection
 * note and the EXPAND control, all three sheets use their top-right corner
 * for counts, and the foot is already two lines of chrome squeezed into
 * 611px. So the drawing yields, and the yield is asserted.
 */
export const STAMP = { rightPx: 12, bottomPx: 9, wPx: 236, hPx: 18 } as const;

/**
 * The canvas boxes MEASURED at 1280x720 — the viewport that binds, and the
 * one every defect on this surface has hidden from at 1920. Used to convert
 * the stamp into authoring units.
 */
export const MAP_REFERENCE_BOX = {
  panel: { w: 611, h: 376 },
  full: { w: 1216, h: 584 },
} as const;

/** The stamp's footprint in a sheet's own authoring units. */
export function stampBox(view: SheetView, box: { w: number; h: number }) {
  const scale = Math.min(box.w / view.w, box.h / view.h);
  const offX = (box.w - view.w * scale) / 2;
  const offY = (box.h - view.h * scale) / 2;
  return {
    left: view.x + (box.w - STAMP.rightPx - STAMP.wPx - offX) / scale,
    right: view.x + (box.w - STAMP.rightPx - offX) / scale,
    top: view.y + (box.h - STAMP.bottomPx - STAMP.hPx - offY) / scale,
    bottom: view.y + (box.h - STAMP.bottomPx - offY) / scale,
  };
}

export type Pt = readonly [number, number];

/**
 * 2:1 axonometric. `a` runs right-and-down, `b` runs left-and-down, and
 * screen-vertical is z — so a positive `cy` offset is DEPTH, which is what
 * lets sheet 03 hang its mains under the board without a second projection.
 */
export function iso(cx: number, cy: number, a: number, b: number): Pt {
  return [cx + a - b, cy + (a + b) * 0.5];
}

export function poly(points: readonly Pt[]): string {
  return points.map((p) => `${p[0]},${p[1]}`).join(" ");
}

/** Horizontal-tangent cubic — the work's entry curve on sheet 02. */
export function curve(from: Pt, to: Pt): string {
  const dx = (to[0] - from[0]) * 0.45;
  return `M ${from[0]} ${from[1]} C ${from[0] + dx} ${from[1]} ${to[0] - dx} ${to[1]} ${to[0]} ${to[1]}`;
}

/** A diamond, used for the index's configured mark and the entry node. */
export function diamond(x: number, y: number, r: number): string {
  return `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
}

/**
 * PAINTER ORDER. Sort by `(a + b)` ascending so far objects draw first and
 * near objects overlap them. SVG has no z-buffer; document order IS depth,
 * so anything that skips this sort draws a plate through the one in front.
 */
export function byDepth<T extends { a: number; b: number }>(items: readonly T[]): T[] {
  return [...items].sort((x, y) => x.a + x.b - (y.a + y.b));
}

/* ── Sheet 01, THE BOARD ────────────────────────────────────────────────
   The estate as a switchboard: district plates on one board, modules on
   their district, every district traced down to a single bus. */
export const BOARD = {
  cx: 730,
  cy: 372,
  A: 215,
  B: 160,
  /** Four columns × two rows seats the eight districts. */
  col: [-160, -53, 53, 160],
  row: [-78, 78],
  /** District plate half-extents and slab thickness. */
  da: 48,
  db: 60,
  thickness: 11,
  /** Module seats within a district. SIX is the geometric ceiling: a
   *  seventh module falls off its plate rather than clipping, so the
   *  registry test guards the count instead of the drawing hiding it. */
  chip: [
    [-20, -34],
    [20, -34],
    [-20, 0],
    [20, 0],
    [-20, 34],
    [20, 34],
  ],
  chipHalf: 11,
  chipHeight: 9,
} as const;

export const BOARD_CHIP_SLOTS = BOARD.chip.length;

/**
 * THE PARTS INDEX — the expanded board's left column.
 *
 * A schematic without its index is decor, and the panel crop cannot hold
 * one: 35 lines (eight district heads and 27 modules) need ~800 units of
 * height in a crop that has 570, in a column the panel crop starts to the
 * right of. So the index is what the EXPAND control exists to restore.
 *
 * ⚠ IT LETTERS AT THE SHEET'S OWN TYPE, and the first cut's 0.78 scale is
 * why: it rendered the rows at 9.0px, under the 10px reading floor, on a
 * column whose whole job is to NAME every module. The rule is `rules/
 * proof.md`'s — when the box will not take the size, spend leading or
 * height, never the type. So the expanded board's crop is 60 units taller
 * than the other two sheets', which costs every label on it about 0.5px and
 * buys the index its legibility.
 */
export const BOARD_INDEX = {
  x: 40,
  /** Wide enough for the longest title AND its right-aligned lane at the
   *  sheet's own type, and still short of the board's leading vertex. */
  w: 288,
  /** Below the sheet's own title band — the index header shares this
   *  column with it, and at the first cut they were lettered on top of
   *  each other. */
  top: 118,
  /** Extra lead before each district head, so the groups read as groups. */
  gap: 8,
  head: 18,
  row: 18,
} as const;

export interface IndexLine {
  kind: "head" | "row";
  y: number;
  id: string;
  label: string;
  /** Right-aligned tail: the module count, or the lane. */
  tail: string;
  person?: boolean;
}

/**
 * The index as flat, pre-placed lines. Returned rather than laid out in
 * JSX so the projection test can assert that the last line still lands
 * inside the expanded crop — an index that runs off the bottom is exactly
 * the failure this column was cut from the panel to avoid.
 */
export function boardIndexLines(
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[]
): IndexLine[] {
  const out: IndexLine[] = [];
  let y = BOARD_INDEX.top;
  for (const district of districts) {
    const rows = worksInDistrict(works, district.id);
    y += BOARD_INDEX.gap;
    out.push({
      kind: "head",
      y,
      id: district.id,
      label: district.name,
      tail: String(rows.length),
    });
    y += BOARD_INDEX.head;
    for (const work of rows) {
      out.push({
        kind: "row",
        y,
        id: work.id,
        label: work.title,
        tail: work.lane ?? "Person",
        person: isPersonLed(work),
      });
      y += BOARD_INDEX.row;
    }
  }
  return out;
}

export interface PlacedDistrict {
  district: CaseMapDistrict;
  a: number;
  b: number;
}

/** District seats on the board, painted far to near. */
export function placeBoardDistricts(districts: readonly CaseMapDistrict[]): PlacedDistrict[] {
  return byDepth(
    districts.map((district, k) => ({
      district,
      a: BOARD.col[k % 4],
      b: BOARD.row[Math.floor(k / 4)],
    }))
  );
}

/* ── Sheet 02, THE UNIT ─────────────────────────────────────────────────
   One module exploded on a vertical assembly axis. HEIGHT IS AUTHORITY,
   not importance — which is why the split plates divide along the DEPTH
   axis: both halves sit at the same altitude, because skill and model are
   mutually dependent and neither outranks the other. */
export const UNIT = {
  cx: 430,
  A: 84,
  B: 30,
  thickness: 12,
  /**
   * Owner · what runs it · what it inherits · what it can reach.
   *
   * ⚠ THE STRIDE IS A CLEARANCE, NOT A RHYTHM. A plate is `(A + B)` tall in
   * screen units plus its slab `thickness`, so any stride below 126 makes
   * consecutive plates INTERSECT — which is exactly what the first cut
   * shipped (108 against a 142-unit plate, a 34-unit overlap). Change `A`,
   * `B` or `thickness` and this array moves with them; the projection test
   * fails rather than the drawing merely looking wrong.
   */
  plateY: [150, 278, 406, 534],
  railX: 578,
  /** Where the label rail's copy starts, and the margin it wraps against. */
  railText: 590,
  right: 1090,
  /** Left rule of the dimension and draw-meter readouts. */
  left: 70,
  entry: [96, 112] as Pt,
  axis: { top: 132, bottom: 606 },
  gate: { x1: 404, x2: 416, top: 610, bottom: 642 },
  /** The autonomy dimension line — a DISTANCE between the owner and the
   *  machine, so it is drawn with the dimension primitive rather than
   *  becoming a fifth plate. Seated clear of the readout copy on its left
   *  and the plate stack on its right. */
  dimX: 275,
  /** The draw meter's own band, below the gate rather than beside it. */
  meterY: 664,
} as const;

/**
 * NOTHING IS LETTERED ON A PLATE (ADR-062 Outstanding 1).
 *
 * The plate face is 2·(A + B) units wide and a value like
 * `Component + supplier facts` is 26 characters — 335 units at the panel's
 * type, wider than the whole plate and nearly three times its half. Every
 * attempt to seat those values on the halves either crossed the centre
 * line or ran off the edge, at BOTH detail levels, because the collision is
 * arithmetic and not a matter of scale.
 *
 * So the plates carry the MATERIAL language alone — hatched green is
 * encoded here, open dots are rented, blue-grey dashed is the adjacent
 * domain — and the label rail carries the words, in the halves' own
 * left-then-right order. That is the division the sheet's own doc comment
 * already asked for: provenance is carried by the drawing and never also
 * written down.
 */
export const UNIT_RAIL_LABELS = {
  skill: "Skill",
  model: "Model",
  context: "Context",
  graph: "Graph facts",
  connectors: "Connectors",
  surfaces: "Surfaces",
} as const;

/** How much a stream decides alone. `depth` indexes `UNIT.plateY`. */
export const SEAT = {
  ABOVE: { label: "Wide", note: "The owner audits the gate, not every result", depth: 3 },
  EDGE: { label: "Bounded", note: "The owner handles the exceptions", depth: 2 },
  INSIDE: { label: "Narrow", note: "The owner reads every result", depth: 1 },
  PERSON: { label: "None", note: "The person does the work", depth: 0 },
} as const;

/** Draw meter bands, indexed by `CaseMapWork["mass"]`. Read against the
 *  workload — never a price, on any surface, in any form. */
export const MASS_BAND = ["Nil", "Minimal", "Light", "Moderate", "Heavy", "Dense"] as const;

/* ── Sheet 03, BELOW GRADE ──────────────────────────────────────────────
   The same board, one level down. It is drawn in the SAME isometric so the
   set reads as one hand; the board floats above as a ghost, and the mains
   run beneath its spine. */
export const UG = {
  cx: 566,
  /** The ghosted board's centre. Its top vertex is `(A + B) / 2` above this,
   *  so this is what keeps the ghost clear of the sheet's title band — and
   *  every unit spent here is a unit the annotation band loses. */
  cy: 196,
  A: 155,
  B: 88,
  col: [-116, -39, 39, 116],
  row: [-56, 56],
  da: 34,
  db: 32,
  /**
   * Depth below the spine, per shape. Order is the drawing's, not the
   * data's — the mains stack in a fixed sequence so the strata read the
   * same on every render.
   *
   * ⚠ TWO CONSTRAINTS, AND THE FIRST CUT MISSED BOTH. The stride must clear
   * a line of type (30 units did not, so all five labels overlapped), and
   * the first main must start below the ghosted board or its label is drawn
   * across it. `voice` is therefore not a free number: it is the board's
   * lower vertex plus a line.
   */
  depth: {
    voice: 226,
    judgment: 252,
    validation: 278,
    stakeholder: 304,
    pattern: 330,
  } as Record<CaseMapShapeKey, number>,
  dropFrom: -110,
  dropTo: 110,
  /**
   * The annotation band, seated BELOW the deepest riser AND the deepest
   * main's counts — at the first cut's spread the risers ran straight
   * through it. Its floor is the far end of the `pattern` main, which is
   * `A / 2` lower than the depth line it hangs from.
   */
  noteY: 628,
  left: 70,
  right: 1090,
} as const;

export interface PlacedRiser extends PlacedDistrict {
  /** Where this district meets the spine before dropping. */
  drop: number;
}

/**
 * District footprints plus their drop points along the spine.
 *
 * ONE RISER PER DISTRICT, not per work stream. The substrate claim is a
 * team-level claim ("five districts tap judgment"); 27 risers with 63 taps
 * is unreadable at panel size, and per-stream detail lives in the hover
 * card instead. Drops are spread evenly and ordered by the district's own
 * (a, b) so the laterals never cross.
 */
export function placeRisers(districts: readonly CaseMapDistrict[]): PlacedRiser[] {
  const seats: { a: number; b: number }[] = [];
  for (const a of UG.col) for (const b of UG.row) seats.push({ a, b });

  const placed = districts
    .map((district, i) => ({ district, a: seats[i].a, b: seats[i].b }))
    .sort((x, y) => x.a - y.a || x.b - y.b);

  const span = UG.dropTo - UG.dropFrom;
  return placed.map((p, i) => ({
    ...p,
    drop: UG.dropFrom + span * (i / Math.max(1, placed.length - 1)),
  }));
}

/* ── Derivations ────────────────────────────────────────────────────────
   EVERY PUBLISHED TOTAL IS COMPUTED. The prototype hard-coded three of them
   ("19 OF 24", the header counts, the footer counts); a hard-coded total is
   a number that goes stale the first time a row is edited, and on this
   surface a stale total is a confidentiality problem, not a typo. */

export const isPersonLed = (w: CaseMapWork) => w.lane === null;

export function worksInDistrict(works: readonly CaseMapWork[], districtId: string) {
  return works.filter((w) => w.dist === districtId);
}

/** Shape keys in DRAWING order — the order the mains stack below grade. */
export function orderShapes(
  shapes: readonly CaseMapShape[],
  keys: readonly CaseMapShapeKey[]
): CaseMapShapeKey[] {
  return shapes.map((s) => s.key).filter((k) => keys.includes(k));
}

/** Every shape a district's work draws on, in drawing order. */
export function districtShapes(
  shapes: readonly CaseMapShape[],
  works: readonly CaseMapWork[],
  districtId: string
): CaseMapShapeKey[] {
  const seen = new Set<CaseMapShapeKey>();
  for (const w of worksInDistrict(works, districtId)) for (const k of w.shapes) seen.add(k);
  return orderShapes(shapes, [...seen]);
}

/**
 * The shapes a district PAID to encode. A square marker on a main means
 * this district trenched it; a round tap means it inherited one that
 * already existed. That distinction is the whole economic argument of the
 * third sheet, so it is derived from `shape.first` and never authored.
 */
export function districtTrenched(
  shapes: readonly CaseMapShape[],
  works: readonly CaseMapWork[],
  districtId: string
): CaseMapShapeKey[] {
  return shapes
    .filter((s) => works.find((w) => w.id === s.first)?.dist === districtId)
    .map((s) => s.key);
}

/** The shapes this stream trenched, if any. */
export function trenchedBy(shapes: readonly CaseMapShape[], workId: string): CaseMapShape[] {
  return shapes.filter((s) => s.first === workId);
}

export interface MapTotals {
  modules: number;
  configured: number;
  personLed: number;
  districts: number;
  skills: number;
  mains: number;
  /** District→main connections across the whole estate. */
  taps: number;
  /** Configured streams that tapped a main which already existed. */
  reused: number;
}

export function mapTotals(
  shapes: readonly CaseMapShape[],
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[]
): MapTotals {
  const configured = works.filter((w) => !isPersonLed(w)).length;
  return {
    modules: works.length,
    configured,
    personLed: works.length - configured,
    districts: districts.length,
    skills: shapes.reduce((n, s) => n + s.skills, 0),
    mains: shapes.length,
    taps: districts.reduce((n, d) => n + districtShapes(shapes, works, d.id).length, 0),
    /* Each shape is trenched exactly once, by its `first`. So every OTHER
       configured stream tapped a main that already existed — which is the
       ratchet, stated as arithmetic rather than asserted. */
    reused: configured - shapes.length,
  };
}

/** Districts whose work draws on a given main. */
export function districtsTapping(
  shapes: readonly CaseMapShape[],
  works: readonly CaseMapWork[],
  districts: readonly CaseMapDistrict[],
  key: CaseMapShapeKey
): CaseMapDistrict[] {
  return districts.filter((d) => districtShapes(shapes, works, d.id).includes(key));
}

/** Zero-padded ordinal for the chrome, e.g. `05 MAINS`. */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Greedy wrap to a character measure. SVG `<text>` does not wrap, so any
 * annotation longer than its column has to be broken into `<tspan>`-free
 * sibling lines at author time. Measured in characters rather than pixels
 * because the whole surface is one monospace face at one size.
 */
export function wrapLines(text: string, per: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > per && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}
