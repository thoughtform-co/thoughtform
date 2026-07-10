// Cross-root bridge for the services runway progress (ADR-029).
//
// The services DOM tree (nested `ServicesPortal` React root) and the corridor
// R3F canvas are SEPARATE React roots — per-scroll-frame scalars cross that
// seam through module-level refs, not React state (precedent:
// `brandmarkScanAnchorsRef`). Zustand would add subscriber churn for a value
// read once per WebGL frame.
//
// Single-writer contract: `useServicesStageScroll` (the services runway's
// only scroll watcher) writes `progress`; `ServicesCardRing` reads it inside
// `useFrame`. Nobody else writes.

export interface ServicesRingProgress {
  /** Runway progress 0..1 across the 500svh services stage (0 while inert). */
  progress: number;
}

export const servicesRingProgressRef: { current: ServicesRingProgress } = {
  current: { progress: 0 },
};
