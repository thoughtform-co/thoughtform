// Cross-root bridge for the Arc Cases Terminal arm level + panel rect
// (ADR-035 — supersedes the ADR-034 terrace channel).
//
// This crosses a render-tree seam: the level (and, since Update 1, the
// panel's screen rect) is written by the overlay's own DOM rAF and read
// by TWO separate consumers on independent loops — the world-DOM
// tracker's rAF (the stack labels) and, NEW in Update 1, ShellStack's
// R3F `useFrame` (the node-stream latch). A module-level ref is the
// right transport for both: React state would churn a subscriber once
// per frame, and this value legitimately crosses the DOM↔canvas seam.
//
// Single-writer contract:
//   WRITER — `ArcCasesTerminal`'s DOM rAF. Each frame it damps the arm
//     level toward `armed ? 1 : 0` and multiplies by the scroll-owned
//     Build-band factor, so `level` is already gated — readers never
//     re-derive the band. It measures the panel's `getBoundingClientRect`
//     on arm + on resize (NOT per frame; the panel is `position: fixed`
//     and CSS-sized) into `panelRect`, keeps the last rect while draining
//     (close must unfold from the same spot it latched onto), and resets
//     `level` to 0 + nulls `panelRect` on unmount.
//   READERS — `gateStackLabel` (sceneGeom): fades every stack-label
//     element via `arcLabelFade(level)`; `CorridorStationHeaders`: fades
//     the persistent caption card via `1 − level`; `ShellStack` (R3F):
//     folds the source/surface field streams onto `panelRect`'s left /
//     right borders by an eased envelope of `level` (Update 1). The
//     rect is the SINGLE source of truth for the mount geometry — the
//     canvas never hard-codes the panel's CSS size.
//
// Multi-loop ordering caveat: the writer (overlay rAF) and the readers
// (the world-DOM tracker rAF + the R3F frame loop) run on independent
// loops, so a reader may observe a value up to ONE frame stale. On the
// ~0.45s arm envelope that is at most ~16ms of lag on a slow ramp —
// imperceptible, and the latch re-solves against the live camera every
// frame regardless.

/** Panel screen rect in CSS px (viewport coords), as returned by
 *  `getBoundingClientRect`. `null` until the overlay measures it (or
 *  when the overlay is unmounted). */
export interface ArcCasesPanelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArcCasesLevel {
  /** Effective terminal presence 0..1 (damped arm level × band factor). */
  level: number;
  /** The panel's last-measured screen rect, or `null` when unmeasured /
   *  unmounted. Kept populated while draining so the fold unwinds from
   *  the spot it latched onto. */
  panelRect: ArcCasesPanelRect | null;
}

export const arcCasesLevelRef: { current: ArcCasesLevel } = {
  current: { level: 0, panelRect: null },
};
