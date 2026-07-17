// Services runway — shared beat-target math (ADR-046 extraction).
//
// `ServicesStage.selectService` (card / plate clicks) and the cartridge
// dock's seated buttons both need "the window scrollY that parks service i
// front-centre": the middle of service i's beat on the 5-beat pinned runway.
// Since the lead-in beat was removed (2026-07-17), beat `i` owns service `i`
// directly — service i's beat is [i, i+1)/STEP_COUNT, centred at
// (i + 0.5)/STEP_COUNT (the final beat is the ADR-030 exit hold).
// Extracted so the two click paths can never drift.

import { RING_STEP_COUNT } from "./ringMath";

/**
 * Absolute window scrollY that centres service `index`'s beat, or `null`
 * when the runway is unmeasurable / has no travel (inert layouts — callers
 * fall back to direct state, or no-op for the dock, which only exists on
 * the capable path).
 *
 * @param runway the `.services-stage-root` element; queried when omitted
 *   (the dock lives in a different React root and has no ref to it).
 */
export function servicesBeatScrollTarget(
  index: number,
  runway?: HTMLElement | null
): number | null {
  if (typeof window === "undefined") return null;
  const el = runway ?? document.querySelector<HTMLElement>(".services-stage-root");
  if (!el) return null;
  const vh = window.innerHeight || 1;
  const rect = el.getBoundingClientRect();
  const travel = rect.height - vh;
  if (travel <= 0) return null;
  return window.scrollY + rect.top + ((index + 0.5) / RING_STEP_COUNT) * travel;
}
