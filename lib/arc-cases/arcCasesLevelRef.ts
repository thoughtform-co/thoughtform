// Cross-root bridge for the Arc Cases Terminal arm level (ADR-035 —
// supersedes the ADR-034 terrace channel).
//
// This is now a DOM-ONLY channel. There is no R3F reader: the reveal is
// a fixed DOM overlay, not an in-canvas slab, so no camera or terrain
// consumes this ref. It still crosses a render-tree seam — the level is
// written by the overlay's own rAF and read by the world-DOM tracker's
// separate rAF (the stack labels) — so a module-level ref is still the
// right transport (React state would churn a subscriber once per frame).
//
// Single-writer contract:
//   WRITER — `ArcCasesTerminal`'s DOM rAF. Each frame it damps the arm
//     level toward `armed ? 1 : 0` and multiplies by the scroll-owned
//     Build-band factor, so `level` is already gated — readers never
//     re-derive the band. It resets `level` to 0 on unmount.
//   READERS — `gateStackLabel` (sceneGeom): fades every stack-label
//     element via `arcLabelFade(level)`; `CorridorStationHeaders`: fades
//     the persistent caption card via `1 − level`.
//
// Two-rAF ordering caveat: the writer (overlay rAF) and one reader (the
// world-DOM tracker's rAF) run on independent frame loops, so a reader
// may observe a value up to ONE frame stale. On the ~0.45s arm envelope
// that is at most ~16ms of lag on a slow ramp — imperceptible.

export interface ArcCasesLevel {
  /** Effective terminal presence 0..1 (damped arm level × band factor). */
  level: number;
}

export const arcCasesLevelRef: { current: ArcCasesLevel } = {
  current: { level: 0 },
};
