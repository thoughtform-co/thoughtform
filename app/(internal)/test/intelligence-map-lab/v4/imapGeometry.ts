/**
 * imapGeometry — the field's layout kernel. ROUND 3, REV B.
 *
 * ══ WHY THIS WAS REWRITTEN ═══════════════════════════════════════════════
 * Rev A authored the field in a fixed `viewBox="0 0 1000 672"` at
 * `preserveAspectRatio="none"`, on the argument that the viewBox was
 * "aspect-true to within 1 %". It was — at exactly two viewports. The panel's
 * aspect is a function of the WINDOW, and at the owner's window it is ~1.05:1
 * against the viewBox's 1.49:1, so every shape printed 30 % narrower than it was
 * drawn: discs became eggs, rings became ovals, diamonds sheared. That is not a
 * density problem or a taste problem, it is a stretched bitmap.
 *
 * THE FIX IS ARCHITECTURAL, NOT A TUNING. Every number below is CSS PIXELS,
 * derived from the field box as measured. The SVG's viewBox is `0 0 w h` — 1:1
 * with the box at every aspect — so distortion is impossible by construction
 * rather than by luck, and the layout becomes genuinely responsive instead of
 * being correct at two reference sizes.
 *
 * ══ AND THE SHAPE LAW HAS NO ORBIT EXCEPTION ══════════════════════════════
 * Rev A drew four concentric rings, six discs, seven arcs and a 36-tick circle
 * behind a written argument that "celestial grammar" exempted them. DESIGN.md
 * says: "Zero border-radius everywhere — this is shape law. Diamonds
 * (45-degree rotated squares) replace all circles." There is no exemption. Rev B
 * contains no `<circle>`, no `<ellipse>`, no arc and no border-radius.
 *
 * The vocabulary is the owner's own panel references:
 *   FRAME      a hard rectangle with CHAMFERED corners
 *   GRATICULE  an orthogonal grid of cells — not a polar rosette
 *   RULERS     a tick strip along the bottom edge, its stops NAMED
 *   LOCK       four square corner brackets on the selected thing
 *   MARK       a diamond at an exact coordinate
 *   VALUE      a label line above a bordered box
 *   RUN        a right-angle (Manhattan) trace with junction diamonds
 *   TRACE      a dotted diagonal — a trajectory, never a structure
 *
 * ══ WHAT THE MAP NOW SAYS ═════════════════════════════════════════════════
 * Ranges 02/03 are a BOUNDED CARTESIAN PLOT: four capability columns × seven
 * team rows. A work sits at its (team, allocation) coordinate, which is exactly
 * the claim the map exists to make — and the two lenses stop being a crossfade
 * between two rosettes and become WHICH AXIS IS LIT: ALLOCATION lights a column,
 * TEAM lights a row. No two works share a cell, so the grid separates all eight
 * of them by construction — which retires rev A's hand-tuned collision table
 * entirely.
 *
 * Range 01 is a SCHEMATIC: the work as a chamfered core plate with its six
 * components as labelled value boxes in two flanking columns, wired by
 * right-angle runs.
 *
 * Pure math: no DOM, no clock, no random. The only input is the measured box.
 */

import {
  COMPONENT_SPECS,
  SUBSTRATES,
  TEAMS,
  TIERS,
  WORKS,
  type ImapWork,
  type TeamName,
  type TierName,
} from "../imapData";

/* ══ Primitives ════════════════════════════════════════════════════════ */

export interface Vec {
  x: number;
  y: number;
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Round to 2 dp — this goes into a `transform` sixty times a second. */
export const r2 = (v: number) => Math.round(v * 100) / 100;
export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export const boxCenter = (b: Box): Vec => ({ x: r2(b.x + b.w / 2), y: r2(b.y + b.h / 2) });

/** A diamond as an explicit path. The ONLY point marker in the field. */
export function diamond(x: number, y: number, r: number): string {
  return `M${r2(x)} ${r2(y - r)}L${r2(x + r)} ${r2(y)}L${r2(x)} ${r2(y + r)}L${r2(x - r)} ${r2(y)}Z`;
}

/** A rectangle with all four corners cut — the house frame. */
export function chamfer(b: Box, c: number): string {
  const { x, y, w, h } = b;
  return (
    `M${r2(x + c)} ${r2(y)}L${r2(x + w - c)} ${r2(y)}L${r2(x + w)} ${r2(y + c)}` +
    `L${r2(x + w)} ${r2(y + h - c)}L${r2(x + w - c)} ${r2(y + h)}L${r2(x + c)} ${r2(y + h)}` +
    `L${r2(x)} ${r2(y + h - c)}L${r2(x)} ${r2(y + c)}Z`
  );
}

/** Four corner brackets — the target lock. Replaces rev A's target ring. */
export function brackets(b: Box, len: number): string[] {
  const { x, y, w, h } = b;
  return [
    `M${r2(x)} ${r2(y + len)}L${r2(x)} ${r2(y)}L${r2(x + len)} ${r2(y)}`,
    `M${r2(x + w - len)} ${r2(y)}L${r2(x + w)} ${r2(y)}L${r2(x + w)} ${r2(y + len)}`,
    `M${r2(x + w)} ${r2(y + h - len)}L${r2(x + w)} ${r2(y + h)}L${r2(x + w - len)} ${r2(y + h)}`,
    `M${r2(x + len)} ${r2(y + h)}L${r2(x)} ${r2(y + h)}L${r2(x)} ${r2(y + h - len)}`,
  ];
}

/**
 * A right-angle run from `a` to `b`, breaking at a vertical spine — the wire
 * grammar of the reference schematic. Returns the path and its two elbows so the
 * caller can mark them: a run is a path PLUS its junctions, never a bare
 * polyline.
 */
export function run(a: Vec, b: Vec, spineX: number): { d: string; joints: Vec[] } {
  const j1 = { x: r2(spineX), y: r2(a.y) };
  const j2 = { x: r2(spineX), y: r2(b.y) };
  return {
    d: `M${r2(a.x)} ${r2(a.y)}L${j1.x} ${j1.y}L${j2.x} ${j2.y}L${r2(b.x)} ${r2(b.y)}`,
    joints: [j1, j2],
  };
}

/* ══ Reserved bands ════════════════════════════════════════════════════
   Every one of these is a TYPE MEASUREMENT, not a taste. The field is only
   ~591 × 397 px at the binding casefile, so each band has to be paid for.
   ══════════════════════════════════════════════════════════════════════ */

/** Frame inset from the field box. */
const PAD = 7;
/** Corner chamfer on the frame. */
export const FRAME_CHAMFER = 12;
/** Top band inside the frame: the target readout (left) and the state (right). */
const BAND_TOP = 54;
/** Bottom band: the tick ruler, the four capability names, the corner readouts. */
const BAND_BOTTOM = 34;
/**
 * Left band: the seven team names, beside their rows.
 *
 * ⚠ THE AXES ARE THIS WAY ROUND FOR A MEASURED REASON. The first cut put the
 * seven teams on the X axis, which gave each column 61 px at the binding panel —
 * and an 11px work identity needs ~70. Every label overlapped its neighbour.
 * Teams are a LIST of seven and capability is a SCALE of four, so the list takes
 * the tall axis (7 rows × ~43 px, which a 26 px identity clears) and the scale
 * takes the wide axis (4 columns × ~100 px, which the widest wrapped title fills
 * to 67 px). No two works share a cell, so the grid now separates all eight of
 * them with no correction table at all.
 */
const BAND_LEFT = 82;
/** Right band: the depth rail. `CONFIGURATION` is 88.4 px at the 10px floor, the
 *  active connector rule is 24 px and must not reach the last glyph, and the
 *  rotated detent needs 2 px of its own. */
export const RAIL_W = 116;
/** The substrate bus's own band at range 02. */
const BAND_BUS = 58;

/** The X axis: capability, ascending left to right — a scale, so it reads up. */
export const TIER_COLS: readonly TierName[] = ["FAST", "EVERYDAY", "DEEP", "FRONTIER"];

/* ══ The layout ════════════════════════════════════════════════════════ */

export interface StationSeat {
  key: string;
  code: string;
  label: string;
  box: Box;
  side: "l" | "r";
  /** Where the run taps the box. */
  tap: Vec;
}

export interface WorkSeat {
  id: string;
  /** Capability column index. */
  col: number;
  /** Team row index. */
  row: number;
  /** The exact coordinate. A diamond goes here and nothing else. */
  at: Vec;
  /** The identity label, to the RIGHT of the mark and vertically centred on it —
   *  a tag on a contact, exactly as the reference plots one. */
  label: Box;
}

export interface ImapLayout {
  w: number;
  h: number;
  frame: Box;
  plot: Box;
  plotTrace: Box;
  colX: readonly number[];
  rowY: readonly number[];
  rowYTrace: readonly number[];
  gridV: readonly string[];
  gridH: readonly string[];
  gridVTrace: readonly string[];
  gridHTrace: readonly string[];
  ticks: readonly { d: string; major: boolean }[];
  /** The X axis: the four capability names, under their columns. */
  tierLabels: readonly { tier: TierName; at: Vec; w: number }[];
  /** The Y axis: the seven team names, beside their rows. */
  teamLabels: readonly { team: TeamName; at: Vec }[];
  teamLabelsTrace: readonly { team: TeamName; at: Vec }[];
  seatsPlot: ReadonlyMap<string, WorkSeat>;
  seatsTrace: ReadonlyMap<string, WorkSeat>;
  core: Box;
  coreInner: Box;
  stations: readonly StationSeat[];
  spineL: number;
  spineR: number;
  bus: { rail: string; boxes: ReadonlyMap<string, Box> };
  readout: Vec;
  state: Vec;
  cornerBL: Vec;
  cornerBR: Vec;
  centre: Vec;
  labelW: number;
}

/** Two lines of 11px identity, and its gap from the mark — clear of the 20px
 *  corner-bracket lock the selected mark wears. */
export const LABEL_H = 26;
export const LABEL_GAP = 14;
/** How far into its cell a mark sits, so the label has the rest of the cell. */
const MARK_INSET = 9;

function seats(
  colX: readonly number[],
  rowY: readonly number[],
  labelW: number
): Map<string, WorkSeat> {
  const out = new Map<string, WorkSeat>();
  for (const work of WORKS) {
    const col = TIER_COLS.indexOf(work.tier);
    const row = TEAMS.indexOf(work.team);
    const at = { x: r2(colX[col]), y: r2(rowY[row]) };
    out.set(work.id, {
      id: work.id,
      col,
      row,
      at,
      label: {
        x: r2(at.x + LABEL_GAP),
        y: r2(at.y - LABEL_H / 2),
        w: r2(labelW),
        h: LABEL_H,
      },
    });
  }
  return out;
}

export function buildLayout(w: number, h: number): ImapLayout {
  const frame: Box = {
    x: PAD,
    y: PAD,
    w: Math.max(160, w - PAD * 2),
    h: Math.max(160, h - PAD * 2),
  };

  const plot: Box = {
    x: r2(frame.x + BAND_LEFT),
    y: r2(frame.y + BAND_TOP),
    w: r2(Math.max(120, frame.w - BAND_LEFT - RAIL_W)),
    h: r2(Math.max(100, frame.h - BAND_TOP - BAND_BOTTOM)),
  };
  const plotTrace: Box = { ...plot, h: r2(Math.max(80, plot.h - BAND_BUS)) };

  /* X = capability (4 columns), Y = team (7 rows). See BAND_LEFT for why.
     A MARK SITS JUST INSIDE ITS CELL'S LEADING RULE, not at the cell's centre,
     so its label owns the rest of the cell and can never reach the next column —
     which is also what keeps the FRONTIER column's label out of the depth rail.
     Centring the marks put it 36px into that rail. */
  const pitchX = plot.w / TIER_COLS.length;
  const colX = TIER_COLS.map((_, i) => r2(plot.x + pitchX * i + MARK_INSET));
  /* The vertical rules are the cell BOUNDARIES; the horizontal rules are the row
     CENTRES — so a mark lands on a row rule and just inside a column rule. */
  const colRuleX = TIER_COLS.map((_, i) => r2(plot.x + pitchX * i));

  const rowsOf = (p: Box) => {
    const pitch = p.h / TEAMS.length;
    return TEAMS.map((_, i) => r2(p.y + pitch * (i + 0.5)));
  };
  const rowY = rowsOf(plot);
  const rowYTrace = rowsOf(plotTrace);

  /* The graticule: a rule ON each column and each row, plus the plot's own
     bounding rules. Cells, exactly as the reference plots them. */
  const vRules = (p: Box) => [
    ...colRuleX.map((x) => `M${x} ${r2(p.y)}L${x} ${r2(p.y + p.h)}`),
    `M${r2(p.x + p.w)} ${r2(p.y)}L${r2(p.x + p.w)} ${r2(p.y + p.h)}`,
  ];
  const hRules = (p: Box, rows: readonly number[]) => [
    `M${r2(p.x)} ${r2(p.y)}L${r2(p.x + p.w)} ${r2(p.y)}`,
    ...rows.map((y) => `M${r2(p.x)} ${y}L${r2(p.x + p.w)} ${y}`),
    `M${r2(p.x)} ${r2(p.y + p.h)}L${r2(p.x + p.w)} ${r2(p.y + p.h)}`,
  ];

  /* The bottom tick ruler. 6 px pitch, every fifth tick taller — the reference's
     own strip, and what makes the plot read as an instrument scale. */
  const rulerY = r2(frame.y + frame.h - BAND_BOTTOM + 11);
  const ticks: { d: string; major: boolean }[] = [];
  const count = Math.floor(plot.w / 6);
  for (let i = 0; i <= count; i++) {
    const x = r2(plot.x + i * 6);
    const major = i % 5 === 0;
    ticks.push({ d: `M${x} ${rulerY}L${x} ${r2(rulerY - (major ? 7 : 4))}`, major });
  }

  /* THE CAPABILITY NAMES ARE THE X AXIS, on the bottom band under their columns.
     They double as the ruler's numerals — a scale whose stops are named is worth
     more than a scale with invented figures beside it, so rev B prints the four
     lane names and drops the numeral row entirely. */
  const tierLabelsX = TIER_COLS.map((tier, i) => ({
    tier,
    /* Centred in the CELL, not on the mark — it names the lane, not the work. */
    at: { x: r2(plot.x + pitchX * (i + 0.5)), y: r2(frame.y + frame.h - 8) },
    w: r2(pitchX - 6),
  }));

  /* THE TEAM NAMES ARE THE Y AXIS, right-aligned beside their rows on the left
     band. Two lines each, from the hand-wrapped display forms in the fixtures. */
  const teams = (rows: readonly number[]) =>
    TEAMS.map((team, i) => ({ team, at: { x: r2(plot.x - 9), y: rows[i] } }));

  /* ── Range 01 · the schematic ──────────────────────────────────────── */

  /* RANGE 01 GETS ITS OWN BOX, not the plot's. The plot spends 82px on the left
     band for team names and 34px at the bottom for the capability ruler; at range
     01 neither exists, and handing those 116px back is what lets the six value
     boxes carry `GENERATION + REVIEW` and `BRAND COPY V3.2` without wrapping to
     four lines and spilling out of their frames. */
  const bay: Box = {
    x: r2(frame.x + 10),
    y: r2(frame.y + BAND_TOP),
    w: r2(Math.max(160, frame.w - RAIL_W - 22)),
    h: r2(Math.max(120, frame.h - BAND_TOP - 18)),
  };

  /* The core is sized by its title: `BRAND COPY CHECK` is 170 px at the 17px
     floor, so the plate needs 170 plus padding and never less. */
  const coreW = clamp(bay.w * 0.38, 196, 288);
  const coreH = clamp(bay.h * 0.36, 96, 128);
  const core: Box = {
    x: r2(bay.x + (bay.w - coreW) / 2),
    y: r2(bay.y + (bay.h - coreH) / 2),
    w: r2(coreW),
    h: r2(coreH),
  };
  const coreInner: Box = {
    x: r2(core.x + 7),
    y: r2(core.y + 7),
    w: r2(core.w - 14),
    h: r2(core.h - 14),
  };

  /* Two flanking columns of three, and the gutter is SHARED: 78 % to the box, the
     rest to the wire run. A run needs visible length or the schematic reads as
     boxes with stray diamonds — at 100 % it was a 6px stub. The box measure is
     what the 9px note needs (`SUMMARISE + STRUCTURE` is 117 px) plus padding, and
     the height is what a wrapped value plus a wrapped note actually occupy. */
  const gutter = (bay.w - core.w) / 2;
  const stationW = clamp(gutter * 0.78, 94, 168);
  const stationH = 66;
  const runGap = r2((gutter - stationW) / 2);
  const spineL = r2(core.x - runGap);
  const spineR = r2(core.x + core.w + runGap);

  const stations: StationSeat[] = COMPONENT_SPECS.map((spec, i) => {
    const side: "l" | "r" = i % 2 === 0 ? "l" : "r";
    const slot = Math.floor(i / 2);
    const y = r2(bay.y + (bay.h * (slot + 0.5)) / 3 - stationH / 2);
    const box: Box =
      side === "l"
        ? { x: r2(bay.x), y, w: r2(stationW), h: stationH }
        : { x: r2(bay.x + bay.w - stationW), y, w: r2(stationW), h: stationH };
    return {
      key: spec.key,
      code: spec.code,
      label: spec.label,
      box,
      side,
      tap: { x: r2(side === "l" ? box.x + box.w : box.x), y: r2(y + stationH / 2) },
    };
  });

  /* ── The substrate bus (range 02) ──────────────────────────────────── */

  /* THE BUS SPANS THE FRAME, not the plot: it is the panel's shared layer, and a
     69px box inside the plot truncated `PATTERN RECOGNITION` at the 9px floor
     where a 92px box across the frame carries it whole. */
  const busX = r2(frame.x + 8);
  const busW = r2(frame.w - 16);
  const busY = r2(plotTrace.y + plotTrace.h + 14);
  const busPitch = busW / SUBSTRATES.length;
  const busBoxes = new Map<string, Box>();
  SUBSTRATES.forEach((sub, i) => {
    busBoxes.set(sub.id, {
      x: r2(busX + busPitch * i + 3),
      y: busY,
      w: r2(busPitch - 6),
      /* 44, not 36: the title WRAPS to two 9px lines rather than truncating —
         `PATTERN RECOGNITION` and `CLAIM INTEGRITY` both ellipsised at 36. */
      h: 44,
    });
  });

  const labelW = clamp(pitchX - MARK_INSET - LABEL_GAP - 6, 62, 150);

  return {
    w,
    h,
    frame,
    plot,
    plotTrace,
    colX,
    rowY,
    rowYTrace,
    gridV: vRules(plot),
    gridH: hRules(plot, rowY),
    gridVTrace: vRules(plotTrace),
    gridHTrace: hRules(plotTrace, rowYTrace),
    ticks,
    tierLabels: tierLabelsX,
    teamLabels: teams(rowY),
    teamLabelsTrace: teams(rowYTrace),
    seatsPlot: seats(colX, rowY, labelW),
    seatsTrace: seats(colX, rowYTrace, labelW),
    core,
    coreInner,
    stations,
    spineL,
    spineR,
    bus: {
      rail: `M${busX} ${r2(busY - 9)}L${r2(busX + busW)} ${r2(busY - 9)}`,
      boxes: busBoxes,
    },
    readout: { x: r2(frame.x + 11), y: r2(frame.y + 10) },
    state: { x: r2(frame.x + frame.w - RAIL_W - 12), y: r2(frame.y + 10) },
    cornerBL: { x: r2(frame.x + 11), y: r2(frame.y + frame.h - 9) },
    cornerBR: { x: r2(frame.x + frame.w - 11), y: r2(frame.y + frame.h - 9) },
    centre: boxCenter(core),
    labelW,
  };
}

/* ══ Node targets ══════════════════════════════════════════════════════ */

export interface NodeTarget {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export interface ViewState {
  depth: 0 | 1 | 2;
  work: string;
  substrate: string;
}

export const workBy = (id: string): ImapWork | undefined => WORKS.find((w) => w.id === id);

/**
 * Every node's target for a given range and selection. The animator lerps toward
 * this and nothing else writes it.
 *
 * Keys are `work:W01`, `component:human`, `substrate:S01` — his registry naming,
 * kept because a node's identity has to survive every range change (ADR-061's
 * identity law: a node is a stable id, never a projection child).
 */
export function layoutTargets(L: ImapLayout, v: ViewState): Map<string, NodeTarget> {
  const out = new Map<string, NodeTarget>();

  if (v.depth === 0) {
    for (const work of WORKS) {
      out.set(
        `work:${work.id}`,
        work.id === v.work
          ? { x: L.centre.x, y: L.centre.y, scale: 1, opacity: 1 }
          : { x: L.centre.x, y: L.centre.y, scale: 0.35, opacity: 0 }
      );
    }
    for (const s of L.stations) {
      const c = boxCenter(s.box);
      out.set(`component:${s.key}`, { x: c.x, y: c.y, scale: 1, opacity: 1 });
    }
    for (const sub of SUBSTRATES) {
      out.set(`substrate:${sub.id}`, { x: L.centre.x, y: L.centre.y, scale: 0.3, opacity: 0 });
    }
    return out;
  }

  const seatMap = v.depth === 1 ? L.seatsTrace : L.seatsPlot;
  for (const work of WORKS) {
    const seat = seatMap.get(work.id)!;
    const onTrace = work.substrates.includes(v.substrate);
    const selected = work.id === v.work;
    out.set(`work:${work.id}`, {
      x: seat.at.x,
      y: seat.at.y,
      scale: 1,
      /* His dim: off-trace works recede at range 02 but never leave — the node
         never disappears. At range 03 the whole estate is the subject. */
      opacity: v.depth === 1 ? (onTrace || selected ? 1 : 0.34) : 1,
    });
  }
  for (const s of L.stations) {
    const c = boxCenter(s.box);
    out.set(`component:${s.key}`, { x: c.x, y: c.y, scale: 0.9, opacity: 0 });
  }
  for (const sub of SUBSTRATES) {
    const box = L.bus.boxes.get(sub.id)!;
    const c = boxCenter(box);
    out.set(`substrate:${sub.id}`, {
      x: c.x,
      y: v.depth === 1 ? c.y : r2(c.y + 28),
      scale: 1,
      opacity: v.depth === 1 ? 1 : 0,
    });
  }
  return out;
}

/** The trace pairs, in a stable order so the paths never re-key. */
export const TRACE_PAIRS = WORKS.flatMap((work) =>
  work.substrates.map((subId) => ({ key: `${work.id}:${subId}`, workId: work.id, subId }))
);

export const NODE_IDS = [
  ...WORKS.map((w) => `work:${w.id}`),
  ...COMPONENT_SPECS.map((s) => `component:${s.key}`),
  ...SUBSTRATES.map((s) => `substrate:${s.id}`),
];

/** Mark sizes, in px. Nothing scales with the box — a diamond is a diamond. */
export const MARK = { work: 5, workSel: 7, joint: 3, pin: 4 } as const;
export const LOCK_LEN = 7;
export { TIERS };
export type { TeamName, TierName };
