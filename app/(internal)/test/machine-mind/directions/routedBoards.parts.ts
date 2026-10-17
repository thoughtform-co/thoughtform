import { lineD, polyD, type V3 } from "../hull";
import { W } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, type Flat, type Projection } from "@/components/arcs/figures/foundation/isoKit";

/**
 * F2 · Routed Boards, its parts: plan geometry in brain axes (l across, f
 * toward the front), a prism painter for a routed board or a part, and the
 * flat primitives drawn on a board's top (polylines, pads). Nothing here
 * decides what the picture is.
 *
 * ⚠ PURE: strings and numbers.
 */

export type P2 = [number, number];

/** The camera and the light a hemisphere is drawn under. */
export interface Scene {
  P: Projection;
  /** Toward the viewer and the light, in the kit's world. */
  toward: V3;
  light: V3;
}

/** A brain-axis point on the screen, and its depth. */
export const at3 = (S: Scene, l: number, f: number, z: number): Flat => iso(W(l, f, z), S.P);
export const depth3 = (S: Scene, l: number, f: number, z: number) => depthOf(W(l, f, z), S.P);

// ─── plan geometry ──────────────────────────────────────────────────────────

/** Twice the signed area of a plan polygon (positive: counter-clockwise). */
export const area2 = (poly: readonly P2[]) => poly.reduce((s, p, i) => {
  const q = poly[(i + 1) % poly.length];
  return s + p[0] * q[1] - q[0] * p[1];
}, 0);

/** A polygon counter-clockwise. */
export const ccw = (poly: readonly P2[]): P2[] => (area2(poly) >= 0 ? [...poly] : [...poly].reverse());

/** A closed counter-clockwise polygon moved `d` inward (negative: outward),
    mitred at every corner, so a level, plumb or 45° run stays one. */
export function insetRing(poly: readonly P2[], d: number): P2[] {
  const n = poly.length;
  const normals: P2[] = poly.map((a, i) => {
    const b = poly[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
  });
  return poly.map((p, i) => {
    const a = normals[(i - 1 + n) % n];
    const b = normals[i];
    const k = 1 + a[0] * b[0] + a[1] * b[1];
    const m = k < 0.15 ? 0.15 : k;
    return [p[0] + ((a[0] + b[0]) / m) * d, p[1] + ((a[1] + b[1]) / m) * d];
  });
}

/** Whether a plan point lies inside a polygon (even-odd). */
export function insidePoly([x, y]: P2, poly: readonly P2[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** The distance from a plan point to a polygon's boundary. */
export function distToPoly([x, y]: P2, poly: readonly P2[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const dx = bx - ax;
    const dy = by - ay;
    const k = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - dx * k, y - ay - dy * k));
  }
  return best;
}

/** A closed polygon sampled every `step` units round its boundary. */
export function sampleRing(poly: readonly P2[], step: number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

/** A sampled polyline back to its corners (collinear points dropped). */
export function corners(pts: readonly P2[]): P2[] {
  if (pts.length < 3) return [...pts];
  const out: P2[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const c = pts[i + 1];
    if (Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) > 1e-3) out.push(b);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Where a ray from inside a polygon leaves it (marching), or null. */
export function exitPoint(poly: readonly P2[], from: P2, dir: P2, max = 400): P2 | null {
  if (!insidePoly(from, poly)) return null;
  let s = 0;
  while (s < max) {
    s += 0.25;
    const p: P2 = [from[0] + dir[0] * s, from[1] + dir[1] * s];
    if (!insidePoly(p, poly)) return [from[0] + dir[0] * (s - 0.125), from[1] + dir[1] * (s - 0.125)];
  }
  return null;
}

/** A square in plan round c, half-width `half`, its corners cut by `cut`. */
export const squareOf = (c: P2, half: number, cut: number): P2[] => [
  [c[0] - half + cut, c[1] - half],
  [c[0] + half - cut, c[1] - half],
  [c[0] + half, c[1] - half + cut],
  [c[0] + half, c[1] + half - cut],
  [c[0] + half - cut, c[1] + half],
  [c[0] - half + cut, c[1] + half],
  [c[0] - half, c[1] + half - cut],
  [c[0] - half, c[1] - half + cut],
];

/** Whether a board's riser at a point of its edge faces the viewer. */
export function edgeFaces(S: Scene, ring: P2[], p: P2): boolean {
  let best = Infinity;
  let at = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const k = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(p[0] - a[0] - dx * k, p[1] - a[1] - dy * k);
    if (d < best) {
      best = d;
      at = i;
    }
  }
  const a = ring[at];
  const b = ring[(at + 1) % ring.length];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nl = (b[1] - a[1]) / len;
  const nf = -(b[0] - a[0]) / len;
  return nf * S.toward[0] - nl * S.toward[1] > 0;
}

// ─── drawing ────────────────────────────────────────────────────────────────

export interface PrismPaint {
  /** A riser's fill from its light (the outward normal against the light). */
  riser: (lit: number) => string;
  top: string;
  /** The top's edge hairline. */
  edge?: string;
  edgeWidth?: number;
  /** A line round the visible risers at this height (a copper layer seen
      edge on). */
  band?: { z: number; stroke: string; width: number };
}

/** A prism on a counter-clockwise plan polygon, z0 to z1: the risers that
    face the viewer, back to front, each in its own light, then the top. */
export function prismSvg(S: Scene, ring: readonly P2[], z0: number, z1: number, paint: PrismPaint): string {
  const poly = ccw(ring);
  const n = poly.length;
  const quads: { d: number; fill: string; pts: Flat[] }[] = [];
  const band: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) continue;
    // outward normal in plan (counter-clockwise: the right of travel), in world
    const nl = (b[1] - a[1]) / len;
    const nf = -(b[0] - a[0]) / len;
    const wn: V3 = [nf, -nl, 0];
    if (wn[0] * S.toward[0] + wn[1] * S.toward[1] <= 1e-6) continue;
    const lit = wn[0] * S.light[0] + wn[1] * S.light[1];
    quads.push({ d: depth3(S, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (z0 + z1) / 2), fill: paint.riser(lit), pts: [at3(S, a[0], a[1], z1), at3(S, b[0], b[1], z1), at3(S, b[0], b[1], z0), at3(S, a[0], a[1], z0)] });
    if (paint.band) band.push(lineD([at3(S, a[0], a[1], paint.band.z), at3(S, b[0], b[1], paint.band.z)]));
  }
  quads.sort((p, q) => p.d - q.d);
  const out: string[] = [];
  let fill = "";
  let d = "";
  const flush = () => {
    if (d) out.push(`<path fill="${fill}" stroke="${fill}" stroke-width=".35" stroke-linejoin="round" d="${d}"/>`);
    d = "";
  };
  for (const q of quads) {
    if (q.fill !== fill) {
      flush();
      fill = q.fill;
    }
    d += polyD(q.pts);
  }
  flush();
  if (paint.band && band.length) out.push(`<path fill="none" stroke="${paint.band.stroke}" stroke-width="${paint.band.width}" stroke-linecap="butt" d="${band.join("")}"/>`);
  const top = polyD(poly.map(([l, f]) => at3(S, l, f, z1)));
  out.push(`<path fill="${paint.top}"${paint.edge ? ` stroke="${paint.edge}" stroke-width="${paint.edgeWidth ?? 0.4}" stroke-linejoin="round"` : ""} d="${top}"/>`);
  return out.join("");
}

/** A plan polyline on the plane z, as path data. */
export const planLine = (S: Scene, pts: readonly P2[], z: number) => lineD(pts.map(([l, f]) => at3(S, l, f, z)));

/** A round pad on the plane z (a via, a solder pad), as path data. */
export function padD(S: Scene, [l, f]: P2, z: number, r: number, n = 12): string {
  return polyD(Array.from({ length: n }, (_, i) => at3(S, l + r * Math.cos((i / n) * Math.PI * 2), f + r * Math.sin((i / n) * Math.PI * 2), z)));
}

/** A plan polygon on the plane z, as path data. */
export const planPoly = (S: Scene, pts: readonly P2[], z: number) => polyD(pts.map(([l, f]) => at3(S, l, f, z)));
