/**
 * This route's own journey clock and nav items (ADR-159).
 *
 * ⚠ A COPY OF THE UX MEETUP'S, NOT AN IMPORT OF IT, for v2's own reason: the
 * page order IS this file, and a variant that kept its order in a shared
 * module would be describing a page it does not own. The corridor half is
 * v3's today; the day this page changes its intro, this file is where that
 * happens.
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
 * it resolves directly off `data-active-station` (`rosterDirectId`). It keeps
 * the shared prototype's id; on this page it holds the talk.
 *
 * ⚠ THE SWARM CHAPTER (`#kta-swarm`, between the talk and the thesis) is not
 * a roster station, as it was not on the UX meetup: the marks pass from the
 * talk to the thesis over it.
 */
export const KEYNOTE_JOURNEY_ORDER = [
  "hero",
  "about",
  "voidwalker",
  "workshop",
  "thesis",
  "navigate",
  "encode",
  "build",
  "services",
  "contact",
] as const;

export const KEYNOTE_JOURNEY = buildJourneyRoster(
  KEYNOTE_JOURNEY_ORDER,
  // ⚠ The talk sits above the corridor mount, but it is a roster-only
  // station the seam-gap rule cannot resolve, so the argument stays the
  // eras'. Measured on the UX meetup, 2026-10-15: through the corridor the
  // marks follow the corridor's phase bus (thesis · navigate · encode ·
  // build), exactly as on v3.
  "voidwalker",
  [
    { id: "hero", name: "Home" },
    { id: "about" },
    { id: "voidwalker" },
    { id: "workshop", name: "Talk" },
    { id: "thesis", name: "Thesis" },
    { id: "arc", range: ["navigate", "build"] },
    { id: "services", name: "Proof", glyph: "proof" },
  ],
  [{ id: "contact" }]
);

/** The nav drawer's items, in page order. `#practice` and `#musings` are not
 *  on this page, so production's list would ship dead anchors. The eras keep
 *  production's label (ADR-138). */
export const KEYNOTE_NAV_ITEMS: readonly NavItem[] = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Voidwalker", href: "#voidwalker" },
  { num: "03", label: "The talk", href: "#workshop" },
  { num: "04", label: "Proof", href: "#services" },
];
