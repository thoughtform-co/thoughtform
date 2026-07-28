import { LOOP_EARPLUGS_CASE } from "./content/loop-earplugs";
import type { CaseBeat, CaseDef } from "./types";

/**
 * The case registry — single source of truth for which client cases
 * exist and in what order (ADR-054). Today one case renders as the
 * landing's `#proof` station; the registry is what a future
 * `/cases/[slug]` route would enumerate.
 */
export const CASES: readonly CaseDef[] = [LOOP_EARPLUGS_CASE];

export function caseSlugs(): string[] {
  return CASES.map((c) => c.slug);
}

export function getCase(slug: string): CaseDef | undefined {
  return CASES.find((c) => c.slug === slug);
}

/** The case rendered as the landing `#proof` station. */
export const PROOF_CASE: CaseDef = LOOP_EARPLUGS_CASE;

/**
 * Beat rows for a case — id, ordinal and phase name in one place, so
 * anything that lists a case's beats and the station that renders them
 * agree. (It fed the retired section menu's PROOF subsections; since
 * ADR-055 dropped subsections its remaining consumer is the registry
 * test, which keeps it honest as a data guard.)
 */
export function caseBeatMenu(def: CaseDef): { id: string; num: string; name: string }[] {
  return def.beats.map((beat: CaseBeat, i) => ({
    id: beat.id,
    num: String(i + 1).padStart(2, "0"),
    name: beat.phase.toUpperCase(),
  }));
}
