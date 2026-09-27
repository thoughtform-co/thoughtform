/**
 * curveLayout — the geometry of THE CURVE (ADR-130).
 *
 * METR's finding, drawn in the program board's register (ADR-078 U1: a curve
 * as a step ladder, rising left to right, never interpolated): the length of
 * task an agent finishes half the time doubles about every seven months. One
 * tread is one doubling and one riser is seven months on a dated axis, so the
 * ladder's pitch IS the finding. The Moira workshop drew a smooth curve with
 * lanes and prices on it (`loop-moira/lib/intelligence/curve.ts`); those are
 * Loop's, and this beat is the argument alone.
 *
 * ⚠ A PICTURE OF THE FINDING, NOT A MEASUREMENT PER MODEL — the beat's `note`
 * says so. The treads are relabelled at every second step (minutes, a
 * quarter, an hour, half a day: two doublings apart each, ×4).
 *
 * ⚠ PURE, and every point absolute (no `transform` anywhere).
 */

export const CURVE_VB = { w: 1000, h: 380 } as const;

/** The dated axis. */
export const AXIS_Y = 330;
export const X0 = 140;
export const X1 = 960;
/** The top of the graticule. */
export const GRID_TOP = 40;

/** One year, in units; a month is a twelfth of it. */
export const YEAR = 205;
export const MONTH = YEAR / 12;
/** The riser's pitch: one doubling every seven months. */
export const RISE_MONTHS = 7;

/** Seven treads, one per doubling, from the floor to the top. */
export const TREADS = 7;
export const TREAD_FLOOR = 310;
export const TREAD_TOP = 60;

/**
 * Where "now" sits, in months after the first year mark: the last week of
 * September in the fourth year. ⚠ A page date, not a clock — the figure is
 * static and the workshop is dated in its copy.
 */
export const NOW_MONTHS = 44.9;

export const yearX = (i: number) => X0 + i * YEAR;
export const treadY = (i: number) => TREAD_FLOOR - (i * (TREAD_FLOOR - TREAD_TOP)) / (TREADS - 1);
export const NOW_X = X0 + NOW_MONTHS * MONTH;

/** The ladder: a tread, then a riser every seven months, then flat to now. */
export function ladderPath(): string {
  let d = `M${X0} ${treadY(0)}`;
  for (let k = 1; k < TREADS; k += 1) {
    const x = X0 + k * RISE_MONTHS * MONTH;
    d += ` H${x.toFixed(1)} V${treadY(k).toFixed(1)}`;
  }
  return `${d} H${NOW_X.toFixed(1)}`;
}

/** The four lettered treads: one, three, five and seven, bottom up. */
export const LETTERED_TREADS = [0, 2, 4, 6] as const;

/** A point as fractions of the crop. */
export function curveFraction(x: number, y: number): { ax: number; at: number } {
  return { ax: x / CURVE_VB.w, at: y / CURVE_VB.h };
}

/** Every point the drawing uses, for the fit test's containment walk. */
export function curveExtent(): readonly { x: number; y: number }[] {
  return [
    { x: X0, y: GRID_TOP },
    { x: X1, y: AXIS_Y },
    { x: NOW_X, y: treadY(TREADS - 1) },
    { x: yearX(3), y: GRID_TOP },
  ];
}
