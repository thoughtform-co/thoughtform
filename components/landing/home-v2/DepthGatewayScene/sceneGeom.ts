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
 *   - The camera path (position, lookAt, roll, FOV).
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
 * The X-reframe (off-axis-right -> centred) is concentrated inside
 * the passthrough-01 window [0.18, 0.32] so by the time the user
 * reaches the parked Diagnostic beat, the camera + lookAt are both
 * centred and world-origin objects project dead-centre.
 */

import { lerp, smoothstep } from "@/lib/stores/depthGatewayStore";
import { MISS_LABELS, MISS_ORBITS, MISS_VIEWBOX, pointOnEllipse } from "@/lib/celestial/orbits";

export type Vec3 = readonly [number, number, number];

// ── Camera FOV + path constants ──────────────────────────────────

/** Vertical FOV. ~38° gives the focal-compressed "looking into a
 *  corridor" feel without going full fish-eye. */
export const CAMERA_FOV = 38;

/** Camera position at progress = 0 (start of corridor).
 *
 *  Dead-centred on the optical axis — the Thoughtform composition is
 *  axial (compass dead-centre / copy on the left), so the camera
 *  never needs to off-axis-frame. The previous off-axis-right start
 *  + passthrough-01 X-reframe was retired when STATION_THOUGHTFORM
 *  moved to world X=0. */
export const CAMERA_START: [number, number, number] = [0, 0, 10];

/** Camera position at progress = 1 (end of corridor). On-axis. */
export const CAMERA_END: [number, number, number] = [0, 0, -8];

/** How far ahead of the camera the lookAt point sits. The lookAt
 *  travels with the camera so each frame the gaze is into the next
 *  gate (perspective signal: we are FLYING forward). */
const LOOK_AHEAD = 6;

/** Look-at X at the start of the corridor. Centred, matching the
 *  axial Thoughtform composition. */
const LOOK_AT_X_START = 0;

/** Look-at X at the end of the corridor (centred). */
const LOOK_AT_X_END = 0;

/** Subtle vertical bob on the lookAt point — hand-flown camera
 *  signal, very low amplitude so it doesn't read as wobble. */
const LOOK_BOB_AMPLITUDE = 0.08;

/** Maximum camera roll (radians) during the X-reframe. Zero now
 *  that the corridor is axial end-to-end — there's no X-pan to
 *  bank into. The constant + envelope stay defined so future
 *  off-axis beats can re-enable banking without a refactor. */
const ROLL_MAX = 0;

// ── Beat-window references ───────────────────────────────────────
// These mirror the BEAT_WINDOWS table in depthGatewayStore so the
// reframe envelope stays in lock-step with the camera path. After
// the Thoughtform -> Diagnostics immersion pass, passthrough-01
// runs from 0.16 to 0.40 (was 0.18 to 0.32).

/** Reframe window: progress range over which the camera + lookAt
 *  X-pan from off-axis-right to centred. Matches passthrough-01. */
const REFRAME_START = 0.16;
const REFRAME_END = 0.4;

/** Scroll progress at which the camera Z dolly is RELEASED. The
 *  dolly holds at 0 (camera stationary at `CAMERA_START.z`) across
 *  [0, Z_DOLLY_HOLD_END] so the Thoughtform lateral pan
 *  (compass + brandmark + copy sliding to dead-centre, see
 *  `getThoughtformCenterOffsetX`) reads as a pure camera-pan with
 *  no forward drift. After this boundary the dolly smoothsteps to 1
 *  across the remaining scroll, carrying the camera into and through
 *  the corridor. Must stay aligned with `THOUGHTFORM_PAN_END` and
 *  the end of the `thoughtform` beat in `BEAT_WINDOWS`. */
const Z_DOLLY_HOLD_END = 0.16;

/** Camera Z dolly easing — held at 0 across the Thoughtform pan
 *  window, then smoothstep'd from 0 -> 1 across the remaining
 *  scroll. Shared by the runtime camera-position function and
 *  `gateZAtParkProgress` so gate stations stay consistent with
 *  the live camera at every parked beat. */
function cameraZDollyT(progress: number): number {
  const p = clamp01(progress);
  if (p <= Z_DOLLY_HOLD_END) return 0;
  return smoothstep(0, 1, (p - Z_DOLLY_HOLD_END) / (1 - Z_DOLLY_HOLD_END));
}

/** Camera position at the given GLOBAL progress.
 *
 *  Two motions superimposed:
 *    - Z dolly: smoothstep'd over [0, 1].
 *    - X reframe: held to passthrough-01 only [0.18, 0.32].
 *
 *  Result: at parked Thoughtform (progress ~0.09) the camera is
 *  off-axis right, framing the right-column composition. By parked
 *  Diagnostic (progress ~0.41) the X-reframe has fully resolved and
 *  the camera is centred on the world axis, so the centred
 *  Diagnostic gate projects dead-centre. */
export function getCameraPosition(progress: number): [number, number, number] {
  const dollyT = cameraZDollyT(progress);
  const reframeT = smoothstep(REFRAME_START, REFRAME_END, progress);
  return [lerp(CAMERA_START[0], 0, reframeT), 0, lerp(CAMERA_START[2], CAMERA_END[2], dollyT)];
}

/** Base look-at point. Travels with the camera (LOOK_AHEAD units
 *  further down the corridor) and pans X 0.95 -> 0 across
 *  passthrough-01. Kept separate from `getCameraLookAt` so the
 *  brandmark chase math can use a stable forward vector without
 *  recursively depending on the public lookAt's subtle target blend. */
function getBaseCameraLookAt(progress: number): [number, number, number] {
  const [, , camZ] = getCameraPosition(progress);
  const reframeT = smoothstep(REFRAME_START, REFRAME_END, progress);
  const lookX = lerp(LOOK_AT_X_START, LOOK_AT_X_END, reframeT);
  // Bob phased to corridor progress — one and a half cycles across
  // the full stage, very low amplitude.
  const bobY = Math.sin(progress * Math.PI * 3) * LOOK_BOB_AMPLITUDE;
  return [lookX, bobY, camZ - LOOK_AHEAD];
}

/** Look-at point used by the live camera. During the Diagnostic ->
 *  Intelligence transit it subtly biases toward the brandmark lead
 *  position so the camera feels like it is following the artifact
 *  down the corridor, while the base look-ahead still preserves the
 *  axial "flying forward" read. */
export function getCameraLookAt(progress: number): [number, number, number] {
  const base = getBaseCameraLookAt(progress);
  if (progress < 0.55 || progress > 0.84) return base;

  const chaseIn = smoothstep(0, 1, (progress - 0.55) / 0.11);
  const chaseOut = 1 - smoothstep(0, 1, (progress - 0.76) / 0.08);
  const chaseT = Math.min(chaseIn, chaseOut) * 0.38;
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

/** Camera roll (radians) — peaks in the middle of passthrough-01
 *  so the user feels the camera "bank into" the reframe, then
 *  level out by the parked Diagnostic beat. Roll is RIGHT-side-up
 *  (negative Z roll) so the right side of the frame dips during
 *  the reframe — that's the natural direction of a bank turn from
 *  off-axis-right to centred. */
export function getCameraRoll(progress: number): number {
  // Bell curve over passthrough-01: 0 -> 1 -> 0 across [0.18, 0.32].
  if (progress <= REFRAME_START || progress >= REFRAME_END) return 0;
  const t = (progress - REFRAME_START) / (REFRAME_END - REFRAME_START);
  const bell = Math.sin(t * Math.PI); // 0..1..0
  return -bell * ROLL_MAX;
}

// ── Gate stations ────────────────────────────────────────────────

/** Distance the camera sits in front of a gate when the user is
 *  parked at that gate's beat. Picked so the gate's halfExtent
 *  comfortably fills the viewport at FOV ~38°. */
const GATE_PARK_DISTANCE = 4.5;

export interface GateStation {
  id: "thoughtform" | "diagnostic" | "interstitial" | "intelligence";
  /** World position of the gate's centre. */
  position: [number, number, number];
  /** Approximate world half-extent (XY) — used by painters to size
   *  geometry against this gate's allocated frame. */
  halfExtent: number;
  /** Camera progress at which the gate is "parked" (i.e. centred in
   *  the viewport; camera is GATE_PARK_DISTANCE units in front). */
  parkProgress: number;
}

/** Solve a gate's world Z so that at `parkProgress` the camera sits
 *  GATE_PARK_DISTANCE units in front of the gate. Uses the same
 *  `cameraZDollyT` curve as the runtime camera-position function so
 *  the parked-beat invariant (camera-to-gate = GATE_PARK_DISTANCE)
 *  holds even with the dolly's pan-window hold. */
function gateZAtParkProgress(parkProgress: number): number {
  const dollyT = cameraZDollyT(parkProgress);
  const camZ = lerp(CAMERA_START[2], CAMERA_END[2], dollyT);
  return camZ - GATE_PARK_DISTANCE;
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
export const STATION_THOUGHTFORM: GateStation = {
  id: "thoughtform",
  position: [1.1, 0.0, gateZAtParkProgress(0.08)],
  halfExtent: 1.6,
  parkProgress: 0.08,
};

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
export const STATION_DIAGNOSTIC: GateStation = {
  id: "diagnostic",
  position: [0, 0, gateZAtParkProgress(0.47)],
  halfExtent: 2.2,
  parkProgress: 0.47,
};

/** Interstitial waypoint — sits in the middle of passthrough-02 so
 *  the camera passes through it on the way to Intelligence. */
export const STATION_INTERSTITIAL: GateStation = {
  id: "interstitial",
  position: [0, 0, gateZAtParkProgress(0.63)],
  halfExtent: 1.8,
  parkProgress: 0.63,
};

/** Intelligence sphere station — centre of the substrate-cut beat.
 *  The substrate sphere + L/R side bodies all live in this group. */
export const STATION_INTELLIGENCE: GateStation = {
  id: "intelligence",
  position: [0, 0, gateZAtParkProgress(0.86)],
  halfExtent: 2.0,
  parkProgress: 0.86,
};

export const STATIONS: readonly GateStation[] = [
  STATION_THOUGHTFORM,
  STATION_DIAGNOSTIC,
  STATION_INTERSTITIAL,
  STATION_INTELLIGENCE,
];

// ── Thoughtform centering pan ────────────────────────────────────

/** Scroll range over which the Thoughtform composition (compass +
 *  brandmark + phase labels + left copy) pans laterally from its
 *  parked off-axis-right rest to dead-centre. Held flat outside
 *  this range so the user gets a real beat to read the parked
 *  frame before the pan begins, and the centre position is locked
 *  in before the camera Z dolly is released (see `Z_DOLLY_HOLD_END`).
 *
 *  PAN_START is pushed well past 0 so the parked two-column
 *  composition holds across the first ~10% of stage scroll — fast
 *  scrollers get a stationary beat to take in the copy +
 *  brandmark composition before any motion begins. PAN_END stays
 *  locked to `Z_DOLLY_HOLD_END` so the camera dolly + ring
 *  flythrough release the moment the pan completes; downstream
 *  timing stays in sync.
 *
 *  The pan applies the SAME `dx` to every Thoughtform-anchored
 *  element each frame, so the world reads as a single camera-pan
 *  rather than independent object motions. */
const THOUGHTFORM_PAN_START = 0.1;
const THOUGHTFORM_PAN_END = 0.16;

/** Lateral X offset (world units) for the Thoughtform composition
 *  at the current global progress. Smoothsteps from 0 (parked off-
 *  axis-right) to `-STATION_THOUGHTFORM.position[0]` (composition
 *  dead-centred) across the pan window. */
export function getThoughtformCenterOffsetX(progress: number): number {
  if (progress <= THOUGHTFORM_PAN_START) return 0;
  if (progress >= THOUGHTFORM_PAN_END) return -STATION_THOUGHTFORM.position[0];
  const t = smoothstep(THOUGHTFORM_PAN_START, THOUGHTFORM_PAN_END, progress);
  return -STATION_THOUGHTFORM.position[0] * t;
}

/** "Gateway boot-up" envelope (0..1) used by painters that want to
 *  intensify subtly the moment the Thoughtform composition centres.
 *  Read as: the gateway is powering on as the brandmark + diagrams
 *  slide into the optical axis, briefly holds at full as the parked
 *  composition reads, then gently relaxes as the camera starts to
 *  push down the corridor.
 *
 *  Phases (mirrored to the Thoughtform pan window + ring flythrough
 *  windows already in this file):
 *
 *  - Pre-boot (progress ≤ 0.04): 0 — the visitor hasn't reached the
 *    section yet.
 *  - Ramp-up (0.04 → 0.16): 0 → 1 — runs alongside the centering pan
 *    (`THOUGHTFORM_PAN_START` ≈ 0.10, `THOUGHTFORM_PAN_END` = 0.16)
 *    so the lighting visibly powers on as the composition centres.
 *  - Hold (0.16 → 0.24): 1 — the gateway sits fully lit just after
 *    the pan completes, before the camera Z dolly is well underway.
 *  - Relax (0.24 → 0.42): 1 → 0 — fades as the ring flythrough
 *    starts and the camera moves into passthrough-01.
 *
 *  Used by `StaticStarfield`, `ThoughtformAtmosphere` (boot-glow
 *  disk + atmosphere), and `ThoughtformCompassGate` (small alpha
 *  boost on the linework) — kept as ONE function so the lighting
 *  beat is unified across painters. */
export function getThoughtformBootEnvelope(progress: number): number {
  if (progress <= 0.04) return 0;
  if (progress <= 0.16) return smoothstep(0.04, 0.16, progress);
  if (progress <= 0.24) return 1;
  if (progress <= 0.42) return 1 - smoothstep(0.24, 0.42, progress);
  return 0;
}

// ── Thoughtform compass flythrough ───────────────────────────────

/** Staggered flythrough windows per compass ring — **inner-first
 *  order**. The innermost ring (index 3, smallest radius) opens
 *  its window the instant the camera dolly is released; each
 *  larger ring follows ~0.02 of scroll later. The previous
 *  outer-first order forced ring 3 to start at progress 0.25, by
 *  which time the camera had already advanced significantly toward
 *  the gate. Ring 3 had almost no Z headroom before being behind
 *  the camera, so the small dotted circle around the brandmark
 *  seemed to vanish in place instead of flying past. With
 *  inner-first the smallest ring has its full Z run to sweep
 *  through the camera while the camera is still distant, and the
 *  larger outer rings follow as a trailing wave. */
const FLYTHROUGH_WINDOWS: readonly { start: number; end: number }[] = [
  { start: 0.22, end: 0.4 }, // ring 0 (outer) — flies LAST
  { start: 0.2, end: 0.38 }, // ring 1
  { start: 0.18, end: 0.36 }, // ring 2
  { start: 0.16, end: 0.34 }, // ring 3 (inner) — flies FIRST
];

/** Forward translation (positive world Z) added to each ring at the
 *  end of its flythrough window. Parked compass sits at world Z=5.5;
 *  +7 brings the ring to Z=12.5, past the camera across the longer
 *  [0.16, 0.40] passthrough window. Opacity is now depth-driven, so
 *  this value controls physical sweep speed rather than fade timing. */
const FLYTHROUGH_Z_DISTANCE = 7;

/** Per-ring flythrough state for the Thoughtform compass.
 *
 *  - `dz` is the Z translation to add to the ring's gate-relative
 *    origin each frame (gate is at world Z=5.5, ring's local Z is 0,
 *    so the ring's world Z = 5.5 + dz).
 *  - `travelT` is the local 0..1 travel factor. Opacity is NOT
 *    returned here anymore; painters derive that from camera-space
 *    depth so the rings fade because they cross the camera/focus
 *    plane, not because a progress window ended. */
export function getThoughtformRingFlythrough(
  progress: number,
  ringIndex: number
): { dz: number; travelT: number } {
  const w = FLYTHROUGH_WINDOWS[ringIndex] ?? FLYTHROUGH_WINDOWS[0];
  if (progress <= w.start) return { dz: 0, travelT: 0 };
  if (progress >= w.end) return { dz: FLYTHROUGH_Z_DISTANCE, travelT: 1 };
  const t = smoothstep(w.start, w.end, progress);
  return { dz: t * FLYTHROUGH_Z_DISTANCE, travelT: t };
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

/** Brandmark anchor at the parked Diagnostic beat — centre of the
 *  orbital field. */
export const BRANDMARK_ANCHOR_DIAGNOSTIC: [number, number, number] = [
  STATION_DIAGNOSTIC.position[0],
  STATION_DIAGNOSTIC.position[1],
  STATION_DIAGNOSTIC.position[2] + 0.1,
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
   *  (p ≈ 0.47), where camera-to-gate = `GATE_PARK_DISTANCE` (4.5)
   *  and the anchor sits +0.1 in front of the gate plane. Holding
   *  the lead at this value through the entire park keeps the
   *  brandmark's APPARENT SIZE stable as the camera dollies
   *  through — and makes the brandmark coincide with the orbital
   *  field plane exactly at the park centre, so the parked
   *  composition still reads as "brandmark at the centre of the
   *  Diagnostic gate". */
  const PARK_LEAD = GATE_PARK_DISTANCE - 0.1;
  const FULL_LEAD = 7.2;
  const pullT = smoothstep(0.52, 0.76, progress);
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
export function getBrandmarkWorldPosition(progress: number): [number, number, number] {
  // Beat windows (mirror BEAT_WINDOWS):
  //   thoughtform     : [0.00, 0.16]
  //   passthrough-01  : [0.16, 0.40]
  //   diagnostic      : [0.40, 0.55]
  //   passthrough-02  : [0.55, 0.72]
  //   intelligence    : [0.72, 1.00]

  // Apply the Thoughtform centering pan to the THOUGHTFORM-side
  // anchor X each frame so the brandmark slides laterally with the
  // compass + copy during the pan window. By the time the travel
  // envelope below kicks in (>= 0.20) the offset has fully
  // resolved to -STATION_THOUGHTFORM.position[0], which puts the
  // Thoughtform anchor on the world axis — matching the Diagnostic
  // lead position's X — so the X-lerp is effectively a no-op and
  // Y/Z do all the travel work, as designed.
  const tfOffsetX = getThoughtformCenterOffsetX(progress);
  const tfX = BRANDMARK_ANCHOR_THOUGHTFORM[0] + tfOffsetX;

  if (progress <= 0.2) {
    return [tfX, BRANDMARK_ANCHOR_THOUGHTFORM[1], BRANDMARK_ANCHOR_THOUGHTFORM[2]];
  }
  if (progress <= 0.44) {
    // Arrival lerp lands at the LEAD position at p=0.44, not the
    // static Diagnostic anchor, so the lerp → lead handoff is
    // C0-continuous and the brandmark transitions seamlessly into
    // the held-lead park. The lead-at-0.44 position sits slightly
    // in front of the Diagnostic gate plane; by the park centre
    // (p ≈ 0.47) the held lead crosses the gate plane and the
    // brandmark coincides exactly with the orbital field centre.
    const t = smoothstep(0.2, 0.44, progress);
    const diagLeadStart = getBrandmarkLeadWorldPosition(0.44);
    return [
      lerp(tfX, diagLeadStart[0], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[1], diagLeadStart[1], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[2], diagLeadStart[2], t),
    ];
  }
  // Lead mode owns p=0.44 through p=0.86 (held during the
  // Diagnostic park, growing across passthrough-02). The legacy
  // `if (progress <= 0.52) return BRANDMARK_ANCHOR_DIAGNOSTIC`
  // park hold is intentionally gone — it grew the brandmark as the
  // camera dollied into the gate and snapped to a smaller size
  // when lead mode kicked in at p=0.52.
  if (progress <= 0.86) return getBrandmarkLeadWorldPosition(progress);
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
 *  Lerps using the same windows as `getBrandmarkWorldPosition` so
 *  the mark perspective-scales naturally as it travels. */
export function getBrandmarkWorldHalfExtent(progress: number): number {
  const H = BRANDMARK_WORLD_HALF_EXTENT;
  if (progress <= 0.2) return H.thoughtform;
  if (progress <= 0.44) return lerp(H.thoughtform, H.diagnostic, smoothstep(0.2, 0.44, progress));
  if (progress <= 0.52) return H.diagnostic;
  if (progress <= 0.72) return lerp(H.diagnostic, H.transitLead, smoothstep(0.52, 0.72, progress));
  if (progress <= 0.86)
    return lerp(H.transitLead, H.intelligence, smoothstep(0.72, 0.86, progress));
  return H.intelligence;
}

// ── Copy + label world anchors ───────────────────────────────────

import type { Beat, DepthGatewayTransform } from "@/lib/stores/depthGatewayStore";

/** Position resolver: either a static `[x, y, z]` tuple OR a function
 *  evaluated per frame against the current depth-gateway transform.
 *  Dynamic resolvers let an anchor slide with a scroll-driven
 *  envelope (e.g. the Thoughtform centering pan) without needing a
 *  bespoke painter — `useWorldDomTracker` already resolves the
 *  position each tick. Mirrors `WorldAnchorPosition` in
 *  `useWorldDomTracker`. */
export type CopyAnchorPosition =
  | readonly [number, number, number]
  | ((transform: DepthGatewayTransform) => readonly [number, number, number]);

export interface CopyAnchor {
  /** Stable id used by the DOM tracker to find the matching element
   *  via `[data-world-anchor="{id}"]`. */
  id: string;
  /** World-space position — static tuple or per-frame resolver. */
  position: CopyAnchorPosition;
  /** Beats during which this anchor is visible (1.0). Outside, the
   *  tracker fades the element out. */
  visibilityBeats: Beat[];
  /** Optional fade window (fraction of beat width) applied at the
   *  outer edges of the visibility window. Default 0.15. */
  fadeFrac?: number;
  /** Optional perspective scaling. See `PerspectiveScaleConfig` in
   *  `useWorldDomTracker`. When set, the DOM tracker writes a
   *  CSS `scale(...)` segment derived from the camera-to-anchor
   *  distance, so labels at world depth render smaller and grow
   *  as the camera approaches. Use for in-world labels (e.g.
   *  Diagnostic orbit pills) — leave undefined for HUD chrome. */
  perspectiveScale?: {
    referenceDistance: number;
    min?: number;
    max?: number;
  };
}

/** Convert SVG-coords-relative-to-orbital-centre into world-space
 *  anchor offsets at the Diagnostic gate centre. The orbital SVG is
 *  1100 wide and we render it at SVG_TO_WORLD = 1/240, so a label at
 *  SVG (x_svg, y_svg) sits at world (x_svg/240, -y_svg/240, gateZ +
 *  0.01). Y is flipped because SVG is y-down and world is y-up. */
const ORBIT_SVG_TO_WORLD = 1 / 240;

/** Depth offset (world units, negative = deeper behind parked Z)
 *  applied to the Diagnostic head copy and orbit label pills during
 *  the passthrough-01 approach. The labels start ~6 units behind
 *  their parked Z and converge to the parked orbital plane by the
 *  time the Diagnostic beat begins. Combined with each anchor's
 *  perspectiveScale, this makes the labels read as GENUINELY
 *  DISTANT objects that fly toward the orbits — not already-landed
 *  text that just shrinks slightly via perspective alone. */
function diagnosticApproachDepthOffset(progress: number): number {
  return lerp(-6, 0, smoothstep(0.18, 0.42, progress));
}

/** Depth offset (world units, negative = deeper behind parked Z)
 *  applied to the Intelligence head copy and side-body labels during
 *  the passthrough-02 approach. Mirror of `diagnosticApproachDepthOffset`:
 *  labels start ~5.5 units behind their parked Z while the camera is
 *  still leaving Diagnostic, then converge to the parked Intelligence
 *  plane by mid-intelligence so the text reads as a DISTANT readout
 *  approaching the substrate rather than a panel that pops to full
 *  size on the beat boundary. */
function intelligenceApproachDepthOffset(progress: number): number {
  return lerp(-5.5, 0, smoothstep(0.55, 0.78, progress));
}

function diagnosticLabelWorldPosition(pipXSvg: number, pipYSvg: number): CopyAnchorPosition {
  const baseX = STATION_DIAGNOSTIC.position[0] + pipXSvg * ORBIT_SVG_TO_WORLD;
  const baseY = STATION_DIAGNOSTIC.position[1] - pipYSvg * ORBIT_SVG_TO_WORLD;
  const baseZ = STATION_DIAGNOSTIC.position[2] + 0.05;
  return (transform) => [
    baseX,
    baseY,
    baseZ + diagnosticApproachDepthOffset(transform.paintProgress),
  ];
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
export const COPY_ANCHORS: readonly CopyAnchor[] = [
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
    position: (transform) => [
      -1.8 + getThoughtformCenterOffsetX(transform.paintProgress),
      0.0,
      STATION_THOUGHTFORM.position[2] + 0.1,
    ],
    visibilityBeats: ["thoughtform", "passthrough-01"],
    // No entry fade — copy reads at full strength the moment the
    // stage pins. Pre-arm projection writes the transform at parked
    // Thoughtform with opacity 0, so revealing it is a single flip
    // from invisible to full ("furnished room on arrival") rather
    // than a 40%-window crossfade as the user scrolls in.
    fadeFrac: 0,
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
  {
    id: "thoughtform.phase.navigate",
    position: (transform) => [
      STATION_THOUGHTFORM.position[0] - 0.5 + getThoughtformCenterOffsetX(transform.paintProgress),
      STATION_THOUGHTFORM.position[1] + 0.7,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ],
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.85,
  },
  {
    id: "thoughtform.phase.encode",
    position: (transform) => [
      STATION_THOUGHTFORM.position[0] -
        0.325 +
        getThoughtformCenterOffsetX(transform.paintProgress),
      STATION_THOUGHTFORM.position[1] - 0.655,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ],
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.85,
  },
  {
    id: "thoughtform.phase.build",
    position: (transform) => [
      STATION_THOUGHTFORM.position[0] + 0.59 + getThoughtformCenterOffsetX(transform.paintProgress),
      STATION_THOUGHTFORM.position[1] + 0.135,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ],
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.85,
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
  {
    id: "diagnostic.headCopy",
    position: (transform) => [
      STATION_DIAGNOSTIC.position[0],
      STATION_DIAGNOSTIC.position[1] + 0.95,
      STATION_DIAGNOSTIC.position[2] + 0.1 + diagnosticApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["passthrough-01", "diagnostic"],
    fadeFrac: 0.12,
    perspectiveScale: {
      referenceDistance: 4.5,
      min: 0.22,
      max: 1.15,
    },
  },
  // 4 orbit labels — pinned to the actual MISS_LABELS pip world
  // positions so they ride the orbits in 3D as the camera
  // approaches and passes the gate. Each label's position
  // resolver applies `diagnosticApproachDepthOffset` to the
  // base orbital pip Z so the pills sit far behind the parked
  // gate at the start of passthrough-01 and converge to their
  // pip's true world position by the Diagnostic beat — combined
  // with perspectiveScale (min 0.2), the labels register as tiny
  // distant text drifting toward the orbits before settling on
  // their pips at parked rest.
  ...MISS_LABELS.map((label) => ({
    id: `diagnostic.label.${label.id}`,
    position: diagnosticLabelWorldPosition(label.x, label.y),
    visibilityBeats: ["passthrough-01", "diagnostic", "passthrough-02"] as Beat[],
    fadeFrac: 0.08,
    perspectiveScale: {
      referenceDistance: 4.5,
      min: 0.2,
      max: 1.2,
    },
  })),

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
  {
    id: "intelligence.headCopy",
    position: (transform) => [
      STATION_INTELLIGENCE.position[0],
      STATION_INTELLIGENCE.position[1] + 0.85,
      STATION_INTELLIGENCE.position[2] +
        0.1 +
        intelligenceApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.18,
    perspectiveScale: {
      referenceDistance: 4.5,
      min: 0.22,
      max: 1.15,
    },
  },
  // L/R body labels — Trusted Sources / Headless Surfaces — sit
  // above each side body. Visibility now extends back into
  // passthrough-02 with the same depth approach + perspective scale
  // as the headline, so the labels track their bodies as the camera
  // closes the distance instead of popping on the beat boundary.
  {
    id: "intelligence.leftLabel",
    position: (transform) => [
      -2.2,
      0.55,
      STATION_INTELLIGENCE.position[2] +
        0.2 +
        intelligenceApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.15,
    perspectiveScale: {
      referenceDistance: 4.5,
      min: 0.25,
      max: 1.2,
    },
  },
  {
    id: "intelligence.rightLabel",
    position: (transform) => [
      2.2,
      0.55,
      STATION_INTELLIGENCE.position[2] +
        0.2 +
        intelligenceApproachDepthOffset(transform.paintProgress),
    ],
    visibilityBeats: ["passthrough-02", "intelligence"],
    fadeFrac: 0.15,
    perspectiveScale: {
      referenceDistance: 4.5,
      min: 0.25,
      max: 1.2,
    },
  },
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
    const SUBSTRATE_CROSSFADE_END = 0.2;
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

/** Left celestial body — "Trusted Sources". Sits left of the
 *  substrate sphere station. */
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

/** Side body opacity envelope across the intelligence beat (gate-
 *  local 0..1). Bodies appear after the substrate sphere has begun
 *  to morph so the read is: brandmark -> sphere -> constellation.
 *
 *  Retained for any legacy painter still reading the chamber model;
 *  new code should call `getIntelligenceSideBodyPresence` instead so
 *  the bodies emerge from camera-space depth during late
 *  passthrough-02 rather than popping inside the intelligence beat. */
export function getSideBodyOpacity(intelligenceGate: number): number {
  if (intelligenceGate <= 0.35) return 0;
  return smoothstep(0.35, 0.85, intelligenceGate);
}

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

// ── Helpers ──────────────────────────────────────────────────────

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ── Re-exports for downstream consumers ──────────────────────────

export { MISS_ORBITS, MISS_LABELS, MISS_VIEWBOX, pointOnEllipse };
