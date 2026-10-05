/**
 * equilibriumGeom — the workshop opener's holographic object (ADR-143 U7),
 * as data.
 *
 * ⚠ ONE INSTRUMENT ON ONE AXIS, READ LEFT TO RIGHT (owner, 2026-10-04: "shapes
 * that are closer to the holo and the one we had already created … I don't
 * want the sphere and orbit"). Two cuts were refused: a binary star on the
 * orthographic stage (a technical drawing), then a contour sphere between two
 * ring systems (an atom). This is the two references' own vocabulary instead:
 *
 *   THOUGHT  holo.ui8's crumpled contour mass: slices of a lumpy body, alive,
 *            its outline drifting. It tapers and calms as it nears the gate.
 *   ENCODE   ADR-080's plated collar, in gold, with the Thoughtform
 *            brandmark seated inside it (U10): a ring of plates, a toothed
 *            fringe, a fulcrum under it on a level bar. The balance point the
 *            whole instrument rests on, and it is the mark.
 *   FORM     ADR-080's coaxial ring stack: identical toothed rings at one
 *            pitch along the axis, receding into depth. Work that runs.
 *
 * Gold motes drift through the thought, find the axis as it calms, pass the
 * gate and run down the stack at one rhythm: what works upstream is encoded
 * and runs downstream.
 *
 * ⚠ THREE-FREE AND PURE. The canvas builds its geometry from here; the route
 * renders the static drawing and seats the DOM words from the SAME numbers,
 * projected through the same rest camera (`eqProject`), so the fallback and
 * the hologram at rest are one picture and the swap moves nothing.
 *
 * World axes are three's: `y` up, the axis along `x`, the gate on the origin.
 */

import { BRANDMARK_VIEWBOX, brandmarkPolylines } from "@/lib/brandmark/brandmarkPaths";

import { cameraBasis, cameraPosition, type EqCamBasis, projectThrough } from "./eqCamera";
import { mulberry32 } from "./holoProgramGeom";

export type P3 = readonly [number, number, number];
type V = [number, number, number];

const RAD = Math.PI / 180;
const TAU = Math.PI * 2;
const add = (p: P3, q: P3): V => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const sub = (p: P3, q: P3): V => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const mul = (p: P3, s: number): V => [p[0] * s, p[1] * s, p[2] * s];
const dot = (p: P3, q: P3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const unit = (p: P3): V => mul(p, 1 / (Math.hypot(p[0], p[1], p[2]) || 1));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ── The frame and the camera ──────────────────────────────────────────── */

/** The figure box's aspect, in px at the reference width. The canvas fills a
 *  box of this aspect, so the rest projection here is the canvas's. */
export const EQ_FRAME = { w: 1100, h: 500 } as const;

/** The rest pose: from the front LEFT, a little above, so the axis recedes to
 *  the right — the thought near and large, the stack running off into depth
 *  (ADR-080's own negative yaw). A long lens, so the depth reads as a
 *  recession and not as a fisheye. Three's `fov` is VERTICAL (ADR-080 U3). */
export const EQ_CAMERA = { azimuthDeg: -46, elevationDeg: 12, distance: 12.4, fovDeg: 22 } as const;

/** How far the reader may turn it (degrees). ALL THE WAY ROUND (owner,
 *  2026-10-04: "make sure we can rotate it 360"): an infinite azimuth is a
 *  free turn. The tilt stays a band either side of rest, so it is never seen
 *  from under its own floor. */
export const EQ_DRAG = { azimuthDeg: Infinity, polarDeg: 16 } as const;

export function eqCameraPosition(): V {
  return cameraPosition(EQ_CAMERA);
}

/** The rest camera's basis, exactly as three's `lookAt(0,0,0)` with `y` up. */
export function eqCameraBasis(eye: V = eqCameraPosition()): EqCamBasis {
  return cameraBasis(eye);
}

/** A world point on the frame at rest, in the frame's px. */
export function eqProject(
  p: P3,
  frame: { w: number; h: number } = EQ_FRAME,
  cam: EqCamBasis = eqCameraBasis()
): { x: number; y: number; depth: number } {
  return projectThrough(p, frame, EQ_CAMERA.fovDeg, cam);
}

/** A circle round the axis at `x`, in the plane facing it. `θ` 0 is the top
 *  (+y), 90 the side toward the viewer (+z). */
export function axisRing(x: number, r: number, n = 160, from = 0, to = 360): V[] {
  const out: V[] = [];
  const steps = Math.max(2, Math.round((n * Math.abs(to - from)) / 360));
  for (let i = 0; i <= steps; i++) {
    const th = (from + ((to - from) * i) / steps) * RAD;
    out.push([x, r * Math.cos(th), r * Math.sin(th)]);
  }
  return out;
}

/** A toothed fringe round the axis at `x` — ADR-080's tick ring: a tooth every
 *  `step` degrees out from `r`, every `majorEvery`th one longer. Pairs. */
export function axisTeeth(
  x: number,
  r: number,
  step: number,
  len: number,
  majorEvery: number,
  arcs: readonly (readonly [number, number])[] = [[0, 360]]
): V[] {
  const out: V[] = [];
  for (const [from, to] of arcs) {
    let k = 0;
    for (let deg = from; deg < to - 1e-6; deg += step, k++) {
      const major = majorEvery > 0 && k % majorEvery === 0;
      const l = major ? len * 1.8 : len;
      const th = deg * RAD;
      out.push([x, r * Math.cos(th), r * Math.sin(th)]);
      out.push([x, (r + l) * Math.cos(th), (r + l) * Math.sin(th)]);
    }
  }
  return out;
}

/* ── THOUGHT: the contour mass ─────────────────────────────────────────── */

/**
 * The thought: slices of a lumpy body, each a closed outline in the plane
 * facing the axis. Its girth swells, then narrows toward the gate, and its
 * crumple calms there: the thought settling toward form.
 * `t` (seconds) drifts the wobble's phases — the mass is alive, the stack
 * never moves — and is 0 for the static drawing.
 */
export const EQ_THOUGHT = { x0: -3.0, x1: -1.2, slices: 14, segments: 96 } as const;

/** Girth along the mass, `u` 0 (far tip) → 1 (gate end). */
export function thoughtGirth(u: number): number {
  const swell = Math.pow(Math.sin(Math.PI * (0.08 + 0.78 * u)), 0.62);
  return 0.3 + 0.7 * swell * (1 + 0.08 * Math.sin(5.1 * u + 0.6)) - 0.08 * smooth(0.7, 1, u);
}

/** How crumpled a slice is, `u` 0 → 1: calm at the gate end. */
export function thoughtWobble(u: number): number {
  return 1 - 0.78 * smooth(0.42, 1, u);
}

const WAVES = [
  { k: 2, a: 0.15, ph: 1.1, du: 2.6, w: 0.11 },
  { k: 3, a: 0.1, ph: -0.7, du: 3.4, w: -0.08 },
  { k: 5, a: 0.06, ph: 2.2, du: -4.3, w: 0.14 },
  { k: 7, a: 0.035, ph: 0.4, du: 5.6, w: -0.17 },
] as const;

/** One slice's frame at `u`: where it sits, its girth, its crumple, and its
 *  centre (the body's spine wanders a little, so it is lumpy, not turned). */
export function thoughtSlice(u: number): {
  x: number;
  R: number;
  A: number;
  cy: number;
  cz: number;
} {
  const { x0, x1 } = EQ_THOUGHT;
  const A = thoughtWobble(u);
  return {
    x: x0 + (x1 - x0) * u,
    R: thoughtGirth(u),
    A,
    cy: 0.1 * Math.sin(2.2 * u + 0.4) * A,
    cz: 0.09 * Math.cos(1.9 * u + 1.2) * A,
  };
}

/** The outline's radius factor at angle `th` on slice `u`, at time `t`. */
export function thoughtWob(th: number, u: number, t: number): number {
  let wob = 0;
  for (const w of WAVES) wob += w.a * Math.sin(w.k * th + w.ph + w.du * u + w.w * t);
  return wob;
}

export function thoughtSlices(t = 0): V[][] {
  const out: V[][] = [];
  const { slices, segments } = EQ_THOUGHT;
  for (let s = 0; s < slices; s++) {
    const u = s / (slices - 1);
    const f = thoughtSlice(u);
    const ring: V[] = [];
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * TAU;
      const r = f.R * (1 + f.A * thoughtWob(th, u, t));
      ring.push([f.x, f.cy + r * Math.cos(th), f.cz + r * Math.sin(th)]);
    }
    out.push(ring);
  }
  return out;
}

/** The slices AND the islands as segment pairs, written into `out` in place —
 *  the live mass drifts every frame, and a frame may not allocate. Returns
 *  the vertex count written. Same numbers as `thoughtSlices` /
 *  `thoughtIslands`, so the drawing at `t` 0 is the static one. */
export function fillThoughtSegments(t: number, out: Float32Array): number {
  const { slices, segments } = EQ_THOUGHT;
  let o = 0;
  const put = (x: number, y: number, z: number) => {
    out[o++] = x;
    out[o++] = y;
    out[o++] = z;
  };
  for (let s = 0; s < slices; s++) {
    const u = s / (slices - 1);
    const f = thoughtSlice(u);
    let px = 0;
    let py = 0;
    let pz = 0;
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * TAU;
      const r = f.R * (1 + f.A * thoughtWob(th, u, t));
      const y = f.cy + r * Math.cos(th);
      const z = f.cz + r * Math.sin(th);
      if (i > 0) {
        put(px, py, pz);
        put(f.x, y, z);
      }
      px = f.x;
      py = y;
      pz = z;
    }
  }
  for (const loop of thoughtIslands(t)) {
    for (let i = 0; i + 1 < loop.length; i++) {
      put(...loop[i]);
      put(...loop[i + 1]);
    }
  }
  return o / 3;
}

/** How many vertices `fillThoughtSegments` writes. */
export function thoughtVertCount(): number {
  return EQ_THOUGHT.slices * EQ_THOUGHT.segments * 2 + EQ_ISLANDS.length * ISLAND_STEPS * 2;
}

/** Small closed loops inside a few slices — holo.ui8's islands, the kinks a
 *  half-formed idea still has. Calm slices carry none. */
const ISLAND_STEPS = 40;

export const EQ_ISLANDS = [
  { slice: 3, at: 128, off: 0.46, r: 0.12, flat: 0.62 },
  { slice: 6, at: 300, off: 0.52, r: 0.15, flat: 0.55 },
  { slice: 8, at: 40, off: 0.4, r: 0.1, flat: 0.7 },
] as const;

export function thoughtIslands(t = 0): V[][] {
  const { x0, x1, slices } = EQ_THOUGHT;
  return EQ_ISLANDS.map((isl) => {
    const u = isl.slice / (slices - 1);
    const x = x0 + (x1 - x0) * u;
    const R = thoughtGirth(u);
    const a = (isl.at + 9 * Math.sin(0.07 * t + isl.slice)) * RAD;
    const cy = Math.cos(a) * R * isl.off;
    const cz = Math.sin(a) * R * isl.off;
    const ring: V[] = [];
    for (let i = 0; i <= ISLAND_STEPS; i++) {
      const th = (i / ISLAND_STEPS) * TAU;
      ring.push([x, cy + isl.r * Math.cos(th), cz + isl.r * isl.flat * Math.sin(th)]);
    }
    return ring;
  });
}

/**
 * The cradle the thought is studied in: holo.ui8's large graduated ring, as
 * two partial arcs in a plane leaning away from the slices', a tick band on
 * each, and one bright arc — the reference's highlight, in dawn.
 */
export const EQ_CRADLE = {
  centre: [-2.1, 0.04, 0] as V,
  r: 1.36,
  arcs: [
    [-28, 118],
    [158, 262],
  ] as const,
  ticks: { step: 3, len: 0.05, majorEvery: 6, inset: 0.07 },
  bright: { from: 196, span: 48 },
} as const;

/** The cradle's plane: leaning back and over, so its ellipse crosses the
 *  slices' rather than repeating them. */
export function cradleBasis(): { e1: V; e2: V } {
  const e1 = unit([0.34, 0.94, -0.06]);
  const raw: V = [0.78, -0.22, 0.58];
  const e2 = unit(sub(raw, mul(e1, dot(raw, e1))));
  return { e1, e2 };
}

export function cradlePoint(r: number, deg: number): V {
  const { e1, e2 } = cradleBasis();
  const th = deg * RAD;
  return add(EQ_CRADLE.centre, add(mul(e1, r * Math.cos(th)), mul(e2, r * Math.sin(th))));
}

export function cradleArc(r: number, from: number, to: number, n = 200): V[] {
  const steps = Math.max(2, Math.round((n * Math.abs(to - from)) / 360));
  return Array.from({ length: steps + 1 }, (_, i) =>
    cradlePoint(r, from + ((to - from) * i) / steps)
  );
}

export function cradleTicks(): V[] {
  const out: V[] = [];
  const { r, arcs, ticks } = EQ_CRADLE;
  for (const [from, to] of arcs) {
    let k = 0;
    for (let deg = from; deg <= to + 1e-6; deg += ticks.step, k++) {
      const l = k % ticks.majorEvery === 0 ? ticks.len * 1.9 : ticks.len;
      out.push(cradlePoint(r - ticks.inset, deg), cradlePoint(r - ticks.inset - l, deg));
    }
  }
  return out;
}

/* ── ENCODE: the gate ──────────────────────────────────────────────────── */

/** The gate on the origin: a gold inner ring, a ring of plates, an outer
 *  ring, a toothed fringe, a marker above, and the brandmark inside it. */
export const EQ_GATE = {
  x: 0,
  inner: 1.02,
  plates: { r: 1.12, sides: 14, fill: 0.78 },
  outer: 1.22,
  teeth: { step: 3, len: 0.055, majorEvery: 5 },
  /** The gold highlight gliding round the inner ring. */
  arc: { span: 44, start: 34, speed: 0.06 },
} as const;

export function gatePlates(): V[] {
  const { x, plates } = EQ_GATE;
  const out: V[] = [];
  const step = 360 / plates.sides;
  for (let i = 0; i < plates.sides; i++) {
    const a0 = i * step + step * 0.11;
    out.push(...axisRing(x, plates.r, 160, a0, a0 + step * plates.fill));
  }
  return out;
}

/** The plates as pairs of points, for a segments buffer. */
export function gatePlateSegments(): V[] {
  const { x, plates } = EQ_GATE;
  const out: V[] = [];
  const step = 360 / plates.sides;
  for (let i = 0; i < plates.sides; i++) {
    const a0 = i * step + step * 0.11;
    const run = axisRing(x, plates.r, 160, a0, a0 + step * plates.fill);
    for (let k = 0; k + 1 < run.length; k++) out.push(run[k], run[k + 1]);
  }
  return out;
}

/**
 * The brandmark seated in the gate (owner, 2026-10-04: "put the brandmark
 * inside the gold gate"): ENCODE is the mark. Live it is the corridor's own
 * volumetric mark (`VolumetricBrandmarkArtifact`, ADR-080's centre); here it
 * is the same mark as an outline in the gate's plane, for the static drawing.
 * `half` is its half-height in the world, inside the gold ring's 1.02.
 */
export const EQ_MARK = { half: 0.74 } as const;

/** The mark's outline in the gate's plane, facing upstream (the rest camera's
 *  side): the viewBox's right runs along +z, its up along +y. */
export function markLines(): V[][] {
  const { w, h } = BRANDMARK_VIEWBOX;
  const s = (2 * EQ_MARK.half) / h;
  return brandmarkPolylines(4).map((line) =>
    line.map(([u, v]) => [EQ_GATE.x, -(v - h / 2) * s, (u - w / 2) * s] as V)
  );
}

/** The marker above the gate: holo.ui8's triangle, pointing at the axis. */
export function gateMarker(): V[] {
  const top = EQ_GATE.outer + 0.2;
  return [
    [-0.08, top + 0.13, 0],
    [0.08, top + 0.13, 0],
    [0, top, 0],
    [-0.08, top + 0.13, 0],
  ];
}

/** The floor the instrument stands on, faint and wide, fading to its rim. */
export const EQ_FLOOR = { y: -1.62, x0: -5.4, x1: 5.6, z0: -3.4, z1: 3, pitch: 0.5, alpha: 0.08 };

/** The level under the gate: holo.ui8's bar with its lit segment centred, and
 *  the fulcrum standing on it, pointing up at the gate. */
export const EQ_LEVEL = { y: EQ_FLOOR.y + 0.02, half: 0.62, h: 0.07, lit: 0.13, fulcrum: 0.16 };

export function levelBar(): V[] {
  const { y, half, h } = EQ_LEVEL;
  return [
    [-half, y, 0],
    [half, y, 0],
    [half, y + h, 0],
    [-half, y + h, 0],
    [-half, y, 0],
  ];
}

/** The lit segment, as three runs filling the bar's middle. */
export function levelLit(): V[][] {
  const { y, h, lit } = EQ_LEVEL;
  return [0.22, 0.5, 0.78].map((f) => [
    [-lit, y + h * f, 0],
    [lit, y + h * f, 0],
  ]);
}

export function levelFulcrum(): V[] {
  const { y, h, fulcrum } = EQ_LEVEL;
  const base = y + h + 0.03;
  return [
    [-fulcrum * 0.6, base, 0],
    [fulcrum * 0.6, base, 0],
    [0, base + fulcrum, 0],
    [-fulcrum * 0.6, base, 0],
  ];
}

/* ── FORM: the stack ───────────────────────────────────────────────────── */

/** Identical rings at one pitch, receding: every other one toothed, the rest
 *  carrying a dashed inner ring. Two rails tie them into one body. */
export const EQ_STACK = {
  x0: 1.0,
  pitch: 0.6,
  count: 7,
  r: 0.78,
  inner: 0.68,
  teeth: { step: 6, len: 0.05, majorEvery: 5 },
} as const;

export const stackX = (i: number) => EQ_STACK.x0 + i * EQ_STACK.pitch;
export const STACK_END = stackX(EQ_STACK.count - 1);

/** The dashed inner rings as pairs (every other segment of a 120-step ring). */
export function stackDashes(i: number): V[] {
  const ring = axisRing(stackX(i), EQ_STACK.inner, 120);
  const out: V[] = [];
  for (let k = 0; k + 1 < ring.length; k += 2) out.push(ring[k], ring[k + 1]);
  return out;
}

/** The two rails along the stack's top and bottom. */
export function stackRails(): V[][] {
  const { r } = EQ_STACK;
  return [r, -r].map((y) => [
    [EQ_STACK.x0, y, 0],
    [STACK_END, y, 0],
  ]);
}

/** The ruler under the stack: a tick at every ring and three between, down
 *  from the bottom rail — the pace the work runs at, measured. Pairs. */
export function stackRuler(): V[] {
  const out: V[] = [];
  const y = -EQ_STACK.r;
  const steps = (EQ_STACK.count - 1) * 4;
  for (let k = 0; k <= steps; k++) {
    const x = EQ_STACK.x0 + (k * EQ_STACK.pitch) / 4;
    const l = k % 4 === 0 ? 0.1 : 0.045;
    out.push([x, y, 0], [x, y - l, 0]);
  }
  return out;
}

/* ── The flow ──────────────────────────────────────────────────────────── */

/** The axis: gold from where the thought calms to past the stack's last ring,
 *  broken through the gate (`gap` either side), where the mark is. */
export const EQ_AXIS = { x0: EQ_THOUGHT.x1 - 0.06, x1: STACK_END + 0.34, gap: 0.62 } as const;

/**
 * The motes: they drift slowly through the thought, wandering off the axis,
 * find it as the mass calms, then run down the stack at a steady pace. A
 * phase `τ` in seconds maps to a point; the slow upstream leg is what crowds
 * the motes there and spaces them evenly downstream.
 */
export const EQ_FLOW = {
  count: 20,
  x0: EQ_THOUGHT.x0 + 0.25,
  slow: 0.15,
  fast: 0.42,
  /** Wander off the axis, as a fraction of the thought's girth. */
  wander: 0.5,
} as const;

const UP_LEN = EQ_GATE.x - EQ_FLOW.x0;
const DOWN_LEN = EQ_AXIS.x1 - EQ_GATE.x;
export const FLOW_PERIOD = UP_LEN / EQ_FLOW.slow + DOWN_LEN / EQ_FLOW.fast;

/** A mote's point and fade (0 at the two ends, 1 between) at phase `τ` (s),
 *  with its own seed `k` for the wander. */
export function flowPoint(tau: number, k: number): { p: V; fade: number } {
  const T1 = UP_LEN / EQ_FLOW.slow;
  const s = ((tau % FLOW_PERIOD) + FLOW_PERIOD) % FLOW_PERIOD;
  const x = s < T1 ? EQ_FLOW.x0 + s * EQ_FLOW.slow : EQ_GATE.x + (s - T1) * EQ_FLOW.fast;
  /* Wander only inside the thought, dying out as the mass calms. */
  const u = Math.min(1, Math.max(0, (x - EQ_THOUGHT.x0) / (EQ_THOUGHT.x1 - EQ_THOUGHT.x0)));
  const amp = x < EQ_THOUGHT.x1 ? EQ_FLOW.wander * thoughtGirth(u) * (1 - smooth(0.55, 1, u)) : 0;
  const a = k * 2.399 + s * 0.31;
  const p: V = [x, amp * Math.cos(a) * 0.9, amp * Math.sin(a * 1.3)];
  const fade =
    smooth(EQ_FLOW.x0, EQ_FLOW.x0 + 0.35, x) * (1 - smooth(EQ_AXIS.x1 - 0.4, EQ_AXIS.x1, x));
  return { p, fade };
}

/* ── The floor and the dust ────────────────────────────────────────────── */

/** Floor segments with each one's fade (0..1), one grid cell long. */
export function floorSegments(): { a: V; b: V; fade: number }[] {
  const out: { a: V; b: V; fade: number }[] = [];
  const { y, x0, x1, z0, z1, pitch } = EQ_FLOOR;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const hx = (x1 - x0) / 2;
  const hz = (z1 - z0) / 2;
  const nx = Math.round((x1 - x0) / pitch);
  const nz = Math.round((z1 - z0) / pitch);
  const push = (a: V, b: V) => {
    const m = mul(add(a, b), 0.5);
    const r = Math.hypot((m[0] - cx) / hx, (m[2] - cz) / hz);
    const fade = Math.max(0, 1 - r * r);
    if (fade > 0.03) out.push({ a, b, fade });
  };
  for (let i = 0; i <= nz; i++) {
    const z = z0 + i * pitch;
    for (let j = 0; j < nx; j++) push([x0 + j * pitch, y, z], [x0 + (j + 1) * pitch, y, z]);
  }
  for (let j = 0; j <= nx; j++) {
    const x = x0 + j * pitch;
    for (let i = 0; i < nz; i++) push([x, y, z0 + i * pitch], [x, y, z0 + (i + 1) * pitch]);
  }
  return out;
}

/** Seeded dust in a long shell round the instrument: fine and dense, as
 *  holo.ui8's field is. */
export function eqDust(count = 900, seed = 4821): V[] {
  const rnd = mulberry32(seed);
  const out: V[] = [];
  while (out.length < count) {
    const x = rnd() * 2 - 1;
    const y = rnd() * 2 - 1;
    const z = rnd() * 2 - 1;
    const l = Math.hypot(x, y, z);
    if (l > 1 || l < 0.3) continue;
    out.push([0.4 + x * 5.6, y * 2.4, z * 3.4]);
  }
  return out;
}

/**
 * Bokeh: a few large, soft, out-of-focus discs round the instrument, as
 * holo.ui8 carries — some between the eye and the object, most beyond it, so
 * they part as the reader turns it. Seeded; `size` in CSS px at rest depth.
 */
export function eqBokeh(
  count = 12,
  seed = 9157
): { p: V; size: number; alpha: number; gold: boolean }[] {
  const rnd = mulberry32(seed);
  const out: { p: V; size: number; alpha: number; gold: boolean }[] = [];
  while (out.length < count) {
    const a = rnd() * TAU;
    /* Close enough round the object to stay inside the frame from any side,
       and above the floor, so none sits on the frame's lower edge. */
    const r = 3.6 + rnd() * 2.4;
    const y = -0.4 + rnd() * 2.2;
    out.push({
      p: [0.4 + Math.cos(a) * r * 1.2, y, Math.sin(a) * r * 0.8],
      size: 34 + rnd() * 56,
      alpha: 0.03 + rnd() * 0.045,
      gold: rnd() < 0.6,
    });
  }
  return out;
}

/* ── The words ─────────────────────────────────────────────────────────── */

/** A point on the thought's own outline: slice `u`, at `deg` round it. */
export function thoughtPoint(u: number, deg: number, t = 0): V {
  const f = thoughtSlice(u);
  const th = deg * RAD;
  const r = f.R * (1 + f.A * thoughtWob(th, u, t));
  return [f.x, f.cy + r * Math.cos(th), f.cz + r * Math.sin(th)];
}

/** What each word TRACKS, as holo.ui8's trackers do: a point on the object,
 *  bracketed, its readout above it. The thought's crown, the marker over the
 *  gate, the far ring's top. The order is the reading order, which is the
 *  phone's list order too. */
export const EQ_ANCHORS: Readonly<Record<"upstream" | "encode" | "downstream", V>> = {
  upstream: thoughtPoint(0.42, -8),
  encode: [0, EQ_GATE.outer + 0.27, 0],
  downstream: [STACK_END, EQ_STACK.r, 0],
};

/** The words' seats at rest, as fractions of the frame. */
export function seatWords(): { id: keyof typeof EQ_ANCHORS; ax: number; at: number }[] {
  return (Object.keys(EQ_ANCHORS) as (keyof typeof EQ_ANCHORS)[]).map((id) => {
    const p = eqProject(EQ_ANCHORS[id]);
    return { id, ax: p.x / EQ_FRAME.w, at: p.y / EQ_FRAME.h };
  });
}

/* ── The static drawing ────────────────────────────────────────────────── */

export type EqRole = "structure" | "bright" | "gold" | "grid";

export interface EqPolyline {
  id: string;
  /** World points; `segments` lines are drawn pair by pair. */
  points: readonly P3[];
  segments?: boolean;
  dashed?: boolean;
  role: EqRole;
  width: number;
  opacity: number;
}

/** Every line the object draws, in the world, at rest. */
export function eqPolylines(): EqPolyline[] {
  const out: EqPolyline[] = [];
  for (const s of floorSegments()) {
    out.push({
      id: "floor",
      points: [s.a, s.b],
      role: "grid",
      width: 0.8,
      opacity: EQ_FLOOR.alpha * s.fade,
    });
  }

  /* Thought. */
  thoughtSlices().forEach((slice, k) =>
    out.push({ id: `thought-${k}`, points: slice, role: "structure", width: 0.9, opacity: 0.66 })
  );
  thoughtIslands().forEach((loop, k) =>
    out.push({ id: `island-${k}`, points: loop, role: "structure", width: 0.8, opacity: 0.5 })
  );
  EQ_CRADLE.arcs.forEach(([from, to], k) =>
    out.push({
      id: `cradle-${k}`,
      points: cradleArc(EQ_CRADLE.r, from, to),
      role: "structure",
      width: 1,
      opacity: 0.55,
    })
  );
  out.push({
    id: "cradle-ticks",
    points: cradleTicks(),
    segments: true,
    role: "structure",
    width: 0.8,
    opacity: 0.42,
  });
  out.push({
    id: "cradle-bright",
    points: cradleArc(
      EQ_CRADLE.r,
      EQ_CRADLE.bright.from,
      EQ_CRADLE.bright.from + EQ_CRADLE.bright.span
    ),
    role: "bright",
    width: 2.4,
    opacity: 1,
  });
  /* Encode. */
  out.push({
    id: "gate-ring",
    points: axisRing(EQ_GATE.x, EQ_GATE.inner, 220),
    role: "gold",
    width: 1.2,
    opacity: 0.9,
  });
  out.push({
    id: "gate-arc",
    points: axisRing(
      EQ_GATE.x,
      EQ_GATE.inner,
      220,
      EQ_GATE.arc.start,
      EQ_GATE.arc.start + EQ_GATE.arc.span
    ),
    role: "gold",
    width: 2.6,
    opacity: 1,
  });
  out.push({
    id: "gate-plates",
    points: gatePlateSegments(),
    segments: true,
    role: "structure",
    width: 1.6,
    opacity: 0.62,
  });
  out.push({
    id: "gate-outer",
    points: axisRing(EQ_GATE.x, EQ_GATE.outer, 220),
    role: "structure",
    width: 1,
    opacity: 0.75,
  });
  out.push({
    id: "gate-teeth",
    points: axisTeeth(
      EQ_GATE.x,
      EQ_GATE.outer,
      EQ_GATE.teeth.step,
      EQ_GATE.teeth.len,
      EQ_GATE.teeth.majorEvery
    ),
    segments: true,
    role: "structure",
    width: 0.8,
    opacity: 0.5,
  });
  markLines().forEach((l) =>
    out.push({ id: "mark", points: l, role: "gold", width: 1.1, opacity: 0.95 })
  );
  out.push({ id: "gate-marker", points: gateMarker(), role: "bright", width: 1.2, opacity: 0.95 });
  out.push({ id: "level-bar", points: levelBar(), role: "structure", width: 0.9, opacity: 0.7 });
  levelLit().forEach((l, k) =>
    out.push({ id: `level-lit-${k}`, points: l, role: "bright", width: 1.4, opacity: 1 })
  );
  out.push({
    id: "level-fulcrum",
    points: levelFulcrum(),
    role: "bright",
    width: 1.1,
    opacity: 0.9,
  });

  /* Form. */
  for (let i = 0; i < EQ_STACK.count; i++) {
    const x = stackX(i);
    out.push({
      id: `stack-${i}`,
      points: axisRing(x, EQ_STACK.r, 140),
      role: "structure",
      width: 1,
      opacity: 0.82,
    });
    if (i % 2 === 0) {
      out.push({
        id: `stack-teeth-${i}`,
        points: axisTeeth(
          x,
          EQ_STACK.r,
          EQ_STACK.teeth.step,
          EQ_STACK.teeth.len,
          EQ_STACK.teeth.majorEvery
        ),
        segments: true,
        role: "structure",
        width: 0.8,
        opacity: 0.46,
      });
    } else {
      out.push({
        id: `stack-dash-${i}`,
        points: stackDashes(i),
        segments: true,
        role: "structure",
        width: 0.8,
        opacity: 0.42,
      });
    }
  }
  stackRails().forEach((l, k) =>
    out.push({ id: `rail-${k}`, points: l, role: "structure", width: 0.8, opacity: 0.32 })
  );
  out.push({
    id: "stack-ruler",
    points: stackRuler(),
    segments: true,
    role: "structure",
    width: 0.8,
    opacity: 0.46,
  });
  out.push({
    id: "axis",
    points: [
      [EQ_AXIS.x0, 0, 0],
      [-EQ_AXIS.gap, 0, 0],
      [EQ_AXIS.gap, 0, 0],
      [EQ_AXIS.x1, 0, 0],
    ],
    segments: true,
    role: "gold",
    width: 1,
    opacity: 0.6,
  });
  return out;
}

const r1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** The static drawing as markup: one `<g>` per role, so the sheet colours each
 *  from the theme's own tokens. */
export function eqSvgMarkup(className: string): string {
  const byRole = new Map<EqRole, string[]>();
  for (const l of eqPolylines()) {
    /* No floor on the page (ADR-143 U11): the canvas draws none, and the
       static drawing is what it lands on, so the swap moves nothing. */
    if (l.role === "grid") continue;
    const pts = l.points.map((p) => eqProject(p));
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
  return `<svg class="${className}" viewBox="0 0 ${EQ_FRAME.w} ${EQ_FRAME.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${groups}</svg>`;
}

/** Where the drawing (not the floor) runs across the frame, as fractions —
 *  what a phone crops the static figure to. */
export function eqContentSpan(): { x0: number; x1: number } {
  let x0 = Infinity;
  let x1 = -Infinity;
  for (const l of eqPolylines()) {
    if (l.role === "grid") continue;
    for (const p of l.points) {
      const q = eqProject(p);
      x0 = Math.min(x0, q.x);
      x1 = Math.max(x1, q.x);
    }
  }
  return { x0: x0 / EQ_FRAME.w, x1: x1 / EQ_FRAME.w };
}
