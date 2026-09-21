/**
 * lib/sheet/logGlyphs — the arcs log's block icons: the KIND OF PAGE an
 * engagement is (ADR-118 U2; owner: "there should also be some sort of icon
 * like we have on the red one", the codex list's icon left of every plate).
 *
 * A row's `chip` is the key — proposal, pitch, portfolio, workshop, keynote —
 * which is where U1's unlettered chip went: it was the record's one field the
 * block no longer said, and a mark is how a list says it without a word.
 *
 * Drawn to the particle-icon grammar
 * (`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`)
 * on the proof glyphs' own 7×7 lattice — three layers, the drift not
 * optional:
 *   · `sk`  SKELETON — the form.
 *   · `sig` SIGNAL   — 1–3 pixels where the eye lands.
 *   · `dr`  DRIFT    — 1–2 pixels one axis-step off the skeleton, the
 *                      machine trace, never on another pixel.
 *
 * ⚠ ITS OWN MODULE, NOT FIVE MORE `PROOF_GLYPHS` KEYS. That table is closed
 * over the casefile's register (`proof-glyphs.test.ts` pins its sixteen keys),
 * and a `CaseBlock.glyph` naming a page kind would resolve. The grammar is
 * shared by LIFTING the rules into `tests/lib/helpers/glyphGrammar.ts`; the
 * drawings are not.
 *
 * ⚠ INK, NEVER GOLD. The proof register letters its signal in `--gold`; on
 * the sheet gold is STATE alone (the chosen block, NOW, the CTA), so a gold
 * pixel on every block would be nine marks claiming to be chosen. The signal
 * is the full ink rung, the skeleton one step under it (`SheetGlyph.tsx`).
 *
 * Pure and import-free, so the fit test and the renderer read one table.
 */

/** One pixel: `[col, row]`, both 0–6 on the 7×7 grid. */
export type LogGlyphPixel = readonly [number, number];

export interface LogGlyph {
  sk: readonly LogGlyphPixel[];
  sig: readonly LogGlyphPixel[];
  dr: readonly LogGlyphPixel[];
}

export const LOG_GLYPHS: Record<string, LogGlyph> = {
  /* A PROPOSAL — a sheet with its corner turned, one line of text, the seal
     at its foot. Frame · anchor. */
  proposal: {
    sk: [
      [1, 0],
      [2, 0],
      [4, 0],
      [1, 1],
      [5, 1],
      [2, 3],
      [3, 3],
      [4, 3],
      [1, 5],
      [5, 5],
      [1, 6],
      [2, 6],
      [4, 6],
      [5, 6],
    ],
    sig: [[3, 5]],
    dr: [[4, 2]],
  },
  /* A PITCH — one trajectory, aimed at one target. Trajectory · vertex. */
  pitch: {
    sk: [
      [0, 6],
      [1, 5],
      [2, 4],
      [3, 3],
      [4, 2],
      [5, 1],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 1],
      [6, 2],
      [6, 3],
    ],
    sig: [[6, 0]],
    dr: [[1, 6]],
  },
  /* A PORTFOLIO — four tiles of work, the newest still open. Frame × 4. */
  portfolio: {
    sk: [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
      [4, 1],
      [5, 1],
      [4, 2],
      [5, 2],
      [1, 4],
      [2, 4],
      [1, 5],
      [2, 5],
    ],
    sig: [
      [4, 4],
      [5, 4],
      [4, 5],
    ],
    dr: [[0, 4]],
  },
  /* A WORKSHOP — a table, the seats either side, the one who runs it at its
     head. Axis · vertices. */
  workshop: {
    sk: [
      [1, 1],
      [5, 1],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
      [6, 3],
      [1, 4],
      [5, 4],
      [1, 5],
      [5, 5],
    ],
    sig: [[3, 1]],
    dr: [[0, 2]],
  },
  /* A KEYNOTE — a screen on a stand, the one thing on it lit. Frame · radiate. */
  keynote: {
    sk: [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [1, 2],
      [5, 2],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
      [3, 4],
      [2, 5],
      [4, 5],
    ],
    sig: [[3, 2]],
    dr: [[6, 2]],
  },
};
