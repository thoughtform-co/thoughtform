import { cross3, facetBands, hullPoint, occluder, paintOrder, polyD, seen, sub3, T_UNIT, unit3, type Facet, type Hull, type HullShape, type Side, type UW, type V3 } from "../hull";
import { HEMI, LC, W } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";

/**
 * D1 · Trace Cortex, its parts: the geometry the direction is drawn with and
 * nothing it decides. Polylines in (u, w), the crown's own frame, and the
 * skin painter that lays a copper pour into the hull's facets.
 *
 * ⚠ PURE: strings and numbers.
 */

// ─── polylines in (u, w) ────────────────────────────────────────────────────

/** Arc length at each point of a polyline. */
export const lengths = (pts: readonly UW[]) => {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return out;
};

/** The point at arc length `s` (`L` its `lengths`). */
export function pointAt(pts: readonly UW[], L: number[], s: number): UW {
  let i = 1;
  while (i < L.length - 1 && L[i] < s) i++;
  const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
}

/** The piece of a polyline between arc lengths `s0` and `s1`. */
export function cut(pts: readonly UW[], s0: number, s1: number): UW[] {
  const L = lengths(pts);
  const out: UW[] = [pointAt(pts, L, s0)];
  for (let i = 1; i < pts.length - 1; i++) if (L[i] > s0 && L[i] < s1) out.push(pts[i]);
  out.push(pointAt(pts, L, s1));
  return out;
}

/** A polyline stopped where it first reaches height `top`. */
export function upTo(pts: readonly UW[], top: number): UW[] {
  const out: UW[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [u0, w0] = pts[i - 1];
    const [u1, w1] = pts[i];
    if (w1 >= top) {
      const k = (top - w0) / (w1 - w0 || 1);
      out.push([u0 + (u1 - u0) * k, top]);
      return out;
    }
    out.push(pts[i]);
  }
  return out;
}

/** A polyline started where it first rises to height `bottom` (an offset
    copy of a route can start under the hull's floor). */
export function from(pts: readonly UW[], bottom: number): UW[] {
  for (let i = 0; i < pts.length; i++) {
    if (pts[i][1] < bottom) continue;
    if (i === 0) return [...pts];
    const [u0, w0] = pts[i - 1];
    const [u1, w1] = pts[i];
    const k = (bottom - w0) / (w1 - w0 || 1);
    return [[u0 + (u1 - u0) * k, bottom], ...pts.slice(i)];
  }
  return [];
}

/** A screen polyline thinned to the points that matter (Ramer–Douglas–
    Peucker, `eps` picture units): a wrapped trace is sampled finely so it
    follows the hull, then drawn with only the points its curve needs. */
export function thin(pts: Flat[], eps = 0.12): Flat[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a];
    const dx = pts[b][0] - ax;
    const dy = pts[b][1] - ay;
    const len = Math.hypot(dx, dy) || 1;
    let far = -1;
    let at = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > far) {
        far = d;
        at = i;
      }
    }
    if (far > eps) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** A round pad on the hull at (u, w), radius `r` in world units: a true
    circle in the surface's tangent plane, so it stays round where (u, w)
    is squeezed (near the crown, on the medial wall). Null unless its centre
    is seen. */
export function roundPad(h: Hull, u: number, w: number, r: number, n = 12): Flat[] | null {
  const t = u / T_UNIT;
  if (!seen(h, h.at(t, w))) return null;
  const P = (tt: number, ww: number): V3 => W(...hullPoint(h.side, tt, Math.min(149.9, ww), h.shape));
  const c = P(t, w);
  const e1 = unit3(sub3(P(t + 0.004, w), P(t - 0.004, w)));
  const dz = sub3(P(t, w + 0.5), P(t, w - 0.5));
  const n3 = unit3(cross3(e1, dz));
  const e2 = unit3(cross3(n3, e1));
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return iso([c[0] + r * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]), c[1] + r * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]), c[2] + r * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2])], h.P);
  });
}

/** A point of the hull read off its own vertex grid, bilinearly: where it
    falls on the screen, its light, how squarely it faces the viewer and
    whether it is seen. A trace sampled this way lies on the very facets
    the skin paints, and costs a lookup instead of a fresh normal. */
export interface GridPoint {
  xy: Flat;
  lit: number;
  facing: number;
  seen: boolean;
}

export function gridSampler(h: Hull): (u: number, w: number) => GridPoint {
  const C = h.cols;
  const zs = h.zs;
  const hidden = occluder(h);
  const TAU = Math.PI * 2;
  return (u, w) => {
    const z = Math.max(zs[0], Math.min(zs[zs.length - 1] - 1e-6, w));
    let r = 0;
    let hi = zs.length - 2;
    while (r < hi) {
      const mid = (r + hi + 1) >> 1;
      if (zs[mid] <= z) r = mid;
      else hi = mid - 1;
    }
    const y = (z - zs[r]) / (zs[r + 1] - zs[r] || 1);
    const tc = ((((u / T_UNIT) % TAU) + TAU) % TAU) / TAU * C;
    const c = Math.floor(tc) % C;
    const x = tc - Math.floor(tc);
    const c1 = (c + 1) % C;
    const v = [h.vertices[r][c], h.vertices[r][c1], h.vertices[r + 1][c1], h.vertices[r + 1][c]];
    const k = [(1 - x) * (1 - y), x * (1 - y), x * y, (1 - x) * y];
    const mix = (f: (i: number) => number) => k[0] * f(0) + k[1] * f(1) + k[2] * f(2) + k[3] * f(3);
    const xy: Flat = [mix((i) => v[i].xy[0]), mix((i) => v[i].xy[1])];
    const n = unit3([mix((i) => v[i].n[0]), mix((i) => v[i].n[1]), mix((i) => v[i].n[2])]);
    const facing = n[0] * h.toward[0] + n[1] * h.toward[1] + n[2] * h.toward[2];
    const depth = depthOf([mix((i) => v[i].w[0]), mix((i) => v[i].w[1]), mix((i) => v[i].w[2])], h.P);
    return { xy, lit: mix((i) => v[i].lit), facing, seen: facing > 0 && !hidden(xy, depth) };
  };
}

// ─── the crown's frame ──────────────────────────────────────────────────────

/** The crown's own frame: a, lateral from the hemisphere's centre line LC;
    f, toward the front. The point of the hull over (a, f), as (t, z), by
    Newton's method on the hull itself (ripple and all). */
export function crownTZ(side: Side, a: number, f: number, shape: HullShape): [number, number] {
  const ax = a >= 0 ? HEMI.a : HEMI.a * HEMI.medial;
  const r = Math.min(0.95, Math.hypot(a / ax, f / HEMI.b));
  let t = Math.atan2(f / HEMI.b, a / ax);
  let z = HEMI.up * Math.max(0, 1 - r * r) ** (1 / 2.3);
  const at = (tt: number, zz: number) => {
    const p = hullPoint(side, tt, Math.min(HEMI.up - 1e-3, zz), shape);
    return [side * p[0] - LC, p[1]];
  };
  for (let i = 0; i < 10; i++) {
    const [pa, pf] = at(t, z);
    const ea = pa - a;
    const ef = pf - f;
    if (Math.abs(ea) + Math.abs(ef) < 1e-3) break;
    const [ta, tf] = at(t + 1e-4, z);
    const [za, zf] = at(t, z - 1e-2);
    const j11 = (ta - pa) / 1e-4;
    const j21 = (tf - pf) / 1e-4;
    const j12 = (za - pa) / -1e-2;
    const j22 = (zf - pf) / -1e-2;
    const det = j11 * j22 - j12 * j21;
    if (Math.abs(det) < 1e-9) break;
    t -= (j22 * ea - j12 * ef) / det;
    z -= (-j21 * ea + j11 * ef) / det;
    z = Math.min(HEMI.up - 1e-3, Math.max(60, z));
  }
  return [t, z];
}

/** A polyline in the crown's frame laid on the hull, as screen points. */
export function crownLine(h: Hull, pts: readonly [number, number][], step = 1): Flat[] {
  const out: Flat[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a0, f0] = pts[i];
    const [a1, f1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(a1 - a0, f1 - f0) / step));
    for (let k = i ? 1 : 0; k <= n; k++) {
      const [t, z] = crownTZ(h.side, a0 + ((a1 - a0) * k) / n, f0 + ((f1 - f0) * k) / n, h.shape);
      out.push(h.at(t, z).xy);
    }
  }
  return out;
}

/** A round pad in the crown's frame (round on the crown, where a pad in
    (u, w) would be squeezed by the converging meridians). */
export function crownPad(h: Hull, a: number, f: number, r: number, n = 12): Flat[] {
  return Array.from({ length: n }, (_, i) => {
    const [t, z] = crownTZ(h.side, a + r * Math.cos((i / n) * Math.PI * 2), f + r * Math.sin((i / n) * Math.PI * 2), h.shape);
    return h.at(t, z).xy;
  });
}

/** The crown frame (a, f) of a point of the hull, brain axes. */
export const afOf = (side: Side, b: readonly number[]): [number, number] => [side * b[0] - LC, b[1]];

// ─── regions and the skin ───────────────────────────────────────────────────

/** A half-plane a·x + b·y + c ≥ 0 in the crown's frame. */
export type Half = [number, number, number];
/** A convex region: the half-planes it lies inside. */
export type Region = Half[];

/** Whether a crown point lies in any of the regions. */
export const inRegions = (regions: readonly Region[], a: number, f: number) => regions.some((r) => r.every(([ga, gb, gc]) => ga * a + gb * f + gc >= 0));

interface LP {
  x: number;
  y: number;
}

const SQUARE: LP[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/** A facet's corners in some frame, at local (x, y) ∈ [0, 1]². */
function bilinear(c: readonly [number, number][], x: number, y: number): [number, number] {
  const [p0, p1, p2, p3] = c;
  return [(1 - x) * (1 - y) * p0[0] + x * (1 - y) * p1[0] + x * y * p2[0] + (1 - x) * y * p3[0], (1 - x) * (1 - y) * p0[1] + x * (1 - y) * p1[1] + x * y * p2[1] + (1 - x) * y * p3[1]];
}

/** A polygon in a facet's local square clipped to a convex region, the
    region's half-planes read through the facet's corners in its frame. */
function clip(poly: LP[], region: Region, frame: readonly [number, number][]): LP[] {
  let out = poly;
  for (const [ga, gb, gc] of region) {
    if (out.length < 3) return [];
    const g = (p: LP) => {
      const [x, y] = bilinear(frame, p.x, p.y);
      return ga * x + gb * y + gc;
    };
    const next: LP[] = [];
    for (let i = 0; i < out.length; i++) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      const sa = g(a);
      const sb = g(b);
      if (sa >= 0) next.push(a);
      if (sa >= 0 !== sb >= 0) {
        const k = sa / (sa - sb);
        next.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
      }
    }
    out = next;
  }
  return out;
}

/** A convex polygon less a convex region: the parts outside each of the
    region's half-planes in turn, each convex. */
function subtract(poly: LP[], region: Region, frame: readonly [number, number][]): LP[][] {
  const out: LP[][] = [];
  let inside = poly;
  for (const h of region) {
    if (inside.length < 3) break;
    const outside = clip(inside, [[-h[0], -h[1], -h[2]]], frame);
    if (outside.length >= 3) out.push(outside);
    inside = clip(inside, [h], frame);
  }
  return out;
}

/** The signed area of a local polygon. */
const area = (poly: LP[]) =>
  poly.reduce((acc, p, i) => {
    const q = poly[(i + 1) % poly.length];
    return acc + p.x * q.y - q.x * p.y;
  }, 0) / 2;

/** A local polygon on the screen, cut into the light's bands along the
    band's own iso-line. */
function lightPieces(f: Facet, poly: LP[], bands: readonly number[]): { band: number; pts: Flat[] }[] {
  const xy = f.v.map((v) => v.xy) as unknown as [number, number][];
  const lit = f.v.map((v) => [v.lit, 0]) as [number, number][];
  type P = { x: number; y: number; s: number };
  const pts: P[] = poly.map((p) => {
    const [x, y] = bilinear(xy, p.x, p.y);
    return { x, y, s: bilinear(lit, p.x, p.y)[0] };
  });
  const bandOf = (s: number) => {
    let b = 0;
    while (b < bands.length && s >= bands[b]) b++;
    return b;
  };
  const cutAt = (ps: P[], th: number, above: boolean) => {
    const out: P[] = [];
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      const b = ps[(i + 1) % ps.length];
      const ia = above ? a.s >= th : a.s <= th;
      const ib = above ? b.s >= th : b.s <= th;
      if (ia) out.push(a);
      if (ia !== ib) {
        const k = (th - a.s) / (b.s - a.s);
        out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s: th });
      }
    }
    return out;
  };
  const lo = Math.min(...pts.map((p) => bandOf(p.s)));
  const hi = Math.max(...pts.map((p) => bandOf(p.s)));
  const out: { band: number; pts: Flat[] }[] = [];
  for (let b = lo; b <= hi; b++) {
    let piece = pts;
    if (b > 0) piece = cutAt(piece, bands[b - 1], true);
    if (b < bands.length && piece.length) piece = cutAt(piece, bands[b], false);
    if (piece.length >= 3) out.push({ band: b, pts: piece.map((p) => [p.x, p.y] as Flat) });
  }
  return out;
}

export interface Skin {
  mask: readonly string[];
  maskBands: readonly number[];
  pour: readonly string[];
  pourBands: readonly number[];
}

/** The hull painted back to front in solder mask, with the pour laid into
    its facets: each facet is split exactly into mask and copper, so nothing
    is painted twice and no seam shows. Both take the hull's own light (a
    hull made with a gentle `lightShape` gives one smooth sheet of copper,
    not one stained by the folds under it). Pieces are gathered in thin
    slabs of depth and, within a slab, by tone: facets that face the viewer
    only overlap across a fold, far deeper than a slab, so the order holds
    while the picture is a few hundred paths, not one per facet. */
export function skinSvg(h: Hull, skin: Skin, pour: readonly Region[]): string {
  const SLAB = 4;
  const slabs = new Map<number, Map<string, string[]>>();
  let slab = 0;
  const put = (colour: string, pts: Flat[]) => {
    let tones = slabs.get(slab);
    if (!tones) slabs.set(slab, (tones = new Map()));
    const list = tones.get(colour);
    if (list) list.push(polyD(pts));
    else tones.set(colour, [polyD(pts)]);
  };
  const mask = (band: number) => skin.mask[Math.min(skin.mask.length - 1, band)];
  const copper = (band: number) => skin.pour[Math.min(skin.pour.length - 1, band)];
  for (const f of paintOrder(h)) {
    slab = Math.floor(f.depth / SLAB);
    const af = f.v.map((v) => afOf(h.side, v.b));
    const pieces: LP[][] = [];
    if (f.v[3].z > 80) {
      for (const region of pour) {
        // a region wholly outside one of its own half-planes at every corner
        // cannot touch the facet
        if (region.some(([ga, gb, gc]) => af.every(([x, y]) => ga * x + gb * y + gc < 0))) continue;
        const poly = clip(SQUARE, region, af);
        if (poly.length >= 3) pieces.push(poly);
      }
    }
    if (!pieces.length) {
      for (const piece of facetBands(f, skin.maskBands)) put(mask(piece.band), piece.pts);
      continue;
    }
    let rest: LP[][] = [SQUARE];
    for (const region of pour) {
      if (region.some(([ga, gb, gc]) => af.every(([x, y]) => ga * x + gb * y + gc < 0))) continue;
      rest = rest.flatMap((poly) => subtract(poly, region, af));
    }
    for (const poly of rest) if (Math.abs(area(poly)) > 1e-6) for (const piece of lightPieces(f, poly, skin.maskBands)) put(mask(piece.band), piece.pts);
    for (const poly of pieces) for (const piece of lightPieces(f, poly, skin.pourBands)) put(copper(piece.band), piece.pts);
  }
  const order = [...skin.mask, ...skin.pour];
  const out: string[] = [];
  for (const k of [...slabs.keys()].sort((a, b) => a - b)) {
    const tones = slabs.get(k)!;
    for (const colour of order) {
      const list = tones.get(colour);
      if (list) out.push(`<path fill="${colour}" stroke="${colour}" stroke-width=".45" stroke-linejoin="round" d="${list.join("")}"/>`);
    }
  }
  return out.join("");
}
