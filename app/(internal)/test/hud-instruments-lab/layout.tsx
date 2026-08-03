import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/hud-instruments-lab â€” internal look-dev for putting small
 * INSTRUMENT elements inside the HUD frame's rail columns.
 *
 * The problem (owner, 2026-07-31): the frame is a ruler with nothing on
 * it. Two rails, a 13-tick ladder, two bearing labels, two corner
 * brackets â€” and the right rail is entirely empty (`[data-tools-rail-root]`
 * ships as a bare div). Since ADR-055 retired the left/right section
 * menus, the only journey indicator is the nav-corner readout. The
 * reference vocabulary the owner is drawing from (avionics glass, the
 * Departure Mono spec sheet, game HUDs) all hang small readouts and
 * markers around the frame; ours has none.
 *
 * Constraints the routes below all obey:
 *   â€¢ The rails do NOT change â€” track, 13 ticks, bearing labels, geometry.
 *   â€¢ INSIDE the grid only. Our frame sits at the viewport edge, so there
 *     is no "outside" to hang things in; instruments live in the rail
 *     columns and the corner zones.
 *   â€¢ ASYMMETRIC. Left = discrete (where you have been), right =
 *     continuous (how far). Never a mirror.
 *   â€¢ PROGRESSIVE â€” a section's mark appears only once you reach it.
 *   â€¢ INFORMATIONAL ONLY â€” nothing clickable; the nav corner stays the
 *     single navigation (ADR-031 already retired per-row rail buttons).
 *   â€¢ Desktop + laptop. Below 960px the rails go and these go with them.
 *
 * âš  Unlike every other frame lab, this route is a REAL SCROLLING
 * DOCUMENT, not a parked still. Two behaviours under study are
 * scroll-derived â€” `HudNav`'s 50vh collapse and `computeDetentTable`'s
 * division by the live scroll range â€” and both silently read 0 under the
 * usual `position: fixed; inset: 0` lab root. The upside is that the
 * ADR-031 U16 hero-curtain reveal is judged for real here.
 *
 * No production file is touched; every instrument is lab-owned and every
 * production module is imported read-only.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled
 * by the parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "HUD Instruments Lab â€” Section Presence in the Rails (Internal)",
  description:
    "Look-dev for section-presence instruments seated inside the landing page's HUD rail columns.",
  robots: { index: false, follow: false },
};

export default function HudInstrumentsLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
