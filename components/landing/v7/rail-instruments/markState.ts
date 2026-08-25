/**
 * A mark, and its state against a clock.
 *
 * ⚠ IT LIVES ALONE SO AN ARC PAGE NEED NOT LOAD THE LANDING'S MANIFEST
 * (ADR-059 U6). `clusters.ts` resolves every roster id against
 * `MANIFEST_ENTRIES` and `READOUT_SECTIONS` **at module evaluation**, and
 * throws loudly on a miss — which is right for the landing and absurd for
 * `/arcs/portfolio`, where it would mean renaming a landing station
 * white-screens a client's page. The arcs build their roster from their own
 * menu; they share this type and this function and nothing else.
 *
 * Nothing here may import react, three, or anything under `app/`.
 */

export interface JourneyMark {
  /** Stable key, the `data-mark` hook, and — unless `glyph` overrides it —
   *  the `SECTION_GLYPHS` lookup. */
  id: string;
  /** Printed by the live mark, and by every mark in the lab's explain mode. */
  name: string;
  /** Which index resolves this mark's state. See `clusters.ts`'s two-clocks
   *  note; an arc roster uses `row` throughout, against its own menu. */
  clock: "beat" | "row";
  /** Into `MANIFEST_ENTRIES` when `beat`, into `READOUT_SECTIONS` when `row`
   *  — or, on an arc, into that arc's own menu. */
  idx: number;
  /**
   * Inclusive END of a RANGE — a mark that stands for several seats.
   *
   * On the landing only `arc` uses it, and it is what stops the Arc
   * double-lighting with Thesis. On an arc every CHAPTER uses it: the four
   * tool dossiers sit under "Tools", so a chapter is `here` for all of them.
   */
  idxEnd?: number;
  /** A rule opens a new group before this mark. */
  ruleBefore?: boolean;
  /**
   * `SECTION_GLYPHS` key, when it is not the mark's own id.
   *
   * ⚠ Landing marks never set it — their id IS the key, so the landing's
   * render is byte-identical. An arc's ids are its own section ids
   * (`overview`, `studio-films`, `tool-index`…), which that record is not
   * keyed by and should not grow entries for: it would need one per arc per
   * id, and the arcs' glyphs are decorative by owner ruling.
   */
  glyph?: string;
}

export type MarkState = "ahead" | "passed" | "here";

/**
 * A mark's state against its clock.
 *
 * A mark may stand for a RANGE (`idxEnd`), so `here` is containment rather
 * than equality and `passed` is measured from the range's END. With no
 * `idxEnd` the range is one seat wide and this is the plain three-way compare
 * it replaced.
 *
 * Kept out of the component that calls it so the "exactly ONE mark is gold at
 * every position" invariant can be pinned without a DOM — see
 * `tests/lib/rail-instrument-marks.test.ts` for the landing's roster and
 * `tests/lib/arc-marks.test.ts` for every arc's.
 */
export function markState(mark: JourneyMark, activeIdx: number, seat: number): MarkState {
  const active = mark.clock === "beat" ? activeIdx : seat;
  const end = mark.idxEnd ?? mark.idx;
  if (active >= mark.idx && active <= end) return "here";
  return active > end ? "passed" : "ahead";
}
