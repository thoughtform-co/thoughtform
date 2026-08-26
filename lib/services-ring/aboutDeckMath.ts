// About deck-flip — pure math for the services→about card transition
// (ADR-047, supersedes the ADR-046 cartridge dock).
//
// Two clocks, disjoint by page order, both clamped outside their ranges so
// the seam between them is a byte-stable hold:
//
//   1. THE STACK (services exit clock, `exitProgressForRunway` 0→1): each
//      card's azimuth SWEEPS along its own orbit to its nearest-full-turn
//      front (never a Cartesian lerp — card 1 arcs around the mark on its
//      drawn track instead of crossing it), while a radius correction
//      seats the four converged cards on evenly-pitched deck depths (the
//      raw radius·ecc products would interpenetrate cards 1–2). Position,
//      yaw-unwind, depth-opacity lift, and scale-equalize all fall out of
//      `placeCardOnOrbit` as nz → 1.
//   2. THE FLIP (about stage clock, 0→1 across the pinned #about runway):
//      the deck rotates π about its pivot's Y axis AS ONE RIGID SLAB
//      (a left↔right swing — rev 2; the owner's "flip on the x-axis"
//      brief named the travel direction, and the literal Rx read as a
//      top-over-bottom tumble),
//      revealing the portrait back faces, while the pivot glides onto the
//      DOM portrait slot (aboutSlotRef); past the flip window the pivot IS
//      the live slot rect every frame, so the DOM cluster's beat-1
//      translate carries the deck (one motion owner: the DOM).
//
// Kept free of DOM/three so it stays unit-testable
// (tests/lib/about-deck-math.test.ts). Consumed by
// components/landing/home-v2/services/hologram/ServicesCardRing.tsx (deck
// branch), BrandmarkPhysicsCoreActor + CorridorArmillary (the flip-window
// stage-clearing fades), and useAboutStageScroll (the CSS-var mirrors of
// the same beat windows — the `--svc-exit` pattern).

import { clamp01, lerp } from "@/lib/math";

import {
  RING_CARD_ORBIT_GEOMETRY,
  RING_COUNT,
  RING_DIRECTION,
  RING_EXIT_WINDOWS,
  RING_QUARTER,
  RING_SCALE_RANGE,
  basePhi,
  placeCardOnOrbit,
  smootherstep,
} from "./ringMath";

const TAU = Math.PI * 2;

/* ── About-stage beat windows (fractions of the pinned #about runway) ──
 * Single source for the WebGL deck AND the DOM stage's CSS mirrors —
 * beats must never drift apart. Runway = 250svh (2026-07-16 pacing pass
 * set 240svh for the stack/flip; 2026-07-18 added the +10svh EXIT beat so
 * the copy/portrait slide off has room without hurrying the reading hold). */

/** Beat 0 — the deck flips π and glides onto the DOM slot; the orbit
 *  cluster materializes around it; the tracks clear (the receded mark
 *  now only DIMS — it persists through the stage, owner 2026-07-16).
 *  Starts at 0 (owner, same pass: "stacking and flipping should be one
 *  smooth scroll movement") — the #about pin coincides with services
 *  exit = 1 (the -100svh margin weld), so a 0 start makes the flip pick
 *  up in the same wheel motion that finished the stack; the old 0.04
 *  pre-roll read as a second, separate scroll. */
export const ABOUT_FLIP_WINDOW: readonly [number, number] = [0, 0.22];

/** Beat 1 — the DOM cluster (deck welded to its slot) translates right. */
export const ABOUT_SHIFT_WINDOW: readonly [number, number] = [0.32, 0.56];

/** Beat 1, trailing — the left copy column reveals. */
export const ABOUT_COPY_WINDOW: readonly [number, number] = [0.4, 0.66];

/** Runway tail — THE EXIT SLIDE (ADR-047 rev, 2026-07-18, supersedes the
 *  old ABOUT_BG_IN fade-to-shield). The copy column slides LEFT off-screen
 *  and the cluster (WebGL portrait deck welded to its slot) slides RIGHT,
 *  scrubbed on this envelope, so the live corridor bed shows through the
 *  handoff instead of a pair of restoring void panes. Ends at 0.96 (before
 *  the unpin) so the horizontal slide completes while still pinned and the
 *  stage gets a clean-bed breath before #continuum forms. */
export const ABOUT_EXIT_WINDOW: readonly [number, number] = [0.74, 0.96];

/** Runway terminal — a WebGL-only safety fade on the portrait deck's back
 *  material, completing exactly at p = 1 so the deck is provably dead (and
 *  its depth-write released) in the byte-stable hold below the runway. In
 *  practice invisible: at 0.92 the slot has already ridden past the right
 *  frustum edge on ABOUT_EXIT, so this only guarantees the terminal state,
 *  it is not the thing the eye sees leave. */
export const ABOUT_DECK_FADE_WINDOW: readonly [number, number] = [0.92, 1.0];

/** ADR-082 · the character-stage PORTAL exit window.
 *
 *  The exit clock is REPURPOSED when the character stage is on: the
 *  portrait moves to the CENTRE of the frame (not off to the right),
 *  grows on the same envelope, and the reader is transported into the
 *  stage. Same window as the exit slide so the ADR-047 hold is
 *  byte-identical up to 0.74; only the transform target changes.
 *
 *  Consumed by:
 *    - `about-stage.css` — `--about-portal` drives the cluster's
 *      translate to viewport centre (0 → 1) and its scale to fill the
 *      viewport.
 *    - `characterStagePortalRef` — the same 0..1 clock the character
 *      stage's viewport reads on its receiver side, so its cross-fade
 *      from still ↔ 3D lines up with the portrait's arrival.
 */
export const ABOUT_EXIT_PORTAL_WINDOW: readonly [number, number] = [0.74, 0.96];

export function aboutFlipT(aboutP: number): number {
  return smootherstep(ABOUT_FLIP_WINDOW[0], ABOUT_FLIP_WINDOW[1], clamp01(aboutP));
}
export function aboutShiftT(aboutP: number): number {
  return smootherstep(ABOUT_SHIFT_WINDOW[0], ABOUT_SHIFT_WINDOW[1], clamp01(aboutP));
}
export function aboutCopyT(aboutP: number): number {
  return smootherstep(ABOUT_COPY_WINDOW[0], ABOUT_COPY_WINDOW[1], clamp01(aboutP));
}
/** The exit-slide envelope — 0 through the reading hold (p ≤ 0.74), 1 by
 *  0.96. Drives `--about-exit` (copy/cluster translateX) in about-stage.css
 *  and the continuum formation prelude (continuumFormT). */
export function aboutExitT(aboutP: number): number {
  return smootherstep(ABOUT_EXIT_WINDOW[0], ABOUT_EXIT_WINDOW[1], clamp01(aboutP));
}
/** The deck's terminal safety fade (WebGL back material only). */
export function aboutDeckFadeT(aboutP: number): number {
  return smootherstep(ABOUT_DECK_FADE_WINDOW[0], ABOUT_DECK_FADE_WINDOW[1], clamp01(aboutP));
}

/** ADR-082 · the portal exit envelope — the same clock as `aboutExitT`
 *  but repurposed for the character-stage entry: instead of driving a
 *  translate off-screen right, the consumer reads it as the FLIGHT
 *  progress (0 = portrait at rest in its About slot, 1 = portrait
 *  centred and scaled to fill the frame). */
export function aboutExitPortalT(aboutP: number): number {
  return smootherstep(ABOUT_EXIT_PORTAL_WINDOW[0], ABOUT_EXIT_PORTAL_WINDOW[1], clamp01(aboutP));
}

/* ── Deck geometry constants ─────────────────────────────────────────── */

/** Converged z (orbit-config units) of the deck FACE card (index 3 — the
 *  ring parks on the last card, so the card being read becomes the face). */
export const DECK_FRONT_Z = 1.35;

/** Per-slot z pitch. Budget: slab depth 0.045 + content/veil lift overhang
 *  ~0.031 per side + margin — adjacent cards keep ≥ 0.034 orbit-units of
 *  air (≈ 0.021 world at armillary 0.62), far above depth-buffer epsilon:
 *  no z-fighting between stacked translucent slabs. */
export const DECK_Z_PITCH = 0.085;

/** Card-local stack-clock span over which the ring pose flattens (front
 *  bias + hover tilt ease out; cardFacingYaw converges on its own as
 *  φ → 2πk). */
export const DECK_FLATTEN_END = 0.55;

/** Glow dies early in the stack — four converged halos would bloom. */
export const DECK_GLOW_OFF_END = 0.35;

/** EXIT-clock span over which the spring residual is absorbed, so the
 *  exitP = 1 pose is a pure constant (byte-stable across the services →
 *  about hold) regardless of spring state. */
export const DECK_SETTLE_WINDOW: readonly [number, number] = [0.85, 1];

/** Hit-rect / CTA anchors retire once the exit clock passes this — cards
 *  stay OPAQUE through the stack, so the old opacity gate alone would
 *  leave a live CTA riding the sweep (carried from ADR-046). */
export const DECK_ANCHORS_OFF_EXIT = 0.05;

/** Content depthWrite forces OFF past this exit level: the sweep drives
 *  every card's nz → 1, so the plain hysteresis gate would switch all four
 *  stacked writers ON (sorting carnage + holes in the depthWrite:false
 *  particle pass). Carried from ADR-046. */
export const DECK_DEPTH_WRITE_OFF_EXIT = 0.02;

/** Exit level at which explicit per-deck-slot renderOrder takes over from
 *  three's same-order depth sorting. Before this the cards are still
 *  angularly spread (depth sort is correct); at/after it they are converged
 *  near-coplanar slabs where depth sorting would jitter. Card 3's window
 *  ends at 0.9, so the deck is fully assembled exactly here. */
export const DECK_RENDER_REBASE_EXIT = 0.9;

/** Per-deck-slot renderOrder pitch. Intra-card mesh offsets span 0..0.12
 *  (glow excluded — it is dead by the time the rebase engages), so 0.16
 *  keeps every mesh of deck slot k below every mesh of slot k+1, and the
 *  max (3·0.16 + 0.12 = 0.6) stays under the mark's point pass at 1. */
export const DECK_RENDER_PITCH = 0.16;

/** Fallback seat when the DOM slot rect is unmeasurable: viewport centre,
 *  slightly high (where the about cluster centres during the flip beat). */
export const ABOUT_FALLBACK_NDC: readonly [number, number] = [0, 0.02];
export const ABOUT_FALLBACK_SLOT_H_PX = 360;

/** Card scale at deck convergence — depthScale(nz = 1), the ring's own
 *  front-card scale, so the stack→flip seam is scale-continuous. */
export const DECK_CARD_SCALE = RING_SCALE_RANGE[1];

/** The ring rotation the staircase parks on (last card front). */
export const DECK_SETTLED_ROTATION = RING_DIRECTION * (RING_COUNT - 1) * RING_QUARTER;

/* ── Per-card sweep targets ──────────────────────────────────────────── */

/**
 * The azimuth card `index` sweeps TO: its settled exit azimuth rounded to
 * the nearest full turn (where nz = cos φ = 1 exactly and cardFacingYaw is
 * exactly flat). The −1e-9 nudge breaks card 1's exact half-turn tie
 * (settled φ = −π) toward the ring's orbit direction (−2π) — deterministic,
 * computed from the SETTLED pose so the sweep direction can never flip on
 * spring wobble (the ADR-046 dockFlatYaw technique, applied to φ).
 */
export function deckPhiTarget(index: number): number {
  const settledPhi = basePhi(index) + DECK_SETTLED_ROTATION;
  return TAU * Math.round(settledPhi / TAU - 1e-9);
}

/** Full sweep delta for card `index` (target − settled azimuth). */
export function deckPhiDelta(index: number): number {
  return deckPhiTarget(index) - (basePhi(index) + DECK_SETTLED_ROTATION);
}

/* ── Precomputed canonical deck pose (module scope — pure functions of the
 *    ring's orbit constants; yOffset deliberately EXCLUDED so the runtime
 *    can add its own yOffset prop to the pivot). ─────────────────────── */

/** Converged deck depths, rear → front = index order (card 3 = face). */
export const DECK_Z: readonly number[] = Array.from(
  { length: RING_COUNT },
  (_, i) => DECK_FRONT_Z - (RING_COUNT - 1 - i) * DECK_Z_PITCH
);

/** Radius multiplier seating card `i`'s converged z on DECK_Z[i] — the
 *  correction for the orbit ecc/tilt products (raw converged z-gaps dip to
 *  0.033 < one card's z footprint; cards 1–2 would interpenetrate). z is
 *  linear in radiusMul, so the ratio against the radiusMul = 1 placement
 *  is exact. */
export const DECK_RADIUS_MUL: readonly number[] = Array.from({ length: RING_COUNT }, (_, i) => {
  const z1 = placeCardOnOrbit(
    i,
    DECK_SETTLED_ROTATION + deckPhiDelta(i),
    RING_CARD_ORBIT_GEOMETRY[i],
    { yOffset: 0, radiusMul: 1 }
  ).z;
  return DECK_Z[i] / z1;
});

export interface DeckPoint {
  x: number;
  y: number;
  z: number;
}

/** The four converged placements (yOffset 0). */
export const DECK_PLACEMENTS: readonly DeckPoint[] = Array.from({ length: RING_COUNT }, (_, i) => {
  const p = placeCardOnOrbit(
    i,
    DECK_SETTLED_ROTATION + deckPhiDelta(i),
    RING_CARD_ORBIT_GEOMETRY[i],
    { yOffset: 0, radiusMul: DECK_RADIUS_MUL[i] }
  );
  return { x: p.x, y: p.y, z: p.z };
});

/** The rigid deck's pivot — the mean of the converged placements. The
 *  small per-card x/y spread that remains (orbit tilt deviations, ≤ ~8% of
 *  a card width) is the deterministic "hand-stacked deck" jitter. */
export const DECK_PIVOT_LOCAL: DeckPoint = {
  x: DECK_PLACEMENTS.reduce((s, p) => s + p.x, 0) / RING_COUNT,
  y: DECK_PLACEMENTS.reduce((s, p) => s + p.y, 0) / RING_COUNT,
  z: DECK_PLACEMENTS.reduce((s, p) => s + p.z, 0) / RING_COUNT,
};

/** Per-card offsets from the pivot — what the flip rotates. */
export const DECK_OFFSETS: readonly DeckPoint[] = DECK_PLACEMENTS.map((p) => ({
  x: p.x - DECK_PIVOT_LOCAL.x,
  y: p.y - DECK_PIVOT_LOCAL.y,
  z: p.z - DECK_PIVOT_LOCAL.z,
}));

/** The flat yaw each card holds through the deck (cardFacingYaw(2πk) = 2πk
 *  for any blend, so this is blend-independent). */
export const DECK_PHI_TARGETS: readonly number[] = Array.from({ length: RING_COUNT }, (_, i) =>
  deckPhiTarget(i)
);

/* ── Envelopes ───────────────────────────────────────────────────────── */

export interface DeckStack {
  /** The card's own stack clock (0..1 inside its RING_EXIT_WINDOWS slot —
   *  the ADR-030 stagger reads well here too: the right-side card seats
   *  rear first, the front card flattens last while still being read). */
  t: number;
  /** Azimuth sweep progress: settled φ → nearest-full-turn front. */
  phiDelta: number;
  /** Orbit radius multiplier → the deck-depth correction. */
  radiusMul: number;
  /** Front-pose bias + hover-tilt kill (yaw converges via the sweep). */
  flattenT: number;
  /** Behind-card halo multiplier (dies early — stacked halos bloom). */
  glowMul: number;
  /** Spring-residual absorption over DECK_SETTLE_WINDOW of the EXIT clock
   *  (not the card-local clock) — the exitP = 1 pose is pure constants. */
  settle: number;
}

/**
 * Per-card stack envelope off the services exit clock. EXACT identity at
 * exit = 0 ({ t: 0, phiDelta: 0, radiusMul: 1, flattenT: 0, glowMul: 1,
 * settle: 0 }) so every pre-exit frame is byte-identical with the shipped
 * ring — the unit-pinned ADR-030 guardrail carried through ADR-046/047.
 */
export function deckStackEnvelope(exit: number, index: number): DeckStack {
  const window = RING_EXIT_WINDOWS[Math.max(0, Math.min(RING_EXIT_WINDOWS.length - 1, index))];
  const t = smootherstep(window[0], window[1], exit);
  return {
    t,
    // `+ 0` normalizes the −0 that a negative delta × t = 0 produces, so
    // the exit-0 identity is EXACT (Object.is-level) for the unit pin.
    phiDelta: deckPhiDelta(index) * t + 0,
    radiusMul: lerp(1, DECK_RADIUS_MUL[index] ?? 1, t),
    flattenT: smootherstep(0, DECK_FLATTEN_END, t),
    glowMul: 1 - smootherstep(0, DECK_GLOW_OFF_END, t),
    settle: smootherstep(DECK_SETTLE_WINDOW[0], DECK_SETTLE_WINDOW[1], exit),
  };
}

export interface DeckFlip {
  /** Rigid flip angle about the pivot's Y axis: 0 → exactly π. */
  theta: number;
  /** Pivot glide DECK_PIVOT_LOCAL → the DOM slot point (same window — the
   *  flip masks the position correction; 1 = welded to the live slot). */
  posBlend: number;
  /** θ crossed π/2 — the renderOrder side switch (deck is edge-on there,
   *  so the swap is imperceptible). */
  flipped: boolean;
}

/* ── Flip speed ramp (ADR-047 Update 4) ──────────────────────────────
 * The θ channel previously rode `aboutFlipT` (smootherstep), whose peak
 * velocity is 1.875× the window average — over the short flip window the
 * middle read as a whip between near-still ends. The rotation now runs a
 * motion-control S-curve: smoothstep-shaped velocity ramps of FLIP_RAMP_D
 * each side around a CONSTANT-velocity cruise (peak 1/(1 − FLIP_RAMP_D)
 * ≈ 1.39× average) — gentle spin-up, even sweep, gentle settle. C2 at
 * both ends (starts and ends at REST — seam-continuous with the settled
 * stack below and the welded hold above). The smootherstep `aboutFlipT`
 * stays for the OPACITY consumers (orbit cluster, mark/track fades). */
export const FLIP_RAMP_D = 0.28;
const FLIP_RAMP_V = 1 / (1 - FLIP_RAMP_D);
/** ∫₀ᵘ smoothstep = u³ − u⁴/2 (u = position inside a velocity ramp). */
function rampArea(u: number): number {
  return u * u * u - (u * u * u * u) / 2;
}
/** Position along the S-curve for linear window fraction x ∈ [0, 1]. */
export function flipRamp(x: number): number {
  const t = clamp01(x);
  if (t < FLIP_RAMP_D) return FLIP_RAMP_V * FLIP_RAMP_D * rampArea(t / FLIP_RAMP_D);
  if (t > 1 - FLIP_RAMP_D) return 1 - FLIP_RAMP_V * FLIP_RAMP_D * rampArea((1 - t) / FLIP_RAMP_D);
  return FLIP_RAMP_V * (t - FLIP_RAMP_D / 2);
}

/** Linear (un-eased) flip-window fraction — the speed ramp's input. */
export function aboutFlipLinearT(aboutP: number): number {
  const [w0, w1] = ABOUT_FLIP_WINDOW;
  return clamp01((clamp01(aboutP) - w0) / (w1 - w0));
}

/** Exponential-follower rate for the deck's flip clock (the ring's
 *  useFrame damps the ramp t through this before posing the deck).
 *  Wheel ticks land as ~100px scroll steps; θ following raw scroll turns
 *  each into a visible rotation jump at the cruise. ~12/s ≈ 90% converged
 *  in 190ms — rounds the steps without reading as lag. */
export const DECK_FLIP_DAMP_RATE = 12;
/** Hard bound on |target − damped| (the ring-spring cap grammar): an
 *  ultra-fast flick can never drag the rendered pose more than ~63° of
 *  flip behind the scroll truth. */
export const DECK_FLIP_DAMP_CAP = 0.35;
/** Snap epsilon — restores byte-exact endpoints at rest (identity 0 at
 *  the stack seam; welded 1 through the shift/hold). */
export const DECK_FLIP_SNAP_EPS = 1e-3;

/** Deck flip pose from an already-ramped (and possibly damped) t. */
export function deckFlipFromT(t: number): DeckFlip {
  return {
    theta: Math.PI * t,
    posBlend: t,
    flipped: t > 0.5,
  };
}

/** Rigid deck flip off the about stage clock. Identity ({ 0, 0, false })
 *  at aboutP = 0 — seam-continuous with the stack's converged pose. */
export function deckFlip(aboutP: number): DeckFlip {
  return deckFlipFromT(flipRamp(aboutFlipLinearT(aboutP)));
}

/** Draw order of card `index` within the deck (0 = drawn first = visually
 *  rearmost). Pre-flip the face card (3) is nearest the camera; at θ = π
 *  the z-offsets negate and card 0 is nearest — the order reverses. */
export function deckOrder(index: number, flipped: boolean): number {
  return flipped ? RING_COUNT - 1 - index : index;
}
