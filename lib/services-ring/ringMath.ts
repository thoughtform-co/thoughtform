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

import { clamp01, lerp } from "@/lib/math";

/** Number of cards — one per service, quarter spacing. */
export const RING_COUNT = 4;

/** Runway beats — ONE collapsed lead-in + one beat per service + ONE
 *  exit-hold beat (ADR-030: the last card dwells while the #tools station
 *  sweeps up over the still-pinned stage). MUST stay in lockstep with
 *  `STEP_COUNT` in useServicesStageScroll.ts (which aliases this constant)
 *  and the 600svh runway in services.css. */
export const RING_STEP_COUNT = 6;

/** Card orbit radius — between the keynote shell (1.52, labs) and the
 *  meridian (1.78) so cards clear the mark but stay inside the outer frame. */
export const RING_RADIUS = 1.55;

/** Card plane height (orbit units). Width follows the plate aspect. Sized
 *  so the FULL C3 plate face (photo + copy + CTA, baked) stays readable
 *  when parked front-center — the card carries its own text now, so it
 *  runs larger than the photo-only pass did. Bumped 1.3 → 1.42 with the
 *  Update-1 tighter orbit base (the front card parks ~0.27 world farther
 *  from the camera, so the plane grows to hold its apparent size). */
export const RING_CARD_HEIGHT = 1.42;

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
 *  flips one side card onto its mirrored back face (found 2026-07-10).
 *  Lifted 0.32 → 0.45 in Update 1 so the neighbouring cards read as
 *  cards (Vince: "make it clearer that there are other cards"). */
export const RING_FACING_BLEND = 0.45;

/** Parked front-card pose bias (ADR-029 addendum, 2026-07-11): the front
 *  card holds a small residual 3/4 pose instead of parking dead-flat, so
 *  the slab's extruded depth + gold lip stay visible while it is THE
 *  in-view card (the Atlas "tablet" read — before this, only the side
 *  cards showed their 3D). Constant angles scaled by a front-window ramp
 *  over parametric depth `nz` (the same 0.35→0.95 window the halo uses),
 *  so side cards — already 3/4 via RING_FACING_BLEND — take none.
 *  Scroll/pointer-owned only: nz moves with the ring, never a time clock.
 *  NOT a revival of the getServicePose yaw (ADR-029 pitfall — that
 *  double-rotated cards per service; this is a constant term applied
 *  after cardFacingYaw). */
export const RING_FRONT_BIAS_YAW = 0.13;
export const RING_FRONT_BIAS_PITCH = -0.04;
export const RING_FRONT_BIAS_WINDOW: readonly [number, number] = [0.35, 0.95];

/** Pose bias for a card at parametric depth `nz` (−1 back … 1 front). */
export function frontPoseBias(nz: number): { pitch: number; yaw: number } {
  const w = smootherstep(RING_FRONT_BIAS_WINDOW[0], RING_FRONT_BIAS_WINDOW[1], nz);
  return { pitch: RING_FRONT_BIAS_PITCH * w, yaw: RING_FRONT_BIAS_YAW * w };
}

/** Orbit direction: −1 → the next service's card arrives from screen-right. */
export const RING_DIRECTION = -1;

/** Quarter turn between adjacent cards. */
export const RING_QUARTER = (Math.PI * 2) / RING_COUNT;

/** Fraction of each scroll beat spent TRAVELLING to the incoming card; the
 *  remainder is dwell (the card holds front while its copy is read).
 *  Widened 0.45 → 0.55 in Update 3 so a snapped beat spreads its turn over
 *  more of the scroll animation (smoother read, still ample dwell). */
export const RING_TRAVEL_FRAC = 0.55;

/** Spring frequency (rad/s) for the rotation follower. Slowed 6.0 → 4.2 in
 *  Update 3, 4.2 → 3.4 in Update 5 — with the snap path now riding the
 *  eased ringScrollTween, the spring's remaining job is smoothing NATIVE
 *  scroll (scrollbar drags, stepped mouse-wheel ticks below the band),
 *  and the softer follow turns that staircase into a glide. */
export const RING_SPRING_OMEGA = 3.4;

/** Damping ratio < 1 → a small underdamped overshoot that decays to rest.
 *  This IS the "bounded decaying sway": the only motion after scroll stops
 *  is this spring settling — there is no wall-clock term anywhere.
 *  0.82 → 0.9 in Update 3, → 0.93 in Update 5: glide over wobble. */
export const RING_SPRING_ZETA = 0.93;

/** Hard cap (rad ≈ 32°) on |rotation − target|. Bounds both the tracking
 *  lag during fast scroll AND the post-scroll sway, so the ring can never
 *  revolve on its own (ADR-021 addendum: no time-clock rotation behind
 *  readable services copy). Widened 0.12 → 0.38 in Update 3 (at 0.12 the
 *  spring rode the clamp through every quarter-turn and the motion was
 *  effectively the browser's scroll easing), → 0.55 in Update 5 so the
 *  slower spring has room to shape a native-scroll quarter-turn without
 *  being dragged at the clamp. Still well under the quarter (π/2), still
 *  hard-bounded + decaying — firmly scroll-owned. */
export const RING_SWAY_CAP_RAD = 0.55;

/** Card scale from depth: back → front. Floor lifted 0.62 → 0.72 in
 *  Update 1 — side cards sit closer and read as reachable cards. */
export const RING_SCALE_RANGE: readonly [number, number] = [0.72, 1.06];

/** Card opacity from depth: back cards dim toward the void — this stands in
 *  for real occlusion behind the particle mark (which writes no depth).
 *  Floor lifted 0.08 → 0.16 in Update 1 (see also RING_OPACITY_WINDOW).
 *  Ceiling dropped 1.0 → 0.9 in Update 4 (Vince: "make the cards slightly
 *  transparent") — the front face stays a translucent device pane, letting
 *  the tracks, halo, and starfield ghost through it. Must stay > 0.55 so
 *  the front card's depthWrite gate keeps engaging. */
export const RING_OPACITY_RANGE: readonly [number, number] = [0.16, 0.9];

/** Smootherstep window (in nz) for `depthOpacity`. The high edge pulled in
 *  from 0.85 → 0.6 (Update 1) lifts the SIDE cards (nz ≈ 0) toward
 *  presence without brightening the card hidden behind the mark
 *  (nz = −1 stays pinned at the range floor). */
export const RING_OPACITY_WINDOW: readonly [number, number] = [-0.55, 0.6];

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

/* ── Decommission exit (ADR-030 Update 1: "the viewscreen changes modes")
 * The runway's final beat is the DECOMMISSION beat: the cards fly OUT and
 * fade (staggered) while DOM pills FLIP from their screen rects to the
 * right HUD rail and the brandmark recedes. Everything below is a pure
 * function of the EXIT CLOCK — 0 before the final beat, 0..1 across it —
 * so the whole sequence is scroll-owned and reversible (ADR-021). */

/** Per-card exit windows in EXIT-CLOCK units. Index-ascending stagger:
 *  card 3 is FRONT at exit (the staircase parks the ring on the last
 *  card), so the card being read leaves LAST. The tail [0.9, 1.0] stays
 *  clear so the pill flight finishes and the receding mark reads alone. */
export const RING_EXIT_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.5],
  [0.12, 0.62],
  [0.24, 0.74],
  [0.36, 0.9],
];

/** Cards fly OUT to a slightly wider radius while fading (reverse of the
 *  RING_ENTRANCE_RADIUS_FROM fly-in). */
export const RING_EXIT_RADIUS_TO = 1.15;

/* ── Per-card orbits (ADR-029 Update 1) ─────────────────────────────────
 * Each card rides its OWN orbital track around the mark — four nearly
 * coplanar ellipses with staggered radii, small tilt deviations, and
 * distinct stroke styles (see cardTrackOrbits.ts), so the cards read as
 * nodes of the armillary rather than a detached carousel. The base sits
 * TIGHTER than the retired flat ring (1.55) so the side cards stay in
 * frame ("bring them a bit closer"). */

/** Mean orbit radius (orbit-config units — same space as OrbitConfig). */
export const RING_ORBIT_BASE_RADIUS = 1.3;

/** Radius stagger: card radii span base ± spread. */
export const RING_ORBIT_RADIUS_SPREAD = 0.12;

/** Tilt deviation amplitude (rad) — how far each orbit leans away from the
 *  ring plane. Kept small so the carousel read survives and the facing
 *  yaw (a pure Y rotation) stays a faithful billboard. */
export const RING_ORBIT_TILT_AMP = 0.06;

/* ── Device slab (ADR-029 Update 1) ─────────────────────────────────────
 * The card is a thin transparent SLAB (the Atlas constellation "tablet" /
 * Expanse hand-terminal read): content plane floated over an extruded
 * chamfered glass body with a clear bezel margin, gold-lipped side walls,
 * a hairline edge glint, and a soft halo behind the front card. All in
 * orbit-config units unless noted; Atlas proportion reference: slab depth
 * ≈ 3–4% of card width. */

/** Slab thickness (extrude depth). Lifted 0.03 → 0.045 with the parked
 *  front-pose bias (ADR-029 addendum) so the held 3/4 angle shows a
 *  legible gold side wall (~2–3px at park scale, vs ~1.5px before). */
export const RING_SLAB_DEPTH = 0.045;

/** Clear bezel margin around the content plane, each side. */
export const RING_SLAB_BEZEL = 0.05;

/** Chamfer cut as a fraction of slab width — matches the bake's 52/840. */
export const RING_SLAB_CHAMFER_FRAC = 52 / 840;

/** Content plane float above the slab's front cap. */
export const RING_CONTENT_LIFT = 0.006;

/** Glass body (front/back caps) opacity at full card presence. */
export const RING_GLASS_OPACITY = 0.13;

/** Extruded side-wall opacity — the gold lip of the slab edge. Lifted
 *  0.34 → 0.44 with the parked front-pose bias so the lip reads at the
 *  held 3/4 angle. */
export const RING_GLASS_EDGE_OPACITY = 0.44;

/** Hairline EdgesGeometry glint opacity. */
export const RING_EDGE_GLINT_OPACITY = 0.42;

/** Behind-card halo opacity (front-weighted; ~0 on side/back cards). */
export const RING_GLOW_OPACITY = 0.16;

/** Track draw-on windows lead the card entrance windows by this much
 *  (dissipate units) so each orbit line is on screen just before its
 *  card flies in along it. */
export const RING_TRACK_REVEAL_LEAD = 0.06;

/** depthWrite hysteresis thresholds on nz (see ServicesCardRing): the front
 *  card writes depth (so the mark's points occlude behind it); side/back
 *  cards must not (a translucent card writing depth would punch a hole in
 *  the depthWrite:false particle pass). ±0.02 hysteresis avoids flicker. */
export const RING_DEPTH_WRITE_ON_NZ = 0.37;
export const RING_DEPTH_WRITE_OFF_NZ = 0.33;

// `clamp01` and `lerp` are imported from `@/lib/math` (Phase-5
// consolidation). `lerp` is re-exported so existing consumers of
// `@/lib/services-ring/ringMath` keep working.
export { lerp };

/** Smootherstep on [edge0, edge1] — C2-continuous (matches the services
 *  entrance easing convention in useServicesStageScroll). Keeps its own
 *  implementation (NOT the `@/lib/math` canonical) because of the
 *  `edge1 <= edge0` degenerate-edge guard. */
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
 * over the 6-beat runway:
 *
 *   beat 0 (lead-in) and beat 1 (service 0's beat): index 0 — the first
 *     card is already front when the section settles;
 *   beat k ≥ 2: index travels (k−2) → (k−1) with smootherstep over the
 *     first RING_TRAVEL_FRAC of the beat, then dwells;
 *   the final beat (k = stepCount−1, the ADR-030 exit hold): the
 *     RING_COUNT−1 cap pins the index on the LAST card for the whole
 *     beat — the ring stands still while the #tools cover rises.
 *
 * Monotonic, continuous, and exactly integral during every dwell — the
 * front card is settled whenever the step clock (floor(p·stepCount)) is
 * mid-beat.
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
 *  mirrors useServicesStageScroll: step = floor(p·stepCount) clamped,
 *  service = step − 1 clamped into [0, RING_COUNT−1]. The upper clamp is
 *  load-bearing since the exit-hold beat (ADR-030): step 5 must keep the
 *  LAST service active, not wrap past the roster. Exported so tests can
 *  pin ring/step agreement. */
export function activeServiceForProgress(
  progress: number,
  stepCount: number = RING_STEP_COUNT
): number {
  const p = clamp01(progress);
  const step = Math.max(0, Math.min(stepCount - 1, Math.floor(p * stepCount)));
  return Math.min(RING_COUNT - 1, Math.max(0, step - 1));
}

/**
 * EXIT CLOCK — 0 before the runway's final (decommission) beat, rising
 * linearly to 1 across it. Pure function of the same runway progress the
 * staircase reads, so every consumer (ring, brandmark recede, orbit dim,
 * DOM pills) derives the identical clock without a new writer, and the
 * whole decommission is reversible by construction.
 */
export function exitProgressForRunway(
  progress: number,
  stepCount: number = RING_STEP_COUNT
): number {
  return clamp01(clamp01(progress) * stepCount - (stepCount - 1));
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

/** One card's orbital track (ADR-029 Update 1). `tiltX ≈ π/2` is the flat
 *  ring plane (a near-horizontal orbit, the waist-ring family); `tiltZ`
 *  is a small roll. `ecc` squashes the ellipse's minor axis. */
export interface CardOrbitGeometry {
  /** Orbit radius (orbit-config units). */
  radius: number;
  /** Rotation about X (rad), ≈ π/2. */
  tiltX: number;
  /** Rotation about Z (rad), small. */
  tiltZ: number;
  /** Minor-axis squash: ry = radius · ecc. */
  ecc: number;
}

/* Deterministic per-card variation tables — fixed signs/factors so no two
 * tracks are parallel and the set is stable across sessions (no runtime
 * randomness; resumability + tests depend on it). */
const ORBIT_RADIUS_STEPS = [-1, -1 / 3, 1 / 3, 1] as const;
const ORBIT_TILT_X_STEPS = [-0.75, 0.55, -0.4, 1.0] as const;
const ORBIT_TILT_Z_STEPS = [0.7, -1.0, -0.5, 0.9] as const;
const ORBIT_ECCS = [0.985, 1.0, 0.965, 0.95] as const;

/** The four card-orbit geometries for a given base/spread/tilt amplitude.
 *  `spread = 0` collapses radii onto the base; `tiltAmp = 0` flattens all
 *  four tracks into the ring plane (the pre-Update-1 carousel). */
export function buildCardOrbitGeometries(
  base: number = RING_ORBIT_BASE_RADIUS,
  spread: number = RING_ORBIT_RADIUS_SPREAD,
  tiltAmp: number = RING_ORBIT_TILT_AMP
): CardOrbitGeometry[] {
  return ORBIT_RADIUS_STEPS.map((step, i) => ({
    radius: base + step * spread,
    tiltX: Math.PI / 2 + ORBIT_TILT_X_STEPS[i] * tiltAmp,
    tiltZ: ORBIT_TILT_Z_STEPS[i] * tiltAmp,
    ecc: ORBIT_ECCS[i],
  }));
}

/** Production card-orbit set (the ringMath defaults). */
export const RING_CARD_ORBIT_GEOMETRY: readonly CardOrbitGeometry[] = buildCardOrbitGeometries();

/**
 * Position + facing for card `index` riding ITS OWN orbital track.
 *
 * The track shares `HologramOrbits`' ellipse parametrization — point(a) =
 * Euler(tilt)·(cos a·r, sin a·r·ecc, 0) — so the drawn line and the card
 * agree exactly. The ring azimuth φ maps onto the parametric angle as
 * **a = π/2 − φ** (at neutral geometry this reduces bit-exactly to
 * `placeCard`). THREE's `'XYZ'` Euler applies Rz FIRST to the vector
 * (R = Rx·Ry·Rz); tiltY is always 0 here so it drops out.
 *
 * `nz` stays PARAMETRIC (`cos φ`), not the physical `z/r`: with tilt/ecc
 * deviations the physical front-z dips below r, which would shave the
 * front card's scale/opacity and make the depth-write gate + beat
 * semantics orbit-dependent. Parametric nz keeps every depth curve and
 * the ring↔step lockstep exactly as the flat ring had them; the tilts
 * live only in the visible position wobble.
 */
export function placeCardOnOrbit(
  index: number,
  rotation: number,
  geom: CardOrbitGeometry,
  options: RingPlacementOptions = {}
): RingCardPlacement {
  const { yOffset = RING_Y_OFFSET, radiusMul = 1 } = options;
  const phi = basePhi(index) + rotation;
  const a = Math.PI / 2 - phi;
  const r = geom.radius * radiusMul;
  const vx = Math.cos(a) * r;
  const vy = Math.sin(a) * r * geom.ecc;
  // Rz(tiltZ) first (z component stays 0)…
  const x1 = vx * Math.cos(geom.tiltZ) - vy * Math.sin(geom.tiltZ);
  const y1 = vx * Math.sin(geom.tiltZ) + vy * Math.cos(geom.tiltZ);
  // …then Rx(tiltX); the z1 = 0 terms vanish.
  return {
    x: x1,
    y: y1 * Math.cos(geom.tiltX) + yOffset,
    z: y1 * Math.sin(geom.tiltX),
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
 *  well before they'd overlap the mark from behind. The `window` shapes
 *  where the ramp lives in nz (Update 1; see RING_OPACITY_WINDOW). */
export function depthOpacity(
  nz: number,
  range: readonly [number, number] = RING_OPACITY_RANGE,
  window: readonly [number, number] = RING_OPACITY_WINDOW
): number {
  return lerp(range[0], range[1], smootherstep(window[0], window[1], nz));
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

/** Staggered DECOMMISSION for card `index` off the exit clock — fade out
 *  while flying out to a slightly wider radius (the entrance, reversed).
 *  EXACT identity ({opacity: 1, radiusMul: 1}) at exit = 0, so every
 *  pre-exit frame is byte-identical with the shipped ring (guardrail:
 *  the decommission must never leak into the reading beats). */
export function exitEnvelope(exit: number, index: number): RingEntrance {
  const window = RING_EXIT_WINDOWS[Math.max(0, Math.min(RING_EXIT_WINDOWS.length - 1, index))];
  const t = smootherstep(window[0], window[1], exit);
  return { opacity: 1 - t, radiusMul: lerp(1, RING_EXIT_RADIUS_TO, t) };
}
