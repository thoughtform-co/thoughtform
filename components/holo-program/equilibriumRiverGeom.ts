/**
 * equilibriumRiverGeom — the opener's SECOND figure (ADR-143 U9): the
 * Thoughtform equilibrium as a river of data, drawn as an isolated diorama.
 *
 * Owner, 2026-10-04: "a river of data, like a sort of a diorama isolated,
 * super clean, a bit tilted, where you really see the upstream and the
 * downstream, like a digital artifact." One block of terrain, cut clean and
 * floating, its two machined corners on the house diagonal (ADR-065):
 *
 *   UPSTREAM    contoured high ground at the back left; tributaries branch out
 *               of it and join one river that meanders down a valley.
 *   ENCODE      a gate across the river where the valley opens: the weir, a
 *               marker on a stalk above it.
 *   DOWNSTREAM  a plain ruled into even plots at the front right; past the
 *               gate the river splits into four straight channels that run
 *               out through the cut face. Work that runs.
 *
 * The water is DATA and the one gold thing: motes crowd slowly down the
 * meanders and run evenly down the channels.
 *
 * ⚠ THREE-FREE AND PURE, like `equilibriumGeom.ts`: the canvas draws these
 * lines, the server projects the same lines through the same rest camera
 * (`eqCamera.ts`) for the static drawing, and the words are seated from the
 * same anchors. World axes are three's: `y` up; the river runs along `+x`.
 */

import {
  cameraBasis,
  cameraPosition,
  type EqCamBasis,
  type EqCameraSpec,
  facesEye,
  type P3,
  projectThrough,
  type V3,
} from "./eqCamera";

export type { P3 } from "./eqCamera";

type V2 = [number, number];
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ── The frame and the camera ──────────────────────────────────────────── */

export const RIVER_FRAME = { w: 1100, h: 500 } as const;

/** From the front right, above: the block's long side runs across the frame,
 *  falling gently to the right, its top surface open to the eye — tilted, a
 *  diorama on a table. Upstream is the far left, downstream the near right. */
export const RIVER_CAMERA: EqCameraSpec = {
  azimuthDeg: 30,
  elevationDeg: 27,
  distance: 14.2,
  fovDeg: 22,
};

/** Never past the end face or under the top surface. */
export const RIVER_DRAG = { azimuthDeg: 16, polarDeg: 7 } as const;

export function riverCameraPosition(): V3 {
  return cameraPosition(RIVER_CAMERA);
}

export function riverCameraBasis(eye: V3 = riverCameraPosition()): EqCamBasis {
  return cameraBasis(eye);
}

export function riverProject(
  p: P3,
  frame: { w: number; h: number } = RIVER_FRAME,
  cam: EqCamBasis = riverCameraBasis()
): { x: number; y: number; depth: number } {
  return projectThrough(p, frame, RIVER_CAMERA.fovDeg, cam);
}

/* ── The block ─────────────────────────────────────────────────────────── */

/** Half-length (along the river), half-width, the corner cut, and the floor. */
/** Every height is lifted by `LIFT`, so the block sits centred in the frame
 *  (the camera looks at the origin and the block's mass is below it). */
const LIFT = 0.42;

export const BLOCK = { hx: 3.1, hz: 1.45, cut: 0.42, floor: -0.86 + LIFT } as const;

/**
 * The footprint, going round: the cuts are on the corners the rest camera puts
 * at the frame's top right (downstream, far side) and bottom left (upstream,
 * near side) — the house diagonal, TR + BL (ADR-065).
 */
export const FOOTPRINT: readonly V2[] = (() => {
  const { hx, hz, cut } = BLOCK;
  return [
    [-hx, -hz],
    [hx - cut, -hz],
    [hx, -hz + cut],
    [hx, hz],
    [-hx + cut, hz],
    [-hx, hz - cut],
  ];
})();

interface Edge {
  a: V2;
  b: V2;
  /** Outward normal in the floor plane. */
  n: V2;
}

const EDGES: readonly Edge[] = FOOTPRINT.map((a, i) => {
  const b = FOOTPRINT[(i + 1) % FOOTPRINT.length];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  let n: V2 = [dz / l, -dx / l];
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  if (n[0] * mx + n[1] * mz < 0) n = [-n[0], -n[1]];
  return { a, b, n };
});

export function insideFootprint(x: number, z: number, eps = 1e-9): boolean {
  for (const e of EDGES) {
    if (e.n[0] * (x - e.a[0]) + e.n[1] * (z - e.a[1]) > eps) return false;
  }
  return true;
}

/** A segment clipped to the footprint (Cyrus–Beck), or null. */
function clipToFootprint(p: V2, q: V2): [V2, V2] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = q[0] - p[0];
  const dz = q[1] - p[1];
  for (const e of EDGES) {
    const num = -(e.n[0] * (p[0] - e.a[0]) + e.n[1] * (p[1] - e.a[1]));
    const den = e.n[0] * dx + e.n[1] * dz;
    if (Math.abs(den) < 1e-12) {
      if (num < 0) return null;
      continue;
    }
    const t = num / den;
    if (den < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [
    [p[0] + dx * t0, p[1] + dz * t0],
    [p[0] + dx * t1, p[1] + dz * t1],
  ];
}

/* ── The river's course ────────────────────────────────────────────────── */

function catmull(points: readonly V2[], per: number): V2[] {
  const out: V2[] = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[n - 1]);
  return out;
}

/** Samples per course segment. A tributary meets the river exactly at one of
 *  the river's own control points, so the junction is a shared sample. */
const PER = 24;

/** The river, source to gate: it winds while the ground is steep, and its x
 *  only ever grows, so it only ever runs downhill. */
export const MAIN_COURSE: readonly V2[] = [
  [-2.86, -0.86],
  [-2.42, -0.36],
  [-1.94, -0.72],
  [-1.42, -0.08],
  [-0.92, 0.34],
  [-0.42, 0.02],
  [0.06, 0.16],
  [0.55, 0],
];

/** Where the gate stands: the river's last control point. */
export const GATE: V2 = [0.55, 0];

/** The tributaries, each ending on the river's control point `join`. */
export const TRIBUTARIES: readonly { course: readonly V2[]; join: number }[] = [
  {
    course: [
      [-2.66, 0.98],
      [-2.5, 0.6],
      [-2.24, 0.18],
      [-1.94, -0.72],
    ],
    join: 2,
  },
  {
    course: [
      [-2.22, -1.18],
      [-1.9, -1.08],
      [-1.62, -0.66],
      [-1.42, -0.08],
    ],
    join: 3,
  },
  {
    course: [
      [-1.42, 1.3],
      [-1.18, 0.98],
      [-0.98, 0.7],
      [-0.92, 0.34],
    ],
    join: 4,
  },
];

export const mainSamples = (): V2[] => catmull(MAIN_COURSE, PER);
export const tributarySamples = (k: number): V2[] => catmull(TRIBUTARIES[k].course, PER / 2);

/** The four channels past the gate, across the plain. */
export const CHANNEL_Z: readonly number[] = [-0.9, -0.3, 0.3, 0.9];
const FAN_END = 1.3;

/** A channel: a smooth fan out of the gate, then straight to the cut face. */
export function channelSamples(c: number): V2[] {
  const zc = CHANNEL_Z[c];
  const out: V2[] = [];
  const p0: V2 = GATE;
  const p1: V2 = [GATE[0] + 0.32, GATE[1]];
  const p2: V2 = [FAN_END - 0.32, zc];
  const p3: V2 = [FAN_END, zc];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  for (let i = 1; i <= 24; i++) out.push([lerp(FAN_END, BLOCK.hx, i / 24), zc]);
  return out;
}

/* ── The ground ────────────────────────────────────────────────────────── */

const RIDGES = [
  { kx: 1.9, kz: 1.3, ph: 0.4, a: 0.3 },
  { kx: -1.1, kz: 2.3, ph: 1.7, a: 0.24 },
  { kx: 2.7, kz: -1.6, ph: 2.9, a: 0.15 },
  { kx: 0.7, kz: 3.4, ph: 4.1, a: 0.11 },
] as const;

/** The fall of the land: a high plateau upstream, the plain downstream. */
export function baseSlope(x: number): number {
  return LIFT + lerp(0.36, -0.34, smooth(-3.0, 1.1, x)) - 0.08 * smooth(1.1, BLOCK.hx, x);
}

function segDist(px: number, pz: number, a: V2, b: V2): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1;
  const t = Math.min(1, Math.max(0, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}

function polyDist(px: number, pz: number, pts: readonly V2[]): number {
  let d = Infinity;
  for (let i = 0; i + 1 < pts.length; i++) d = Math.min(d, segDist(px, pz, pts[i], pts[i + 1]));
  return d;
}

let COURSES: { main: V2[]; tribs: V2[][]; channels: V2[][] } | null = null;
function courses() {
  if (!COURSES) {
    COURSES = {
      main: mainSamples(),
      tribs: TRIBUTARIES.map((_, k) => tributarySamples(k)),
      channels: CHANNEL_Z.map((_, c) => channelSamples(c)),
    };
  }
  return COURSES;
}

/**
 * The ground's height. The relief (ridges and one massif) stands up only
 * upstream and is held flat along every watercourse, so each valley floor is
 * the base slope itself and every river only falls; a narrow channel is cut
 * into it. Past the gate the land is one plane with the four channels cut in.
 */
export function height(x: number, z: number): number {
  const { main, tribs, channels } = courses();
  let h = baseSlope(x);
  const amp = 1 - smooth(-1.7, 0.6, x);
  if (amp > 0) {
    let ridged = 0;
    for (const r of RIDGES) ridged += r.a * (1 - Math.abs(Math.sin(r.kx * x + r.kz * z + r.ph)));
    const massif = 0.42 * Math.exp(-((x + 2.25) ** 2) / 1.1 - (z - 0.1) ** 2 / 1.4);
    const dMain = polyDist(x, z, main);
    let floor = Math.exp(-((dMain / 0.34) ** 2));
    let cut = 0.05 * Math.exp(-((dMain / 0.07) ** 2));
    for (const t of tribs) {
      const d = polyDist(x, z, t);
      floor = Math.max(floor, Math.exp(-((d / 0.22) ** 2)));
      cut = Math.max(cut, 0.035 * Math.exp(-((d / 0.05) ** 2)));
    }
    h += amp * (ridged + massif - 0.08) * 1.1 * (1 - floor) - cut * amp;
  }
  if (x > GATE[0] - 0.1) {
    let cut = 0;
    for (const c of channels) cut = Math.max(cut, Math.exp(-((polyDist(x, z, c) / 0.045) ** 2)));
    h -= 0.03 * cut * smooth(GATE[0] - 0.1, GATE[0] + 0.2, x);
  }
  return h;
}

/* ── Contours ──────────────────────────────────────────────────────────── */

export const CONTOUR = { step: 0.08, nx: 136, nz: 64 } as const;
/** Contours stop where the plain begins: past the gate the ground is ruled
 *  into plots, and a plane's contours are only the channels' grooves. */
const CONTOUR_END = GATE[0] + 0.12;

/** The ground's contour lines, as polylines at their level, upstream first.
 *  Marching squares over a grid, chained, kept inside the footprint. */
let CONTOURS: V3[][] | null = null;
export function contourLines(): V3[][] {
  if (CONTOURS) return CONTOURS;
  const { nx, nz, step } = CONTOUR;
  const { hx, hz } = BLOCK;
  const X = (i: number) => -hx + (2 * hx * i) / nx;
  const Z = (j: number) => -hz + (2 * hz * j) / nz;
  const H: number[][] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= nx; i++) {
    const col: number[] = [];
    for (let j = 0; j <= nz; j++) {
      const v = height(X(i), Z(j));
      col.push(v);
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    H.push(col);
  }
  const out: V3[][] = [];
  for (let L = Math.ceil(lo / step) * step; L < hi; L += step) {
    const segs: [V2, V2][] = [];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        const v0 = H[i][j];
        const v1 = H[i + 1][j];
        const v2 = H[i + 1][j + 1];
        const v3 = H[i][j + 1];
        const idx = (v0 > L ? 1 : 0) | (v1 > L ? 2 : 0) | (v2 > L ? 4 : 0) | (v3 > L ? 8 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = X(i);
        const x1 = X(i + 1);
        const z0 = Z(j);
        const z1 = Z(j + 1);
        const e = (k: number): V2 => {
          if (k === 0) return [lerp(x0, x1, (L - v0) / (v1 - v0)), z0];
          if (k === 1) return [x1, lerp(z0, z1, (L - v1) / (v2 - v1))];
          if (k === 2) return [lerp(x0, x1, (L - v3) / (v2 - v3)), z1];
          return [x0, lerp(z0, z1, (L - v0) / (v3 - v0))];
        };
        const centre = (v0 + v1 + v2 + v3) / 4 > L;
        const table: Record<number, number[][]> = {
          1: [[3, 0]],
          2: [[0, 1]],
          3: [[3, 1]],
          4: [[1, 2]],
          5: centre
            ? [
                [3, 2],
                [0, 1],
              ]
            : [
                [3, 0],
                [1, 2],
              ],
          6: [[0, 2]],
          7: [[3, 2]],
          8: [[2, 3]],
          9: [[0, 2]],
          10: centre
            ? [
                [0, 3],
                [2, 1],
              ]
            : [
                [0, 1],
                [2, 3],
              ],
          11: [[1, 2]],
          12: [[1, 3]],
          13: [[0, 1]],
          14: [[0, 3]],
        };
        for (const [a, b] of table[idx]) {
          const p = e(a);
          const q = e(b);
          if (
            p[0] < CONTOUR_END &&
            q[0] < CONTOUR_END &&
            insideFootprint(p[0], p[1], 0.02) &&
            insideFootprint(q[0], q[1], 0.02)
          ) {
            segs.push([p, q]);
          }
        }
      }
    }
    for (const line of chain(segs)) out.push(line.map((p) => [p[0], L + 0.004, p[1]] as V3));
  }
  /* Upstream first: the draw-on sweeps down the land as the river will. */
  out.sort((a, b) => minX(a) - minX(b));
  CONTOURS = out;
  return out;
}

const minX = (l: readonly V3[]) => l.reduce((m, p) => Math.min(m, p[0]), Infinity);

/** Segments joined end to end into polylines (shared endpoints, rounded). */
function chain(segs: [V2, V2][]): V2[][] {
  const key = (p: V2) => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)}`;
  const at = new Map<string, number[]>();
  segs.forEach(([p, q], i) => {
    for (const k of [key(p), key(q)]) {
      const l = at.get(k);
      if (l) l.push(i);
      else at.set(k, [i]);
    }
  });
  const used = new Uint8Array(segs.length);
  const out: V2[][] = [];
  const next = (k: string): number => (at.get(k) ?? []).find((i) => !used[i]) ?? -1;
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const line: V2[] = [segs[s][0], segs[s][1]];
    for (const dir of [1, -1]) {
      for (;;) {
        const end = dir === 1 ? line[line.length - 1] : line[0];
        const i = next(key(end));
        if (i < 0) break;
        used[i] = 1;
        const [p, q] = segs[i];
        const other = key(p) === key(end) ? q : p;
        if (dir === 1) line.push(other);
        else line.unshift(other);
      }
    }
    out.push(line);
  }
  return out;
}

/* ── The cut faces ─────────────────────────────────────────────────────── */

/** Which of the footprint's edges face the eye at rest: their faces are drawn
 *  with strata; the others are behind the block and are not drawn at all. */
export function visibleEdges(): boolean[] {
  const eye = riverCameraPosition();
  return EDGES.map((e) => {
    const m: P3 = [(e.a[0] + e.b[0]) / 2, BLOCK.floor, (e.a[1] + e.b[1]) / 2];
    return facesEye([e.n[0], 0, e.n[1]], m, eye);
  });
}

/** The rim: the ground's own height walked round the footprint. */
export function rimLoop(): V3[] {
  const out: V3[] = [];
  for (const e of EDGES) {
    const n = Math.max(2, Math.ceil(Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) / 0.04));
    for (let i = 0; i < n; i++) {
      const x = lerp(e.a[0], e.b[0], i / n);
      const z = lerp(e.a[1], e.b[1], i / n);
      out.push([x, height(x, z), z]);
    }
  }
  out.push(out[0]);
  return out;
}

export const STRATA = { step: 0.12 } as const;

/** The block's visible edges, floor lines and strata, as segment pairs. */
export function faceLines(): { edges: V3[]; strata: V3[] } {
  const vis = visibleEdges();
  const edges: V3[] = [];
  const strata: V3[] = [];
  const f = BLOCK.floor;
  EDGES.forEach((e, k) => {
    if (!vis[k]) return;
    edges.push([e.a[0], f, e.a[1]], [e.b[0], f, e.b[1]]);
    const n = Math.max(8, Math.ceil(Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]) / 0.03));
    const prof: { x: number; z: number; h: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const x = lerp(e.a[0], e.b[0], i / n);
      const z = lerp(e.a[1], e.b[1], i / n);
      prof.push({ x, z, h: height(x, z) });
    }
    for (let y = f + STRATA.step; y < Math.max(...prof.map((p) => p.h)); y += STRATA.step) {
      let run: { x: number; z: number } | null = null;
      for (let i = 0; i <= n; i++) {
        const above = prof[i].h > y + 0.025;
        if (above && !run) run = prof[i];
        if ((!above || i === n) && run) {
          const end = above ? prof[i] : prof[i - 1];
          if (end !== run) strata.push([run.x, y, run.z], [end.x, y, end.z]);
          run = null;
        }
      }
    }
  });
  /* A vertical edge where two drawn faces meet, or where a drawn face ends. */
  FOOTPRINT.forEach((v, k) => {
    const prev = (k - 1 + EDGES.length) % EDGES.length;
    if (vis[k] || vis[prev]) edges.push([v[0], f, v[1]], [v[0], height(v[0], v[1]), v[1]]);
  });
  return { edges, strata };
}

/** The plinth's graduation, along the front long face's floor line. */
export function plinthTicks(): V3[] {
  const out: V3[] = [];
  const z = BLOCK.hz;
  const f = BLOCK.floor;
  const x0 = -BLOCK.hx + BLOCK.cut;
  for (let k = 0; ; k++) {
    const x = x0 + k * 0.2;
    if (x > BLOCK.hx + 1e-9) break;
    const l = k % 5 === 0 ? 0.11 : 0.05;
    out.push([x, f, z], [x, f + l, z]);
  }
  return out;
}

/* ── The plain ─────────────────────────────────────────────────────────── */

/** The plots: field lines between the channels and across them. Pairs, each
 *  run sampled so it rides the ground. */
export function plotLines(): V3[] {
  const out: V3[] = [];
  const ride = (p: V2, q: V2) => {
    const c = clipToFootprint(p, q);
    if (!c) return;
    const n = Math.max(2, Math.ceil(Math.hypot(c[1][0] - c[0][0], c[1][1] - c[0][1]) / 0.1));
    for (let i = 0; i < n; i++) {
      const a = lerp(c[0][0], c[1][0], i / n);
      const b = lerp(c[0][1], c[1][1], i / n);
      const a2 = lerp(c[0][0], c[1][0], (i + 1) / n);
      const b2 = lerp(c[0][1], c[1][1], (i + 1) / n);
      out.push([a, height(a, b) + 0.004, b], [a2, height(a2, b2) + 0.004, b2]);
    }
  };
  for (const z of [-1.2, -0.6, 0, 0.6, 1.2]) ride([FAN_END, z], [BLOCK.hx + 0.1, z]);
  for (let x = FAN_END; x <= BLOCK.hx + 1e-9; x += 0.36)
    ride([x, -BLOCK.hz - 0.1], [x, BLOCK.hz + 0.1]);
  return out;
}

/* ── The water ─────────────────────────────────────────────────────────── */

/** A course raised onto the water line. */
const onWater = (pts: readonly V2[], lift = 0.012): V3[] =>
  pts.map((p) => [p[0], height(p[0], p[1]) + lift, p[1]]);

export function mainLine(): V3[] {
  return onWater(courses().main);
}
export function tributaryLines(): V3[][] {
  return courses().tribs.map((t) => onWater(t));
}
export function channelLines(): V3[][] {
  return courses().channels.map((c) => onWater(c));
}

/* ── The gate and the markers ──────────────────────────────────────────── */

const GATE_R = 0.34;
const GATE_HALF = GATE_R;
/** How high the encode marker floats over the gate: clear of the block. */
export const MARKER_RISE = 1.05;

const gateFoot = () => height(GATE[0], GATE[1]);

/** A point on the arch, `deg` 0 at the right foot (+z), 180 at the left. */
function archPoint(r: number, deg: number): V3 {
  const th = (deg * Math.PI) / 180;
  return [GATE[0], gateFoot() + r * Math.sin(th), GATE[1] + r * Math.cos(th)];
}

/** The gate: ADR-080's collar as an arch over the river — an inner arc, a
 *  run of plates outside it, an outer arc, and teeth out from that. */
export function gateFrame(): V3[] {
  return Array.from({ length: 49 }, (_, i) => archPoint(GATE_R, (180 * i) / 48));
}

export function gateOuter(): V3[] {
  return Array.from({ length: 49 }, (_, i) => archPoint(GATE_R + 0.09, (180 * i) / 48));
}

/** The plates between the two arcs, and the teeth out from the outer one. Pairs. */
export function gateDetail(): V3[] {
  const out: V3[] = [];
  const plates = 7;
  for (let k = 0; k < plates; k++) {
    const a0 = (180 * k) / plates + 3;
    const a1 = (180 * (k + 1)) / plates - 3;
    for (let i = 0; i < 6; i++) {
      out.push(
        archPoint(GATE_R + 0.045, lerp(a0, a1, i / 6)),
        archPoint(GATE_R + 0.045, lerp(a0, a1, (i + 1) / 6))
      );
    }
  }
  for (let deg = 0; deg <= 180; deg += 7.5) {
    const l = Math.round(deg / 7.5) % 4 === 0 ? 0.07 : 0.035;
    out.push(archPoint(GATE_R + 0.09, deg), archPoint(GATE_R + 0.09 + l, deg));
  }
  return out;
}

/** The weir's sill across the water: gold, the encode itself. */
export function gateSill(): V3[] {
  const y = gateFoot() + 0.016;
  return [
    [GATE[0], y, -GATE_HALF + 0.03],
    [GATE[0], y, GATE_HALF - 0.03],
  ];
}

/** The stalk from the lintel up to the marker, dashed (pairs). */
export function gateStalk(): V3[] {
  const y0 = gateFoot() + GATE_R + 0.17;
  const y1 = gateFoot() + MARKER_RISE;
  const out: V3[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    out.push([GATE[0], lerp(y0, y1, i / n), 0], [GATE[0], lerp(y0, y1, (i + 0.5) / n), 0]);
  }
  return out;
}

/** holo.ui8's triangle, pointing down at the gate. */
export function gateMarker(): V3[] {
  const y = gateFoot() + MARKER_RISE;
  const x = GATE[0];
  return [
    [x - 0.08, y + 0.14, 0],
    [x + 0.08, y + 0.14, 0],
    [x, y, 0],
    [x - 0.08, y + 0.14, 0],
  ];
}

/** The source and the reticle that tracks it. */
export const SOURCE = MAIN_COURSE[0];
const RETICLE_RISE = 0.95;
export const RETICLE = { r: 0.12, inner: 0.04, arm: 0.08 } as const;

export function reticleCentre(): V3 {
  return [SOURCE[0], height(SOURCE[0], SOURCE[1]) + RETICLE_RISE, SOURCE[1]];
}

export function reticleLines(): V3[][] {
  const c = reticleCentre();
  const circle = (rr: number) =>
    Array.from({ length: 41 }, (_, i) => {
      const th = (i / 40) * TAU;
      return [c[0] + rr * Math.cos(th), c[1] + rr * Math.sin(th), c[2]] as V3;
    });
  const arms: V3[][] = [45, 135, 225, 315].map((deg) => {
    const th = (deg * Math.PI) / 180;
    const a = RETICLE.r + 0.02;
    const b = a + RETICLE.arm;
    return [
      [c[0] + a * Math.cos(th), c[1] + a * Math.sin(th), c[2]],
      [c[0] + b * Math.cos(th), c[1] + b * Math.sin(th), c[2]],
    ];
  });
  return [circle(RETICLE.r), circle(RETICLE.inner), ...arms];
}

/** The source's stalk, from the spring up to the reticle, dashed (pairs). */
export function sourceStalk(): V3[] {
  const y0 = height(SOURCE[0], SOURCE[1]) + 0.02;
  const y1 = reticleCentre()[1] - RETICLE.r;
  const out: V3[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    out.push(
      [SOURCE[0], lerp(y0, y1, i / n), SOURCE[1]],
      [SOURCE[0], lerp(y0, y1, (i + 0.5) / n), SOURCE[1]]
    );
  }
  return out;
}

/** The outlets: each channel's notch in the cut face (pairs). */
export function outletNotches(): V3[] {
  const out: V3[] = [];
  const x = BLOCK.hx;
  for (const z of CHANNEL_Z) {
    const top = height(x, z);
    const w = 0.05;
    const d = 0.05;
    out.push([x, top, z - w], [x, top - d, z - w]);
    out.push([x, top - d, z - w], [x, top - d, z + w]);
    out.push([x, top - d, z + w], [x, top, z + w]);
  }
  return out;
}

/** The block's shadow on the table below it, dashed. */
export function shadowLoop(): V3[] {
  const y = BLOCK.floor - 0.28;
  const pts = FOOTPRINT.map((p) => [p[0], y, p[1]] as V3);
  return [...pts, pts[0]];
}

/* ── The flow ──────────────────────────────────────────────────────────── */

/**
 * Four routes: the source and each tributary, down the river to the gate,
 * then out along one channel each. Motes run slowly to the gate and fast
 * after it, so they crowd on the meanders and space evenly on the channels.
 */
export const FLOW = { perRoute: 10, slow: 0.16, fast: 0.5 } as const;

export interface Route {
  points: V3[];
  /** Cumulative length at each point. */
  len: number[];
  /** Length to the gate. */
  toGate: number;
  period: number;
}

let ROUTES: Route[] | null = null;
export function flowRoutes(): Route[] {
  if (ROUTES) return ROUTES;
  const { main, tribs, channels } = courses();
  const entries: V2[][] = [
    main,
    ...tribs.map((t, k) => [...t, ...main.slice(TRIBUTARIES[k].join * PER + 1)]),
  ];
  ROUTES = entries.map((entry, k) => {
    const flat: V2[] = [...entry, ...channels[k].slice(1)];
    const points = onWater(flat, 0.03);
    const len = [0];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      len.push(len[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    const gi = entry.length - 1;
    const toGate = len[gi];
    const period = toGate / FLOW.slow + (len[len.length - 1] - toGate) / FLOW.fast;
    return { points, len, toGate, period };
  });
  return ROUTES;
}

/** A mote's point and fade on route `r` at time `tau` (s). */
export function flowAt(r: Route, tau: number): { p: V3; fade: number } {
  const T1 = r.toGate / FLOW.slow;
  const t = ((tau % r.period) + r.period) % r.period;
  const total = r.len[r.len.length - 1];
  const s = t < T1 ? t * FLOW.slow : r.toGate + (t - T1) * FLOW.fast;
  let i = 1;
  while (i < r.len.length - 1 && r.len[i] < s) i++;
  const a = r.points[i - 1];
  const b = r.points[i];
  const span = r.len[i] - r.len[i - 1] || 1;
  const u = Math.min(1, Math.max(0, (s - r.len[i - 1]) / span));
  const p: V3 = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const fade = smooth(0, 0.25, s) * (1 - smooth(total - 0.3, total, s));
  return { p, fade };
}

/* ── The words ─────────────────────────────────────────────────────────── */

export const RIVER_ANCHORS: Readonly<Record<"upstream" | "encode" | "downstream", V3>> = {
  upstream: reticleCentre(),
  encode: [GATE[0], gateFoot() + MARKER_RISE + 0.07, 0],
  downstream: [BLOCK.hx, (height(BLOCK.hx, 0) + BLOCK.floor) / 2, 0],
};

export function riverSeatWords(): { id: keyof typeof RIVER_ANCHORS; ax: number; at: number }[] {
  return (Object.keys(RIVER_ANCHORS) as (keyof typeof RIVER_ANCHORS)[]).map((id) => {
    const p = riverProject(RIVER_ANCHORS[id]);
    return { id, ax: p.x / RIVER_FRAME.w, at: p.y / RIVER_FRAME.h };
  });
}

/* ── The static drawing ────────────────────────────────────────────────── */

export type RiverRole = "structure" | "bright" | "gold" | "grid";

export interface RiverPolyline {
  id: string;
  points: readonly P3[];
  segments?: boolean;
  dashed?: boolean;
  role: RiverRole;
  width: number;
  opacity: number;
}

/** Every line the diorama draws, at rest. */
export function riverPolylines(): RiverPolyline[] {
  const out: RiverPolyline[] = [];
  out.push({
    id: "shadow",
    points: shadowLoop(),
    dashed: true,
    role: "grid",
    width: 0.8,
    opacity: 0.3,
  });
  const faces = faceLines();
  out.push({
    id: "strata",
    points: faces.strata,
    segments: true,
    role: "structure",
    width: 0.7,
    opacity: 0.28,
  });
  out.push({
    id: "plinth",
    points: plinthTicks(),
    segments: true,
    role: "structure",
    width: 0.7,
    opacity: 0.42,
  });
  out.push({
    id: "edges",
    points: faces.edges,
    segments: true,
    role: "structure",
    width: 1,
    opacity: 0.72,
  });
  out.push({ id: "rim", points: rimLoop(), role: "structure", width: 1.1, opacity: 0.85 });
  contourLines().forEach((l, k) =>
    out.push({ id: `contour-${k}`, points: l, role: "structure", width: 0.75, opacity: 0.5 })
  );
  out.push({
    id: "plots",
    points: plotLines(),
    segments: true,
    role: "structure",
    width: 0.75,
    opacity: 0.36,
  });
  tributaryLines().forEach((l, k) =>
    out.push({ id: `trib-${k}`, points: l, role: "gold", width: 1, opacity: 0.75 })
  );
  out.push({ id: "main", points: mainLine(), role: "gold", width: 1.6, opacity: 0.95 });
  channelLines().forEach((l, k) =>
    out.push({ id: `channel-${k}`, points: l, role: "gold", width: 1.3, opacity: 0.95 })
  );
  out.push({
    id: "outlets",
    points: outletNotches(),
    segments: true,
    role: "structure",
    width: 0.9,
    opacity: 0.7,
  });
  out.push({ id: "gate", points: gateFrame(), role: "bright", width: 1.2, opacity: 0.95 });
  out.push({ id: "gate-outer", points: gateOuter(), role: "structure", width: 1, opacity: 0.8 });
  out.push({
    id: "gate-detail",
    points: gateDetail(),
    segments: true,
    role: "structure",
    width: 0.9,
    opacity: 0.7,
  });
  out.push({ id: "sill", points: gateSill(), role: "gold", width: 2.6, opacity: 1 });
  out.push({
    id: "gate-stalk",
    points: gateStalk(),
    segments: true,
    role: "structure",
    width: 0.8,
    opacity: 0.6,
  });
  out.push({ id: "gate-marker", points: gateMarker(), role: "bright", width: 1.2, opacity: 0.95 });
  out.push({
    id: "source-stalk",
    points: sourceStalk(),
    segments: true,
    role: "structure",
    width: 0.8,
    opacity: 0.6,
  });
  reticleLines().forEach((l, k) =>
    out.push({ id: `reticle-${k}`, points: l, role: "structure", width: 0.9, opacity: 0.85 })
  );
  return out;
}

const r1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** The static drawing as markup, one `<g>` per role (the sheet colours each). */
export function riverSvgMarkup(className: string): string {
  const byRole = new Map<RiverRole, string[]>();
  for (const l of riverPolylines()) {
    const pts = l.points.map((p) => riverProject(p));
    let d = "";
    if (l.segments) {
      for (let i = 0; i + 1 < pts.length; i += 2) {
        d += `M${r1(pts[i].x)} ${r1(pts[i].y)}L${r1(pts[i + 1].x)} ${r1(pts[i + 1].y)}`;
      }
    } else {
      d = pts.map((q, i) => `${i === 0 ? "M" : "L"}${r1(q.x)} ${r1(q.y)}`).join("");
    }
    const dash = l.dashed ? ' stroke-dasharray="3 4"' : "";
    const path = `<path d="${d}" stroke-width="${l.width}" stroke-opacity="${Math.round(l.opacity * 1000) / 1000}"${dash}/>`;
    const list = byRole.get(l.role) ?? [];
    list.push(path);
    byRole.set(l.role, list);
  }
  const groups = [...byRole.entries()]
    .map(([role, paths]) => `<g data-role="${role}">${paths.join("")}</g>`)
    .join("");
  return `<svg class="${className}" viewBox="0 0 ${RIVER_FRAME.w} ${RIVER_FRAME.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${groups}</svg>`;
}

/** Where the drawing runs across the frame, as fractions (the phone's crop). */
export function riverContentSpan(): { x0: number; x1: number } {
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const l of riverPolylines()) {
    if (l.role === "grid") continue;
    for (const p of l.points) {
      const q = riverProject(p);
      x0 = Math.min(x0, q.x);
      x1 = Math.max(x1, q.x);
    }
  }
  return { x0: x0 / RIVER_FRAME.w, x1: x1 / RIVER_FRAME.w };
}
