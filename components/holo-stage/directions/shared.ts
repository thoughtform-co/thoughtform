/**
 * directions/shared — the primitives the look-dev directions are drawn with
 * (ADR-140, round two: back to the drawing board).
 *
 * The owner's references, decoded into forms: a geodesic WIRE SPHERE over a
 * ruled plane discharging TENDRILS into its cells; a wire planet with a tilted
 * ORBIT and ringed surface instruments; a terrain RELIEF in wire mesh on a
 * stacked slab; a graduated circular INSTRUMENT with a measured trace. Every
 * direction below is built from these, in the stage's own (a, b, z) world and
 * through the one renderer. ⚠ THREE-FREE AND PURE; seeded, never `Math.random`.
 *
 * A direction letters NOTHING: it names its words as `DirLabel`s with a world
 * anchor, and the lab (later the page) seats a DOM span at the anchor's crop
 * fraction — the register's one hard law (`isometric-wireframe-grammar.md`).
 */

import { STAGE_K, frameAround, type Pads, type WorldPt } from "@/components/arcs/framing/floor";
import { ISO_BASIS_STAGE, mulberry32, type IsoFrame } from "@/components/arcs/framing/iso";

import { stageCameraBasis, toThree, viewUnit, type StageView, type Vec3 } from "../stageFit";
import type { HoloStageSpec, StageFace, StageLine, StageRole } from "../stageGeom";

export type ABZ = WorldPt;
export const abz = (a: number, b: number, z: number): ABZ => ({ a, b, z });
export const P = (p: ABZ): Vec3 => toThree(p.a, p.b, p.z);
/** A flat-view point (`toFlat`) back to the (a, b, z) a label anchor is written in. */
export const flatAnchor = (p: Vec3): ABZ => ({ a: p[0], b: 0, z: p[1] });

/** A word the drawing names and does not letter. */
export interface DirLabel {
  id: string;
  text: string;
  /** Where the word sits, in world. */
  at: ABZ;
  /** Px offsets from the anchor, in the stage's own px (1920 reference). */
  dx?: number;
  dy?: number;
  anchor?: "start" | "middle" | "end";
  /** Degrees, for a word running along a floor edge. */
  rot?: number;
  kind?: "name" | "axis" | "end" | "note" | "person";
  lit?: boolean;
}

export interface Direction {
  id: string;
  figure: "stages" | "curve" | "spectrum";
  name: string;
  /** Which of the owner's references it is derived from. */
  reference: string;
  /** The one sentence the drawing has to say. */
  claim: string;
  spec: HoloStageSpec;
  labels: readonly DirLabel[];
}

/* ── Points ───────────────────────────────────────────────────────────── */

/** Collects every world point a direction draws, for the derived crop. */
export function collector() {
  const all: ABZ[] = [];
  return {
    all,
    add(...pts: ABZ[]) {
      all.push(...pts);
    },
    /** The three-space points back to (a, b, z), for a built polyline. */
    addV(...pts: Vec3[]) {
      for (const p of pts) all.push({ a: p[0], b: -p[2], z: p[1] });
    },
  };
}

export function frameOf(points: readonly ABZ[], pads: Pads, k?: number): IsoFrame {
  return frameAround(points, pads, k);
}

/**
 * The crop that holds every point from ANY vantage (ADR-140, round two): the
 * points projected through the view's own basis, the box around them plus
 * the pads. For the `stage` view this is `frameAround` to the unit, so the
 * no-cut-off guarantee holds at every vantage the lab can turn to.
 */
export function frameFor(
  points: readonly ABZ[],
  pads: Pads,
  view: StageView,
  k = STAGE_K
): IsoFrame {
  if (view === "stage") return frameAround(points, pads, k);
  const b = stageCameraBasis(view);
  const unit = viewUnit(k, view);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const q of points) {
    const p = P(q);
    const u = p[0] * b.x[0] + p[1] * b.x[1] + p[2] * b.x[2];
    const v = p[0] * b.y[0] + p[1] * b.y[1] + p[2] * b.y[2];
    x0 = Math.min(x0, u);
    x1 = Math.max(x1, u);
    y0 = Math.min(y0, -v);
    y1 = Math.max(y1, -v);
  }
  const w = Math.ceil((x1 - x0) * unit + pads.l + pads.r);
  const h = Math.ceil((y1 - y0) * unit + pads.t + pads.b);
  return { w, h, ox: pads.l - x0 * unit, oy: pads.t - y0 * unit, k, basis: ISO_BASIS_STAGE };
}

/* ── Lines ─────────────────────────────────────────────────────────────── */

export function run(
  id: string,
  points: readonly Vec3[],
  o: {
    role: StageRole;
    width: number;
    opacity: number;
    reveal: readonly [number, number];
    batch?: boolean;
    donor?: boolean;
    group?: string;
    dashed?: boolean;
  }
): StageLine {
  return { id, points, batch: o.donor ? false : (o.batch ?? true), ...o };
}

/** A dashed run as separate batch segments (the batch has no dash of its own). */
export function dashes(
  id: string,
  points: readonly Vec3[],
  o: {
    role: StageRole;
    width: number;
    opacity: number;
    reveal: readonly [number, number];
    on?: number;
    off?: number;
  }
): StageLine[] {
  const on = o.on ?? 0.16;
  const off = o.off ?? 0.12;
  const out: StageLine[] = [];
  let k = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const n = Math.max(1, Math.floor(len / (on + off)));
    for (let j = 0; j < n; j++) {
      const t0 = (j * (on + off)) / len;
      const t1 = Math.min(1, (j * (on + off) + on) / len);
      const p0: Vec3 = [
        a[0] + (b[0] - a[0]) * t0,
        a[1] + (b[1] - a[1]) * t0,
        a[2] + (b[2] - a[2]) * t0,
      ];
      const p1: Vec3 = [
        a[0] + (b[0] - a[0]) * t1,
        a[1] + (b[1] - a[1]) * t1,
        a[2] + (b[2] - a[2]) * t1,
      ];
      out.push({
        id: `${id}-${k++}`,
        points: [p0, p1],
        role: o.role,
        width: o.width,
        opacity: o.opacity,
        reveal: o.reveal,
        batch: true,
      });
    }
  }
  return out;
}

/* ── Rings, spheres, orbits ─────────────────────────────────────────────── */

/**
 * A ring about `c`: `screen` faces the camera (a node, a mark), `floor` lies
 * on the floor plane (a footprint), `wall` stands in the a–z plane.
 */
export function ring(
  c: ABZ,
  r: number,
  n = 24,
  plane: "screen" | "floor" | "wall" = "screen",
  view: StageView = "stage"
): Vec3[] {
  const out: Vec3[] = [];
  const cc = P(c);
  if (plane === "screen") {
    const b = stageCameraBasis(view);
    for (let i = 0; i <= n; i++) {
      const th = (i / n) * Math.PI * 2;
      const x = Math.cos(th) * r;
      const y = Math.sin(th) * r;
      out.push([
        cc[0] + x * b.x[0] + y * b.y[0],
        cc[1] + x * b.x[1] + y * b.y[1],
        cc[2] + x * b.x[2] + y * b.y[2],
      ]);
    }
    return out;
  }
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    if (plane === "floor") out.push(P(abz(c.a + Math.cos(th) * r, c.b + Math.sin(th) * r, c.z)));
    else out.push(P(abz(c.a + Math.cos(th) * r, c.b, c.z + Math.sin(th) * r)));
  }
  return out;
}

/**
 * A tilted ORBIT about `c`: radius `rx` along the a-axis, `ry` across, the
 * plane tilted `tiltDeg` up from the floor (0 = lying flat, 90 = a wall) and
 * turned `yawDeg` about z.
 */
export function orbit(c: ABZ, rx: number, ry: number, tiltDeg: number, n = 72, yawDeg = 0): Vec3[] {
  const t = (tiltDeg * Math.PI) / 180;
  const y = (yawDeg * Math.PI) / 180;
  const u = { a: Math.cos(y), b: Math.sin(y), z: 0 };
  const v = { a: -Math.sin(y) * Math.cos(t), b: Math.cos(y) * Math.cos(t), z: Math.sin(t) };
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    const ca = Math.cos(th) * rx;
    const sb = Math.sin(th) * ry;
    out.push(
      P(abz(c.a + ca * u.a + sb * v.a, c.b + ca * u.b + sb * v.b, c.z + ca * u.z + sb * v.z))
    );
  }
  return out;
}

/** A point on an orbit at angle `deg`. */
export function orbitAt(
  c: ABZ,
  rx: number,
  ry: number,
  tiltDeg: number,
  deg: number,
  yawDeg = 0
): ABZ {
  const t = (tiltDeg * Math.PI) / 180;
  const y = (yawDeg * Math.PI) / 180;
  const th = (deg * Math.PI) / 180;
  const u = { a: Math.cos(y), b: Math.sin(y), z: 0 };
  const v = { a: -Math.sin(y) * Math.cos(t), b: Math.cos(y) * Math.cos(t), z: Math.sin(t) };
  const ca = Math.cos(th) * rx;
  const sb = Math.sin(th) * ry;
  return abz(c.a + ca * u.a + sb * v.a, c.b + ca * u.b + sb * v.b, c.z + ca * u.z + sb * v.z);
}

/**
 * A geodesic wire sphere: the icosahedron subdivided `subdiv` times, every
 * edge once. subdiv 1 = 42 vertices, 120 edges; 2 = 162 / 480.
 */
export function icosphere(c: ABZ, r: number, subdiv = 1): { verts: ABZ[]; edges: [ABZ, ABZ][] } {
  const t = (1 + Math.sqrt(5)) / 2;
  let verts: [number, number, number][] = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ].map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l, y / l, z / l] as [number, number, number];
  });
  let faces: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  for (let s = 0; s < subdiv; s++) {
    const cache = new Map<string, number>();
    const mid = (i: number, j: number) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const [ax, ay, az] = verts[i];
      const [bx, by, bz] = verts[j];
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const mz = (az + bz) / 2;
      const l = Math.hypot(mx, my, mz);
      verts.push([mx / l, my / l, mz / l]);
      cache.set(key, verts.length - 1);
      return verts.length - 1;
    };
    const next: [number, number, number][] = [];
    for (const [a, b, d] of faces) {
      const ab = mid(a, b);
      const bd = mid(b, d);
      const da = mid(d, a);
      next.push([a, ab, da], [b, bd, ab], [d, da, bd], [ab, bd, da]);
    }
    faces = next;
  }
  const seen = new Set<string>();
  const edges: [ABZ, ABZ][] = [];
  const W = (i: number): ABZ =>
    abz(c.a + verts[i][0] * r, c.b + verts[i][1] * r, c.z + verts[i][2] * r);
  for (const f of faces) {
    for (const [i, j] of [
      [f[0], f[1]],
      [f[1], f[2]],
      [f[2], f[0]],
    ] as const) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([W(i), W(j)]);
    }
  }
  verts = verts.slice();
  return { verts: verts.map((_, i) => W(i)), edges };
}

/** Seeded motes filling a sphere. */
export function sphereMotes(seed: number, c: ABZ, r: number, count: number): Vec3[] {
  const rnd = mulberry32(seed);
  const out: Vec3[] = [];
  while (out.length < count) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    const z = rnd() * 2 - 1;
    if (x * x + y * y + z * z > 1) continue;
    out.push(P(abz(c.a + x * r, c.b + y * r, c.z + z * r)));
  }
  return out;
}

/**
 * A seeded TENDRIL from `from` to `to`: a jagged run whose jitter is largest
 * mid-way and zero at both ends, so it leaves its source and strikes its cell.
 */
export function tendril(seed: number, from: ABZ, to: ABZ, segs = 8, jitter = 0.22): Vec3[] {
  const rnd = mulberry32(seed);
  const out: Vec3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const env = Math.sin(t * Math.PI);
    const ja = (rnd() - 0.5) * 2 * jitter * env;
    const jb = (rnd() - 0.5) * 2 * jitter * env;
    const jz = (rnd() - 0.5) * 2 * jitter * env * 0.6;
    out.push(
      P(
        abz(
          from.a + (to.a - from.a) * t + ja,
          from.b + (to.b - from.b) * t + jb,
          from.z + (to.z - from.z) * t + jz
        )
      )
    );
  }
  return out;
}

/* ── Faces ─────────────────────────────────────────────────────────────── */

/** A cell of the floor, lit. */
export function cell(
  id: string,
  a: number,
  b: number,
  size: number,
  o: {
    role: StageRole;
    opacity: number;
    reveal: readonly [number, number];
    z?: number;
    group?: string;
  }
): StageFace {
  const z = o.z ?? 0;
  return {
    id,
    quad: [
      P(abz(a, b, z)),
      P(abz(a + size, b, z)),
      P(abz(a + size, b + size, z)),
      P(abz(a, b + size, z)),
    ],
    role: o.role,
    opacity: o.opacity,
    reveal: o.reveal,
    group: o.group,
  };
}

/** The person: a filled node (the house's grammar — filled is the hand, open the model). */
export function personNode(
  id: string,
  at: ABZ,
  reveal: readonly [number, number],
  view: StageView = "stage"
): StageLine[] {
  return [
    run(`${id}-fill`, ring(at, 0.09, 12, "screen", view), {
      role: "green",
      width: 5,
      opacity: 1,
      reveal,
    }),
    run(`${id}-rim`, ring(at, 0.2, 18, "screen", view), {
      role: "green",
      width: 1.2,
      opacity: 0.9,
      reveal,
    }),
  ];
}

/** The model: an open node. */
export function openNode(
  id: string,
  at: ABZ,
  reveal: readonly [number, number],
  view: StageView = "stage",
  role: StageRole = "structure",
  r = 0.16
): StageLine {
  return run(id, ring(at, r, 18, "screen", view), { role, width: 1.3, opacity: 0.9, reveal });
}
