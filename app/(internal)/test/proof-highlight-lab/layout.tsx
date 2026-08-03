import type { Metadata } from "next";

/**
 * /test/proof-highlight-lab â€” four directions for the `#proof` highlight zone.
 *
 * The problem: the Loop case's report head (ADR-054) currently fills the space
 * under its masthead with four stat tiles + a meta row. The owner wants ONE
 * condensed highlight instead â€” a single card or visual carrying the impact of
 * the engagement â€” and wants the corridor's Arc sphere reused as a
 * Loop-applied subject without re-doing the Arc.
 *
 * Under judgement (`?v=`):
 *   a â€” FIELD LOG   Â· dossier card, services-plate family
 *   b â€” INSTRUMENT  Â· gauge-cluster card, same family
 *   c â€” SCHEMATIC   Â· frameless annotated cutaway
 *   d â€” ORBIT       Â· frameless milestone track
 *
 * Two cards (family-adjacent to the services ring, deliberately distinct from
 * it) and two non-card compositions, per the brief.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Proof Highlight Lab â€” Report Head Directions (Internal)",
  robots: { index: false, follow: false },
};

export default function ProofHighlightLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
