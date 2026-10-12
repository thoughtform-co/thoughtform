import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/proof-cards — iterations on the other-client proof cards (the four
 * Suri and Samako jobs on the X-Bionic proposal), one direction per numbered
 * block, the jobs' IA held constant (2026-10-12). Self-contained: its own
 * sheet, no arcs or landing stylesheet. Internal-only: `proxy.ts` blocks
 * `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Proof cards · Thoughtform",
  robots: { index: false, follow: false },
};

export default function ProofCardsLayout({ children }: { children: ReactNode }) {
  return children;
}
