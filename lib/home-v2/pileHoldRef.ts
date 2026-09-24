/**
 * The pile HOLD (ADR-123 §Part 1, commit B) — true while the proof pile owns
 * the whole frame on a phone: its runway's top at or above 8 % of the viewport
 * and its bottom at or below 92 %, so nothing of the corridor bed is visible
 * but the gutters.
 *
 * Written by `ProofStack` (two `IntersectionObserver`s, split mode only) and
 * read by the corridor's `FrameInvalidator`, which stops pumping the demand
 * loop while the hold is on — the scene was redrawing every frame under eight
 * sticky sheets that covered it. A separate ref, NOT a field on the depth
 * gateway store: `servicesAmbient` keeps its single writer (ADR-021).
 *
 * Three-free and DOM-free, like `vwTravelRef`. Mirrored as `data-pile-hold`
 * on `<html>` for the diag strip and the smokes.
 */
export const pileHoldRef: { value: boolean } = { value: false };

const listeners = new Set<(on: boolean) => void>();

/** Subscribe to the hold flipping. Returns the unsubscribe. */
export function onPileHold(cb: (on: boolean) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setPileHold(on: boolean): void {
  if (pileHoldRef.value === on) return;
  pileHoldRef.value = on;
  if (typeof document !== "undefined") {
    if (on) document.documentElement.setAttribute("data-pile-hold", "1");
    else document.documentElement.removeAttribute("data-pile-hold");
  }
  for (const cb of listeners) cb(on);
}
