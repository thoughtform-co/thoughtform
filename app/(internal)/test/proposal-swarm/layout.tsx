import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/proposal-swarm: the travelling copy of the X-Bionic proposal
 * (`/test/proposal-travel`), with the stack drawn as S4·E, the swarm of the
 * stack-forms lab, and the travel between its three sections played by the
 * dots themselves.
 *
 * The owner, 2026-10-13, on S4·E: "I want you to create a copy of our latest
 * X-Bionic iteration … where we really use this design language, because
 * this is inspired by our particle system and our arcs. I really like the
 * dots … I just want to see how the entire flow between the sections that
 * travel looks. I think it can feel too static or rigid. This feels a bit
 * more like particles, where one transitions to the other, like nanobots."
 *
 * So the artifact, and everything that moves or connects, is dots: one
 * swarm on one canvas, every dot the same dot from the opening to the last
 * team. What holds words (chips, cards, tabs, the housings) and every word
 * stay the travelling copy's own, by reference.
 *
 * Internal-only: the sent page, its record, the travelling copy and the
 * stack-forms lab are untouched but for `export` keywords.
 */
export const metadata: Metadata = {
  title: "Proposal, the swarm",
  robots: { index: false, follow: false },
};

export default function ProposalSwarmLayout({ children }: { children: ReactNode }) {
  return children;
}
