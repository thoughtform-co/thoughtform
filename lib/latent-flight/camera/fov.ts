/**
 * lib/latent-flight/camera/fov — the flight camera's field of view.
 *
 * A MIRROR of the corridor's policy (`sceneGeom.getCameraFov`), copied rather
 * than imported because that module drags the whole corridor geometry with
 * it: 38° vertical on landscape; on portrait, widen so the HORIZONTAL field
 * holds 60° (Hor+), capped at 70° vertical. The same numbers on both surfaces
 * are what will let the flight and the corridor share a lens when they
 * converge. Unit-pinned equal in `tests/lib/latent-flight/fov.test.ts`.
 */

/** Vertical field of view on landscape, degrees. */
export const FLIGHT_FOV = 38;
/** Horizontal field to preserve on portrait, degrees. */
export const TARGET_HFOV_DEG = 60;
/** Vertical ceiling on portrait, degrees. */
export const MAX_FOV_DEG = 70;

export function flightFov(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect >= 1) return FLIGHT_FOV;
  const targetH = (TARGET_HFOV_DEG * Math.PI) / 180;
  const vfovRad = 2 * Math.atan(Math.tan(targetH / 2) / aspect);
  const vfovDeg = (vfovRad * 180) / Math.PI;
  return Math.min(MAX_FOV_DEG, Math.max(FLIGHT_FOV, vfovDeg));
}

/** The CSS perspective that makes a DOM layer share the camera's space:
 *  `(H / 2) / tan(fov / 2)` pixels (ADR-081's `travelPerspectivePx`). */
export function perspectivePx(fovDeg: number, heightPx: number): number {
  return heightPx / 2 / Math.tan((fovDeg * Math.PI) / 360);
}

/** Half-extents of the view frustum at a depth, in world units. */
export function halfExtentsAt(depth: number, fovDeg: number, aspect: number) {
  const t = Math.tan((fovDeg * Math.PI) / 360);
  return { hw: depth * t * aspect, hh: depth * t };
}
