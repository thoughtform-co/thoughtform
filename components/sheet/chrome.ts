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
/** The same designation on the house's own console (ADR-142), whose group is
 *  Thoughtform's formats and not a client. */
export const HOUSE_DESIG = "// House";

export const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The survey head's designation (ADR-129): `MUS / TITLE · 01` over the title,
 * `MUS / BRIEF · 02` over the paragraph — the services masthead's data readout,
 * lettered here from the split's `survey.code`.
 */
export const surveyDesig = (code: string, slot: 1 | 2) =>
  `${code} / ${slot === 1 ? "TITLE" : "BRIEF"} · ${pad2(slot)}`;

/**
 * The survey's coord stamp — a HASH of the section id, so it is stable across
 * SSR and hydration. ⚠ COPIED from `lib/musings/mastheadData.ts` (itself a copy
 * of `components/arcs/chrome.tsx`): the grammar is copied, never imported, and
 * that module is the landing's. `sheet-split-survey.test.ts` pins this copy
 * against its original, so the page and the station letter the same stamps.
 */
export function coordStamp(seed: string, salt: number): string {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h >>> 12) % 4096;
  const b = h % 4096;
  return `${String(a).padStart(4, "0")} / ${String(b).padStart(4, "0")}`;
}
