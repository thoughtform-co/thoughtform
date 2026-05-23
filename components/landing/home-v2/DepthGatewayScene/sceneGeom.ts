/**
 * sceneGeom — world-space layout for the home-v2 depth corridor
 * (ADR-018).
 *
 * Coordinate convention:
 *   - +Z toward the viewer, -Z into the distance (Three.js default).
 *   - Camera sits at +Z and dollies forward (toward more negative Z)
 *     across the scroll stage.
 *   - Gate stations sit at staggered negative Z so they pass the
 *     camera as the user scrolls forward.
 *
 * The corridor model:
 *   - The CAMERA moves continuously (eased global progress).
 *   - GATE GEOMETRY parks at its world Z station; the camera
 *     approaches it (distant → big → past the edges).
 *   - The BRANDMARK has a world-space anchor at each parked beat
 *     and a smooth lerp path between them.
 *
 * This is intentionally a different model from the v7 production
 * journey: production lerps DOM dock rects on a tall page; we lerp
 * world positions on a sticky stage.
 */

import { lerp, smoothstep } from "@/lib/stores/depthGatewayStore";

// ── Camera path ─────────────────────────────────────────────────

/** Camera position at progress = 0 (start of corridor).
 *
 *  Offset slightly to the RIGHT so the camera is co-located with the
 *  Thoughtform composition. Combined with a lookAt that also sits
 *  toward the Thoughtform world position, this makes the camera
 *  "see" the brandmark + compass on the right side of the viewport
 *  at the parked beat — same composition the homepage uses at the
 *  `.tri` grid (copy on the left, compass on the right). */
export const CAMERA_START: [number, number, number] = [0.55, 0, 10];

/** Camera position at progress = 1 (end of corridor). */
export const CAMERA_END: [number, number, number] = [0, 0, -8];

/** Vertical FOV. Slightly narrower than the previous iteration so
 *  the focal compression at gate centres reads as a proper "looking
 *  into a corridor" perspective. */
export const CAMERA_FOV = 38;

/** How far ahead of the camera the lookAt point sits. The lookAt
 *  travels forward with the camera so the gaze is always into the
 *  next gate (perspective signal: we are FLYING forward, not
 *  staring at a fixed world point). */
const LOOK_AHEAD = 6;

/** Subtle vertical drift on the lookAt point so the camera bobs
 *  with the corridor rhythm. Tiny — just enough to hint that this
 *  is a hand-flown camera rather than a rigid rail. */
const LOOK_BOB_AMPLITUDE = 0.1;

/** Where the camera's gaze settles at each end of the corridor.
 *  At progress = 0 the camera looks slightly off-axis (toward the
 *  Thoughtform compass on the right) so the homepage composition
 *  reads correctly. By the time the camera reaches the Diagnostic
 *  gate the gaze is straight ahead, centered on the world axis. */
const LOOK_AT_X_START = 0.95;
const LOOK_AT_X_END = 0;

/** Camera position at the given camera travel parameter (0..1).
 *  The travel curve is already smoothstep'd inside the store; here
 *  we just lerp endpoints. The X drift (CAMERA_START.x → 0) plus
 *  the lookAt drift (off-axis right → on-axis ahead) gives the
 *  visible "camera turning" that re-frames the Thoughtform
 *  composition into the centered Diagnostic gate. */
export function getCameraPosition(cameraT: number): [number, number, number] {
  return [
    lerp(CAMERA_START[0], CAMERA_END[0], cameraT),
    lerp(CAMERA_START[1], CAMERA_END[1], cameraT),
    lerp(CAMERA_START[2], CAMERA_END[2], cameraT),
  ];
}

/** Look-at point. Travels with the camera but stays LOOK_AHEAD
 *  units further down the corridor so the camera's forward gaze
 *  is into the next gate, not at a static world point.
 *
 *  The X component of the lookAt eases from `LOOK_AT_X_START`
 *  (off-axis right, framing the Thoughtform composition) to
 *  `LOOK_AT_X_END` (on-axis, framing the centered Diagnostic and
 *  Intelligence gates). The pan happens across the Thoughtform →
 *  Diagnostic transit so the user feels the camera swing from
 *  the right-of-axis homepage composition to the centered
 *  corridor view. */
export function getCameraLookAt(cameraT: number): [number, number, number] {
  const [, , camZ] = getCameraPosition(cameraT);
  const bob = Math.sin(cameraT * Math.PI * 2) * LOOK_BOB_AMPLITUDE;
  // The pan resolves earlier than the camera travel (we want the
  // gaze to settle on the centered Diagnostic gate by the time the
  // user reaches that parked beat at progress ≈ 0.41 → cameraT ≈ 0.34).
  const panT = smoothstep(0, 0.34, cameraT);
  const lookX = lerp(LOOK_AT_X_START, LOOK_AT_X_END, panT);
  return [lookX, bob, camZ - LOOK_AHEAD];
}

// ── Gate stations ───────────────────────────────────────────────

/** Each gate sits at a world Z position the camera will pass. The
 *  Z values are picked so that at each gate's parked progress
 *  centre, the camera sits ~`GATE_PARK_DISTANCE` units in front of
 *  the gate (close enough to fill the viewport with the diagram). */
const GATE_PARK_DISTANCE = 4.5;

export interface GateStation {
  /** Identifier so painters can selectively render. */
  id: "thoughtform" | "diagnostic" | "interstitial" | "intelligence";
  /** World position of the gate's centre. */
  position: [number, number, number];
  /** Approximate world half-extent (XY). Used by painters to size
   *  their geometry — e.g. compass radius, orbit radii. */
  halfExtent: number;
  /** Camera progress at which the gate is "parked" (centre of the
   *  beat window in stage progress, smoothstep'd to camera-T). */
  parkProgress: number;
}

/** Compute a gate's Z position so that at `parkProgress`, the
 *  camera-T-lerped position sits `GATE_PARK_DISTANCE` units in
 *  front of the gate. We solve:
 *      camZ(parkProgress) = gateZ + GATE_PARK_DISTANCE
 *  where camZ(t) lerps CAMERA_START.z → CAMERA_END.z by
 *  smoothstep(t). */
function gateZAtParkProgress(parkProgress: number): number {
  const t = smoothstep(0, 1, parkProgress);
  const camZ = lerp(CAMERA_START[2], CAMERA_END[2], t);
  return camZ - GATE_PARK_DISTANCE;
}

// Stations: park progress values match the BEAT_PARK_CENTRES table
// in depthGatewayStore.ts.
//
// The Thoughtform compass sits at the SAME world X as the brandmark
// anchor (BRANDMARK_ANCHOR_THOUGHTFORM) so the compass rings and the
// brandmark read as one composition, matching the v7 homepage's
// `.tri__center .sigil` placement (compass + brandmark in the right
// column of the `.tri` grid, copy in the left column).
export const STATION_THOUGHTFORM: GateStation = {
  id: "thoughtform",
  position: [1.4, 0.05, gateZAtParkProgress(0.09)],
  halfExtent: 1.6,
  parkProgress: 0.09,
};

export const STATION_DIAGNOSTIC: GateStation = {
  id: "diagnostic",
  position: [0, 0, gateZAtParkProgress(0.41)],
  halfExtent: 2.2,
  parkProgress: 0.41,
};

/** Interstitial gate between Diagnostic and Intelligence. Sits in
 *  the passthrough-02 window. The camera passes through it on the
 *  way to Intelligence — that is its job. */
export const STATION_INTERSTITIAL: GateStation = {
  id: "interstitial",
  // Sit at the midpoint of passthrough-02 (progress ≈ 0.6).
  position: [0, 0, gateZAtParkProgress(0.6)],
  halfExtent: 1.8,
  parkProgress: 0.6,
};

export const STATION_INTELLIGENCE: GateStation = {
  id: "intelligence",
  position: [0, 0, gateZAtParkProgress(0.88)],
  halfExtent: 2.0,
  parkProgress: 0.88,
};

export const STATIONS: readonly GateStation[] = [
  STATION_THOUGHTFORM,
  STATION_DIAGNOSTIC,
  STATION_INTERSTITIAL,
  STATION_INTELLIGENCE,
];

// ── Brandmark anchors (world space) ─────────────────────────────

/** World position the brandmark sits at when parked at each beat.
 *  These are calibrated against the v7 homepage so the on-screen
 *  position roughly matches `.sigil__mark`, `.miss__brand-slot`,
 *  and `.ilayer__brandmark-anchor` (the projected actor will read
 *  the actual camera + position to compute the screen rect each
 *  frame). */
export const BRANDMARK_ANCHOR_THOUGHTFORM: [number, number, number] = [
  // Off-centre right + below the camera's gaze axis. The X places
  // the brandmark inside the v7 sigil compass (which sits in the
  // right column of the `.tri` grid); the negative Y compensates
  // for the v7 station's `padding: 140px 0 220px` bias — the
  // brandmark dock sits roughly 40px below the viewport's vertical
  // centre on the homepage, which in world coords (at this camera
  // distance ≈ 4.9 units, fov 38°) translates to a noticeably
  // negative Y so the perspective projection lands inside the
  // diamond.
  1.4,
  -0.5,
  STATION_THOUGHTFORM.position[2] + 0.1,
];

export const BRANDMARK_ANCHOR_DIAGNOSTIC: [number, number, number] = [
  // Centred horizontally — matches the v7 `.miss__brand-slot` at
  // the centre of the diagnostic constellation.
  0,
  -0.1,
  STATION_DIAGNOSTIC.position[2] + 0.1,
];

export const BRANDMARK_ANCHOR_INTELLIGENCE: [number, number, number] = [
  // Centred — matches the v7 `.ilayer__brandmark-anchor`.
  0,
  -0.05,
  STATION_INTELLIGENCE.position[2] + 0.1,
];

/** Brandmark on-screen target widths at each parked beat (kept for
 *  legacy callers; the projected actor now uses
 *  `getBrandmarkWorldHalfExtent` instead so the brandmark size obeys
 *  3D perspective as the camera approaches/recedes). */
export const BRANDMARK_PARKED_SCREEN_WIDTH_FRAC = {
  // Matches v7 .sigil__mark clamp(155px, 19vw, 232px) → ~19vw
  thoughtform: 0.19,
  // Matches v7 .miss__brand-slot clamp(96px, 11vw, 144px) → ~11vw
  diagnostic: 0.11,
  // Matches v7 .ilayer__brandmark-anchor (centred ring diameter)
  // — wider because the substrate ring takes more real estate.
  intelligence: 0.22,
} as const;

/** WORLD-SPACE half-extent (radius) of the brandmark plate at each
 *  parked beat. Calibrated so that at the parked camera distance the
 *  perspective projection lands at the homepage `.sigil__mark`,
 *  `.miss__brand-slot`, and `.ilayer__brandmark-anchor` screen
 *  widths on a typical desktop viewport (~1920px).
 *
 *  Using a world-space size (instead of a fixed pixel widthFrac)
 *  is what makes the brandmark feel like a true 3D object: as the
 *  camera dollies forward the brandmark perspective-scales naturally,
 *  and during the Thoughtform → Diagnostic transit the shrinking
 *  world half-extent + drifting world position combine into a
 *  "camera move through the world" read instead of a 2D screen
 *  slide. */
export const BRANDMARK_WORLD_HALF_EXTENT = {
  // ~9-10% of vw on a 1920 viewport — sits comfortably inside the
  // v7 sigil diamond outline.
  thoughtform: 0.18,
  // ~6% of vw — smaller landing inside the diagnostic constellation
  // centre (matches v7 .miss__brand-slot proportion).
  diagnostic: 0.12,
  // ~13% of vw — the centerpiece of the intelligence sphere station
  // (largest dock on the homepage).
  intelligence: 0.24,
} as const;

/** Resolve the brandmark world position for the current progress.
 *  Interpolates between the three parked anchor points across the
 *  beat windows so the mark TRAVELS through world space, not just
 *  fades between locations. */
export function getBrandmarkWorldPosition(progress: number): [number, number, number] {
  // 0.0 → 0.18: parked at thoughtform
  // 0.18 → 0.41: travel thoughtform → diagnostic
  // 0.41 → 0.50: parked at diagnostic
  // 0.50 → 0.88: travel diagnostic → intelligence (through interstitial)
  // 0.88 → 1.00: parked at intelligence

  if (progress <= 0.18) return BRANDMARK_ANCHOR_THOUGHTFORM;
  if (progress <= 0.41) {
    const t = smoothstep(0.18, 0.41, progress);
    return [
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[0], BRANDMARK_ANCHOR_DIAGNOSTIC[0], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[1], BRANDMARK_ANCHOR_DIAGNOSTIC[1], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[2], BRANDMARK_ANCHOR_DIAGNOSTIC[2], t),
    ];
  }
  if (progress <= 0.5) return BRANDMARK_ANCHOR_DIAGNOSTIC;
  if (progress <= 0.88) {
    const t = smoothstep(0.5, 0.88, progress);
    return [
      lerp(BRANDMARK_ANCHOR_DIAGNOSTIC[0], BRANDMARK_ANCHOR_INTELLIGENCE[0], t),
      lerp(BRANDMARK_ANCHOR_DIAGNOSTIC[1], BRANDMARK_ANCHOR_INTELLIGENCE[1], t),
      lerp(BRANDMARK_ANCHOR_DIAGNOSTIC[2], BRANDMARK_ANCHOR_INTELLIGENCE[2], t),
    ];
  }
  return BRANDMARK_ANCHOR_INTELLIGENCE;
}

/** Target on-screen width (as a fraction of viewport width) for the
 *  brandmark at the current scroll position. Legacy path — the
 *  projected actor now uses `getBrandmarkWorldHalfExtent` so the
 *  size obeys perspective; kept for any non-projected consumer. */
export function getBrandmarkTargetScreenWidthFrac(progress: number): number {
  const W = BRANDMARK_PARKED_SCREEN_WIDTH_FRAC;
  if (progress <= 0.18) return W.thoughtform;
  if (progress <= 0.41) return lerp(W.thoughtform, W.diagnostic, smoothstep(0.18, 0.41, progress));
  if (progress <= 0.5) return W.diagnostic;
  if (progress <= 0.88) return lerp(W.diagnostic, W.intelligence, smoothstep(0.5, 0.88, progress));
  return W.intelligence;
}

/** Brandmark WORLD-SPACE half-extent at the current scroll position.
 *  Lerps between the parked beats using the same windows as
 *  `getBrandmarkWorldPosition`. Combined with the camera path this
 *  produces a perspective-correct screen size for every frame, so
 *  the brandmark grows/shrinks as the camera approaches/recedes —
 *  the "true 3D object" feel.  */
export function getBrandmarkWorldHalfExtent(progress: number): number {
  const H = BRANDMARK_WORLD_HALF_EXTENT;
  if (progress <= 0.18) return H.thoughtform;
  if (progress <= 0.41) return lerp(H.thoughtform, H.diagnostic, smoothstep(0.18, 0.41, progress));
  if (progress <= 0.5) return H.diagnostic;
  if (progress <= 0.88) return lerp(H.diagnostic, H.intelligence, smoothstep(0.5, 0.88, progress));
  return H.intelligence;
}

// ── Intelligence chamber — L/R bodies ──────────────────────────

/** Left celestial body — "Trusted Sources". Sits next to the
 *  intelligence sphere station. */
export const LEFT_BODY_POSITION: [number, number, number] = [
  -3.0,
  -0.1,
  STATION_INTELLIGENCE.position[2] + 0.2,
];

/** Right celestial body — "Headless Surfaces". Mirror of left. */
export const RIGHT_BODY_POSITION: [number, number, number] = [
  3.0,
  -0.1,
  STATION_INTELLIGENCE.position[2] + 0.2,
];

export const SIDE_BODY_SCALE = 1.1;

/** Side body opacity envelope across the intelligence beat (0.70..1.00).
 *  Bodies appear after the substrate sphere has begun to morph so the
 *  read is: brandmark → sphere → constellation forms around it. */
export function getSideBodyOpacity(intelligenceGate: number): number {
  // intelligenceGate is the intelligence beat's local 0..1.
  if (intelligenceGate <= 0.35) return 0;
  return smoothstep(0.35, 0.85, intelligenceGate);
}

/** Substrate morph value (0 = brandmark shape, 1 = Fibonacci sphere).
 *  Symmetric trapezoid envelope across the intelligence beat so the
 *  cloud collapses back into the mark before the corridor ends.
 *  Mirrors the v7 `substrateMorphProgress` shape from ADR-017. */
export function getSubstrateMorph(intelligenceGate: number): number {
  const FRAC = 0.3;
  if (intelligenceGate <= 0) return 0;
  if (intelligenceGate >= 1) return 0;
  // Smootherstep ramp on each side, hold in the middle.
  if (intelligenceGate < FRAC) {
    const t = intelligenceGate / FRAC;
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  if (intelligenceGate > 1 - FRAC) {
    const t = (1 - intelligenceGate) / FRAC;
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  return 1;
}

// ── Legacy compatibility ───────────────────────────────────────

/** Backwards-compatible alias for the old camera lookAt constant
 *  some older painters might import. The lookAt now travels — this
 *  returns the static centre as a fallback. */
export const CAMERA_LOOK_AT: [number, number, number] = [0, 0, 0];

/** Backwards-compatible world half-size helper for the existing
 *  `BrandmarkPointCloud` shader. Returns a smooth size that lerps
 *  between the brandmark anchor target sizes — the point cloud
 *  only paints during the intelligence substrate window now, so
 *  this resolves to roughly the intelligence anchor size. */
export function getBrandmarkWorldHalfSize(progress: number): number {
  // Reuse the screen-width target × camera-distance to compute a
  // rough world half-extent. The exact value matters less now that
  // the cloud is only the cover layer for the substrate morph.
  const widthFrac = getBrandmarkTargetScreenWidthFrac(progress);
  const [, , camZ] = getCameraPosition(smoothstep(0, 1, progress));
  const [, , brandZ] = getBrandmarkWorldPosition(progress);
  const camToBrand = Math.max(0.5, camZ - brandZ);
  // World half-extent ≈ widthFrac * 2 * tan(fov/2) * distance / 2
  const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 180 / 2);
  const aspect = 16 / 9; // approximate; the projection helper uses live aspect
  const viewW = 2 * tanHalfFov * camToBrand * aspect;
  return widthFrac * viewW * 0.5;
}
