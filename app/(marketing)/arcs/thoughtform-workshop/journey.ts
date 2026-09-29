/**
 * This route's own journey clock and nav items (ADR-137).
 *
 * Route-local, beside the parse options, for the reason the Trinny route
 * gives: the page order IS this file, and a variant that kept its order in a
 * shared module would be describing a page it does not own.
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
export const WORKSHOP_JOURNEY_ORDER = [
  "hero",
  "about",
  "thesis",
  "navigate",
  "encode",
  "build",
  "services",
  "workshop",
  "contact",
] as const;

export const WORKSHOP_JOURNEY = buildJourneyRoster(
  WORKSHOP_JOURNEY_ORDER,
  // About sits between the hero and the corridor mount on this page, so the
  // seam-gap rule needs it or About stays lit through the whole Arc.
  "about",
  [
    { id: "hero", name: "Home" },
    { id: "about" },
    { id: "thesis", name: "Thesis" },
    { id: "arc", range: ["navigate", "build"] },
    { id: "services", name: "Proof", glyph: "proof" },
    { id: "workshop", name: "Workshop" },
  ],
  [{ id: "contact" }]
);

/** The nav drawer's items, in page order. `#voidwalker` and `#practice` are
 *  removed here, so production's list would ship dead anchors. */
export const WORKSHOP_NAV_ITEMS: readonly NavItem[] = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Proof", href: "#services" },
  { num: "03", label: "The workshop", href: "#workshop" },
];
