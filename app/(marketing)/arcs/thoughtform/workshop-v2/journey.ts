/**
 * This route's own journey clock and nav items (ADR-139).
 *
 * ⚠ A COPY OF v1's, NOT AN IMPORT OF IT, and deliberately. v1's own docblock
 * gives the reason and it holds twice over here: the page order IS this file,
 * and a variant that kept its order in a shared module would be describing a
 * page it does not own. The two are identical today because the corridor half
 * is identical; the day the second cut drops a station, this file is where
 * that happens and v1 is untouched by it.
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
export const WORKSHOP_V2_JOURNEY_ORDER = [
  "hero",
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

export const WORKSHOP_V2_JOURNEY = buildJourneyRoster(
  WORKSHOP_V2_JOURNEY_ORDER,
  // The era stage sits directly above the corridor mount on this page
  // (ADR-138), so the seam-gap rule needs it or the eras stay lit through the
  // whole Arc.
  "voidwalker",
  [
    { id: "hero", name: "Home" },
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
export const WORKSHOP_V2_NAV_ITEMS: readonly NavItem[] = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Voidwalker", href: "#voidwalker" },
  { num: "03", label: "Proof", href: "#services" },
  { num: "04", label: "The workshop", href: "#workshop" },
];
