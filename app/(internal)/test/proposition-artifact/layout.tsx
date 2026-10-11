import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/proposition-artifact — the place to iterate the X-Bionic proposal's
 * proposition artifact: the owner's picks from /test/xb-offer-rebuild and
 * /test/halyard on one page, inside the real HUD frame (2026-10-11).
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Proposition artifact · Thoughtform",
  robots: { index: false, follow: false },
};

export default function PropositionArtifactLayout({ children }: { children: ReactNode }) {
  return children;
}
