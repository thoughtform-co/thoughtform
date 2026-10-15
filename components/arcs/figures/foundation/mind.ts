/**
 * The model's core (ADR-156 U6 to U8): an instrument, not an anatomy.
 *
 * U6 drew two ellipsoids ("two zeppelins"); U7 a brain cast in low poly
 * (owner: "a children's drawing ... it has this weird lobe"). U8 stops
 * drawing a brain (owner, 2026-10-15: "more like a wireframe, maybe something
 * that looks like a computer, like a dodecahedron or something less literally
 * like a brain but visually a bit more interesting"). It is a compound, the
 * way a crystal or a gyroscope is built:
 *
 *   shell               a dodecahedron, twelve pentagonal faces
 *   lattice             its dual icosahedron inside, a vertex under every face
 *   face circuits       on each face: an inset pentagon, two traces to the
 *                       face's edges, a via at each end
 *   spokes              from every lattice vertex in to the core
 *   core                a sphere of particles with three rings round it
 *   orbits              two near-level rings outside, as the homepage's
 *                       hologram has
 *   sockets             the shell's six lowest corners: the cords leave here
 *
 * The solid is turned once, in its own frame, so that a face looks along +y:
 * a camera at yaw 0 and a level pitch then sees one pentagon face on, the
 * reader's "front-facing". It never turns after that.
 *
 * Local frame: +x to the reader's right in the front view, +y toward the
 * reader, +z up. The camera is orthographic (`projB`, pinned to the scene's
 * isometric) with an optional perspective (`projP`) the paint uses.
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

/** The perspective's eye distance, in world units: gentle, a long lens. */
export const EYE = 26;

/** A point with perspective: nearer is larger. Returns its depth too. */
export function projP(p: V3, b: Basis, o: P2): P2 & { d: number; k: number } {
  const d = p.x * b.view.x + p.y * b.view.y + p.z * b.view.z;
  const k = EYE / (EYE - d);
  return {
    x: o.x + k * (p.x * b.ex.x + p.y * b.ey.x + p.z * b.ez.x),
    y: o.y + k * (p.x * b.ex.y + p.y * b.ey.y + p.z * b.ez.y),
    d,
    k,
  };
}

/** Edge kinds, for the paint. */
export const EDGE = { shell: 0, lattice: 1, spoke: 2, circuit: 3 } as const;

export interface CoreEdge {
  a: V3;
  b: V3;
  kind: number;
}

export interface CoreModel {
  /** The shell's twenty corners and the lattice's twelve. */
  shell: V3[];
  lattice: V3[];
  edges: CoreEdge[];
  /** The shell's twelve faces: their corners (in order) and their normals. */
  faces: { idx: number[]; n: V3 }[];
  /** A via: a pad at a circuit's end, on its face. */
  vias: { p: V3; n: V3 }[];
  /** The core's particles, and its three rings (radius, tilt). */
  core: { dots: V3[]; r: number; rings: { r: number; tx: number; tz: number }[] };
  /** Particles along the shell's and lattice's edges: the texture. */
  dust: { p: V3; kind: number }[];
  /** The hologram's rings outside: radius, ellipse, tilt about x then z. */
  orbits: { r: number; ecc: number; tx: number; tz: number; dashed: boolean }[];
  /** The shell's six lowest corners: where the cords leave. */
  sockets: V3[];
  /** Where the middle beat's runs leave: its left (tool) and right (collaborator). */
  flanks: { tool: V3[]; collab: V3[] };
  /** Every named part (the anatomy method's list). */
  parts: string[];
}

const PHI = (1 + Math.sqrt(5)) / 2;
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

/** The core's true numbers, in world units (a plate is 8 by 4.5). */
export const CORE = {
  /** The shell's circumradius, the lattice's, the core's. */
  shell: 4.3,
  lattice: 2.75,
  core: 1.25,
  /** A face circuit's inset, as a share of the face. */
  inset: 0.5,
} as const;

/** Turned once so a face looks along +y: the face whose normal is
    (0, phi, 1), about x, by atan(1 / phi). */
const TURN = -Math.atan(1 / PHI);
const turn = (p: V3): V3 => ({
  x: p.x,
  y: p.y * Math.cos(TURN) - p.z * Math.sin(TURN),
  z: p.y * Math.sin(TURN) + p.z * Math.cos(TURN),
});

function dodecahedron(): V3[] {
  const v: V3[] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push({ x, y, z });
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      v.push({ x: 0, y: a / PHI, z: b * PHI });
      v.push({ x: a / PHI, y: b * PHI, z: 0 });
      v.push({ x: a * PHI, y: 0, z: b / PHI });
    }
  }
  return v;
}

/** The dual: a vertex on the ray through each of the dodecahedron's face
    centres, (0, +-phi, +-1) and its cycles. */
function icosahedron(): V3[] {
  const v: V3[] = [];
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      v.push({ x: 0, y: a * PHI, z: b });
      v.push({ x: b, y: 0, z: a * PHI });
      v.push({ x: a * PHI, y: b, z: 0 });
    }
  }
  return v;
}

/** Every pair at the polyhedron's edge length. */
function edgesOf(v: V3[]): [number, number][] {
  let min = Infinity;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, len3(sub(v[i], v[j])));
  const out: [number, number][] = [];
  for (let i = 0; i < v.length; i++) {
    for (let j = i + 1; j < v.length; j++) if (len3(sub(v[i], v[j])) < min * 1.01) out.push([i, j]);
  }
  return out;
}

/** A Fibonacci sphere: `n` points evenly over a sphere. */
function fibonacci(n: number, r: number): V3[] {
  const out: V3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    out.push({ x: Math.cos(i * g) * rr * r, y: y * r, z: Math.sin(i * g) * rr * r });
  }
  return out;
}

let cache: CoreModel | null = null;

export function coreModel(): CoreModel {
  if (cache) return cache;
  const parts: string[] = [];
  const dRaw = dodecahedron();
  const k = CORE.shell / len3(dRaw[0]);
  const shell = dRaw.map((p) => turn(scl(p, k)));
  const iRaw = icosahedron();
  const lattice = iRaw.map((p) => turn(scl(norm(p), CORE.lattice)));
  const edges: CoreEdge[] = [];
  parts.push("shell, a dodecahedron");
  for (const [a, b] of edgesOf(shell)) edges.push({ a: shell[a], b: shell[b], kind: EDGE.shell });
  parts.push("lattice, its dual icosahedron");
  for (const [a, b] of edgesOf(lattice)) edges.push({ a: lattice[a], b: lattice[b], kind: EDGE.lattice });

  // The faces: the five shell corners nearest each lattice vertex's ray.
  const faces: { idx: number[]; n: V3 }[] = [];
  for (const l of lattice) {
    const n = norm(l);
    const idx = shell
      .map((p, i) => ({ i, d: dot3(norm(p), n) }))
      .sort((p, q) => q.d - p.d)
      .slice(0, 5)
      .map((p) => p.i);
    // In order round the face.
    const c = scl(idx.reduce((s, i) => add(s, shell[i]), { x: 0, y: 0, z: 0 }), 1 / 5);
    const u = norm(sub(shell[idx[0]], c));
    const w = cross(n, u);
    idx.sort((i, j) => {
      const a = sub(shell[i], c);
      const b = sub(shell[j], c);
      return Math.atan2(dot3(a, w), dot3(a, u)) - Math.atan2(dot3(b, w), dot3(b, u));
    });
    faces.push({ idx, n });
  }

  // The face circuits: an inset pentagon, and two traces from two of its
  // corners out to the face's edges, bent once, a via at each end.
  const vias: { p: V3; n: V3 }[] = [];
  faces.forEach((f, fi) => {
    const pts = f.idx.map((i) => shell[i]);
    const c = scl(pts.reduce((s, p) => add(s, p), { x: 0, y: 0, z: 0 }), 1 / 5);
    const lift = scl(f.n, 0.02);
    const inner = pts.map((p) => add(lerp3(c, p, CORE.inset), lift));
    for (let e = 0; e < 5; e++) edges.push({ a: inner[e], b: inner[(e + 1) % 5], kind: EDGE.circuit });
    for (const e of [fi % 5, (fi + 2) % 5]) {
      // Along the inset's edge, then square out to the face's edge: the
      // inset is the face scaled about its centre, so the two edges are
      // parallel and the run out is at right angles to both.
      const from = inner[e];
      const innerMid = lerp3(inner[e], inner[(e + 1) % 5], 0.5);
      const outerMid = add(lerp3(pts[e], pts[(e + 1) % 5], 0.5), lift);
      const knee = lerp3(from, innerMid, 0.62);
      const end = add(knee, scl(sub(outerMid, innerMid), 0.9));
      edges.push({ a: from, b: knee, kind: EDGE.circuit });
      edges.push({ a: knee, b: end, kind: EDGE.circuit });
      vias.push({ p: from, n: f.n }, { p: end, n: f.n });
    }
    parts.push(`face circuit ${fi + 1}`);
  });

  // The spokes: every lattice vertex in to the core's skin.
  lattice.forEach((l, i) => {
    edges.push({ a: l, b: scl(norm(l), CORE.core * 1.15), kind: EDGE.spoke });
    parts.push(`spoke ${i + 1}`);
  });

  parts.push("core");
  const core = {
    dots: fibonacci(560, CORE.core),
    r: CORE.core,
    rings: [
      { r: CORE.core * 1.35, tx: 0.35, tz: 0.2 },
      { r: CORE.core * 1.55, tx: 1.25, tz: -0.6 },
      { r: CORE.core * 1.75, tx: -0.8, tz: 1.1 },
    ],
  };
  parts.push("core ring 1", "core ring 2", "core ring 3");

  // The texture: particles along the shell's and the lattice's edges.
  const dust: { p: V3; kind: number }[] = [];
  for (const e of edges) {
    if (e.kind !== EDGE.shell && e.kind !== EDGE.lattice) continue;
    const n = Math.floor(len3(sub(e.b, e.a)) / (e.kind === EDGE.shell ? 0.09 : 0.16));
    for (let m = 1; m < n; m++) dust.push({ p: lerp3(e.a, e.b, m / n), kind: e.kind });
  }

  const orbits = [
    { r: 6.1, ecc: 0.97, tx: 0.28, tz: 0.4, dashed: false },
    { r: 5.5, ecc: 0.93, tx: -0.42, tz: -0.75, dashed: true },
  ];
  parts.push("outer orbit", "dashed orbit");

  // The shell's lowest face: its five corners and its centre.
  const base = [...shell].sort((p, q) => p.z - q.z).slice(0, 5);
  const sockets = [...base, scl(base.reduce((sm, p) => add(sm, p), { x: 0, y: 0, z: 0 }), 1 / 5)];
  sockets.forEach((_, i) => parts.push(`socket ${i + 1}`));

  // The flanks: the shell's three corners furthest to either side.
  const byX = [...shell].sort((p, q) => p.x - q.x);
  const flanks = {
    tool: byX.slice(0, 3).sort((p, q) => q.z - p.z),
    collab: byX.slice(-3).sort((p, q) => q.z - p.z),
  };

  cache = { shell, lattice, edges, faces, vias, core, dust, orbits, sockets, flanks, parts };
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

/** A ring's point at angle `t`, in local space. */
export function orbitAt(o: { r: number; ecc?: number; tx: number; tz: number }, t: number, lift = 0): V3 {
  const x = Math.cos(t) * o.r;
  const y = Math.sin(t) * o.r * (o.ecc ?? 1);
  const y1 = y * Math.cos(o.tx);
  const z1 = y * Math.sin(o.tx);
  return { x: x * Math.cos(o.tz) - y1 * Math.sin(o.tz), y: x * Math.sin(o.tz) + y1 * Math.cos(o.tz), z: z1 + lift };
}

export { dot3, lerp3, len3, sub };
