// Cross-root bridge for the pinned #continuum stage's runway progress
// (ADR-049).
//
// The continuum stage DOM (nested `ContinuumStagePortal` React root) and
// the corridor R3F canvas are SEPARATE React trees — per-scroll-frame
// scalars cross that seam through module-level refs, not React state
// (precedent: `servicesRingProgressRef`, `aboutStageProgressRef`).
//
// Single-writer contract: `useContinuumStageScroll` (the continuum
// runway's only scroll watcher) writes both fields; `BrandmarkPhysicsCore-
// Actor` (the mark lift/recede release), `CorridorArmillary` (the waist
// re-brighten getter), and `ContinuumWaistRail` (the thumb + tick opacity
// gate) read them inside `useFrame`. Nobody else writes.
//
// `progress` clamps to 0 while the stage is above the viewport and to 1
// below it (clamp01 of the rect read), so the WebGL consumers' envelopes
// hold byte-stable outside the runway — no latch, no release guard (the
// ADR-046 lesson).

export interface ContinuumStageProgress {
  /** Runway progress 0..1 across the pinned #continuum stage (0 while the
   *  stage is inert / disengaged / above the viewport). */
  progress: number;
  /** ENTRY progress 0..1 as the runway's top travels viewport-bottom →
   *  viewport-top (the pin). Bridges the inter-runway gap where the about
   *  clock has clamped to 1 and `progress` still clamps at 0, so the
   *  continuum formation (continuumFormT) can keep moving through the
   *  whole About → Continuum handoff instead of plateauing (ADR-049
   *  Update 5). 0 while the runway is a full viewport away or the stage
   *  is disengaged; 1 from the pin on (clamped — byte-stable below). */
  entry: number;
  /** True only while the capable-path stage is engaged (media gate +
   *  no corridor fallback + flag). */
  engaged: boolean;
}

export const continuumStageProgressRef: { current: ContinuumStageProgress } = {
  current: { progress: 0, entry: 0, engaged: false },
};
