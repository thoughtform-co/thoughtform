/**
 * H1 · Wired Cortex (machine-mind round five, 2026-10-17). The owner on G1:
 * the tendrils "feel latched on … not integrated … should be a bit more
 * artistic and abstract"; the circuits "placed very sparsely, as if just
 * randomly dropped"; "it just looks like plateaus and it doesn't really
 * convey machine mind … it doesn't have to be an exact replica of a brain".
 *
 * One system instead of parts added to a stack:
 *
 *   folds     the sulci are routed channels (level, plumb or 45° in plan) cut
 *             into the top of G1's wafer stack: a wide cut through the top
 *             wafer at a point and a narrow one through the wafer under it,
 *             so every fold is a stepped groove and the crown breaks into a
 *             few blocky gyri a hemisphere, a clear fissure between them
 *   circuit   the gold is the fold map: a bus on the floor of every groove
 *             (thick in the long sulci), a fine trace on each of its ledges;
 *             where a groove reaches the medial wall or the rim, its traces
 *             go down the wall in plumb runs, a via at each wafer edge, to the
 *             band. Never on a front-facing wall
 *   node     G1's tall node on a gyrus of the right crown, its fan-out
 *             running down into the grooves either side to join the buses
 *   band     a machined collar round the base of both hemispheres, faceted
 *             segments, seams and screws, a lens port on the left: the brain
 *             stands in it
 *   tendrils from under the band: bundles of fine parallel lines (the
 *             traces leaving the brain), long arcs settling into falls, one
 *             looping, two carrying a gold line on from the buses above
 *
 * The picture's box is the brain's own, deepened for the tendrils.
 *
 * Pure: strings and numbers, no randomness.
 */

import { brainIsoBox, projOf, type BrainIsoBox, type BrainView } from "@/components/arcs/figures/foundation/brainIso";
import { iso, type Point3, type Projection } from "@/components/arcs/figures/foundation/isoKit";
import { heightRange, lineD, mindSvg, polyD, routedOutline, sectionAt, sidesFarFirst, type HullShape, type Side } from "../hull";
import { nodeSvg } from "./waferMind.parts";
import {
  areaOf,
  at,
  bandSvg,
  bezier3,
  inside,
  offsetLine,
  lean,
  lensSvg,
  nearestEdge,
  nodeCss,
  paletteOf,
  polyDist,
  resample,
  sdRing,
  tendrilSvg,
  wallsOf,
  type BandSpec,
  type P2,
  type Palette,
  type Tendril,
  type V3,
  type Wall,
} from "./wiredCortex.parts";
import type { MindDirection, MindOptions } from "./types";

// ─── the stack (G1's) ───────────────────────────────────────────────────────

const SHAPE: HullShape = { brain: 1, sulci: 0.02 };
const WAFERS = 16;
const TOL = 2;
const GAP = 1;
const BAND = 0.7;
const MIN_T = 4.5;
const CAP_DROP = 2.5;
const SLOPE = 0.72;

/** The plan grid the cut wafers are read on, brain units. */
const STEP = 1.25;
/** A groove's half width through the top wafer at a point, and through the
    wafer under it. */
const HALF_A = 4.5;
const HALF_B = 4.5;
/** Wafers whose floor is above this are cut. */
const CUT_Z = 22;
/** The band's top (the wafers under it are inside it) and its height. */
const BAND_TOP = -24;
const BAND_H = 19;
/** A wall whose outward normal points this far forward carries no gold. */
const FRONT = 0.3;
/** How far the fine lip traces run from a groove's edge. */
const LIP = 2.2;
/** The medial edge's distance from the midline (the plan's `lat` origin). */
const MED = 17;

function levels(): number[] {
  const [floor, crown] = heightRange(SHAPE);
  const top = crown - CAP_DROP;
  const n = 160;
  const radius = (H: number) => {
    const { ring } = sectionAt(1, H, SHAPE, 24);
    return ring.reduce((s, [l, f]) => s + Math.hypot(l - 75, f), 0) / ring.length;
  };
  const hs: number[] = [];
  const ds: number[] = [0];
  let r0 = radius(floor + 0.5);
  for (let i = 0; i <= n; i++) {
    const H = floor + 0.5 + ((top - floor - 0.5) * i) / n;
    hs.push(H);
    if (i) {
      const r = radius(H);
      ds.push(ds[i - 1] + Math.hypot(r - r0, (top - floor) / n));
      r0 = r;
    }
  }
  const out: number[] = [hs[0]];
  let j = 0;
  for (let k = 1; k < WAFERS; k++) {
    const target = (ds[n] * k) / WAFERS;
    while (ds[j + 1] < target) j++;
    const a = (target - ds[j]) / (ds[j + 1] - ds[j]);
    const bySlope = hs[j] + (hs[j + 1] - hs[j]) * a;
    const byHeight = hs[0] + ((top - hs[0]) * k) / WAFERS;
    out.push(Math.max(SLOPE * bySlope + (1 - SLOPE) * byHeight, out[k - 1] + MIN_T));
  }
  out.push(top);
  return out;
}

// ─── the sulci ──────────────────────────────────────────────────────────────

/** A groove in plan, in (lat, f): lat from the medial edge outward, f toward
    the front. Every run level, plumb or at 45°. A trunk carries the thick
    bus. Each list runs from its inner end outward, so a trace walked along
    it stops at the first front-facing step. */
interface Groove {
  pts: [number, number][];
  trunk?: boolean;
}

/** The right hemisphere's grooves, then the left's: the same anatomy drawn
    twice by hand, never mirrored (central, pre- and postcentral, superior
    and inferior frontal, intraparietal, parieto-occipital, superior
    temporal). */
const GROOVES: Record<Side, Groove[]> = {
  1: [
    { pts: [[-10, -14], [18, -14], [50, 18], [130, 18]], trunk: true },
    { pts: [[12, 44], [24, 44], [50, 70], [122, 70]] },
    { pts: [[28, 44], [28, 104], [42, 118], [42, 160]] },
    { pts: [[46, -24], [46, -84], [62, -100], [62, -160]], trunk: true },
    { pts: [[-10, -116], [28, -116]] },
    { pts: [[86, -112], [86, -52], [102, -36], [102, 92]], trunk: true },
  ],
  [-1]: [
    { pts: [[-10, -4], [14, -4], [48, 30], [130, 30]], trunk: true },
    { pts: [[6, -44], [24, -44], [56, -12], [130, -12]] },
    { pts: [[26, 48], [26, 98], [38, 110], [38, 160]] },
    { pts: [[44, -26], [44, -74], [60, -90], [60, -160]], trunk: true },
    { pts: [[80, -104], [80, -42], [98, -24], [98, 100]], trunk: true },
  ],
};

const toPlan = (side: Side, [lat, f]: [number, number]): P2 => [side * (MED + lat), f];

// ─── the cut stack ──────────────────────────────────────────────────────────

interface Wafer {
  k: number;
  h0: number;
  h1: number;
  /** The level section, routed, solid on its left. */
  ring: P2[];
  /** What is left of it after the grooves: outlines and holes, each with
      its solid on its left. */
  loops: P2[][];
}

interface Stack {
  side: Side;
  wafers: Wafer[];
  grooves: { pts: P2[]; trunk: boolean }[];
  /** The wafers inside the band (0 … band) are not drawn. */
  band: number;
}

const stackMemo = new Map<Side, Stack>();

function stackOf(side: Side): Stack {
  const known = stackMemo.get(side);
  if (known) return known;
  const L = levels();
  const rings: P2[][] = [];
  for (let k = 0; k < WAFERS; k++) {
    let ring = routedOutline(sectionAt(side, (L[k] + L[k + 1]) / 2, SHAPE, 200).ring, TOL) as P2[];
    if (areaOf(ring) < 0) ring = ring.slice().reverse();
    rings.push(ring);
  }
  const grooves = GROOVES[side].map((g) => ({ pts: g.pts.map((p) => toPlan(side, p)), trunk: !!g.trunk }));
  const cut = (k: number) => L[k] >= CUT_Z;
  // the plan grid over the widest wafer
  const all = rings.flat();
  const x0 = Math.min(...all.map((p) => p[0])) - STEP * 3;
  const y0 = Math.min(...all.map((p) => p[1])) - STEP * 3;
  const cols = Math.ceil((Math.max(...all.map((p) => p[0])) - x0) / STEP) + 4;
  const rows = Math.ceil((Math.max(...all.map((p) => p[1])) - y0) / STEP) + 4;
  const pt = (i: number, j: number): P2 => [x0 + j * STEP, y0 + i * STEP];
  const first = rings.findIndex((_, k) => cut(k));
  const sd: (Float32Array | null)[] = rings.map((ring, k) => {
    if (first < 0 || k < first) return null;
    const g = new Float32Array(rows * cols);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) g[i * cols + j] = sdRing(pt(i, j), ring);
    return g;
  });
  const chan = new Float32Array(rows * cols);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) chan[i * cols + j] = Math.min(...grooves.map((g) => polyDist(pt(i, j), g.pts)));
  // the field a cut wafer is solid where it is positive
  const field = (k: number, s: number, s1: number, s2: number, d: number) => {
    const cutA = Math.min(HALF_A - d, -s1);
    const cutB = Math.min(HALF_B - d, s1, -s2);
    void k;
    return Math.min(s, -cutA, -cutB);
  };
  const exact = (k: number, p: P2) => {
    const s = sdRing(p, rings[k]);
    const s1 = k + 1 < WAFERS ? sdRing(p, rings[k + 1]) : -1e9;
    const s2 = k + 2 < WAFERS ? sdRing(p, rings[k + 2]) : -1e9;
    return field(k, s, s1, s2, Math.min(...grooves.map((g) => polyDist(p, g.pts))));
  };
  const wafers: Wafer[] = rings.map((ring, k) => {
    if (!cut(k)) return { k, h0: L[k], h1: L[k + 1], ring, loops: [ring] };
    const phi = new Float32Array(rows * cols);
    for (let c = 0; c < rows * cols; c++) phi[c] = field(k, sd[k]![c], k + 1 < WAFERS ? sd[k + 1]![c] : -1e9, k + 2 < WAFERS ? sd[k + 2]![c] : -1e9, chan[c]);
    const loops: P2[][] = [];
    for (const raw of contours(phi, rows, cols, x0, y0)) {
      if (Math.abs(areaOf(raw)) < 30) continue;
      let ring2 = routedOutline(raw, 0.7) as P2[];
      if (ring2.length < 3) continue;
      const area = Math.abs(areaOf(ring2));
      const per = ring2.reduce((s, p, i) => s + Math.hypot(ring2[(i + 1) % ring2.length][0] - p[0], ring2[(i + 1) % ring2.length][1] - p[1]), 0);
      // no slivers, no crumbs
      if (area < 220 || (2 * area) / per < 4.2) continue;
      // keep the solid on the left: test beside the longest edge
      let best = 0;
      let len = 0;
      for (let i = 0; i < ring2.length; i++) {
        const a = ring2[i];
        const b = ring2[(i + 1) % ring2.length];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (l > len) {
          len = l;
          best = i;
        }
      }
      const a = ring2[best];
      const b = ring2[(best + 1) % ring2.length];
      const left: P2 = [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / len) * 0.6, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / len) * 0.6];
      if (exact(k, left) < 0) ring2 = ring2.reverse();
      loops.push(ring2);
    }
    return { k, h0: L[k], h1: L[k + 1], ring, loops };
  });
  // the first wafer standing on the band, and the last inside it
  const band = Math.max(0, wafers.findIndex((w) => w.h0 >= BAND_TOP) - 1);
  const s: Stack = { side, wafers, grooves, band };
  stackMemo.set(side, s);
  return s;
}

/** The zero lines of a grid field (marching squares, crossings interpolated
    along each cell edge), chained into closed loops in plan. */
function contours(phi: Float32Array, rows: number, cols: number, x0: number, y0: number): P2[][] {
  const v = (i: number, j: number) => (i >= 0 && j >= 0 && i < rows && j < cols ? phi[i * cols + j] : -1);
  const next = new Map<string, string>();
  const key = (r: number, c: number) => `${r},${c}`;
  for (let i = -1; i < rows; i++) {
    for (let j = -1; j < cols; j++) {
      const a = v(i, j) > 0;
      const b = v(i, j + 1) > 0;
      const c = v(i + 1, j + 1) > 0;
      const d = v(i + 1, j) > 0;
      const T = key(2 * i, 2 * j + 1);
      const R = key(2 * i + 1, 2 * j + 2);
      const B = key(2 * i + 2, 2 * j + 1);
      const L = key(2 * i + 1, 2 * j);
      const code = (a ? 8 : 0) | (b ? 4 : 0) | (c ? 2 : 0) | (d ? 1 : 0);
      const add = (p: string, q: string) => next.set(p, q);
      const centre = (v(i, j) + v(i, j + 1) + v(i + 1, j + 1) + v(i + 1, j)) / 4 > 0;
      switch (code) {
        case 1: add(B, L); break;
        case 2: add(R, B); break;
        case 3: add(R, L); break;
        case 4: add(T, R); break;
        case 5: if (centre) { add(T, R); add(B, L); } else { add(T, L); add(B, R); } break;
        case 6: add(T, B); break;
        case 7: add(T, L); break;
        case 8: add(L, T); break;
        case 9: add(B, T); break;
        case 10: if (centre) { add(L, T); add(R, B); } else { add(L, B); add(R, T); } break;
        case 11: add(R, T); break;
        case 12: add(L, R); break;
        case 13: add(B, R); break;
        case 14: add(L, B); break;
      }
    }
  }
  const place = (k: string): P2 => {
    const [r, c] = k.split(",").map(Number);
    if (r % 2 === 0) {
      const i = r / 2;
      const ja = (c - 1) / 2;
      const pa = v(i, ja);
      const pb = v(i, ja + 1);
      const t = Math.max(0, Math.min(1, pa / (pa - pb || 1e-9)));
      return [x0 + (ja + t) * STEP, y0 + i * STEP];
    }
    const j = c / 2;
    const ia = (r - 1) / 2;
    const pa = v(ia, j);
    const pb = v(ia + 1, j);
    const t = Math.max(0, Math.min(1, pa / (pa - pb || 1e-9)));
    return [x0 + j * STEP, y0 + (ia + t) * STEP];
  };
  const out: P2[][] = [];
  const seen = new Set<string>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const ring: P2[] = [];
    let cur = start;
    for (let guard = 0; guard < 200000 && !seen.has(cur); guard++) {
      seen.add(cur);
      ring.push(place(cur));
      const n = next.get(cur);
      if (!n) break;
      cur = n;
    }
    if (ring.length >= 4) out.push(ring);
  }
  return out;
}

// ─── the circuit, in plan and height (view free) ────────────────────────────

/** Gold laid on the stack: runs on a wafer's top, plumb pieces on a wafer's
    wall, vias. All in plan points and heights. */
interface Circuit {
  tops: Map<number, { pts: P2[]; w: number }[]>;
  walls: Map<number, { q: P2; z0: number; z1: number; w: number; via: boolean }[]>;
  vias: Map<number, P2[]>;
  /** Where the plumb runs reach the band: tendrils leave under them. */
  feet: { p: P2; trunk: boolean }[];
  node: { cl: number; cf: number; half: number; k: number } | null;
}

const push = <T>(m: Map<number, T[]>, k: number, v: T) => {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
};

/** Whether p stands in a wafer's solid. */
const solidAt = (w: Wafer, p: P2) => w.loops.reduce((hit, ring) => (inside(p, ring) ? !hit : hit), false);

function surfaceAt(s: Stack, p: P2): number {
  for (let k = s.wafers.length - 1; k > s.band; k--) if (solidAt(s.wafers[k], p)) return k;
  return -1;
}

/** The wall of wafer k nearest p: its point and outward normal. */
function wallAt(s: Stack, k: number, p: P2) {
  let best: { q: P2; n: P2; d: number } | null = null;
  for (const ring of s.wafers[k].loops) {
    const e = nearestEdge(p, ring);
    if (!best || e.d < best.d) best = e;
  }
  return best!;
}

const dirOf = (a: P2, b: P2): P2 => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};

const NODE_SIDE: Side = 1;
/** Where the node would like to stand (lat, f), on the right crown. */
const NODE_AT: [number, number] = [32, 22];

const circuitMemo = new Map<Side, Circuit>();

function circuitOf(side: Side): Circuit {
  const known = circuitMemo.get(side);
  if (known) return known;
  const s = stackOf(side);
  const W_ = s.wafers;
  const c: Circuit = { tops: new Map(), walls: new Map(), vias: new Map(), feet: [], node: null };

  // the node: on the highest gyrus near NODE_AT, clear of the grooves
  if (side === NODE_SIDE) {
    const want = toPlan(side, NODE_AT);
    let best: { cl: number; cf: number; half: number; k: number; score: number } | null = null;
    for (let dl = -30; dl <= 30; dl += 1.5) {
      for (let df = -30; df <= 30; df += 1.5) {
        const p: P2 = [want[0] + dl, want[1] + df];
        const k = surfaceAt(s, p);
        if (k < W_.length - 3) continue;
        const clear = Math.min(...s.grooves.map((g) => polyDist(p, g.pts))) - HALF_A;
        for (let half = 10; half >= 6; half -= 0.5) {
          const corners: P2[] = [-1, 1].flatMap((a) => [-1, 1].map((b) => [p[0] + a * (half + 3), p[1] + b * (half + 3)] as P2));
          if (clear < half * 1.1 || !corners.every((q) => surfaceAt(s, q) === k)) continue;
          const score = k * 4 + half * 3 - Math.hypot(dl, df) * 0.12;
          if (!best || score > best.score) best = { cl: p[0], cf: p[1], half, k, score };
          break;
        }
      }
    }
    if (best) c.node = { cl: best.cl, cf: best.cf, half: best.half, k: best.k };
  }
  /** The point of a wafer's edge nearest p on a wall that does not face
      the front (clear of the wall's corners), within `reach`. */
  const sideWall = (j: number, p: P2, reach: number): { q: P2; n: P2 } | null => {
    let best: { q: P2; n: P2; d: number } | null = null;
    for (const ring of W_[j].loops) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 5) continue;
        const n: P2 = [(b[1] - a[1]) / len, -(b[0] - a[0]) / len];
        if (n[1] > FRONT) continue;
        const t = Math.max(2 / len, Math.min(1 - 2 / len, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (len * len)));
        const q: P2 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (d < reach && (!best || d < best.d)) best = { q, n, d };
      }
    }
    return best;
  };
  /** A routed jog on a top, level then 45°. */
  const jog = (a: P2, b: P2): P2[] => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const m = Math.min(Math.abs(dx), Math.abs(dy));
    const corner: P2 = Math.abs(dx) > Math.abs(dy) ? [b[0] - Math.sign(dx) * m, a[1]] : [a[0], b[1] - Math.sign(dy) * m];
    return [a, corner, b];
  };
  /** A plumb run down the walls from (q, wafer k) to the band, a via at each
      wafer edge. Where the wall under it faces the front it steps sideways
      along the tread to the nearest wall that does not, or stops. */
  const descend = (q: P2, k: number, w: number, trunk: boolean) => {
    let prev = q;
    for (let j = k; j > s.band; j--) {
      let e: { q: P2; n: P2 } | null = j === k ? { q, n: wallAt(s, j, q).n } : nearestEdge(prev, W_[j].ring);
      if (e.n[1] > FRONT) e = sideWall(j, prev, 14);
      if (!e) return;
      if (j < k || Math.hypot(e.q[0] - q[0], e.q[1] - q[1]) > 0.5) push(c.tops, j, { pts: jog(prev, e.q), w });
      push(c.walls, j, { q: e.q, z0: W_[j].h0, z1: W_[j].h1, w, via: true });
      prev = e.q;
    }
    c.feet.push({ p: prev, trunk });
  };

  /** A trace laid over the stack along a plan polyline: on the top it
      crosses, plumb down (or up) each riser, and down the walls past the
      stack's edge. Stops at a front-facing step. */
  const drape = (pts: readonly P2[], w: number, { trunk = false, endVia = true, descendEnds = true, flank = 0, minLen = 10 }: { trunk?: boolean; endVia?: boolean; descendEnds?: boolean; flank?: number; minLen?: number } = {}) => {
    const sm = resample(pts, 0.6);
    const ks = sm.map((p) => surfaceAt(s, p));
    const i0 = ks.findIndex((k) => k >= 0);
    if (i0 < 0) return;
    const pieces: { k: number; pts: P2[] }[] = [];
    const risers: { q: P2; lo: number; hi: number }[] = [];
    let run: P2[] = [sm[i0]];
    let k = ks[i0];
    let exit: { q: P2; k: number; d: P2 } | null = null;
    let stopped = false;
    // entering from outside: its foot on the wall
    const entry = i0 > 0 ? { q: wallAt(s, k, sm[i0]).q, k, d: dirOf(sm[i0], sm[i0 - 1]) } : null;
    if (entry) run = [entry.q, sm[i0]];
    for (let i = i0 + 1; i < sm.length; i++) {
      const kk = ks[i];
      if (kk === k) {
        run.push(sm[i]);
        continue;
      }
      if (kk < 0) {
        const e = wallAt(s, k, sm[i - 1]);
        run.push(e.q);
        exit = { q: e.q, k, d: dirOf(sm[i - 1], sm[i]) };
        break;
      }
      const hi = Math.max(k, kk);
      const e = wallAt(s, hi, [(sm[i - 1][0] + sm[i][0]) / 2, (sm[i - 1][1] + sm[i][1]) / 2]);
      // never gold on a wall that faces the front: at the brain's outside
      // the trace goes down the nearest side wall instead, inside it stops
      if (e.n[1] > FRONT) {
        if (kk < k && nearestEdge(e.q, W_[k].ring).d < 1.5) {
          run.push(e.q);
          exit = { q: e.q, k, d: dirOf(sm[i - 1], sm[i]) };
        } else stopped = true;
        break;
      }
      run.push(e.q);
      pieces.push({ k, pts: run });
      risers.push({ q: e.q, lo: Math.min(k, kk), hi });
      run = [e.q, sm[i]];
      k = kk;
    }
    pieces.push({ k, pts: run });
    // no isolated dashes: a trace never ends on a stub past a step
    const lenOf = (pc: { pts: P2[] }) => pc.pts.reduce((t, p, i) => t + (i ? Math.hypot(p[0] - pc.pts[i - 1][0], p[1] - pc.pts[i - 1][1]) : 0), 0);
    if (!exit && pieces.length > 1 && lenOf(pieces[pieces.length - 1]) < 3) {
      pieces.pop();
      risers.pop();
    }
    if (!entry && pieces.length > 1 && lenOf(pieces[0]) < 3) {
      pieces.shift();
      risers.shift();
    }
    const total = pieces.reduce((sum, pc) => sum + lenOf(pc), 0);
    if (total < minLen) return;
    for (const pc of pieces) push(c.tops, pc.k, { pts: pc.pts, w });
    for (const r of risers) for (let j = r.lo + 1; j <= r.hi; j++) push(c.walls, j, { q: r.q, z0: W_[j].h0, z1: W_[j].h1, w, via: false });
    const last = pieces[pieces.length - 1];
    if (stopped || (!exit && endVia)) push(c.vias, last.k, last.pts[last.pts.length - 1]);
    // past the edge: down the wall, the bus flanked by fine traces
    for (const end of [exit, entry]) {
      if (!descendEnds || !end) continue;
      descend(end.q, end.k, w, trunk);
      for (const o of flank ? [-flank, flank] : []) {
        const q: P2 = [end.q[0] - end.d[1] * o, end.q[1] + end.d[0] * o];
        descend(wallAt(s, end.k, q).q, end.k, 0.75, false);
      }
    }
    if (!entry && endVia) push(c.vias, pieces[0].k, pieces[0].pts[0]);
  };

  for (const g of s.grooves) {
    // the bus on the groove's floor
    drape(g.pts, g.trunk ? 1.5 : 0.95, { trunk: g.trunk, flank: g.trunk ? 3.2 : 2.6 });
    // a fine trace along each lip, on the gyrus, where no other groove or
    // the node is near
    for (const off of [-(HALF_A + LIP), HALF_A + LIP]) {
      const line = resample(offsetLine(g.pts, off), 0.6);
      const ok = line.map((p) => {
        if (c.node && Math.max(Math.abs(p[0] - c.node.cl), Math.abs(p[1] - c.node.cf)) < c.node.half + 4) return false;
        if (s.grooves.some((o) => o !== g && polyDist(p, o.pts) < HALF_A + LIP + 0.5)) return false;
        const k = surfaceAt(s, p);
        return k >= 0 && W_[k].h0 >= CUT_Z;
      });
      let from = -1;
      for (let i = 0; i <= line.length; i++) {
        if (i < line.length && ok[i]) {
          if (from < 0) from = i;
        } else if (from >= 0) {
          if (i - from > 24) drape(line.slice(from, i), 0.7, { descendEnds: false, minLen: 22 });
          from = -1;
        }
      }
    }
  }
  // the node's fan-out: down into the grooves either side, onto the buses
  if (c.node) {
    const { cl, cf, half } = c.node;
    const dirs: P2[] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const hits = dirs
      .map((d) => {
        for (let t = half; t < 40; t += 0.5) {
          const p: P2 = [cl + d[0] * t, cf + d[1] * t];
          const g = s.grooves.find((o) => polyDist(p, o.pts) < 0.4);
          if (g) return { d, t, g };
        }
        return null;
      })
      .filter((h): h is NonNullable<typeof h> => h !== null)
      .sort((a, b) => a.t - b.t);
    const used: P2[] = [];
    for (const h of hits) {
      if (used.some((u) => u[0] * h.d[0] + u[1] * h.d[1] > 0.2) || used.length >= 3) continue;
      used.push(h.d);
      const p: P2 = [-h.d[1], h.d[0]];
      const nLines = 4;
      for (let j = 0; j < nLines; j++) {
        const o = (j - (nLines - 1) / 2) * 2.4;
        const start: P2 = [cl + h.d[0] * (half + 0.3) + p[0] * o, cf + h.d[1] * (half + 0.3) + p[1] * o];
        let end = start;
        for (let t = 0; t < 50; t += 0.25) {
          const q: P2 = [start[0] + h.d[0] * t, start[1] + h.d[1] * t];
          end = q;
          if (polyDist(q, h.g.pts) < 0.3) break;
        }
        drape([start, end], 0.75, { endVia: true, descendEnds: false, minLen: 0 });
      }
    }
  }
  circuitMemo.set(side, c);
  return c;
}

// ─── the band and the tendrils (view free) ──────────────────────────────────

const bandMemo = new Map<Side, BandSpec>();

/** One hemisphere's collar: the section of the first wafer standing on it,
    set out a little so the brain stands in it, routed into facets. (A bridge
    across the fissure was tried: seen face on it read as two loose boxes.) */
function bandOf(side: Side): BandSpec {
  const known = bandMemo.get(side);
  if (known) return known;
  const s = stackOf(side);
  const above = s.wafers[s.band + 1];
  const z1 = above.h0;
  const z0 = z1 - BAND_H;
  const base = above.ring;
  const fs = base.map((p) => p[1]);
  const field = (p: P2) => Math.min(sdRing(p, base) + 2.5, side * p[0]);
  const x0 = Math.min(0, ...base.map((p) => p[0])) - 8;
  const x1 = Math.max(0, ...base.map((p) => p[0])) + 8;
  const y0 = Math.min(...fs) - 8;
  const cols = Math.ceil((x1 - x0) / STEP) + 1;
  const rows = Math.ceil((Math.max(...fs) + 8 - y0) / STEP) + 1;
  const phi = new Float32Array(rows * cols);
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) phi[i * cols + j] = field([x0 + j * STEP, y0 + i * STEP]);
  const loops = contours(phi, rows, cols, x0, y0).sort((a, b) => Math.abs(areaOf(b)) - Math.abs(areaOf(a)));
  let ring = routedOutline(loops[0], 1.2) as P2[];
  if (areaOf(ring) < 0) ring = ring.reverse();
  // seams: at a corner every so often
  const seams: number[] = [];
  let run = 0;
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length];
    if (Math.abs(p[0]) < 0.6) seams.push(i);
    else if (run > 58) {
      seams.push(i);
      run = 0;
    }
    run += Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const spec: BandSpec = { ring, z0, z1, chamfer: 2.2, seams };
  bandMemo.set(side, spec);
  return spec;
}

const tendrilMemo = new Map<Side, Tendril[]>();

/** The bundles leaving one hemisphere from under its band. Each is placed by
    an angle round the hemisphere (0 lateral, π/2 the front, −π/2 the back),
    how far out it swings and sideways, and how far it falls; it leaves
    level from under the band, arcs out and settles into a near-plumb fall.
    The gold ones leave under the trunk buses' plumb runs. */
function tendrilsOf(side: Side): Tendril[] {
  const known = tendrilMemo.get(side);
  if (known) return known;
  const spec = bandOf(side);
  const ring = spec.ring;
  const fs = ring.map((p) => p[1]);
  const cf = (Math.min(...fs) + Math.max(...fs)) / 2;
  const cl = side * 72;
  const z = spec.z0;
  const w3 = (l: number, f: number, zz: number): V3 => [f, -l, zz];
  /** The point under the band at angle a, set in from its edge, and the
      band's outward direction there. */
  const under = (a: number, inset: number): { p: P2; out: P2 } => {
    const u: P2 = [side * Math.cos(a), Math.sin(a)];
    let r = 0;
    for (let e = 0; e < ring.length; e++) {
      const p = ring[e];
      const q = ring[(e + 1) % ring.length];
      const ex = q[0] - p[0];
      const ey = q[1] - p[1];
      const den = u[0] * ey - u[1] * ex;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((p[0] - cl) * ey - (p[1] - cf) * ex) / den;
      const k = ((p[0] - cl) * u[1] - (p[1] - cf) * u[0]) / den;
      if (t > 0 && k >= 0 && k <= 1) r = Math.max(r, t);
    }
    return { p: [cl + u[0] * (r - inset), cf + u[1] * (r - inset)], out: u };
  };
  /** A bundle leaving at angle a, ending (dl, df) from where it leaves and
      `depth` below the band: level out from under the band, a long arc,
      then a near-plumb fall. A gold one leaves under the nearest trunk
      bus's plumb run. */
  const fall = (a: number, [dl, df]: [number, number], depth: number, opts: Partial<Tendril>): Tendril => {
    let at = a;
    if (opts.gold !== undefined) {
      const feet = circuitOf(side).feet.filter((f) => f.trunk).map((f) => Math.atan2(f.p[1] - cf, side * (f.p[0] - cl)));
      const near = feet.filter((x) => Math.abs(x - a) < 0.45);
      if (near.length) at = near.reduce((best, x) => (Math.abs(x - a) < Math.abs(best - a) ? x : best), near[0]);
    }
    const { p, out } = under(at, 6);
    const end: P2 = [p[0] + side * dl, p[1] + df];
    const route = bezier3(w3(p[0], p[1], z), w3(p[0] + out[0] * 22, p[1] + out[1] * 22, z - 2), w3(end[0], end[1], z - depth * 0.42), w3(end[0], end[1], z - depth), 80);
    return { route, lines: 4, pitch: 2.4, end: "fade", ...opts };
  };
  const loop = (a: number, b: number, sag: number, opts: Partial<Tendril>): Tendril => {
    const A = under(a, 6);
    const B = under(b, 6);
    const route = bezier3(w3(A.p[0], A.p[1], z), w3(A.p[0] + A.out[0] * 34, A.p[1] + A.out[1] * 34, z - sag), w3(B.p[0] + B.out[0] * 34, B.p[1] + B.out[1] * 34, z - sag), w3(B.p[0], B.p[1], z), 90);
    return { route, lines: 3, pitch: 2.4, end: "none", ...opts };
  };
  // dl is outward (lateral) positive on either side
  const list: Tendril[] =
    side > 0
      ? [
          fall(0.5, [20, 44], 160, { lines: 5, gold: 2, end: "terminal" }),
          fall(1.55, [-95, 40], 128, { lines: 3 }),
          fall(-0.4, [60, -10], 196, { lines: 4 }),
        ]
      : [
          fall(-0.55, [44, -12], 182, { lines: 4 }),
          fall(0.2, [34, 22], 150, { lines: 5, gold: 1, end: "terminal" }),
          fall(1.55, [-95, 30], 136, { lines: 4, end: "terminal" }),
          loop(0.5, 0.88, 70, { lines: 3 }),
        ];
  tendrilMemo.set(side, list);
  return list;
}

// ─── painting ───────────────────────────────────────────────────────────────

const goldPath = (d: string, w: number, pal: Palette) => (d ? `<path fill="none" stroke="${pal.gold}" stroke-width="${w}" stroke-linecap="square" stroke-linejoin="miter" d="${d}"/>` : "");
const viaSvg = (pts: [number, number][], pal: Palette, r = 0.7) => pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${pal.gold}" stroke="${pal.ground}" stroke-width=".3"/>`).join("");

function hemisphereSvg(side: Side, P: Projection, pal: Palette): string {
  const s = stackOf(side);
  const c = circuitOf(side);
  const out: string[] = [];
  // the tendrils first: they leave from under the band
  tendrilsOf(side).forEach((t, i) => out.push(tendrilSvg(t, P, pal, `wc${side > 0 ? "r" : "l"}${i}`)));
  // the band, the lens port on the left's
  const spec = bandOf(side);
  let lensDone = side > 0;
  out.push(
    bandSvg(spec, P, pal, ({ a, b, n }) => {
      if (lensDone) return "";
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      // on a facet facing out to the front left
      if (len < 16 || n[0] > -0.5 || n[1] < 0.5) return "";
      lensDone = true;
      const t: P2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
      return lensSvg([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], t, n, (spec.z0 + spec.z1 - spec.chamfer) / 2, 3.2, P, pal);
    })
  );
  // the wafers standing in it; the walls of a groove are edged in gold
  const nearGroove = (p: P2) => Math.min(...s.grooves.map((g) => polyDist(p, g.pts)));
  for (const w of s.wafers) {
    if (w.k <= s.band) continue;
    const cut = w.h0 >= CUT_Z;
    const gild = cut
      ? (a: P2, b: P2, n: P2): 0 | 1 | 2 => {
          const m: P2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
          if (nearGroove(m) > HALF_A + 0.6) return 0;
          // never gold on a wall facing the front
          return n[1] > FRONT ? 1 : 2;
        }
      : undefined;
    const walls: Wall[] = w.loops.flatMap((ring) => wallsOf(ring, w.h0, w.h1, P, pal, { gap: GAP, band: BAND, gild }));
    for (const g of c.walls.get(w.k) ?? []) {
      let best: Wall | null = null;
      let bd = 1.2;
      for (const wl of walls) {
        const ex = wl.b[0] - wl.a[0];
        const ey = wl.b[1] - wl.a[1];
        const t = ((g.q[0] - wl.a[0]) * ex + (g.q[1] - wl.a[1]) * ey) / (ex * ex + ey * ey || 1);
        if (t < -0.02 || t > 1.02) continue;
        const d = Math.abs((g.q[0] - wl.a[0]) * ey - (g.q[1] - wl.a[1]) * ex) / Math.hypot(ex, ey);
        if (d < bd) {
          bd = d;
          best = wl;
        }
      }
      if (!best) continue;
      const q: P2 = [g.q[0] + best.n[0] * 0.05, g.q[1] + best.n[1] * 0.05];
      best.deco.push(goldPath(lineD([at(q, g.z1, P), at(q, g.z0 + GAP, P)]), g.w, pal) + (g.via ? viaSvg([at(q, g.z1, P)], pal) : ""));
    }
    walls.sort((a, b) => a.depth - b.depth);
    for (const wl of walls) out.push(wl.svg + wl.deco.join(""));
    out.push(`<path fill="${pal.top}" fill-rule="evenodd" stroke="${pal.edge}" stroke-width=".5" d="${w.loops.map((ring) => polyD(ring.map((p) => at(p, w.h1, P)))).join("")}"/>`);
    // the gold on this wafer's top, thick runs over fine
    const runs = (c.tops.get(w.k) ?? []).slice().sort((a, b) => a.w - b.w);
    for (const r of runs) out.push(goldPath(lineD(lean(r.pts.map((p) => at(p, w.h1, P)))), r.w, pal));
    const vias = c.vias.get(w.k);
    if (vias) out.push(viaSvg(vias.map((p) => at(p, w.h1, P)), pal, 0.8));
  }
  if (c.node) out.push(nodeSvg(c.node.cl, c.node.cf, s.wafers[c.node.k].h1, c.node.half, P));
  return `<g class="wc-hemi">${out.join("")}</g>`;
}

function wiredCortexSvg({ view, only, light, tones }: MindOptions): string {
  const P = projOf(view);
  const pal = paletteOf(light, tones);
  const sides = only ? [only] : sidesFarFirst(view);
  const body = sides.map((side) => hemisphereSvg(side, P, pal)).join("");
  return mindSvg({ view, light, tones, body, css: nodeCss(light, tones.gold, tones.lit, tones.ground), box: boxOf(view) });
}

/** The brain's own box, deepened for the tendrils. */
function boxOf(view: BrainView): BrainIsoBox {
  const P = projOf(view);
  const B = brainIsoBox(view);
  let { x0, x1, y0, y1 } = B;
  for (const side of [-1, 1] as Side[]) {
    for (const t of tendrilsOf(side)) {
      for (const p of t.route) {
        const [x, y] = iso(p as Point3, P);
        x0 = Math.min(x0, x - 12);
        x1 = Math.max(x1, x + 12);
        y0 = Math.min(y0, y - 12);
        y1 = Math.max(y1, y + 16);
      }
    }
  }
  return { x0, x1, y0, y1 };
}

export const wiredCortex: MindDirection = {
  id: "h1",
  round: 5,
  name: "Wired Cortex",
  line: "The folds cut into the wafer stack as routed grooves, the gold running every fold and down the walls into a machined band, the traces leaving under it as fine tendrils.",
  svg: (o) => wiredCortexSvg(o),
  box: (o) => boxOf(o.view),
};
