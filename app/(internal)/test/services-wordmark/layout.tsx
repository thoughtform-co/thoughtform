import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/services-wordmark — internal look-dev lab for the ALTERNATIVE WORDMARK
 * PLACEMENT on the Services section: the wordmark lockup relocates to the
 * bottom-left corner, the compact brandmark glyph (plus the plain HUD corner
 * bracket) takes the top-left, and the freed top band carries a full-caps
 * Services title on the left rail + an intro paragraph on the right rail
 * (Linear/Shards-style masthead). See the plan + ADR-031 note.
 *
 * Blocked from production by `middleware.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout (admin-gated outside dev).
 */
export const metadata: Metadata = {
  title: "Services Wordmark — Corner-Swap Lab (Internal)",
  description:
    "Look-dev harness for moving the wordmark to the bottom-left and framing Services with a rail-aligned title + paragraph.",
  robots: { index: false, follow: false },
};

export default function ServicesWordmarkLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
