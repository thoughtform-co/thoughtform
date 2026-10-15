/**
 * The timeline's TRUE NUMBERS (ADR-156 U3), one module, the anatomy method:
 * every height and slope on the drawing is derived from a figure on the
 * record, never typed as a picture.
 *
 * · The floor runs January 2023 to December 2026, the span the talk tells.
 * · A milestone's HEIGHT is how far along the capability curve it sits: METR
 *   finds the length of task an agent finishes doubles about every SEVEN
 *   MONTHS (the curve's own source, `shared/frontierCurve.ts`). On a log
 *   scale that is a straight climb, so height is the date counted in
 *   doublings.
 * · The gold RAIL is what drives it: Epoch AI finds frontier training compute
 *   grows 4 to 5 times a year (`epoch.ai/blog/training-compute-of-frontier-
 *   ai-models-grows-by-4-to-5x-per-year`), read here at 4.5×, also counted in
 *   doublings. The two climb on the same scale, which is the bitter lesson
 *   drawn: the lanes rise because the rail does.
 *
 * ⚠ PURE, no imports. The tests read these constants, never the drawing.
 */

export const START_YEAR = 2023;
/** Months on the floor, January 2023 to December 2026. */
export const SPAN_MONTHS = 48;

/** METR: task length doubles every seven months. */
export const CAPABILITY_DOUBLING_MONTHS = 7;
/** Epoch AI: frontier training compute ×4.5 a year (their 4 to 5). */
export const COMPUTE_PER_YEAR = 4.5;
/** The same growth as a doubling time, in months. */
export const COMPUTE_DOUBLING_MONTHS = 12 / Math.log2(COMPUTE_PER_YEAR);

/** A year with no month on the record sits mid-year. */
const YEAR_ONLY_MONTH = 6;

/** `YYYY-MM` or `YYYY` to months since January 2023. */
export function monthsOf(date: string): number {
  const [y, m] = date.split("-").map(Number);
  const month = Number.isFinite(m) ? m : YEAR_ONLY_MONTH;
  return (y - START_YEAR) * 12 + (month - 1);
}

/** Doublings of capability by a date. */
export const capabilityDoublings = (months: number) => months / CAPABILITY_DOUBLING_MONTHS;
/** Doublings of compute by a date. */
export const computeDoublings = (months: number) => months / COMPUTE_DOUBLING_MONTHS;
