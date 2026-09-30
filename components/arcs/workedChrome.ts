/**
 * workedChrome — the switched chapter's own words (ADR-139).
 *
 * ⚠ CHROME IS A CONSTANT, NEVER AUTHORED — `bench/benchChrome.ts`'s law, and
 * for its reason: the control's name is the renderer's, so it cannot say one
 * thing on the archetype and another on a fork, and a test can walk it. What
 * the CONTENT owns is the examples' own labels; what this owns is the
 * sentence around them.
 */
export const WORKED_CHROME = {
  /** Read before the choices, by a screen reader and on the bar. */
  label: "One piece of work",
} as const;
