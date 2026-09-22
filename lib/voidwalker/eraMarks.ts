/**
 * The era stage's drawn marks (ADR-082 U35) — the FACTS grid's four and the
 * ON RECORD cards' three, on the particle-icon grammar
 * (`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`).
 *
 * Owner, 2026-09-22: the facts want "icons, make a bit of a grid … uniform",
 * and each press card "on the left side, a thumbnail". He chose a DRAWN mark
 * for the thumbnail over a publisher's photograph or the outlet's logo, so the
 * card's picture says what KIND of coverage it is and the medium line under the
 * headline says which outlet.
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

export type EraMarkKey =
  | "base"
  | "move"
  | "reach"
  | "result"
  | "newspaper"
  | "magazine"
  | "broadcast";

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
  /* NEWSPAPER — a broadsheet: the masthead, a column of lines, a picture. */
  newspaper: {
    sk: [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [0, 3],
      [1, 3],
      [2, 3],
      [0, 5],
      [1, 5],
      [2, 5],
    ],
    sig: [
      [4, 4],
      [5, 4],
    ],
    dr: [[3, 5]],
  },
  /* MAGAZINE — a cover: the masthead band over the cover's framed picture.
     ⚠ Two cuts failed on the contact sheet, both worth keeping in mind: a
     spine, a foot and a masthead open on the right read as a letter C at 14px,
     and a figure under a masthead read as a PERSON — the phone's own figure
     tab turned upside down, on the same station. */
  magazine: {
    sk: [
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [2, 2],
      [3, 2],
      [4, 2],
      [2, 3],
      [4, 3],
      [2, 4],
      [4, 4],
      [2, 5],
      [3, 5],
      [4, 5],
    ],
    sig: [[3, 3]],
    dr: [[6, 0]],
  },
  /* BROADCAST — a screen on its antenna; the signal is the lit screen. */
  broadcast: {
    sk: [
      [2, 2],
      [4, 2],
      [3, 3],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
      [5, 4],
      [1, 5],
      [5, 5],
      [1, 6],
      [2, 6],
      [3, 6],
      [4, 6],
      [5, 6],
    ],
    sig: [[3, 5]],
    dr: [[1, 2]],
  },
};
