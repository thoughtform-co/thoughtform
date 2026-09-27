/**
 * stageFit — the stage's camera pose, and the lens solved from the canvas.
 *
 * ⚠ THREE-FREE. Plain arithmetic, so the scene, the label layer and a unit
 * test all answer from one place (the `holoProgramGeom` contract, one folder
 * over).
 *
 * ⚠ THE POSE REPRODUCES THE STATIC DRAWING'S OWN BASIS, AND THAT IS THE POINT.
 * `components/arcs/framing/iso.ts` draws these four beats in a CABINET oblique
 * — `a` straight right, `b` back at 30° foreshortened ~0.5, `z` up — and that
 * SVG is the fallback every reader without WebGL gets (ADR-130 U1, ADR-080's
 * tri-state). A live pose chosen for its own sake would make the two versions
 * different pictures of the same record. At azimuth 30° and elevation 24° the
 * perspective camera projects
 *
 *     a → ( 0.866, −0.203)      b → ( 0.500, +0.352)      z → ( 0, +0.914)
 *
 * against cabinet's (1, 0) · (0.433, 0.25) · (0, 1) — the same drawing, with
 * depth and a real horizon. The rig is NOT rotated; the mapping below is what
 * puts `b` into the screen.
 *
 * ⚠ SOLVE THE LENS, NEVER THE DISTANCE (ADR-080 U3). Perspective strength is
 * `distance / object-depth`; at a fixed distance a fov change is a pure crop.
 * `STAGE_DISTANCE` is also OrbitControls' `minDistance`/`maxDistance`.
 */

import { FIT_FILL, FIT_FOV_MAX, FIT_FOV_MIN } from "@/components/holo-program/holoProgramGeom";

export type Vec3 = readonly [number, number, number];

/** Orbit rest pose, in radians. */
export const STAGE_AZIMUTH = (30 * Math.PI) / 180;
export const STAGE_ELEVATION = (24 * Math.PI) / 180;
/** ⚠ ±16°, and it may not cross the axis. Past ~0° the depth axis flips sides
 *  and a time rail that ran left to right starts running right to left — the
 *  failure ADR-080 U3 clamps the trajectory's azimuth against, one object
 *  over. Strictly positive, so the mirrored pose is unreachable. */
export const STAGE_AZIMUTH_SPAN = (16 * Math.PI) / 180;
export const STAGE_AZIMUTH_MIN = STAGE_AZIMUTH - STAGE_AZIMUTH_SPAN;
export const STAGE_AZIMUTH_MAX = STAGE_AZIMUTH + STAGE_AZIMUTH_SPAN;
export const STAGE_POLAR_MIN = (48 * Math.PI) / 180;
export const STAGE_POLAR_MAX = (80 * Math.PI) / 180;
export const STAGE_DISTANCE = 14;
export const STAGE_FOV = 22;

/**
 * World from stage: `a` right, `b` INTO the screen, `z` up.
 *
 * ⚠ `b` BECOMES −z, NOT +z. Three's +z comes toward the camera at this
 * azimuth, so mapping depth onto it would put the far lane in front of the
 * near one — the record drawn back to front, with nothing failing.
 */
export function toThree(a: number, b: number, z: number): Vec3 {
  return [a, z, -b];
}

export interface StageBounds {
  min: Vec3;
  max: Vec3;
}

/** The camera's resting position, spherical → world (holoProgramGeom's own). */
export function stageCameraPosition(distance = STAGE_DISTANCE): Vec3 {
  const y = Math.sin(STAGE_ELEVATION) * distance;
  const h = Math.cos(STAGE_ELEVATION) * distance;
  return [Math.sin(STAGE_AZIMUTH) * h, y, Math.cos(STAGE_AZIMUTH) * h];
}

/** The camera's own basis at the rest pose: right, up, backward. */
export function stageCameraBasis(): { x: Vec3; y: Vec3; z: Vec3 } {
  const t = STAGE_AZIMUTH;
  const p = STAGE_ELEVATION;
  const z: Vec3 = [Math.sin(t) * Math.cos(p), Math.sin(p), Math.cos(t) * Math.cos(p)];
  const x: Vec3 = [Math.cos(t), 0, -Math.sin(t)];
  const y: Vec3 = [-Math.sin(p) * Math.sin(t), Math.cos(p), -Math.sin(p) * Math.cos(t)];
  return { x, y, z };
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** The eight corners of a box, so a fit measures the whole volume rather than
 *  a model of it (ADR-070's standing finding). */
export function boundsCorners(b: StageBounds): Vec3[] {
  const out: Vec3[] = [];
  for (const x of [b.min[0], b.max[0]])
    for (const y of [b.min[1], b.max[1]])
      for (const z of [b.min[2], b.max[2]]) out.push([x, y, z]);
  return out;
}

export const boundsCentre = (b: StageBounds): Vec3 => [
  (b.min[0] + b.max[0]) / 2,
  (b.min[1] + b.max[1]) / 2,
  (b.min[2] + b.max[2]) / 2,
];

export interface StageFit {
  /** Vertical field of view, degrees. */
  fov: number;
  /** How far DOWN the frustum is shifted, in pixels (`setViewOffset`'s `y`). */
  offsetY: number;
  /** Where the camera looks: the drawing's own centre, not the origin. */
  target: Vec3;
}

/**
 * The lens that fits `bounds` into a canvas of this size at `STAGE_DISTANCE`,
 * inside gutters the beat's own chrome occupies.
 *
 * Measured against the box the gutters leave, the binding axis wins — ADR-070's
 * elastic crop, in three dimensions.
 */
export function solveStageFit(
  bounds: StageBounds,
  width: number,
  height: number,
  gutters: { top: number; bottom: number } = { top: 0, bottom: 0 }
): StageFit {
  const target = boundsCentre(bounds);
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return { fov: STAGE_FOV, offsetY: 0, target };
  }
  const gt = Math.min(Math.max(0, gutters.top), height * 0.24);
  const gb = Math.min(Math.max(0, gutters.bottom), height * 0.34);
  const innerH = Math.max(1, height - gt - gb);
  const innerW = Math.max(1, width);

  const basis = stageCameraBasis();
  const cam = stageCameraPosition();
  /* The camera orbits the TARGET, so its world position moves with it. */
  const eye: Vec3 = [cam[0] + target[0], cam[1] + target[1], cam[2] + target[2]];

  let tx = 0;
  let ty = 0;
  for (const p of boundsCorners(bounds)) {
    const v: Vec3 = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
    const depth = -dot(v, basis.z);
    if (!(depth > 0.001)) continue;
    tx = Math.max(tx, Math.abs(dot(v, basis.x)) / depth);
    ty = Math.max(ty, Math.abs(dot(v, basis.y)) / depth);
  }
  if (tx === 0 && ty === 0) return { fov: STAGE_FOV, offsetY: (gt - gb) / 2, target };

  const need = Math.max(ty / FIT_FILL, (tx / FIT_FILL) * (innerH / innerW));
  const deg = (2 * Math.atan(need) * 180) / Math.PI;
  const fov = Math.min(FIT_FOV_MAX, Math.max(FIT_FOV_MIN, deg));
  return { fov, offsetY: (gt - gb) / 2, target };
}

/** Orbit damping. The trajectory's own value — a held instrument settles. */
export const ORBIT_DAMPING_STAGE = 0.075;
