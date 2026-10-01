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
 * ⚠ SO THE CAMERA IS ORTHOGRAPHIC, FIXED, AND FRAMES THE CROP. The `stage`
 * view looks from azimuth 45° (the floor's front corner) at elevation
 * asin(tan 22°), which is exactly the projection `framing/iso.ts` draws the
 * SVG in; its frustum is the SVG's own viewBox, so a point inside the crop is
 * on the canvas, the DOM words seated over the drawing land on the hologram,
 * and nothing can be cut off whatever the box's size. There is no lens to
 * solve and no drag.
 *
 * THREE KINDS OF VIEW SINCE ADR-140, ALL PARALLEL, NONE A VANISHING POINT:
 * `stage` (above), `flat` (straight at the plane — the spectrum's rail, the
 * trace's chart: world units are the box's px, `[x, -y, 0]`), and a
 * `StageCamera` `{ azimuthDeg, elevationDeg }` — any other vantage on the
 * same floor (owner, 2026-10-01: "try different vantage points as well").
 * A camera view's crop is DERIVED through the same basis (`frameFor`), so the
 * no-cut-off guarantee holds at every vantage.
 */

import { ISO_ELEVATION, ISO_SCALE, type IsoFrame } from "@/components/arcs/framing/iso";

export type Vec3 = readonly [number, number, number];

/** A vantage on the stage: azimuth about `z` (45 = the floor's front corner), elevation above the floor. */
export interface StageCamera {
  azimuthDeg: number;
  elevationDeg: number;
}

/** Which camera a spec is drawn through. */
export type StageView = "stage" | "flat" | StageCamera;

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

/** World from a flat crop: `x` right, `y` DOWN (the box's own px), on the plane. */
export function toFlat(x: number, y: number): Vec3 {
  return [x, -y, 0];
}

export interface StageBounds {
  min: Vec3;
  max: Vec3;
}

const S2 = Math.SQRT1_2;
const SIN_E = Math.sin(ISO_ELEVATION);
const COS_E = Math.cos(ISO_ELEVATION);
const RAD = Math.PI / 180;

/** From the target toward the camera: up and back over the front corner. */
export const STAGE_VIEW_DIR: Vec3 = [-COS_E * S2, SIN_E, COS_E * S2];

const isCamera = (v: StageView): v is StageCamera => typeof v === "object";

/** From the target toward a camera at (azimuth, elevation). Azimuth 45 at the stage's own elevation IS `STAGE_VIEW_DIR`. */
export function cameraViewDir(cam: StageCamera): Vec3 {
  const az = cam.azimuthDeg * RAD;
  const el = cam.elevationDeg * RAD;
  return [-Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
}

export function stageCameraPosition(distance = STAGE_DISTANCE, view: StageView = "stage"): Vec3 {
  if (view === "flat") return [0, 0, distance];
  const d = view === "stage" ? STAGE_VIEW_DIR : cameraViewDir(view);
  return [d[0] * distance, d[1] * distance, d[2] * distance];
}

/** The camera's own basis: screen right, screen up, and back (toward it). */
export function stageCameraBasis(view: StageView = "stage"): { x: Vec3; y: Vec3; z: Vec3 } {
  if (view === "flat") return { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  if (view === "stage") {
    return {
      x: [S2, 0, S2],
      y: [SIN_E * S2, COS_E, -SIN_E * S2],
      z: STAGE_VIEW_DIR,
    };
  }
  const az = view.azimuthDeg * RAD;
  const el = view.elevationDeg * RAD;
  /* right = up × view, normalised; up = view × right. */
  return {
    x: [Math.cos(az), 0, Math.sin(az)],
    y: [Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az)],
    z: cameraViewDir(view),
  };
}

/** Viewbox units per camera-plane unit for a frame, in each view. */
export const viewUnit = (k: number, view: StageView) => (view === "stage" ? k * ISO_SCALE : k);

/**
 * The orthographic frustum that shows exactly the SVG's crop, in camera-plane
 * units, for a camera looking at the world origin.
 *
 * The SVG draws world (a, b, z) at `ox + k·S·u`, `oy − k·S·v`, where (u, v)
 * are the camera-plane coordinates and S is `ISO_SCALE`; the frustum is that
 * mapping inverted at the crop's four edges. In the other views S is 1.
 */
export function stageFrustum(
  frame: Pick<IsoFrame, "w" | "h" | "ox" | "oy" | "k">,
  view: StageView = "stage"
): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const unit = viewUnit(frame.k, view);
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
  frame: Pick<IsoFrame, "ox" | "oy" | "k">,
  view: StageView = "stage"
): { x: number; y: number } {
  const b = stageCameraBasis(view);
  const u = p[0] * b.x[0] + p[1] * b.x[1] + p[2] * b.x[2];
  const v = p[0] * b.y[0] + p[1] * b.y[1] + p[2] * b.y[2];
  const unit = viewUnit(frame.k, view);
  return { x: frame.ox + u * unit, y: frame.oy - v * unit };
}

export { isCamera as isStageCamera };
