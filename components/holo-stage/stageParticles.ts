/**
 * stageParticles — the hologram's MATERIAL (ADR-140, round three).
 *
 * ⚠ PURE AND THREE-FREE. A figure is POPULATIONS of particles — each with a
 * home position in the stage's world, a role (the colour rung), a sprite
 * shape, a size, a reveal window — and the renderer (`HoloParticles`) is the
 * only thing that knows how to paint them: through the GPGPU simulation the
 * corridor's brandmark core runs on, so every figure ASSEMBLES from a
 * dispersed cloud the way the Arc sphere does, and sits with the same
 * physics once it has.
 *
 * ⚠ WHY PARTICLES FIRST (owner, 2026-10-01, after two rounds of wire): "it
 * doesn't have any of that isometric, cool particle system that we use, for
 * example, for our arc sphere". The references he gave — a figure of nodes
 * and dust between two platens, a wire planet with ringed instruments, a
 * dot-matrix horse dissolving, an armillary in a sparkle field — are all
 * POPULATED. A line is a thing drawn once; a population is a thing made of
 * many, and the eye reads the many. Lines stay available (`spec.lines`) for
 * the few crisp edges a slab needs; the material is this.
 *
 * Every sampler here is DETERMINISTIC off a seed, so a spec is a pure
 * function of its record and a test can walk every home into its crop.
 */

import { mulberry32 } from "@/components/arcs/framing/iso";

import { toThree, type Vec3 } from "./stageFit";

/* ── Types ─────────────────────────────────────────────────────────────── */

/** The colour rungs a population may take; the renderer maps them off the palette. */
export type ParticleRole = "structure" | "machine" | "gold" | "green" | "grid" | "accent";

/** The sprite a particle is drawn as — the brandmark core's own library,
 *  copied: a soft DOT (dust, bokeh), a CELL (an outlined square — a lattice
 *  you can count), a VOXEL (a lit cube face), a RING (an open node), a DASH
 *  (an oriented stroke along a contour), a CROSS (a registration mark). */
export type ParticleShape = "dot" | "cell" | "voxel" | "ring" | "dash" | "cross" | "disc";

export const PARTICLE_SHAPE_ID: Readonly<Record<ParticleShape, number>> = {
  dot: 0,
  cell: 1,
  voxel: 2,
  ring: 3,
  dash: 4,
  cross: 5,
  /** A hard-edged filled node — the artifact's 7 px lane dot, at the stage's scale. */
  disc: 6,
};

export const PARTICLE_ROLE_ID: Readonly<Record<ParticleRole, number>> = {
  structure: 0,
  machine: 1,
  gold: 2,
  green: 3,
  grid: 4,
  accent: 5,
};

export interface ParticlePopulation {
  id: string;
  role: ParticleRole;
  shape: ParticleShape;
  /** CSS px at dpr 1, before per-particle variance. */
  size: number;
  /** Base alpha, 0..1. */
  opacity: number;
  /** Home positions, in the stage's world (three's axes: `toThree`). */
  points: readonly Vec3[];
  /** 1 = seated EXACTLY on its home once assembled (a lattice, an edge);
   *  0 = free to ride the simulation and drift (a cloud). Per point or one
   *  value for the lot. */
  order?: readonly number[] | number;
  /** Extra idle wander for cloud particles, world units. */
  drift?: number;
  /** The reveal window on the intro clock (or on `group`'s clock). */
  reveal: readonly [number, number];
  group?: string;
  /** Per-particle brightness variance 0..1 (twinkle depth). */
  twinkle?: number;
  /** Size variance 0..1 — motes of unequal size read as bokeh. */
  sizeVar?: number;
  /** The LIT population: brighter, so it alone passes the bloom threshold.
   *  ⚠ ONE lit population per figure — gold buys one object. */
  lit?: boolean;
  /** Screen-space tangent per point, radians — `dash` sprites align to it. */
  angles?: readonly number[];
  /**
   * LIFE (ADR-140, round four). A seated population whose points carry a
   * `tangents` entry TRAVELS along it once the figure has assembled: `run`
   * slides every bead one tangent-length per `period` seconds and wraps (a
   * conveyor — identical beads make the line flow without the object moving,
   * the orbit's dots circulate, the tendrils pulse into their cells); `wander`
   * swings each point back and forth along its tangent on a `period`-second
   * sine (the globe's shell drifting on the sphere while the sphere stays
   * put). Scaled by the canvas's `life` dial; nothing rotates, nothing
   * breathes (ADR-130 U4, ADR-097 U12).
   */
  flow?: { period: number; mode?: "run" | "wander" };
  /** Per point, the travel vector in three-space, its LENGTH the span of one
   *  step (world units). Required by `flow`; ignored without it. */
  tangents?: readonly Vec3[];
}

export interface StageParticleSpec {
  populations: readonly ParticlePopulation[];
  /** Radius of the dispersed cloud the figure assembles FROM, world units. */
  scatter: number;
  /** The assembly's length, ms. The core's own ignite is ~1.6 s. */
  assembleMs?: number;
}

export function particleCount(spec: StageParticleSpec): number {
  return spec.populations.reduce((n, p) => n + p.points.length, 0);
}

/** Every home in the spec, for the crop solver. */
export function particlePoints(spec: StageParticleSpec): Vec3[] {
  const out: Vec3[] = [];
  for (const p of spec.populations) out.push(...p.points);
  return out;
}

/* ── A stage point, for the samplers ───────────────────────────────────── */

export interface WorldPt {
  a: number;
  b: number;
  z: number;
}
export const W = (a: number, b: number, z: number): WorldPt => ({ a, b, z });
export const V = (p: WorldPt): Vec3 => toThree(p.a, p.b, p.z);

const lerp = (x: number, y: number, t: number) => x + (y - x) * t;

/* ── Samplers ──────────────────────────────────────────────────────────── */

/** Dots along a polyline at a PITCH (world units), optionally jittered. The
 *  dotted trajectory of the Astrolabe prototypes: a line read as beads. */
export function dotsAlong(
  seed: number,
  poly: readonly WorldPt[],
  pitch: number,
  jitter = 0
): WorldPt[] {
  const rnd = mulberry32(seed);
  const out: WorldPt[] = [];
  let carry = 0;
  for (let i = 1; i < poly.length; i++) {
    const p = poly[i - 1];
    const q = poly[i];
    const len = Math.hypot(q.a - p.a, q.b - p.b, q.z - p.z);
    if (len <= 1e-9) continue;
    let s = carry;
    while (s <= len) {
      const t = s / len;
      out.push({
        a: lerp(p.a, q.a, t) + (rnd() - 0.5) * jitter,
        b: lerp(p.b, q.b, t) + (rnd() - 0.5) * jitter,
        z: lerp(p.z, q.z, t) + (rnd() - 0.5) * jitter,
      });
      s += pitch;
    }
    carry = s - len;
  }
  return out;
}

/** A lattice of dots on the floor (z) over a rectangle in a × b. */
export function lattice(a0: number, a1: number, b0: number, b1: number, z: number, pitch: number) {
  const out: WorldPt[] = [];
  const na = Math.max(1, Math.round((a1 - a0) / pitch));
  const nb = Math.max(1, Math.round((b1 - b0) / pitch));
  for (let i = 0; i <= na; i++) {
    for (let j = 0; j <= nb; j++)
      out.push({ a: a0 + (i * (a1 - a0)) / na, b: b0 + (j * (b1 - b0)) / nb, z });
  }
  return out;
}

/** A vertical lattice on a WALL: along `a` at a fixed `b` (`wall: "back"`)
 *  or along `b` at a fixed `a` (`wall: "side"`), from z0 to z1. */
export function wallLattice(
  wall: "back" | "side",
  at: number,
  s0: number,
  s1: number,
  z0: number,
  z1: number,
  pitch: number
) {
  const out: WorldPt[] = [];
  const ns = Math.max(1, Math.round((s1 - s0) / pitch));
  const nz = Math.max(1, Math.round((z1 - z0) / pitch));
  for (let i = 0; i <= ns; i++) {
    for (let j = 0; j <= nz; j++) {
      const s = s0 + (i * (s1 - s0)) / ns;
      const z = z0 + (j * (z1 - z0)) / nz;
      out.push(wall === "back" ? { a: s, b: at, z } : { a: at, b: s, z });
    }
  }
  return out;
}

/** The circle around `c` of radius `r`, as `n` dots, in one of three planes
 *  of the stage or tilted off the floor by `tiltDeg` about the `a` axis. */
export function ringDots(
  c: WorldPt,
  r: number,
  n: number,
  plane: "floor" | "wall-a" | "wall-b" = "floor",
  tiltDeg = 0,
  phase = 0
): WorldPt[] {
  const out: WorldPt[] = [];
  const tilt = (tiltDeg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const th = phase + (i / n) * Math.PI * 2;
    const x = Math.cos(th) * r;
    const y = Math.sin(th) * r;
    if (plane === "floor") {
      /* In the floor, then tilted about `a`: b → b·cos, z → b·sin. */
      out.push({ a: c.a + x, b: c.b + y * Math.cos(tilt), z: c.z + y * Math.sin(tilt) });
    } else if (plane === "wall-a") {
      out.push({ a: c.a + x, b: c.b, z: c.z + y });
    } else {
      out.push({ a: c.a, b: c.b + x, z: c.z + y });
    }
  }
  return out;
}

/** The Arc sphere's own construction: latitude RINGS of dots, `bands` of
 *  them from pole to pole, each with a count that follows its circumference,
 *  the whole globe tilted about `a`. Reads as a globe at any density because
 *  the rings are what the eye follows. */
export function sphereRings(
  c: WorldPt,
  r: number,
  bands: number,
  perEquator: number,
  tiltDeg = 0,
  seed = 1
): WorldPt[] {
  const rnd = mulberry32(seed);
  const out: WorldPt[] = [];
  const tilt = (tiltDeg * Math.PI) / 180;
  for (let k = 0; k < bands; k++) {
    const lat = -Math.PI / 2 + ((k + 0.5) / bands) * Math.PI;
    const rr = Math.cos(lat) * r;
    const h = Math.sin(lat) * r;
    const n = Math.max(4, Math.round(perEquator * Math.cos(lat)));
    const phase = rnd() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const th = phase + (i / n) * Math.PI * 2;
      const x = Math.cos(th) * rr;
      const y = Math.sin(th) * rr;
      /* Tilt the globe about `a`: rotate (y, h) in the b–z plane. */
      const b = y * Math.cos(tilt) - h * Math.sin(tilt);
      const z = y * Math.sin(tilt) + h * Math.cos(tilt);
      out.push({ a: c.a + x, b: c.b + b, z: c.z + z });
    }
  }
  return out;
}

/** Motes seeded uniformly in a box of the stage. */
export function motesIn(
  seed: number,
  box: { a: number; b: number; z: number; w: number; d: number; h: number },
  n: number
): WorldPt[] {
  const rnd = mulberry32(seed);
  const out: WorldPt[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ a: box.a + rnd() * box.w, b: box.b + rnd() * box.d, z: box.z + rnd() * box.h });
  }
  return out;
}

/** Motes in a gaussian cloud around a point (Box–Muller, seeded). */
export function motesAround(seed: number, c: WorldPt, sigma: number, n: number): WorldPt[] {
  const rnd = mulberry32(seed);
  const g = () => {
    const u = Math.max(1e-9, rnd());
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const out: WorldPt[] = [];
  for (let i = 0; i < n; i++)
    out.push({ a: c.a + g() * sigma, b: c.b + g() * sigma, z: c.z + g() * sigma });
  return out;
}

/** A glowing RIBBON along a curve: a dense core on the line and a halo of
 *  motes falling off around it — the armillary's sparkle on one ring. */
export function ribbon(
  seed: number,
  curve: readonly WorldPt[],
  core: { pitch: number; spread: number },
  halo: { perUnit: number; sigma: number }
): { core: WorldPt[]; halo: WorldPt[] } {
  const rnd = mulberry32(seed);
  const coreDots = dotsAlong(seed + 1, curve, core.pitch, core.spread);
  let len = 0;
  for (let i = 1; i < curve.length; i++) {
    const p = curve[i - 1];
    const q = curve[i];
    len += Math.hypot(q.a - p.a, q.b - p.b, q.z - p.z);
  }
  const n = Math.round(len * halo.perUnit);
  const g = () => {
    const u = Math.max(1e-9, rnd());
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const haloDots: WorldPt[] = [];
  /* Pick a point along the curve by arc length, then scatter off it. */
  const cum: number[] = [0];
  for (let i = 1; i < curve.length; i++) {
    const p = curve[i - 1];
    const q = curve[i];
    cum.push(cum[i - 1] + Math.hypot(q.a - p.a, q.b - p.b, q.z - p.z));
  }
  for (let k = 0; k < n; k++) {
    const s = rnd() * len;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const p = curve[i - 1];
    const q = curve[i];
    const seg = cum[i] - cum[i - 1] || 1;
    const t = (s - cum[i - 1]) / seg;
    haloDots.push({
      a: lerp(p.a, q.a, t) + g() * halo.sigma,
      b: lerp(p.b, q.b, t) + g() * halo.sigma,
      z: lerp(p.z, q.z, t) + g() * halo.sigma,
    });
  }
  return { core: coreDots, halo: haloDots };
}

/** A discharge: a jittered polyline from `from` to `to`, as dots at `pitch`.
 *  The lightning of the owner's isometric-grid reference. */
export function tendrilDots(
  seed: number,
  from: WorldPt,
  to: WorldPt,
  segs: number,
  jitter: number,
  pitch: number
): WorldPt[] {
  const rnd = mulberry32(seed);
  const poly: WorldPt[] = [from];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const env = Math.sin(t * Math.PI);
    poly.push({
      a: lerp(from.a, to.a, t) + (rnd() - 0.5) * jitter * env,
      b: lerp(from.b, to.b, t) + (rnd() - 0.5) * jitter * env,
      z: lerp(from.z, to.z, t) + (rnd() - 0.5) * jitter * env * 0.5,
    });
  }
  poly.push(to);
  return dotsAlong(seed + 7, poly, pitch);
}

/** Tick marks along the `a` axis at the floor's front edge (b = `b`): a
 *  short dotted stub per tick, the time ruler. */
export function ticksAlongA(
  a0: number,
  a1: number,
  b: number,
  z: number,
  pitch: number,
  len: number
) {
  const out: WorldPt[] = [];
  const n = Math.max(1, Math.round((a1 - a0) / pitch));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i * (a1 - a0)) / n;
    const major = i % 2 === 0;
    const l = major ? len : len * 0.55;
    for (let k = 0; k <= 2; k++) out.push({ a, b: b - (k / 2) * l, z });
  }
  return out;
}

/** The stacked slab under a floor: `layers` dotted outlines descending from
 *  z = 0 — the ZERO relief's stacked edge. */
export function slabLayers(
  seed: number,
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  layers: number,
  step: number,
  pitch: number
): WorldPt[] {
  const out: WorldPt[] = [];
  for (let k = 1; k <= layers; k++) {
    const z = -k * step;
    out.push(
      ...dotsAlong(
        seed + k,
        [W(a0, b0, z), W(a1, b0, z), W(a1, b1, z), W(a0, b1, z), W(a0, b0, z)],
        pitch
      )
    );
  }
  return out;
}

/* ── Samplers with a tangent, for the life dial (round four) ──────────── */

export interface Beads {
  points: WorldPt[];
  /** The direction of travel at each bead, its length one step. */
  tangents: WorldPt[];
}

/** `dotsAlong`, and the direction each bead would travel: a run that flows. */
export function dotsAlongT(
  seed: number,
  poly: readonly WorldPt[],
  pitch: number,
  jitter = 0,
  span = pitch
): Beads {
  const rnd = mulberry32(seed);
  const points: WorldPt[] = [];
  const tangents: WorldPt[] = [];
  let carry = 0;
  for (let i = 1; i < poly.length; i++) {
    const p = poly[i - 1];
    const q = poly[i];
    const len = Math.hypot(q.a - p.a, q.b - p.b, q.z - p.z);
    if (len <= 1e-9) continue;
    const ta = ((q.a - p.a) / len) * span;
    const tb = ((q.b - p.b) / len) * span;
    const tz = ((q.z - p.z) / len) * span;
    let s = carry;
    while (s <= len) {
      const t = s / len;
      points.push({
        a: lerp(p.a, q.a, t) + (rnd() - 0.5) * jitter,
        b: lerp(p.b, q.b, t) + (rnd() - 0.5) * jitter,
        z: lerp(p.z, q.z, t) + (rnd() - 0.5) * jitter,
      });
      tangents.push({ a: ta, b: tb, z: tz });
      s += pitch;
    }
    carry = s - len;
  }
  return { points, tangents };
}

/** `ringDots`, with each dot's direction along the ring (so the ring circulates). */
export function ringDotsT(
  c: WorldPt,
  r: number,
  n: number,
  plane: "floor" | "wall-a" | "wall-b" = "floor",
  tiltDeg = 0,
  phase = 0
): Beads {
  const points: WorldPt[] = [];
  const tangents: WorldPt[] = [];
  const tilt = (tiltDeg * Math.PI) / 180;
  const span = (2 * Math.PI * r) / n;
  const at = (th: number): WorldPt => {
    const x = Math.cos(th) * r;
    const y = Math.sin(th) * r;
    if (plane === "floor")
      return { a: c.a + x, b: c.b + y * Math.cos(tilt), z: c.z + y * Math.sin(tilt) };
    if (plane === "wall-a") return { a: c.a + x, b: c.b, z: c.z + y };
    return { a: c.a, b: c.b + x, z: c.z + y };
  };
  for (let i = 0; i < n; i++) {
    const th = phase + (i / n) * Math.PI * 2;
    const p = at(th);
    const q = at(th + 1e-3);
    const l = Math.hypot(q.a - p.a, q.b - p.b, q.z - p.z) || 1;
    points.push(p);
    tangents.push({
      a: ((q.a - p.a) / l) * span,
      b: ((q.b - p.b) / l) * span,
      z: ((q.z - p.z) / l) * span,
    });
  }
  return { points, tangents };
}

/**
 * The Arc sphere's own DOTTED SHELL (`shell/ShellSubstrateGyro.tsx`'s
 * `buildDottedShell`, copied — never imported — ADR-106): `bands` latitude
 * rows from pole to pole, each row's count following cos(lat) so the globe
 * is densest at its equator, a seeded longitude offset per row so the rows
 * never align into a grid, a half-percent radial jitter. Tilted about `a`.
 * Each dot's tangent runs along its row, for the `wander` life.
 */
export function sphereShell(
  seed: number,
  c: WorldPt,
  r: number,
  bands: number,
  approxCount: number,
  tiltDeg = 0,
  span = 0.05
): Beads {
  const rnd = mulberry32(seed);
  const points: WorldPt[] = [];
  const tangents: WorldPt[] = [];
  const tilt = (tiltDeg * Math.PI) / 180;
  let cosSum = 0;
  for (let k = 0; k < bands; k++) cosSum += Math.cos(-Math.PI / 2 + ((k + 0.5) * Math.PI) / bands);
  const perCos = approxCount / cosSum;
  const place = (x: number, y: number, h: number): WorldPt => ({
    a: c.a + x,
    b: c.b + y * Math.cos(tilt) - h * Math.sin(tilt),
    z: c.z + y * Math.sin(tilt) + h * Math.cos(tilt),
  });
  for (let k = 0; k < bands; k++) {
    const lat = -Math.PI / 2 + ((k + 0.5) * Math.PI) / bands;
    const cosLat = Math.cos(lat);
    const n = Math.max(1, Math.round(perCos * cosLat));
    const offset = rnd() * Math.PI * 2;
    const h = Math.sin(lat) * r;
    const rr = cosLat * r;
    for (let i = 0; i < n; i++) {
      const lon = offset + (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.08;
      const rj = 0.992 + rnd() * 0.016;
      const p = place(Math.cos(lon) * rr * rj, Math.sin(lon) * rr * rj, h * rj);
      const q = place(Math.cos(lon + 1e-3) * rr, Math.sin(lon + 1e-3) * rr, h);
      const l = Math.hypot(q.a - p.a, q.b - p.b, q.z - p.z) || 1;
      points.push(p);
      tangents.push({
        a: ((q.a - p.a) / l) * span,
        b: ((q.b - p.b) / l) * span,
        z: ((q.z - p.z) / l) * span,
      });
    }
  }
  return { points, tangents };
}

/** `ribbon`, with the core's beads carrying their direction along the curve. */
export function ribbonT(
  seed: number,
  curve: readonly WorldPt[],
  core: { pitch: number; spread: number },
  halo: { perUnit: number; sigma: number }
): { core: Beads; halo: WorldPt[] } {
  const r = ribbon(seed, curve, core, halo);
  const t = dotsAlongT(seed + 1, curve, core.pitch, core.spread);
  return { core: t, halo: r.halo };
}

/** `tendrilDots`, with the direction of the discharge (from → to). */
export function tendrilDotsT(
  seed: number,
  from: WorldPt,
  to: WorldPt,
  segs: number,
  jitter: number,
  pitch: number
): Beads {
  const rnd = mulberry32(seed);
  const poly: WorldPt[] = [from];
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const env = Math.sin(t * Math.PI);
    poly.push({
      a: lerp(from.a, to.a, t) + (rnd() - 0.5) * jitter * env,
      b: lerp(from.b, to.b, t) + (rnd() - 0.5) * jitter * env,
      z: lerp(from.z, to.z, t) + (rnd() - 0.5) * jitter * env * 0.5,
    });
  }
  poly.push(to);
  return dotsAlongT(seed + 7, poly, pitch);
}

/** Tick marks along the `b` axis at the floor's front-left edge (a = `a`). */
export function ticksAlongB(
  b0: number,
  b1: number,
  a: number,
  z: number,
  pitch: number,
  len: number
) {
  const out: WorldPt[] = [];
  const n = Math.max(1, Math.round((b1 - b0) / pitch));
  for (let i = 0; i <= n; i++) {
    const b = b0 + (i * (b1 - b0)) / n;
    const major = i % 2 === 0;
    const l = major ? len : len * 0.55;
    for (let k = 0; k <= 2; k++) out.push({ a: a - (k / 2) * l, b, z });
  }
  return out;
}

/** A population from beads: the points AND their tangents, so it can flow. */
export function flowing(
  id: string,
  beads: Beads,
  o: Omit<ParticlePopulation, "id" | "points" | "tangents">
): ParticlePopulation {
  return { id, points: beads.points.map(V), tangents: beads.tangents.map(V), ...o };
}

/** Convenience: a population from stage points. */
export function population(
  id: string,
  pts: readonly WorldPt[],
  o: Omit<ParticlePopulation, "id" | "points">
): ParticlePopulation {
  return { id, points: pts.map(V), ...o };
}
