// Services Cartridge Dock — pure math for the decommission-beat card →
// cartridge travel (ADR-046). When SERVICES_CARTRIDGE_DOCK is on, the four
// WebGL ring cards no longer fade out radially on the runway's final beat
// (the ADR-030 exit): each card EJECTS off its orbit, flattens to face the
// camera, shrinks, and flies to a bottom-right DOM console where a DOM
// cartridge crossfades in AT THE SEAT (the DOM never flies — ADR-031's
// "never fly anything across the viewport" stands for DOM chrome).
//
// Everything here is a pure function of the SAME exit clock the ring, orbit
// dim, and brandmark recede already consume (`exitProgressForRunway`), with
// per-card staggering reusing RING_EXIT_WINDOWS — one clock, N consumers,
// reversible by construction, and NO new scroll writer.
//
// Kept free of DOM/three so it stays unit-testable
// (tests/lib/services-dock-math.test.ts). Consumed by
// components/landing/home-v2/services/hologram/ServicesCardRing.tsx (the
// WebGL travel) and ServicesCartridgeDock.tsx (the DOM fixture/cartridges).

import { clamp01, lerp } from "@/lib/math";

import {
  RING_COUNT,
  RING_DIRECTION,
  RING_EXIT_WINDOWS,
  RING_FACING_BLEND,
  RING_QUARTER,
  basePhi,
  cardFacingYaw,
  smootherstep,
} from "./ringMath";

/** Exit-clock window over which the DOM console fixture draws on — fully
 *  visible before card 0's window (RING_EXIT_WINDOWS[0] = [0, 0.5]) delivers
 *  the first cartridge at seatable range. */
export const DOCK_FIXTURE_WINDOW: readonly [number, number] = [0, 0.3];

/** Fraction of a card's own travel clock at which the WebGL→DOM crossfade
 *  begins; by t = 1 the WebGL card is gone and the DOM cartridge is solid. */
export const DOCK_SEAT_FRAC = 0.88;

/** Card-local travel-clock span that carries the position lerp — travel
 *  starts just after the eject beat and lands just before the seat swap. */
export const DOCK_TRAVEL_SPAN: readonly [number, number] = [0.1, 0.9];

/** Eject bump: a sin-shaped radial lift off the card's own orbit over the
 *  first quarter of its travel clock (orbit-config units, as a radiusMul
 *  delta) — the cartridge pops OUT of the deck before flying. */
export const DOCK_EJECT_BUMP = 0.08;
export const DOCK_EJECT_END = 0.25;

/** Card-local clock span over which the ring pose flattens to screen-facing
 *  (yaw/pitch/hover ease out) and the face ink dims to the cartridge read. */
export const DOCK_FLATTEN_END = 0.4;

/** Content-plane ink dim at full flatten — the card becomes a dark,
 *  gold-lipped chip while still legible in transit. */
export const DOCK_FACE_DIM = 0.35;

/** Bowed travel path: perpendicular offset amplitude (orbit-config units),
 *  sin-shaped over the position lerp so the card lifts off the straight
 *  line and settles INTO the socket ("ejected, then inserted"). */
export const DOCK_PATH_BEND = 0.12;

/** Fallback seat anchor (NDC) + slot height (CSS px) when the DOM seat
 *  rects are not yet measurable — bottom-right, inside the HUD corner. */
export const DOCK_FALLBACK_NDC: readonly [number, number] = [0.86, -0.82];
export const DOCK_FALLBACK_SLOT_H_PX = 44;

/** WebGL card is force-off depth-write once the exit clock passes this
 *  (an opaque-ish card travelling across the mark must never punch holes
 *  in the depthWrite:false particle pass). */
export const DOCK_DEPTH_WRITE_OFF_EXIT = 0.02;

/** Hit-rect / CTA anchors retire once the exit clock passes this — a live
 *  CTA link must not ride the flight (ADR-029 anchors gate). */
export const DOCK_ANCHORS_OFF_EXIT = 0.05;

/** DOM console fixture draw-on — 0 at exit 0 (byte-identical pre-exit),
 *  1 by the time the first card approaches its seat. */
export function dockFixtureIn(exit: number): number {
  return smootherstep(DOCK_FIXTURE_WINDOW[0], DOCK_FIXTURE_WINDOW[1], clamp01(exit));
}

export interface DockTravel {
  /** The card's own travel clock (0..1 inside its RING_EXIT_WINDOWS slot). */
  t: number;
  /** Position lerp ring-pose → seat (eased, 0..1). */
  positionT: number;
  /** Ring-pose rotation / hover / depth-opacity flatten (0..1). */
  flattenT: number;
  /** Orbit radius multiplier — the sin-shaped eject bump (1 at both ends). */
  radiusMul: number;
  /** Content-ink dim multiplier (1 → DOCK_FACE_DIM as the card flattens). */
  faceDim: number;
  /** Behind-card halo multiplier (dies over the eject beat). */
  glowMul: number;
  /** Bowed-path perpendicular offset (orbit-config units, 0 at both ends). */
  bend: number;
  /** WebGL card opacity multiplier across the seat swap (1 → 0). */
  webglOpacity: number;
  /** DOM cartridge opacity across the seat swap (0 → 1). */
  domOpacity: number;
}

/**
 * Per-card dock travel off the exit clock. EXACT identity at exit = 0
 * ({ t: 0, positionT: 0, flattenT: 0, radiusMul: 1, faceDim: 1, glowMul: 1,
 * bend: 0, webglOpacity: 1, domOpacity: 0 }) so every pre-exit frame is
 * byte-identical with the shipped ring — the ADR-030 guardrail the radial
 * exitEnvelope pins, carried over. All-seated (webglOpacity 0, domOpacity 1)
 * by exit = 0.9 (card 3's window end) — the [0.9, 1] tail shows the receding
 * mark alone with the full rack seated.
 */
export function dockTravelEnvelope(exit: number, index: number): DockTravel {
  const window = RING_EXIT_WINDOWS[Math.max(0, Math.min(RING_EXIT_WINDOWS.length - 1, index))];
  const t = smootherstep(window[0], window[1], exit);
  const positionT = smootherstep(DOCK_TRAVEL_SPAN[0], DOCK_TRAVEL_SPAN[1], t);
  const flattenT = smootherstep(0, DOCK_FLATTEN_END, t);
  const eject = Math.sin(Math.PI * Math.min(1, t / DOCK_EJECT_END));
  const seatT = smootherstep(DOCK_SEAT_FRAC, 1, t);
  return {
    t,
    positionT,
    flattenT,
    radiusMul: 1 + DOCK_EJECT_BUMP * eject,
    faceDim: lerp(1, DOCK_FACE_DIM, flattenT),
    glowMul: 1 - smootherstep(0, DOCK_EJECT_END, t),
    bend: Math.sin(Math.PI * positionT) * DOCK_PATH_BEND,
    webglOpacity: 1 - seatT,
    domOpacity: seatT,
  };
}

/**
 * The yaw each card flattens TOWARD during the dock travel: its settled
 * exit-pose facing yaw (ring parked on the last card) rounded to the nearest
 * full turn, so the card unwinds to screen-flat along the SHORTEST arc that
 * agrees with the ring's own travel direction. The −1e-9 nudge breaks the
 * exact half-turn tie (card 1 sits at −π) toward the ring's orbit direction
 * (−2π) — deterministic, no runtime branch on spring wobble (the settled
 * pose, not the live spring, feeds the round, so the target can never flip
 * mid-flight).
 */
export function dockFlatYaw(index: number, facingBlend: number = RING_FACING_BLEND): number {
  const settledRotation = RING_DIRECTION * (RING_COUNT - 1) * RING_QUARTER;
  const settledYaw = cardFacingYaw(basePhi(index) + settledRotation, facingBlend);
  const TAU = Math.PI * 2;
  return TAU * Math.round(settledYaw / TAU - 1e-9);
}

/** CSS-pixel slot centre → NDC (y up). */
export function seatNdcFromRect(
  cx: number,
  cy: number,
  viewportW: number,
  viewportH: number
): readonly [number, number] {
  if (viewportW <= 0 || viewportH <= 0) return DOCK_FALLBACK_NDC;
  return [(cx / viewportW) * 2 - 1, -((cy / viewportH) * 2 - 1)];
}

/** World-space height that projects to `slotHpx` CSS pixels at camera-space
 *  depth `camDepth` under a perspective camera whose HALF-fov tangent is
 *  `halfFovTan` (= tan(fovRad / 2), precomputed once per frame by the
 *  consumer): the visible frustum height at depth d is 2·d·tan(fov/2), of
 *  which the slot occupies slotHpx / viewportHpx. */
export function seatWorldHeight(
  slotHpx: number,
  viewportHpx: number,
  camDepth: number,
  halfFovTan: number
): number {
  if (viewportHpx <= 0) return 0;
  return (slotHpx / viewportHpx) * 2 * camDepth * halfFovTan;
}
