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
// reframe envelope stays in lock-step with the camera path.

/** Reframe window: progress range over which the camera + lookAt
 *  X-pan from off-axis-right to centred. Matches passthrough-01. */
const REFRAME_START = 0.18;
const REFRAME_END = 0.32;

/** Scroll progress at which the camera Z dolly is RELEASED. The
 *  dolly holds at 0 (camera stationary at `CAMERA_START.z`) across
 *  [0, Z_DOLLY_HOLD_END] so the Thoughtform lateral pan
 *  (compass + brandmark + copy sliding to dead-centre, see
 *  `getThoughtformCenterOffsetX`) reads as a pure camera-pan with
 *  no forward drift. After this boundary the dolly smoothsteps to 1
 *  across the remaining scroll, carrying the camera into and through
 *  the corridor. Must stay aligned with `THOUGHTFORM_PAN_END`. */
const Z_DOLLY_HOLD_END = 0.18;

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

/** Look-at point. Travels with the camera (LOOK_AHEAD units further
 *  down the corridor) and pans X 0.95 -> 0 across passthrough-01. */
export function getCameraLookAt(progress: number): [number, number, number] {
  const [, , camZ] = getCameraPosition(progress);
  const reframeT = smoothstep(REFRAME_START, REFRAME_END, progress);
  const lookX = lerp(LOOK_AT_X_START, LOOK_AT_X_END, reframeT);
  // Bob phased to corridor progress — one and a half cycles across
  // the full stage, very low amplitude.
  const bobY = Math.sin(progress * Math.PI * 3) * LOOK_BOB_AMPLITUDE;
  return [lookX, bobY, camZ - LOOK_AHEAD];
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
  position: [1.1, 0.0, gateZAtParkProgress(0.09)],
  halfExtent: 1.6,
  parkProgress: 0.09,
};

/** Diagnostic orbital field — centred. By the time the user parks
 *  here, the camera reframe has resolved to X=0, so this gate sits
 *  dead-centre on the optical axis. */
export const STATION_DIAGNOSTIC: GateStation = {
  id: "diagnostic",
  position: [0, 0, gateZAtParkProgress(0.41)],
  halfExtent: 2.2,
  parkProgress: 0.41,
};

/** Interstitial waypoint — sits in the middle of passthrough-02 so
 *  the camera passes through it on the way to Intelligence. */
export const STATION_INTERSTITIAL: GateStation = {
  id: "interstitial",
  position: [0, 0, gateZAtParkProgress(0.6)],
  halfExtent: 1.8,
  parkProgress: 0.6,
};

/** Intelligence sphere station — centre of the substrate-cut beat.
 *  The substrate sphere + L/R side bodies all live in this group. */
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

// ── Thoughtform centering pan ────────────────────────────────────

/** Scroll range over which the Thoughtform composition (compass +
 *  brandmark + phase labels + left copy) pans laterally from its
 *  parked off-axis-right rest to dead-centre. Held flat outside
 *  this range so the user gets a real beat to read the parked
 *  frame before the pan begins, and the centre position is locked
 *  in before the camera Z dolly is released (see `Z_DOLLY_HOLD_END`).
 *
 *  PAN_START is pushed well past 0 (was 0.05) so the parked two-
 *  column composition holds across the first ~11% of stage scroll
 *  — fast scrollers get a stationary beat to take in the copy +
 *  brandmark composition before any motion begins. PAN_END stays
 *  locked to `Z_DOLLY_HOLD_END` so the camera dolly + ring
 *  flythrough release the moment the pan completes; downstream
 *  timing is unchanged.
 *
 *  The pan applies the SAME `dx` to every Thoughtform-anchored
 *  element each frame, so the world reads as a single camera-pan
 *  rather than independent object motions. */
const THOUGHTFORM_PAN_START = 0.11;
const THOUGHTFORM_PAN_END = 0.18;

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

// ── Thoughtform compass flythrough ───────────────────────────────

/** Staggered flythrough windows per compass ring. The outer ring
 *  (index 0) flies first — its window opens the instant the lateral
 *  pan completes and the camera dolly is released. Each inner ring
 *  follows 0.025 of scroll later, so the user reads four discrete
 *  arches sweeping past the camera in tight sequence rather than a
 *  single mass dimming at distance. Total span [0.18, 0.335] starts
 *  with the camera dolly release (`Z_DOLLY_HOLD_END`) and ends just
 *  inside the diagnostic beat (which begins at 0.32). */
const FLYTHROUGH_WINDOWS: readonly { start: number; end: number }[] = [
  { start: 0.18, end: 0.26 }, // ring 0 (outer) + diamond
  { start: 0.205, end: 0.285 }, // ring 1
  { start: 0.23, end: 0.31 }, // ring 2
  { start: 0.255, end: 0.335 }, // ring 3 (inner)
];

/** Forward translation (positive world Z) added to each ring at the
 *  end of its flythrough window. Parked compass sits at world Z=5.5;
 *  +6 brings the ring to Z=11.5, ~2-3 world units past the held
 *  camera (Z=10 -> ~8.3 during the windows), so each ring physically
 *  passes the camera plane before fading. */
const FLYTHROUGH_Z_DISTANCE = 6;

/** Local-T (0..1 inside the window) at which the ring begins fading.
 *  Held at full for the first 70%, ramps 1 -> 0 in the final 30% so
 *  the ring vanishes just before becoming a giant gold smear around
 *  the viewer. */
const FLYTHROUGH_FADE_FROM = 0.7;

/** Per-ring flythrough state for the Thoughtform compass.
 *
 *  - `dz` is the Z translation to add to the ring's gate-relative
 *    origin each frame (gate is at world Z=5.5, ring's local Z is 0,
 *    so the ring's world Z = 5.5 + dz).
 *  - `opacityT` is the local opacity multiplier (combined downstream
 *    with each ring's `baseAlpha` weight). */
export function getThoughtformRingFlythrough(
  progress: number,
  ringIndex: number
): { dz: number; opacityT: number } {
  const w = FLYTHROUGH_WINDOWS[ringIndex] ?? FLYTHROUGH_WINDOWS[0];
  if (progress <= w.start) return { dz: 0, opacityT: 1 };
  if (progress >= w.end) return { dz: FLYTHROUGH_Z_DISTANCE, opacityT: 0 };
  const t = smoothstep(w.start, w.end, progress);
  const dz = t * FLYTHROUGH_Z_DISTANCE;
  const opacityT =
    t <= FLYTHROUGH_FADE_FROM ? 1 : 1 - (t - FLYTHROUGH_FADE_FROM) / (1 - FLYTHROUGH_FADE_FROM);
  return { dz, opacityT };
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

/** Resolve the brandmark world position for the current GLOBAL
 *  progress. Smoothly interpolates between the three parked anchors
 *  across the beat windows so the mark TRAVELS through world space. */
export function getBrandmarkWorldPosition(progress: number): [number, number, number] {
  // Beat windows (mirror BEAT_WINDOWS):
  //   thoughtform     : [0.00, 0.18]
  //   passthrough-01  : [0.18, 0.32]
  //   diagnostic      : [0.32, 0.50]
  //   passthrough-02  : [0.50, 0.70]
  //   intelligence    : [0.70, 1.00]
  //
  // Brandmark stays parked at thoughtform across thoughtform +
  // first half of passthrough-01 (so the camera reframe pulls AWAY
  // from a stable mark), then travels across the second half of
  // passthrough-01 + first half of diagnostic, parks at diagnostic,
  // then travels across passthrough-02 + early intelligence to the
  // intelligence anchor.

  // Apply the Thoughtform centering pan to the THOUGHTFORM-side
  // anchor X each frame so the brandmark slides laterally with the
  // compass + copy during the [0.05, 0.18] window. By the time the
  // travel envelope below kicks in (>= 0.22) the offset has fully
  // resolved to -STATION_THOUGHTFORM.position[0], which puts the
  // Thoughtform anchor on the world axis — matching the Diagnostic
  // anchor's X — so the X-lerp is effectively a no-op and Y/Z do
  // all the travel work, as designed.
  const tfOffsetX = getThoughtformCenterOffsetX(progress);
  const tfX = BRANDMARK_ANCHOR_THOUGHTFORM[0] + tfOffsetX;

  if (progress <= 0.22) {
    return [tfX, BRANDMARK_ANCHOR_THOUGHTFORM[1], BRANDMARK_ANCHOR_THOUGHTFORM[2]];
  }
  if (progress <= 0.38) {
    const t = smoothstep(0.22, 0.38, progress);
    return [
      lerp(tfX, BRANDMARK_ANCHOR_DIAGNOSTIC[0], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[1], BRANDMARK_ANCHOR_DIAGNOSTIC[1], t),
      lerp(BRANDMARK_ANCHOR_THOUGHTFORM[2], BRANDMARK_ANCHOR_DIAGNOSTIC[2], t),
    ];
  }
  if (progress <= 0.5) return BRANDMARK_ANCHOR_DIAGNOSTIC;
  if (progress <= 0.78) {
    const t = smoothstep(0.5, 0.78, progress);
    return [
      lerp(BRANDMARK_ANCHOR_DIAGNOSTIC[0], BRANDMARK_ANCHOR_INTELLIGENCE[0], t),
      lerp(BRANDMARK_ANCHOR_DIAGNOSTIC[1], BRANDMARK_ANCHOR_INTELLIGENCE[1], t),
      lerp(BRANDMARK_ANCHOR_DIAGNOSTIC[2], BRANDMARK_ANCHOR_INTELLIGENCE[2], t),
    ];
  }
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
  diagnostic: 0.18,
  intelligence: 0.42,
} as const;

/** Brandmark world half-extent for the current scroll position.
 *  Lerps using the same windows as `getBrandmarkWorldPosition` so
 *  the mark perspective-scales naturally as it travels. */
export function getBrandmarkWorldHalfExtent(progress: number): number {
  const H = BRANDMARK_WORLD_HALF_EXTENT;
  if (progress <= 0.22) return H.thoughtform;
  if (progress <= 0.38) return lerp(H.thoughtform, H.diagnostic, smoothstep(0.22, 0.38, progress));
  if (progress <= 0.5) return H.diagnostic;
  if (progress <= 0.78) return lerp(H.diagnostic, H.intelligence, smoothstep(0.5, 0.78, progress));
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
}

/** Convert SVG-coords-relative-to-orbital-centre into world-space
 *  anchor offsets at the Diagnostic gate centre. The orbital SVG is
 *  1100 wide and we render it at SVG_TO_WORLD = 1/240, so a label at
 *  SVG (x_svg, y_svg) sits at world (x_svg/240, -y_svg/240, gateZ +
 *  0.01). Y is flipped because SVG is y-down and world is y-up. */
const ORBIT_SVG_TO_WORLD = 1 / 240;
function diagnosticLabelWorldPosition(pipXSvg: number, pipYSvg: number): [number, number, number] {
  return [
    STATION_DIAGNOSTIC.position[0] + pipXSvg * ORBIT_SVG_TO_WORLD,
    STATION_DIAGNOSTIC.position[1] - pipYSvg * ORBIT_SVG_TO_WORLD,
    STATION_DIAGNOSTIC.position[2] + 0.05,
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
      -1.8 + getThoughtformCenterOffsetX(transform.progress),
      0.0,
      STATION_THOUGHTFORM.position[2] + 0.1,
    ],
    visibilityBeats: ["thoughtform", "passthrough-01"],
    fadeFrac: 0.4,
  },
  // Three phase labels — NAVIGATE/ENCODE/BUILD — sit at the v7 sigil
  // ring node positions (top, lower-left, lower-right) relative to
  // the compass centre. Offsets must match `PHASE_NODES` in
  // ThoughtformCompassGate so the DOM labels stay co-located with
  // the 3D phase-node markers (0.75x of the legacy values to track
  // the smaller compass geometry: 0.95 -> 0.71, 0.82 -> 0.62,
  // 0.48 -> 0.36). The per-frame X resolver folds in the centering
  // pan offset so the labels track the compass as it slides.
  {
    id: "thoughtform.phase.navigate",
    position: (transform) => [
      STATION_THOUGHTFORM.position[0] + getThoughtformCenterOffsetX(transform.progress),
      STATION_THOUGHTFORM.position[1] + 0.71,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ],
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.3,
  },
  {
    id: "thoughtform.phase.encode",
    position: (transform) => [
      STATION_THOUGHTFORM.position[0] - 0.62 + getThoughtformCenterOffsetX(transform.progress),
      STATION_THOUGHTFORM.position[1] - 0.36,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ],
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.3,
  },
  {
    id: "thoughtform.phase.build",
    position: (transform) => [
      STATION_THOUGHTFORM.position[0] + 0.62 + getThoughtformCenterOffsetX(transform.progress),
      STATION_THOUGHTFORM.position[1] - 0.36,
      STATION_THOUGHTFORM.position[2] + 0.05,
    ],
    visibilityBeats: ["thoughtform"],
    fadeFrac: 0.3,
  },

  // ── Diagnostic ──────────────────────────────────────────────────
  // Heading block above the orbital field — bridge + title.
  {
    id: "diagnostic.headCopy",
    position: [
      STATION_DIAGNOSTIC.position[0],
      STATION_DIAGNOSTIC.position[1] + 0.95,
      STATION_DIAGNOSTIC.position[2] + 0.1,
    ],
    visibilityBeats: ["diagnostic"],
    fadeFrac: 0.15,
  },
  // 4 orbit labels — pinned to the actual MISS_LABELS pip world
  // positions so they ride the orbits in 3D as the camera approaches
  // and passes the gate.
  ...MISS_LABELS.map((label) => ({
    id: `diagnostic.label.${label.id}`,
    position: diagnosticLabelWorldPosition(label.x, label.y),
    visibilityBeats: ["diagnostic", "passthrough-02"] as Beat[],
    fadeFrac: 0.1,
  })),

  // ── Intelligence ────────────────────────────────────────────────
  // Heading block above the substrate sphere.
  {
    id: "intelligence.headCopy",
    position: [
      STATION_INTELLIGENCE.position[0],
      STATION_INTELLIGENCE.position[1] + 0.85,
      STATION_INTELLIGENCE.position[2] + 0.1,
    ],
    visibilityBeats: ["intelligence", "passthrough-02"],
    fadeFrac: 0.08,
  },
  // L/R body labels — Trusted Sources / Headless Surfaces — sit
  // above each side body.
  {
    id: "intelligence.leftLabel",
    position: [-2.2, 0.55, STATION_INTELLIGENCE.position[2] + 0.2],
    visibilityBeats: ["intelligence"],
    fadeFrac: 0.12,
  },
  {
    id: "intelligence.rightLabel",
    position: [2.2, 0.55, STATION_INTELLIGENCE.position[2] + 0.2],
    visibilityBeats: ["intelligence"],
    fadeFrac: 0.12,
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
 *  to morph so the read is: brandmark -> sphere -> constellation. */
export function getSideBodyOpacity(intelligenceGate: number): number {
  if (intelligenceGate <= 0.35) return 0;
  return smoothstep(0.35, 0.85, intelligenceGate);
}

// ── Helpers ──────────────────────────────────────────────────────

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ── Re-exports for downstream consumers ──────────────────────────

export { MISS_ORBITS, MISS_LABELS, MISS_VIEWBOX, pointOnEllipse };
