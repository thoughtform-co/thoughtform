// Arc Cases — pure math for the click-owned cases reveal at the Build
// park. One damped arm level (the feature's only clock) plays the reveal
// in and out; the Build-band gate confines it to the park; slot stepping
// walks the four cases. `dampLevel` / `arcBandFactor` carry over verbatim
// from the retired orbitMath — the band + epilogue-kill contract is
// unchanged.
//
// EXCLUSIVITY CONTRACT: the epilogue kill [0, 0.1] drives the reveal to
// zero across the first tenth of the epilogue scroll, long before the
// corridor-exit dissipate that admits the services ring (which needs
// epilogueProgress ≥ 0.72). The two are provably disjoint — pinned by
// tests/lib/arc-cases-math.test.ts (ARC_EPILOGUE_KILL[1] < 0.72). Never
// weaken either clock so their windows overlap.
//
// Kept free of DOM/three so it stays unit-testable. Consumed by
// lib/stores/arcCasesStore.ts.

import { lerp, smootherstep } from "@/lib/services-ring/ringMath";

/** Number of production cases — one reveal, four faces. */
export const CASE_COUNT = 4;

/** Wrapping prev/next step: slot 3 → 0 forward, 0 → 3 back. The
 *  cumulative-index + shortest-delta machinery died with the physical
 *  ring — a crossfading reveal has no rotation to take "the short way". */
export function stepSlot(slot: number, dir: 1 | -1): number {
  return (((slot + dir) % CASE_COUNT) + CASE_COUNT) % CASE_COUNT;
}

/** Exponential damp rate (per second) for the arm level — ≈0.45s to
 *  settle. The ONLY clock the reveal owns (disarm plays it backwards);
 *  everything else is scroll-owned band gating. */
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

/* ── Scroll gate (verbatim from the retired orbitMath — the contract
   pinned by the vitest exclusivity test) ─────────────────────────── */

/** Build-band gate on the corridor paint clock: the reveal exists only
 *  once the intelligence station has resolved (stack accretion runs
 *  [0.875, 0.95]; park ≈ 0.9225), and never before. Rising edge only —
 *  paintProgress ends at 1.0 inside the Build station; the epilogue kill
 *  below owns the far side. */
export const ARC_BAND_IN: readonly [number, number] = [0.845, 0.9];

/** Epilogue kill window: the reveal is fully gone across the first tenth
 *  of the epilogue scroll (faster than the caption's BUILD_OUT [0, 0.22],
 *  and long before the corridor-exit dissipate that admits the services
 *  ring — the exclusivity contract, carried over unchanged). */
export const ARC_EPILOGUE_KILL: readonly [number, number] = [0.0, 0.1];

/** Scroll-owned visibility gate for the whole instrument — the product of
 *  the Build-band rise and the epilogue kill. Multiplied against the arm
 *  level every frame, so scrolling away collapses the reveal even if the
 *  store were somehow still armed (belt-and-suspenders under the
 *  auto-disarm watcher). */
export function arcBandFactor(paintProgress: number, epilogueProgress: number): number {
  const bandIn = smootherstep(ARC_BAND_IN[0], ARC_BAND_IN[1], paintProgress);
  const epilogueKill =
    1 - smootherstep(ARC_EPILOGUE_KILL[0], ARC_EPILOGUE_KILL[1], epilogueProgress);
  return bandIn * epilogueKill;
}
