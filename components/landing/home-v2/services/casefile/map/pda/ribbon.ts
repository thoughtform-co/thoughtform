/**
 * ribbon — the multi-conductor trace geometry that makes the switchboard
 * read as WIRING rather than as lines.
 *
 * The reference board's defining property is that its bundles are 4–12
 * PARALLEL conductors that stay at constant pitch through 45° bends. That
 * is an offset-polyline problem: each conductor is the base path shifted
 * along its per-segment left normal, with adjacent shifted segments
 * re-intersected at the corners. Pure and unit-testable on purpose.
 */

export type Pt = readonly [number, number];

const r2 = (n: number) => Math.round(n * 100) / 100;

interface Seg {
  p: Pt;
  q: Pt;
}

function intersect(a: Seg, b: Seg): Pt | null {
  const [x1, y1] = a.p;
  const [x2, y2] = a.q;
  const [x3, y3] = b.p;
  const [x4, y4] = b.q;
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}

/** Offset a polyline by `o` along its left normals (H/V/45° segments). */
export function offsetPolyline(pts: readonly Pt[], o: number): Pt[] {
  if (pts.length < 2 || o === 0) return [...pts];
  const segs: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (-(y2 - y1) / len) * o;
    const ny = ((x2 - x1) / len) * o;
    segs.push({ p: [x1 + nx, y1 + ny], q: [x2 + nx, y2 + ny] });
  }
  const out: Pt[] = [segs[0].p];
  for (let i = 0; i < segs.length - 1; i += 1) {
    out.push(intersect(segs[i], segs[i + 1]) ?? segs[i].q);
  }
  out.push(segs[segs.length - 1].q);
  return out;
}

/** Centered conductor offsets for an n-wire ribbon at the given pitch. */
export const ribbonOffsets = (n: number, pitch: number): number[] =>
  Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * pitch);

/**
 * The polyline's own length — what a draw-on needs for `--l`.
 *
 * ⚠ The BASE path's length is used for every conductor in a ribbon. The
 * offset copies differ by a few units at the corners, and `stroke-dasharray`
 * only has to be at least the path's length for the reveal to be complete —
 * so one number per ribbon is correct and eight `getTotalLength()` reads per
 * ribbon (on a surface that is allowed two rect reads in total) are not.
 */
export const polylineLength = (pts: readonly Pt[]): number => {
  let n = 0;
  for (let i = 1; i < pts.length; i += 1) {
    n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return Math.ceil(n);
};

const toPath = (pts: readonly Pt[]) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(" L")}`;

/** The n conductor paths of one ribbon along the base polyline. */
export const ribbonPaths = (pts: readonly Pt[], n: number, pitch: number): string[] =>
  ribbonOffsets(n, pitch).map((o) => toPath(offsetPolyline(pts, o)));

/**
 * An H-then-V (or V-then-H) run with the corner cut at 45° — the PCB bend.
 * `c` is the chamfer leg; degenerate spans collapse to a straight segment.
 */
export function bend(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  first: "h" | "v",
  c = 12
): Pt[] {
  const sx = Math.sign(x2 - x1);
  const sy = Math.sign(y2 - y1);
  if (sx === 0 || sy === 0) {
    return [
      [x1, y1],
      [x2, y2],
    ];
  }
  const leg = Math.min(c, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
  return first === "h"
    ? [
        [x1, y1],
        [x2 - sx * leg, y1],
        [x2, y1 + sy * leg],
        [x2, y2],
      ]
    : [
        [x1, y1],
        [x1, y2 - sy * leg],
        [x1 + sx * leg, y2],
        [x2, y2],
      ];
}

/** Chain several bends into one polyline, deduplicating the joints. */
export function route(...runs: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const run of runs) {
    for (const p of run) {
      const last = out[out.length - 1];
      if (!last || Math.abs(last[0] - p[0]) > 1e-6 || Math.abs(last[1] - p[1]) > 1e-6) out.push(p);
    }
  }
  return out;
}
