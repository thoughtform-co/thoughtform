import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/halyard — the X-Bionic proposal's offer sections, rebuilt from the
 * design brief alone, inside the real HUD frame. Section 1 first, three
 * directions (`?d=a|b|c`); `?step=1..3` freezes A; `?still=1` hides the lab
 * switch for captures. Internal-only: `proxy.ts` blocks `/test/*` in
 * production.
 */
export const metadata: Metadata = {
  title: "Halyard · offer sections",
  robots: { index: false, follow: false },
};

export default function HalyardLayout({ children }: { children: ReactNode }) {
  return children;
}
