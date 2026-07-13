// Cross-root bridge for the Arc Cases Orbit arm level (ADR-033).
//
// The corridor R3F canvas and the DOM overlays (station headers / stack
// label chips) are separate render trees — per-frame scalars cross that
// seam through module-level refs, not React state (precedent:
// `servicesRingProgressRef`, `brandmarkScanAnchorsRef`).
//
// Single-writer contract: `ArcCasesRing`'s useFrame writes `level` (the
// damped arm level × the scroll-owned Build-band factor — already gated,
// so readers never re-derive the band). Readers: `ShellStack` and
// `gateStackLabel` (armed dim), `CorridorStationHeaders` (caption dim),
// `ArcCasesCta` (armed styling). Nobody else writes.

export interface ArcCasesLevel {
  /** Effective orbit presence 0..1 (arm level × band factor). */
  level: number;
}

export const arcCasesLevelRef: { current: ArcCasesLevel } = {
  current: { level: 0 },
};
