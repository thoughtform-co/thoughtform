/**
 * lib/api/numbers — what a request body's number IS before a route spends on it.
 *
 * Zero imports. Every reader returns the number or `null`, never a default:
 * the route chooses the default when the field is ABSENT and answers 400 when
 * it is PRESENT and wrong — and it decides both BEFORE any paid call or any
 * delete (the segments route billed Replicate and then emptied its own slice
 * on a `NaN`; the crop route let a `NaN` through a `< 1` guard into `sharp`).
 *
 * ⚠ `"50"` IS NOT 50 HERE. A body that sends strings for numbers is a caller
 * bug this surface would otherwise hide behind a coercion, and `Math.max("50"
 * * 4, "50")` is the kind of arithmetic that happens to work until it does not.
 */

/** A real number: finite, and a `number` — never `NaN`, a string or a boolean. */
export function finiteNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** A real number inside `[min, max]`. */
export function numberIn(v: unknown, min: number, max: number): number | null {
  const n = finiteNumber(v);
  return n !== null && n >= min && n <= max ? n : null;
}

/** An integer inside `[min, max]`. */
export function intIn(v: unknown, min: number, max: number): number | null {
  const n = numberIn(v, min, max);
  return n !== null && Number.isInteger(n) ? n : null;
}
