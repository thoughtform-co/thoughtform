import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/loop-proof-lab — the four Loop proof cards on the X-Bionic proposal,
 * redrawn in the job cards' language (/test/proof-cards, block 14 on) while
 * keeping Loop's own visuals (2026-10-12). Internal-only: `proxy.ts` blocks
 * `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Loop proof lab · Thoughtform",
  robots: { index: false, follow: false },
};

export default function LoopProofLabLayout({ children }: { children: ReactNode }) {
  return children;
}
