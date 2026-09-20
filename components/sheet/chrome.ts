import type { SheetTitle } from "@/lib/sheet/types";

/**
 * The sheet's chrome strings (ADR-114) — lettered by renderers, never
 * authored in a record. A test that reads a title reads it through
 * `sheetTitleText`, so the em run counts as part of the name.
 */

export function sheetTitleText(t: SheetTitle): string {
  return [t.pre, t.em, t.post]
    .filter((s): s is string => Boolean(s))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The figure frame's caption bar: `[ FIG. 01 ]` (stripe.dev's own). */
export const figLabel = (n: number) => `[ FIG. ${String(n).padStart(2, "0")} ]`;

/** The console's right-hand designation — a slash-slash kicker, the house's
 *  Bearing Label variant confirmed live on Astrolabe. */
export const CLIENT_DESIG = "// Client";

export const pad2 = (n: number) => String(n).padStart(2, "0");
