/**
 * The proof stack's order — which projects the pile shows, and in what
 * sequence (ADR-094, shared by ADR-096).
 *
 * Content by REFERENCE, order by THE RECORD. The cards read `CASES` — the
 * same record the portfolio arc reads — so a copy edit lands on every
 * surface at once and the confidentiality envelope
 * (`cases-registry.test.ts`) covers both pages for free.
 *
 * ⚠ These are the four Loop PROJECTS (casefile tracks), not the four
 * production TOOLS (`PROJECT_CASES`) — LANGUAGE.md. The tools card's field
 * draws the tools as evidence of one project.
 *
 * Pure and react-free so vitest can pin it (`trinny-proof-order.test.ts`),
 * and it THROWS on a missing id: a card that silently fell out of the stack
 * would be the kind of defect every guard stays green on.
 */

import { getCase } from "@/lib/cases/registry";
import type { CaseTrack } from "@/lib/cases/types";

export const PROOF_STACK_CASE = "loop-earplugs";

/**
 * The stack's sequence — and since ADR-094 U2 it is THE RECORD'S OWN ARC,
 * not a route preference. Each track carries `arc.step`, and this array is
 * those four beats in order:
 *
 *   01 the frontier · 02 self-sufficiency · 03 the tools · 04 the company
 *
 * ⚠ IT IS NOT THE CASEFILE'S DIRECTORY ORDER, and that is deliberate. The
 * frontier work (`atl-films`) is what earned the studio the right to run AI
 * itself, so a stack that opened on the studio was showing the consequence
 * before the cause. A directory is an INDEX; this is a narrative.
 *
 * ⚠ AND THE TWO CAN DISAGREE WITH NOTHING FAILING, which is why
 * `trinny-proof-order.test.ts` asserts this array equals the tracks sorted by
 * `arc.step`: every card's head prints the step from the record while the
 * pile is ordered by this list, so a re-order here alone would letter
 * `03 · 01 · 02` down a scroll and every other guard would stay green.
 */
export const PROOF_STACK_ORDER = ["atl-films", "studio", "tooling", "ai-transformation"] as const;

export function proofStackTracks(): readonly CaseTrack[] {
  const def = getCase(PROOF_STACK_CASE);
  if (!def) throw new Error(`[proof-stack] case "${PROOF_STACK_CASE}" is not in CASES`);
  return PROOF_STACK_ORDER.map((id) => {
    const track = def.casefile.tracks.find((t) => t.id === id);
    if (!track)
      throw new Error(`[proof-stack] track "${id}" is not on the ${PROOF_STACK_CASE} casefile`);
    return track;
  });
}

/**
 * The client the pile shows — its NAME for every card's kicker and its COLOUR
 * for the folder tab (ADR-097). Before this the kicker printed a string
 * literal in JSX, the one place on the surface the record was not read.
 *
 * `accentRgb` is `CaseDef.accent` joined with `", "` — the form the sheet's
 * `rgba(var(--pf-accent-rgb), α)` consumes — or `null`, in which case the
 * host writes nothing and the sheet's own fallback (the house gold) paints.
 */
export type ProofStackClient = { readonly name: string; readonly accentRgb: string | null };

export function proofStackClient(): ProofStackClient {
  const def = getCase(PROOF_STACK_CASE);
  if (!def) throw new Error(`[proof-stack] case "${PROOF_STACK_CASE}" is not in CASES`);
  return { name: def.client, accentRgb: def.accent ? def.accent.rgb.join(", ") : null };
}
