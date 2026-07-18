import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/section-menu-lab — internal look-dev for a detached left-side
 * section + subsection overview (the successor to the retired ADR-031
 * rolodex).
 *
 * Five design routes (Glyph index / Gauge manifest / Altitude tape /
 * Terminal tree / Astrogation spine) over a static reproduction of the
 * parked Navigate viewport. Blocked from production by `middleware.ts`
 * and `noindex`; auth handled by the parent `(internal)/test` layout.
 * Best viewed ≥1101×760 (the register/menu desktop gate).
 */
export const metadata: Metadata = {
  title: "Section Menu Lab — Left Overview Routes (Internal)",
  description: "Five retrofuturistic routes for a detached left-rail section + subsection menu.",
  robots: { index: false, follow: false },
};

export default function SectionMenuLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
