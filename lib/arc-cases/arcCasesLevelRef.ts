// Cross-root bridge for the Arc Cases Card arm level + slab edge geometry
// (ADR-036 — supersedes the ADR-035 DOM-overlay level + panelRect bridge).
//
// This crosses a render-tree seam: the level is written by the in-canvas
// card's R3F `useFrame` (priority −5) and read by consumers on other
// loops — the world-DOM tracker's rAF (the stack labels, `gateStackLabel`),
// the caption card's rAF (`CorridorStationHeaders`), the DOM stepper's rAF,
// and `ShellStack`'s own `useFrame` (priority 0, the node-stream fold). A
// module-level ref is the right transport: React state would churn a
// subscriber once per frame, and this value legitimately crosses the
// DOM↔canvas seam.
//
// Single-writer contract:
//   WRITER — `ArcCasesCard`'s `useFrame` at priority −5 (BEFORE ShellStack
//     reads at 0, so the fold sees THIS frame's level — no two-rAF lag).
//     Each frame it damps the arm level toward `armed ? 1 : 0` and
//     multiplies by the scroll-owned Build-band factor, so `level` is
//     already gated — readers never re-derive the band. It publishes the
//     slab's side-wall edge geometry into `cardEdges` ONCE on layout /
//     aspect change (the card is a rigid child of the same `gyroAssembly`
//     group the streams live in, so the edges are constant in that shared
//     local space — no per-frame measure), and resets `level` to 0 +
//     nulls `cardEdges` on unmount.
//   READERS — `gateStackLabel` (sceneGeom): fades every stack-label element
//     via `arcLabelFade(level)`; `CorridorStationHeaders`: fades the
//     persistent caption card via `1 − level`; `ShellStack` (R3F): folds the
//     source/surface field streams onto `cardEdges`'s left / right side
//     walls by an eased envelope of `arcFoldInput(level)` (the fold PHASE of
//     the master level, ADR-041). The CARD and the DOM stepper instead read
//     the phased `cardPresence` (their opacity / visibility / inert), so the
//     card never leads the fold. The edges are the SINGLE
//     source of truth for the mount geometry, in SHELL-LOCAL coords shared
//     with the streams — so the fold is direct local-space math (no
//     viewport unprojection, no live-camera re-solve; both retired with the
//     DOM overlay).
//
// Multi-loop ordering caveat: the DOM readers (world-DOM tracker rAF,
// caption rAF, stepper rAF) run on loops independent of the R3F writer, so
// they may observe a value up to ONE frame stale — at most ~16ms on the
// ~0.45s arm envelope, imperceptible. The ShellStack fold reads on the R3F
// loop AFTER the writer's −5 pass, so it is always current.

/** Slab side-wall edge geometry in SHELL-LOCAL coords (the space the
 *  source/surface stream groups live in, inside `gyroAssembly`). `null`
 *  until the card publishes it (or when the card is unmounted). */
export interface ArcCasesCardEdges {
  /** Left slab side-wall X (negative) — source streams latch here. */
  leftX: number;
  /** Right slab side-wall X (positive) — surface streams latch here. */
  rightX: number;
  /** Card centre Y — attach points span `[centerY − halfHeight, centerY + halfHeight]`. */
  centerY: number;
  /** Card content half-height. */
  halfHeight: number;
  /** Card face Z — the depth the streams reach forward to on the side wall. */
  z: number;
}

export interface ArcCasesLevel {
  /** Effective MASTER arm level 0..1 (damped arm level × band factor). The
   *  fold + label-fade + caption-fade inputs; the card DOES NOT read this
   *  directly (see `cardPresence`). */
  level: number;
  /** Card-materialize presence 0..1 (ADR-041): `arcCardPresence(level)` —
   *  the phased sub-window of `level` across which the card slab emerges,
   *  0 until the node fold has landed. Published by the SAME writer so no
   *  reader recomputes the phase. The card's own material opacities /
   *  visibility / depth-write and the stepper's opacity+inert read THIS. */
  cardPresence: number;
  /** The card's slab edge geometry, or `null` when unpublished / unmounted.
   *  Constant while mounted (rigid in the shared local space), kept
   *  populated while draining so the fold unwinds from the same edges it
   *  latched onto. */
  cardEdges: ArcCasesCardEdges | null;
}

export const arcCasesLevelRef: { current: ArcCasesLevel } = {
  current: { level: 0, cardPresence: 0, cardEdges: null },
};
