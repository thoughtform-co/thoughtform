/**
 * This route's own journey clock and nav items (ADR-143).
 *
 * ⚠ A COPY OF v2's, NOT AN IMPORT OF IT, for v2's own reason: the page order
 * IS this file, and a variant that kept its order in a shared module would be
 * describing a page it does not own. The cuts are identical today because the
 * corridor half is identical; the day this cut changes its intro (the owner's
 * next pass), this file is where that happens and the others are untouched.
 */

import type { NavItem } from "@/components/landing/v7/HudNav";
import { buildJourneyRoster } from "@/components/landing/v7/rail-instruments/journeyOrder";

/**
 * Every section this page shows, IN PAGE ORDER.
 *
 * ⚠ `services` IS THE PROOF HERE: it keeps production's id because it is the
 * corridor's exit anchor (`useCorridorExitScroll` resolves `#services` by id)
 * and a manifest row, while what it mounts is the four-card proof stack.
 *
 * ⚠ `workshop` IS A ROSTER-ONLY STATION — the manifest does not know it, so
 * it resolves directly off `data-active-station` (`rosterDirectId`).
 */
export const WORKSHOP_V3_JOURNEY_ORDER = [
  "hero",
  // ADR-143 U7: the opener, a station the manifest does not know, so it
  // resolves directly off `data-active-station` (`rosterDirectId`).
  "equilibrium",
  "about",
  "voidwalker",
  "thesis",
  "navigate",
  "encode",
  "build",
  "services",
  "workshop",
  "contact",
] as const;

export const WORKSHOP_V3_JOURNEY = buildJourneyRoster(
  WORKSHOP_V3_JOURNEY_ORDER,
  // The era stage sits directly above the corridor mount on this page
  // (ADR-138), so the seam-gap rule needs it or the eras stay lit through the
  // whole Arc.
  "voidwalker",
  [
    // Home holds through the opener (ADR-143 U7), which has no mark of its own.
    { id: "hero", name: "Home", range: ["hero", "equilibrium"] },
    { id: "about" },
    { id: "voidwalker" },
    { id: "thesis", name: "Thesis" },
    { id: "arc", range: ["navigate", "build"] },
    { id: "services", name: "Proof", glyph: "proof" },
    { id: "workshop", name: "Workshop" },
  ],
  [{ id: "contact" }]
);

/** The nav drawer's items, in page order. `#practice` and `#musings` are not
 *  on this page, so production's list would ship dead anchors. The eras keep
 *  production's label (ADR-138). */
export const WORKSHOP_V3_NAV_ITEMS: readonly NavItem[] = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Voidwalker", href: "#voidwalker" },
  { num: "03", label: "Proof", href: "#services" },
  { num: "04", label: "The workshop", href: "#workshop" },
];
