// Cross-root bridge for the about portrait slot rect (ADR-047) — the DOM
// element the flipped WebGL deck lands on and stays welded to.
//
// Single-writer contract: `useAboutStageScroll` measures
// `.about-stage__slot` (getBoundingClientRect — includes the cluster's
// live CSS translate) every rAF while the stage is engaged and writes it
// here; `ServicesCardRing` reads it inside `useFrame` to derive the deck
// pivot's seat, viewport-first, every frame. One-frame-max staleness
// between the window rAF and the R3F loop is the accepted
// `brandmarkScreenRectRef` precedent. Nobody else writes.

export interface AboutSlotRect {
  /** Slot centre, CSS px (viewport coords — the canvas is full-viewport). */
  cx: number;
  cy: number;
  /** Slot size, CSS px. */
  w: number;
  h: number;
}

export interface AboutSlot {
  rect: AboutSlotRect;
  /** performance.now() at the last write. */
  stampedAt: number;
  /** True once the writer has measured a non-zero rect; invalidated on
   *  disengage/unmount so the deck falls back to its NDC anchor rather
   *  than flying at stale pixels. */
  valid: boolean;
}

export const aboutSlotRef: { current: AboutSlot } = {
  current: { rect: { cx: 0, cy: 0, w: 0, h: 0 }, stampedAt: 0, valid: false },
};

export function writeAboutSlotRect(
  cx: number,
  cy: number,
  w: number,
  h: number,
  now: number
): void {
  const slot = aboutSlotRef.current;
  slot.rect.cx = cx;
  slot.rect.cy = cy;
  slot.rect.w = w;
  slot.rect.h = h;
  slot.stampedAt = now;
  slot.valid = w > 1 && h > 1;
}

export function invalidateAboutSlot(): void {
  aboutSlotRef.current.valid = false;
}
