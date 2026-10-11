import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/x-bionic-routes — every route for the X-Bionic proposal's two core
 * sections on ONE page, each in its own section, inside the real arc shell
 * (owner, 2026-10-11: "put it on a test page and place each variant in a
 * section so I can see how it would look on our live website").
 *
 * The hero and the About as on the page, then the vision three ways (the
 * page today, VA, VB), then the approach five ways (the page today, AA, AB,
 * the stack, the plates), then Loop's line, so the hand-off reads in place.
 * Every section is the lab composer's own object (`xBionicV2`), re-keyed
 * only by id and menu label; the corner readout and the drawer name the
 * route. Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "X-Bionic routes · Thoughtform",
  robots: { index: false, follow: false },
};

export default function XBionicRoutesLayout({ children }: { children: ReactNode }) {
  return children;
}
