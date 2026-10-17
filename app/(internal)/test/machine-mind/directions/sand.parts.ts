import { LC, projOf, W, type BrainIsoBox, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { depthOf, iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";
import { hullPoint, inside, lightVector, mix, occluder, sidesFarFirst, Z_FLOOR, type Facet, type Hull, type MindTones, type Side } from "../hull";
import type { MindLive, MindOptions } from "./types";

/**
 * D5 · Sand, its parts: the facet cutting and compact path data the picture
 * is painted with, and the live layer, the dust plain the brain sits in and
 * the raster its dark flank leaves as. Square grains, opaque mixes over the ground, size
 * and share doing the fading (the swarm's own rules); everything travels
 * level, never swirls, on the clock (`?t=` freezes it).
 *
 *   under   the plain and the drift that lie behind the hull
 *   over    the plain and the drift in front of it (the base sits IN the
 *           sand), then the raster lines and the grains leaving the flank
 */

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One hard key from camera right, low and raking, a little from behind so
    the flank toward the viewer falls into shadow (MF-04: "left side entirely
    submerged in true black"). */
export const keyOf = (view: BrainView) => lightVector(view, 1, 0.4, -0.22);

export interface LiveDeps {
  box: BrainIsoBox;
  hullOf: (side: Side, view: BrainView) => Hull;
  /** The worn area's heights: the raster leaves the flank thickest there. */
  band: readonly [number, number];
  /** Where the gold traces run out over the silhouette: each leaves as gold
      raster on its own line. */
  exits: readonly Flat[];
  /** The side that wears and leaves. */
  eroded: Side;
}

// ─── compact path data ──────────────────────────────────────────────────────

const tenths = (v: number) => {
  const a = Math.abs(v);
  const s = a % 10 === 0 ? String(a / 10) : a < 10 ? `.${a}` : `${Math.floor(a / 10)}.${a % 10}`;
  return v < 0 ? `-${s}` : s;
};

/** A polyline as path data in relative steps at a tenth of a unit. */
export function cd(pts: readonly Flat[], close: boolean): string {
  if (pts.length < 2) return "";
  let X = Math.round(pts[0][0] * 10);
  let Y = Math.round(pts[0][1] * 10);
  let out = `M${tenths(X)}${Y < 0 ? "" : " "}${tenths(Y)}l`;
  let first = true;
  for (let i = 1; i < pts.length; i++) {
    const nx = Math.round(pts[i][0] * 10);
    const ny = Math.round(pts[i][1] * 10);
    const dx = nx - X;
    const dy = ny - Y;
    if (!dx && !dy) continue;
    const a = tenths(dx);
    const b = tenths(dy);
    out += (first || dx < 0 ? "" : " ") + a + (dy < 0 ? "" : " ") + b;
    first = false;
    X = nx;
    Y = ny;
  }
  if (first) return "";
  return close ? `${out}z` : out;
}

// ─── cutting a facet ────────────────────────────────────────────────────────

/** A facet corner carrying what it is cut on: light, height, erosion. */
export interface Cut {
  x: number;
  y: number;
  s: number;
  z: number;
  e: number;
  t: number;
  /** Made by the erosion's cut (a point on the stone's edge). */
  edge?: boolean;
}
type Key = "s" | "z" | "e";

export function clip(poly: Cut[], key: Key, th: number, above: boolean): Cut[] {
  const out: Cut[] = [];
  const keep = (p: Cut) => (above ? p[key] >= th : p[key] <= th);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = keep(a);
    const ib = keep(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const k = (th - a[key]) / (b[key] - a[key]);
      const at = (p: number, q: number) => p + (q - p) * k;
      out.push({ x: at(a.x, b.x), y: at(a.y, b.y), s: at(a.s, b.s), z: at(a.z, b.z), e: at(a.e, b.e), t: at(a.t, b.t), edge: key === "e" || (!!a.edge && !!b.edge) });
    }
  }
  return out;
}

export function indexIn(v: number, ths: readonly number[]) {
  let i = 0;
  while (i < ths.length && v >= ths[i]) i++;
  return i;
}

/** A polygon split along thresholds on one key: each piece with its index. */
export function split(poly: Cut[], key: Key, ths: readonly number[]): { i: number; pts: Cut[] }[] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of poly) {
    const i = indexIn(p[key], ths);
    if (i < lo) lo = i;
    if (i > hi) hi = i;
  }
  if (lo === hi) return [{ i: lo, pts: poly }];
  const out: { i: number; pts: Cut[] }[] = [];
  for (let b = lo; b <= hi; b++) {
    let piece = poly;
    if (b > 0) piece = clip(piece, key, ths[b - 1], true);
    if (b < ths.length && piece.length) piece = clip(piece, key, ths[b], false);
    if (piece.length >= 3) out.push({ i: b, pts: piece });
  }
  return out;
}

export const flat = (pts: Cut[]): Flat[] => pts.map((p) => [p.x, p.y]);

// ─── which facets overlap (a fold over a fold) ──────────────────────────────

/** Facets of one hull that overlap another, not a neighbour, on the screen:
    only these need painting strictly back to front; every other piece can be
    gathered by tone. */
export function foldedFacets(h: Hull, order: Facet[]): Set<Facet> {
  const R = h.zs.length - 1;
  const C = h.cols;
  const CELL = 10;
  const bins = new Map<number, number[]>();
  const quads = order.map((f) => f.v.map((v) => v.xy));
  const boxes = quads.map((q) => {
    const xs = q.map((p) => p[0]);
    const ys = q.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  });
  quads.forEach((q, i) => {
    const xs = q.map((p) => p[0]);
    const ys = q.map((p) => p[1]);
    for (let bx = Math.floor(Math.min(...xs) / CELL); bx <= Math.floor(Math.max(...xs) / CELL); bx++) {
      for (let by = Math.floor(Math.min(...ys) / CELL); by <= Math.floor(Math.max(...ys) / CELL); by++) {
        const k = bx * 4096 + by;
        const list = bins.get(k);
        if (list) list.push(i);
        else bins.set(k, [i]);
      }
    }
  });
  const neighbours = (a: Facet, b: Facet) => {
    const dr = Math.abs(a.r - b.r);
    const dc0 = Math.abs(a.c - b.c);
    const dc = Math.min(dc0, C - dc0);
    return (dr <= 1 && dc <= 1) || (a.r >= R - 1 && b.r >= R - 1);
  };
  const apart = (p: Flat[], q: Flat[]) => {
    for (const poly of [p, q]) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const nx = b[1] - a[1];
        const ny = a[0] - b[0];
        const len = Math.hypot(nx, ny);
        if (len < 1e-6) continue;
        let p0 = Infinity;
        let p1 = -Infinity;
        let q0 = Infinity;
        let q1 = -Infinity;
        for (const v of p) {
          const d = (v[0] * nx + v[1] * ny) / len;
          p0 = Math.min(p0, d);
          p1 = Math.max(p1, d);
        }
        for (const v of q) {
          const d = (v[0] * nx + v[1] * ny) / len;
          q0 = Math.min(q0, d);
          q1 = Math.max(q1, d);
        }
        if (p1 <= q0 + 0.05 || q1 <= p0 + 0.05) return true;
      }
    }
    return false;
  };
  const out = new Set<Facet>();
  for (const list of bins.values()) {
    for (let x = 0; x < list.length; x++) {
      for (let y = x + 1; y < list.length; y++) {
        const a = order[list[x]];
        const b = order[list[y]];
        if ((out.has(a) && out.has(b)) || neighbours(a, b)) continue;
        const ba = boxes[list[x]];
        const bb = boxes[list[y]];
        if (ba[2] <= bb[0] || bb[2] <= ba[0] || ba[3] <= bb[1] || bb[3] <= ba[1]) continue;
        if (!apart(quads[list[x]], quads[list[y]])) {
          out.add(a);
          out.add(b);
        }
      }
    }
  }
  return out;
}

// ─── the paint ──────────────────────────────────────────────────────────────

const LEVELS = 8;
const F_PLAIN = 0;
const F_SHADE = 1;
const F_DRIFT = 2;
const F_RASTER = 3;
const F_GOLD = 4;

interface Family {
  tone: string;
  lo: number;
  hi: number;
}

/** Each family as a tone at a share of itself over the ground, eight levels. */
function paintOf(light: boolean, tones: MindTones): string[][] {
  const fam: Family[] = light
    ? [
        // pale sand on parchment: lit grains barely darker than the ground,
        // the cast shadow darker, the raster basalt ink
        { tone: "#8a7a5e", lo: 0.05, hi: 0.3 },
        { tone: "#6a5d48", lo: 0.12, hi: 0.42 },
        { tone: "#4d4437", lo: 0.06, hi: 0.62 },
        { tone: "#1f1b17", lo: 0.08, hi: 0.72 },
        { tone: tones.gold, lo: 0.3, hi: 0.95 },
      ]
    : [
        { tone: "#d6c6a5", lo: 0.05, hi: 0.6 },
        { tone: "#d6c6a5", lo: 0.025, hi: 0.11 },
        { tone: "#ddd0b7", lo: 0.05, hi: 0.72 },
        { tone: "#ddd0b7", lo: 0.05, hi: 0.58 },
        { tone: tones.gold, lo: 0.25, hi: 0.92 },
      ];
  return fam.map((f) => Array.from({ length: LEVELS }, (_, k) => mix(tones.ground, f.tone, f.lo + ((f.hi - f.lo) * k) / (LEVELS - 1))));
}

// ─── geometry helpers ───────────────────────────────────────────────────────

function convexHull(pts: Flat[]): Flat[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Flat[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

// ─── the layer ──────────────────────────────────────────────────────────────

/** Static grains, gathered by colour: x, y in picture units, size in device
    px. */
interface Batch {
  colour: string;
  x: number[];
  y: number[];
  s: number[];
}

export function sandLive({ view, only, light, tones }: MindOptions, deps: LiveDeps): MindLive {
  const P = projOf(view);
  const paint = paintOf(light, tones);
  const sides = only ? [only] : sidesFarFirst(view);
  const hulls = sides.map((s) => deps.hullOf(s, view));
  const hidden = hulls.map((h) => occluder(h));
  const L = deps.hullOf(sides[0], view).light;
  const zg = Z_FLOOR;
  const B = deps.box;
  const edgeFade = (x: number, y: number) => smooth(B.x0, B.x0 + 70, x) * smooth(B.x1, B.x1 - 70, x) * smooth(B.y1, B.y1 - 40, y) * smooth(B.y0, B.y0 + 40, y);

  // the brain's shadow on the plain: the hull thrown along the light onto
  // the ground, as a convex outline in the kit's world
  const thrown: Flat[] = [];
  for (const h of hulls) {
    for (let r = 0; r < h.vertices.length; r += 2) {
      for (let c = 0; c < h.cols; c += 3) {
        const v = h.vertices[r][c];
        const k = (v.w[2] - zg) / Math.max(0.05, L[2]);
        thrown.push([v.w[0] - L[0] * k, v.w[1] - L[1] * k]);
      }
    }
  }
  const shadow = convexHull(thrown);
  // each hemisphere's footprint, a little grown: no sand drawn under it
  const feet = sides.map((side) => Array.from({ length: 48 }, (_, i): Flat => {
    const [l, f] = hullPoint(side, (i / 48) * Math.PI * 2, zg);
    return [side * LC + (l - side * LC) * 0.97, f * 0.97];
  }));

  const under = new Map<string, Batch>();
  const over = new Map<string, Batch>();
  const put = (l: number, f: number, z: number, fam: number, level: number, size: number) => {
    if (level <= 0) return;
    const w = W(l, f, z);
    const xy = iso(w, P);
    const d = depthOf(w, P);
    const behind = hidden.some((test) => test(xy, d));
    const colour = paint[fam][Math.min(LEVELS - 1, level)];
    const into = behind ? under : over;
    let b = into.get(colour);
    if (!b) into.set(colour, (b = { colour, x: [], y: [], s: [] }));
    b.x.push(xy[0]);
    b.y.push(xy[1]);
    b.s.push(size);
  };
  const levelOf = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * (LEVELS - 1));

  // the plain: grains on the ground, thickest along the brain's own outline
  // and thinning outward; lit sand to the right, the brain's long shadow
  // thrown left across it
  // one smooth footprint for the whole brain (both hemispheres, or the one
  // drawn), so the plain has no notch where the fissure meets the ground
  const lMin = Math.min(...sides.map((side) => (side < 0 ? -(LC + 108) : 2)));
  const lMax = Math.max(...sides.map((side) => (side > 0 ? LC + 108 : -2)));
  const lMid = (lMin + lMax) / 2;
  const lHalf = (lMax - lMin) / 2;
  const reachOut = (l: number, f: number) => {
    const k = Math.hypot((l - lMid) / lHalf, f / 148);
    return (k - 1) * Math.min(lHalf, 148);
  };
  const r = rng(7);
  const R = 320;
  for (let i = 0; i < 80000; i++) {
    const l = (r() * 2 - 1) * R;
    const f = (r() * 2 - 1) * R;
    const q = Math.hypot(l * 0.9, f) / R;
    if (q >= 1) continue;
    const out = reachOut(l, f);
    const dense = Math.exp(-Math.max(0, out) / 52) * (1 - q * q) ** 1.4 * (out < -20 ? 0.4 : 1);
    if (r() > dense) continue;
    const side: Side = l < 0 ? -1 : 1;
    const k = sides.indexOf(side);
    if (k < 0) continue;
    if (inside([l, f], feet[k])) continue;
    const w = W(l, f, zg);
    const xy = iso(w, P);
    const fade = dense * edgeFade(xy[0], xy[1]);
    const dark = inside([w[0], w[1]], shadow);
    const glint = 0.3 + 0.7 * r();
    put(l, f, zg, dark ? F_SHADE : F_PLAIN, levelOf(fade * glint * (light ? 1.1 : dark ? 1 : 1.15)), r() < 0.12 && fade > 0.45 ? 2 : 1);
  }

  // the drift: sand banked against each hemisphere's base and up over the
  // foot of its belly, thick at the stone and thinning out over the plain,
  // so the brain sits IN the ground and the two read as one material
  const rd = rng(19);
  for (const side of sides) {
    // even along the base, not along its parameter (the medial half of the
    // contour is pressed into a third of the length)
    const N = 720;
    const run = new Float64Array(N + 1);
    let prev = hullPoint(side, 0, zg);
    for (let i = 1; i <= N; i++) {
      const q = hullPoint(side, (i / N) * Math.PI * 2, zg);
      run[i] = run[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      prev = q;
    }
    const tAt = (x: number) => {
      const target = x * run[N];
      let lo = 0;
      let hi = N;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (run[mid] < target) lo = mid;
        else hi = mid;
      }
      return ((lo + (target - run[lo]) / Math.max(1e-9, run[hi] - run[lo])) / N) * Math.PI * 2;
    };
    for (let i = 0; i < 12000; i++) {
      const t = tAt(rd());
      // none into the fissure: the medial side banks nothing
      const medial = Math.min(1, Math.max(0, -Math.cos(t) * 1.6 + 0.15));
      if (rd() < medial) continue;
      const top = zg + (30 + 6 * Math.sin(2 * t + side * 1.3) + 3 * Math.sin(5 * t + 0.4)) * (1 - 0.6 * medial);
      const [l0, f0] = hullPoint(side, t, top);
      const ol = l0 - side * LC;
      const len = Math.hypot(ol, f0) || 1;
      const dl = ol / len;
      const df = f0 / len;
      // short into the fissure, long out on the lateral side
      const reach = (30 + 30 * Math.max(0, Math.cos(t)) + 12 * Math.abs(Math.sin(t))) * (1 - 0.6 * medial);
      const q = rd() ** 2;
      const d = reach * q;
      const fall = (1 - q) ** 1.8;
      const z = zg + (top - zg) * fall + (rd() - 0.5) * 1.4;
      const l = l0 + dl * (d - 0.8);
      const f = f0 + df * (d - 0.8);
      // the bank's own light: outward, steep at the stone, flat at the rim
      const slope = ((top - zg) * 1.8 * (1 - q) ** 0.8) / reach;
      const nw = W(dl * slope, df * slope, 1);
      const nl = Math.hypot(nw[0], nw[1], nw[2]);
      const lit = Math.max(0, (nw[0] * L[0] + nw[1] * L[1] + nw[2] * L[2]) / nl);
      const g = W(l, f, zg);
      const dark = lit < 0.3 && inside([g[0], g[1]], shadow);
      const near = 1 - q;
      const grain = 0.55 + 0.45 * rd();
      const v = light ? (dark ? 0.8 : 0.22 + 0.45 * (1 - lit)) * (0.35 + 0.65 * near) : (dark ? 0.1 : 0.1 + 0.9 * lit) * (0.35 + 0.65 * near);
      put(l, f, z, F_DRIFT, levelOf(v * grain), rd() < 0.16 ? 2 : 1);
    }
  }

  // the flank that leaves: the eroded hemisphere's screen-left silhouette,
  // row by row, and the heights it stands at
  const live = sides.includes(deps.eroded);
  const rows: { y: number; x: number; z: number }[] = [];
  if (live) {
    const h = deps.hullOf(deps.eroded, view);
    const best = new Map<number, { x: number; z: number }>();
    for (const row of h.vertices) {
      for (const v of row) {
        const yb = Math.round(v.xy[1]);
        const b = best.get(yb);
        if (!b || v.xy[0] < b.x) best.set(yb, { x: v.xy[0], z: v.z });
      }
    }
    for (const [y, b] of best) rows.push({ y, x: b.x, z: b.z });
    rows.sort((a, b) => a.y - b.y);
  }
  const [z0, z1] = deps.band;
  const zm = (z0 + z1) / 2;
  const half = (z1 - z0) / 2;
  const pick = (rr: () => number, wide: number) => {
    // a row, thickest at the window's heights
    for (;;) {
      const row = rows[Math.floor(rr() * rows.length)];
      const wgt = 0.1 * wide + Math.exp(-(((row.z - zm) / (half * 1.25)) ** 2));
      if (row.z > -40 && row.z < 128 && rr() * (1 + 0.1 * wide) < wgt) return row;
    }
  };

  // raster: fine level lines peeling off the flank and travelling left,
  // each born at the edge, stretched as it goes, fading as it thins
  const NR = live ? 210 : 0;
  const rasters = { y: new Float32Array(NR), x: new Float32Array(NR), v: new Float32Array(NR), T: new Float32Array(NR), ph: new Float32Array(NR), len: new Float32Array(NR), s: new Float32Array(NR), w: new Uint8Array(NR) };
  const rr = rng(31);
  for (let i = 0; i < NR; i++) {
    const row = pick(rr, 1);
    rasters.y[i] = row.y + rr() - 0.5;
    // most peel off the very edge; some start on the dark flank itself, so the
    // edge breaks into raster rather than ending on a line
    rasters.x[i] = row.x + 1 + (rr() < 0.35 ? 6 + rr() * 22 : rr() * 5);
    rasters.v[i] = 6 + 15 * rr();
    rasters.T[i] = 6 + 9 * rr();
    rasters.ph[i] = rr();
    rasters.len[i] = 5 + 58 * rr() ** 2.2;
    rasters.s[i] = 0.35 + 0.65 * rr();
    rasters.w[i] = rr() < 0.12 ? 2 : 1;
  }
  // the traces' own raster: where a gold trace runs out over the silhouette
  // it goes on as gold streaks on its own line, peeling off and fading
  const exits = live ? deps.exits : [];
  const PER = 6;
  const NG = exits.length * PER;
  const golds = { y: new Float32Array(NG), x: new Float32Array(NG), v: new Float32Array(NG), T: new Float32Array(NG), ph: new Float32Array(NG), len: new Float32Array(NG), s: new Float32Array(NG) };
  const rg = rng(43);
  for (let i = 0; i < NG; i++) {
    const e = exits[Math.floor(i / PER)];
    const k = i % PER;
    // half of them hang about the end, short and slow, so the trace breaks
    // up where it stops; the rest travel off as raster
    const near = k < PER / 2;
    golds.y[i] = e[1];
    golds.x[i] = e[0] + 0.5;
    golds.v[i] = near ? 1.2 + 2.5 * rg() : 5 + 12 * rg();
    golds.T[i] = near ? 3 + 4 * rg() : 5 + 8 * rg();
    golds.ph[i] = (Math.floor(i / PER) * 0.37 + (k % (PER / 2)) / (PER / 2) + rg() * 0.15) % 1;
    golds.len[i] = near ? 1.5 + 4 * rg() : 4 + 26 * rg() ** 1.6;
    golds.s[i] = 0.55 + 0.45 * rg();
  }
  // the spray: single grains leaving with it, a few of them gold
  const NS = live ? 280 : 0;
  const spray = { y: new Float32Array(NS), x: new Float32Array(NS), v: new Float32Array(NS), T: new Float32Array(NS), ph: new Float32Array(NS), s: new Float32Array(NS), g: new Uint8Array(NS), w: new Uint8Array(NS) };
  const rs = rng(37);
  for (let i = 0; i < NS; i++) {
    const row = pick(rs, 2.5);
    spray.y[i] = row.y + (rs() - 0.5) * 3;
    spray.x[i] = row.x + rs() * 8;
    spray.v[i] = 4 + 18 * rs();
    spray.T[i] = 4 + 10 * rs();
    spray.ph[i] = rs();
    spray.s[i] = 0.3 + 0.7 * rs();
    spray.g[i] = rs() < 0.08 ? 1 : 0;
    spray.w[i] = rs() < 0.2 ? 2 : 1;
  }

  const drawBatches = (ctx: CanvasRenderingContext2D, px: number, batches: Map<string, Batch>) => {
    const m = ctx.getTransform();
    const sx = (x: number) => (Math.round(m.e + x * px) - m.e) / px;
    const sy = (y: number) => (Math.round(m.f + y * px) - m.f) / px;
    for (const b of batches.values()) {
      ctx.fillStyle = b.colour;
      for (let i = 0; i < b.x.length; i++) ctx.fillRect(sx(b.x[i]), sy(b.y[i]), b.s[i] / px, b.s[i] / px);
    }
  };
  // the grains that never move are drawn once per size and pose into a
  // canvas of their own, only as large as they reach, and that canvas is
  // laid down each frame
  const reach = (batches: Map<string, Batch>) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const b of batches.values()) {
      for (let i = 0; i < b.x.length; i++) {
        x0 = Math.min(x0, b.x[i]);
        x1 = Math.max(x1, b.x[i]);
        y0 = Math.min(y0, b.y[i]);
        y1 = Math.max(y1, b.y[i]);
      }
    }
    return { x0, y0, x1: x1 + 3, y1: y1 + 3 };
  };
  const bounds = new Map([under, over].map((b) => [b, reach(b)]));
  const caches = new Map<Map<string, Batch>, { key: string; canvas: HTMLCanvasElement; x: number; y: number }>();
  const drawStill = (ctx: CanvasRenderingContext2D, px: number, batches: Map<string, Batch>) => {
    const r = bounds.get(batches);
    if (!r || !Number.isFinite(r.x0)) return;
    const m = ctx.getTransform();
    const key = `${ctx.canvas.width}x${ctx.canvas.height}:${px}:${m.e}:${m.f}`;
    let c = caches.get(batches);
    if (!c || c.key !== key) {
      const x = Math.max(0, Math.floor(m.e + r.x0 * px));
      const y = Math.max(0, Math.floor(m.f + r.y0 * px));
      const w = Math.min(ctx.canvas.width, Math.ceil(m.e + r.x1 * px)) - x;
      const h = Math.min(ctx.canvas.height, Math.ceil(m.f + r.y1 * px)) - y;
      if (w <= 0 || h <= 0) return;
      const canvas = c?.canvas ?? document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const off = canvas.getContext("2d");
      if (!off) {
        drawBatches(ctx, px, batches);
        return;
      }
      off.setTransform(m.a, m.b, m.c, m.d, m.e - x, m.f - y);
      drawBatches(off, px, batches);
      c = { key, canvas, x, y };
      caches.set(batches, c);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c.canvas, c.x, c.y);
    ctx.restore();
  };

  const moving = (ctx: CanvasRenderingContext2D, t: number, px: number) => {
    if (!NR && !NS && !NG) return;
    const m = ctx.getTransform();
    const sx = (x: number) => (Math.round(m.e + x * px) - m.e) / px;
    const sy = (y: number) => (Math.round(m.f + y * px) - m.f) / px;
    const one = 1 / px;
    // gathered by colour, then filled
    const buckets: number[][] = Array.from({ length: LEVELS * 2 }, () => []);
    for (let i = 0; i < NR; i++) {
      const a = (t / rasters.T[i] + rasters.ph[i]) % 1;
      const head = rasters.x[i] - rasters.v[i] * a ** 1.7 * rasters.T[i];
      const len = rasters.len[i] * smooth(0, 0.3, a) * (0.55 + 0.45 * (1 - a));
      const tail = Math.min(rasters.x[i], head + len);
      const lv = Math.round(rasters.s[i] * (1 - a) ** 1.25 * edgeFade(head, rasters.y[i]) * (LEVELS - 1));
      if (lv <= 0 || tail - head < one) continue;
      buckets[lv].push(sx(head), sy(rasters.y[i]), Math.max(one, sx(tail) - sx(head)), rasters.w[i] * one);
    }
    for (let i = 0; i < NG; i++) {
      const a = (t / golds.T[i] + golds.ph[i]) % 1;
      const head = golds.x[i] - golds.v[i] * a ** 1.6 * golds.T[i];
      const len = golds.len[i] * smooth(0, 0.25, a) * (0.5 + 0.5 * (1 - a));
      const tail = Math.min(golds.x[i], head + len);
      const lv = Math.round(golds.s[i] * (1 - a) ** 1.3 * edgeFade(head, golds.y[i]) * (LEVELS - 1));
      if (lv <= 0 || tail - head < one) continue;
      buckets[LEVELS + lv].push(sx(head), sy(golds.y[i]), Math.max(one, sx(tail) - sx(head)), one);
    }
    for (let i = 0; i < NS; i++) {
      const a = (t / spray.T[i] + spray.ph[i]) % 1;
      const x = spray.x[i] - spray.v[i] * a ** 1.5 * spray.T[i];
      const lv = Math.round(spray.s[i] * (1 - a) ** 1.5 * smooth(0, 0.06, a) * edgeFade(x, spray.y[i]) * (LEVELS - 1));
      if (lv <= 0) continue;
      buckets[lv + (spray.g[i] ? LEVELS : 0)].push(sx(x), sy(spray.y[i]), spray.w[i] * one, spray.w[i] * one);
    }
    for (let k = 1; k < LEVELS * 2; k++) {
      const list = buckets[k];
      if (!list.length) continue;
      ctx.fillStyle = k < LEVELS ? paint[F_RASTER][k] : paint[F_GOLD][k - LEVELS];
      for (let i = 0; i < list.length; i += 4) ctx.fillRect(list[i], list[i + 1], list[i + 2], list[i + 3]);
    }
  };

  return {
    under(ctx, _t, px) {
      drawStill(ctx, px, under);
    },
    over(ctx, t, px) {
      drawStill(ctx, px, over);
      moving(ctx, t, px);
    },
  };
}
