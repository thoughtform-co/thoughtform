import type { Metadata } from "next";

/**
 * /test/proof-dossier-lab â€” the Loop case as a terminal case file.
 *
 * The problem: the Loop case sits at `#proof`, after `#about` â€” too late in
 * the funnel to answer the claim the corridor's epilogue just made. It moves
 * to the TOP of `#services`, over the parked brandmark, BEFORE the card ring
 * and masthead arrive. The corridor-exit transition is untouched; what
 * changes is what greets you on the other side of it.
 *
 * The format is a retro-futuristic navigational screen â€” a dossier, a case
 * file, with a segmented title bar, a meta register, gauge stats, three
 * cascading phase sub-windows (the Arc applied) and a soft-key row. It
 * supersedes the four `/test/proof-highlight-lab` directions, which stay on
 * disk as the historical study; that brief was a highlight INSIDE the proof
 * head, and the head is going away.
 *
 * Under judgement (`?v=`) â€” one design, four decisions:
 *   a â€” CASCADE Â· inactive phases peek as title bars, offset up-right
 *   b â€” PEEK    Â· same stack, clip released so content shows behind
 *   c â€” FLAT    Â· no stack; soft keys alone swap one panel
 *   d â€” DENSE   Â· the cascade at the 72svh height ceiling
 *
 * Other knobs: `?stats=shipped` (activity-first tiles instead of the
 * outcome-first set), `?still=0` (glow bed instead of the captured mark),
 * `?dim=`, `?console=0`.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Proof Dossier Lab â€” The Loop Case File (Internal)",
  robots: { index: false, follow: false },
};

export default function ProofDossierLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
