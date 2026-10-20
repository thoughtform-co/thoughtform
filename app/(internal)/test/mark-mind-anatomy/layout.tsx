import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The mark is the mind, reverse-engineered: a brief-first lab (CLAUDE.md "New
 * design starts from the brief") that rebuilds the machine-mind still from the
 * round-six reference with the anatomy kit, the mark built as the object's
 * plan. Imports nothing from the arcs, the landing or the lattice; reads only
 * the brand mark's paths from `lib/brandmark`.
 *
 * Brief: ~/.claude/plans/pasted-content-id-7b25-using-this-wobbly-russell.md.
 * Rounds: docs/design/mark-mind-anatomy/rN/.
 */
export const metadata: Metadata = {
  title: "The mark is the mind · anatomy",
  robots: { index: false, follow: false },
};

export default function MarkMindAnatomyLayout({ children }: { children: ReactNode }) {
  return children;
}
