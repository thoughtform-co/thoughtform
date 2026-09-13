/**
 * This route's own journey clock and nav items (ADR-093, re-cut by ADR-094).
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
 * ⚠ `services` IS THE PROOF ON THIS PAGE (ADR-094). The station keeps
 * production's id because it is the corridor's exit anchor
 * (`useCorridorExitScroll` resolves `#services` by id) and a manifest row,
 * which is the only way a mark lights through `resolveActiveIdx`; what it
 * MOUNTS is the four-card proof stack, not the offer, so the mark is named
 * "Proof" and draws the proof glyph. The ADR-093 `proof` beat entry is gone
 * with the casefile that owned it.
 *
 * ⚠ `proposition` AND `offer` ARE ROSTER-ONLY STATIONS: the manifest does
 * not know them, so they resolve DIRECTLY off `data-active-station`
 * (`rosterDirectId`). Both `#turn` and `#proposition` publish
 * `proposition` — the turn opens the proposal chapter and has no mark of
 * its own — and `#offer` (ADR-094 U9: the proposal's beats after the
 * configuration) publishes its own id. The Proposal mark RANGES over the
 * two, the Arc mark's device, so it stays lit from the configuration to
 * the appendix; the SECTOR readout still counts the offer as a row of its
 * own, because `sectorRows` is derived per station and a range is a fact
 * about the mark, not the rail.
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
  "services",
  "proposition",
  "offer",
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
    { id: "services", name: "Proof", glyph: "proof" },
    // One mark for the proposal, spanning the configuration and the offer
    // (ADR-094 U9) — the same device again: the offer is the proposal's
    // second half, not a chapter of its own.
    { id: "proposition", name: "Proposal", range: ["proposition", "offer"] },
  ],
  [{ id: "contact" }]
);

/**
 * The nav drawer's items, in page order.
 *
 * Four, because four is what this page has to offer: `#voidwalker` and
 * `#practice` are removed here, and production's list would ship them as
 * dead anchors (the parse-time link cleanup cannot reach a React-owned
 * list). About leads because it is the second section; the proof is the
 * `#services` station (see the order's note); the proposal is where the
 * argument turns into the ask, and the offer (ADR-094 U9) is what it
 * asks — a reader who wants the fee should be able to jump to it.
 */
export const TRINNY_NAV_ITEMS: readonly NavItem[] = [
  { num: "01", label: "About", href: "#about" },
  { num: "02", label: "Proof", href: "#services" },
  { num: "03", label: "Proposal", href: "#proposition" },
  { num: "04", label: "The offer", href: "#offer" },
];
