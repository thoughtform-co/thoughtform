import type { Metadata } from "next";

/**
 * /test/proof-dossier-lab — the Loop case as a terminal case file.
 *
 * The problem: the Loop case sits at `#proof`, after `#about` — too late in
 * the funnel to answer the claim the corridor's epilogue just made. It moves
 * to the TOP of `#services`, over the parked brandmark, BEFORE the card ring
 * and masthead arrive. The corridor-exit transition is untouched; what
 * changes is what greets you on the other side of it.
 *
 * The format is a retro-futuristic navigational screen — a dossier, a case
 * file, with a segmented title bar, a meta register, gauge stats, three
 * cascading phase sub-windows (the Arc applied) and a soft-key row. It
 * supersedes the four `/test/proof-highlight-lab` directions, which stay on
 * disk as the historical study; that brief was a highlight INSIDE the proof
 * head, and the head is going away.
 *
 * Under judgement (`?v=`) — one design, four decisions:
 *   a — CASCADE · inactive phases peek as title bars, offset up-right
 *   b — PEEK    · same stack, clip released so content shows behind
 *   c — FLAT    · no stack; soft keys alone swap one panel
 *   d — DENSE   · the cascade at the 72svh height ceiling
 *
 * Other knobs: `?stats=shipped` (activity-first tiles instead of the
 * outcome-first set), `?still=0` (glow bed instead of the captured mark),
 * `?dim=`, `?console=0`.
 *
 * Blocked from production by `middleware.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Proof Dossier Lab — The Loop Case File (Internal)",
  robots: { index: false, follow: false },
};

export default function ProofDossierLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
