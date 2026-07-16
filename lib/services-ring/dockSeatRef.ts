// Cross-root bridge for the cartridge-dock seat rects (ADR-046).
//
// The dock DOM (`ServicesCartridgeDock`, mounted at HUD level in the
// LandingPage root) and the corridor R3F canvas are SEPARATE React trees —
// per-frame geometry crosses that seam through a module-level ref, the
// `brandmarkScreenRectRef` / `servicesRingProgressRef` precedent. Zustand
// would add subscriber churn for values read once per WebGL frame.
//
// Single-writer contract: `ServicesCartridgeDock` writes the four bay rects
// on mount / resize / media flips (the dock is position:fixed, so scroll
// never moves them); `ServicesCardRing` reads them inside `useFrame` to
// derive each card's seat target in ring-local space. Nobody else writes.

export interface DockSeatSlot {
  /** Bay centre, CSS px (viewport coords — the canvas is full-viewport). */
  cx: number;
  cy: number;
  /** Bay inner (cartridge) size, CSS px. */
  w: number;
  h: number;
}

export interface DockSeatRects {
  /** One slot per service, ARRAY-INDEX aligned with SERVICES / the ring. */
  slots: DockSeatSlot[];
  /** performance.now() at the last write — readers may treat very stale
   *  rects as invalid after layout-affecting events. */
  stampedAt: number;
  /** True once the writer has measured non-zero rects at least once. */
  valid: boolean;
}

export const dockSeatRectsRef: { current: DockSeatRects } = {
  current: { slots: [], stampedAt: 0, valid: false },
};

export function writeDockSeatRects(slots: DockSeatSlot[], now: number): void {
  const r = dockSeatRectsRef.current;
  r.slots = slots;
  r.stampedAt = now;
  r.valid = slots.length > 0 && slots.every((s) => s.w > 1 && s.h > 1);
}

/** Called when the dock unmounts or its media gate flips off — the ring
 *  falls back to `DOCK_FALLBACK_NDC` rather than flying at stale pixels. */
export function invalidateDockSeatRects(): void {
  dockSeatRectsRef.current.valid = false;
}
