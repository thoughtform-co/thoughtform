import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/stack-forms: five completely different drawings of the three-plate
 * stack (owner, 2026-10-13: "the design language we use and the textures we
 * use to create it feel like just four blocks to me … It needs to be clear
 * that it's three stacks but I think those three square blocks are okay").
 *
 * A self-contained lab, as the repo rules for new design: its own tokens,
 * its own type, its own drawing, nothing imported from the arcs, the landing
 * or the lattice. The stack itself is plain data (`model/`), restated from
 * the proposal's numbers so a picked direction ports without re-fitting.
 * Brand tones only (his ruling the same day): the five differ in what the
 * plates are made of, not in colour.
 *
 * Internal-only: `/test/*` is a 404 in production.
 */
export const metadata: Metadata = {
  title: "Stack forms",
  robots: { index: false, follow: false },
};

export default function StackFormsLayout({ children }: { children: ReactNode }) {
  return children;
}
