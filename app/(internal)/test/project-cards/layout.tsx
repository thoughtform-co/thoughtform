import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/project-cards â€” internal lab for the scroll-stacked project cards.
 *
 * Five chrome directions (Dossier / Console Plate / Nav Terminal / Spec
 * Sheet / Signal Ledger) over one vorszk-style sticky-sibling card stack.
 * Blocked from production by `proxy.ts` and `noindex` so the lab
 * never leaks into search. Auth is handled by the parent `(internal)/test`
 * layout (admin-gated outside dev).
 */
export const metadata: Metadata = {
  title: "Project Cards â€” Stacked Scroll Lab (Internal)",
  description: "Five retrofuturistic chrome directions for the scroll-stacked case cards.",
  robots: { index: false, follow: false },
};

export default function ProjectCardsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
