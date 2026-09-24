/**
 * The era stage's FACTS marks (ADR-082 U35) — four, on the particle-icon
 * grammar (`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`).
 *
 * Owner, 2026-09-22: the facts want "icons, make a bit of a grid … uniform".
 * ⚠ THE ON RECORD THUMBNAILS LEFT THIS TABLE IN ADR-082 U43 (owner,
 * 2026-09-24: the magazine "looks like a trash bin … something a bit more
 * elegant"). They are hairline drawings now — `recordMarks.ts`, a 21-unit
 * grid — because seven cells could not tell a magazine from a can in four
 * cuts. This table is the facts' alone.
 *
 * The grammar, as this file holds it:
 *   · a 7×7 lattice at integer cells (`[col, row]`, 0–6), square pixels, no
 *     curves;
 *   · three layers — the SKELETON (the form), ONE to three SIGNAL pixels (the
 *     one thing the mark points at), one or two DRIFT pixels, each displaced
 *     exactly one cell along ONE axis from a skeleton pixel and never on the
 *     form;
 *   · at most 16 skeleton + signal pixels.
 * `tests/lib/era-marks.test.ts` holds every clause, and that no two marks
 * share a pixel set.
 *
 * ⚠ DAWN ONLY — the SIGNAL is the brightest dawn, never gold. Gold on this
 * station is the era band's "you are here" (ADR-082 U26), and a gold pixel on
 * every fact would be five "you are here"s at once.
 * ⚠ NO ARROW. `PressArrow` (↗) already MEANS "this record opens somewhere" one
 * row down, so MOVE is a stepped route, not a pointer — a silhouette on this
 * station is a proper noun (U33's ruling on the cartridge, one scale down).
 * ⚠ NO CORNER TICKS. The media card's still cue is four corner brackets, so
 * RESULT is a flag planted, not a frame closed on its centre.
 *
 * Zero-import, like the registry beside it.
 */

export type EraMarkPixel = readonly [col: number, row: number];

export interface EraMark {
  /** The form. */
  readonly sk: readonly EraMarkPixel[];
  /** One to three pixels: what the mark points at. */
  readonly sig: readonly EraMarkPixel[];
  /** One or two pixels, a cell off the form: the motion in a still mark. */
  readonly dr: readonly EraMarkPixel[];
}

export type EraMarkKey = "base" | "move" | "reach" | "result";

export const ERA_MARKS: Readonly<Record<EraMarkKey, EraMark>> = {
  /* BASE — where it happened. A pin standing on its ground; the signal is the
     point on the ground it marks. */
  base: {
    sk: [
      [3, 0],
      [2, 1],
      [4, 1],
      [2, 2],
      [4, 2],
      [3, 3],
      [3, 4],
      [3, 5],
      [1, 6],
      [2, 6],
      [4, 6],
      [5, 6],
    ],
    sig: [[3, 6]],
    dr: [[5, 1]],
  },
  /* MOVE — what he did. A route that climbs in steps to where it arrives;
     the signal is the arrival, the drift a particle left behind at the start. */
  move: {
    sk: [
      [0, 6],
      [1, 6],
      [2, 6],
      [2, 5],
      [2, 4],
      [3, 4],
      [4, 4],
      [4, 3],
      [4, 2],
      [5, 2],
    ],
    sig: [[6, 2]],
    dr: [[0, 5]],
  },
  /* REACH — how far it went. Rays out of one centre; the signal is the source. */
  reach: {
    sk: [
      [3, 0],
      [3, 1],
      [3, 5],
      [3, 6],
      [0, 3],
      [1, 3],
      [5, 3],
      [6, 3],
      [1, 1],
      [5, 1],
      [1, 5],
      [5, 5],
    ],
    sig: [[3, 3]],
    dr: [[6, 4]],
  },
  /* RESULT — what came of it. A flag planted; the signal is the finial. */
  result: {
    sk: [
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [1, 6],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [2, 2],
      [3, 2],
      [4, 2],
      [2, 3],
    ],
    sig: [[1, 0]],
    dr: [[6, 1]],
  },
};
