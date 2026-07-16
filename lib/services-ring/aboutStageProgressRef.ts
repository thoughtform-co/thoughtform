// Cross-root bridge for the pinned #about stage's runway progress
// (ADR-047).
//
// The about stage DOM (nested `AboutStagePortal` React root) and the
// corridor R3F canvas are SEPARATE React trees — per-scroll-frame scalars
// cross that seam through module-level refs, not React state (precedent:
// `servicesRingProgressRef`).
//
// Single-writer contract: `useAboutStageScroll` (the about runway's only
// scroll watcher) writes both fields; `ServicesCardRing` (the deck flip),
// `BrandmarkPhysicsCoreActor` + `CorridorArmillary` (the flip-window
// stage-clearing fades) read them inside `useFrame`. Nobody else writes.
//
// `progress` clamps to 0 while the stage is above the viewport and to 1
// below it (clamp01 of the rect read), so the WebGL consumers' envelopes
// hold byte-stable outside the runway — no latch, no release guard (the
// ADR-046 lesson).

export interface AboutStageProgress {
  /** Runway progress 0..1 across the pinned #about stage (0 while the
   *  stage is inert / disengaged / above the viewport). */
  progress: number;
  /** True only while the capable-path stage is engaged (media gate +
   *  no corridor fallback + flag). */
  engaged: boolean;
}

export const aboutStageProgressRef: { current: AboutStageProgress } = {
  current: { progress: 0, engaged: false },
};
