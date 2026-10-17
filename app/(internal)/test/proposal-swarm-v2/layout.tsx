import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/proposal-swarm-v2: the swarm copy of the X-Bionic proposal with its
 * four job panels replaced by the case dossier, a template that tells each
 * case the way Prompt to Loop did (the chapters in the order the work
 * happened, how the model thought, where a person decided), with the words
 * held on the left and one visual per chapter scrolling past on the right.
 *
 * The owner, 2026-10-17: "What I like about the Loop Earplugs and how we got
 * there is that we have a sticky element on the left and something on the
 * right. I want to repurpose that to show my different cases … I want you to
 * think about building a flexible template that we can use for creative
 * production, creative ops, etc."
 *
 * Internal-only: the swarm, the sent page and their record are untouched.
 */
export const metadata: Metadata = {
  title: "Proposal, the cases",
  robots: { index: false, follow: false },
};

export default function ProposalSwarmV2Layout({ children }: { children: ReactNode }) {
  return children;
}
