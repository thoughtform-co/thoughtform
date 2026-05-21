/**
 * sceneGeom — shared world-space positions and scalars for the
 * home-v2 depth-gateway R3F scene.
 *
 * Coordinate convention:
 *   - +Z toward the viewer, -Z into the distance (Three.js default)
 *   - Origin is roughly the "intelligence layer" rest point
 *
 * Brandmark cloud now travels between TWO world-space stations
 * (A → B) instead of being DOM-anchored. The camera dollies forward
 * steadily so the brandmark grows naturally as we travel toward it,
 * conveying the "traveling through space" feel referenced in
 * Star Atlas / WorldQuant Foundry.
 */

import { lerp, smoothstep } from "@/lib/stores/depthGatewayStore";

// ── Camera ──────────────────────────────────────────────────────

/** Camera position at progress = 0 (start). Far enough back that
 *  the brandmark at station A projects to roughly the v7 sigil__
 *  mark on-screen footprint (~300px at 1440 viewport). */
export const CAMERA_START: [number, number, number] = [0, 0, 8];

/** Camera position at progress = 1 (end). Steeper forward dolly
 *  than the previous iteration so the brandmark visibly grows /
 *  approaches across the stage (the user sees forward motion, not
 *  just static cross-fade). Z=3 lands the camera just outside
 *  the L/R celestial bodies' z-plane so they read as flanking
 *  satellites at the end of the journey. */
export const CAMERA_END: [number, number, number] = [0, 0, 3];

/** Camera FOV — perspective camera. Matches the intelligence-layer
 *  triad's FOV so chambers' relative scaling matches v7 production. */
export const CAMERA_FOV = 42;

/** Look-at point in world space. Pinned to the substrate body's
 *  resting position so the framing stays steady across the dolly. */
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, -2];

// ── Brandmark stations ─────────────────────────────────────────

/** Station A — chamber A (Definition) brandmark rest position.
 *
 *  Calibrated so the brandmark cloud projects to the right side of
 *  the viewport, matching the v7 `.sigil__mark` placement inside
 *  the `.tri__center .sigil` compass diagram. The slight positive
 *  Y bumps the mark up by ~5% to land at the v7 sigil's vertical
 *  centre (the sigil compass + caption push the brandmark above
 *  the section's true vertical middle). */
export const BRANDMARK_STATION_A = {
  position: [1.55, 0.1, -3.2] as [number, number, number],
  /** World half-extent of the brandmark plate. Calibrated so the
   *  cloud projects to ~280px on a 1440 viewport at the chamber-A
   *  camera distance (~11 world units), matching the v7
   *  `.sigil__mark` CSS dimensions inside the compass diagram. */
  halfSize: 0.95,
};

/** Station B — chambers B + C (Diagnostic / Intelligence) brandmark
 *  rest position.
 *
 *  Centred horizontally on screen — the v7 `.miss__brand-slot` and
 *  `.ilayer__brandmark-anchor` both sit at the viewport's horizontal
 *  centre. Y=−0.05 matches the v7 ilayer triad's substrate Y centre
 *  (BODY_POSITIONS.substrate). Z slightly closer than station A so
 *  the brandmark appears to "land" at a new station as the camera
 *  approaches it. */
export const BRANDMARK_STATION_B = {
  position: [0, -0.05, -2.6] as [number, number, number],
  /** Slightly larger than station A so the brandmark reads as
   *  having "landed at a closer station" — consistent with the
   *  v7 `.miss__brand-slot` being visually larger than the
   *  `.sigil__mark` inside the compass. */
  halfSize: 1.0,
};

/** Cross-station glide window: progress 0.30..0.50.
 *
 *  Lines up with the chamber-A→B section dead-band (0.30..0.41 in
 *  the new sequenced envelope from `useDepthScroll`) so the
 *  brandmark visibly traverses world space DURING the section
 *  cross-fade — the user sees the artifact moving while sigil
 *  fades out and miss orbits fade in around the new resting
 *  position. */
const STATION_GLIDE_IN = 0.3;
const STATION_GLIDE_OUT = 0.5;

/** Interpolate brandmark world position from station A → station B
 *  across the cross-station glide window. */
export function getBrandmarkWorldPosition(progress: number): [number, number, number] {
  const t = smoothstep(STATION_GLIDE_IN, STATION_GLIDE_OUT, progress);
  return [
    lerp(BRANDMARK_STATION_A.position[0], BRANDMARK_STATION_B.position[0], t),
    lerp(BRANDMARK_STATION_A.position[1], BRANDMARK_STATION_B.position[1], t),
    lerp(BRANDMARK_STATION_A.position[2], BRANDMARK_STATION_B.position[2], t),
  ];
}

/** Interpolate brandmark world half-size (XY extent of the
 *  brandmark plate) along the same glide window. */
export function getBrandmarkWorldHalfSize(progress: number): number {
  const t = smoothstep(STATION_GLIDE_IN, STATION_GLIDE_OUT, progress);
  return lerp(BRANDMARK_STATION_A.halfSize, BRANDMARK_STATION_B.halfSize, t);
}

// ── Intelligence chamber — L/R bodies ──────────────────────────

/** Left celestial body — "Trusted Sources". Position matches the
 *  intelligence-layer sources body, scaled by the same factor as the
 *  existing triad so visual scale carries over. */
export const LEFT_BODY_POSITION: [number, number, number] = [-3.2, -0.05, -3];

/** Right celestial body — "Headless Surfaces". Mirror of left. */
export const RIGHT_BODY_POSITION: [number, number, number] = [3.2, -0.05, -3];

/** L/R body scale. Smaller than the substrate so the morphed
 *  brandmark sphere reads as the centrepiece. */
export const SIDE_BODY_SCALE = 1.1;

// ── Helpers ────────────────────────────────────────────────────

/** Camera position interpolation. Smoothstep eases the dolly so
 *  start and end are decelerated — feels like a deliberate push
 *  rather than a linear lerp. */
export function getCameraPosition(progress: number): [number, number, number] {
  const t = smoothstep(0, 1, progress);
  return [
    lerp(CAMERA_START[0], CAMERA_END[0], t),
    lerp(CAMERA_START[1], CAMERA_END[1], t),
    lerp(CAMERA_START[2], CAMERA_END[2], t),
  ];
}

/** Side body (L/R) opacity envelope across Chamber C. Bodies appear
 *  AFTER the substrate morph has begun (~30% of chamber C) so the
 *  morph reads as "the brandmark becomes the centre, then the
 *  constellation builds itself around it". */
export function getSideBodyOpacity(chamberC: number): number {
  if (chamberC <= 0.25) return 0;
  return smoothstep(0, 1, (chamberC - 0.25) / 0.5);
}

/** Substrate morph value (0 = brandmark shape, 1 = Fibonacci sphere).
 *  Maps chamber C's 0..1 progress through a smoothstep so the morph
 *  has a deliberate ease rather than a linear ramp. */
export function getSubstrateMorph(chamberC: number): number {
  return smoothstep(0, 0.85, chamberC);
}
