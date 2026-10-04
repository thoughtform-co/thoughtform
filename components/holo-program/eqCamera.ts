/**
 * eqCamera — the rest camera both opener figures are drawn through (ADR-143).
 *
 * ⚠ THREE-FREE AND PURE, and it is three's own `lookAt(0, 0, 0)` with `y` up
 * and a VERTICAL fov, written out: the server projects each figure's static
 * drawing through it and the canvas places its `PerspectiveCamera` from the
 * same numbers, so the fallback and the hologram at rest are one picture. A
 * test pins it against a real `THREE.PerspectiveCamera` for every figure.
 */

export type P3 = readonly [number, number, number];
export type V3 = [number, number, number];

export interface EqCameraSpec {
  azimuthDeg: number;
  elevationDeg: number;
  distance: number;
  /** VERTICAL, as three's is (ADR-080 U3): the frame's aspect sets the width. */
  fovDeg: number;
}

export interface EqCamBasis {
  eye: V3;
  right: V3;
  up: V3;
  /** Into the screen, from the eye toward the target. */
  fwd: V3;
}

const RAD = Math.PI / 180;
const mul = (p: P3, s: number): V3 => [p[0] * s, p[1] * s, p[2] * s];
const sub = (p: P3, q: P3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot = (p: P3, q: P3) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross = (p: P3, q: P3): V3 => [
  p[1] * q[2] - p[2] * q[1],
  p[2] * q[0] - p[0] * q[2],
  p[0] * q[1] - p[1] * q[0],
];
const unit = (p: P3): V3 => mul(p, 1 / (Math.hypot(p[0], p[1], p[2]) || 1));

/** The eye at rest: azimuth from +z toward +x, elevation above the floor. */
export function cameraPosition(cam: EqCameraSpec): V3 {
  const az = cam.azimuthDeg * RAD;
  const el = cam.elevationDeg * RAD;
  const d = cam.distance;
  return [d * Math.sin(az) * Math.cos(el), d * Math.sin(el), d * Math.cos(az) * Math.cos(el)];
}

/** The basis of a camera at `eye` looking at the origin, `y` up. */
export function cameraBasis(eye: V3): EqCamBasis {
  const fwd = unit(mul(eye, -1));
  const right = unit(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  return { eye, right, up, fwd };
}

/** A world point on a frame of `w` × `h` px at rest, and its depth. */
export function projectThrough(
  p: P3,
  frame: { w: number; h: number },
  fovDeg: number,
  cam: EqCamBasis
): { x: number; y: number; depth: number } {
  const d = sub(p, cam.eye);
  const xc = dot(d, cam.right);
  const yc = dot(d, cam.up);
  const zc = dot(d, cam.fwd);
  const t = Math.tan((fovDeg * RAD) / 2);
  const aspect = frame.w / frame.h;
  return {
    x: ((xc / (zc * t * aspect) + 1) / 2) * frame.w,
    y: ((1 - yc / (zc * t)) / 2) * frame.h,
    depth: zc,
  };
}

/** Whether a face with outward normal `n` through point `p` faces the eye. */
export function facesEye(n: P3, p: P3, eye: P3): boolean {
  return dot(n, sub(eye, p)) > 0;
}
