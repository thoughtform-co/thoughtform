/**
 * sceneGeom — single source of truth for the home-v2 depth-corridor
 * world layout (ADR-018, REBUILT for the world-owned model).
 *
 * Operating principle: ONE 3D scene. Every diagram is a world-rigid
 * group at a fixed Z station. The camera flies through them on one
 * continuous path. Copy and labels are DOM text whose screen position
 * is computed every frame by projecting named world anchors. The
 * brandmark is a pure 3D-projected vector — no DOM-dock pinning.
 *
 * This file owns:
 *   - The camera path (position, lookAt, FOV).
 *   - The four gate stations (Thoughtform, Diagnostic, Interstitial,
 *     Intelligence) — world positions + half-extents + parked progress.
 *   - The brandmark anchor at each gate centre + the smooth world-
 *     space interpolation between them.
 *   - The COPY_ANCHORS table — named world positions for every DOM
 *     text element the world-DOM tracker projects per frame.
 *   - Substrate-cut envelope (ADR-017) for the intelligence beat.
 *
 * Coordinate convention:
 *   - +Z toward the viewer, -Z into the distance (Three.js default).
 *   - Camera sits at large +Z and dollies forward (toward more
 *     negative Z) across the scroll stage.
 *   - Gates sit at staggered Z stations the camera passes.
 *
 * The camera path is axial end-to-end (X=0, Y=0 except for a sub-
 * pixel lookAt bob). The Thoughtform composition slides laterally
 * via `getThoughtformCenterOffsetX` rather than via camera reframe.
 */

import {
  CAMERA_END,
  CAMERA_START,
  DOLLY_HOLD_END,
  type GateStation,
  INTERSTITIAL_PARK,
  type Vec3,
  cameraZDollyT,
  clamp01,
  lerp,
  smoothstep,
  stationById,
} from "@/lib/home-v2/corridorMap";
import { isMobileComposition } from "@/lib/hooks/useDeviceTier";
import { getSmoothedAccretionLayers, getSmoothedThoughtformOffsetX } from "./motionFollower";

// Re-exported for back-compat: external modules (FlyingCameraRig,
// index, gate components, contour/intergate painters) import these
// from `sceneGeom`. Their definitions now live in the declarative
// `corridorMap` kernel.
export { CAMERA_END, CAMERA_START, type GateStation, type Vec3 };

// ── Camera FOV + path constants ──────────────────────────────────

/** Vertical FOV. ~38° gives the focal-compressed "looking into a
 *  corridor" feel without going full fish-eye. This is the LANDSCAPE /
 *  desktop value; `getCameraFov` widens it on portrait so the
 *  horizontal coverage holds (the gates/copy are laid out for a
 *  landscape horizontal FOV — see ADR-018 mobile revision). */
export const CAMERA_FOV = 38;

/** Desktop-equivalent HORIZONTAL FOV target the portrait fix tries to
 *  preserve. At 16:9 a 38° vertical FOV already yields ~63° horizontal,
 *  so this only ever widens the vertical FOV on aspect < 1. */
const TARGET_HFOV_DEG = 60;
/** Hard cap on the widened vertical FOV — beyond this the scene reads
 *  as fish-eye. On very tall phones we accept some horizontal tightening
 *  (the stacked section-2 layout compensates) rather than distort. */
const MAX_FOV_DEG = 70;

/**
 * Aspect-aware vertical FOV. Three.js `PerspectiveCamera.fov` is the
 * VERTICAL angle and is aspect-independent, so a portrait viewport
 * keeps the tuned vertical framing but collapses horizontally. To
 * restore horizontal coverage we widen the vertical FOV when
 * `aspect < 1` to hit `TARGET_HFOV_DEG` (clamped to `MAX_FOV_DEG`).
 *
 * BOTH the R3F scene camera AND the DOM mirror camera in
 * `useWorldDomTracker` must call this with the same aspect, or the
 * projected copy/brandmark will desync from the canvas geometry.
 */
export function getCameraFov(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect >= 1) return CAMERA_FOV;
  const targetH = (TARGET_HFOV_DEG * Math.PI) / 180;
  const vfovRad = 2 * Math.atan(Math.tan(targetH / 2) / aspect);
  const vfovDeg = (vfovRad * 180) / Math.PI;
  return Math.min(MAX_FOV_DEG, Math.max(CAMERA_FOV, vfovDeg));
}

/** How far ahead of the camera the lookAt point sits. The lookAt
 *  travels with the camera so each frame the gaze is into the next
 *  gate (perspective signal: we are FLYING forward). */
const LOOK_AHEAD = 6;

/** Subtle vertical bob on the lookAt point — hand-flown camera
 *  signal, very low amplitude so it doesn't read as wobble. */
const LOOK_BOB_AMPLITUDE = 0.08;

// ── Corridor timeline ────────────────────────────────────────────

/**
 * `CORRIDOR_TIMELINE` — the central scroll-progress timing table for
 * the home-v2 depth corridor. Every helper in this file (and a few
 * R3F painters) reads its windows from here, so retuning a phase
 * only requires editing one entry.
 *
 * The beat boundaries themselves live in `BEAT_WINDOWS` /
 * `BEAT_PARK_CENTRES` in `depthGatewayStore.ts`. Many entries below
 * intentionally cross beat boundaries — the comment on each entry
 * calls out whether the value tracks a beat edge or sits at a
 * deliberately-tuned interior progress.
 *
 * `as const` so the literal values stay narrow types — painters can
 * destructure freely without losing precision.
 */
export const CORRIDOR_TIMELINE = {
  /** Camera Z dolly hold/release. Held at 0 across the Thoughtform
   *  pan so the parked composition reads with no forward drift,
   *  then smoothsteps to 1 across the remaining scroll. Tracks the
   *  end of the `thoughtform` beat (`BEAT_WINDOWS[0].end = 0.14`)
   *  and the end of the Thoughtform pan below. */
  dollyHoldEnd: DOLLY_HOLD_END,

  /** Thoughtform composition lateral centering pan window. PAN_END
   *  must stay locked to `dollyHoldEnd` so the camera dolly + ring
   *  flythrough release the moment the pan completes. v3.1 polish
   *  pass widened START 0.075 -> 0.035 (twice as long) and the curve
   *  in `getThoughtformCenterOffsetX` switched from `smoothstep` to
   *  the C2-continuous `smootherstep` so velocity is zero at both
   *  ends — kills the scroll-back snap when scrolling reverses
   *  across the pan boundary. END is unchanged so every coupled
   *  downstream beat (dolly release, ring flythrough start 0.13,
   *  boot rampEnd 0.109) stays in lockstep. */
  thoughtformPan: { start: 0.035, end: 0.109 },

  /** Gateway "boot-up" envelope phases. Ramp runs alongside the
   *  Thoughtform pan; hold spans the early ring flythrough; relax
   *  fades through the start of passthrough-01. Shared by
   *  `StaticStarfield`, `ThoughtformAtmosphere`, `CelestialMotes`,
   *  and `ThoughtformCompassGate`. */
  thoughtformBoot: { preBoot: 0.03, rampEnd: 0.109, holdEnd: 0.24, relaxEnd: 0.55 },

  /** Compass ring forward translation at the end of each flythrough
   *  window. Parked compass sits at world Z≈5.6; +10 brings the
   *  ring well past the camera. Controls physical sweep speed, not
   *  fade timing (opacity is depth-driven). */
  flythroughZDistance: 10,

  /** Per-ring flythrough windows — inner-first order. Ring 3
   *  (innermost) flies FIRST; ring 0 (outer frame) flies LAST and
   *  ends exactly at the passthrough-01 boundary so the supporting
   *  linework finishes sweeping just as Diagnostic takes focus. */
  flythrough: [
    { start: 0.2, end: 0.573 }, // ring 0 (outer) — flies LAST
    { start: 0.18, end: 0.55 }, // ring 1
    { start: 0.155, end: 0.525 }, // ring 2
    { start: 0.13, end: 0.5 }, // ring 3 (inner) — flies FIRST
  ],

  /** Interstitial waypoint park progress. Sits inside passthrough-02
   *  (camera flies THROUGH it) so it does not appear in
   *  `BEAT_PARK_CENTRES`; the value lives here so the station's
   *  solved world Z still derives through `gateZAtParkProgress`. */
  interstitialPark: INTERSTITIAL_PARK,

  /** Brandmark world-travel phase breakpoints.
   *  - `thoughtformHold`: held at Thoughtform anchor through 0.16
   *    (sits 0.02 past the Thoughtform beat end so the parked
   *    composition holds visibly into the start of passthrough-01).
   *  - `diagnosticArrival`: arrival lerp lands at the LEAD position
   *    at 0.50 (just before the Diagnostic park centre 0.53).
   *  - `diagnosticHold`: lead-pull hold ends here (0.58) just after
   *    the Diagnostic beat end (0.60).
   *  - `intelligenceArrival`: world half-extent lerp finishes here.
   *  - `intelligenceLanding`: brandmark FREEZES at the Intelligence
   *    anchor and the substrate cloud takes over the silhouette. */
  brandmark: {
    thoughtformHold: 0.14,
    diagnosticArrival: 0.61,
    diagnosticHold: 0.68,
    intelligenceArrival: 0.85,
    intelligenceLanding: 0.915,
  },

  /** Brandmark lead-distance transit pull. Starts just after the
   *  Diagnostic park, reaches FULL_LEAD by the end of passthrough-02
   *  + a touch into intelligence (0.80). */
  brandmarkLeadPull: { start: 0.68, end: 0.85 },

  /** Diagnostic head-copy + label depth-approach offset. The labels
   *  start `offset` world units behind their parked Z at `start` and
   *  converge to the parked plane by `end`. */
  diagnosticApproach: { offset: -9, start: 0.24, end: 0.66 },

  /** Intelligence head-copy + side-body label depth-approach offset.
   *  Mirrors the Diagnostic pattern around the passthrough-02 →
   *  intelligence handoff. Offset softened -6 → -1.5 (2026-06-04) so
   *  the Build title no longer flies in from far depth at a tiny
   *  scale — it now appears at roughly the same apparent size as the
   *  Navigate + Encode titles and grows gently to parked size (paired
   *  with the tightened intelligence depthFade `far` below). */
  intelligenceApproach: { offset: -1.5, start: 0.67, end: 0.9 },

  /** Camera chase toward the brandmark lead — peaks across the
   *  passthrough-02 → intelligence transit, then releases as the
   *  brandmark lands at the intelligence anchor. Bell envelope:
   *  `start → start + fadeIn` ramps in; `peakAt → peakAt + fadeOut`
   *  ramps out; peak strength is `peak`. */
  cameraChase: {
    start: 0.67,
    end: 0.915,
    fadeIn: 0.11,
    peakAt: 0.835,
    fadeOut: 0.08,
    peak: 0.38,
  },

  /** Brandmark accretion shell reveal windows (ADR-013 brandmark
   *  travels accretively through the corridor; the mark itself does
   *  not change, but what surrounds it accumulates).
   *
   *  INSIDE-OUT MAPPING (shell-into-corridor pass): each phase of
   *  the flywheel adds the next layer of the intelligence-layer
   *  shell around the traveling guiding-star brandmark, and each
   *  layer PERSISTS so the shell is fully assembled at the Build
   *  landing.
   *
   *  - `substrate`: gold geodesic cage around the mark — Navigate
   *    adds the layer boundary. Starts in pass-01a, peaks at the
   *    Navigate park, persists forever.
   *  - `orbits`: inclined elliptical orbits with judgment pips —
   *    Encode adds encoded judgment circling the layer. Starts late
   *    pass-01b, peaks at Encode park, persists.
   *  - `stack`: trusted sources (left) + headless surfaces (right)
   *    funnel — Build docks the layer into the full stack. Starts
   *    mid passthrough-02, peaks at Build landing, persists. No
   *    outer geodesic cage (retired 2026-06-07 stack-dock pass). */
  accretion: {
    // 2026-06-05 petal-unfold pass: tight windows anchored to each
    // phase park's arrival. The wide early-emerge windows of the
    // previous pass (substrate 0.22→0.39, sources 0.50→0.63,
    // surfaces 0.74→0.91) caused each layer to slowly grow during
    // the preceding transit, which combined with the camera dolly
    // read as "the cage is coming from a distance". Tight windows
    // (~0.08 wide) sized to fire AT the park arrival make each
    // layer DEPLOY at the moment the mark arrives, so the petals
    // unfold around a stable mark, not approach from afar.
    // Entry-buildup pass (2026-06-08): delay substrate/gyro deployment
    // until the camera has spent a little time in the corridor after
    // leaving Thoughtform. Encode/Build windows below are untouched.
    // Widened twice (2026-06-08): once for the reveal-polish cascade,
    // then again for the elegance pass so the per-ring + globe-bloom
    // unfold breathes instead of snapping. `gateNavigateReadout`
    // reuses this window so the Navigate text fades in with the
    // sphere.
    //
    // Polish round 2 (2026-06-10): peakAt pulled 0.48 → 0.42 so the
    // substrate is essentially fully unfolded at the Navigate park
    // centre (~0.40). The previous 0.48 left the globe Y-squashed
    // (~58% revealed at the park) which combined with the larger
    // camera distance to make the sphere read smaller than the
    // Encode gimbal. The narrower peak window still breathes
    // (~12% of paint progress) and the per-ring stagger inside
    // `gyroAssemblyUnfold` continues to play the cascade.
    substrate: { start: 0.3, peakAt: 0.42 },
    // Orbits window re-aligned to the Encode park ARRIVAL (2026-06-07)
    // so the staggered fold-in is WITNESSED as the camera enters Encode,
    // mirroring the compass at Navigate (window straddles the park:
    // ~0.06 before → ~0.02 after the park centre). The earlier 0.47/0.57
    // window completed the unfold during the fast pass-01b transit, so
    // by arrival the orbits were already static ("just appear"). The
    // brandmark arrives at Diagnostic at 0.57 and holds to 0.65, so this
    // window deploys the orbits around the arriving + settling mark.
    // 2026-06-08 entry-buildup follow-up: shifted -0.04 earlier so the
    // Encode title/support read with the orbits instead of trailing.
    // 2026-06-09 elegance pass: orbits widened 0.54/0.62 -> 0.52/0.64
    // and stack 0.84/0.91 -> 0.81/0.93 so even a slow deliberate
    // scroll reads the staggered deploys; both windows still straddle
    // their park centres (Encode ~0.636, Build ~0.92). The temporal
    // follower (`motionFollower.ts`) guarantees the fast-scroll case.
    orbits: { start: 0.52, peakAt: 0.64 }, // Encode park centre ~0.636 — `gateEncodeReadout` reuses this window so the Encode text fades in with the orbits
    stack: { start: 0.81, peakAt: 0.93 }, // Build park centre ~0.92
  },
} as const;

/** Camera position at the given GLOBAL progress. Pure Z dolly: the
 *  camera holds at `CAMERA_START.z` across the Thoughtform pan
 *  window, then smoothsteps to `CAMERA_END.z` across the rest of
 *  the corridor. */
export function getCameraPosition(progress: number): [number, number, number] {
  return [0, 0, lerp(CAMERA_START[2], CAMERA_END[2], cameraZDollyT(progress))];
}

// ── Epilogue camera pose (v3: planet landing) ─────────────────────
//
// During the EPILOGUE the camera leaves its parked CAMERA_END pose
// and flies TOWARD the substrate (which is simultaneously growing
// into a planet, see `getEpiloguePlanetScale`). At peak LAND it
// hovers just above the planet's north pole and looks tangentially
// toward the horizon — so the surface fills the bottom of the
// viewport, the limb of the planet reads as a curved horizon, and
// the title sits in the sky above it.
//
// Math (deliberately simple — slerp-free, planar):
//   - planet centre P = BRANDMARK_ANCHOR_INTELLIGENCE
//   - UP angle theta: 0 = in front of the planet (parked), peak =
//     EPILOGUE_LANDING_TILT (a touch off straight-up so we land
//     facing slightly ahead rather than straight down at the pole)
//   - direction from planet centre to camera: (0, sin(theta), cos(theta))
//   - distance: lerp(parked-distance, planetRadius + standoff,
//     approachT) — camera flies in as the planet grows, ending just
//     above the surface
//   - look-at at peak LAND: camera + tangent * horizon_distance,
//     where tangent is perpendicular to the up direction and points
//     in the +Z half (so we look "forward" along the surface)

/** Tilt angle (radians) of the camera above the planet at peak LAND.
 *  v3.2 horizon framing — dropped the camera from the v3.1
 *  bird's-eye (70deg) toward an ORBITAL HORIZON view: camera is
 *  slightly above the planet centre and well in front of it, like
 *  the Earth-reference screenshots the user provided. Combined with
 *  the new look-up gaze (`LOOK_DOWN_Y` > camera Y) and the closer
 *  standoff below, this reads as "we've left the corridor and we
 *  are orbiting a planet, looking out across its curved limb toward
 *  the title in the sky above."
 *
 *  2026-06-09 breathing-room pass: 28 -> 32deg lifts the camera a
 *  touch higher over the pole (paired with the raised LOOK_DOWN_Y
 *  below) so the planet's limb sits lower in frame and the title
 *  gets more sky. */
const EPILOGUE_LANDING_TILT = (32 * Math.PI) / 180;

/** Camera standoff (world units) from the planet surface at peak
 *  LAND. v3.2 pulled 4.5 -> 3.5 so the planet reads BIG in frame.
 *  The grow-aware `distance = planetRadius + standoff` math still
 *  guarantees the camera stays outside the growing planet, so this
 *  is safe to tighten further if needed during live tuning. */
const EPILOGUE_LANDING_STANDOFF = 3.5;

/** lookAt target offset in PLANET-RADIUS units relative to the
 *  planet centre at peak LAND. v3.2 horizon framing:
 *
 *    - `LOOK_DOWN_Y` places the look-at slightly ABOVE the planet
 *      pole (the pole sits at +1R). Because the camera at landing
 *      tilt sits just above the pole height itself, this means the
 *      camera's gaze tilts UP very slightly toward a point above
 *      the planet — the horizon (curved limb) ends up in the lower
 *      portion of the frame, with sky + title above. Matches the
 *      Earth-reference shot composition. 2026-06-09 breathing-room
 *      pass: 1.2 -> 1.45 raises the gaze further so the limb drops
 *      lower in frame (planet size unchanged — standoff untouched).
 *    - `LOOK_FWD_Z = 0.5` pushes the look-at half a radius PAST
 *      the planet centre (further down -Z) so the camera looks
 *      across the surface toward a point in the far sky, rather
 *      than directly at the planet — adds depth to the horizon
 *      read. */
const EPILOGUE_LOOK_DOWN_Y = 1.45;
const EPILOGUE_LOOK_FWD_Z = 0.5;

/** Single continuous FLIGHT window (in epilogueProgress) for the whole
 *  planet descent (v3.3 curved-landing pass). Both the bank ANGLE and
 *  the approach DISTANCE ride this one curve so the camera arcs up AND
 *  in as a single elegant move — like an aircraft lining up with a
 *  runway — instead of the v3.2 behaviour where distance closed on the
 *  APPROACH band and the tilt only swung up later on the LAND band
 *  (which read as "fly straight at the sphere, THEN pitch up").
 *
 *  Starts a touch into BUILD_OUT so the Build chrome has begun clearing
 *  before the camera leaves its park; ends just before the title is
 *  fully in (TITLE_IN.end = 0.74) so the pose is settled as the
 *  user reads the line.
 *
 *  Polish round 2 (2026-06-10): EPILOGUE_FLIGHT_END pulled 0.9 -> 0.86
 *  to align with the new LAND.end (0.86) so the camera resolves
 *  inside the compressed epilogue tail. */
const EPILOGUE_FLIGHT_START = 0.12;
const EPILOGUE_FLIGHT_END = 0.86;

/** Mid-flight landing-flare swoop depth (world units). The camera dips
 *  slightly CLOSER to the planet through the middle of the descent and
 *  eases back out to the orbital standoff at the end — the gentle
 *  "flare" of a landing approach. Kept well under the standoff so the
 *  camera never crosses the planet surface. 2026-06-09 smoothness
 *  pass: 0.9 -> 0.6 so the mid-flight dip reads as a flare, not a
 *  lurch, now that the bank arc itself eases in (see `arc` below). */
const EPILOGUE_SWOOP_DEPTH = 0.6;

/** Camera pose during the epilogue beat — a single curved fly-in +
 *  landing arc around the substrate sphere as it grows into a planet.
 *  Returns the parked CAMERA_END pose at epilogueProgress 0 (so
 *  blending it into `FlyingCameraRig` is a no-op inside the corridor)
 *  and an orbital horizon POV at the end of the flight. */
export function getEpilogueCameraPose(epilogueProgress: number): {
  position: [number, number, number];
  lookAt: [number, number, number];
} {
  const planetCentre = BRANDMARK_ANCHOR_INTELLIGENCE;
  const baseRadius = SUBSTRATE_GYRO_GLOBE_RADIUS * GYRO_ASSEMBLY_SCALE;
  const planetRadius = baseRadius * getEpiloguePlanetScale(epilogueProgress);

  // One continuous flight parameter for the whole descent. `flightRaw`
  // is the linear smoothstep across the flight window; `flight` adds a
  // second smoothing pass (smootherstep) so the camera eases out of the
  // park and decelerates into the landing without a kink at either end.
  const flightRaw = smoothstep(EPILOGUE_FLIGHT_START, EPILOGUE_FLIGHT_END, epilogueProgress);
  const flight = flightRaw * flightRaw * (3 - 2 * flightRaw);

  // Bank angle LEADS the approach. `arc` eases OUT ahead of the
  // double-smoothed `flight` so the camera gains ALTITUDE early — by
  // the time it closes in it is already looking down at the planet
  // from above, like an aircraft on a glide slope, instead of boring
  // straight at the planet's middle and only pitching up at the very
  // end. The distance closes on the gentler `flight`, so altitude
  // bows up first and the approach curves in under it: one continuous
  // arc, never an L-shaped "straight in, then up".
  //
  // 2026-06-09 smoothness pass: the raw `sin(t·π/2)` ease-out had its
  // MAXIMUM angular velocity at flight start — the full-sphere view
  // visibly kicked the moment the bank began. Feeding the sin through
  // a smoothstep keeps the lead (smoothstep(t) ≥ smootherstep-of-
  // smoothstep used by `flight` everywhere on [0,1]) but starts the
  // bank with zero velocity, so "full sphere → top of the sphere"
  // now eases in and out as one continuous move.
  const arcIn = flightRaw * flightRaw * (3 - 2 * flightRaw);
  const arc = Math.sin(arcIn * Math.PI * 0.5);
  const theta = EPILOGUE_LANDING_TILT * arc;
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);

  // Distance from planet centre to camera.
  // - Parked: camera at CAMERA_END = (0,0,-17), planet at z ≈ -22.6,
  //   so parked distance ≈ 5.6 units (camera +Z of planet).
  // - Landing: planetRadius + LANDING_STANDOFF (orbital standoff).
  // The mid-flight `swoop` dips the camera closer through the middle of
  // the descent then eases back out — the landing flare.
  const parkedDistance = CAMERA_END[2] - planetCentre[2];
  const landingDistance = planetRadius + EPILOGUE_LANDING_STANDOFF;
  const swoop = Math.sin(Math.PI * flightRaw) * EPILOGUE_SWOOP_DEPTH;
  const distance = lerp(parkedDistance, landingDistance, flight) - swoop;

  const camX = planetCentre[0];
  const camY = planetCentre[1] + sinT * distance;
  const camZ = planetCentre[2] + cosT * distance;

  // LookAt rides the SAME flight curve so the gaze rotates WITH the
  // arc (no lag between the camera rising and where it is looking).
  // - flight 0: the corridor's parked lookAt — identical to
  //   `getCameraLookAt(1)` so the corridor->epilogue seam is invisible.
  // - flight 1: look DOWN+FORWARD over the planet's pole — target sits
  //   slightly ABOVE the planet centre in Y and well in front of it in
  //   -Z, so the upper hemisphere arcs across the lower frame and the
  //   starfield + title fill the upper frame (the Earth-reference look).
  const parkedLook = getCameraLookAt(1);
  const lookLand: [number, number, number] = [
    planetCentre[0],
    planetCentre[1] + planetRadius * EPILOGUE_LOOK_DOWN_Y,
    planetCentre[2] - planetRadius * EPILOGUE_LOOK_FWD_Z,
  ];
  // Gaze rides the same leading `arc` as the bank angle so the camera
  // looks where it is banking — the planet stays framed below the
  // horizon line as the camera rises over it.
  const lookAt: [number, number, number] = [
    lerp(parkedLook[0], lookLand[0], arc),
    lerp(parkedLook[1], lookLand[1], arc),
    lerp(parkedLook[2], lookLand[2], arc),
  ];

  return {
    position: [camX, camY, camZ],
    lookAt,
  };
}

/** Base look-at point. Travels with the camera (LOOK_AHEAD units
 *  further down the corridor) and bobs sub-pixel Y so the gaze
 *  reads as hand-flown. Kept separate from `getCameraLookAt` so the
 *  brandmark chase math can use a stable forward vector without
 *  recursively depending on the public lookAt's subtle target blend. */
function getBaseCameraLookAt(progress: number): [number, number, number] {
  const [, , camZ] = getCameraPosition(progress);
  // Bob phased to corridor progress — one and a half cycles across
  // the full stage, very low amplitude.
  const bobY = Math.sin(progress * Math.PI * 3) * LOOK_BOB_AMPLITUDE;
  return [0, bobY, camZ - LOOK_AHEAD];
}

/** Look-at point used by the live camera. During the Diagnostic ->
 *  Intelligence transit it subtly biases toward the brandmark lead
 *  position so the camera feels like it is following the artifact
 *  down the corridor, while the base look-ahead still preserves the
 *  axial "flying forward" read. Window is owned by
 *  `CORRIDOR_TIMELINE.cameraChase`. */
export function getCameraLookAt(progress: number): [number, number, number] {
  const base = getBaseCameraLookAt(progress);
  const chase = CORRIDOR_TIMELINE.cameraChase;
  if (progress < chase.start || progress > chase.end) return base;

  const chaseIn = smoothstep(0, 1, (progress - chase.start) / chase.fadeIn);
  const chaseOut = 1 - smoothstep(0, 1, (progress - chase.peakAt) / chase.fadeOut);
  const chaseT = Math.min(chaseIn, chaseOut) * chase.peak;
  if (chaseT <= 0.001) return base;

  const lead = getBrandmarkLeadWorldPosition(progress);
  return [
    lerp(base[0], lead[0], chaseT),
    lerp(base[1], lead[1], chaseT),
    lerp(base[2], lead[2], chaseT),
  ];
}

/** Unit vector pointing from the camera into the corridor. This is
 *  intentionally based on the base look-ahead, not the public
 *  brandmark-biased lookAt, so all depth/focus opacity helpers share
 *  a stable camera-space axis. */
export function getCameraForward(progress: number): [number, number, number] {
  const cam = getCameraPosition(progress);
  const look = getBaseCameraLookAt(progress);
  const x = look[0] - cam[0];
  const y = look[1] - cam[1];
  const z = look[2] - cam[2];
  const len = Math.max(1e-6, Math.hypot(x, y, z));
  return [x / len, y / len, z / len];
}

/** Signed distance from camera to a world position along the camera
 *  forward axis. Positive = in front of the camera. Negative = behind
 *  the camera and should generally fade/cull. */
export function cameraSpaceDepth(progress: number, worldPosition: Vec3): number {
  const cam = getCameraPosition(progress);
  const forward = getCameraForward(progress);
  return (
    (worldPosition[0] - cam[0]) * forward[0] +
    (worldPosition[1] - cam[1]) * forward[1] +
    (worldPosition[2] - cam[2]) * forward[2]
  );
}

export interface DepthFocusWindow {
  /** Distance at which near-plane fade reaches full opacity. */
  near: number;
  /** Fade length before `near`; depths <= near - nearFade are hidden. */
  nearFade: number;
  /** Distance at which far-plane fade begins. */
  far: number;
  /** Fade length after `far`; depths >= far + farFade are hidden. */
  farFade: number;
}

/** Camera-space focus opacity, mirroring the Star Atlas pattern:
 *  world objects persist, but they fade when too near, too far, or
 *  behind the camera. Progress decides pacing; depth decides whether
 *  geometry is optically present. */
export function depthFocusOpacity(depth: number, window: DepthFocusWindow): number {
  if (depth <= 0) return 0;
  const nearOpacity = smoothstep(window.near - window.nearFade, window.near, depth);
  const farOpacity = 1 - smoothstep(window.far, window.far + window.farFade, depth);
  return clamp01(Math.min(nearOpacity, farOpacity));
}

export function depthOpacityForWorldPosition(
  progress: number,
  worldPosition: Vec3,
  window: DepthFocusWindow
): number {
  return depthFocusOpacity(cameraSpaceDepth(progress, worldPosition), window);
}

// ── Gate stations ────────────────────────────────────────────────
//
// `GateStation`, the `GATE_PARK_DISTANCE` invariant, and the
// `gateZAtParkProgress` solver now live in the `corridorMap` kernel.
// The `STATION_*` exports below are convenience aliases of the solved
// stations so existing gate / painter imports keep working; the
// world-Z, half-extent, and park progress all derive from the map.

/** Raw-progress end of the mobile Thoughtform DWELL — the scroll span
 *  that holds BOTH mobile moments (copy, then brandmark+diagram) before
 *  the corridor fly begins. The mobile stage is taller (see
 *  `home-v2.css` `@media (max-width:760px)`) so this 0..0.38 raw window
 *  is ~two viewports of scroll. `getMobilePaintProgress` maps the whole
 *  dwell into the camera-hold span `[0, dollyHoldEnd]` so the camera is
 *  still through both moments; the fly owns `[0.38, 1]`. */
export const MOBILE_THOUGHTFORM_END = 0.38;

/**
 * Mobile-only paint-progress remap — two mobile Thoughtform moments,
 * then fly.
 *
 * On desktop the Thoughtform beat spends [park, dollyHoldEnd] panning
 * the brandmark to centre while the camera Z dolly is held at 0. On
 * mobile the mark is already centred (`getThoughtformCenterOffsetX`
 * returns 0), and the beat is sequenced into two scroll moments — copy
 * alone, then the brandmark + compass diagram — both of which want the
 * camera HELD. So the entire dwell `[0, MOBILE_THOUGHTFORM_END]` is
 * mapped into the camera-hold span `[0, dollyHoldEnd]` (where
 * `cameraZDollyT` ≡ 0), and everything past the dwell is rescaled to
 * run the dolly + ring flythrough to completion at progress = 1.
 *
 * The copy fade, brandmark fade + slide, compass + phase-label reveal
 * are NOT driven by this remap — they come from `getThoughtformMobilePhase`
 * (keyed off raw progress) so they can sequence WITHIN the held dwell.
 *
 * Continuous + monotonic at the seam `p = MOBILE_THOUGHTFORM_END` (both
 * branches → `dollyHoldEnd`); `cameraZDollyT(dollyHoldEnd) = 0`, so the
 * camera Z is identical on both sides — no pop. Every visual reads
 * `paintProgress`, so the whole timeline shifts coherently. Caller gates
 * this behind `isMobileComposition()`. (ADR-018 mobile revision.)
 */
export function getMobilePaintProgress(progress: number): number {
  const p = clamp01(progress);
  const dwell = MOBILE_THOUGHTFORM_END;
  const hold = CORRIDOR_TIMELINE.dollyHoldEnd;
  if (p <= dwell) return (p / dwell) * hold;
  return hold + ((p - dwell) * (1 - hold)) / (1 - dwell);
}

/** Per-element factors for the mobile two-moment Thoughtform beat,
 *  keyed off RAW scroll progress (not `paintProgress`, which is pinned
 *  into the held span across the dwell). Consumers multiply these in:
 *
 *   - `copyFactor`    1 → 0 : copy block opacity (Moment 1 → fades out).
 *   - `diagramFactor` 0 → 1 : brandmark + compass + phase-label opacity
 *                             (fades in for Moment 2; saturates to 1 by
 *                             0.30 so it stays full through the fly).
 *   - `slideY` world-Y added to brandmark + compass + phase labels:
 *                eases from below-centre up to centre as the diagram
 *                fades in ("scrolls into the middle").
 *
 *  Desktop short-circuits to the identity `{1, 1, 0}` so every consumer
 *  can multiply unconditionally and desktop is provably unchanged. */
export interface ThoughtformMobilePhase {
  copyFactor: number;
  diagramFactor: number;
  slideY: number;
}

const MOBILE_BRANDMARK_SLIDE_FROM = -0.55;

export function getThoughtformMobilePhase(rawProgress: number): ThoughtformMobilePhase {
  if (!isMobileComposition()) return { copyFactor: 1, diagramFactor: 1, slideY: 0 };
  const p = clamp01(rawProgress);
  const copyFactor = 1 - smoothstep(0.12, 0.19, p);
  const diagramFactor = smoothstep(0.16, 0.3, p);
  const slideY = lerp(MOBILE_BRANDMARK_SLIDE_FROM, 0, smoothstep(0.16, 0.32, p));
  return { copyFactor, diagramFactor, slideY };
}

/** Thoughtform compass — off-axis-right at parked rest so the
 *  parked frame reads as a balanced two-column composition: copy
 *  on the left half, brandmark + compass on the right half, both
 *  well clear of the HUD rails (matches the v7 home page).
 *
 *  The camera path stays axial (X=0 throughout). The brandmark's
 *  world-space TRAVEL between Thoughtform and Diagnostic anchors
 *  (see `getBrandmarkWorldPosition`) naturally migrates the
 *  compass to dead-centre during passthrough-01, so the user reads
 *  "compass slides toward centre, copy slides off-screen left" as
 *  a single continuous camera move. No reframe envelope needed. */
export const STATION_THOUGHTFORM: GateStation = stationById("thoughtform")!;

/** Navigate landmark — a fly-through gate parked at a Z inside
 *  passthrough-01 (the camera passes through it), giving the Navigate
 *  phase a named "place" between the setup and Encode. */
export const STATION_NAVIGATE: GateStation = stationById("navigate")!;

/** Diagnostic orbital field — centred. By the time the user parks
 *  here, the camera reframe has resolved to X=0, so this gate sits
 *  dead-centre on the optical axis.
 *
 *  Park progress pushed from 0.41 to 0.47 (and the
 *  passthrough-01 window widened to 0.16-0.40 in
 *  `BEAT_WINDOWS`) so the gate's solved world Z sits several
 *  units deeper in the corridor than before. The viewer crosses
 *  significantly more world distance before this gate appears at
 *  parked rest, and the orbital geometry visibly approaches from
 *  the distance rather than fading in at screen-scale. */
export const STATION_DIAGNOSTIC: GateStation = stationById("diagnostic")!;

/** Interstitial waypoint — sits in the middle of passthrough-02 so
 *  the camera passes through it on the way to Intelligence. Park
 *  progress comes from `CORRIDOR_TIMELINE.interstitialPark`
 *  because the interstitial beat is a transit waypoint and does
 *  not have a `BEAT_PARK_CENTRES` entry. */
export const STATION_INTERSTITIAL: GateStation = stationById("interstitial")!;

/** Intelligence sphere station — centre of the substrate-cut beat.
 *  The substrate sphere + L/R side bodies all live in this group. */
export const STATION_INTELLIGENCE: GateStation = stationById("intelligence")!;

// ── Thoughtform centering pan ────────────────────────────────────

/** Lateral X offset (world units) for the Thoughtform composition
 *  at the current global progress. Smoothsteps from 0 (parked off-
 *  axis-right) to `-STATION_THOUGHTFORM.position[0]` (composition
 *  dead-centred) across `CORRIDOR_TIMELINE.thoughtformPan`. The
 *  pan applies the SAME `dx` to every Thoughtform-anchored element
 *  each frame, so the world reads as a single camera-pan rather
 *  than independent object motions. */
export function getThoughtformCenterOffsetX(progress: number): number {
  // Mobile composition: there is no two-column → centred pan. The
  // whole Thoughtform composition (compass + brandmark + phase
  // labels) is pre-centred on the optical axis for the entire beat so
  // the stacked layout (copy above the mark) reads cleanly on a narrow
  // portrait frame. The same offset is folded into the copy anchor and
  // brandmark travel, so every Thoughtform-anchored element stays
  // co-centred. (ADR-018 mobile revision.)
  if (isMobileComposition()) return -STATION_THOUGHTFORM.position[0];
  const { start, end } = CORRIDOR_TIMELINE.thoughtformPan;
  if (progress <= start) return 0;
  if (progress >= end) return -STATION_THOUGHTFORM.position[0];
  // smootherstep — Ken Perlin's C2-continuous easing (6t^5 - 15t^4
  // + 10t^3) — has zero velocity AND zero acceleration at both ends.
  // Compared to `smoothstep` (3t^2 - 2t^3, C1-continuous, non-zero
  // acceleration at the boundary) this kills the scroll-back snap at
  // `progress = start`: when the user reverses scroll across the pan
  // window the rectangular gateway + brandmark + copy ease off the
  // axis instead of jumping. (v3.1 polish pass.)
  const t = (progress - start) / (end - start);
  const s = t * t * t * (t * (t * 6 - 15) + 10);
  return -STATION_THOUGHTFORM.position[0] * s;
}

/** "Gateway boot-up" envelope (0..1) used by painters that want to
 *  intensify subtly the moment the Thoughtform composition centres.
 *  Read as: the gateway is powering on as the brandmark + diagrams
 *  slide into the optical axis, briefly holds at full as the parked
 *  composition reads, then gently relaxes as the camera starts to
 *  push down the corridor.
 *
 *  Phases are owned by `CORRIDOR_TIMELINE.thoughtformBoot` —
 *  ramp-up runs alongside the centering pan, hold spans the early
 *  ring flythrough, relax fades through the start of
 *  passthrough-01.
 *
 *  Used by `StaticStarfield`, `ThoughtformAtmosphere`, `CelestialMotes`,
 *  and `ThoughtformCompassGate` — kept as ONE function so the
 *  lighting beat is unified across painters. */
export function getThoughtformBootEnvelope(progress: number): number {
  const { preBoot, rampEnd, holdEnd, relaxEnd } = CORRIDOR_TIMELINE.thoughtformBoot;
  if (progress <= preBoot) return 0;
  if (progress <= rampEnd) return smoothstep(preBoot, rampEnd, progress);
  if (progress <= holdEnd) return 1;
  if (progress <= relaxEnd) return 1 - smoothstep(holdEnd, relaxEnd, progress);
  return 0;
}

/** Build-approach ambient fade.
 *
 *  The corridor's ambient framing layers (wormhole rail walls,
 *  drifting latent-field dots, contour shards, intergate debris,
 *  celestial motes) read as decorative noise once we arrive at the
 *  Build park — they crowd the left/right edges of the frame while
 *  the substrate gimbal + sources/surfaces stack should be the
 *  centre of attention. This helper returns 1 across the early
 *  corridor and fades to 0 across the approach to the Build park.
 *
 *  Window [0.86, 0.97] (v3.2 wormhole-exit retune): pushed later than
 *  the original [0.80, 0.915] so the wormhole walls remain VISIBLE
 *  through their `uExitWarp` widen — the tube has to splay open
 *  BEFORE it dissolves, otherwise the exit reads as a hard fade.
 *  The ambient still clears by passthrough-02 / Build-park edge,
 *  leaving a clean stage for the gimbal landing. Bonus: during the
 *  epilogue `paintProgress` is pinned at 1, so the ambient stays
 *  gone — the planet flyover gets a clean stage.
 *
 *  Layers that read this fade are listed in their own comments
 *  (LatentWormholeWalls, LatentFieldTunnel, LatentTopographyContours,
 *  InterGateCorridor, CelestialMotes). `StaticStarfield`, `ShellStack`
 *  and the gimbal are intentionally NOT in this group. */
export function getBuildApproachFade(paintProgress: number): number {
  return 1 - smoothstep(0.86, 0.97, paintProgress);
}

/** Wormhole-exit warp (v3.7).
 *
 *  Drives the forward MOUTH dilation of the wormhole rails as the
 *  camera flies from Encode toward Build (see the `uExitWarp` block in
 *  `LatentWormholeWalls`). 0 across the rest of the corridor; ramps
 *  0 -> 1 across [0.64, 0.85] of paintProgress.
 *
 *  v3.7 pulled the PEAK earlier (0.91 -> 0.85). At 0.91 the mouth was
 *  fully open right AT the Build park (~0.923), so the "wormhole warps"
 *  read landed on top of the Build composition instead of before it.
 *  Peaking at 0.85 means the mouth has finished morphing during the
 *  Encode->Build passthrough; the ambient walls then dissolve
 *  (`getBuildApproachFade` [0.86, 0.97]) as the substrate stack docks.
 *  Sequence: exit Encode -> streaks (see `getWormholeExitStreak`) ->
 *  mouth warps + dissolves -> Build park. */
export function getWormholeExitWarp(paintProgress: number): number {
  return smoothstep(0.64, 0.85, paintProgress);
}

/** Wormhole-exit STREAK envelope (v3.7).
 *
 *  Dedicated bell curve for the leg-2 acceleration streaks
 *  (`LatentWormholeWalls` `<lineSegments>`). The streaks must read as a
 *  PRE-Build event — the "you are exiting the wormhole" warp-speed
 *  flow that fires as the camera leaves Encode and is GONE before the
 *  Build-on-the-Substrate composition forms.
 *
 *  Previously the streaks shared `getWormholeExitWarp` (peak 0.91) +
 *  `getBuildApproachFade` (fade 0.86 -> 0.97), so they peaked and
 *  lingered right as Build docked — they read as a Build-section
 *  event. This bell instead:
 *    - ramps 0 -> 1 across [0.64, 0.76] (camera leaving the Encode
 *      park, centre ~0.636 / window end ~0.700), so the streaks are
 *      already streaming as you exit Encode;
 *    - peaks across the mid-passthrough (~0.76 -> 0.80);
 *    - fades 1 -> 0 across [0.80, 0.88], so they're gone BEFORE the
 *      Build stack accretion ([0.84, 0.91]) and the Build park
 *      (~0.923). 0 through the epilogue (paintProgress pinned at 1). */
export function getWormholeExitStreak(paintProgress: number): number {
  const rampUp = smoothstep(0.64, 0.76, paintProgress);
  const fadeOut = 1 - smoothstep(0.8, 0.88, paintProgress);
  return rampUp * fadeOut;
}

// ── Thoughtform compass flythrough ───────────────────────────────

/** Per-ring flythrough state for the Thoughtform compass.
 *
 *  - `dz` is the Z translation to add to the ring's gate-relative
 *    origin each frame (gate is at world Z=5.5, ring's local Z is 0,
 *    so the ring's world Z = 5.5 + dz).
 *  - `travelT` is the local 0..1 travel factor. Opacity is NOT
 *    returned here anymore; painters derive that from camera-space
 *    depth so the rings fade because they cross the camera/focus
 *    plane, not because a progress window ended.
 *
 *  Window + Z distance owned by `CORRIDOR_TIMELINE.flythrough` +
 *  `flythroughZDistance`. */
export function getThoughtformRingFlythrough(
  progress: number,
  ringIndex: number
): { dz: number; travelT: number } {
  const windows = CORRIDOR_TIMELINE.flythrough;
  const w = windows[ringIndex] ?? windows[0];
  const Z = CORRIDOR_TIMELINE.flythroughZDistance;
  if (progress <= w.start) return { dz: 0, travelT: 0 };
  if (progress >= w.end) return { dz: Z, travelT: 1 };
  const t = smoothstep(w.start, w.end, progress);
  return { dz: t * Z, travelT: t };
}

// ── Brandmark anchors (world space, attached to gate centres) ────

/** Brandmark anchor at the parked Thoughtform beat — sits at the
 *  GATE CENTRE (slightly in front so it composites above the rings).
 *  Because the anchor is rigidly co-located with the gate, the mark
 *  always lands inside the diamond regardless of viewport. */
export const BRANDMARK_ANCHOR_THOUGHTFORM: [number, number, number] = [
  STATION_THOUGHTFORM.position[0],
  STATION_THOUGHTFORM.position[1],
  STATION_THOUGHTFORM.position[2] + 0.1,
];

/** Brandmark anchor at the parked Intelligence beat — centre of the
 *  substrate sphere. */
export const BRANDMARK_ANCHOR_INTELLIGENCE: [number, number, number] = [
  STATION_INTELLIGENCE.position[0],
  STATION_INTELLIGENCE.position[1],
  STATION_INTELLIGENCE.position[2] + 0.1,
];

/** Camera-relative lead point for the brandmark across the
 *  Diagnostic-park → Intelligence-arrival arc. The brandmark is a
 *  lead artifact ahead of the camera; the camera subtly looks
 *  toward this point (see `getCameraLookAt`) while the substrate
 *  sphere owns the later scale-up moment.
 *
 *  Lead distance is a two-phase envelope:
 *
 *  - **Park hold (p < 0.52)** — held at `PARK_LEAD` so the brandmark
 *    sits at the same apparent size as the camera dollies through
 *    the Diagnostic gate. Because `PARK_LEAD` matches the camera-
 *    to-Diagnostic-anchor distance at the park CENTRE (p ≈ 0.47),
 *    the brandmark coincides with the orbital field plane at the
 *    centre of the park: it leads the camera into the gate, sits
 *    on the gate plane at park centre, and drifts slightly behind
 *    the gate as the camera exits the park. The PARKED brandmark
 *    therefore recedes in lock-step with the camera (constant
 *    apparent size) instead of growing as a world-rigid anchor that
 *    the camera approached. This removes the "comes closer to the
 *    camera before receding" jank where the brandmark used to
 *    appear to grow through the Diagnostic park then snap to a
 *    smaller lead-mode size at p=0.52.
 *
 *  - **Transit pull (p = 0.52 → 0.76)** — lead grows from
 *    `PARK_LEAD` to `FULL_LEAD` so the brandmark visibly drifts
 *    deeper into the corridor while the camera follows. Apparent
 *    size shrinks continuously (distance growth + a small world
 *    half-extent ramp in `getBrandmarkWorldHalfExtent`) — the
 *    brandmark is heading for the Intelligence anchor.
 *
 *  - **Landing (p > ~0.74)** — once `rawLead.z` would carry past
 *    the Intelligence anchor's world Z, the brandmark FREEZES at
 *    that anchor while the camera continues to approach. The
 *    substrate-cut takes over the visible role from the
 *    intelligence beat onward, so the final approach reads as
 *    "camera dollies into the substrate" rather than "brandmark
 *    comes back at us". */
export function getBrandmarkLeadWorldPosition(progress: number): [number, number, number] {
  const cam = getCameraPosition(progress);
  const forward = getCameraForward(progress);

  /** Held lead distance across the Diagnostic-park beat. Equals the
   *  camera-to-Diagnostic-anchor distance at the park CENTRE, where
   *  camera-to-gate = `STATION_DIAGNOSTIC.parkDistance` (4.5 by
   *  default; 6.2 after the lab-match shell-oversight revision) and
   *  the anchor sits +0.1 in front of the gate plane. Holding the
   *  lead at this value through the entire park keeps the brandmark's
   *  APPARENT SIZE stable as the camera dollies through — and makes
   *  the brandmark coincide with the orbital field plane exactly at
   *  the park centre, so the parked composition still reads as
   *  "brandmark at the centre of the Diagnostic gate" regardless of
   *  how far back the camera is pulled for shell oversight. */
  const PARK_LEAD = STATION_DIAGNOSTIC.parkDistance - 0.1;
  const FULL_LEAD = 7.2;
  // Transit pull from `CORRIDOR_TIMELINE.brandmarkLeadPull` — held
  // through the Diagnostic park, then grows to FULL_LEAD by the
  // end of passthrough-02. Drifted slightly past the
  // passthrough-02 boundary so the brandmark holds its parked
  // apparent size through the entire widened Diagnostic beat.
  const { start: pullStart, end: pullEnd } = CORRIDOR_TIMELINE.brandmarkLeadPull;
  const pullT = smoothstep(pullStart, pullEnd, progress);
  const leadDistance = lerp(PARK_LEAD, FULL_LEAD, pullT);

  // Y is pinned to the camera height (the corridor axis), NOT
  // `forward[1] * leadDistance`. The camera look-at carries a subtle
  // vertical bob (`LOOK_BOB_AMPLITUDE`) for a hand-flown gaze; letting
  // the brandmark lead inherit that bob made the mark (and the shell
  // compass + orbits tracking it) drift vertically through the
  // Diagnostic → Intelligence approach and then SNAP down to the
  // static Intelligence anchor (Y=0) at the Build landing — the
  // "moves down a beat entering Build" the bob caused. Pinning Y to
  // `cam[1]` (= 0) keeps the mark centred on the axis end-to-end and
  // makes the landing handoff C0-continuous in Y.
  const rawLead: [number, number, number] = [
    cam[0] + forward[0] * leadDistance,
    cam[1],
    cam[2] + forward[2] * leadDistance,
  ];

  // Cap at Intelligence anchor: once the rawLead would carry the
  // brandmark past the Intelligence anchor (in the camera-forward
  // direction, which is -Z down the corridor), freeze it there.
  const intel = BRANDMARK_ANCHOR_INTELLIGENCE;
  if (forward[2] < 0 && rawLead[2] <= intel[2]) {
    return [intel[0], intel[1], intel[2]];
  }

  return rawLead;
}

/** Resolve the brandmark world position for the current GLOBAL
 *  progress. Smoothly interpolates between the three parked anchors
 *  across the beat windows so the mark TRAVELS through world space.
 *
 *  After the 2026-05-25 recede-continuity pass, the brandmark is in
 *  LEAD MODE from the end of the Thoughtform → Diagnostic arrival
 *  lerp (p ≈ 0.44) through the start of the Intelligence park
 *  (p ≈ 0.86). The previous world-rigid "parked at Diagnostic anchor"
 *  phase (p = 0.44 → 0.52) made the brandmark visibly grow as the
 *  camera dollied into the gate and then snap to a smaller size when
 *  lead mode took over at p=0.52. Replacing it with a held lead
 *  distance keeps the brandmark's apparent size stable across the
 *  whole Diagnostic beat — it recedes in lock-step with the camera
 *  through the park, then visibly drifts deeper as the lead grows
 *  toward `FULL_LEAD` through passthrough-02. See
 *  `getBrandmarkLeadWorldPosition` for the two-phase envelope.
 *
 *  NOTE (2026-06-08): an earlier pass dropped the brandmark world-Y by
 *  -0.3 after Thoughtform to free the upper band for the station
 *  headers. Now that the headers are a flat 2D top-band overlay
 *  (`CorridorStationHeaders`, not world-projected), the drop is no
 *  longer needed and was removed so the gimbal + brandmark sit
 *  centred in the frame. */
export function getBrandmarkWorldPosition(
  progress: number,
  rawProgress: number = progress
): [number, number, number] {
  // Phase breakpoints from `CORRIDOR_TIMELINE.brandmark` — the
  // travel arc deliberately overshoots the matching beat
  // boundaries (`thoughtformHold: 0.16` sits 0.02 past the
  // Thoughtform beat end so the parked composition holds visibly
  // into early passthrough-01; `intelligenceLanding: 0.88`
  // matches `BEAT_PARK_CENTRES.intelligence`).
  const { thoughtformHold, diagnosticArrival, intelligenceLanding } = CORRIDOR_TIMELINE.brandmark;

  // Apply the Thoughtform centering pan to the THOUGHTFORM-side
  // anchor X each frame so the brandmark slides laterally with the
  // compass + copy during the pan window. By the time the travel
  // envelope below kicks in the offset has fully resolved to
  // -STATION_THOUGHTFORM.position[0], which puts the Thoughtform
  // anchor on the world axis — matching the Diagnostic lead
  // position's X — so the X-lerp is effectively a no-op and Y/Z
  // do all the travel work, as designed.
  //
  // 2026-06-09 elegance pass: the offset is the SMOOTHED follower
  // value (see `motionFollower.ts`) so the right → centre pan eases
  // in and out on wall-clock time even under a fast flick. Every
  // pan consumer (compass gate, atmosphere, copy anchors) reads the
  // same smoothed channel, so the composition still slides as one
  // rigid camera-pan.
  const tfOffsetX = getSmoothedThoughtformOffsetX();
  const tfX = BRANDMARK_ANCHOR_THOUGHTFORM[0] + tfOffsetX;

  if (progress <= thoughtformHold) {
    // Mobile two-moment beat: the mark slides up from below-centre to
    // centre as Moment 2 fades it in (no-op on desktop → slideY 0).
    const { slideY } = getThoughtformMobilePhase(rawProgress);
    return [tfX, BRANDMARK_ANCHOR_THOUGHTFORM[1] + slideY, BRANDMARK_ANCHOR_THOUGHTFORM[2]];
  }
  if (progress <= diagnosticArrival) {
    // Arrival lerp lands at the LEAD position at `diagnosticArrival`,
    // not the static Diagnostic anchor, so the lerp → lead handoff
    // is C0-continuous and the brandmark transitions seamlessly
    // into the held-lead park. The lead-at-arrival position sits
    // slightly in front of the Diagnostic gate plane; by the park
    // centre (BEAT_PARK_CENTRES.diagnostic = 0.53) the held lead
    // crosses the gate plane and the brandmark coincides exactly
    // with the orbital field centre.
    const t = smoothstep(thoughtformHold, diagnosticArrival, progress);
    const diagLeadStart = getBrandmarkLeadWorldPosition(diagnosticArrival);
    return [
      lerp(tfX, diagLeadStart[0], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[1], diagLeadStart[1], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[2], diagLeadStart[2], t),
    ];
  }
  // Lead mode owns the Diagnostic-park → Intelligence-landing
  // window (held during the Diagnostic park, growing across
  // passthrough-02). The legacy park-hold-at-anchor branch is
  // intentionally gone — it grew the brandmark as the camera
  // dollied into the gate and snapped to a smaller size when lead
  // mode kicked in.
  if (progress <= intelligenceLanding) return getBrandmarkLeadWorldPosition(progress);
  return BRANDMARK_ANCHOR_INTELLIGENCE;
}

/** WORLD-SPACE half-extent (radius) of the brandmark plate at each
 *  parked beat. Sized so the perspective projection lands at a
 *  visually sensible scale relative to its gate's geometry — large
 *  enough to read inside the compass diamond, small inside the
 *  Diagnostic constellation centre, and largest at Intelligence
 *  where the substrate is the centrepiece. */
export const BRANDMARK_WORLD_HALF_EXTENT = {
  // Thoughtform (opening composition) is intentionally unchanged so
  // the parked compass + copy stays byte-identical.
  thoughtform: 0.32,
  // Diagnostic / Intelligence parked sizes bumped 0.28 → 0.34 and
  // transitLead 0.24 → 0.29 (2026-06-08 instrument-enlarge pass, ~1.2x)
  // so the central brandmark grows with the gimbal now that the
  // instrument is re-centred (drop removed) and has the space. Because
  // ProjectedBrandmarkActor projects a world edge through the camera
  // each frame, perspective handles the size naturally across approach,
  // park, and pull-away — no scroll momentum break, no parallax
  // mismatch with the orbits.
  diagnostic: 0.34,
  // Mid-transit (lead position during passthrough-02). Slightly
  // smaller than the parked sizes so the mark reads as a distant
  // lead as the camera dollies through the gap.
  transitLead: 0.29,
  // Intelligence (Build) parked size matches the Encode park so the
  // brandmark does NOT shrink on landing — the compass + four
  // primitive labels read at the same scale through Encode + Build.
  intelligence: 0.34,
} as const;

/** Brandmark world half-extent for the current scroll position.
 *  Lerps using the same `CORRIDOR_TIMELINE.brandmark` windows as
 *  `getBrandmarkWorldPosition` so the mark perspective-scales
 *  naturally as it travels. */
export function getBrandmarkWorldHalfExtent(progress: number): number {
  const H = BRANDMARK_WORLD_HALF_EXTENT;
  // Portrait widens the vertical FOV (see `getCameraFov`), which shrinks
  // the mark's apparent size at the Thoughtform park. Bump its world
  // half-extent on mobile so it keeps real presence inside the diamond.
  // (ADR-018 mobile revision.)
  const thoughtformExtent = isMobileComposition() ? 0.4 : H.thoughtform;
  const {
    thoughtformHold,
    diagnosticArrival,
    diagnosticHold,
    intelligenceArrival,
    intelligenceLanding,
  } = CORRIDOR_TIMELINE.brandmark;
  if (progress <= thoughtformHold) return thoughtformExtent;
  if (progress <= diagnosticArrival)
    return lerp(
      thoughtformExtent,
      H.diagnostic,
      smoothstep(thoughtformHold, diagnosticArrival, progress)
    );
  if (progress <= diagnosticHold) return H.diagnostic;
  if (progress <= intelligenceArrival)
    return lerp(
      H.diagnostic,
      H.transitLead,
      smoothstep(diagnosticHold, intelligenceArrival, progress)
    );
  if (progress <= intelligenceLanding)
    return lerp(
      H.transitLead,
      H.intelligence,
      smoothstep(intelligenceArrival, intelligenceLanding, progress)
    );
  return H.intelligence;
}

// ── Copy + label world anchors ───────────────────────────────────

import { epilogueBand, getEpiloguePlanetScale } from "@/lib/home-v2/epilogueTimeline";
import type { Beat, DepthGatewayTransform } from "@/lib/stores/depthGatewayStore";
import { gyroTilt, useGyroLabStore } from "@/lib/stores/gyroLabStore";
import type { WorldAnchor, WorldAnchorPosition } from "../hooks/useWorldDomTracker";
import {
  GYRO_ASSEMBLY_SCALE,
  STACK_FAN_COUNT,
  STACK_FAN_HALF_HEIGHT,
  STACK_LANE_COUNT,
  STACK_LANE_Y_RANGE,
  SUBSTRATE_GYRO_GLOBE_RADIUS,
  getPrimitiveLabelOffset,
  petalStagger,
  SHELL_PRIMITIVES,
} from "./shell/shellGeom";

/** Depth offset (world units, negative = deeper behind parked Z)
 *  applied to the Diagnostic head copy and orbit label pills during
 *  the passthrough-01 approach. Window + offset from
 *  `CORRIDOR_TIMELINE.diagnosticApproach`. Combined with each
 *  anchor's perspectiveScale + `depthFade`, the labels read as
 *  GENUINELY DISTANT objects that fly toward the orbits across the
 *  fly-through, not already-landed text that just shrinks slightly
 *  via perspective alone. */
function diagnosticApproachDepthOffset(progress: number): number {
  const { offset, start, end } = CORRIDOR_TIMELINE.diagnosticApproach;
  return lerp(offset, 0, smoothstep(start, end, progress));
}

/** Depth offset (world units, negative = deeper behind parked Z)
 *  applied to the Intelligence head copy and side-body labels during
 *  the passthrough-02 approach. Window + offset from
 *  `CORRIDOR_TIMELINE.intelligenceApproach` — labels start behind
 *  parked Z just past the Diagnostic park and converge to the
 *  parked Intelligence plane by mid-intelligence. */
function intelligenceApproachDepthOffset(progress: number): number {
  const { offset, start, end } = CORRIDOR_TIMELINE.intelligenceApproach;
  return lerp(offset, 0, smoothstep(start, end, progress));
}

// ── Stack-v3 aspect-adaptive column layout ───────────────────────
//
// The Build sources/surfaces previously sat at a FIXED `STACK_*_X = ±2.4`
// in shell-local coords. After the GYRO_ASSEMBLY_SCALE (1.18) the docked
// pips landed at ±2.83 world units, with DOM label chips growing OUTWARD
// from each pip — so on viewports where the frustum half-width at the
// Build park (~3.2 at 1.5:1 desktop) was tighter than 2.83 + chip width,
// the labels were guaranteed to crop off the screen.
//
// Stack v3 (2026-06-10 polish round 3) computes the column X live from
// the camera's frustum width at the Build park distance, capped at the
// original 2.16 (so wide viewports still get a clean two-column read,
// not a stretched-out funnel). DOM labels grow INWARD toward the
// sphere, never outward, so cropping is impossible by construction.

/** Live shell-local X for the source/surface columns at the Build park
 *  (DOM anchors + canvas pip positions both call this so they stay
 *  welded). Returns a NEGATIVE value for the source side (the caller
 *  applies the sign).
 *
 *  Polish round 4 (2026-06-10): cap trimmed 2.16 -> 1.92 so the
 *  columns hug the sphere tighter on wide viewports — the previous
 *  cap let the registry columns drift toward the frame edges on
 *  16:9+, which read as oversized/detached. */
const STACK_COLUMN_X_CAP = 1.92;
const STACK_COLUMN_MARGIN = 0.4;
export function getStackColumnLocalX(aspect: number): number {
  const fovDeg = getCameraFov(aspect);
  const fovRad = (fovDeg * Math.PI) / 180;
  const halfH = STATION_INTELLIGENCE.parkDistance * Math.tan(fovRad / 2);
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
  const halfW = halfH * safeAspect;
  const local = (halfW - STACK_COLUMN_MARGIN) / GYRO_ASSEMBLY_SCALE;
  return Math.min(STACK_COLUMN_X_CAP, Math.max(1.4, local));
}

/** Live aspect read used by DOM-side anchor resolvers. Pulled into a
 *  helper so SSR / non-browser environments fall back to a sensible
 *  16:9 default. */
export function getLiveAspectForStack(): number {
  if (typeof window === "undefined" || !window.innerHeight) return 16 / 9;
  return window.innerWidth / window.innerHeight;
}

/** Brandmark accretion reveal envelopes — one per layer of the
 *  intelligence layer + stack that accretes around the travelling
 *  brandmark:
 *
 *   - `substrate` (Navigate): gold geodesic — layer boundary.
 *   - `orbits` (Encode): judgment orbits around the layer.
 *   - `stack` (Build): sources lanes + surfaces fan dock the layer.
 *
 *  All three are PERSISTENT — once revealed, they hold through Build. */
export function getBrandmarkAccretionLayers(progress: number): {
  substrate: number;
  orbits: number;
  stack: number;
} {
  const { substrate, orbits, stack } = CORRIDOR_TIMELINE.accretion;
  return {
    substrate: smoothstep(substrate.start, substrate.peakAt, progress),
    orbits: smoothstep(orbits.start, orbits.peakAt, progress),
    stack: smoothstep(stack.start, stack.peakAt, progress),
  };
}

// ── Navigate apparent-size boost ─────────────────────────────────
//
// At the Navigate park (paintProgress ~= 0.40) the camera sits ~7.9
// world units from the brandmark, vs ~6.1 at the Encode park — so
// the gimbal sphere reads ~29% smaller on screen at Navigate even
// though the assembly's local geometry is identical. Combined with
// the substrate unfold still settling (globe Y-bloom + ring tilt),
// the first place we introduce the gimbal felt visibly smaller than
// the same instrument at Encode.
//
// We bridge the gap with a uniform scale envelope on the gyro
// assembly (NOT on the camera path or station park distances — those
// stay calibrated for the flight feel). The envelope ramps in just
// before the Navigate park, holds across the park window, and eases
// back out before the orbits accretion begins, so the assembly is
// compensated only where the eye needs it.
//
// `BrandmarkAccretionShell` writes the canvas group's scale and
// `gyroAssemblyWorldPosition` mirrors the same factor for projected
// DOM labels — both must read this helper or labels desync from
// canvas geometry. (2026-06-10 polish-round-2 pass.)

/** Peak boost factor at the Navigate park. ~1.295 (the camera-distance
 *  ratio between Navigate and Encode parks) rounded to 1.30. */
const NAVIGATE_APPARENT_SIZE_BOOST = 1.3;
/** Ramp-in window — finishes JUST before the Navigate beat begins
 *  (pass-01a → navigate boundary at 0.355) so the boost is fully
 *  active when the camera arrives at the park. */
const NAVIGATE_BOOST_RAMP_IN_START = 0.3;
const NAVIGATE_BOOST_RAMP_IN_END = 0.355;
/** Ramp-out window — eases back to 1.0 well before the orbits
 *  accretion starts (0.52) so the Encode park is on the un-boosted
 *  scale and never has to compose against a ramping factor. */
const NAVIGATE_BOOST_RAMP_OUT_START = 0.445;
const NAVIGATE_BOOST_RAMP_OUT_END = 0.52;

/** Uniform scale factor to multiply the parked `GYRO_ASSEMBLY_SCALE`
 *  by, so the Navigate sphere reads at the same apparent size as
 *  the Encode gimbal. Composes with `getEpiloguePlanetScale`
 *  multiplicatively — outside the [0.30, 0.52] window this returns
 *  exactly 1.0 so existing windows are byte-identical. */
export function getNavigateApparentSizeBoost(paintProgress: number): number {
  const rampIn = smoothstep(
    NAVIGATE_BOOST_RAMP_IN_START,
    NAVIGATE_BOOST_RAMP_IN_END,
    paintProgress
  );
  const rampOut =
    1 - smoothstep(NAVIGATE_BOOST_RAMP_OUT_START, NAVIGATE_BOOST_RAMP_OUT_END, paintProgress);
  const envelope = Math.min(rampIn, rampOut);
  return 1 + (NAVIGATE_APPARENT_SIZE_BOOST - 1) * envelope;
}

/** Mobile inward-pull for the Thoughtform phase labels. Portrait FOV
 *  (widened by `getCameraFov`) spreads the gate-relative label offsets
 *  toward the frame edges, so on mobile they're scaled toward the gate
 *  centre to read clearly around the mark. */
const MOBILE_PHASE_SCALE = 0.7;

/** Position resolver for a Thoughtform phase label at gate-relative
 *  offset `[offsetX, offsetY]`. Folds in the centering pan (desktop)
 *  and, on mobile, pulls the offset inward (`MOBILE_PHASE_SCALE`) and
 *  rides the Moment-2 slide so the labels travel up with the mark. */
function thoughtformPhasePosition(offsetX: number, offsetY: number): WorldAnchorPosition {
  return (transform: DepthGatewayTransform) => {
    const mobile = isMobileComposition();
    const s = mobile ? MOBILE_PHASE_SCALE : 1;
    const slideY = mobile ? getThoughtformMobilePhase(transform.progress).slideY : 0;
    return [
      STATION_THOUGHTFORM.position[0] + offsetX * s + getSmoothedThoughtformOffsetX(),
      STATION_THOUGHTFORM.position[1] + offsetY * s + slideY,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ];
  };
}

/** onPaint: gate a Thoughtform copy block by the mobile copy factor so
 *  it fades out as Moment 2 begins. No-op on desktop (copyFactor 1). */
const gateThoughtformCopy: WorldAnchor["onPaint"] = (ctx, el) => {
  const { copyFactor } = getThoughtformMobilePhase(ctx.transform.progress);
  el.style.opacity = (ctx.visibilityOpacity * copyFactor).toFixed(3);
};

/** onPaint: gate a Thoughtform diagram element (compass-bearing phase
 *  label) by the mobile diagram factor so it appears only in Moment 2.
 *  No-op on desktop (diagramFactor 1). */
const gateThoughtformDiagram: WorldAnchor["onPaint"] = (ctx, el) => {
  const { diagramFactor } = getThoughtformMobilePhase(ctx.transform.progress);
  el.style.opacity = (ctx.visibilityOpacity * diagramFactor).toFixed(3);
};

/** Gate the Navigate station title/caption to the substrate accretion
 *  window so the text fades in with the gimbal sphere rather than
 *  trailing it. Visibility-beat coverage extends back into `pass-01a`
 *  so the substrate.start moment isn't clipped at the beat boundary.
 *  (2026-06-08 timing-sync pass.) */
const gateNavigateReadout: WorldAnchor["onPaint"] = (ctx, el) => {
  // Smoothed follower channel (== smoothstep over the substrate
  // window at rest) so the text fades in with the temporally-eased
  // gimbal unfold instead of the raw scrub.
  const reveal = getSmoothedAccretionLayers().substrate;
  el.style.opacity = (ctx.visibilityOpacity * reveal).toFixed(3);
};

/** Gate the Encode station title/caption to the orbits accretion
 *  window so the text fades in with the judgment orbits instead of
 *  arriving later. Mirrors `gateNavigateReadout` against the
 *  Encode-phase shell layer. */
const gateEncodeReadout: WorldAnchor["onPaint"] = (ctx, el) => {
  // Smoothed follower channel — fades with the eased orbit deploy.
  const reveal = getSmoothedAccretionLayers().orbits;
  el.style.opacity = (ctx.visibilityOpacity * reveal).toFixed(3);
};

/** Gate stack tier labels on the Build accretion envelope so Sources /
 *  Surfaces only read once the funnel docks.
 *
 *  2026-06-08 slot-in pass: when the element carries a
 *  `data-stack-side` (`sources` | `surfaces`) and a numeric
 *  `data-stack-idx`, opacity tracks that item's per-pip LOCK progress
 *  inside its cluster's stagger — so each DOM label fades in exactly
 *  as the canvas pip it labels snaps into place. Group labels (no
 *  attribute) keep the previous whole-envelope fade. */
const STACK_CLUSTER_OVERLAP_DOM = 0.3;
const STACK_ITEM_OVERLAP_DOM = 0.55;
/** Pixel distance each per-row chip travels (left → right) while its
 *  lock ramps. Matches the canvas pips' directional slides (flow
 *  pass, 2026-06-10): source chips ARRIVE rightward into the sphere
 *  (inputs), surface chips EMERGE rightward out of it along the
 *  output lines. Small — the slide is a direction cue, not a fly-in. */
const STACK_CHIP_SLIDE_PX = 14;
const gateStackLabel: WorldAnchor["onPaint"] = (ctx, el) => {
  const stack = getSmoothedAccretionLayers().stack;
  const side = el.getAttribute("data-stack-side");
  const idxAttr = el.getAttribute("data-stack-idx");
  let lock = stack;
  let slidePx = 0;
  if (side && idxAttr !== null) {
    const idx = Number(idxAttr);
    if (Number.isFinite(idx) && idx >= 0) {
      // Mirror `ShellStack`'s two-level stagger so labels and pips
      // share a single source of truth.
      const clusterIdx = side === "sources" ? 0 : 1;
      const clusterStagger = petalStagger(stack, clusterIdx, 2, STACK_CLUSTER_OVERLAP_DOM);
      const total = side === "sources" ? STACK_LANE_COUNT : STACK_FAN_COUNT;
      const item = petalStagger(clusterStagger, idx, total, STACK_ITEM_OVERLAP_DOM);
      const eased = item * item * item * (item * (item * 6 - 15) + 10);
      lock = eased;
      // Directional flow slide — both sides travel left → right with
      // the pipeline (in from the left, through the sphere, out to
      // the right), landing at 0 when the row locks.
      slidePx = -(1 - eased) * STACK_CHIP_SLIDE_PX;
    }
  }
  // Epilogue v2 fade: source/surface DOM labels clear with the canvas
  // stack pips/lanes on the shared BUILD_OUT band so the whole Build
  // composition leaves together (corridor cadence rule).
  const epFade = 1 - epilogueBand(ctx.transform.epilogueProgress, "BUILD_OUT");
  el.style.opacity = (ctx.visibilityOpacity * lock * epFade).toFixed(3);
  if (slidePx < -0.01) {
    // Appended AFTER the tracker's translate/origin/scale segments and
    // BEFORE the gyro bank rotations — the tracker rewrites the base
    // transform every frame for these anchors (perspectiveScale), so
    // this never accumulates.
    el.style.transform = `${el.style.transform} translateX(${slidePx.toFixed(2)}px)`;
  }
  applyGyroDomBank(el);
};

/** Per-cardinal cartridge stagger overlap for Encode. Higher overlap
 *  means each cardinal's curved fly-in spans a bigger slice of the
 *  `orbits` reveal — same parent envelope, but each cartridge's arc
 *  plays out more slowly. 0.62 (2026-06-08 elegance pass) reads as
 *  deliberate cartridge loading; was 0.45. */
const ENCODE_CARTRIDGE_OVERLAP = 0.62;

/** Order in which the cardinals fly in. Picked so the read circles
 *  the dial (north → east → south → west) — feels intentional, not
 *  arbitrary. SHELL_PRIMITIVES order is judgment(N)/taste(E)/craft(S)/voice(W),
 *  so the natural index order already matches. */
const ENCODE_CARTRIDGE_ORDER = [0, 1, 2, 3] as const;

function encodeCartridgeStagger(orbits: number, idx: number): number {
  const total = ENCODE_CARTRIDGE_ORDER.length;
  // Inverse map: find where this primitive sits in the fly-in order.
  const orderPos = ENCODE_CARTRIDGE_ORDER.indexOf(idx as 0 | 1 | 2 | 3);
  const slot = orderPos < 0 ? idx : orderPos;
  return petalStagger(orbits, slot, total, ENCODE_CARTRIDGE_OVERLAP);
}

/** Smoothstep helper local to the gate paints. */
function smoother(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Map staggered cartridge progress to a 0→1 curve with a soft
 *  overshoot near the end (punch). At t=1 we return exactly 1 so the
 *  parked position is byte-identical to the prior layout. */
function encodeCartridgeCurve(t: number): number {
  const base = smoother(t);
  if (t >= 1) return 1;
  // Small overshoot ~+0.08 at t≈0.78, decays to 0 at t=1.
  const punch = Math.sin(Math.PI * t) * 0.08 * (1 - t);
  return base + punch;
}

/** Gate Encode primitive labels on the orbits accretion envelope.
 *  2026-06-08 cartridge pass: opacity follows the per-cardinal
 *  stagger so each label fades on as its cartridge arrives (instead
 *  of all four fading in together). The position resolver (below)
 *  uses the SAME stagger to fly each cardinal inward from its outer
 *  start, with a curved tangential arc and overshoot punch.
 *
 *  Polish round 2 (2026-06-10): added depth cue — cardinals that
 *  bank to the back of the sphere (rotated Z > 0 in shell-local
 *  coords; camera looks toward -Z) dim their opacity and shrink
 *  slightly. The label visibly belongs to the rotating 3D assembly
 *  instead of reading as a flat sticker latched on a 3D object. */
const gateEncodePrimitive: WorldAnchor["onPaint"] = (ctx, el) => {
  const idxAttr = el.getAttribute("data-encode-cardinal-idx");
  const idx = idxAttr == null ? -1 : Number(idxAttr);
  const orbits = getSmoothedAccretionLayers().orbits;
  const stagger = idx >= 0 ? encodeCartridgeStagger(orbits, idx) : orbits;
  // Each cartridge's opacity ramps over the back-half of its stagger
  // so it "lights up" as it locks in, rather than ghosting during the
  // fly-in. Multiplied by the parent visibility envelope.
  const op = smoother(stagger);
  // Depth cue (polish round 2). Compute the cardinal's rotated Z
  // and dim/shrink as it swings to the back of the sphere.
  let depthOp = 1;
  let depthScale = 1;
  if (idx >= 0 && useGyroLabStore.getState().enabled) {
    const local = getGyroPrimitiveLabelLocal(idx);
    const rotated = rotateGyroLocalOffset(local);
    // Normalise rotated Z by the cardinal's planar radius so the
    // back/front classification is invariant of the per-stagger
    // radius animation.
    const r = Math.sqrt(local[0] * local[0] + local[1] * local[1]);
    if (r > 0) {
      const zNorm = Math.max(-1, Math.min(1, rotated[2] / r));
      // Front (zNorm <= 0): full read. Back (zNorm > 0): dim to
      // ~0.45 opacity, scale to ~0.88, so the label still reads as
      // present (you don't fully lose it) but visibly recedes.
      const backT = Math.max(0, zNorm);
      depthOp = 1 - backT * 0.55;
      depthScale = 1 - backT * 0.12;
    }
  }
  el.style.opacity = (ctx.visibilityOpacity * op * depthOp).toFixed(3);
  applyGyroDomBank(el, 0.8);
  if (depthScale !== 1) {
    el.style.transform = `${el.style.transform} scale(${depthScale.toFixed(3)})`;
  }
};

/** Rotate a shell-local offset by the lab gyroscope's assembly bank.
 *  This mirrors `BrandmarkAccretionShell`'s wrapper group so projected
 *  DOM labels belong to the same 3D object as the canvas geometry. */
function rotateGyroLocalOffset(local: readonly [number, number, number]): Vec3 {
  if (!useGyroLabStore.getState().enabled) return [local[0], local[1], local[2]];

  const cx = Math.cos(gyroTilt.x);
  const sx = Math.sin(gyroTilt.x);
  const cy = Math.cos(gyroTilt.y);
  const sy = Math.sin(gyroTilt.y);
  const cz = Math.cos(gyroTilt.z);
  const sz = Math.sin(gyroTilt.z);

  // Euler XYZ, matching `THREE.Group.rotation.set(x, y, z)` closely
  // enough for DOM anchor projection.
  const x1 = local[0];
  const y1 = local[1] * cx - local[2] * sx;
  const z1 = local[1] * sx + local[2] * cx;

  const x2 = x1 * cy + z1 * sy;
  const y2 = y1;
  const z2 = -x1 * sy + z1 * cy;

  return [x2 * cz - y2 * sz, x2 * sz + y2 * cz, z2];
}

function gyroAssemblyWorldPosition(
  transform: DepthGatewayTransform,
  local: readonly [number, number, number]
): Vec3 {
  // Scale the local offset by the same uniform factor the canvas
  // applies to the gyro assembly group (BrandmarkAccretionShell), so
  // projected DOM labels stay welded to the enlarged geometry. Only
  // when the gyro is enabled — flat-compass mode has no assembly scale.
  // The epilogue planet-grow multiplier composes on top so cardinals
  // scale with the planet (they fade out during BUILD_OUT/APPROACH
  // anyway, since they'd sit inside the planet at full grow).
  //
  // Polish round 2 (2026-06-10): also fold in the Navigate apparent-
  // size boost so DOM cardinal/group labels stay welded if the gyro
  // is scaled up around the Navigate park. The boost returns 1.0
  // outside the [0.30, 0.52] paintProgress window, so byte-identical
  // welding everywhere else.
  const base = useGyroLabStore.getState().enabled ? GYRO_ASSEMBLY_SCALE : 1;
  const s =
    base *
    getEpiloguePlanetScale(transform.epilogueProgress) *
    getNavigateApparentSizeBoost(transform.paintProgress);
  const scaledLocal: [number, number, number] = [local[0] * s, local[1] * s, local[2] * s];
  const [bx, by, bz] = getBrandmarkWorldPosition(transform.paintProgress);
  const [x, y, z] = rotateGyroLocalOffset(scaledLocal);
  return [bx + x, by + y, bz + z];
}

// ── Linear-style station header (desktop two-column) ──────────────
//
// Each parked station's TITLE + SUPPORT now sits as a top-band header
// on desktop (title upper-left, support upper-right, both anchored
// along the same Y band), freeing the lower half of the frame for the
// instrument geometry (gimbal sphere, encode orbits, build funnel).
// Mobile retains the legacy straddle (title above the reticle / support
// below) so the centred portrait composition keeps reading as a single
// HUD instrument. (2026-06-08 Linear-headers pass.)

/** Lateral offset for the title column (left of the gate centre).
 *  Tuned so the title cluster's left edge sits at ~10% from the
 *  viewport edge at parked distance 6.2 (FOV 38°) and the corner
 *  brackets are visible. */
const HEADER_TITLE_X = -2.0;
/** Lateral offset for the support column (right of the gate centre).
 *  Tuned so the support cluster's left edge sits just past the centre,
 *  with the right edge inside the frame at typical desktop widths. */
const HEADER_SUPPORT_X = 0.3;
/** Shared Y for the upper header band on desktop. */
const HEADER_TOP_Y = 1.4;

function stationHeaderPosition(
  station: GateStation,
  role: "title" | "support",
  mobileStraddleY: number,
  approachOffsetZ: number = 0
): Vec3 {
  const baseZ = station.position[2] + 0.1 + approachOffsetZ;
  if (isMobileComposition()) {
    return [station.position[0], station.position[1] + mobileStraddleY, baseZ];
  }
  const dx = role === "title" ? HEADER_TITLE_X : HEADER_SUPPORT_X;
  return [station.position[0] + dx, station.position[1] + HEADER_TOP_Y, baseZ];
}

/** Final parked radius for an Encode cardinal label (hugging the
 *  bezel ring at SUBSTRATE_GYRO_CARDINAL_RING_RADIUS ~1.08). */
const ENCODE_CARDINAL_FINAL_R = 1.0;
/** Outer start radius from which a cardinal cartridge flies in. Picked
 *  so each cartridge is clearly outside the parked instrument when its
 *  fly-in begins (a "tray-loading" feel) without leaving the gate's
 *  visible frame. */
const ENCODE_CARDINAL_START_R = 2.45;
/** Tangential arc offset (radians) at mid-fly. Slight curve so the
 *  cartridge doesn't fly in along a perfectly straight cardinal ray
 *  — reads as a load-arc with punch rather than a click-in. */
const ENCODE_CARDINAL_ARC_RAD = 0.22;

function getGyroPrimitiveLabelLocal(idx: number): Vec3 {
  const prim = SHELL_PRIMITIVES[idx];
  const [ox, oy] = getPrimitiveLabelOffset(idx);
  if (!useGyroLabStore.getState().enabled || !prim) return [ox, oy, 0.12];

  // Cardinal labels hug the new cardinal-bezel ring (~1.08 in
  // `shellGeom.SUBSTRATE_GYRO_CARDINAL_RING_RADIUS`). Was 1.34 — the
  // labels used to float outside the outermost gimbal ring (1.16) and
  // read as detached. (2026-06-08 cardinal-ring polish.)
  //
  // 2026-06-08 cartridge pass: at orbits = 0 the label sits at
  // ENCODE_CARDINAL_START_R along its cardinal direction; as the
  // per-cardinal staggered curve climbs to 1 it spirals inward to
  // ENCODE_CARDINAL_FINAL_R with a soft tangential arc + landing
  // overshoot. At progress = 1 the position is exactly the parked
  // value so the end state is byte-identical.
  const orbits = getSmoothedAccretionLayers().orbits;
  const stagger = encodeCartridgeStagger(orbits, idx);
  const tCurve = encodeCartridgeCurve(stagger);
  const r = ENCODE_CARDINAL_START_R + (ENCODE_CARDINAL_FINAL_R - ENCODE_CARDINAL_START_R) * tCurve;
  // Tangential arc: peaks at stagger ≈ 0.5, returns to 0 at stagger 1
  // so the parked angle is exact.
  const arc = Math.sin(Math.PI * stagger) * ENCODE_CARDINAL_ARC_RAD * (1 - stagger);
  const angle = prim.angleRad + arc;
  return [Math.cos(angle) * r, Math.sin(angle) * r, 0.18];
}

function applyGyroDomBank(el: HTMLElement, scale = 0.65): void {
  if (!useGyroLabStore.getState().enabled) return;

  const bankX = gyroTilt.x * (180 / Math.PI) * scale;
  const bankY = gyroTilt.y * (180 / Math.PI) * scale;
  const bankZ = gyroTilt.z * (180 / Math.PI) * scale;
  el.style.transformStyle = "preserve-3d";
  el.style.transform = `${el.style.transform} rotateX(${bankX.toFixed(2)}deg) rotateY(${bankY.toFixed(2)}deg) rotateZ(${bankZ.toFixed(2)}deg)`;
}

/**
 * COPY_ANCHORS — every DOM text element the world-DOM tracker
 * projects per frame. The order does not matter; the tracker walks
 * this list and matches against `[data-world-anchor="{id}"]` in the
 * DOM.
 *
 * Coordinate guidelines:
 *   - World units; positions are absolute (NOT local to a gate).
 *   - Z is slightly in front of the gate's Z so the projected DOM
 *     element composites above the canvas without depth-sort issues.
 */

// ── Build-phase per-item label registry ────────────────────────────
//
// Names are representative of typical Loop substrate / surface tools;
// counts mirror `ShellStack`'s pip arrays (5 lanes / 6 surfaces) and
// the Y positions exactly match the `sourcePipPositions` /
// `surfaceFanEnds` derivations there.

export interface StackItem {
  /** Stable DOM id suffix (`intelligence.source.{id}` / `…surface.{id}`). */
  id: string;
  label: string;
  /** Local Y inside the shell (matches ShellStack pip/tip positions). */
  y: number;
}

const STACK_SOURCE_NAMES = ["Snowflake", "Notion", "Monday", "Frontify", "CRM"] as const;
const STACK_SURFACE_NAMES = ["Cursor", "Claude", "Web app", "REST", "Slack", "Agents"] as const;

export const STACK_SOURCE_ITEMS: StackItem[] = Array.from({ length: STACK_LANE_COUNT }, (_, i) => ({
  id: STACK_SOURCE_NAMES[i].toLowerCase().replace(/\s+/g, "-"),
  label: STACK_SOURCE_NAMES[i] ?? `Source ${i + 1}`,
  y: lerp(-STACK_LANE_Y_RANGE, STACK_LANE_Y_RANGE, i / Math.max(1, STACK_LANE_COUNT - 1)),
}));

export const STACK_SURFACE_ITEMS: StackItem[] = Array.from({ length: STACK_FAN_COUNT }, (_, i) => ({
  id: STACK_SURFACE_NAMES[i].toLowerCase().replace(/\s+/g, "-"),
  label: STACK_SURFACE_NAMES[i] ?? `Surface ${i + 1}`,
  y: lerp(-STACK_FAN_HALF_HEIGHT, STACK_FAN_HALF_HEIGHT, i / Math.max(1, STACK_FAN_COUNT - 1)),
}));

/** Encode primitive label anchors — one per compass cardinal. */
const ENCODE_PRIMITIVE_ANCHORS: WorldAnchor[] = SHELL_PRIMITIVES.map((prim, idx) => ({
  id: `encode.primitive.${prim.id}`,
  position: (transform) => {
    return gyroAssemblyWorldPosition(transform, getGyroPrimitiveLabelLocal(idx));
  },
  // Visible from the Encode park (`diagnostic`) onward — the four
  // primitives ARE the encoded judgment, and the encoded layer persists
  // through Build, so the labels stay legible on the dock as well.
  visibilityBeats: ["diagnostic", "passthrough-02", "intelligence"],
  fadeFrac: 0.45,
  perspectiveScale: {
    referenceDistance: STATION_DIAGNOSTIC.parkDistance,
    min: 0.2,
    max: 1.05,
  },
  depthFade: {
    near: 0.9,
    nearFade: 2.2,
    far: STATION_DIAGNOSTIC.parkDistance + 2.4,
    farFade: 2.2,
  },
  onPaint: gateEncodePrimitive,
}));

export const COPY_ANCHORS: readonly WorldAnchor[] = [
  // ── Thoughtform ─────────────────────────────────────────────────
  // Left copy block: bridge + title + lede + CTA. The Thoughtform
  // gate is off-axis-right at world X=+1.1, so the copy mirrors it
  // off-axis-left at world X=-1.8 to read as a balanced two-column
  // composition (copy-left, compass-right) at parked rest. During
  // the Thoughtform centering pan [0.05, 0.18] the SAME lateral
  // offset is applied to the copy as to the compass + brandmark +
  // phase labels, so the entire composition slides as a single
  // camera-pan: the compass migrates to dead-centre while the copy
  // is carried off-screen left. After the pan completes the camera
  // dolly is released and the copy continues drifting via the
  // forward travel.
  {
    id: "thoughtform.leftCopy",
    // Desktop: the FULL copy block (bridge + title + lede + CTA),
    // off-axis-left at world X=-1.8 (two-column composition).
    // Mobile: the FULL copy block (bridge + title + body + chevron cue)
    // as ONE vertically-centred column over the gate centre. Copy and
    // the brandmark never share the frame (copy fades out in Moment 1
    // before the mark slides in for Moment 2), so the block is centred
    // (`data-anchor-origin="center"`, Y = 0) and reads as one cohesive
    // paragraph rather than split above/below the mark. (ADR-018 mobile
    // two-moment revision.)
    position: () => {
      const off = getSmoothedThoughtformOffsetX();
      if (isMobileComposition()) {
        return [STATION_THOUGHTFORM.position[0] + off, 0.0, STATION_THOUGHTFORM.position[2] + 0.1];
      }
      return [-1.8 + off, 0.0, STATION_THOUGHTFORM.position[2] + 0.1];
    },
    visibilityBeats: ["thoughtform", "pass-01a", "navigate", "pass-01b"],
    // No entry fade — copy reads at full strength the moment the
    // stage pins. Pre-arm projection writes the transform at parked
    // Thoughtform with opacity 0, so revealing it is a single flip
    // from invisible to full ("furnished room on arrival") rather
    // than a 40%-window crossfade as the user scrolls in.
    fadeFrac: 0,
    // Mobile: fade the copy block out as Moment 2 (the brandmark +
    // diagram reveal) begins. No-op on desktop.
    onPaint: gateThoughtformCopy,
  },
  // Three phase labels — NAVIGATE/ENCODE/BUILD — pinned to the v7
  // sigil compass-bearing positions (matching the production home
  // page sigil at landing-v7-motion.html lines 4357-4370). The DOM
  // label anchor sits at the TIP of the SVG connector line (where
  // the v7 `<text>` element's text-anchor point lives), so the
  // label reads at the same visual point in screen space as on the
  // production sigil.
  //
  // Source SVG coordinates (scaled 1/200 → world units, Y flipped):
  //   navigate label anchor: SVG (-100, -140) → world (-0.50, +0.70)
  //   encode   label anchor: SVG ( -65, +131) → world (-0.325, -0.655)
  //   build    label anchor: SVG (+118,  -27) → world (+0.59, +0.135)
  //
  // The per-frame X resolver folds in the centering pan offset so
  // the labels track the compass as it slides during the
  // Thoughtform pan. Visual origin is set per-element in
  // CopyAnchors.tsx via `data-anchor-origin` so each label's
  // appropriate corner (top-right for navigate/encode, top-left
  // for build) lands on the anchor point — mirroring v7's
  // `text-anchor="end"` / `"start"`.
  //
  // Phase labels now end with the Thoughtform composition instead of
  // lingering through pass-01a. That early pass is the pure corridor
  // flythrough; Navigate copy + gyro appear later at the parked station.
  {
    id: "thoughtform.phase.navigate",
    position: thoughtformPhasePosition(-0.5, 0.7),
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.12,
    onPaint: gateThoughtformDiagram,
  },
  {
    id: "thoughtform.phase.encode",
    position: thoughtformPhasePosition(-0.325, -0.655),
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.12,
    onPaint: gateThoughtformDiagram,
  },
  {
    id: "thoughtform.phase.build",
    position: thoughtformPhasePosition(0.59, 0.135),
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.12,
    onPaint: gateThoughtformDiagram,
  },

  // ── Navigate ────────────────────────────────────────────────────
  // Desktop: Linear-style two-column header — TITLE upper-LEFT of the
  // gate, SUPPORT upper-RIGHT, both anchored along the same upper Y
  // band so the gimbal sphere has the lower half of the frame.
  // Mobile: the legacy straddle is preserved by `stationHeaderPosition`.
  //
  // Reveal timing is synced to the substrate accretion window via
  // `gateNavigateReadout`. `pass-01a` is added back to the visibility
  // beats because the substrate.start (~0.345) sits in the tail of
  // pass-01a — without it the gate would clip opacity to 0 there.
  {
    id: "navigate.title",
    position: () => stationHeaderPosition(STATION_NAVIGATE, "title", 0.6),
    visibilityBeats: ["pass-01a", "navigate", "pass-01b"],
    fadeFrac: 0.28,
    // referenceDistance + depthFade tracks STATION_NAVIGATE.parkDistance
    // (6.2 after the 2026-06-05 lab-match revision; was 4.5) so the
    // title keeps its parked apparent size and doesn't clip when the
    // camera is pulled back for shell oversight.
    perspectiveScale: {
      referenceDistance: STATION_NAVIGATE.parkDistance,
      min: 0.2,
      max: 1.1,
    },
    // Near raised from 0.4 → 4.0 so the title fades out fully as the
    // camera closes the gap (depthMultiplier ≈ 0 at distance < 2.2).
    // With the off-axis desktop X offset (-2.0), the projection blows
    // up when the title is close to the camera; the depth fade guards that.
    depthFade: { near: 4.0, nearFade: 1.8, far: STATION_NAVIGATE.parkDistance + 2.0, farFade: 1.6 },
    onPaint: gateNavigateReadout,
  },
  {
    id: "navigate.support",
    position: () => stationHeaderPosition(STATION_NAVIGATE, "support", -0.65),
    visibilityBeats: ["pass-01a", "navigate", "pass-01b"],
    fadeFrac: 0.28,
    perspectiveScale: {
      referenceDistance: STATION_NAVIGATE.parkDistance,
      min: 0.2,
      max: 1.1,
    },
    depthFade: { near: 4.0, nearFade: 1.8, far: STATION_NAVIGATE.parkDistance + 2.0, farFade: 1.6 },
    onPaint: gateNavigateReadout,
  },

  // ── Diagnostic ──────────────────────────────────────────────────
  // Heading block above the orbital field — bridge + title.
  // Visibility extends back into `passthrough-01` so the title
  // can begin to register as a distant text-band as the camera
  // approaches the parked gate. Position uses
  // `diagnosticApproachDepthOffset` so the head copy sits ~6
  // world units BEHIND the parked Z during the start of the
  // approach and converges to the orbital plane by the
  // Diagnostic beat — combined with perspectiveScale (min 0.22)
  // this makes the title clearly read as "coming toward the
  // orbits" rather than already landed at the gate.
  // Straddle: TITLE above the orbital field's core, SUPPORT below it.
  // Both fold in `diagnosticApproachDepthOffset` so they read as flying
  // toward the orbits on approach. The oversized entry fade (1.4x) +
  // depthFade keep them hidden during the parked Thoughtform read and
  // resolve only as the Diagnostic gate begins.
  // Reveal timing is synced to the orbits accretion window via
  // `gateEncodeReadout` so the Encode header fades in WITH the
  // judgment orbits. Visibility now also covers `pass-01b` so the
  // orbits.start (~0.54) inside that leg isn't clipped to 0.
  {
    id: "diagnostic.title",
    position: (transform) =>
      stationHeaderPosition(
        STATION_DIAGNOSTIC,
        "title",
        0.78,
        diagnosticApproachDepthOffset(transform.paintProgress)
      ),
    visibilityBeats: ["pass-01b", "diagnostic"],
    // Tighter fade-out (was 1.4) so the title hides cleanly when the
    // camera dollies past the Encode park in passthrough-02. With the
    // off-axis desktop X offset (-2.0), points close to the camera
    // project to extreme NDC and would otherwise smear off-screen at
    // ~0.8 opacity before the legacy fade-out completes.
    fadeFrac: 0.4,
    // referenceDistance + depthFade tracks STATION_DIAGNOSTIC.parkDistance
    // (6.2 after the lab-match revision) so the title keeps its parked
    // apparent size and doesn't clip when the camera is pulled back.
    perspectiveScale: {
      referenceDistance: STATION_DIAGNOSTIC.parkDistance,
      min: 0.18,
      max: 1.15,
    },
    // Near raised from 0.9 → 4.5 so the title fades out fully as the
    // camera closes the gap (depthMultiplier ≈ 0 at distance < 2.1).
    // With the off-axis desktop X offset (-2.0), points close to the
    // camera project to extreme NDC; the depth fade ensures the title
    // is invisible before the off-screen smear happens.
    depthFade: {
      near: 4.5,
      nearFade: 2.4,
      far: STATION_DIAGNOSTIC.parkDistance + 2.3,
      farFade: 2.2,
    },
    onPaint: gateEncodeReadout,
  },
  {
    id: "diagnostic.support",
    position: (transform) =>
      stationHeaderPosition(
        STATION_DIAGNOSTIC,
        "support",
        -0.88,
        diagnosticApproachDepthOffset(transform.paintProgress)
      ),
    visibilityBeats: ["pass-01b", "diagnostic"],
    fadeFrac: 0.4,
    perspectiveScale: {
      referenceDistance: STATION_DIAGNOSTIC.parkDistance,
      min: 0.18,
      max: 1.15,
    },
    depthFade: {
      near: 4.5,
      nearFade: 2.4,
      far: STATION_DIAGNOSTIC.parkDistance + 2.3,
      farFade: 2.2,
    },
    onPaint: gateEncodeReadout,
  },
  // (Encode orbit labels removed — the Navigate/Encode/Build remap
  // drops the four "same pattern, four ways" pills; the orbital gate
  // geometry stays as Encode's gate visual.)

  // Encode primitive labels — framed tags on the four compass cardinals.
  ...ENCODE_PRIMITIVE_ANCHORS,

  // ── Intelligence ────────────────────────────────────────────────
  // Heading block above the substrate sphere. Mirrors the Diagnostic
  // approach pattern, and as of 2026-06-04 is tuned to match Encode's
  // ENTRY SIZE so the three flywheel titles read consistently: the
  // approach offset was softened (-6 → -1.5 in
  // `CORRIDOR_TIMELINE.intelligenceApproach`) and the depthFade `far`
  // tightened (11 → 6.8, farFade 4.5 → 2.2 to match
  // `diagnostic.*`). Together these stop the Build title appearing
  // while it is still far away and tiny — it now resolves at roughly
  // the same apparent size as Navigate / Encode (~0.66–0.7 scale) and
  // grows to parked size, instead of ballooning up from a distant
  // speck.
  // Straddle: TITLE above the substrate sphere's core, SUPPORT below.
  // Build is the highest overlap risk (the sphere is the centrepiece) —
  // bump title +0.8 / support −0.9 on preview if it crowds.
  {
    id: "intelligence.title",
    position: (transform) =>
      stationHeaderPosition(
        STATION_INTELLIGENCE,
        "title",
        0.74,
        intelligenceApproachDepthOffset(transform.paintProgress)
      ),
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.18,
    // referenceDistance + depthFade tracks STATION_INTELLIGENCE.parkDistance
    // (6.2 after the lab-match revision) so the Build title keeps its
    // parked apparent size and doesn't clip when the camera is pulled
    // back for shell oversight.
    perspectiveScale: {
      referenceDistance: STATION_INTELLIGENCE.parkDistance,
      min: 0.2,
      max: 1.15,
    },
    // Near raised from 0.9 → 4.5 so the title fades out if the camera
    // ever overshoots into close range. Mirrors the diagnostic +
    // navigate fade-on-approach guard for the off-axis (-2.0 X) layout.
    depthFade: {
      near: 4.5,
      nearFade: 2.4,
      far: STATION_INTELLIGENCE.parkDistance + 2.3,
      farFade: 2.2,
    },
  },
  {
    id: "intelligence.support",
    position: (transform) =>
      stationHeaderPosition(
        STATION_INTELLIGENCE,
        "support",
        -0.9,
        intelligenceApproachDepthOffset(transform.paintProgress)
      ),
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.18,
    perspectiveScale: {
      referenceDistance: STATION_INTELLIGENCE.parkDistance,
      min: 0.2,
      max: 1.15,
    },
    depthFade: {
      near: 4.5,
      nearFade: 2.4,
      far: STATION_INTELLIGENCE.parkDistance + 2.3,
      farFade: 2.2,
    },
  },
  // Stack v3 (2026-06-10 polish round 3) — Sources / Surfaces become
  // proper COLUMN HEADERS hanging above their respective columns, with
  // the column X computed live from the camera frustum so the layout
  // adapts to the viewport instead of cropping. Group labels share an
  // origin that grows their text INWARD toward the sphere; per-item
  // chips do the same — nothing in this layout can leave the frame
  // by construction.
  {
    id: "intelligence.sourcesLabel",
    position: (transform) => {
      const colX = getStackColumnLocalX(getLiveAspectForStack());
      // Polish round 4: header anchor pulled 1.45 -> 1.24 — the
      // previous height pushed the header block under the HUD top
      // bar ("falls out of the interface").
      return gyroAssemblyWorldPosition(transform, [-colX, 1.24, 0]);
    },
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.14,
    perspectiveScale: {
      referenceDistance: STATION_INTELLIGENCE.parkDistance,
      min: 0.25,
      max: 1.1,
    },
    onPaint: gateStackLabel,
  },
  {
    id: "intelligence.surfacesLabel",
    position: (transform) => {
      const colX = getStackColumnLocalX(getLiveAspectForStack());
      // Polish round 4: header anchor pulled 1.45 -> 1.24 (see
      // sourcesLabel note).
      return gyroAssemblyWorldPosition(transform, [colX, 1.24, 0]);
    },
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.14,
    perspectiveScale: {
      referenceDistance: STATION_INTELLIGENCE.parkDistance,
      min: 0.25,
      max: 1.1,
    },
    onPaint: gateStackLabel,
  },
  // Per-item stack labels — one DOM anchor per source pip / surface
  // tip. World position is the pip's column X. Flow pass
  // (2026-06-10): both sides anchor `left-center` and extend RIGHT,
  // following the pipeline's direction — source chips read inward
  // toward the sphere (inputs feeding in), surface chips extend
  // OUTWARD past their tips (destinations of the output lines).
  // Surface chips therefore extend beyond the column X; the
  // frustum-clamped column keeps ~10% viewport margin to the HUD
  // rail on supported desktop aspects (mobile hides the chips).
  ...STACK_SOURCE_ITEMS.map(({ id, y }) => ({
    id: `intelligence.source.${id}`,
    position: (transform: DepthGatewayTransform) => {
      const colX = getStackColumnLocalX(getLiveAspectForStack());
      return gyroAssemblyWorldPosition(transform, [-colX, y, 0]);
    },
    visibilityBeats: ["passthrough-02", "intelligence"] as Beat[],
    fadeFrac: 0.14,
    perspectiveScale: {
      referenceDistance: STATION_INTELLIGENCE.parkDistance,
      min: 0.3,
      max: 1.1,
    },
    onPaint: gateStackLabel,
  })),
  ...STACK_SURFACE_ITEMS.map(({ id, y }) => ({
    id: `intelligence.surface.${id}`,
    position: (transform: DepthGatewayTransform) => {
      const colX = getStackColumnLocalX(getLiveAspectForStack());
      return gyroAssemblyWorldPosition(transform, [colX, y, 0]);
    },
    visibilityBeats: ["passthrough-02", "intelligence"] as Beat[],
    fadeFrac: 0.14,
    perspectiveScale: {
      referenceDistance: STATION_INTELLIGENCE.parkDistance,
      min: 0.3,
      max: 1.1,
    },
    onPaint: gateStackLabel,
  })),
];

// ── Substrate-cut envelope (ADR-017, unchanged) ──────────────────

/** Substrate morph value (0 = brandmark shape, 1 = Fibonacci sphere).
 *  Symmetric trapezoid envelope across the intelligence beat so the
 *  cloud collapses back into the mark before the corridor ends. */
export function getSubstrateMorph(intelligenceGate: number): number {
  const FRAC = 0.3;
  if (intelligenceGate <= 0) return 0;
  if (intelligenceGate >= 1) return 0;
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

// ── Intelligence depth approach (mirrors Diagnostic / Interstitial) ──

/** Depth-focus window for the Intelligence substrate cloud's APPROACH
 *  envelope. Used to let the substrate cloud emerge gently from depth
 *  during late passthrough-02 in brandmark form, so the intelligence
 *  layer doesn't pop on the beat boundary at progress 0.72. */
export const INTELLIGENCE_APPROACH_DEPTH_WINDOW: DepthFocusWindow = {
  near: 0.6,
  nearFade: 1.8,
  far: 6.2,
  farFade: 3.4,
};

/** Depth-focus window for the Intelligence side bodies (Trusted Sources
 *  / Headless Surfaces). Slightly tighter than the substrate window so
 *  the bodies settle in after the substrate has begun to register —
 *  read order stays: substrate centre → constellation flanks. */
export const INTELLIGENCE_SIDEBODY_DEPTH_WINDOW: DepthFocusWindow = {
  near: 0.7,
  nearFade: 1.8,
  far: 5.2,
  farFade: 2.6,
};

/** Substrate cross-fade window: morph value at which the DOM
 *  brandmark is fully faded out and the in-canvas substrate cloud
 *  fully owns the silhouette. Shared between
 *  `getIntelligenceSubstratePresence` (cloud fade-in) and
 *  `ProjectedBrandmarkActor` (DOM fade-out) so the hand-off is
 *  C0-continuous in both directions. */
export const SUBSTRATE_CROSSFADE_END = 0.2;

/** Combined substrate-cloud presence + morph for the intelligence gate.
 *
 *  During late `passthrough-02` the cloud emerges as a faint, brandmark-
 *  shaped particle bloom in the distance behind the DOM lead brandmark
 *  (presence ramps up from camera-space depth; morph stays at 0). When
 *  the intelligence beat begins the morph envelope takes over and the
 *  cloud blooms into the Fibonacci sphere, then collapses back into the
 *  brandmark before the corridor exit. Presence is capped during the
 *  depth-only approach so the cloud reads as a distant readout, not a
 *  second resolved object competing with the DOM brandmark. */
export function getIntelligenceSubstratePresence(transform: DepthGatewayTransform): {
  presence: number;
  morph: number;
} {
  const { paintProgress, beat, gateProgress } = transform;

  if (beat === "intelligence") {
    const morph = getSubstrateMorph(gateProgress);
    // Cross-fade in across the early-morph window so the cloud meets
    // the DOM brandmark fading out (see ProjectedBrandmarkActor).
    const fadeIn = Math.min(1, morph / SUBSTRATE_CROSSFADE_END);
    // Hand off smoothly from the passthrough-02 approach cap so there is
    // no presence dip at the beat boundary — at gateProgress 0 morph is
    // 0, fadeIn is 0, but the depth-based approach is at its peak.
    const depth = cameraSpaceDepth(paintProgress, STATION_INTELLIGENCE.position);
    const approach = depthFocusOpacity(depth, INTELLIGENCE_APPROACH_DEPTH_WINDOW) * 0.55;
    return { presence: Math.max(approach, fadeIn), morph };
  }

  if (beat === "passthrough-02") {
    const depth = cameraSpaceDepth(paintProgress, STATION_INTELLIGENCE.position);
    const approach = depthFocusOpacity(depth, INTELLIGENCE_APPROACH_DEPTH_WINDOW);
    return { presence: approach * 0.55, morph: 0 };
  }

  return { presence: 0, morph: 0 };
}

// NOTE: a 2026-06-06 experiment (Phase 4 of the wrap-around revision)
// added `getBrandmarkParticlePresence` + `BRANDMARK_PARTICLE_CUT_*`
// constants to drive a TRAVELING brandmark cloud mounted at scene
// root. That experiment was reverted on user feedback — the
// brandmark belongs on the DOM layer across travel and only hands
// off to particles at the Build substrate morph. The cloud is back
// inside `IntelligenceGate` and consumes `getIntelligenceSubstratePresence`
// above unchanged.

// ── Intelligence side bodies ─────────────────────────────────────

export const SIDE_BODY_SCALE = 1.1;

/** Depth-driven side-body presence (0..1) for the intelligence flanks.
 *  Reads camera-space depth on the Intelligence station so the bodies
 *  begin to register during late passthrough-02 (faint, distant) and
 *  intensify through the intelligence beat. Mirrors the Star Atlas
 *  "objects emerge from distance" contract that already governs
 *  Diagnostic and Interstitial geometry on this route. */
export function getIntelligenceSideBodyPresence(transform: DepthGatewayTransform): number {
  const { paintProgress, active } = transform;
  if (!active) return 0;
  const depth = cameraSpaceDepth(paintProgress, STATION_INTELLIGENCE.position);
  return depthFocusOpacity(depth, INTELLIGENCE_SIDEBODY_DEPTH_WINDOW);
}
