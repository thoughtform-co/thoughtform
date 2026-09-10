/**
 * The proof stack's order — which Loop projects the Trinny London page shows
 * as cards, and in what sequence (ADR-094).
 *
 * Content by REFERENCE, order by ROUTE. The cards read `CASES` — the same
 * record the homepage casefile and the portfolio arc read — so a copy edit
 * lands on every surface at once and the confidentiality envelope
 * (`cases-registry.test.ts`) covers this page for free. What the route
 * owns is only the sequence: creative first, the tools around it, then the
 * company-wide layer — marketing was the proving ground because process,
 * stakeholders and non-binary quality converge there, and the method then
 * transfers (the owner's own argument for a skincare reader).
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

export const TRINNY_PROOF_CASE = "loop-earplugs";

/**
 * The stack's sequence — and since ADR-094 U2 it is THE RECORD'S OWN ARC,
 * not a route preference. Each track carries `arc.step`, and this array is
 * those four beats in order:
 *
 *   01 the frontier · 02 self-sufficiency · 03 the tools · 04 the company
 *
 * ⚠ IT REVERSES THE FIRST TWO CARDS against what shipped. The frontier work
 * (`atl-films`) is what earned the studio the right to run AI itself, so a
 * stack that opened on the studio was showing the consequence before the
 * cause. The casefile's directory order is untouched — a directory is an
 * index, this is a narrative.
 *
 * ⚠ AND THE TWO CAN DISAGREE WITH NOTHING FAILING, which is why
 * `trinny-proof-order.test.ts` asserts this array equals the tracks sorted by
 * `arc.step`: the head prints the step from the record while the pile is
 * ordered by this list, so a re-order here alone would letter `03 · 01 · 02`
 * down a scroll and every other guard would stay green.
 */
export const TRINNY_PROOF_ORDER = ["atl-films", "studio", "tooling", "ai-transformation"] as const;

export function trinnyProofTracks(): readonly CaseTrack[] {
  const def = getCase(TRINNY_PROOF_CASE);
  if (!def) throw new Error(`[trinny] case "${TRINNY_PROOF_CASE}" is not in CASES`);
  return TRINNY_PROOF_ORDER.map((id) => {
    const track = def.casefile.tracks.find((t) => t.id === id);
    if (!track)
      throw new Error(`[trinny] track "${id}" is not on the ${TRINNY_PROOF_CASE} casefile`);
    return track;
  });
}
