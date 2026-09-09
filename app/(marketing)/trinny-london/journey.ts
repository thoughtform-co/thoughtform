/**
 * This route's own journey clock and nav items (ADR-093).
 *
 * Route-local, beside the parse options, for the same reason those are
 * route-local: the page order IS this file, and a variant that kept its
 * order in a shared module would be describing a page it does not own.
 * It is importable by vitest, which the server component is not.
 */

import type { NavItem } from "@/components/landing/v7/HudNav";
import { buildJourneyRoster } from "@/components/landing/v7/rail-instruments/journeyOrder";

/**
 * Every section this page shows, IN PAGE ORDER.
 *
 * The corridor's four beats are listed individually because the live
 * `data-corridor-phase` bus publishes at beat granularity; the Arc mark
 * below spans them, and `sectorRows` collapses them to one row exactly as
 * `READOUT_SECTIONS` does for production.
 *
 * ⚠ `proof` is here and is NOT a station. The casefile holds the front of
 * the `#services` runway (ADR-056), so one DOM section carries two beats a
 * reader experiences separately — the same split `READOUT_SECTIONS` makes.
 *
 * ⚠ `voidwalker` and `practice` are deliberately ABSENT: this page removes
 * them, and `journeyPosition` returns −1 for a section the page does not
 * show, which lights nothing. That is the honest answer, and the same
 * shape as the landing's own known hole for `#practice`.
 */
export const TRINNY_JOURNEY_ORDER = [
  "hero",
  "about",
  "thesis",
  "navigate",
  "encode",
  "build",
  "proof",
  "services",
  "contact",
] as const;

export const TRINNY_JOURNEY = buildJourneyRoster(
  TRINNY_JOURNEY_ORDER,
  // The station immediately before the corridor mount on THIS page. On `/`
  // it is `hero`; here About comes first, and `resolveActiveIdx`'s seam-gap
  // rule needs to know it or About stays lit through the whole Arc.
  "about",
  [
    { id: "hero", name: "Home" },
    { id: "about" },
    { id: "thesis", name: "Thesis" },
    // One mark for the Arc, spanning its beats — the landing's own device,
    // for the same reason: two marks lit at once is the frame lying about
    // where the reader is.
    { id: "arc", range: ["navigate", "build"] },
    { id: "proof" },
    { id: "services" },
  ],
  [{ id: "contact" }]
);

/**
 * The nav drawer's items, in page order.
 *
 * Two, because two is what this page has to offer: `#voidwalker` and
 * `#practice` are removed here, and production's list would ship them as
 * dead anchors (the parse-time link cleanup cannot reach a React-owned
 * list). About leads because it is the second section.
 */
export const TRINNY_NAV_ITEMS: readonly NavItem[] = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Services", href: "#services" },
];
