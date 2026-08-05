import type { CaseMapDistrict, CaseMapShape, CaseMapShapeKey, CaseMapWork } from "@/lib/cases/types";

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
 * whole content and the expanded view's left third, and the hover card
 * names any module on demand.
 *
 * ⚠ Changing a crop changes the rendered type size of that sheet. Re-run
 * the measurement rather than eyeballing it; 1920 hides every defect here.
 *
 * `type` is the label size IN AUTHORING UNITS, and it differs per sheet ON
 * PURPOSE: the crops are different sizes, so the same unit value would
 * render at a different pixel size on each sheet. These three are tuned so
 * all three land at roughly the same rendered size — re-tune by measuring,
 * never by eye.
 */
export const SHEET_VIEWBOX = {
  /* The board plate plus its plaques and bus label — no index column. */
  board: { x: 330, y: 88, w: 800, h: 570, type: 15 },
  /* The full assembly: entry at x 100, rail labels out to ~1100. */
  unit: { x: 40, y: 48, w: 1080, h: 660, type: 19 },
  /* Main labels start at ~x 150; the annotation block runs to y 690. */
  grade: { x: 40, y: 48, w: 1080, h: 660, type: 19 },
} as const;

export const viewBoxOf = (v: { x: number; y: number; w: number; h: number }) =>
  `${v.x} ${v.y} ${v.w} ${v.h}`;

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
  cx: 372,
  A: 96,
  B: 34,
  thickness: 12,
  /** Owner · what runs it · what it inherits · what it can reach. */
  plateY: [172, 280, 388, 496],
  railX: 690,
  entry: [100, 100] as Pt,
  gate: { x1: 372 - 26, x2: 372 - 14, top: 578, bottom: 612 },
  /** The autonomy dimension line — a DISTANCE between the owner and the
   *  machine, so it is drawn with the dimension primitive rather than
   *  becoming a fifth plate. */
  dimX: 176,
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
  cy: 178,
  A: 170,
  B: 96,
  col: [-128, -43, 43, 128],
  row: [-60, 60],
  da: 38,
  db: 34,
  /** Depth below the spine, per shape. Order is the drawing's, not the
   *  data's — the mains stack in a fixed sequence so the strata read the
   *  same on every render. */
  depth: {
    voice: 236,
    judgment: 266,
    validation: 296,
    stakeholder: 326,
    pattern: 356,
  } as Record<CaseMapShapeKey, number>,
  dropFrom: -150,
  dropTo: 150,
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
