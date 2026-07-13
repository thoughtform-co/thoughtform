import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/arc-cases-orbit — internal look-dev lab for the ADR-033 Arc Cases
 * Orbit: the four production case cards orbiting a stand-in Build sphere,
 * CLICK-armed through the real `arcCasesStore` + damped arm level + ring
 * spring. Composition (orbit radii / card size / y offset / entrance /
 * dims) is tuned here, then the final values are promoted into
 * `lib/arc-cases/orbitMath.ts` constants. Final compositing against the
 * real accretion shell is verified on the landing behind ARC_CASES_ORBIT.
 *
 * Blocked from production by `middleware.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout (admin-gated outside dev).
 */
export const metadata: Metadata = {
  title: "Arc Cases Orbit — Build Park Lab (Internal)",
  description: "Look-dev harness for the case cards orbiting the Build-park sphere.",
  robots: { index: false, follow: false },
};

export default function ArcCasesOrbitLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
