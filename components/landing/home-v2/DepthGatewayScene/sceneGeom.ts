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
  GATE_PARK_DISTANCE,
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
   *  flythrough release the moment the pan completes. */
  thoughtformPan: { start: 0.09, end: 0.14 },

  /** Gateway "boot-up" envelope phases. Ramp runs alongside the
   *  Thoughtform pan; hold spans the early ring flythrough; relax
   *  fades through the start of passthrough-01. Shared by
   *  `StaticStarfield`, `ThoughtformAtmosphere`, `CelestialMotes`,
   *  and `ThoughtformCompassGate`. */
  thoughtformBoot: { preBoot: 0.03, rampEnd: 0.14, holdEnd: 0.22, relaxEnd: 0.42 },

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
    { start: 0.2, end: 0.46 }, // ring 0 (outer) — flies LAST
    { start: 0.18, end: 0.44 }, // ring 1
    { start: 0.16, end: 0.42 }, // ring 2
    { start: 0.14, end: 0.4 }, // ring 3 (inner) — flies FIRST
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
    thoughtformHold: 0.16,
    diagnosticArrival: 0.5,
    diagnosticHold: 0.58,
    intelligenceArrival: 0.78,
    intelligenceLanding: 0.88,
  },

  /** Brandmark lead-distance transit pull. Starts just after the
   *  Diagnostic park, reaches FULL_LEAD by the end of passthrough-02
   *  + a touch into intelligence (0.80). */
  brandmarkLeadPull: { start: 0.58, end: 0.8 },

  /** Diagnostic head-copy + label depth-approach offset. The labels
   *  start `offset` world units behind their parked Z at `start` and
   *  converge to the parked plane by `end`. */
  diagnosticApproach: { offset: -9, start: 0.16, end: 0.56 },

  /** Intelligence head-copy + side-body label depth-approach offset.
   *  Mirrors the Diagnostic pattern around the passthrough-02 →
   *  intelligence handoff. */
  intelligenceApproach: { offset: -6, start: 0.6, end: 0.85 },

  /** Camera chase toward the brandmark lead — peaks across the
   *  passthrough-02 → intelligence transit, then releases as the
   *  brandmark lands at the intelligence anchor. Bell envelope:
   *  `start → start + fadeIn` ramps in; `peakAt → peakAt + fadeOut`
   *  ramps out; peak strength is `peak`. */
  cameraChase: {
    start: 0.6,
    end: 0.88,
    fadeIn: 0.11,
    peakAt: 0.8,
    fadeOut: 0.08,
    peak: 0.38,
  },
} as const;

/** Camera position at the given GLOBAL progress. Pure Z dolly: the
 *  camera holds at `CAMERA_START.z` across the Thoughtform pan
 *  window, then smoothsteps to `CAMERA_END.z` across the rest of
 *  the corridor. */
export function getCameraPosition(progress: number): [number, number, number] {
  return [0, 0, lerp(CAMERA_START[2], CAMERA_END[2], cameraZDollyT(progress))];
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
  const t = smoothstep(start, end, progress);
  return -STATION_THOUGHTFORM.position[0] * t;
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
   *  camera-to-Diagnostic-anchor distance at the park CENTRE
   *  (p ≈ 0.53 after the latent depth spacing pass), where
   *  camera-to-gate = `GATE_PARK_DISTANCE` (4.5) and the anchor
   *  sits +0.1 in front of the gate plane. Holding the lead at
   *  this value through the entire park keeps the brandmark's
   *  APPARENT SIZE stable as the camera dollies through — and
   *  makes the brandmark coincide with the orbital field plane
   *  exactly at the park centre, so the parked composition still
   *  reads as "brandmark at the centre of the Diagnostic gate". */
  const PARK_LEAD = GATE_PARK_DISTANCE - 0.1;
  const FULL_LEAD = 7.2;
  // Transit pull from `CORRIDOR_TIMELINE.brandmarkLeadPull` — held
  // through the Diagnostic park, then grows to FULL_LEAD by the
  // end of passthrough-02. Drifted slightly past the
  // passthrough-02 boundary so the brandmark holds its parked
  // apparent size through the entire widened Diagnostic beat.
  const { start: pullStart, end: pullEnd } = CORRIDOR_TIMELINE.brandmarkLeadPull;
  const pullT = smoothstep(pullStart, pullEnd, progress);
  const leadDistance = lerp(PARK_LEAD, FULL_LEAD, pullT);

  const rawLead: [number, number, number] = [
    cam[0] + forward[0] * leadDistance,
    cam[1] + forward[1] * leadDistance,
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
 *  `getBrandmarkLeadWorldPosition` for the two-phase envelope. */
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
  const tfOffsetX = getThoughtformCenterOffsetX(progress);
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
  thoughtform: 0.32,
  // Diagnostic parked size raised from 0.18 to 0.28 (~56% larger
  // physical object in world space) so the brandmark has real
  // optical presence at the centre of the orbital field instead
  // of reading as a small reference dot. Because ProjectedBrand-
  // markActor projects a world edge through the camera each
  // frame, perspective handles the size naturally as the camera
  // approaches, parks, and pulls away — no scroll momentum
  // break, no parallax mismatch with the orbits.
  diagnostic: 0.28,
  transitLead: 0.2,
  intelligence: 0.22,
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

import type { Beat, DepthGatewayTransform } from "@/lib/stores/depthGatewayStore";
import type { WorldAnchor, WorldAnchorPosition } from "../hooks/useWorldDomTracker";

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
      STATION_THOUGHTFORM.position[0] +
        offsetX * s +
        getThoughtformCenterOffsetX(transform.paintProgress),
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
    position: (transform) => {
      const off = getThoughtformCenterOffsetX(transform.paintProgress);
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
  // Visibility stays on `thoughtform` but uses an aggressive
  // exit fade so the DOM labels survive across the start of
  // passthrough-01, tracking the R3F supportingRef's forward
  // sweep (which carries the gate's phase dots toward the
  // camera). The behind-camera cull in `useWorldDomTracker`
  // takes over once the camera passes the gate's world Z.
  // Phase labels survive across the entire ring sweep so they
  // travel with the supporting linework (which rides ring 0's
  // 0.20→0.46 flythrough). `fadeFrac: 2.0` against the trimmed
  // thoughtform beat [0.0, 0.14] gives a 0.28-wide fade window
  // (visible at full through 0.14, ramping to 0 by 0.42 — just
  // before `useWorldDomTracker` would cull them as behind-camera
  // around 0.41). The labels read as travelling forward with the
  // compass through the camera, not as snapping out at the beat
  // boundary.
  {
    id: "thoughtform.phase.navigate",
    position: thoughtformPhasePosition(-0.5, 0.7),
    visibilityBeats: ["thoughtform"],
    fadeFrac: 2.0,
    onPaint: gateThoughtformDiagram,
  },
  {
    id: "thoughtform.phase.encode",
    position: thoughtformPhasePosition(-0.325, -0.655),
    visibilityBeats: ["thoughtform"],
    fadeFrac: 2.0,
    onPaint: gateThoughtformDiagram,
  },
  {
    id: "thoughtform.phase.build",
    position: thoughtformPhasePosition(0.59, 0.135),
    visibilityBeats: ["thoughtform"],
    fadeFrac: 2.0,
    onPaint: gateThoughtformDiagram,
  },

  // ── Navigate ────────────────────────────────────────────────────
  // Straddle composition: a frameless TITLE just ABOVE the central
  // reticle/brandmark (near screen-centre) and the SUPPORT line just
  // BELOW it, so the title reads as the gate's annotation without a
  // boxed card. Navigate is now a parked station, so the camera holds
  // these steady for a beat. Camera-depth driven (full opacity at the
  // ~4.5 park distance, just inside `far` 4.8) so they fade in on the
  // approach and out as the camera passes — dark at the parked setup
  // beat where the camera is ~6.8 units back. The +Y / −Y offsets are
  // the primary straddle knobs.
  {
    id: "navigate.title",
    position: [
      STATION_NAVIGATE.position[0],
      STATION_NAVIGATE.position[1] + 0.55,
      STATION_NAVIGATE.position[2] + 0.1,
    ],
    visibilityBeats: ["pass-01a", "navigate", "pass-01b"],
    fadeFrac: 0.28,
    perspectiveScale: { referenceDistance: 4.5, min: 0.2, max: 1.1 },
    depthFade: { near: 0.4, nearFade: 1.8, far: 4.8, farFade: 1.6 },
  },
  {
    id: "navigate.support",
    position: [
      STATION_NAVIGATE.position[0],
      STATION_NAVIGATE.position[1] - 0.6,
      STATION_NAVIGATE.position[2] + 0.1,
    ],
    visibilityBeats: ["pass-01a", "navigate", "pass-01b"],
    fadeFrac: 0.28,
    perspectiveScale: { referenceDistance: 4.5, min: 0.2, max: 1.1 },
    depthFade: { near: 0.4, nearFade: 1.8, far: 4.8, farFade: 1.6 },
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
  {
    id: "diagnostic.title",
    position: (transform) => [
      STATION_DIAGNOSTIC.position[0],
      STATION_DIAGNOSTIC.position[1] + 0.7,
      STATION_DIAGNOSTIC.position[2] + 0.1 + diagnosticApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["diagnostic"],
    fadeFrac: 1.4,
    perspectiveScale: { referenceDistance: 4.5, min: 0.18, max: 1.15 },
    depthFade: { near: 0.9, nearFade: 2.4, far: 6.8, farFade: 2.2 },
  },
  {
    id: "diagnostic.support",
    position: (transform) => [
      STATION_DIAGNOSTIC.position[0],
      STATION_DIAGNOSTIC.position[1] - 0.8,
      STATION_DIAGNOSTIC.position[2] + 0.1 + diagnosticApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["diagnostic"],
    fadeFrac: 1.4,
    perspectiveScale: { referenceDistance: 4.5, min: 0.18, max: 1.15 },
    depthFade: { near: 0.9, nearFade: 2.4, far: 6.8, farFade: 2.2 },
  },
  // (Encode orbit labels removed — the Navigate/Encode/Build remap
  // drops the four "same pattern, four ways" pills; the orbital gate
  // geometry stays as Encode's gate visual.)

  // ── Intelligence ────────────────────────────────────────────────
  // Heading block above the substrate sphere. Mirrors the Diagnostic
  // approach pattern: an extra Z offset
  // (`intelligenceApproachDepthOffset`) parks the headline ~5.5 world
  // units BEHIND the substrate during late passthrough-02, then
  // converges to the parked plane by mid-intelligence. Combined with
  // `perspectiveScale` (min 0.22), the headline reads as a distant
  // readout flying toward the substrate, not a panel that pops to
  // full size on the beat boundary. The fade window is widened
  // (0.18) so the opacity ramp itself is gentler — visible from
  // early passthrough-02, full by parked Intelligence.
  // Straddle: TITLE above the substrate sphere's core, SUPPORT below.
  // Both fold in `intelligenceApproachDepthOffset` so the readout flies
  // toward the substrate rather than popping in at the beat boundary.
  // Build is the highest overlap risk (the sphere is the centrepiece) —
  // bump title +0.8 / support −0.9 on preview if it crowds.
  {
    id: "intelligence.title",
    position: (transform) => [
      STATION_INTELLIGENCE.position[0],
      STATION_INTELLIGENCE.position[1] + 0.7,
      STATION_INTELLIGENCE.position[2] +
        0.1 +
        intelligenceApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.18,
    perspectiveScale: { referenceDistance: 4.5, min: 0.2, max: 1.15 },
    depthFade: { near: 0.9, nearFade: 2.4, far: 11, farFade: 4.5 },
  },
  {
    id: "intelligence.support",
    position: (transform) => [
      STATION_INTELLIGENCE.position[0],
      STATION_INTELLIGENCE.position[1] - 0.85,
      STATION_INTELLIGENCE.position[2] +
        0.1 +
        intelligenceApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.18,
    perspectiveScale: { referenceDistance: 4.5, min: 0.2, max: 1.15 },
    depthFade: { near: 0.9, nearFade: 2.4, far: 11, farFade: 4.5 },
  },
  // (Build chamber labels removed — the Navigate/Encode/Build remap
  // drops the "Trusted sources / Headless surfaces" side labels; the
  // substrate sphere + side bodies stay as Build's gate visual.)
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
