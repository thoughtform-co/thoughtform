import type { Metadata } from "next";

/**
 * /test/proposal-kit: the proposal's shape system and three of its sections,
 * each beside production (owner, 2026-10-12: "a new page where we play with
 * different configurations … out of that, build a consistent brand system").
 *
 * Four boards, the control first on each: the system drawn as a specimen,
 * the flow ("AI capability your teams own."), the job card, and the closing
 * run (the four weeks, who takes part, the fee). The ruling the round draws
 * on: rings are instruments, connectors are straight.
 *
 * Internal-only. Nothing here is mounted by a public page.
 */
export const metadata: Metadata = {
  title: "Proposal kit lab",
  robots: { index: false, follow: false },
};

export default function ProposalKitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
