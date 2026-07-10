// Services Card Ring — pure math for the #services orbit of service cards
// (ADR-029). Placement around the brandmark, scroll-progress → rotation with
// per-beat dwell, an underdamped-but-hard-bounded spring (the ADR-021
// compliant "bounded decaying sway"), and the depth fade/scale curves.
//
// Kept free of DOM/three so it stays unit-testable
// (tests/lib/services-ring-math.test.ts). Consumed by
// components/landing/home-v2/services/hologram/ServicesCardRing.tsx.
//
// Units: lengths are in ORBIT-CONFIG space — the same space as
// `OrbitConfig.radius` in HologramOrbits (waist ring 1.06, meridian 1.78).
// World size = value × armillary scale (0.62 in the corridor) × the parked
// group scale, so the ring inherits every scale the armillary already rides.

/** Number of cards — one per service, quarter spacing. */
export const RING_COUNT = 4;

/** Runway beats — ONE collapsed lead-in + one beat per service. MUST stay in
 *  lockstep with `STEP_COUNT` in useServicesStageScroll.ts (and the 500svh
 *  runway in services.css). */
export const RING_STEP_COUNT = 5;

/** Card orbit radius — between the keynote shell (1.52, labs) and the
 *  meridian (1.78) so cards clear the mark but stay inside the outer frame. */
export const RING_RADIUS = 1.55;

/** Card plane height (orbit units). Width follows the plate aspect. Sized
 *  so the FULL C3 plate face (photo + copy + CTA, baked) stays readable
 *  when parked front-center — the card carries its own text now, so it
 *  runs larger than the photo-only pass did. */
export const RING_CARD_HEIGHT = 1.3;

/** Portrait plate aspect from the design handoff (420 × 680 card body). */
export const RING_CARD_ASPECT = 420 / 680;

/** Vertical offset of the ring plane — front card rides slightly low so the
 *  mark's crown stays visible over it (front-center overlap composition),
 *  but clear of the bottom readout strip. */
export const RING_Y_OFFSET = -0.04;

/** How much orbiting cards angle toward the camera: 0 = tidally locked
 *  outward (side cards read edge-on), 1 = side cards fully camera-facing.
 *  A partial blend keeps the orbit read while the photos stay visible in
 *  transit (the activetheory gallery look). Applied via `cardFacingYaw` —
 *  NOT a naive `phi × (1 − blend)`, which scales the absolute azimuth and
 *  flips one side card onto its mirrored back face (found 2026-07-10). */
export const RING_FACING_BLEND = 0.32;

/** Orbit direction: −1 → the next service's card arrives from screen-right. */
export const RING_DIRECTION = -1;

/** Quarter turn between adjacent cards. */
export const RING_QUARTER = (Math.PI * 2) / RING_COUNT;

/** Fraction of each scroll beat spent TRAVELLING to the incoming card; the
 *  remainder is dwell (the card holds front while its copy is read). */
export const RING_TRAVEL_FRAC = 0.45;

/** Spring frequency (rad/s) for the rotation follower. */
export const RING_SPRING_OMEGA = 6.0;

/** Damping ratio < 1 → a small underdamped overshoot that decays to rest.
 *  This IS the "bounded decaying sway": the only motion after scroll stops
 *  is this spring settling — there is no wall-clock term anywhere. */
export const RING_SPRING_ZETA = 0.82;

/** Hard cap (rad ≈ 6.9°) on |rotation − target|. Bounds both the tracking
 *  lag during fast scroll AND the post-scroll sway, so the ring can never
 *  revolve on its own (ADR-021 addendum: no time-clock rotation behind
 *  readable services copy). */
export const RING_SWAY_CAP_RAD = 0.12;

/** Card scale from depth: back → front. */
export const RING_SCALE_RANGE: readonly [number, number] = [0.62, 1.06];

/** Card opacity from depth: back cards dim toward the void — this stands in
 *  for real occlusion behind the particle mark (which writes no depth). */
export const RING_OPACITY_RANGE: readonly [number, number] = [0.08, 1.0];

/** Per-card entrance windows in `--corridor-dissipate` units — staggered
 *  after the orbit draw-on begins (~0.45), matching the armillary reveal. */
export const RING_ENTRANCE_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.6, 0.88],
  [0.66, 0.92],
  [0.72, 0.96],
  [0.78, 1.0],
];

/** Cards fly IN from a slightly wider radius while fading in. */
export const RING_ENTRANCE_RADIUS_FROM = 1.18;

/** depthWrite hysteresis thresholds on nz (see ServicesCardRing): the front
 *  card writes depth (so the mark's points occlude behind it); side/back
 *  cards must not (a translucent card writing depth would punch a hole in
 *  the depthWrite:false particle pass). ±0.02 hysteresis avoids flicker. */
export const RING_DEPTH_WRITE_ON_NZ = 0.37;
export const RING_DEPTH_WRITE_OFF_NZ = 0.33;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smootherstep on [edge0, edge1] — C2-continuous (matches the services
 *  entrance easing convention in useServicesStageScroll). */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Resting azimuth of card `i` — even spacing, card 0 at the front. */
export function basePhi(index: number): number {
  return (index / RING_COUNT) * Math.PI * 2;
}

/**
 * Continuous ring index for runway progress p ∈ [0,1] — a SMOOTH STAIRCASE
 * over the 5-beat runway:
 *
 *   beat 0 (lead-in) and beat 1 (service 0's beat): index 0 — the first
 *     card is already front when the section settles;
 *   beat k ≥ 2: index travels (k−2) → (k−1) with smootherstep over the
 *     first RING_TRAVEL_FRAC of the beat, then dwells.
 *
 * Monotonic, continuous, and exactly integral during every dwell — the
 * front card is settled whenever the step clock (floor(p·5)) is mid-beat.
 */
export function ringIndexForProgress(
  progress: number,
  stepCount: number = RING_STEP_COUNT,
  travelFrac: number = RING_TRAVEL_FRAC
): number {
  const p = clamp01(progress);
  const seg = p * stepCount;
  const k = Math.floor(seg);
  const u = seg - k;
  if (k <= 1) return 0;
  const travel = travelFrac > 0 ? smootherstep(0, 1, Math.min(1, u / travelFrac)) : 1;
  return Math.min(RING_COUNT - 1, k - 2 + travel);
}

/** Ring rotation (rad) for runway progress — the scroll-derived TARGET the
 *  spring follows. Card `frontCardIndex(rotation)` faces the camera. */
export function ringRotationForProgress(
  progress: number,
  stepCount: number = RING_STEP_COUNT,
  travelFrac: number = RING_TRAVEL_FRAC
): number {
  return RING_DIRECTION * ringIndexForProgress(progress, stepCount, travelFrac) * RING_QUARTER;
}

/** Step-derived ACTIVE service index (0..3) for the same runway progress —
 *  mirrors useServicesStageScroll: step = floor(p·5) clamped, service =
 *  max(0, step − 1). Exported so tests can pin ring/step agreement. */
export function activeServiceForProgress(
  progress: number,
  stepCount: number = RING_STEP_COUNT
): number {
  const p = clamp01(progress);
  const step = Math.max(0, Math.min(stepCount - 1, Math.floor(p * stepCount)));
  return Math.max(0, step - 1);
}

/** Which card index is nearest the front for a given rotation. */
export function frontCardIndex(rotation: number): number {
  const k = Math.round((RING_DIRECTION * rotation) / RING_QUARTER);
  return ((k % RING_COUNT) + RING_COUNT) % RING_COUNT;
}

export interface RingSpringState {
  /** Current rotation (rad). */
  pos: number;
  /** Angular velocity (rad/s). */
  vel: number;
}

export interface RingSpringOptions {
  omega?: number;
  zeta?: number;
  /** Hard bound on |pos − target| (rad). */
  cap?: number;
  /** Snap straight to the target (idle-resume / teleport path). */
  snap?: boolean;
}

/** Max integration step — frameloop toggles can hand us huge dt gaps
 *  (BEST-PRACTICES: clamp per-frame dt). */
const MAX_DT = 1 / 30;

/**
 * Semi-implicit underdamped spring step toward `target`. MUTATES and
 * returns `state` (called per frame — no allocation). The hard cap keeps
 * the ring within RING_SWAY_CAP_RAD of the scroll-derived target at all
 * times: scroll stays the owner, the spring only shapes the last few
 * degrees and the decaying release sway.
 */
export function stepRingSpring(
  state: RingSpringState,
  target: number,
  dtSeconds: number,
  options: RingSpringOptions = {}
): RingSpringState {
  const {
    omega = RING_SPRING_OMEGA,
    zeta = RING_SPRING_ZETA,
    cap = RING_SWAY_CAP_RAD,
    snap = false,
  } = options;

  if (snap || !Number.isFinite(state.pos) || !Number.isFinite(state.vel)) {
    state.pos = target;
    state.vel = 0;
    return state;
  }

  const dt = Math.min(MAX_DT, Math.max(0, dtSeconds));
  if (dt > 0) {
    const accel = omega * omega * (target - state.pos) - 2 * zeta * omega * state.vel;
    state.vel += accel * dt;
    state.pos += state.vel * dt;
  }

  // Hard bound: never lag or overshoot past the cap; kill outward velocity
  // at the clamp so the spring re-enters smoothly.
  if (state.pos - target > cap) {
    state.pos = target + cap;
    if (state.vel > 0) state.vel = 0;
  } else if (target - state.pos > cap) {
    state.pos = target - cap;
    if (state.vel < 0) state.vel = 0;
  }
  return state;
}

export interface RingCardPlacement {
  x: number;
  y: number;
  z: number;
  /** Y-rotation for the outward-facing billboard — the CONTINUOUS azimuth
   *  (no atan2 branch cut), so the card never seam-flips mid-orbit. */
  rotY: number;
  /** Normalized depth: +1 = front (toward camera), −1 = behind the mark. */
  nz: number;
}

export interface RingPlacementOptions {
  radius?: number;
  yOffset?: number;
  /** Extra radius multiplier (entrance fly-in). */
  radiusMul?: number;
}

/** Position + facing for card `index` at ring `rotation`. Front is +z
 *  (toward the corridor camera at the group origin). */
export function placeCard(
  index: number,
  rotation: number,
  options: RingPlacementOptions = {}
): RingCardPlacement {
  const { radius = RING_RADIUS, yOffset = RING_Y_OFFSET, radiusMul = 1 } = options;
  const phi = basePhi(index) + rotation;
  const r = radius * radiusMul;
  return {
    x: Math.sin(phi) * r,
    y: yOffset,
    z: Math.cos(phi) * r,
    rotY: phi,
    nz: Math.cos(phi),
  };
}

/**
 * Billboard yaw for a card at azimuth `phi`, blended toward camera-facing.
 *
 *   yaw = phi − blend · (π/2) · sin(phi)
 *
 * The sin term is the key: it subtracts the deviation-from-front
 * SYMMETRICALLY on both sides (a card at +90° turns back −blend·90°, a
 * card at 270° turns +blend·90°), is smooth and 2π-periodic (no branch
 * cut as the ring wraps — unlike scaling the absolute azimuth, which
 * rotates the phi≈270° card ~180° onto its mirrored back face), and is 0
 * at the exact front and back, so the front card always faces the camera
 * dead-on. Side cards show a ¾ FRONT face whenever blend < 1.
 */
export function cardFacingYaw(phi: number, blend: number = RING_FACING_BLEND): number {
  return phi - blend * (Math.PI / 2) * Math.sin(phi);
}

/** Card scale from normalized depth. */
export function depthScale(
  nz: number,
  range: readonly [number, number] = RING_SCALE_RANGE
): number {
  return lerp(range[0], range[1], smootherstep(-1, 1, nz));
}

/** Card opacity from normalized depth — back cards sink toward the void
 *  well before they'd overlap the mark from behind. */
export function depthOpacity(
  nz: number,
  range: readonly [number, number] = RING_OPACITY_RANGE
): number {
  return lerp(range[0], range[1], smootherstep(-0.55, 0.85, nz));
}

/** depthWrite hysteresis gate (see RING_DEPTH_WRITE_* rationale). */
export function depthWriteGate(previous: boolean, nz: number): boolean {
  if (previous) return nz > RING_DEPTH_WRITE_OFF_NZ;
  return nz > RING_DEPTH_WRITE_ON_NZ;
}

export interface RingEntrance {
  opacity: number;
  radiusMul: number;
}

/** Staggered dock entrance for card `index` from the dissipate clock —
 *  fade in while flying in from a slightly wider radius. */
export function entranceEnvelope(dissipate: number, index: number): RingEntrance {
  const window =
    RING_ENTRANCE_WINDOWS[Math.max(0, Math.min(RING_ENTRANCE_WINDOWS.length - 1, index))];
  const t = smootherstep(window[0], window[1], dissipate);
  return { opacity: t, radiusMul: lerp(RING_ENTRANCE_RADIUS_FROM, 1, t) };
}
