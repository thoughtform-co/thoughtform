/**
 * The workshop's opening board, as arithmetic (ADR-137).
 *
 * ⚠ COPIED BY HAND FROM THE MOIRA WORKSHOP TEMPLATE, NEVER IMPORTED
 * (`moira/lib/workshops/geometry.ts`, ADR-041 there; ADR-106's precedent
 * here). Two repositories, two guards: a change to that board is a decision
 * about that page, and it reaches this one only when someone ports it.
 *
 * One piece of work in the middle and six plates around it, each joined to
 * the card by a bundle of parallel traces that bend at 45°. What makes a
 * bundle read as wiring rather than as three lines is that the conductors
 * stay one pitch apart THROUGH the bend, so each is an offset of the centre
 * line re-intersected at every corner: for two segments meeting at p with
 * unit left normals a and b, the offset lines meet at p + d(a + b)/(1 + a·b).
 *
 * What changed in the port is the SKIN, not the wiring: the plates and the
 * card are chamfered on the house diagonal (TR + BL, ADR-065) instead of
 * rounded, so `chamfer()` lives here beside the numbers it cuts.
 *
 * Pure: no DOM, no React.
 */

export type Pt = readonly [number, number];
export type Rect = { x: number; y: number; w: number; h: number };
export type Side = "left" | "right";
export type PlateIndex = 0 | 1 | 2;

/** The drawing's own coordinates. The figure keeps this aspect. */
export const BOARD_W = 1200;
export const BOARD_H = 520;

/** The work. Taller than the plates, so it reads as the thing wired to. */
export const CARD: Rect = { x: 440, y: 80, w: 320, h: 360 };
const PLATE_W = 280;
const PLATE_H = 112;
const LEFT_X = 40;
const RIGHT_X = BOARD_W - LEFT_X - PLATE_W; // 880
const TOPS = [30, 204, 378] as const;

export const PLATES: Record<Side, readonly Rect[]> = {
  left: TOPS.map((y) => ({ x: LEFT_X, y, w: PLATE_W, h: PLATE_H })),
  right: TOPS.map((y) => ({ x: RIGHT_X, y, w: PLATE_W, h: PLATE_H })),
};

/** Where the traces meet the card, top to bottom, on both edges. */
const PORTS = [170, 260, 350] as const;
/** How far a trace runs under its plate and the card, so rounding never
    opens a gap at the join. */
export const TUCK = 6;
export const CONDUCTORS = 3;
export const PITCH = 7;
/** The frame around the lit plates: far enough out to read as an
    enclosure, near enough that the lit bundles' bends stay clear of it. */
const FRAME_PAD = 10;

/** The plate chamfer and the card's, in board units. */
export const PLATE_CUT = 14;
export const CARD_CUT = 22;

const unitNormal = (a: Pt, b: Pt): Pt => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return [dy / l, -dx / l];
};

/** Offset a polyline by d along its left normals, mitred at every corner. */
export function offsetPolyline(pts: readonly Pt[], d: number): Pt[] {
  const normals = pts.slice(1).map((p, i) => unitNormal(pts[i]!, p));
  return pts.map((p, i) => {
    const a = normals[Math.max(0, i - 1)]!;
    const b = normals[Math.min(normals.length - 1, i)]!;
    const k = 1 + a[0] * b[0] + a[1] * b[1];
    return [p[0] + (d * (a[0] + b[0])) / k, p[1] + (d * (a[1] + b[1])) / k] as Pt;
  });
}

/** N parallel conductors around a centre line, `pitch` apart. */
export function bundle(pts: readonly Pt[], count = CONDUCTORS, pitch = PITCH): Pt[][] {
  return Array.from({ length: count }, (_, i) =>
    offsetPolyline(pts, (i - (count - 1) / 2) * pitch)
  );
}

export const toPath = (pts: readonly Pt[]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

/**
 * The centre line from plate i on one side to the card. The top and bottom
 * plates sit off their port's height, so their runs leave level, cross at
 * 45° and arrive level; the middle run is straight.
 */
export function run(side: Side, i: PlateIndex): Pt[] {
  const plate = PLATES[side][i]!;
  const from = plate.y + plate.h / 2;
  const to = PORTS[i];
  const dir = side === "left" ? 1 : -1;
  const x0 = side === "left" ? plate.x + plate.w - TUCK : plate.x + TUCK;
  const x3 = side === "left" ? CARD.x + TUCK : CARD.x + CARD.w - TUCK;
  if (from === to)
    return [
      [x0, from],
      [x3, to],
    ];
  const drop = Math.abs(to - from);
  const edge = side === "left" ? plate.x + plate.w : plate.x;
  const x1 = edge + dir * 18;
  const x2 = x1 + dir * drop;
  return [
    [x0, from],
    [x1, from],
    [x2, to],
    [x3, to],
  ];
}

export interface BoardBundle {
  side: Side;
  i: PlateIndex;
  lines: Pt[][];
}

/** Every bundle on the board, with the plate it belongs to. */
export function boardBundles(): BoardBundle[] {
  const out: BoardBundle[] = [];
  for (const side of ["left", "right"] as const) {
    for (const i of [0, 1, 2] as const) out.push({ side, i, lines: bundle(run(side, i)) });
  }
  return out;
}

/** The small pins where each conductor meets its plate and the card. */
export function pinsOf(b: BoardBundle): Rect[] {
  const out: Rect[] = [];
  for (const line of b.lines) {
    const first = line[0]!;
    const last = line[line.length - 1]!;
    const plateEdge = b.side === "left" ? first[0] + TUCK : first[0] - TUCK;
    const cardEdge = b.side === "left" ? last[0] - TUCK : last[0] + TUCK;
    out.push({ x: b.side === "left" ? plateEdge : plateEdge - 6, y: first[1] - 2, w: 6, h: 4 });
    out.push({ x: b.side === "left" ? cardEdge - 6 : cardEdge, y: last[1] - 2, w: 6, h: 4 });
  }
  return out;
}

/**
 * The frame that holds the lit plates as one thing, or null when nothing is
 * lit. The lit set must be one side and contiguous (the registry pins it),
 * so the union is a single column span.
 */
export function litFrame(lit: readonly (readonly [Side, PlateIndex])[]): Rect | null {
  if (lit.length === 0) return null;
  const side = lit[0]![0];
  const idx = lit.map(([, i]) => i);
  const top = PLATES[side][Math.min(...idx)]!;
  const bottom = PLATES[side][Math.max(...idx)]!;
  return {
    x: top.x - FRAME_PAD,
    y: top.y - FRAME_PAD,
    w: top.w + 2 * FRAME_PAD,
    h: bottom.y + bottom.h - top.y + 2 * FRAME_PAD,
  };
}

/** A rect cut on the house diagonal: top-right and bottom-left (ADR-065). */
export function chamfer(r: Rect, c: number): string {
  const { x, y, w, h } = r;
  return `M${x} ${y}H${x + w - c}L${x + w} ${y + c}V${y + h}H${x + c}L${x} ${y + h - c}Z`;
}

/** True when a lit set is one side and adjacent — what `litFrame` needs. */
export function litIsFramable(lit: readonly (readonly [Side, PlateIndex])[]): boolean {
  if (lit.length === 0) return true;
  if (!lit.every(([s]) => s === lit[0]![0])) return false;
  const idx = [...new Set(lit.map(([, i]) => i))].sort();
  return idx.length === lit.length && idx[idx.length - 1]! - idx[0]! === idx.length - 1;
}
