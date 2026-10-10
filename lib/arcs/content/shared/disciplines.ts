import type { ArcJobBucket, ArcLeverageUse } from "../../types";

/**
 * THE FOUR DISCIPLINES, ONE RECORD (the proposal system, 2026-10-10). The
 * vision's 2×2, the job's mark and the engine's workstream tiles are one
 * vocabulary drawn three times (ADR-153 U1 §2, ADR-154 U4); until now each
 * reader spelled and ordered it on its own. The order is the owner's:
 * creative production, creative ops, creative review, creative strategy.
 *
 * `word` is the short form the instrument's tiles letter under their cap;
 * `long` is the owner's name for the discipline on the 2×2 and the job's
 * mark. The glyphs are the leverage's own data glyphs.
 */
export interface Discipline {
  id: ArcJobBucket;
  /** ≤ 12. */
  word: string;
  /** ≤ 20. */
  long: string;
  glyph: ArcLeverageUse["glyph"];
}

export const DISCIPLINES: readonly Discipline[] = [
  { id: "production", word: "Production", long: "Creative production", glyph: "frame" },
  { id: "ops", word: "Ops", long: "Creative ops", glyph: "flow" },
  { id: "review", word: "Review", long: "Creative review", glyph: "check" },
  { id: "strategy", word: "Strategy", long: "Creative strategy", glyph: "brief" },
];

export const DISCIPLINE_ORDER: readonly ArcJobBucket[] = DISCIPLINES.map((d) => d.id);

export function disciplineOf(id: ArcJobBucket): Discipline {
  const hit = DISCIPLINES.find((d) => d.id === id);
  if (!hit) throw new Error(`disciplines: no discipline "${id}"`);
  return hit;
}
