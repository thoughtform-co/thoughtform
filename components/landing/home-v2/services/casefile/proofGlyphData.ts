/**
 * proofGlyphData — the pixel drawings behind the proof register's claims.
 *
 * A `CaseBlock.glyph` is a KEY; this is what it resolves to. The content
 * module (`lib/cases/**`) keeps its zero-import contract and stores only the
 * string, because a drawing is component-layer data — the same split
 * `CaseVisual["tool-strip"]` already uses for `PROJECT_CASES` ids.
 *
 * Drawn to the particle-icon grammar
 * (`.claude/skills/thoughtform-design/references/particle-icon-grammar.md`),
 * on a 7×7 grid rather than the nav icons' free coordinate space — a proof
 * tile's mark is small, fixed and printed sixteen times on one surface, so it
 * has to be authored on a lattice a reader's eye can resolve.
 *
 * THREE LAYERS, and the drift is not optional:
 *   · `sk`  SKELETON — the concept's form, alpha 0.85–1.0.
 *   · `sig` SIGNAL   — 1–3 accent pixels at a vertex, centre or tip, alpha 1.
 *   · `dr`  DRIFT    — 1–2 pixels displaced exactly ONE grid unit along ONE
 *                      axis from a skeleton pixel, alpha 0.4–0.55. The
 *                      machine trace; it never lands on an existing pixel.
 *
 * Every drawing composes the grammar's six primitives — axis, vertices,
 * frame, trajectory, anchor, radiate — and each entry's comment names the
 * ones it uses. Sharp geometry only: no curve approximations, ever.
 *
 * ⚠ THE ANTI-PATTERNS ARE MECHANIZED, not reviewed by eye
 * (`tests/lib/proof-glyphs.test.ts`): bounds, the ≤16 skeleton+signal
 * restraint ceiling, the signal and drift counts, the one-axis displacement
 * rule, non-overlap, and a distinguishability floor that fails if two claims
 * would print the same mark. A drawing that reads badly is a design problem;
 * a drawing that breaks the grammar is a test failure.
 *
 * Pure and import-free on purpose, exactly like `skillSymbol.ts` beside it:
 * the registry test imports it to check the content module's keys resolve,
 * and a lookup table should not drag a renderer into the test graph.
 */

/** One pixel: `[col, row]`, both 0–6 on the 7×7 grid. */
export type GlyphPixel = readonly [number, number];

export interface ProofGlyph {
  /** Skeleton — the readable form. */
  sk: readonly GlyphPixel[];
  /** Signal — where the eye lands. */
  sig: readonly GlyphPixel[];
  /** Drift — the machine trace. */
  dr: readonly GlyphPixel[];
}

export const PROOF_GLYPHS: Record<string, ProofGlyph> = {
  /* ── 04_SOFTWARE-FOR-FEW ──────────────────────────────────────────── */

  /* gap — two frame brackets held apart, one anchor seated between them */
  gap: {
    sk: [
      [0, 1],
      [1, 1],
      [0, 2],
      [0, 4],
      [0, 5],
      [1, 5],
      [6, 1],
      [5, 1],
      [6, 2],
      [6, 4],
      [6, 5],
      [5, 5],
    ],
    sig: [[3, 3]],
    dr: [[1, 2]],
  },

  /* collapse — four inbound course lines onto one anchor */
  collapse: {
    sk: [
      [3, 0],
      [3, 1],
      [0, 3],
      [1, 3],
      [6, 3],
      [5, 3],
      [3, 6],
      [3, 5],
    ],
    sig: [[3, 3]],
    dr: [[2, 1]],
  },

  /* ownership — an open vessel holding the anchor (frame + anchor).
     Redrawn 2026-08-07: the first cut was four corner brackets around a
     centre — a sibling of `gap` two rows up in the SAME register, which
     is the ADR-059 failure mode (marks told apart only by their labels).
     The vessel is open at the top: held by the team, not caged. */
  ownership: {
    sk: [
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
      [5, 4],
      [5, 3],
      [5, 2],
    ],
    sig: [[3, 3]],
    dr: [[5, 1]],
  },

  /* substrate — one anchor radiating four axes out to four terminals */
  substrate: {
    sk: [
      [2, 2],
      [1, 1],
      [0, 0],
      [4, 2],
      [5, 1],
      [6, 0],
      [2, 4],
      [1, 5],
      [0, 6],
      [4, 4],
      [5, 5],
      [6, 6],
    ],
    sig: [[3, 3]],
    dr: [[2, 1]],
  },

  /* ── 01_INTELLIGENCE-MAP ──────────────────────────────────────────── */

  /* board — a frame's four corner brackets over a grid of anchors */
  board: {
    sk: [
      [0, 0],
      [1, 0],
      [0, 1],
      [6, 0],
      [5, 0],
      [6, 1],
      [0, 6],
      [0, 5],
      [1, 6],
      [6, 6],
      [5, 6],
      [6, 5],
      [4, 2],
      [2, 4],
      [4, 4],
    ],
    sig: [[2, 2]],
    dr: [[3, 2]],
  },

  /* encode — an axis running into a dense terminal cluster, tipped signal */
  encode: {
    sk: [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 2],
      [5, 2],
      [6, 2],
      [4, 3],
      [5, 3],
      [4, 4],
      [5, 4],
      [6, 4],
    ],
    sig: [[6, 3]],
    dr: [[3, 4]],
  },

  /* reuse — a stepped trajectory turning back to touch an earlier column */
  reuse: {
    sk: [
      [0, 5],
      [1, 5],
      [1, 4],
      [2, 4],
      [2, 3],
      [3, 3],
      [3, 2],
      [4, 2],
      [4, 1],
      [3, 1],
      [2, 1],
    ],
    sig: [[1, 1]],
    dr: [[0, 4]],
  },

  /* envelope — a frame with an interior axis that stops short of the wall */
  envelope: {
    sk: [
      [0, 1],
      [1, 1],
      [0, 2],
      [6, 1],
      [5, 1],
      [6, 2],
      [0, 5],
      [1, 5],
      [0, 4],
      [6, 5],
      [5, 5],
      [6, 4],
      [2, 3],
      [3, 3],
    ],
    sig: [[4, 3]],
    dr: [[1, 3]],
  },

  /* ── 02_AI-FLUENCY-STUDIO ─────────────────────────────────────────── */

  /* field — a near-saturated scatter of anchors, one of them signalled */
  field: {
    sk: [
      [0, 0],
      [2, 0],
      [5, 0],
      [1, 1],
      [3, 1],
      [6, 1],
      [0, 2],
      [4, 2],
      [2, 3],
      [5, 3],
      [1, 4],
      [6, 4],
      [3, 5],
      [0, 6],
      [4, 6],
    ],
    sig: [[3, 3]],
    dr: [[6, 5]],
  },

  /* threshold — a horizontal axis with a trajectory crossing above it */
  threshold: {
    sk: [
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
      [5, 4],
      [6, 4],
      [1, 6],
      [2, 5],
      [4, 3],
      [5, 2],
    ],
    sig: [[6, 1]],
    dr: [[0, 5]],
  },

  /* cadence — three chevron axis marks in sequence, the leading tip signalled */
  cadence: {
    sk: [
      [0, 2],
      [1, 3],
      [0, 4],
      [2, 2],
      [3, 3],
      [2, 4],
      [4, 2],
      [4, 4],
    ],
    sig: [[5, 3]],
    dr: [[1, 2]],
  },

  /* holdfast — a ring of vertices closed around a centre anchor */
  holdfast: {
    sk: [
      [3, 1],
      [5, 3],
      [3, 5],
      [1, 3],
      [1, 1],
      [5, 1],
      [1, 5],
      [5, 5],
    ],
    sig: [[3, 3]],
    dr: [[4, 5]],
  },

  /* ── 03_AI-ABOVE-THE-LINE ─────────────────────────────────────────── */

  /* masters — two frames side by side, each signalled on its inner corner */
  masters: {
    sk: [
      [0, 2],
      [1, 2],
      [0, 3],
      [2, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [5, 2],
      [6, 2],
      [4, 3],
      [6, 3],
      [4, 4],
      [5, 4],
      [6, 4],
    ],
    sig: [
      [2, 2],
      [4, 2],
    ],
    dr: [[3, 3]],
  },

  /* level — one long axis with a short plumb axis and its anchor */
  level: {
    sk: [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [5, 3],
      [6, 3],
      [3, 4],
      [3, 5],
    ],
    sig: [[3, 6]],
    dr: [[2, 4]],
  },

  /* broadcast — three axes radiating from one signalled corner anchor */
  broadcast: {
    sk: [
      [0, 5],
      [0, 4],
      [0, 3],
      [0, 2],
      [1, 5],
      [2, 4],
      [3, 3],
      [4, 2],
      [1, 6],
      [2, 6],
      [3, 6],
      [4, 6],
    ],
    sig: [[0, 6]],
    dr: [[1, 4]],
  },

  /* parallel — two parallel axes, only one of them carrying the signal */
  parallel: {
    sk: [
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ],
    sig: [[5, 4]],
    dr: [[0, 4]],
  },
};
