/**
 * stageFit — the stage's camera: a fixed PARALLEL view that frames the SVG
 * fallback's own crop, exactly (ADR-130 U4).
 *
 * ⚠ THREE-FREE. Plain arithmetic, so the scene and a unit test answer from
 * one place.
 *
 * ⚠ WHY IT IS NOT A PERSPECTIVE CAMERA ANY MORE (owner, 2026-09-28). U2 posed a
 * perspective camera at azimuth 30° so that the hologram "reproduced" the
 * cabinet fallback; the owner read it as "the vanishing point is on the right
 * side … super confusing", and against the Moira workshop — every figure
 * there a parallel projection seen from the floor's front corner. And its
 * lens was clamped to the trajectory's 34° ceiling without ever checking the
 * projected extremes, so the stages beat printed its agent prism 85px past
 * the canvas at 1920×1247 with every guard green.
 *
 * ⚠ SO THE CAMERA IS ORTHOGRAPHIC, FIXED, AND FRAMES THE CROP. It looks from
 * azimuth 45° (the floor's front corner) at elevation asin(tan 22°), which is
 * exactly the projection `framing/iso.ts` draws the SVG in; and its frustum is
 * the SVG's own viewBox, so a point inside the crop is on the canvas, the DOM
 * words seated over the drawing land on the hologram, and nothing can be cut
 * off whatever the box's size. There is no lens to solve and no drag: a
 * turned parallel projection would stop being the fallback's picture.
 */

import { ISO_ELEVATION, ISO_SCALE, type IsoFrame } from "@/components/arcs/framing/iso";

export type Vec3 = readonly [number, number, number];

/** Far enough that nothing on a stage reaches the near plane. */
export const STAGE_DISTANCE = 30;

/**
 * World from stage: `a` along the time edge, `b` into the screen, `z` up.
 *
 * ⚠ `b` BECOMES −z. With the camera at the floor's front corner (negative
 * three-x, positive three-z), +z comes toward it; mapping depth onto +z would
 * draw the record back to front, with nothing failing.
 */
export function toThree(a: number, b: number, z: number): Vec3 {
  return [a, z, -b];
}

export interface StageBounds {
  min: Vec3;
  max: Vec3;
}

const S2 = Math.SQRT1_2;
const SIN_E = Math.sin(ISO_ELEVATION);
const COS_E = Math.cos(ISO_ELEVATION);

/** From the target toward the camera: up and back over the front corner. */
export const STAGE_VIEW_DIR: Vec3 = [-COS_E * S2, SIN_E, COS_E * S2];

export function stageCameraPosition(distance = STAGE_DISTANCE): Vec3 {
  return [STAGE_VIEW_DIR[0] * distance, STAGE_VIEW_DIR[1] * distance, STAGE_VIEW_DIR[2] * distance];
}

/** The camera's own basis: screen right, screen up, and back (toward it). */
export function stageCameraBasis(): { x: Vec3; y: Vec3; z: Vec3 } {
  return {
    x: [S2, 0, S2],
    y: [SIN_E * S2, COS_E, -SIN_E * S2],
    z: STAGE_VIEW_DIR,
  };
}

/**
 * The orthographic frustum that shows exactly the SVG's crop, in camera-plane
 * units, for a camera looking at the world origin.
 *
 * The SVG draws world (a, b, z) at `ox + k·S·u`, `oy − k·S·v`, where (u, v)
 * are the camera-plane coordinates and S is `ISO_SCALE`; the frustum is that
 * mapping inverted at the crop's four edges.
 */
export function stageFrustum(frame: Pick<IsoFrame, "w" | "h" | "ox" | "oy" | "k">): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const unit = frame.k * ISO_SCALE;
  return {
    left: -frame.ox / unit,
    right: (frame.w - frame.ox) / unit,
    top: frame.oy / unit,
    bottom: (frame.oy - frame.h) / unit,
  };
}

/** A world point (three coordinates) in the crop's own viewbox units. */
export function stageToCrop(
  p: Vec3,
  frame: Pick<IsoFrame, "ox" | "oy" | "k">
): { x: number; y: number } {
  const b = stageCameraBasis();
  const u = p[0] * b.x[0] + p[1] * b.x[1] + p[2] * b.x[2];
  const v = p[0] * b.y[0] + p[1] * b.y[1] + p[2] * b.y[2];
  const unit = frame.k * ISO_SCALE;
  return { x: frame.ox + u * unit, y: frame.oy - v * unit };
}
