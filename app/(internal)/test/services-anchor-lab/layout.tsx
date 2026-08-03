import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/services-anchor-lab â€” internal look-dev for SEATING the #services
 * masthead into the HUD frame.
 *
 * The problem (owner, 2026-07-20): the left/right journey menus read as
 * ANCHORED because every rail element sits on the viewport-edge rule at
 * `--hud-margin` and carries on-line geometry (2px track, tick ladder,
 * register diamonds, plates). The masthead H1 + intro paragraph are pushed
 * inboard to the editorial band (`--rail-inset`, ADR-048) with ZERO on-line
 * geometry â€” their corner crosses and frame are `display: none` and the
 * eyebrow is retired â€” so they float.
 *
 * This lab is a VERBATIM snapshot of #services (real parse-injected HUD
 * chrome, real `ServicesMasthead`, real WebGL
 * card ring) with four sub-variants of the SHARED HORIZON BAR direction
 * layered over it â€” one hairline rule spanning rail-to-rail that both text
 * blocks key off (the avionics annunciator / Bloomberg-statusline grammar).
 * No production file is touched: all variant chrome is lab-owned.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout. Best viewed â‰¥1101Ã—760 (the menu
 * desktop gate).
 */
export const metadata: Metadata = {
  title: "Services Anchor Lab â€” Seating the Masthead (Internal)",
  description:
    "Shared-horizon-bar routes for anchoring the #services H1 + intro paragraph to the HUD frame.",
  robots: { index: false, follow: false },
};

export default function ServicesAnchorLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
