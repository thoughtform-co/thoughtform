/**
 * Shared Arc Cases Terrace framing contract (ADR-034).
 *
 * The terrace is composed in viewport space, then converted to world-space
 * from the actual park camera/FOV. The R3F rig, DOM mirror, display and
 * terrain all consume this one pure layout so a wide editorial viewport and a
 * narrower desktop viewport retain the same reading.
 */

import { STATION_INTELLIGENCE, getCameraFov } from "../DepthGatewayScene/sceneGeom";
import {
  INT_Z,
  PARK_CAM_Z,
  REALM_Z_FAR,
  terrainGroundY,
} from "../DepthGatewayScene/substrateTerrain";
import { STACK_SURFACES_X } from "../DepthGatewayScene/shell/shellGeom";
import { TERRACE_BAKE_H, TERRACE_BAKE_W } from "./caseScreenBake";
import { terraceCameraEnvelope } from "@/lib/arc-cases/terraceMath";

/** Framing targets, expressed in normalized viewport X. */
export const TERRACE_SURFACES_VIEWPORT_X = 0.24;
export const TERRACE_DISPLAY_VIEWPORT_X = 0.65;
export const TERRACE_DISPLAY_RIGHT_LIMIT = 0.91;

/** The production case aperture remains exactly this size. */
export const TERRACE_Z = INT_Z - 2.6;
export const TERRACE_W = 4.35;
export const TERRACE_H = TERRACE_W * (TERRACE_BAKE_H / TERRACE_BAKE_W);
export const TERRACE_GROUND_CLEAR = 0.12;
export const TERRACE_YAW = -0.1;
export const TERRACE_PITCH = -0.05;
export const TERRACE_CHAMFER = (52 / TERRACE_BAKE_W) * TERRACE_W;

/** Shroud dimensions beyond the clear aperture. */
export const TERRACE_SIDE_APRON = 1.35;
export const TERRACE_TOP_OVERSHOOT = 0.4;
export const TERRACE_REAR_FOLD = 3.8;
export const TERRACE_TERRAIN_SAFETY_MARGIN = 1;

export interface TerraceViewportLayout {
  aspect: number;
  /** Full lateral translation at a settled arm level. */
  cameraShiftX: number;
  screenX: number;
  screenY: number;
  screenZ: number;
  screenWidth: number;
  screenHeight: number;
  screenYaw: number;
  screenPitch: number;
  apertureChamfer: number;
  sideApron: number;
  topOvershoot: number;
  rearFold: number;
  /** Minimum world-X terrain coverage at the fully armed frame. */
  terrainLeftExtent: number;
  /** Maximum world-X terrain coverage at the fully armed frame. */
  terrainRightExtent: number;
  /** Observable framing values make the layout contract cheap to test. */
  surfacesViewportX: number;
  displayViewportX: number;
  displayRightViewportX: number;
  sphereCentreViewportX: number;
}

function finiteAspect(aspect: number): number {
  return Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
}

/** Horizontal half-frame width at a depth from the park camera. */
export function terraceViewportHalfWidth(aspect: number, cameraDistance: number): number {
  const fovRadians = (getCameraFov(finiteAspect(aspect)) * Math.PI) / 180;
  return Math.tan(fovRadians / 2) * Math.max(0.001, cameraDistance) * finiteAspect(aspect);
}

/** Convert a world X position to an unclamped viewport fraction. */
export function terraceWorldToViewportX(
  worldX: number,
  cameraX: number,
  aspect: number,
  cameraDistance: number
): number {
  const half = terraceViewportHalfWidth(aspect, cameraDistance);
  return 0.5 + (worldX - cameraX) / (half * 2);
}

/**
 * Pure full-arm layout. The shift first places the live SURFACES fan at the
 * left-quarter target; the display is then positioned from its own (nearer)
 * depth plane so its centre lands at the right-two-thirds target.
 */
export function getTerraceViewportLayout(aspect: number): TerraceViewportLayout {
  const resolvedAspect = finiteAspect(aspect);
  const sphereDistance = STATION_INTELLIGENCE.parkDistance;
  const sphereHalf = terraceViewportHalfWidth(resolvedAspect, sphereDistance);
  const cameraShiftX = STACK_SURFACES_X - (TERRACE_SURFACES_VIEWPORT_X - 0.5) * sphereHalf * 2;

  const displayDistance = PARK_CAM_Z - TERRACE_Z;
  const displayHalf = terraceViewportHalfWidth(resolvedAspect, displayDistance);
  const screenX = cameraShiftX + (TERRACE_DISPLAY_VIEWPORT_X - 0.5) * displayHalf * 2;
  const screenY = terrainGroundY(screenX, TERRACE_Z) + TERRACE_H / 2 + TERRACE_GROUND_CLEAR;

  const screenRight = screenX + TERRACE_W / 2;
  const farTerrainHalf = terraceViewportHalfWidth(resolvedAspect, PARK_CAM_Z - REALM_Z_FAR);
  const terrainLeftExtent = Math.min(
    cameraShiftX - displayHalf - TERRACE_TERRAIN_SAFETY_MARGIN,
    screenX - TERRACE_W / 2 - TERRACE_SIDE_APRON - TERRACE_TERRAIN_SAFETY_MARGIN,
    cameraShiftX - farTerrainHalf - TERRACE_TERRAIN_SAFETY_MARGIN
  );
  const terrainRightExtent = Math.max(
    cameraShiftX + displayHalf + TERRACE_TERRAIN_SAFETY_MARGIN,
    screenX + TERRACE_W / 2 + TERRACE_SIDE_APRON + TERRACE_TERRAIN_SAFETY_MARGIN,
    cameraShiftX + farTerrainHalf + TERRACE_TERRAIN_SAFETY_MARGIN
  );

  return {
    aspect: resolvedAspect,
    cameraShiftX,
    screenX,
    screenY,
    screenZ: TERRACE_Z,
    screenWidth: TERRACE_W,
    screenHeight: TERRACE_H,
    screenYaw: TERRACE_YAW,
    screenPitch: TERRACE_PITCH,
    apertureChamfer: TERRACE_CHAMFER,
    sideApron: TERRACE_SIDE_APRON,
    topOvershoot: TERRACE_TOP_OVERSHOOT,
    rearFold: TERRACE_REAR_FOLD,
    terrainLeftExtent,
    terrainRightExtent,
    surfacesViewportX: terraceWorldToViewportX(
      STACK_SURFACES_X,
      cameraShiftX,
      resolvedAspect,
      sphereDistance
    ),
    displayViewportX: terraceWorldToViewportX(
      screenX,
      cameraShiftX,
      resolvedAspect,
      displayDistance
    ),
    displayRightViewportX: terraceWorldToViewportX(
      screenRight,
      cameraShiftX,
      resolvedAspect,
      displayDistance
    ),
    sphereCentreViewportX: terraceWorldToViewportX(0, cameraShiftX, resolvedAspect, sphereDistance),
  };
}

/** The camera envelope is shared by R3F and the DOM mirror. */
export function arcCameraShiftX(level: number, aspect: number): number {
  return getTerraceViewportLayout(aspect).cameraShiftX * terraceCameraEnvelope(level);
}
