import type { ProofGlyph } from "@/components/landing/home-v2/services/casefile/proofGlyphData";

/**
 * circuitGlyphData — the six questions' marks (ADR-133), one per chip's well.
 *
 * Drawn to the particle-icon grammar on the proof register's own 7×7
 * lattice (`proofGlyphData`, ADR-068): SKELETON (the form), SIGNAL (one to
 * three gold pixels where the eye lands) and DRIFT (one or two pixels
 * displaced exactly one unit along one axis — the machine trace). ≤ 16
 * skeleton + signal pixels, sharp geometry only.
 *
 * ⚠ PURE AND IMPORT-FREE BUT FOR A TYPE, so the fit test can walk the
 * grammar without a renderer in its graph. `tests/lib/arc-circuit-fit.test.ts`
 * mechanises the same anti-patterns the proof glyphs' own test does, and a
 * distinguishability floor: two questions may not print the same mark.
 */

export type CircuitGlyphKey = "context" | "owner" | "evals" | "model" | "reach" | "interface";

export const CIRCUIT_GLYPHS: Record<CircuitGlyphKey, ProofGlyph> = {
  /* context — what it knows: three ruled lines of a written page, the
     middle one ending on the signal (the line being read). frame + axis. */
  context: {
    sk: [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 3],
      [1, 5],
      [2, 5],
      [3, 5],
    ],
    sig: [[5, 3]],
    dr: [[3, 6]],
  },
  /* owner — who answers for it: the house pictogram of a person, a head
     block over a shoulder block, the head lit. The only human on the
     drawing, and the only green object around it. anchor + frame. (A bust
     with its arms out read as a game sprite at 3 units a pixel.) */
  owner: {
    sk: [
      [2, 2],
      [3, 2],
      [4, 2],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
      [5, 4],
      [1, 5],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 5],
    ],
    sig: [
      [2, 1],
      [3, 1],
      [4, 1],
    ],
    dr: [[5, 6]],
  },
  /* evals — how we know it is good: a check, the vertex as the signal. The
     tick is what a checker leaves. trajectory + vertex. */
  evals: {
    sk: [
      [0, 3],
      [1, 4],
      [3, 4],
      [4, 3],
      [5, 2],
      [6, 1],
    ],
    sig: [[2, 5]],
    dr: [[5, 1]],
  },
  /* model — what runs it: a die with two pins, the core lit. frame +
     anchor. */
  model: {
    sk: [
      [2, 2],
      [3, 2],
      [4, 2],
      [2, 3],
      [4, 3],
      [2, 4],
      [3, 4],
      [4, 4],
      [1, 3],
      [5, 3],
    ],
    sig: [[3, 3]],
    dr: [[3, 1]],
  },
  /* reach — what it can reach: a run leaving its corner, the tip lit.
     trajectory + radiate. */
  reach: {
    sk: [
      [1, 5],
      [2, 4],
      [3, 3],
      [4, 2],
      [3, 1],
      [4, 1],
      [5, 2],
      [5, 3],
    ],
    sig: [[5, 1]],
    dr: [[1, 6]],
  },
  /* interface — where you meet it: a window open at its foot, the meeting
     point lit inside it. frame + anchor. */
  interface: {
    sk: [
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [1, 2],
      [5, 2],
      [1, 3],
      [5, 3],
      [1, 4],
      [5, 4],
      [1, 5],
      [2, 5],
      [4, 5],
      [5, 5],
    ],
    sig: [[3, 3]],
    dr: [[2, 6]],
  },
};

/** The person mark the crew's seats print once per person (ADR-133): the
 *  owner's bust without its drift, because a head count is a record and a
 *  machine trace on it would read as a half person. */
export const PERSON_MARK: ProofGlyph = {
  sk: CIRCUIT_GLYPHS.owner.sk,
  sig: CIRCUIT_GLYPHS.owner.sig,
  dr: [],
};
