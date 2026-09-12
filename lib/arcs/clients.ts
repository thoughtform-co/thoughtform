/**
 * lib/arcs/clients — the clients an engagement belongs to (ADR-098).
 *
 * An arc is one ENGAGEMENT. A client has more than one over time, and the
 * client is not recreated for each: `ArcDef.client` names a record here,
 * `/arcs/<client>` lists what that client has, and the overview groups the
 * grid by it.
 *
 * Types and plain data only, like the rest of `lib/arcs` — no runtime
 * imports, so nothing here can pull weight into the route.
 *
 * ⚠ A CLIENT SLUG AND AN ARC SLUG SHARE ONE NAMESPACE. `/arcs/[slug]`
 * resolves a client first and an arc second, so a collision would shadow a
 * live page with a listing. `tests/lib/arcs-registry.test.ts` pins the two
 * sets disjoint.
 */

import type { ArcDef, ArcKind } from "./types";

export interface ClientDef {
  /** Route segment for `/arcs/<slug>` — kebab-case, unique, and never
   *  equal to an arc's slug. */
  slug: string;
  /** The client as they write it. Lettered as the client page's title and
   *  as the overview group's head. */
  name: string;
  /** One line under the name: what the work is, in the client's own terms.
   *  The copy law applies — a name, never an aphorism. */
  lede: string;
}

export const LOOP_CLIENT: ClientDef = {
  slug: "loop",
  name: "Loop Earplugs",
  lede: "Three years inside the creative team: the films, the studio's own ads, the tools it wrote, and the map that routes the work.",
};

export const SURI_CLIENT: ClientDef = {
  slug: "suri",
  name: "Suri",
  lede: "An electric toothbrush brand in London, and a creative team that will run its own imagery.",
};

/** Every client with an engagement on the site, in the order the overview
 *  reads them. */
export const CLIENTS: readonly ClientDef[] = [SURI_CLIENT, LOOP_CLIENT];

export function clientSlugs(): string[] {
  return CLIENTS.map((client) => client.slug);
}

export function getClient(slug: string): ClientDef | undefined {
  return CLIENTS.find((client) => client.slug === slug);
}

/**
 * The taxonomy the overview filters by, DERIVED where an arc does not
 * author it (ADR-098).
 *
 * ⚠ THE FORMAT ALREADY IMPLIES THE KIND for every arc that existed before
 * this ruling, so none of the five content modules was edited to restate
 * it — and the `-v2` cuts, which spread their v1 wholesale, inherit it for
 * free. `ArcDef.kind` exists for the case the fallback cannot know: an
 * engagement whose format says one thing and whose kind says another.
 */
const KIND_BY_FORMAT: Record<string, ArcKind> = {
  workshop: "workshop",
  keynote: "keynote",
  portfolio: "production",
  proposal: "production",
};

export function kindOf(arc: ArcDef): ArcKind {
  return arc.kind ?? KIND_BY_FORMAT[arc.format] ?? "production";
}

/** The label the filter and the group heads letter for a kind. */
export const KIND_LABEL: Record<ArcKind, string> = {
  keynote: "Keynotes",
  workshop: "Workshops",
  production: "Productions",
};
