/* The kit's connectors, as geometry. PURE: no React, no DOM, no imports.

   One law (owner, 2026-10-12): rings are instruments, connectors are
   straight. Everything that joins two things here is a level run, a plumb
   run or a 45-degree cut between them; the one exception is a BEARING, a
   straight line from a station to the centre of a dial, which may lie at
   any angle because the angle is what it says. Nothing in this file emits a
   curve (`C`, `Q`, `S`, `A`); `tests/lib/proposal-kit.test.ts` holds that. */

export type Pt = readonly [number, number];

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A polyline as an SVG path of `M`, `H`, `V` and `L` only. */
export function pathOf(pts: readonly Pt[]): string {
  if (pts.length === 0) return "";
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x, y] = pts[i];
    if (y === y0) d += `H${r2(x)}`;
    else if (x === x0) d += `V${r2(y)}`;
    else d += `L${r2(x)} ${r2(y)}`;
  }
  return d;
}

/** A level run. */
export const run = (x0: number, x1: number, y: number): Pt[] => [
  [x0, y],
  [x1, y],
];

/** A plumb run. */
export const drop = (x: number, y0: number, y1: number): Pt[] => [
  [x, y0],
  [x, y1],
];

/**
 * A right-angle turn from `a` to `b` whose corner is cut at 45 degrees by
 * `cut` units: a level run then a plumb run (`first: "h"`), or the reverse.
 * With `cut` 0 it is a plain elbow. The cut is clamped to the shorter leg.
 */
export function elbow(a: Pt, b: Pt, first: "h" | "v", cut = 0): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 || dy === 0) return [a, b];
  const c = Math.min(Math.abs(cut), Math.abs(dx), Math.abs(dy));
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  if (first === "h") {
    return c === 0 ? [a, [b[0], a[1]], b] : [a, [b[0] - sx * c, a[1]], [b[0], a[1] + sy * c], b];
  }
  return c === 0 ? [a, [a[0], b[1]], b] : [a, [a[0], b[1] - sy * c], [a[0] + sx * c, b[1]], b];
}

/**
 * A level run that changes level once on a 45-degree jog: level from `a`
 * to `at`, the diagonal, then level to `b`. The jog covers |dy| of travel.
 */
export function jog(a: Pt, b: Pt, at: number): Pt[] {
  const dy = b[1] - a[1];
  if (dy === 0) return [a, b];
  const sx = Math.sign(b[0] - a[0]) || 1;
  return [a, [at, a[1]], [at + sx * Math.abs(dy), b[1]], b];
}

/**
 * `n` parallel copies of a polyline at `pitch`, centred on it, mitred at
 * every turn: a bundle (three lines) or a ribbon (eight). Each copy keeps
 * the base's directions, so a bundle of a straight trace is straight.
 */
export function bundle(pts: readonly Pt[], n: number, pitch: number): Pt[][] {
  const out: Pt[][] = [];
  for (let k = 0; k < n; k++) out.push(offset(pts, (k - (n - 1) / 2) * pitch));
  return out;
}

/** One polyline moved sideways by `d` (positive is to the right of travel,
    in screen space with y down), mitred. */
export function offset(pts: readonly Pt[], d: number): Pt[] {
  if (d === 0 || pts.length < 2) return pts.map((p) => [p[0], p[1]] as Pt);
  const normals: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const len = Math.hypot(dx, dy) || 1;
    normals.push([-dy / len, dx / len]);
  }
  return pts.map((p, i) => {
    const a = normals[Math.max(0, i - 1)];
    const b = normals[Math.min(normals.length - 1, i)];
    const k = 1 + a[0] * b[0] + a[1] * b[1];
    const mx = (a[0] + b[0]) / (k || 1);
    const my = (a[1] + b[1]) / (k || 1);
    return [p[0] + mx * d, p[1] + my * d] as Pt;
  });
}

/** A bearing: the straight line from a station toward a dial's centre,
    stopped on the rim of radius `r`. */
export function bearing(from: Pt, centre: Pt, r: number): Pt[] {
  const dx = from[0] - centre[0];
  const dy = from[1] - centre[1];
  const len = Math.hypot(dx, dy) || 1;
  return [from, [centre[0] + (dx / len) * r, centre[1] + (dy / len) * r]];
}

/** An open chevron at `tip`, pointing along the direction `from → tip`:
    two strokes of `size`, 30 degrees either side of the line. */
export function chevron(from: Pt, tip: Pt, size: number): Pt[] {
  const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const w = Math.PI / 6;
  return [
    [tip[0] - size * Math.cos(a - w), tip[1] - size * Math.sin(a - w)],
    tip,
    [tip[0] - size * Math.cos(a + w), tip[1] - size * Math.sin(a + w)],
  ];
}

/** Ticks along a plumb rail: `[y, major]` for every `step` between `y0`
    and `y1`, a tick on a `majors` row being a major one. */
export function railTicks(
  y0: number,
  y1: number,
  step: number,
  majors: readonly number[]
): { y: number; major: boolean }[] {
  const out: { y: number; major: boolean }[] = [];
  const n = Math.round((y1 - y0) / step);
  for (let i = 0; i <= n; i++) {
    const y = y0 + i * step;
    out.push({ y, major: majors.some((m) => Math.abs(m - y) < 0.01) });
  }
  return out;
}

/** True when every segment is level, plumb or at 45 degrees. */
export function isStraight(pts: readonly Pt[], eps = 1e-6): boolean {
  for (let i = 1; i < pts.length; i++) {
    const dx = Math.abs(pts[i][0] - pts[i - 1][0]);
    const dy = Math.abs(pts[i][1] - pts[i - 1][1]);
    if (dx > eps && dy > eps && Math.abs(dx - dy) > eps) return false;
  }
  return true;
}

export function lengthOf(pts: readonly Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++)
    l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}
