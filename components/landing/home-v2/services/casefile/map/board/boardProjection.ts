import type { CaseMapChain, CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

import {
  type MapDetail,
  type SheetView,
  MONO_ADVANCE,
  charsIn,
  textWidth,
  worksInDistrict,
  wrapLines,
} from "../mapProjection";

/**
 * THE BOARD ARCHETYPE — geometry and arithmetic for the look-dev alternative
 * to ADR-062's isometric city.
 *
 * PURE. No react, no DOM. `tests/lib/board-projection.test.ts` imports this
 * and nothing else, which is the point: SVG `<text>` does not wrap, does not
 * ellipsise and does not report its own overflow, so a label past its crop
 * vanishes at the edge with nothing on screen to say it happened. Fit is
 * asserted here, never reviewed by eye.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * The isometric is the city's cost centre, and the reasons are arithmetic
 * rather than aesthetic:
 *
 *   1. NO LABEL HAS A BASELINE. Every plate edge runs at ±30°, so a label
 *      either floats free — colliding with whatever is behind it — or skews,
 *      and a skewed 10px label is unreadable.
 *   2. POSITION DEPENDS ON THE WHOLE SCENE. Back-row objects are occluded by
 *      front-row ones, which is why ADR-062's district plaques had to hang
 *      ABOVE their plates rather than below them.
 *   3. DEPTH EATS WIDTH. A plate of face-width W occupies W + depth
 *      horizontally, in a console that is 611px wide.
 *
 * So this archetype is orthographic and its primitive is a BOX WITH TEXT
 * INSIDE IT. Overlap stops being something a test has to catch and becomes
 * something the layout cannot express.
 *
 * ── One space, one crop, one type size ────────────────────────────────────
 * ADR-062 gave each sheet its own crop and its own type size in authoring
 * units, tuned so the three landed at the same rendered size. All three
 * sheets here share ONE authoring space and ONE crop, so that tuning problem
 * does not exist: the sheets cannot drift apart because there is only one
 * number.
 *
 * ── The three operations ──────────────────────────────────────────────────
 * The sheets are told apart by WHAT THEY DO to the record, not by their
 * vocabulary — which is what lets all three share the box-and-run primitive
 * without a reader confusing them:
 *
 *   01 PLACEMENT  locates, and crosses  — registers of work, runs between them
 *   02 ELEVATION  dissects              — one stream, on a vertical authority axis
 *   03 PLANE      tabulates             — shapes against departments, as a grid
 */

/* ── The space, and the two readings of it ──────────────────────────────── */

/** The authoring space. Every constant below is in these units. */
export const BOARD_SPACE = { w: 1000, h: 615 } as const;

export type BoardSheet = "place" | "unit" | "plane";

/**
 * ⚠ THE SUB IS THE DIAGRAM TYPE AND NOTHING ELSE.
 *
 * `.fl-imap__tabs-note` is the tab strip's tail and it yields first — it is
 * `overflow: hidden` and the EXPAND control has to stay reachable at every
 * width. Longer subs pushed the tail until the note rendered as `OSS`, a
 * fragment of "Locate + cross", which reads as a defect rather than as
 * yielding. One word per sub, and the operation gets the tail to itself.
 */
export const BOARD_SHEETS: readonly {
  id: BoardSheet;
  ord: string;
  name: string;
  sub: string;
  /** The operation, printed in the tab strip's tail. */
  note: string;
}[] = [
  { id: "place", ord: "01", name: "The work", sub: "Placement", note: "Locate + cross" },
  { id: "unit", ord: "02", name: "The configuration", sub: "Elevation", note: "Dissect" },
  { id: "plane", ord: "03", name: "The substrate", sub: "Plane", note: "Tabulate" },
];

/**
 * THE CROPS, AND WHY THE EXPANDED ONE LETTERS SMALLER.
 *
 * `panel` matches the casefile console's aspect (611×376 ⇒ 1.625) almost
 * exactly, so `xMidYMid meet` wastes nothing: 0.611 px per unit, 17 units of
 * type rendering at 10.4px, 86 characters across the sheet.
 *
 * `full` is the SAME drawing in a WIDER crop — the core still occupies
 * 0..1000 × 0..615, and the margins the crop adds are where the annotation
 * the panel suppresses goes. The type gets SMALLER in authoring units
 * precisely because the crop is bigger: 13 units at the overlay's 0.770 px
 * per unit renders at 10.0px, essentially the panel's size, while buying 178
 * characters across instead of 86.
 *
 * ⚠ That inequality is the contract, not a coincidence. A `full` crop that
 * lettered LARGER would have turned EXPAND into the zoom ladder ADR-062
 * closed: the overlay exists to buy ROOM, never magnification.
 */
export const BOARD_VIEWBOX: Record<MapDetail, SheetView> = {
  /* 18 units renders at 11.0px on the 611×376 console — the floor
     `rules/proof.md` sets for a work-node identity, and this sheet is made of
     work-node identities. 17 measured at 10.4px, which is the band the
     isometric city already sits in and the reason it cannot be read. */
  panel: { x: 0, y: 0, w: 1000, h: 615, type: 18 },
  /* The room goes mostly to the LEFT, because that is where a drawing set
     puts its notes column. Asymmetric on purpose; the drawing stays where it
     was and the margin is new space rather than a re-centring. */
  full: { x: -430, y: -60, w: 1580, h: 758, type: 14 },
};

export function boardView(detail: MapDetail): SheetView {
  return BOARD_VIEWBOX[detail];
}

/** The margin the expanded crop adds on each side, in authoring units. */
export function boardMargins(view: SheetView) {
  return {
    left: { x: view.x + 10, w: -view.x - 20 },
    right: { x: BOARD_SPACE.w + 10, w: view.x + view.w - BOARD_SPACE.w - 20 },
    top: view.y,
    bottom: view.y + view.h,
  };
}

/* ── Sheet 01, PLACEMENT ─────────────────────────────────────────────────
   Two columns of department registers — a bordered stack of labelled cells
   per department, headed by its name on its own baseline. The reference is
   a terminal's board listing, and the reason it is the right primitive here
   is that TEXT LIVES INSIDE A BOX ON A BASELINE. The city's plaques floated;
   these cannot. */
export const PLACE = {
  /**
   * Header band baselines.
   *
   * ⚠ 26 UNITS BETWEEN THEM, NOT 22. A line box at panel type is 23.4 units,
   * so a 22-unit spacing puts the title's descender box 1.4 units into the
   * subtitle's ascender box — a real label-on-label overlap that the lab's
   * collision readout caught and that no crop or stamp check can see.
   */
  head: { title: 30, sub: 56, rule: 66 },
  /** First register's top edge. */
  top: 72,
  colX: [10, 540] as const,
  colW: 450,
  /** The gutter between the columns — where every run travels. */
  gutter: { x: 460, w: 80 },
  /** Lanes inside the gutter, one per chain, so two chains never share a line. */
  lane: [478, 496, 514] as const,
  headRow: 25,
  cellRow: 25,
  /** Lead between one register and the next in the same column. */
  gap: 12,
  /** Inner padding of a cell and of a head. */
  pad: 9,
  left: 10,
  right: 990,
} as const;

export interface PlacedCell {
  work: CaseMapWork;
  col: 0 | 1;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedRegister {
  district: CaseMapDistrict;
  col: 0 | 1;
  x: number;
  y: number;
  /** Head row plus every cell. */
  h: number;
  cells: PlacedCell[];
}

/**
 * The registers, balanced across two columns.
 *
 * DETERMINISTIC GREEDY, not a hand-assigned grid: each department goes to
 * whichever column is currently shorter, in record order. That keeps the two
 * columns within one row of each other whatever the record does, so adding a
 * ninth department or a sixth Creative stream re-balances instead of running
 * a column off the bottom of the crop — which is exactly the failure the
 * city's six-slot chip ceiling had to be guarded against.
 */
export function placeRegisters(
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[]
): PlacedRegister[] {
  const colY: [number, number] = [PLACE.top, PLACE.top];
  const out: PlacedRegister[] = [];

  for (const district of districts) {
    const rows = worksInDistrict(works, district.id);
    const col: 0 | 1 = colY[0] <= colY[1] ? 0 : 1;
    const x = PLACE.colX[col];
    const y = colY[col];
    const h = PLACE.headRow + rows.length * PLACE.cellRow;

    out.push({
      district,
      col,
      x,
      y,
      h,
      cells: rows.map((work, i) => ({
        work,
        col,
        x,
        y: y + PLACE.headRow + i * PLACE.cellRow,
        w: PLACE.colW,
        h: PLACE.cellRow,
      })),
    });

    colY[col] = y + h + PLACE.gap;
  }

  return out;
}

/** Every cell, flattened — the lookup a run needs to find its endpoints. */
export function cellIndex(registers: readonly PlacedRegister[]): Map<string, PlacedCell> {
  const map = new Map<string, PlacedCell>();
  for (const r of registers) for (const c of r.cells) map.set(c.work.id, c);
  return map;
}

/** Where a run leaves or enters a cell: the edge that faces the gutter. */
export const cellPort = (cell: PlacedCell): [number, number] => [
  cell.col === 0 ? cell.x + cell.w : cell.x,
  cell.y + cell.h / 2,
];

/**
 * One step of a chain, routed orthogonally through the gutter.
 *
 * ORTHOGONAL ON PURPOSE. A curve between two rows of a register reads as a
 * relationship diagram, which is the vocabulary sheet 02 owns; a right-angled
 * run reads as a connection on a board, which is the vocabulary this sheet
 * owns. Same primitive as the cells it joins, different operation.
 */
export function routeStep(from: PlacedCell, to: PlacedCell, laneX: number): string {
  const [fx, fy] = cellPort(from);
  const [tx, ty] = cellPort(to);
  return `M ${fx} ${fy} H ${laneX} V ${ty} H ${tx}`;
}

export interface ChainRoute {
  chain: CaseMapChain;
  laneX: number;
  steps: { from: PlacedCell; to: PlacedCell; d: string }[];
  /** Every step whose two ends sit in different departments. */
  crossings: number;
}

/**
 * The chains, routed.
 *
 * WHY THIS SHEET DRAWS THEM AT ALL. The map is cross-functional rather than
 * six good team-level views because work CROSSES teams — a campaign runs
 * brief to on-visual copy to declination to listing, encoded steps owned by
 * different departments with a person carrying the context across every
 * handoff. Clustering alone cannot show that, and clustering alone is what
 * the city's sheet 01 drew.
 */
export function routeChains(
  chains: readonly CaseMapChain[],
  registers: readonly PlacedRegister[]
): ChainRoute[] {
  const cells = cellIndex(registers);

  return chains.map((chain, i) => {
    const steps: ChainRoute["steps"] = [];
    let crossings = 0;
    const laneX = PLACE.lane[i % PLACE.lane.length];

    for (let s = 0; s < chain.steps.length - 1; s += 1) {
      const from = cells.get(chain.steps[s]);
      const to = cells.get(chain.steps[s + 1]);
      if (!from || !to) continue;
      if (from.work.dist !== to.work.dist) crossings += 1;
      steps.push({ from, to, d: routeStep(from, to, laneX) });
    }

    return { chain, laneX, steps, crossings };
  });
}

/** The departments that PAID to encode a shape — the full sheet's margin note. */
export function trenchNotes(
  shapes: readonly CaseMapShape[],
  works: readonly CaseMapWork[]
): Map<string, string> {
  const out = new Map<string, string>();
  for (const shape of shapes) {
    const dist = works.find((w) => w.id === shape.first)?.dist;
    if (!dist) continue;
    out.set(dist, out.has(dist) ? `${out.get(dist)} / ${shape.label}` : shape.label);
  }
  return out;
}

/* ── Sheet 02, ELEVATION ─────────────────────────────────────────────────
   One stream on a vertical authority axis. HEIGHT IS AUTHORITY: the person
   is above, and SKILL and MODEL sit at the SAME altitude joined by a tie,
   because the Skill needs the model and the model needs the Skill — neither
   outranks the other and a stack that implied otherwise would be a claim the
   record does not make. */
export const ELEV = {
  head: { title: 30, sub: 56, rule: 66 },
  /**
   * Every tier is centred here; the rail takes the space to its right.
   *
   * ⚠ THE LONGEST VALUE ON RECORD SETS THIS NUMBER. `Component + supplier
   * facts` is 26 characters — 318 units at panel type — so the rail needs
   * 318 units of run, the elbows need clear air between the tier edge and
   * the rail, and the stack has to move left to give both. Widening the
   * stack is how a rail value ends up clipped, and a clipped value on a
   * record is a value that vanished.
   */
  cx: 410,
  tier: {
    /* ⚠ A TIER IS SIZED BY ITS LONGEST CONTENT, NOT BY ITS NEIGHBOURS.
       Two measurements set these heights, and both were found by the
       drawing being wrong first: the owner's note runs to 31 characters,
       which needs the same 460 width as everything else rather than 400;
       and `bar` runs to 46, which WRAPS TO THREE LINES at panel type. A
       uniform 58 clipped both. Boxes grow; type never shrinks. */
    person: { y: 78, h: 58, w: 460 },
    work: { y: 150, h: 86, w: 460 },
    /**
     * THE INTERDEPENDENT PAIR — ONE member, split down the middle.
     *
     * Skill and model sit at the SAME altitude because the Skill needs the
     * model and the model needs the Skill; neither outranks the other. Two
     * separate boxes at one height would still have needed a tie drawn
     * between them to say so, and a 20-unit gap cannot hold a legible one.
     * One box with a divider says it structurally.
     */
    pair: { y: 250, h: 56, w: 460 },
    /** Context and graph facts — the footing the pair stands on. */
    ground: { y: 342, h: 52, w: 460 },
    /** What it can reach: systems it acts on, surfaces where it is met. */
    reach: { y: 420, h: 46, w: 460 },
  },
  /** Inner padding of a tier, per side. */
  pad: 12,
  /** The gate the output leaves through — a double rule with an aperture. */
  gate: { y: 500, gap: 6, x1: 150, x2: 690, aperture: 22, label: 536 },
  /** Where a leader elbows before running into the label rail. Every elbow
   *  stays right of the tier stack's edge (640), so a leader can never be
   *  drawn across a tier. */
  railX: 660,
  railText: 666,
  right: 990,
  left: 10,
  /**
   * The autonomy dimension line. AUTONOMY IS A DISTANCE between the owner and
   * the machine, not another component, so it is drawn with the dimension
   * primitive and never becomes a fifth tier.
   */
  dimX: 176,
  /** `band` is where the mass word sits, BESIDE the cells rather than under
   *  them — the block has to clear both the gate label above it and the
   *  provenance stamp below it, and stacking a third line does neither. */
  meter: { x: 10, y: 552, cell: 26, h: 16, gap: 4, label: 544, band: 166, caption: 592 },
  /**
   * Rail entries.
   *
   * ⚠ THE PITCH IS A CLEARANCE, NOT A RHYTHM. At `full` an entry draws THREE
   * lines — label, value, note — at `type * 1.4` apart, so the last one ends
   * `type * 2.8` below its label and the next label needs another line box
   * (`type * 1.3`) after that. Anything under `type * 4.1` makes consecutive
   * entries collide. The panel draws two lines but at a bigger type, so both
   * readings have to be checked; neither is automatically the binding one.
   */
  railRow: 62,
  railTop: 240,
  /** Leader elbows, staggered so two verticals never share a line. */
  elbowStep: 3,
} as const;

/**
 * ⚠ THE PANEL SHOWS FOUR RAIL ENTRIES, THE EXPANDED READING SIX.
 *
 * Six entries at panel type need 6 × 62 units of pitch below `railTop`, and
 * the last one then lands in the provenance stamp. Reach is what gives: the
 * reach TIER is still drawn, so a reader sees that the configuration reaches
 * out of itself, and the systems it reaches are named in the hover card and
 * in the expanded reading. That is a suppression, recorded here, rather than
 * a shrink — this surface's type law spends density, never type.
 */
export const ELEV_RAIL_PANEL = 4;

export const ELEV_RAIL_KEYS = [
  "skill",
  "model",
  "context",
  "graph",
  "connectors",
  "surfaces",
] as const;

export type ElevRailKey = (typeof ELEV_RAIL_KEYS)[number];

export const ELEV_RAIL_LABELS: Record<ElevRailKey, string> = {
  skill: "Skill",
  model: "Model",
  context: "Context",
  graph: "Graph facts",
  connectors: "Connectors",
  surfaces: "Surfaces",
};

export interface RailEntry {
  key: ElevRailKey;
  label: string;
  value: string;
  /** Third line — the note. Suppressed at panel detail. */
  note: string;
  /** Baseline of the label; the value sits one line below. */
  y: number;
  /** The tier this entry leads back to. */
  from: { x: number; y: number };
  /** This entry's own elbow, so no two leaders share a vertical. */
  elbowX: number;
}

/** The tier boxes, resolved to absolute rectangles. */
export function elevBoxes() {
  const box = (t: { y: number; h: number; w: number }) => ({
    x: ELEV.cx - t.w / 2,
    y: t.y,
    w: t.w,
    h: t.h,
  });
  return {
    person: box(ELEV.tier.person),
    work: box(ELEV.tier.work),
    pair: box(ELEV.tier.pair),
    ground: box(ELEV.tier.ground),
    reach: box(ELEV.tier.reach),
  };
}

/** The tiers, top to bottom — what the axis threads and the dimension spans. */
export const ELEV_TIERS = ["person", "work", "pair", "ground", "reach"] as const;

export interface TierLine {
  y: number;
  text: string;
  head: boolean;
}

/**
 * A tier's own copy: a head line, then a body WRAPPED to the box.
 *
 * ⚠ THE BODY WRAPS, IT DOES NOT CLIP. `bar` runs to 46 characters against a
 * 35-character box at panel type — clipping it drops "…channel-ready" off
 * the sheet's own statement of what good looks like, silently. Returned from
 * the projection rather than laid out in JSX so `tests/lib/board-projection`
 * asserts the same placements the component draws.
 */
export function tierLines(
  box: { x: number; y: number; w: number; h: number },
  type: number,
  head: string,
  body: string
): TierLine[] {
  const per = charsIn(box.w - ELEV.pad * 2, type);
  const out: TierLine[] = [{ y: box.y + type * 1.35, text: head, head: true }];
  let y = out[0].y;
  for (const line of wrapLines(body, per)) {
    y += type * 1.5;
    out.push({ y, text: line, head: false });
  }
  return out;
}

/**
 * The person tier's copy.
 *
 * Exported rather than written inline in the component so the projection
 * test asserts the SAME strings the sheet draws — the person-led pair was
 * 43 characters at the first cut, which wraps to three lines in a two-line
 * tier, and a literal duplicated in a test would have passed while the
 * drawing clipped.
 */
export function personTierCopy(work: CaseMapWork): [string, string] {
  if (!work.cfg) return ["Person-led", SEAT_PERSON_NOTE];
  return [work.cfg.p[0], work.cfg.p[1]];
}

/** `SEAT.PERSON.note`, restated here so this module keeps ZERO react imports. */
const SEAT_PERSON_NOTE = "The person does the work";

/** Does a tier's copy sit inside the tier? Asserted, never reviewed. */
export function tierFits(
  box: { x: number; y: number; w: number; h: number },
  lines: readonly TierLine[],
  type: number
): boolean {
  const last = lines[lines.length - 1];
  return (
    last.y + type * 0.28 <= box.y + box.h &&
    lines.every((l) => textWidth(l.text, type) <= box.w - ELEV.pad * 2)
  );
}

/**
 * The label rail.
 *
 * NOTHING IS LETTERED ON A TIER. The rule survives the change of projection
 * because it was always arithmetic, not a matter of style: a value like
 * `Component + supplier facts` is 26 characters, which at panel type is 302
 * units — wider than the 220-unit pair box it would have to sit in. So the
 * boxes carry the material language alone and the rail carries the words, in
 * the tiers' own top-to-bottom, left-then-right order.
 */
/** The first of a list, plus how many more — never a silently clipped join. */
export const tally = (items: readonly string[]) =>
  items.length > 1 ? `${items[0]} +${items.length - 1}` : items[0];

export function elevRail(work: CaseMapWork): RailEntry[] {
  const cfg = work.cfg;
  if (!cfg) return [];
  const boxes = elevBoxes();

  /* Every leader runs right and DOWN, never up and never across another
     tier: the rail entries follow the tiers' own top-to-bottom order, so a
     leader can only ever reach forward. That is why the reach tier exists as
     its own member rather than being folded into the footing — connectors
     and surfaces sit at rail rows 5 and 6, and a leader to them from the
     ground box would have to cross the tier below it. */
  const right = (b: { x: number; w: number }) => b.x + b.w;
  const source: Record<
    ElevRailKey,
    { pair: readonly [string, string]; from: { x: number; y: number } }
  > = {
    skill: { pair: cfg.s, from: { x: right(boxes.pair), y: boxes.pair.y + 16 } },
    model: { pair: cfg.m, from: { x: right(boxes.pair), y: boxes.pair.y + 40 } },
    context: { pair: cfg.c, from: { x: right(boxes.ground), y: boxes.ground.y + 14 } },
    graph: { pair: cfg.g, from: { x: right(boxes.ground), y: boxes.ground.y + 38 } },
    /* `+n` rather than a joined list: two systems joined run to 34
       characters against a 25-character rail, and a clipped list is a list
       whose tail vanished silently. The count is visible, and the hover card
       names every one of them. */
    connectors: {
      pair: [tally(cfg.k), "Systems it acts on"],
      from: { x: right(boxes.reach), y: boxes.reach.y + 14 },
    },
    surfaces: {
      pair: [tally(cfg.u), "Where it is met"],
      from: { x: right(boxes.reach), y: boxes.reach.y + 34 },
    },
  };

  return ELEV_RAIL_KEYS.map((key, i) => ({
    key,
    label: ELEV_RAIL_LABELS[key],
    value: source[key].pair[0],
    note: source[key].pair[1],
    y: ELEV.railTop + i * ELEV.railRow,
    from: source[key].from,
    elbowX: ELEV.railX - (ELEV_RAIL_KEYS.length - 1 - i) * ELEV.elbowStep,
  }));
}

/** How many characters the rail can take at a given type size. */
export const railChars = (type: number) => charsIn(ELEV.right - ELEV.railText, type);

/**
 * The autonomy dimension's lower end.
 *
 * `SEAT.depth` is 3/2/1/0 — wide, bounded, narrow, none — and each step down
 * is one tier further from the owner. Person-led work has no dimension at
 * all, because there is no machine for the distance to be measured to.
 */
export function autonomySpan(depth: number): { top: number; bottom: number } | null {
  if (depth <= 0) return null;
  const boxes = elevBoxes();
  const reach = depth >= 3 ? boxes.reach : depth === 2 ? boxes.ground : boxes.pair;
  return { top: boxes.person.y + boxes.person.h, bottom: reach.y + reach.h };
}

/* ── Sheet 03, PLANE ─────────────────────────────────────────────────────
   Five shapes against eight departments, as a grid.

   THIS SHEET IS THE LEAST NETWORK-LIKE OF THE THREE, deliberately. What it
   has to show is how many departments draw on each shape and who paid to
   encode it first — and those are COUNTS, which read from a row rather than
   from a tangle of risers. A reader who had to count crossing lines to
   answer "did this spread" was being asked to do the drawing's job.

   Four readings land at once, and none of them can collide with the others:

     negative space   the blank cells
     convergence      a full row — one shape drawn on by many departments
     the ratchet      the filled cell, exactly one per row: who paid
     inheritance      reading DOWN a column: what a department never paid for
*/
export const PLANE = {
  head: { title: 30, sub: 56, rule: 66 },
  /** The row-head column: shape name over its counts. */
  row: { x: 10, w: 250 },
  /** The grid itself. */
  grid: { x: 270, right: 990, top: 150, rowH: 52 },
  /** Column-head baseline, above the grid. */
  colHead: 138,
  /** The annotation band, below the grid. */
  note: { x: 10, y: 452, line: 28 },
  mark: { square: 15, circle: 7 },
} as const;

export interface PlaneColumn {
  district: CaseMapDistrict;
  x: number;
  w: number;
  cx: number;
}

export function planeColumns(districts: readonly CaseMapDistrict[]): PlaneColumn[] {
  const w = (PLANE.grid.right - PLANE.grid.x) / districts.length;
  return districts.map((district, i) => {
    const x = PLANE.grid.x + i * w;
    return { district, x, w, cx: x + w / 2 };
  });
}

export interface PlaneRow {
  shape: CaseMapShape;
  y: number;
  h: number;
  cy: number;
  /** Departments whose work draws on this shape. */
  tapped: readonly string[];
  /** The one department that paid to encode it. */
  trenched: string | undefined;
}

export function planeRows(
  shapes: readonly CaseMapShape[],
  districts: readonly CaseMapDistrict[],
  works: readonly CaseMapWork[]
): PlaneRow[] {
  return shapes.map((shape, i) => {
    const y = PLANE.grid.top + i * PLANE.grid.rowH;
    const tapped = districts
      .filter((d) => works.some((w) => w.dist === d.id && w.shapes.includes(shape.key)))
      .map((d) => d.id);
    return {
      shape,
      y,
      h: PLANE.grid.rowH,
      cy: y + PLANE.grid.rowH / 2,
      tapped,
      trenched: works.find((w) => w.id === shape.first)?.dist,
    };
  });
}

/** The grid's lower edge — every annotation has to clear it. */
export const planeBottom = (rows: readonly PlaneRow[]) =>
  PLANE.grid.top + rows.length * PLANE.grid.rowH;

/**
 * The cell state at (shape, department).
 *
 * Three states and no fourth: a department either paid to encode a shape,
 * inherited one that already existed, or does not draw on it at all. The
 * third is drawn as nothing, on purpose — the blank cells ARE the negative
 * space, and a map that fills them in has hidden what it exists to show.
 */
export type PlaneCell = "trenched" | "tapped" | "none";

export function planeCell(row: PlaneRow, districtId: string): PlaneCell {
  if (row.trenched === districtId) return "trenched";
  return row.tapped.includes(districtId) ? "tapped" : "none";
}

/* ── Shared arithmetic ──────────────────────────────────────────────────── */

/** The box a left-anchored line of type occupies, in authoring units. */
export function typeBox(x: number, baseline: number, text: string, type: number) {
  return {
    left: x,
    right: x + textWidth(text, type),
    /* PT Mono's em box runs 1.02x the type size above the baseline and 0.28x
       below it — MEASURED off rendered `getBBox()` results, because using the
       type size alone under-reports the ascender by enough for a header to
       sit outside its own crop while every arithmetic check passes. */
    top: baseline - type * 1.02,
    bottom: baseline + type * 0.28,
  };
}

/** A right-anchored line's box — the counts in every header's top-right. */
export function typeBoxRight(right: number, baseline: number, text: string, type: number) {
  return typeBox(right - textWidth(text, type), baseline, text, type);
}

/** A centred line's box — the column heads on sheet 03. */
export function typeBoxMid(cx: number, baseline: number, text: string, type: number) {
  return typeBox(cx - textWidth(text, type) / 2, baseline, text, type);
}

/**
 * Truncate to a hard character budget, marking the cut.
 *
 * The only place this surface is allowed to shorten a string. Everything else
 * either wraps (`wrapLines`) or is asserted to fit; a silent cut in a drawing
 * that claims to be a record is worse than a visible one.
 */
export function clip(text: string, per: number): string {
  return text.length <= per ? text : `${text.slice(0, Math.max(1, per - 1))}…`;
}

/** Re-exported so a sheet never reaches past this module for its metrics. */
export { MONO_ADVANCE, charsIn, textWidth };
