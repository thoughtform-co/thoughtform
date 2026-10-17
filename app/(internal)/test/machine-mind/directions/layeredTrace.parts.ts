import { hullPoint, lineD, polyD, T_UNIT, Z_CROWN, Z_FLOOR, type Hull, type HullShape, type Side, type UW } from "../hull";
import { HEMI } from "@/components/arcs/figures/foundation/brainIso";
import { LC, W } from "@/components/arcs/figures/foundation/brainIso";
import { iso, type Flat } from "@/components/arcs/figures/foundation/isoKit";
import { thin, type GridPoint } from "./traceCortex.parts";

/**
 * E1 · Layered Trace, its parts: the geometry the direction is drawn with
 * and nothing it decides. The layer levels (even in surface distance), a
 * layer's loop wrapped onto the hull, a router that runs a trace level,
 * plumb or 45° in (u, w) along the cheapest ground, and a package seated on
 * the crown.
 *
 * ⚠ PURE: strings and numbers.
 */

// ─── layers ─────────────────────────────────────────────────────────────────

export interface Level {
  /** The layer's parameter height (`w`). */
  z: number;
  /** Parameter height per unit of surface distance there, so a lip can sit
      a fixed surface distance off the line. */
  dz: number;
}

/** Layer levels `spacing` apart in surface distance up the lateral half of
    the hull (the meridians' mean), floor to `zTop`: param z runs level round
    the hull, but it opens into wide treads where the dome flattens, so the
    levels are spaced by slope, not by height. */
export function layerLevels(side: Side, shape: HullShape, spacing: number, zBottom = Z_FLOOR + 4, zTop = Z_CROWN - 12): Level[] {
  const ts = [-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.9, -1.9];
  const rate = (z: number) => {
    let sum = 0;
    for (const t of ts) {
      const a = hullPoint(side, t, z - 0.25, shape);
      const b = hullPoint(side, t, z + 0.25, shape);
      sum += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.5;
    }
    return sum / ts.length;
  };
  const out: Level[] = [];
  let s = 0;
  let next = spacing / 2;
  const step = 0.25;
  for (let z = zBottom; z <= zTop; z += step) {
    const r = rate(z);
    if (s >= next) {
      out.push({ z, dz: 1 / r });
      next += spacing;
    }
    s += r * step;
  }
  return out;
}

/** A layer's loop at parameter height `z` round the hull: the runs of it that
    are seen (and face the viewer by at least `facing`, so a line never runs
    edge-on into the limb), each sample with its light. `keep` may cut it
    (round a part on the crown). */
export function loopRuns(at: (u: number, w: number) => GridPoint, z: number, { facing = 0.08, keep, step = 2 }: { facing?: number; keep?: (u: number, w: number) => boolean; step?: number } = {}): { xy: Flat[]; lit: number[]; u: number[] }[] {
  const out: { xy: Flat[]; lit: number[]; u: number[] }[] = [];
  const N = Math.ceil((Math.PI * 2 * T_UNIT) / step);
  let run: { xy: Flat[]; lit: number[]; u: number[] } | null = null;
  // start where the loop is hidden, so no seen run is split at the seam
  let start = 0;
  for (let i = 0; i < N; i++) {
    const p = at((i * Math.PI * 2 * T_UNIT) / N, z);
    if (!p.seen || p.facing < facing) {
      start = i;
      break;
    }
  }
  for (let k = 0; k <= N; k++) {
    const u = ((start + k) * Math.PI * 2 * T_UNIT) / N;
    const p = at(u, z);
    const ok = p.seen && p.facing >= facing && (!keep || keep(u, z));
    if (ok) {
      if (!run) run = { xy: [], lit: [], u: [] };
      run.xy.push(p.xy);
      run.lit.push(p.lit);
      run.u.push(u);
    } else if (run) {
      if (run.xy.length > 1) out.push(run);
      run = null;
    }
  }
  if (run && run.xy.length > 1) out.push(run);
  return out;
}

/** A run drawn in tone tiers by its light: each tier's polylines. A sample
    whose tier is −1 is not drawn. */
export function tierLines(run: { xy: Flat[]; lit: number[] }, tierOf: (lit: number, i: number) => number, tiers: string[][], eps = 0.12) {
  let line: Flat[] = [];
  let tier = -1;
  const flush = () => {
    if (line.length > 1 && tier >= 0) tiers[tier].push(lineD(thin(line, eps)));
    line = [];
  };
  run.xy.forEach((xy, i) => {
    const t = tierOf(run.lit[i], i);
    if (t !== tier) {
      const join = line[line.length - 1];
      flush();
      if (join && t >= 0 && tier >= 0) line.push(join);
      tier = t;
    }
    line.push(xy);
  });
  flush();
}

// ─── the router ─────────────────────────────────────────────────────────────

/** The eight moves: level, plumb and the four 45° cuts. */
const MOVES: [number, number][] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

export interface Field {
  u0: number;
  w0: number;
  step: number;
  cols: number;
  rows: number;
  /** The cost of standing on a cell (≥ 1; Infinity is a wall). */
  cost: Float32Array;
}

/** A routing field over (u, w): `cost(u, w)` sampled on a grid. */
export function fieldOf(u0: number, u1: number, w0: number, w1: number, step: number, cost: (u: number, w: number) => number): Field {
  const cols = Math.floor((u1 - u0) / step) + 1;
  const rows = Math.floor((w1 - w0) / step) + 1;
  const c = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) c[r * cols + q] = cost(u0 + q * step, w0 + r * step);
  return { u0, w0, step, cols, rows, cost: c };
}

/** The cheapest route from `start` to any cell `goal` accepts, by A* over
    cells and headings: a move costs its length times the cells' cost, a turn
    `turn` per 45°, so routes run long and straight and bend at 45°; it never
    goes below `minW`. The route comes back as its corners, in (u, w). Null
    when none is found. */
export function route(F: Field, start: UW, goal: (u: number, w: number) => boolean, { turn = 3, heuristic, minW = -Infinity }: { turn?: number; heuristic?: (u: number, w: number) => number; minW?: number } = {}): UW[] | null {
  const { cols, rows, step } = F;
  const cell = (u: number, w: number) => [Math.round((u - F.u0) / step), Math.round((w - F.w0) / step)];
  const [sq, sr] = cell(start[0], start[1]);
  if (sq < 0 || sr < 0 || sq >= cols || sr >= rows) return null;
  const N = cols * rows * 8;
  const g = new Float32Array(N).fill(Infinity);
  const from = new Int32Array(N).fill(-1);
  const done = new Uint8Array(N);
  const heap: number[] = [];
  const key: number[] = [];
  const push = (s: number, f: number) => {
    heap.push(s);
    key.push(f);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (key[p] <= key[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      [key[p], key[i]] = [key[i], key[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const lastS = heap.pop()!;
    const lastK = key.pop()!;
    if (heap.length) {
      heap[0] = lastS;
      key[0] = lastK;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && key[l] < key[m]) m = l;
        if (r < heap.length && key[r] < key[m]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        [key[m], key[i]] = [key[i], key[m]];
        i = m;
      }
    }
    return top;
  };
  const h = (q: number, r: number) => (heuristic ? heuristic(F.u0 + q * step, F.w0 + r * step) : 0);
  for (let d = 0; d < 8; d++) {
    const s = (sr * cols + sq) * 8 + d;
    g[s] = 0;
    push(s, h(sq, sr));
  }
  while (heap.length) {
    const s = pop();
    if (done[s]) continue;
    done[s] = 1;
    const d = s % 8;
    const c = (s - d) / 8;
    const q = c % cols;
    const r = (c - q) / cols;
    if (goal(F.u0 + q * step, F.w0 + r * step)) {
      // walk back, keeping the corners
      const pts: UW[] = [];
      let cur = s;
      let lastD = -1;
      while (cur >= 0) {
        const cd = cur % 8;
        const cc = (cur - cd) / 8;
        const cq = cc % cols;
        const cr = (cc - cq) / cols;
        if (cd !== lastD || from[cur] < 0) pts.push([F.u0 + cq * step, F.w0 + cr * step]);
        lastD = cd;
        cur = from[cur];
      }
      const out = pts.reverse();
      // drop collinear repeats
      return out.filter((p, i) => i === 0 || i === out.length - 1 || !(p[0] === out[i - 1][0] && p[1] === out[i - 1][1]));
    }
    for (let nd = 0; nd < 8; nd++) {
      const diff = Math.min((nd - d + 8) % 8, (d - nd + 8) % 8);
      if (diff > 2) continue;
      const [dq, dr] = MOVES[nd];
      const nq = q + dq;
      const nr = r + dr;
      if (nq < 0 || nr < 0 || nq >= cols || nr >= rows) continue;
      if (F.w0 + nr * step < minW - 1e-6) continue;
      const cc = F.cost[nr * cols + nq];
      if (!Number.isFinite(cc)) continue;
      const len = dq && dr ? Math.SQRT2 : 1;
      const ns = (nr * cols + nq) * 8 + nd;
      const ng = g[s] + len * step * 0.5 * (cc + F.cost[r * cols + q]) + diff * turn;
      if (ng < g[ns]) {
        g[ns] = ng;
        from[ns] = s;
        push(ns, ng + h(nq, nr));
      }
    }
  }
  return null;
}

// ─── the crown's frame ──────────────────────────────────────────────────────

/** The crown's own frame on a brain hull: a, lateral from the hemisphere's
    centre line LC; f, toward the front. The point of the hull over (a, f),
    as (t, z), by Newton's method on the hull itself, from the dome's
    equator up (D1's version stops at z 60, too high for a brain's flatter
    crown). Null when it does not converge. */
export function crownAt(side: Side, a: number, f: number, shape: HullShape): [number, number] | null {
  const ax = a >= 0 ? HEMI.a : HEMI.a * HEMI.medial;
  const r = Math.min(0.95, Math.hypot(a / ax, f / HEMI.b));
  let t = Math.atan2(f / HEMI.b, a / ax);
  let z = HEMI.up * Math.max(0, 1 - r * r) ** (1 / 2.3);
  const at = (tt: number, zz: number) => {
    const p = hullPoint(side, tt, Math.min(HEMI.up - 1e-3, zz), shape);
    return [side * p[0] - LC, p[1]];
  };
  for (let i = 0; i < 24; i++) {
    const [pa, pf] = at(t, z);
    const ea = pa - a;
    const ef = pf - f;
    if (Math.abs(ea) + Math.abs(ef) < 1e-3) return [t, z];
    const [ta, tf] = at(t + 1e-4, z);
    const [za, zf] = at(t, z - 1e-2);
    const j11 = (ta - pa) / 1e-4;
    const j21 = (tf - pf) / 1e-4;
    const j12 = (za - pa) / -1e-2;
    const j22 = (zf - pf) / -1e-2;
    const det = j11 * j22 - j12 * j21;
    if (Math.abs(det) < 1e-9) break;
    const dt = (j22 * ea - j12 * ef) / det;
    const dz = (-j21 * ea + j11 * ef) / det;
    // damped, so a step never leaps across the dome
    const k = Math.min(1, 0.4 / Math.max(1e-9, Math.abs(dt)), 20 / Math.max(1e-9, Math.abs(dz)));
    t -= dt * k;
    z = Math.min(HEMI.up - 1e-3, Math.max(0, z - dz * k));
  }
  const [pa, pf] = at(t, z);
  return Math.abs(pa - a) + Math.abs(pf - f) < 0.05 ? [t, z] : null;
}

/** A polyline in the crown's frame laid on the hull, as screen points
    (a point that does not solve is skipped). */
export function crownLine(h: Hull, pts: readonly [number, number][], step = 1): Flat[] {
  const out: Flat[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a0, f0] = pts[i];
    const [a1, f1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(a1 - a0, f1 - f0) / step));
    for (let k = i ? 1 : 0; k <= n; k++) {
      const tz = crownAt(h.side, a0 + ((a1 - a0) * k) / n, f0 + ((f1 - f0) * k) / n, h.shape);
      if (tz) out.push(h.at(tz[0], tz[1]).xy);
    }
  }
  return out;
}

/** A round pad in the crown's frame; null if any point of it does not
    solve. */
export function crownPad(h: Hull, a: number, f: number, r: number, n = 12): Flat[] | null {
  const out: Flat[] = [];
  for (let i = 0; i < n; i++) {
    const tz = crownAt(h.side, a + r * Math.cos((i / n) * Math.PI * 2), f + r * Math.sin((i / n) * Math.PI * 2), h.shape);
    if (!tz) return null;
    out.push(h.at(tz[0], tz[1]).xy);
  }
  return out;
}

// ─── a package on the crown ─────────────────────────────────────────────────

/** A package in the crown's frame: its centre and half-width, its pins (per
    side, pitch) and their fan-out (splayed to `spread`, ending on vias at
    two staggered distances from the body). */
export interface Package {
  a: number;
  f: number;
  half: number;
  pins: number;
  pitch: number;
  spread: number;
  fan: [number, number];
}

export interface Body {
  top: string;
  walls: [string, string];
  edge: string;
}

/** A package on the crown: its fan-out on the surface (each pin's trace
    splays to `spread` and ends on a via, the vias in two staggered rows),
    then the body, a block whose flat top stands clear of the crown and
    whose walls run down to it, gull-wing pins along all four walls and the
    house's one notch cut from the top's far corner. Heights are the hull's
    own (on a brain hull the parameter height is not the height). */
export function packageSvg(h: Hull, p: Package, body: Body, { trace, via, drill, pin }: { trace: string; via: string; drill: string; pin: string }): string {
  const { a: A, f: F, half: D, pins: N, pitch, spread, fan } = p;
  const zOf = (a: number, f: number) => {
    const tz = crownAt(h.side, a, f, h.shape) ?? crownAt(h.side, A, F, h.shape) ?? [0, HEMI.up];
    return hullPoint(h.side, tz[0], tz[1], h.shape)[2];
  };
  const P3 = (a: number, f: number, z: number) => iso(W(h.side * (LC + a), f, z), h.P);
  const sides = [
    { da: 1, df: 0 },
    { da: -1, df: 0 },
    { da: 0, df: 1 },
    { da: 0, df: -1 },
  ];
  const local = (s: { da: number; df: number }, out: number, along: number): [number, number] => [A + s.da * out - s.df * along, F + s.df * out + s.da * along];
  const traces: string[] = [];
  const pads: string[] = [];
  const drills: string[] = [];
  for (const s of sides) {
    for (let i = 0; i < N; i++) {
      const p0 = (i - (N - 1) / 2) * pitch;
      const p1 = (i - (N - 1) / 2) * spread;
      const bend = D + 4.6;
      const end = D + fan[i % 2];
      traces.push(lineD(thin(crownLine(h, [local(s, D + 3.4, p0), local(s, bend, p0), local(s, bend + Math.abs(p1 - p0), p1), local(s, end, p1)], 0.8), 0.08)));
      const [va, vf] = local(s, end + 1.1, p1);
      const pad = crownPad(h, va, vf, 1.25);
      if (!pad) continue;
      pads.push(polyD(pad));
      drills.push(polyD(crownPad(h, va, vf, 0.45, 8) ?? []));
    }
  }
  const surface = `<path class="e1-trace" stroke="${trace}" d="${traces.join("")}"/><path fill="${via}" d="${pads.join("")}"/><path fill="${drill}" d="${drills.join("")}"/>`;

  const top = Math.max(zOf(A - D, F - D), zOf(A + D, F - D), zOf(A + D, F + D), zOf(A - D, F + D), zOf(A, F)) + 3.2;
  const walls: string[] = [];
  const pinsFar: string[] = [];
  const pinsNear: string[] = [];
  for (const s of sides) {
    const nw = W(h.side * s.da, s.df, 0);
    const facing = nw[0] * h.toward[0] + nw[1] * h.toward[1] > 0;
    if (facing) {
      const edge = Array.from({ length: 9 }, (_, i) => local(s, D, -D + (2 * D * i) / 8));
      const lit = nw[0] * h.light[0] + nw[1] * h.light[1] > 0;
      const ring = [...edge.map(([a, f]) => P3(a, f, top)), ...edge.reverse().map(([a, f]) => P3(a, f, zOf(a, f)))];
      walls.push(`<path fill="${body.walls[lit ? 0 : 1]}" stroke="${body.edge}" stroke-width=".45" stroke-linejoin="round" d="${polyD(ring)}"/>`);
    }
    const legs: string[] = [];
    for (let i = 0; i < N; i++) {
      const along = (i - (N - 1) / 2) * pitch;
      const [a0, f0] = local(s, D, along);
      const [a1, f1] = local(s, D + 1.2, along);
      const [a2, f2] = local(s, D + 2.2, along);
      const [a3, f3] = local(s, D + 3.4, along);
      legs.push(lineD([P3(a0, f0, top - 1.6), P3(a1, f1, top - 1.6), P3(a2, f2, zOf(a2, f2) + 0.3), P3(a3, f3, zOf(a3, f3) + 0.2)]));
    }
    (facing ? pinsNear : pinsFar).push(legs.join(""));
  }
  const notch = Math.max(2.5, D * 0.4);
  const ring: [number, number][] = [
    [A - D, F - D],
    [A + D - notch, F - D],
    [A + D, F - D + notch],
    [A + D, F + D],
    [A - D, F + D],
  ];
  const face = ring.map(([a, f]) => P3(a, f, top));
  const lid = ring.map(([a, f]): Flat => P3(A + (a - A) * 0.72, F + (f - F) * 0.72, top));
  const pinStyle = `fill="none" stroke="${pin}" stroke-width=".6" stroke-linecap="butt"`;
  return `${surface}<path ${pinStyle} d="${pinsFar.join("")}"/>${walls.join("")}<path fill="${body.top}" stroke="${body.edge}" stroke-width=".6" stroke-linejoin="round" d="${polyD(face)}"/><path fill="none" stroke="${body.edge}" stroke-width=".35" stroke-opacity=".55" d="${polyD(lid)}"/><path ${pinStyle} d="${pinsNear.join("")}"/>`;
}
