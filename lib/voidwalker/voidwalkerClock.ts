/**
 * The VOIDWALKER section's scroll clock — PURE (ADR-074). `useVoidwalkerScroll`
 * measures and writes; every number it writes comes from here, so the
 * envelope is unit-pinned without a DOM (`tests/lib/voidwalker-clock.test.ts`
 * — the `aboutDeckMath` precedent).
 *
 * One READING LINE rides 40 % down the viewport. A beat's clock is 0 while
 * its spine marker is a window below the line and 1 as the marker crosses
 * it; the spine's drawn segment is the same line measured against the
 * whole spine, so the gold tip reaches a marker exactly as that beat lights.
 * Reversible by construction: every value is a function of the current
 * scroll position and the measured layout, never of a previous frame.
 */

/** Where the reading line sits, as a fraction of the viewport height. The
 *  zerodrift reference lights a beat a little above mid-screen; 0.40 keeps
 *  the lit beat in the top half where the eye is already reading. */
export const VW_READ_LINE = 0.4;

/** A beat's arrival window, as a fraction of the viewport height — the
 *  scroll distance over which it goes from dark to lit. */
export const VW_BEAT_WINDOW = 0.26;

/** The masthead decode arms when this fraction of the viewport has passed
 *  the head's top (the head is well inside the screen). */
export const VW_HEAD_ARM = 0.72;

/** Hysteresis around the arm line, in px — the decode does not churn when
 *  the reader rests on the threshold. */
export const VW_HEAD_HYSTERESIS_PX = 24;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** The reading line's page-Y for a scroll position. */
export function readLineY(scrollY: number, vh: number): number {
  return scrollY + vh * VW_READ_LINE;
}

/** The drawn fraction of the spine: 0 at its top, 1 at its bottom. */
export function spineProgress(lineY: number, spineTop: number, spineHeight: number): number {
  if (spineHeight <= 0) return 0;
  return clamp01((lineY - spineTop) / spineHeight);
}

/** One beat's clock: 0 while its marker is ≥ `window` below the reading
 *  line, 1 once the marker has crossed it. Monotone in the scroll. */
export function beatProgress(lineY: number, markerY: number, windowPx: number): number {
  if (windowPx <= 0) return lineY >= markerY ? 1 : 0;
  return clamp01((lineY - markerY + windowPx) / windowPx);
}

/** How many markers the reading line has passed — the `data-vw-beat` count. */
export function beatsPassed(lineY: number, markerYs: readonly number[]): number {
  let n = 0;
  for (const y of markerYs) if (y <= lineY) n++;
  return n;
}

/**
 * The masthead's arm state with hysteresis: arms once the arm line is
 * `VW_HEAD_HYSTERESIS_PX` past the head's top, disarms once it is that far
 * above it, and holds the previous state in between.
 */
export function headArmed(prev: boolean, scrollY: number, vh: number, headTop: number): boolean {
  const armLine = scrollY + vh * VW_HEAD_ARM;
  if (armLine >= headTop + VW_HEAD_HYSTERESIS_PX) return true;
  if (armLine < headTop - VW_HEAD_HYSTERESIS_PX) return false;
  return prev;
}
