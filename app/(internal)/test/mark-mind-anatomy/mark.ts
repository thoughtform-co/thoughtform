/* The mark as the object's plan. PURE.

   Everything here is the Thoughtform brandmark (`lib/brandmark/brandmarkPaths.ts`,
   viewBox 430.99 × 436, y down) in its own units, moved so the plane's origin is
   the centre of the ring's outer edge, O = (206.7, 229.53). Plane u runs right,
   v toward the viewer (the mark's y), z up. Seen from straight above, every
   solid below lands back on the logo.

   Measured from a 4× raster of the ring (2026-10-20):
     outer edge   near-circle, r 203.5–208 about O
     inner edge   an ellipse: centre O + (2.42, −0.57), semi-axes 180.87 along
                  144.28° and 199.52 along 54.28° (y down), residual ≈ 1 unit.
                  The crescent is thick (≈30) where the ellipse is narrow, at the
                  lower left, and thin (≈5) at the lower right and upper left.
   The bars and the stepped block are read off path 5 point by point.

   The object:
     drum      the inside of the inner ellipse, cut through its whole height by
               the bars into four sectors
     channels  the bars, empty through the full height
     crescent  the ring, a band hugging the drum wall below its top, so the drum
               hides its far half
     block     the stepped crossing, a keystone seated one slice deep in notches
               of all four sectors, proud of the top: the one light
     keys      the bar ends that run out through the ring's gaps (right, top),
               gold plugs held between the cut faces */

import { BRANDMARK_PATHS, brandmarkPolylines } from "@/lib/brandmark/brandmarkPaths";

export type P2 = [number, number];

export const O: P2 = [206.7, 229.53];
export const toPlane = ([x, y]: P2): P2 => [x - O[0], y - O[1]];

/* ── the drum's plan: the ring's inner ellipse ── */
const E = { cx: 2.42, cy: -0.57, a: 180.87, b: 199.52, rot: (144.28 * Math.PI) / 180 };

/** Radius of the inner ellipse from O at angle t (radians, y down). */
export function drumRadius(t: number) {
  const dx = Math.cos(t);
  const dy = Math.sin(t);
  const c = Math.cos(E.rot);
  const s = Math.sin(E.rot);
  // ray O + r·d into the ellipse frame: q = R(-rot)(O + r d − C)
  const ox = -E.cx;
  const oy = -E.cy;
  const qx0 = ox * c + oy * s;
  const qy0 = -ox * s + oy * c;
  const qx1 = dx * c + dy * s;
  const qy1 = -dx * s + dy * c;
  const A = (qx1 * qx1) / (E.a * E.a) + (qy1 * qy1) / (E.b * E.b);
  const B = 2 * ((qx0 * qx1) / (E.a * E.a) + (qy0 * qy1) / (E.b * E.b));
  const C = (qx0 * qx0) / (E.a * E.a) + (qy0 * qy0) / (E.b * E.b) - 1;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
}

export const DRUM_STEPS = 240;
export const DRUM: P2[] = Array.from({ length: DRUM_STEPS }, (_, i) => {
  const t = (i / DRUM_STEPS) * Math.PI * 2;
  const r = drumRadius(t);
  return [Math.cos(t) * r, Math.sin(t) * r] as P2;
});

/* ── the ring, by angle ── */
const ringPolys: P2[][] = brandmarkPolylines(24)
  .filter((_, i) => i <= 1)
  .map((line) => line.map(toPlane));
// brandmarkPolylines returns one polyline per subpath: the first two are the
// top-right arc and the main ring
const RING_POLYS = ringPolys;

function hits(t: number): number[] {
  const dx = Math.cos(t);
  const dy = Math.sin(t);
  const out: number[] = [];
  for (const poly of RING_POLYS) {
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i]!;
      const [bx, by] = poly[(i + 1) % poly.length]!;
      const ex = bx - ax;
      const ey = by - ay;
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const r = (ax * ey - ay * ex) / den;
      const s = (ax * dy - ay * dx) / den;
      if (r > 0 && s >= 0 && s < 1) out.push(r);
    }
  }
  return out.sort((p, q) => p - q);
}

/** The ring's extent along the ray at angle t: [inner, outer], or null in a gap. */
export function ringAt(t: number): [number, number] | null {
  const h = hits(t);
  if (h.length < 2) return null;
  return [h[0]!, h[h.length - 1]!];
}

/** Ring segments every `step` degrees: polygons from the drum wall (or the
    ring's own cut end) out to its outer edge. Each one is a thin annular
    sector, near enough convex to extrude with the kit's hull. */
export interface RingSeg {
  poly: P2[];
  /** mid angle, radians */
  t: number;
  /** radial thickness at the middle */
  w: number;
}
export function ringSegments(step = 2, sub = 4): RingSeg[] {
  const segs: RingSeg[] = [];
  const n = Math.round(360 / step);
  for (let i = 0; i < n; i++) {
    const outer: P2[] = [];
    const inner: P2[] = [];
    let broken = false;
    for (let k = 0; k <= sub; k++) {
      const t = ((i * step + (k / sub) * step) * Math.PI) / 180;
      const r = ringAt(t);
      if (!r) {
        broken = true;
        break;
      }
      const rin = Math.max(drumRadius(t), r[0]);
      outer.push([Math.cos(t) * r[1], Math.sin(t) * r[1]]);
      inner.push([Math.cos(t) * rin, Math.sin(t) * rin]);
    }
    if (broken) {
      // a segment the gap cuts: walk in finer steps and keep the part with ring
      const fine: { o: P2; i: P2 }[] = [];
      for (let k = 0; k <= 40; k++) {
        const t = ((i * step + (k / 40) * step) * Math.PI) / 180;
        const r = ringAt(t);
        if (!r) {
          if (fine.length) break;
          continue;
        }
        const rin = Math.max(drumRadius(t), r[0]);
        if (rin >= r[1] - 0.2) continue;
        fine.push({ o: [Math.cos(t) * r[1], Math.sin(t) * r[1]], i: [Math.cos(t) * rin, Math.sin(t) * rin] });
      }
      if (fine.length >= 2) {
        const mid = fine[Math.floor(fine.length / 2)]!;
        segs.push({
          poly: [...fine.map((f) => f.o), ...fine.map((f) => f.i).reverse()],
          t: Math.atan2(mid.o[1], mid.o[0]),
          w: Math.hypot(mid.o[0], mid.o[1]) - Math.hypot(mid.i[0], mid.i[1]),
        });
      }
      continue;
    }
    const mo = outer[sub / 2]!;
    const mi = inner[sub / 2]!;
    segs.push({ poly: [...outer, ...inner.reverse()], t: ((i + 0.5) * step * Math.PI) / 180, w: Math.hypot(...mo) - Math.hypot(...mi) });
  }
  return segs;
}

/* ── the bars and the block, read off path 5 (mark units) ── */
const m = (x: number, y: number): P2 => toPlane([x, y]);

/** Level bar: y 218.81 – 236.58. */
export const LEVEL = { v0: 218.83 - O[1], v1: 236.6 - O[1] };
/** Upper slant, left edge (192.51, 205.08) → (230.76, 0.06); right edge (220.75, 182.31) → (254.36, 0.06). */
const UL_EDGE: [P2, P2] = [m(192.51, 205.08), m(230.76, 0.06)];
const UR_EDGE: [P2, P2] = [m(220.75, 182.31), m(254.36, 0.06)];
/** Lower slant, right edge (209.51, 250.35) → (179.17, 408.81); left edge (181.63, 267.81) → (157.58, 400.71). */
const LR_EDGE: [P2, P2] = [m(209.51, 250.35), m(179.17, 408.81)];
const LL_EDGE: [P2, P2] = [m(181.63, 267.81), m(157.58, 400.71)];

/** u of a near-vertical line at height v. */
const uAt = ([a, b]: [P2, P2], v: number) => a[0] + ((b[0] - a[0]) * (v - a[1])) / (b[1] - a[1]);

/** Keep the part of a polygon where f(p) <= 0 (Sutherland–Hodgman). */
export function clip(poly: P2[], f: (p: P2) => number): P2[] {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const fa = f(a);
    const fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
const keepLeftOf = (e: [P2, P2]) => (p: P2) => p[0] - uAt(e, p[1]);
const keepRightOf = (e: [P2, P2]) => (p: P2) => uAt(e, p[1]) - p[0];
const above = (v: number) => (p: P2) => p[1] - v;
const below = (v: number) => (p: P2) => v - p[1];

/** The block: the stepped crossing as five convex pieces (mark units). */
const BLOCK_PIECES_M: P2[][] = [
  // the top step, across the slant channel
  [[173.99, 205.08], [192.51, 205.08], [230.06, 203.93], [247.07, 203.93], [246.87, 205.09], [244.3, 218.86], [171.52, 218.8]],
  // the middle, the whole width of the level channel
  [[161.2, 218.85], [244.3, 218.86], [240.82, 236.58], [157.73, 236.62]],
  // the bottom step
  [[157.73, 236.62], [230.5, 236.63], [228.03, 250.35], [155.16, 250.39]],
  // the jog up-right into the upper slant
  [[220.75, 182.31], [234.84, 182.41], [230.06, 203.93], [216.76, 203.93]],
  // the jog down-left into the lower slant
  [[175.89, 250.39], [184.78, 250.39], [181.63, 267.81], [172.77, 267.81]],
];
export const BLOCK_PIECES: P2[][] = BLOCK_PIECES_M.map((poly) => poly.map(([x, y]) => m(x, y)));
/** The block's outline, one ring (mark units → plane), for its drawn edge. */
export const BLOCK_OUTLINE: P2[] = (
  [
    [220.75, 182.31], [234.84, 182.41], [230.06, 203.93], [247.07, 203.93], [246.87, 205.09], [244.3, 218.86], [240.82, 236.58],
    [230.5, 236.63], [228.03, 250.35], [184.78, 250.39], [181.63, 267.81], [172.77, 267.81], [175.89, 250.39], [155.16, 250.39],
    [157.73, 236.62], [161.2, 218.85], [171.52, 218.8], [173.99, 205.08], [192.51, 205.08], [216.76, 203.93],
  ] as P2[]
).map(([x, y]) => m(x, y));
export const CROSSING: P2 = m(202.5, 227.7);

/* ── the four sectors ── */
export type SectorKey = "ul" | "ur" | "ll" | "lr";
export type Side = "people" | "machine";
export interface Sector {
  key: SectorKey;
  side: Side;
  upper: boolean;
  /** the full plan, below the block's seat: the drum cut by the channels only */
  base: P2[];
  /** the top slice: the base with the block's notch taken out, as convex pieces back to front */
  top: P2[][];
  /** the same, one concave ring, for the drawn top face and its edges */
  topRing: P2[];
}

const D = DRUM;
const ul = clip(clip(D, above(LEVEL.v0)), keepLeftOf(UL_EDGE));
const ur = clip(clip(D, above(LEVEL.v0)), keepRightOf(UR_EDGE));
const ll = clip(clip(D, below(LEVEL.v1)), keepLeftOf(LL_EDGE));
const lr = clip(clip(D, below(LEVEL.v1)), keepRightOf(LR_EDGE));

/** Cut a convex polygon along a horizontal line into [above, below]. */
const splitAt = (poly: P2[], v: number): [P2[], P2[]] => [clip(poly, above(v)), clip(poly, below(v))];
const lineOf = (x0: number, y0: number, x1: number, y1: number): [P2, P2] => [m(x0, y0), m(x1, y1)];

function notched(): Record<SectorKey, P2[][]> {
  // UL: above the block's top step, and left of the step's left side beside it
  const [ulA, ulRest] = splitAt(ul, 205.08 - O[1]);
  const ulB = clip(ulRest, keepLeftOf(lineOf(173.99, 205.08, 171.52, 218.8)));
  // UR: above the jog, beside the jog, beside the top step
  const [urA, urRest] = splitAt(ur, 182.36 - O[1]);
  const [urMid, urLow] = splitAt(urRest, 203.93 - O[1]);
  const urB = clip(urMid, keepRightOf(lineOf(234.84, 182.41, 230.06, 203.93)));
  const urC = clip(urLow, keepRightOf(lineOf(247.07, 203.93, 244.3, 218.86)));
  // LR: beside the bottom step, then below it
  const [lrA, lrB] = splitAt(lr, 250.35 - O[1]);
  const lrA2 = clip(lrA, keepRightOf(lineOf(230.5, 236.63, 228.03, 250.35)));
  // LL: beside the bottom step, beside the jog, below the jog
  const [llA, llRest] = splitAt(ll, 250.39 - O[1]);
  const [llB, llC] = splitAt(llRest, 267.81 - O[1]);
  const llA2 = clip(llA, keepLeftOf(lineOf(155.16, 250.39, 157.73, 236.62)));
  const llB2 = clip(llB, keepLeftOf(lineOf(172.77, 267.81, 175.89, 250.39)));
  return {
    ul: [ulA, ulB],
    ur: [urA, urB, urC],
    lr: [lrA2, lrB],
    ll: [llA2, llB2, llC],
  };
}
const NOTCHED = notched();

/** Union of convex pieces that share horizontal cuts, as one ring: walk the
    pieces' outlines and drop the edges they share. */
function unionRing(pieces: P2[][]): P2[] {
  const key = (p: P2) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
  type E = [P2, P2];
  const edges: E[] = [];
  for (const poly of pieces) {
    const ccw = signed(poly) > 0 ? poly : [...poly].reverse();
    for (let i = 0; i < ccw.length; i++) edges.push([ccw[i]!, ccw[(i + 1) % ccw.length]!]);
  }
  // split edges at every vertex lying on them, so shared stretches match exactly
  const verts = edges.map((e) => e[0]);
  const split: E[] = [];
  for (const [a, b] of edges) {
    const on = verts
      .filter((p) => {
        const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (Math.abs(cr) / (len || 1) > 1e-6) return false;
        const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (len * len);
        return t > 1e-6 && t < 1 - 1e-6;
      })
      .sort((p, q) => Math.hypot(p[0] - a[0], p[1] - a[1]) - Math.hypot(q[0] - a[0], q[1] - a[1]));
    let prev = a;
    for (const p of on) {
      split.push([prev, p]);
      prev = p;
    }
    split.push([prev, b]);
  }
  const ids = new Map<string, number>();
  for (const [a, b] of split) ids.set(`${key(a)}>${key(b)}`, (ids.get(`${key(a)}>${key(b)}`) ?? 0) + 1);
  const outer = split.filter(([a, b]) => !ids.has(`${key(b)}>${key(a)}`) && Math.hypot(b[0] - a[0], b[1] - a[1]) > 1e-6);
  const next = new Map<string, E>();
  for (const e of outer) next.set(key(e[0]), e);
  const ring: P2[] = [];
  let e = outer[0]!;
  for (let guard = 0; guard < outer.length + 2; guard++) {
    ring.push(e[0]);
    const n = next.get(key(e[1]));
    if (!n || n === outer[0]) break;
    e = n;
  }
  return ring;
}
function signed(p: P2[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i]!;
    const [x1, y1] = p[(i + 1) % p.length]!;
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

export const SECTORS: Sector[] = (
  [
    ["ur", "machine", true, ur],
    ["ul", "people", true, ul],
    ["lr", "machine", false, lr],
    ["ll", "people", false, ll],
  ] as const
).map(([key, sideOf, upper, base]) => ({
  key,
  side: sideOf,
  upper,
  base,
  top: NOTCHED[key],
  topRing: unionRing(NOTCHED[key]),
}));

/* ── the keys: the bar ends past the drum ── */
/** How far each key reaches back into its channel, held between the cut faces. */
export const KEY_IN = 18;
const rightAt = drumRadius(0);
export const KEY_RIGHT: P2[] = [
  [rightAt - KEY_IN, LEVEL.v0],
  m(430.98, 218.81),
  m(425.75, 236.58),
  [rightAt - KEY_IN, LEVEL.v1],
];
/** The top key: between the upper slant's edges, from inside the drum wall up to the mark's y 0. */
const alongEdge = (e: [P2, P2], v: number): P2 => [uAt(e, v), v];
/** Where the drum wall crosses the upper slant's centre line (v < 0), by bisection. */
const wallV = (() => {
  const uc = (v: number) => (uAt(UL_EDGE, v) + uAt(UR_EDGE, v)) / 2;
  let lo = -260;
  let hi = -100;
  for (let i = 0; i < 60; i++) {
    const v = (lo + hi) / 2;
    const u = uc(v);
    if (Math.hypot(u, v) > drumRadius(Math.atan2(v, u))) lo = v;
    else hi = v;
  }
  return (lo + hi) / 2;
})();
const topV = wallV + KEY_IN;
export const KEY_TOP: P2[] = [alongEdge(UL_EDGE, topV), alongEdge(UL_EDGE, 0.06 - O[1]), alongEdge(UR_EDGE, 0.06 - O[1]), alongEdge(UR_EDGE, topV)];

/** The channels as plane polygons, for the top view and the diagnostics. */
export const CHANNELS = { UL_EDGE, UR_EDGE, LL_EDGE, LR_EDGE };

/** The mark's own outline for the top-view check: the paths' fill, in plane units. */
export const MARK_PATHS = BRANDMARK_PATHS;
