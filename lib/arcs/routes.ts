/**
 * lib/arcs/routes — where an arc lives (ADR-142).
 *
 * Every arc page is two segments deep: `/arcs/<group>/<leaf>`. The group is
 * the arc's client, or `thoughtform` for a house format (the workshop, the
 * keynote, the course and their cuts: the shapes the practice sells, which
 * belong to no client). `/arcs/<group>` is the group's own page, the listing.
 *
 * ⚠ THE ADDRESS IS DERIVED, NEVER AUTHORED. Every link to an arc — the
 * overview, a client page, a station on another arc — is built here from
 * `client` and `leaf`, so moving an arc is a change to its record, not a
 * search through the tree. The flat addresses it replaced redirect from
 * `lib/arcs/legacyRoutes.mjs`.
 *
 * Types and pure functions only, like the rest of `lib/arcs`.
 */

import type { ArcDef } from "./types";

/** The house group: the formats with no client live at `/arcs/thoughtform/…`. */
export const HOUSE_SLUG = "thoughtform";

/** The group an arc is listed under: its client, else the house. */
export function groupOf(arc: Pick<ArcDef, "client">): string {
  return arc.client ?? HOUSE_SLUG;
}

/** A group's own page, the listing of what it holds. */
export function groupHref(group: string): string {
  return `/arcs/${group}`;
}

/** The arc's address. */
export function arcHref(arc: Pick<ArcDef, "client" | "leaf">): string {
  return `${groupHref(groupOf(arc))}/${arc.leaf}`;
}
