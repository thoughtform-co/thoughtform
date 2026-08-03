import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/services-orbit â€” internal look-dev lab for the ADR-029 services card
 * ring: the four service photo cards orbiting the brandmark armillary,
 * scroll-driven with a bounded spring. Composition (radius / card size /
 * dwell / sway) is tuned here, then the final values are promoted into
 * `lib/services-ring/ringMath.ts` constants.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout (admin-gated outside dev).
 */
export const metadata: Metadata = {
  title: "Services Orbit â€” Card Ring Lab (Internal)",
  description: "Look-dev harness for the services card ring orbiting the brandmark instrument.",
  robots: { index: false, follow: false },
};

export default function ServicesOrbitLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
