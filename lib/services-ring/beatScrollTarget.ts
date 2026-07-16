// Services runway — shared beat-target math (ADR-046 extraction).
//
// `ServicesStage.selectService` (card / plate clicks) and the cartridge
// dock's seated buttons both need "the window scrollY that parks service i
// front-centre": the middle of service i's beat on the 6-beat pinned runway
// (step 0 is the collapsed lead-in; the final beat is the ADR-030 exit
// hold). Extracted so the two click paths can never drift.

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
  return window.scrollY + rect.top + ((index + 1.5) / RING_STEP_COUNT) * travel;
}
