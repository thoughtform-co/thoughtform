/**
 * The machine mind (ADR-156 U6, U7): a brain, modelled, then dressed as a
 * circuit board and lit as the house's hologram.
 *
 * U6 built it from two ellipsoids and read as "two zeppelins" (owner,
 * 2026-10-15). U7 models what a brain looks like first, the anatomy method's
 * true geometry, as ONE solid: a signed-distance composite (the cerebrum, its
 * fissure cut along the crown, the two temporal lobes, the cerebellum),
 * cast onto a geodesic sphere from inside so the low poly follows the brain's
 * own outline. Then the outside is a board: traces routed along the facets,
 * vias at their ends, cores ringed like the reference's, ticks off the skin;
 * and, as the homepage's hologram is, orbit rings around it, shaded by depth,
 * a node drifting on each. It holds ONE pose per beat, never turning (owner:
 * "I don't want it to rotate. It needs to be an elegant artifact").
 *
 *   cerebrum            the geodesic shell, 642 corners, the fissure in it
 *   traces              runs along the facets, the way a board routes
 *   vias                a pad at every trace's two ends
 *   cores               ringed nodes seated on the skin
 *   ticks               short spikes off the skin, the reference's red
 *   orbits              two rings round it, one dashed
 *   stem and collars    the brainstem, a column of rings
 *   port and sockets    the plate under the stem; every tendril leaves here
 *
 * Local frame: +x to the front, +y the left, +z up. One CAMERA projects it
 * (yaw `psi`, pitch `phi`, orthographic); at psi 45 degrees and phi
 * asin(1/sqrt 3) it is exactly the scene's isometric.
 *
 * ⚠ PURE: the act paints; this decides.
 */

import type { P2, V3 } from "./scene";

export interface Camera {
  psi: number;
  phi: number;
  /** Pixels per world unit along a screen axis. */
  s: number;
  /** Where the local origin lands, in the viewBox. */
  o: P2;
}

export const ISO_PSI = Math.PI / 4;
export const ISO_PHI = Math.asin(1 / Math.sqrt(3));
/** The scene's U (34) as a camera scale: the isometric foreshortens by sqrt(2/3). */
export const ISO_S = 34 * Math.sqrt(1.5);

export interface Basis {
  ex: P2;
  ey: P2;
  ez: P2;
  /** Toward the viewer, in local space: a face whose normal agrees is lit. */
  view: V3;
}

export function basisOf(c: Camera): Basis {
  const cp = Math.cos(c.psi);
  const sp = Math.sin(c.psi);
  const cf = Math.cos(c.phi);
  const sf = Math.sin(c.phi);
  return {
    ex: { x: cp * c.s, y: sp * sf * c.s },
    ey: { x: -sp * c.s, y: cp * sf * c.s },
    ez: { x: 0, y: -cf * c.s },
    view: { x: sp * cf, y: cp * cf, z: sf },
  };
}

export function projB(p: V3, b: Basis, o: P2): P2 {
  return {
    x: o.x + p.x * b.ex.x + p.y * b.ey.x + p.z * b.ez.x,
    y: o.y + p.x * b.ex.y + p.y * b.ey.y + p.z * b.ez.y,
  };
}

/** Edge kinds, for the paint. */
export const EDGE = { shell: 0, stem: 1, port: 2 } as const;

export interface MindEdge {
  a: number;
  b: number;
  kind: number;
  /** The mean of the faces it bounds (shell), or its own outward (parts). */
  n: V3;
}

export interface MindDot {
  p: V3;
  n: V3;
  /** On a seam (wireframe first, as the homepage's artifact samples). */
  seam: boolean;
  /** Its scatter, in screen pixels, before the mind assembles. */
  dx: number;
  dy: number;
  delay: number;
}

export interface MindModel {
  verts: V3[];
  edges: MindEdge[];
  dots: MindDot[];
  /** Board runs over the skin: vertex paths, lifted a hair off it. */
  traces: V3[][];
  /** A pad at each run's ends: a point and its normal. */
  vias: { p: V3; n: V3 }[];
  /** Ringed cores on the skin. */
  cores: { p: V3; n: V3; r: number }[];
  /** Spikes off the skin. */
  ticks: { p: V3; n: V3 }[];
  /** The hologram's rings: radius, tilt about x then z, dashed or not. */
  orbits: { r: number; ecc: number; tx: number; tz: number; dashed: boolean }[];
  /** The port's sockets, where the tendrils leave. */
  sockets: V3[];
  /** Where the middle beat's runs leave the mind: its back and its front. */
  flanks: { tool: V3[]; collab: V3[] };
  /** The anatomy: every named part (the method's list). */
  parts: string[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scl = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const len3 = (a: V3) => Math.hypot(a.x, a.y, a.z);
const norm = (a: V3): V3 => scl(a, 1 / (len3(a) || 1));
const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, scl(sub(b, a), t));

// ── The solid: a brain's outline, in world units (a plate is 8 by 4.5) ──

/** An ellipsoid's signed distance, near enough for a cast. */
function ellipsoid(p: V3, c: V3, r: V3): number {
  const q = { x: (p.x - c.x) / r.x, y: (p.y - c.y) / r.y, z: (p.z - c.z) / r.z };
  const k0 = len3(q);
  const k1 = Math.hypot(q.x / r.x, q.y / r.y, q.z / r.z);
  return k1 === 0 ? -Math.min(r.x, r.y, r.z) : (k0 * (k0 - 1)) / k1;
}
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};

/** The brain's true numbers. */
export const BRAIN = {
  cerebrum: { c: { x: 0, y: 0, z: 0.5 }, r: { x: 4.5, y: 3.3, z: 2.9 } },
  temporal: { c: { x: 0.7, y: 2.45, z: -0.9 }, r: { x: 2.6, y: 1.05, z: 1.25 } },
  cerebellum: { c: { x: -3.05, y: 0, z: -1.75 }, r: { x: 1.55, y: 2.5, z: 1.05 } },
  /** The fissure along the crown: depth and half width. */
  fissure: { depth: 0.55, width: 0.42 },
} as const;

export function brainSdf(p: V3): number {
  // A cerebrum fuller at the back and lower at the front, as a brain is.
  const lift = 0.35 * Math.tanh(-p.x / 2.5);
  let d = ellipsoid({ x: p.x, y: p.y, z: p.z - lift }, BRAIN.cerebrum.c, BRAIN.cerebrum.r);
  for (const s of [1, -1]) {
    const t = BRAIN.temporal;
    d = smin(d, ellipsoid(p, { x: t.c.x, y: s * t.c.y, z: t.c.z }, t.r), 0.9);
  }
  // The fissure: a soft cut down the midline, only over the crown.
  const crown = Math.max(0, Math.min(1, (p.z - 0.6) / 1.4));
  const cut = BRAIN.fissure.depth * crown * Math.exp(-(p.y * p.y) / (BRAIN.fissure.width * BRAIN.fissure.width));
  d += cut;
  const cb = BRAIN.cerebellum;
  d = smin(d, ellipsoid(p, cb.c, cb.r), 0.45);
  return d;
}

/** Where a ray from the core leaves the solid for the last time. */
function cast(dir: V3, from: V3): number {
  let t = 9;
  while (t > 0 && brainSdf(add(from, scl(dir, t))) > 0) t -= 0.04;
  let lo = t;
  let hi = t + 0.04;
  for (let k = 0; k < 18; k++) {
    const m = (lo + hi) / 2;
    if (brainSdf(add(from, scl(dir, m))) > 0) hi = m;
    else lo = m;
  }
  return lo;
}

/** A geodesic sphere: the icosahedron, each face split `level` times. */
function icosphere(level: number): { v: V3[]; f: [number, number, number][] } {
  const g = (1 + Math.sqrt(5)) / 2;
  const v: V3[] = [
    [-1, g, 0], [1, g, 0], [-1, -g, 0], [1, -g, 0],
    [0, -1, g], [0, 1, g], [0, -1, -g], [0, 1, -g],
    [g, 0, -1], [g, 0, 1], [-g, 0, -1], [-g, 0, 1],
  ].map(([x, y, z]) => norm({ x, y, z }));
  let f: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let l = 0; l < level; l++) {
    const mid = new Map<string, number>();
    const at = (a: number, b: number) => {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      let i = mid.get(key);
      if (i === undefined) {
        i = v.length;
        v.push(norm(lerp3(v[a], v[b], 0.5)));
        mid.set(key, i);
      }
      return i;
    };
    const next: [number, number, number][] = [];
    for (const [a, b, c] of f) {
      const ab = at(a, b);
      const bc = at(b, c);
      const ca = at(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    f = next;
  }
  return { v, f };
}

/** The stem and its port, under the back of the brain. */
export const STEM = { x: -1.6, r: 0.62, top: -1.9, bottom: -4.3, sides: 8, collars: 4 } as const;
export const PORT = { z: -4.6, r: 1.15, sockets: 6 } as const;

let cache: MindModel | null = null;

export function mindModel(): MindModel {
  if (cache) return cache;
  const rnd = mulberry32(1015);
  const parts: string[] = ["cerebrum shell", "longitudinal fissure", "left temporal lobe", "right temporal lobe", "cerebellum"];
  const scatter = () => {
    const ang = rnd() * Math.PI * 2;
    const rad = 220 + rnd() * 420;
    return { dx: Math.cos(ang) * rad, dy: Math.sin(ang) * rad * 0.7, delay: rnd() * 0.4 };
  };

  // ── The shell: a geodesic sphere cast onto the solid ───────────────────
  const core: V3 = { x: -0.2, y: 0, z: -0.1 };
  const sphere = icosphere(3);
  const verts: V3[] = sphere.v.map((d) => add(core, scl(d, cast(d, core))));
  const faces = sphere.f;
  const faceN = faces.map(([a, b, c]) => {
    let n = norm(cross(sub(verts[b], verts[a]), sub(verts[c], verts[a])));
    const mid = scl(add(add(verts[a], verts[b]), verts[c]), 1 / 3);
    if (dot3(n, sub(mid, core)) < 0) n = scl(n, -1);
    return n;
  });
  const vertN: V3[] = verts.map(() => ({ x: 0, y: 0, z: 0 }));
  faces.forEach(([a, b, c], i) => {
    for (const v of [a, b, c]) vertN[v] = add(vertN[v], faceN[i]);
  });
  for (let i = 0; i < vertN.length; i++) vertN[i] = norm(vertN[i]);

  const edges: MindEdge[] = [];
  const seen = new Map<string, number>();
  const nbr: number[][] = verts.map(() => []);
  faces.forEach((t, ti) => {
    for (let e = 0; e < 3; e++) {
      const a = t[e];
      const b = t[(e + 1) % 3];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      const at = seen.get(key);
      if (at === undefined) {
        seen.set(key, edges.length);
        edges.push({ a, b, kind: EDGE.shell, n: faceN[ti] });
        nbr[a].push(b);
        nbr[b].push(a);
      } else {
        edges[at].n = norm(add(edges[at].n, faceN[ti]));
      }
    }
  });

  // The texture: wireframe first (dots along the seams), then the faces.
  const dots: MindDot[] = [];
  for (const ed of edges) {
    const A = verts[ed.a];
    const B = verts[ed.b];
    const k = Math.max(1, Math.floor(len3(sub(B, A)) / 0.16));
    for (let m = 1; m < k; m++) dots.push({ p: lerp3(A, B, m / k), n: ed.n, seam: true, ...scatter() });
  }
  faces.forEach(([a, b, c], ti) => {
    const A = verts[a];
    const B = verts[b];
    const C = verts[c];
    const area = len3(cross(sub(B, A), sub(C, A))) / 2;
    const k = Math.round(area * 4 + rnd() * 0.6);
    for (let m = 0; m < k; m++) {
      let u = rnd();
      let v = rnd();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      dots.push({ p: add(A, add(scl(sub(B, A), u), scl(sub(C, A), v))), n: faceN[ti], seam: false, ...scatter() });
    }
  });

  // ── The board: runs along the facets, kept straight, turning seldom ─────
  const lift = (i: number) => add(verts[i], scl(vertN[i], 0.05));
  const used = new Set<number>();
  const traces: V3[][] = [];
  const vias: { p: V3; n: V3 }[] = [];
  for (let t = 0; t < 400 && traces.length < 30; t++) {
    const start = Math.floor(rnd() * verts.length);
    // Over the upper and outer skin, never the underside.
    if (verts[start].z < -0.6 || used.has(start)) continue;
    const path = [start];
    let dir: V3 | null = null;
    const steps = 4 + Math.floor(rnd() * 7);
    for (let s = 0; s < steps; s++) {
      const here = path[path.length - 1];
      let best = -1;
      let score = -Infinity;
      for (const nb of nbr[here]) {
        if (used.has(nb) || path.includes(nb) || verts[nb].z < -0.8) continue;
        const d = norm(sub(verts[nb], verts[here]));
        const sc = dir ? dot3(d, dir) + rnd() * 0.25 : rnd();
        if (sc > score) {
          score = sc;
          best = nb;
        }
      }
      if (best < 0) break;
      const d = norm(sub(verts[best], verts[here]));
      // A board turns at a corner, not along a curve: keep the heading
      // unless the run takes its one turn.
      if (!dir || rnd() < 0.18) dir = d;
      path.push(best);
    }
    if (path.length < 4) continue;
    for (const i of path) used.add(i);
    for (const i of path) for (const nb of nbr[i]) used.add(nb);
    traces.push(path.map(lift));
    vias.push({ p: lift(path[0]), n: vertN[path[0]] }, { p: lift(path[path.length - 1]), n: vertN[path[path.length - 1]] });
    parts.push(`trace ${traces.length}`);
  }

  // ── The cores: ringed nodes on the upper skin ───────────────────────────
  const cores: { p: V3; n: V3; r: number }[] = [];
  for (let t = 0; t < 300 && cores.length < 7; t++) {
    const i = Math.floor(rnd() * verts.length);
    if (verts[i].z < 0.2) continue;
    if (cores.some((c) => len3(sub(c.p, verts[i])) < 2.2)) continue;
    cores.push({ p: add(verts[i], scl(vertN[i], 0.08)), n: vertN[i], r: 0.35 + rnd() * 0.35 });
    parts.push(`core ${cores.length}`);
  }

  // ── Ticks: spikes off the skin ──────────────────────────────────────────
  const ticks: { p: V3; n: V3 }[] = [];
  for (let t = 0; t < 600 && ticks.length < 34; t++) {
    const i = Math.floor(rnd() * verts.length);
    if (ticks.some((k) => len3(sub(k.p, verts[i])) < 0.9)) continue;
    ticks.push({ p: verts[i], n: vertN[i] });
  }
  parts.push("tick field");

  // ── The hologram's orbits ───────────────────────────────────────────────
  const orbits = [
    // Near level, as a ring round a planet: a thin ellipse seen side on,
    // an open one from above.
    { r: 6.0, ecc: 0.96, tx: 0.32, tz: 0.35, dashed: false },
    { r: 5.3, ecc: 0.92, tx: -0.5, tz: -0.7, dashed: true },
  ];
  parts.push("outer orbit", "dashed orbit");

  // ── The stem, its collars, the port and its sockets ────────────────────
  parts.push("stem");
  const ring = (z: number, r: number, sides: number, cx: number) => {
    const i = verts.length;
    for (let s = 0; s < sides; s++) {
      const a = (s / sides) * Math.PI * 2 + Math.PI / sides;
      verts.push({ x: cx + Math.cos(a) * r, y: Math.sin(a) * r, z });
    }
    return i;
  };
  const rings: number[] = [];
  for (let k = 0; k < STEM.collars; k++) {
    const z = STEM.top + ((STEM.bottom - STEM.top) * k) / (STEM.collars - 1);
    rings.push(ring(z, STEM.r * (k === 0 ? 1.1 : 1), STEM.sides, STEM.x));
    parts.push(`stem collar ${k + 1}`);
  }
  for (let k = 0; k < rings.length; k++) {
    for (let s = 0; s < STEM.sides; s++) {
      const a = rings[k] + s;
      const b = rings[k] + ((s + 1) % STEM.sides);
      const ang = ((s + 0.5) / STEM.sides) * Math.PI * 2 + Math.PI / STEM.sides;
      const n: V3 = { x: Math.cos(ang), y: Math.sin(ang), z: 0 };
      edges.push({ a, b, kind: EDGE.stem, n });
      if (k + 1 < rings.length) edges.push({ a, b: rings[k + 1] + s, kind: EDGE.stem, n });
    }
  }
  parts.push("port plate");
  const port = ring(PORT.z, PORT.r, 8, STEM.x);
  for (let s = 0; s < 8; s++) {
    edges.push({ a: port + s, b: port + ((s + 1) % 8), kind: EDGE.port, n: { x: 0, y: 0, z: 1 } });
    edges.push({ a: rings[rings.length - 1] + s, b: port + s, kind: EDGE.port, n: { x: 0, y: 0, z: 1 } });
  }
  const sockets: V3[] = [];
  for (let s = 0; s < PORT.sockets; s++) {
    const a = (s / PORT.sockets) * Math.PI * 2 + 0.3;
    sockets.push({ x: STEM.x + Math.cos(a) * PORT.r * 0.66, y: Math.sin(a) * PORT.r * 0.66, z: PORT.z - 0.05 });
    parts.push(`socket ${s + 1}`);
  }

  // ── The flanks: the back (to the tool) and the front (to the collaborator)
  const flank = (front: boolean, z: number): V3 => {
    const d = norm({ x: front ? 1 : -1, y: 0.35, z: z / 4 });
    return add(core, scl(d, cast(d, core)));
  };
  const flanks = {
    tool: [1.6, 0.5, -0.6].map((z) => flank(false, z)),
    collab: [1.6, 0.5, -0.6].map((z) => flank(true, z)),
  };

  cache = { verts, edges, dots, traces, vias, cores, ticks, orbits, sockets, flanks, parts };
  return cache;
}

/** A circle of radius `r` around `c`, in the plane whose normal is `n`. */
export function ringAround(c: V3, n: V3, r: number, k = 28): V3[] {
  const a = norm(Math.abs(n.z) < 0.9 ? cross(n, { x: 0, y: 0, z: 1 }) : cross(n, { x: 1, y: 0, z: 0 }));
  const b = cross(n, a);
  const out: V3[] = [];
  for (let j = 0; j <= k; j++) {
    const t = (j / k) * Math.PI * 2;
    out.push(add(c, add(scl(a, Math.cos(t) * r), scl(b, Math.sin(t) * r))));
  }
  return out;
}

/** An orbit's point at angle `t`, in local space. */
export function orbitAt(o: { r: number; ecc: number; tx: number; tz: number }, t: number): V3 {
  const x = Math.cos(t) * o.r;
  const y = Math.sin(t) * o.r * o.ecc;
  // Tilt about x, then turn about z.
  const y1 = y * Math.cos(o.tx);
  const z1 = y * Math.sin(o.tx);
  return { x: x * Math.cos(o.tz) - y1 * Math.sin(o.tz), y: x * Math.sin(o.tz) + y1 * Math.cos(o.tz), z: z1 + 0.2 };
}

export { dot3, lerp3 };
