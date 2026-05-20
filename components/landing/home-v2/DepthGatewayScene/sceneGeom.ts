/**
 * sceneGeom — shared world-space positions and scalars for the
 * home-v2 depth-gateway R3F scene.
 *
 * Coordinate convention:
 *   - +Z toward the viewer, -Z into the distance (Three.js default)
 *   - Origin is roughly the "intelligence layer" rest point
 *
 * The brandmark cloud no longer reads from world-space helpers —
 * it un-projects DOM dock rects directly (see BrandmarkPointCloud).
 * What lives here:
 *
 *   - Camera dolly endpoints + helper
 *   - L/R celestial body world positions (chamber C)
 *   - Substrate morph + side-body opacity envelopes
 */

import { lerp, smoothstep } from "@/lib/stores/depthGatewayStore";

// ── Camera ──────────────────────────────────────────────────────

/** Camera position at progress = 0 (start). Far enough back that
 *  the brandmark plate at the sigil dock projects to the v7 sigil__
 *  mark dimensions. */
export const CAMERA_START: [number, number, number] = [0, 0, 7];

/** Camera position at progress = 1 (end). A gentle forward dolly —
 *  not so aggressive that the L/R bodies clip the camera, just
 *  enough that the user feels the "navigation through latent space"
 *  push across the stage. */
export const CAMERA_END: [number, number, number] = [0, 0, 4.5];

/** Camera FOV — perspective camera. Matches the intelligence-layer
 *  triad's FOV so chambers' relative scaling matches v7 production. */
export const CAMERA_FOV = 42;

/** Look-at point in world space. Pinned to the substrate body's
 *  resting position so the framing stays steady across the dolly. */
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, -2];

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
