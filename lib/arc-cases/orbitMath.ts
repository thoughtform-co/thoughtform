// Arc Cases Orbit — pure math for the Build-park orbit of the four
// production case cards (ADR-033). The cases ring reuses the services
// ring's geometry/spring family (lib/services-ring/ringMath.ts, imported
// unchanged — its vitest pin stays byte-identical) but is CLICK-owned:
// there is no runway staircase here, only an index → rotation map, a
// damped arm level, one reversible entrance envelope, and the Build-band
// gate that confines the whole instrument to the park.
//
// Kept free of DOM/three so it stays unit-testable
// (tests/lib/arc-cases-orbit.test.ts). Consumed by
// components/landing/home-v2/arc-cases/ArcCasesRing.tsx.

import { RING_DIRECTION, RING_QUARTER, lerp, smootherstep } from "@/lib/services-ring/ringMath";

/** Number of case cards — one per production case, quarter spacing. */
export const ARC_RING_COUNT = 4;

/** Rotation target for a CUMULATIVE case index. The store never wraps the
 *  index (…−1, 0, 1, 2…); the front slot is its mod-4, so stepping by the
 *  shortest signed delta always turns the ring the short way — same
 *  direction convention as the services ring (next card from screen-right). */
export function rotationForCaseIndex(caseIndex: number): number {
  return RING_DIRECTION * caseIndex * RING_QUARTER;
}

/** Front slot (0..3) for a cumulative case index. */
export function caseSlot(caseIndex: number): number {
  return ((caseIndex % ARC_RING_COUNT) + ARC_RING_COUNT) % ARC_RING_COUNT;
}

/** Shortest signed step from one front slot to another: 0, ±1, or +2
 *  (opposite card resolves forward, deterministically). Added to the
 *  cumulative index by `arcCasesStore.stepToCase`. */
export function shortestCaseDelta(fromSlot: number, toSlot: number): number {
  const d = (((toSlot - fromSlot) % ARC_RING_COUNT) + ARC_RING_COUNT) % ARC_RING_COUNT;
  return d === 3 ? -1 : d;
}

/** Exponential damp rate (per second) for the arm level — ≈0.45s to
 *  settle. The ONLY clock the orbit owns: entrance/exit both ride this
 *  level (disarm plays the same envelope backwards), rotation rides the
 *  ring spring, and everything else is scroll-owned band gating. */
export const ARC_ARM_RATE = 2.2;

/** Frame-rate-independent exponential damp toward `target`. */
export function dampLevel(
  current: number,
  target: number,
  dtSeconds: number,
  rate: number = ARC_ARM_RATE
): number {
  const dt = Math.max(0, dtSeconds);
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

/** Per-card entrance windows in ARM-LEVEL units — staggered fly-in as the
 *  level rises 0→1 (the services RING_ENTRANCE_WINDOWS grammar, re-based
 *  onto the arm clock). Reversible by construction: the level falling
 *  plays the exact same envelope out. */
export const ARC_ENTRANCE_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 0.55],
  [0.15, 0.7],
  [0.3, 0.85],
  [0.45, 1.0],
];

/** Cards fly IN from a slightly wider radius while fading in (matches the
 *  services ring's entrance read). */
export const ARC_ENTRANCE_RADIUS_FROM = 1.18;

export interface ArcEnvelope {
  opacity: number;
  radiusMul: number;
}

/** Staggered arm entrance for card `index` from the arm level. EXACT
 *  identity at level = 1 and exact zero at level = 0 (the flag-off /
 *  disarmed frames carry no residue). `radiusFrom` is lab-tunable. */
export function armEnvelope(
  level: number,
  index: number,
  radiusFrom: number = ARC_ENTRANCE_RADIUS_FROM
): ArcEnvelope {
  const window =
    ARC_ENTRANCE_WINDOWS[Math.max(0, Math.min(ARC_ENTRANCE_WINDOWS.length - 1, index))];
  const t = smootherstep(window[0], window[1], level);
  return { opacity: t, radiusMul: lerp(radiusFrom, 1, t) };
}

/** Build-band gate on the corridor paint clock: the orbit exists only once
 *  the intelligence station has resolved (stack accretion runs
 *  [0.875, 0.95]; park ≈ 0.9225), and never before. Rising edge only —
 *  paintProgress ends at 1.0 inside the Build station; the epilogue kill
 *  below owns the far side. */
export const ARC_BAND_IN: readonly [number, number] = [0.845, 0.9];

/** Epilogue kill window: the ring is fully gone across the first tenth of
 *  the epilogue scroll (faster than the caption's BUILD_OUT [0, 0.22], and
 *  long before the corridor-exit dissipate that admits the services ring —
 *  the ADR-033 exclusivity contract). */
export const ARC_EPILOGUE_KILL: readonly [number, number] = [0.0, 0.1];

/** Scroll-owned visibility gate for the whole instrument — the product of
 *  the Build-band rise and the epilogue kill. Multiplied against the arm
 *  level every frame, so scrolling away collapses the orbit even if the
 *  store were somehow still armed (belt-and-suspenders under the
 *  auto-disarm watcher). */
export function arcBandFactor(paintProgress: number, epilogueProgress: number): number {
  const bandIn = smootherstep(ARC_BAND_IN[0], ARC_BAND_IN[1], paintProgress);
  const epilogueKill =
    1 - smootherstep(ARC_EPILOGUE_KILL[0], ARC_EPILOGUE_KILL[1], epilogueProgress);
  return bandIn * epilogueKill;
}

/** How far the stack's SURFACES fan (right side — Cursor / Claude / Web
 *  app / …) sinks while the orbit is armed: the cases replace the promise
 *  of outputs with the outputs themselves. */
export const ARC_SURFACE_DIM = 0.85;

/** How far the SOURCES lanes (left side) sink while armed — present but
 *  recessive; the inputs stay part of the story. */
export const ARC_SOURCE_DIM = 0.35;

/** Ring-plane vertical offset (orbit-config units). POSITIVE — the front
 *  card rides slightly HIGH so it clears the bottom caption card + CTA
 *  chip row (the services ring runs −0.04 low for the opposite reason:
 *  its readout strip sits top-right). Lab-tunable. */
export const ARC_RING_Y_OFFSET = 0.06;

/** Card plane height (orbit-config units) — the services ring's shipped
 *  size; the bake carries less copy than a C3 plate, so this is the
 *  ceiling, not a target. Lab-tunable. */
export const ARC_CARD_HEIGHT = 1.42;
