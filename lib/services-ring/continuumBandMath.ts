// Continuum band — pure math for the WebGL "continuum band" layer that
// integrates the tool ↔ collaborator spectrum INTO the armillary's
// near-horizontal Saturn waist ring (ADR-049 band rev; the 3D successor to
// the retired DOM axis + the retired edge-on `ContinuumWaistRail` thumb).
//
// The insight that makes the edge-on waist plane WORK: seen edge-on, a band
// with real 3D thickness reads as a bold horizontal BEAM crossing the mark's
// centre — weaving in front of and behind it — which is exactly the brand
// read wanted. So the layer is: the waist spine (the existing re-brightening
// Line2) + two companion ellipses + a sparse particle annulus giving the
// beam luminous depth + graduation ticks + Tool/Collaborator pole markers +
// a camera-facing traveler reticle riding the front arc.
//
// Everything here is kept free of DOM/three so it stays unit-testable
// (tests/lib/continuum-band-math.test.ts). Every marker is placed with
// `bandRingPoint`, which reuses `continuumThumbAngle` (a = π(1 − f)) — the
// SAME front-arc parametrization the drawn waist ellipse uses — so nothing
// can drift off the line. Consumed by ContinuumBand.tsx (component) and the
// /test/continuum-band look-dev lab.

import { clamp01 } from "@/lib/math";
import { frontWindowWeight, smootherstep } from "./ringMath";
import { THUMB_TICK_FRACTIONS, continuumThumbAngle } from "./continuumStageMath";

/* ── Geometry (multipliers of the waist radius, or plane-local lengths) ──── */

/** Inner companion ellipse radius (× waist radius) — sits just inside the
 *  spine so the band reads as a graduated ribbon, not one bare line. */
export const BAND_INNER_MUL = 0.98;
/** Outer companion ellipse radius (× waist radius). */
export const BAND_OUTER_MUL = 1.04;
/** Half-thickness of the particle annulus along the plane normal — the tiny
 *  z-spread is what gives the band its edge-on "beam" volume. */
export const BAND_PARTICLE_Z_JITTER = 0.012;

/** Particle annulus counts per device tier (fed through useCorridorCount so
 *  the ADR-038 quality governor scales them). */
export const BAND_PARTICLES_DESKTOP = 720;
export const BAND_PARTICLES_TABLET = 430;
export const BAND_PARTICLES_MOBILE = 250;
/** PointsMaterial size (world units, size-attenuated). */
export const BAND_PARTICLE_SIZE = 0.011;

/** Graduation tick half-length along the plane normal (major stops). */
export const BAND_TICK_MAJOR_HALF = 0.07;
/** Minor tick half-length. */
export const BAND_TICK_MINOR_HALF = 0.038;
/** Minor ticks per major SPAN (between consecutive THUMB_TICK_FRACTIONS). */
export const BAND_MINOR_TICKS_PER_SPAN = 4;

/** Pole-marker octahedron radius (Tool + Collaborator diamonds). */
export const BAND_POLE_R = 0.03;
/** Half-length of the traveler's plane-local plumb pin (locks the reticle to
 *  the band as it crosses in front of / behind the mark). */
export const BAND_PIN_HALF = 0.16;
/** Extra scale the traveler reticle gains at the front-centre (over the mark)
 *  vs the Tool/Collaborator stops. */
export const BAND_TRAVELER_CENTRE_POP = 0.3;

/* ── Reveal stagger windows over the formation clock (formT 0 → 1) ─────────
 * Everything is EXACTLY 0 at formT = 0 (the layer is inert off-stage) and
 * fully formed before formT = 1 (the ADR-030/047/049 identity-pin discipline
 * — the band never lingers half-built at the runway ends). Ordered so the
 * beam draws first and the traveler lands last. */
export const BAND_LINES_WINDOW: readonly [number, number] = [0.0, 0.5];
export const BAND_PARTICLES_WINDOW: readonly [number, number] = [0.12, 0.68];
export const BAND_TICKS_WINDOW: readonly [number, number] = [0.34, 0.72];
export const BAND_POLES_WINDOW: readonly [number, number] = [0.46, 0.8];
export const BAND_TRAVELER_WINDOW: readonly [number, number] = [0.62, 0.95];

/** Smootherstep of formT over a reveal window (clamped). */
export function bandRevealT(formT: number, window: readonly [number, number]): number {
  return smootherstep(window[0], window[1], clamp01(formT));
}

/** Plane-local point on the waist ellipse for a front-arc fraction f: reuses
 *  `continuumThumbAngle` (a = π(1 − f)) so f = 1/6 sits left (Tool), f = 5/6
 *  right (Collaborator), f = 1/2 front-centre — and any marker placed with it
 *  lands EXACTLY on the drawn ring. `radiusMul` offsets companion ellipses /
 *  annulus in and out; `radius`/`ecc` are the waist's. Returns [x, y] (z = 0,
 *  the plane); the component's `<group rotation={waist.tilt}>` supplies the
 *  tilt. */
export function bandRingPoint(
  f: number,
  radiusMul: number,
  radius: number,
  ecc: number
): [number, number] {
  const a = continuumThumbAngle(f);
  return [Math.cos(a) * radius * radiusMul, Math.sin(a) * radius * radiusMul * ecc];
}

/** Front-centre emphasis for the traveler at fraction f: 1 at f = 1/2 (front-
 *  centre, over the mark), ≈ 0.10 at the Tool/Collaborator stops. Reuses the
 *  ring front-window ramp with nz = sin a (the front-arc "frontness": 1 at
 *  centre, 0.5 at the stops). Symmetric by construction —
 *  sin(π(1 − f)) = sin(πf) = sin(π(1 − (1 − f))). */
export function travelerCentreWeight(f: number): number {
  return frontWindowWeight(Math.sin(continuumThumbAngle(f)));
}

/** Minor tick fractions — `perSpan` evenly spaced strictly BETWEEN each pair
 *  of consecutive major stops (THUMB_TICK_FRACTIONS), exclusive of the majors
 *  themselves. Sorted ascending; total = perSpan × (majors − 1). */
export function bandMinorTickFractions(perSpan: number = BAND_MINOR_TICKS_PER_SPAN): number[] {
  const majors = THUMB_TICK_FRACTIONS;
  const out: number[] = [];
  for (let s = 0; s < majors.length - 1; s++) {
    const lo = majors[s];
    const hi = majors[s + 1];
    for (let k = 1; k <= perSpan; k++) {
      out.push(lo + ((hi - lo) * k) / (perSpan + 1));
    }
  }
  return out;
}

/** Deterministic mulberry32 PRNG — a pure function of the seed (no
 *  Math.random; resume-safe and byte-reproducible, the ringMath.ts law). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build the particle annulus for the band, deterministically. `count`
 *  points are scattered around the FULL ellipse at radii ∈ [BAND_INNER_MUL,
 *  BAND_OUTER_MUL] with a small ± `zJitter` normal spread (the beam's edge-on
 *  thickness). Angles are SORTED ASCENDING so a `setDrawRange` sweep reveals
 *  the annulus in one continuous direction (matching the Line2 draw-on).
 *  Returns plane-local positions (x, y, z), the sorted angles, and the radial
 *  multipliers (for the component's Tool→Collaborator colour gradient). */
export function buildBandParticles(
  count: number,
  radius: number,
  ecc: number,
  zJitter: number = BAND_PARTICLE_Z_JITTER,
  seed: number = 7
): { positions: Float32Array; angles: Float32Array; muls: Float32Array } {
  const rand = mulberry32(seed);
  const n = Math.max(0, Math.floor(count));
  // Draw (angle, mul, z) triples, then sort by angle for the sweep.
  const rows: { a: number; mul: number; z: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const mul = BAND_INNER_MUL + rand() * (BAND_OUTER_MUL - BAND_INNER_MUL);
    const z = (rand() * 2 - 1) * zJitter;
    rows.push({ a, mul, z });
  }
  rows.sort((p, q) => p.a - q.a);
  const positions = new Float32Array(n * 3);
  const angles = new Float32Array(n);
  const muls = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const { a, mul, z } = rows[i];
    positions[i * 3] = Math.cos(a) * radius * mul;
    positions[i * 3 + 1] = Math.sin(a) * radius * mul * ecc;
    positions[i * 3 + 2] = z;
    angles[i] = a;
    muls[i] = mul;
  }
  return { positions, angles, muls };
}
