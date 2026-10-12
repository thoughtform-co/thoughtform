/* The ring register, as data. PURE: no React, no DOM, no imports.

   This is the drawing behind the portrait on the About (`AboutOrbitArt`):
   concentric rings on an alternating dash ladder, a rim graduated every 15
   degrees off the cardinals with a longer stub on each, four spokes on the
   diagonals. COPIED by hand, never imported (ADR-106's rule for the ring
   grammar), and stated as fractions of the outer radius so a dial can be
   drawn at any size and keep its proportions.

   A circle belongs to the system only as an instrument: here. Angles are in
   degrees, 0 pointing east, positive clockwise on screen (y down). */

export type Pt = readonly [number, number];

export interface DialRing {
  /** Radius as a fraction of the dial's outer radius. */
  r: number;
  tone: "dawn" | "gold";
  /** Stroke alpha. */
  a: number;
  /** `stroke-dasharray`, absent for a solid ring. */
  dash?: string;
}

/** The About drawing's six rings (192 · 172 · 150 · 124 · 104 · 82 of 192),
    with its alphas and its dashes. */
export const DIAL_RINGS: readonly DialRing[] = [
  { r: 1, tone: "dawn", a: 0.15, dash: "1 7" },
  { r: 172 / 192, tone: "dawn", a: 0.08 },
  { r: 150 / 192, tone: "gold", a: 0.18, dash: "2 8" },
  { r: 124 / 192, tone: "gold", a: 0.3 },
  { r: 104 / 192, tone: "gold", a: 0.15, dash: "1 3" },
  { r: 82 / 192, tone: "dawn", a: 0.3, dash: "1 4" },
];

const rad = (deg: number) => (deg * Math.PI) / 180;

/** A point on a circle. */
export const polar = (c: Pt, r: number, deg: number): Pt => [
  c[0] + r * Math.cos(rad(deg)),
  c[1] + r * Math.sin(rad(deg)),
];

/** A radial segment between two radii. */
export const radial = (c: Pt, r0: number, r1: number, deg: number): [Pt, Pt] => [
  polar(c, r0, deg),
  polar(c, r1, deg),
];

/** The rim's minor ticks: every `step` degrees, skipping the cardinals and
    any angle in `skip` (where a line enters the dial). Inward from the rim. */
export function rimTicks(c: Pt, r: number, len: number, step = 15, skip: readonly number[] = []) {
  const out: [Pt, Pt][] = [];
  for (let deg = 0; deg < 360; deg += step) {
    if (deg % 90 === 0) continue;
    if (skip.some((s) => Math.abs(((deg - s + 540) % 360) - 180) < step / 2)) continue;
    out.push(radial(c, r, r - len, deg));
  }
  return out;
}

/** The cardinal stubs: a longer mark on each of the four, minus `skip`. */
export function rimStubs(c: Pt, r: number, len: number, skip: readonly number[] = []) {
  return [0, 90, 180, 270].filter((d) => !skip.includes(d)).map((d) => radial(c, r, r - len, d));
}

/** The four spokes on the diagonals, between two radii. */
export function spokes(c: Pt, r0: number, r1: number) {
  return [45, 135, 225, 315].map((d) => radial(c, r0, r1, d));
}

/** The four corner brackets of the square that holds a dial of radius `r`
    with `pad` of air: each an L of `arm` units, as three points. */
export function brackets(c: Pt, r: number, pad: number, arm: number): [Pt, Pt, Pt][] {
  const h = r + pad;
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  return corners.map(([sx, sy]) => {
    const x = c[0] + sx * h;
    const y = c[1] + sy * h;
    return [
      [x - sx * arm, y],
      [x, y],
      [x, y - sy * arm],
    ];
  });
}
