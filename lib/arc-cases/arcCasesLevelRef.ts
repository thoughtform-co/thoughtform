// Cross-root bridge for the Arc Cases Terrace arm level (ADR-034).
//
// The corridor R3F canvas and the DOM overlays are separate render
// trees — per-frame scalars cross that seam through module-level refs,
// not React state (precedent: `servicesRingProgressRef`,
// `brandmarkScanAnchorsRef`).
//
// Single-writer contract: `ArcCasesTerraceScreen`'s useFrame (priority
// −5, before the default-priority painters) writes `level` (the damped
// arm level × the scroll-owned Build-band factor — already gated, so
// readers never re-derive the band). Readers: `FlyingCameraRig` +
// `useWorldDomTracker` (the lateral camera shift — BOTH cameras, same
// channel), `SubstrateTopography` (realm boost), `ArcCasesTerraceCta`
// (stepper visibility). Nobody else writes; the screen resets the ref
// to 0 on unmount.

export interface ArcCasesLevel {
  /** Effective terrace presence 0..1 (arm level × band factor). */
  level: number;
}

export const arcCasesLevelRef: { current: ArcCasesLevel } = {
  current: { level: 0 },
};
