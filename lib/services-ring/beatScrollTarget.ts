// Services runway — shared beat-target math (ADR-046 extraction).
//
// `ServicesStage.selectService` (card / plate clicks) and the cartridge
// dock's seated buttons both need "the window scrollY that parks service i
// front-centre". Under the arrival remap (2026-07-17) the runway is: a short
// arrival hold (RING_ARRIVAL_FRAC, Advisory front), the three quarter-turns
// packed across [RING_ARRIVAL_FRAC, RING_EXIT_START], then the exit-hold.
// Service 0 parks mid-arrival; service i (1..3) parks on the dwell of the
// rotation that brings card i front. Extracted so the two click paths can
// never drift from the ring math.

import { RING_ARRIVAL_FRAC, RING_COUNT, RING_EXIT_START, RING_TRAVEL_FRAC } from "./ringMath";

/** Runway progress p at which card `index` is settled front-centre — the
 *  inverse of `activeServiceForProgress`, at the dwell of each rotation. */
function frontProgressForService(index: number): number {
  if (index <= 0) return RING_ARRIVAL_FRAC * 0.5; // Advisory: mid-arrival hold
  const rotations = RING_COUNT - 1; // three quarter-turns
  const seg = Math.min(rotations - 1, index - 1); // rotation that dwells on card `index`
  const dwellCenter = (RING_TRAVEL_FRAC + 1) / 2; // within the rotation's span
  return (
    RING_ARRIVAL_FRAC + ((seg + dwellCenter) / rotations) * (RING_EXIT_START - RING_ARRIVAL_FRAC)
  );
}

/**
 * Absolute window scrollY that parks service `index` front-centre, or `null`
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
  return window.scrollY + rect.top + frontProgressForService(index) * travel;
}
