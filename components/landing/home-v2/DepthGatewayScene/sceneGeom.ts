/**
 * sceneGeom — shared world-space positions and scalars for the
 * home-v2 depth-gateway R3F scene.
 *
 * One single source of truth for chamber positions so the camera
 * rig, brandmark cloud, orbital rings, and L/R bodies all read
 * the same numbers. Adjusting any value here ripples through the
 * whole scene without having to chase magic numbers across files.
 *
 * Coordinate convention:
 *   - +Z toward the viewer, -Z into the distance (Three.js default)
 *   - Origin is the "intelligence layer" rest point (where the
 *     substrate sphere lives once Chamber C completes).
 */

import { lerp, smoothstep } from "@/lib/stores/depthGatewayStore";

// ── Camera ──────────────────────────────────────────────────────

/** Camera position at progress = 0 (start). Far enough back that the
 *  whole Chamber A composition (brandmark on right, text plane on
 *  left) fits with room around it. */
export const CAMERA_START: [number, number, number] = [0, 0.15, 9];

/** Camera position at progress = 1 (end). A gentle forward dolly —
 *  not so aggressive that the spheres clip the camera, just enough
 *  that the user feels the "zoom in" through Chambers A → C. */
export const CAMERA_END: [number, number, number] = [0, 0.05, 2.5];

/** Camera FOV — perspective camera. Matches the intelligence-layer
 *  triad's FOV for visual continuity with the existing ilayer
 *  composition. */
export const CAMERA_FOV = 42;

/** Look-at point in world space. Pinned to the substrate body's
 *  resting position so the camera always frames the eventual triad
 *  centre, even during the dolly. */
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, -2];

// ── Brandmark cloud world-space targets ────────────────────────

/** Chamber A brandmark world position at chamber start — right of
 *  centre, close to the camera. */
export const BRANDMARK_A_START: [number, number, number] = [2.5, 0, 0];

/** Chamber A brandmark world position at chamber end — drifting
 *  toward centre, slightly receded. */
export const BRANDMARK_A_END: [number, number, number] = [0, 0, -2.4];

/** Brandmark resting position for Chambers B and C — centred,
 *  parked at the substrate body's z plane. */
export const BRANDMARK_REST: [number, number, number] = [0, 0, -3];

/** Brandmark world scale envelope.
 *  Chamber A: scales from 1.2 (big, close) to 0.85 (medium).
 *  Chamber B onwards: 0.85 (the orbits surround it at this scale).
 *  Chamber C: stays at 0.85; the morph itself does the visual job. */
export const BRANDMARK_SCALE_A_START = 1.2;
export const BRANDMARK_SCALE_A_END = 0.85;
export const BRANDMARK_SCALE_REST = 0.85;

// ── Diagnostic chamber — orbital rings ─────────────────────────

/** Ring radii multipliers (relative to brandmark scale). Four
 *  concentric/eccentric rings staggered so they emerge sequentially
 *  during Chamber B. */
export const RING_RADII: readonly number[] = [1.05, 1.45, 1.9, 2.45];

/** Per-ring tilt angles (radians) — each ring tipped slightly
 *  differently so they read as a 3D constellation rather than flat
 *  concentric circles. Values match the intelligence-layer ring
 *  tilts for visual continuity. */
const DEG = Math.PI / 180;
export const RING_TILTS: readonly (readonly [number, number, number])[] = [
  [14 * DEG, 0, 6 * DEG],
  [-10 * DEG, 0, 12 * DEG],
  [18 * DEG, 0, -10 * DEG],
  [-6 * DEG, 0, -16 * DEG],
];

/** Per-ring fade-in stagger across Chamber B. Each ring waits this
 *  fraction of chamber B progress before starting its fade-in. */
export const RING_STAGGER: readonly number[] = [0, 0.12, 0.24, 0.36];

// ── Intelligence chamber — L/R bodies ──────────────────────────

/** Left celestial body — "Trusted Sources". Position matches the
 *  intelligence-layer sources body, scaled by the same factor as the
 *  existing triad so visual scale carries over. */
export const LEFT_BODY_POSITION: [number, number, number] = [-3.2, -0.05, -3];

/** Right celestial body — "Headless Surfaces". Mirror of left. */
export const RIGHT_BODY_POSITION: [number, number, number] = [3.2, -0.05, -3];

/** L/R body scale. Smaller than the substrate so the substrate (the
 *  morphed brandmark) reads as the centrepiece. */
export const SIDE_BODY_SCALE = 1.1;

/** Substrate sphere world position — matches BRANDMARK_REST so the
 *  morph lerps from the brandmark cloud to the sphere in place. */
export const SUBSTRATE_POSITION: [number, number, number] = BRANDMARK_REST;

/** Substrate sphere world scale. Matches the intelligence-layer
 *  substrate body's scale so the visual register is consistent. */
export const SUBSTRATE_SCALE = 1.85;

// ── Helpers ────────────────────────────────────────────────────

/**
 * Camera position interpolation. Smoothstep eases the dolly so the
 * start and end are decelerated — feels like a deliberate camera
 * push rather than a linear lerp.
 */
export function getCameraPosition(progress: number): [number, number, number] {
  const t = smoothstep(0, 1, progress);
  return [
    lerp(CAMERA_START[0], CAMERA_END[0], t),
    lerp(CAMERA_START[1], CAMERA_END[1], t),
    lerp(CAMERA_START[2], CAMERA_END[2], t),
  ];
}

/**
 * Brandmark world position interpolation across the three chambers.
 *
 *   - Chamber A (0..1/3): START → END
 *   - Transition (1/3..0.45): END → REST
 *   - Chambers B/C: REST
 *
 * The smooth transition between A_END and REST is intentional — it
 * gives the brandmark a small forward settle as the rings emerge,
 * which keeps the motion alive when the user is reading the
 * Diagnostic eyebrow.
 */
export function getBrandmarkPosition(progress: number, chamberA: number): [number, number, number] {
  if (progress < 1 / 3) {
    const t = smoothstep(0, 1, chamberA);
    return [
      lerp(BRANDMARK_A_START[0], BRANDMARK_A_END[0], t),
      lerp(BRANDMARK_A_START[1], BRANDMARK_A_END[1], t),
      lerp(BRANDMARK_A_START[2], BRANDMARK_A_END[2], t),
    ];
  }
  if (progress < 0.45) {
    const settle = smoothstep(0, 1, (progress - 1 / 3) / (0.45 - 1 / 3));
    return [
      lerp(BRANDMARK_A_END[0], BRANDMARK_REST[0], settle),
      lerp(BRANDMARK_A_END[1], BRANDMARK_REST[1], settle),
      lerp(BRANDMARK_A_END[2], BRANDMARK_REST[2], settle),
    ];
  }
  return [...BRANDMARK_REST];
}

export function getBrandmarkScale(progress: number, chamberA: number): number {
  if (progress < 1 / 3) {
    const t = smoothstep(0, 1, chamberA);
    return lerp(BRANDMARK_SCALE_A_START, BRANDMARK_SCALE_A_END, t);
  }
  return BRANDMARK_SCALE_REST;
}

/**
 * Per-ring local progress for Chamber B emergence.
 * Returns 0 before the ring's stagger threshold, 1 once emergence
 * completes. Used by the ring meshes to fade in their materials.
 */
export function getRingEmerge(ringIndex: number, chamberB: number): number {
  const stagger = RING_STAGGER[Math.min(ringIndex, RING_STAGGER.length - 1)] ?? 0;
  if (chamberB <= stagger) return 0;
  const local = (chamberB - stagger) / (1 - stagger);
  return smoothstep(0, 1, local);
}

/**
 * Side body (L/R) opacity envelope across Chamber C. The bodies
 * appear after the substrate morph has begun (~30% of chamber C)
 * so the morph reads as "the brandmark becomes the centre, then
 * the constellation builds itself around it".
 */
export function getSideBodyOpacity(chamberC: number): number {
  if (chamberC <= 0.25) return 0;
  return smoothstep(0, 1, (chamberC - 0.25) / 0.5);
}

/**
 * Substrate morph value (0 = brandmark shape, 1 = Fibonacci sphere).
 * Maps Chamber C's 0..1 progress through a smoothstep so the morph
 * has a deliberate ease rather than a linear ramp.
 */
export function getSubstrateMorph(chamberC: number): number {
  return smoothstep(0, 0.85, chamberC);
}
