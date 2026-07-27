import type { Metadata } from "next";

/**
 * /test/proof-highlight-lab — four directions for the `#proof` highlight zone.
 *
 * The problem: the Loop case's report head (ADR-054) currently fills the space
 * under its masthead with four stat tiles + a meta row. The owner wants ONE
 * condensed highlight instead — a single card or visual carrying the impact of
 * the engagement — and wants the corridor's Arc sphere reused as a
 * Loop-applied subject without re-doing the Arc.
 *
 * Under judgement (`?v=`):
 *   a — FIELD LOG   · dossier card, services-plate family
 *   b — INSTRUMENT  · gauge-cluster card, same family
 *   c — SCHEMATIC   · frameless annotated cutaway
 *   d — ORBIT       · frameless milestone track
 *
 * Two cards (family-adjacent to the services ring, deliberately distinct from
 * it) and two non-card compositions, per the brief.
 *
 * Blocked from production by `middleware.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Proof Highlight Lab — Report Head Directions (Internal)",
  robots: { index: false, follow: false },
};

export default function ProofHighlightLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
