/**
 * lib/latent-flight/pulsar — the beacon's geometry and clock, three-free.
 *
 * A pulsar is a lighthouse: the magnetic axis (the beam) is tilted off the
 * spin axis by α, so as the star turns the beam sweeps a cone. This scene
 * builds the spin axis FROM the line of sight so that the beam crosses the
 * camera exactly once per turn:
 *
 *   d      unit vector star → camera
 *   spin   d leaned by α about the camera's right vector
 *   m0     the magnetic axis at phase 0, which IS d (pointing at the camera)
 *   m(φ)   m0 rotated about spin by φ — a cone of half-angle α around spin,
 *          on which d lies, so m(φ) = d at φ ≡ 0 and nowhere else per turn
 *
 * The apparent openness of the equatorial disc is cos α: at 30° the disc is
 * 0.87 (a near-circle, reads as a round target); at 55° it is 0.57, an
 * annulus, and the beam still crosses. Hence 55°.
 *
 * The phase parks at π/2 — both beams in profile — so a reduced-motion
 * page (clock parked at t = 0) shows a static lighthouse drawing with no
 * crossing, and the first pulse of a moving page lands at 0.75 P = 1.2 s.
 */

export type Vec3 = readonly [number, number, number];

export const PULSAR = {
  /** Rotation period, seconds. Real pulsars are faster; 1.6 s is legible. */
  periodS: 1.6,
  /** Magnetic tilt off the spin axis, degrees. */
  tiltDeg: 55,
  /** Distance from the camera, world units. */
  distance: 120,
  /** Screen placement, NDC: the upper-right third (0.68, 0.36 of the frame). */
  ndcX: 0.36,
  ndcY: 0.28,
  /** The phase at t = 0: beams in profile, no crossing. */
  parkPhase: Math.PI / 2,
  /** The crossing window, degrees off the line of sight: 1 inside, 0 outside. */
  crossInnerDeg: 4,
  crossOuterDeg: 12,
} as const;

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export function normalize(a: Vec3): Vec3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
export function angleBetween(a: Vec3, b: Vec3): number {
  return Math.acos(Math.max(-1, Math.min(1, dot(normalize(a), normalize(b)))));
}

/** Rodrigues rotation of `v` about the unit axis `k` by `a` radians. */
export function rotateAbout(v: Vec3, k: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const kxv = cross(k, v);
  const kdv = dot(k, v);
  return [
    v[0] * c + kxv[0] * s + k[0] * kdv * (1 - c),
    v[1] * c + kxv[1] * s + k[1] * kdv * (1 - c),
    v[2] * c + kxv[2] * s + k[2] * kdv * (1 - c),
  ];
}

export interface PulsarFrame {
  /** Unit star → camera. */
  d: Vec3;
  /** The spin axis, α off the line of sight. */
  spin: Vec3;
  /** Basis X of the spin frame: the component of d perpendicular to spin. */
  x: Vec3;
  /** Basis Y = spin × x. */
  y: Vec3;
  /** The magnetic axis at phase 0 (= d). */
  m0: Vec3;
  /** α in radians. */
  tilt: number;
}

/** Build the star's frame from the line of sight. `up` is the camera's up. */
export function pulsarFrame(d: Vec3, tiltDeg = PULSAR.tiltDeg, up: Vec3 = [0, 1, 0]): PulsarFrame {
  const dn = normalize(d);
  const tilt = (tiltDeg * Math.PI) / 180;
  let right = cross(dn, up);
  if (Math.hypot(...right) < 1e-6) right = cross(dn, [1, 0, 0]);
  right = normalize(right);
  const spin = normalize(rotateAbout(dn, right, tilt));
  const x = normalize(add(dn, scale(spin, -dot(dn, spin))));
  const y = cross(spin, x);
  return { d: dn, spin, x, y, m0: dn, tilt };
}

export function phaseAt(t: number, periodS = PULSAR.periodS, park = PULSAR.parkPhase): number {
  return park + (2 * Math.PI * t) / periodS;
}

export function beamDir(frame: PulsarFrame, phase: number): Vec3 {
  return rotateAbout(frame.m0, frame.spin, phase);
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** 0..1 — how squarely the beam points at the camera at this phase. */
export function crossing(frame: PulsarFrame, phase: number): number {
  const c = dot(beamDir(frame, phase), frame.d);
  const inner = Math.cos((PULSAR.crossInnerDeg * Math.PI) / 180);
  const outer = Math.cos((PULSAR.crossOuterDeg * Math.PI) / 180);
  return smoothstep(outer, inner, c);
}

/** Seconds until the first crossing after t = 0. */
export function firstCrossingS(periodS = PULSAR.periodS, park = PULSAR.parkPhase): number {
  const twoPi = 2 * Math.PI;
  const remaining = ((twoPi - (park % twoPi)) % twoPi) / twoPi;
  return remaining * periodS;
}

/**
 * The star's world position for a camera at the origin looking down −Z:
 * unproject the NDC placement at the given distance.
 */
export function starPosition(
  ndcX: number,
  ndcY: number,
  distance: number,
  fovDeg: number,
  aspect: number
): Vec3 {
  const t = Math.tan((fovDeg * Math.PI) / 360);
  const dir = normalize([ndcX * t * aspect, ndcY * t, -1]);
  return scale(dir, distance);
}
