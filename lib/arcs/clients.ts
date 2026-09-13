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

/**
 * A page of the client's that is NOT an arc (ADR-098 U2): a homepage
 * variant like `/trinny-london`, listed on the client's band and page as a
 * card that links out to it.
 *
 * ⚠ A FIELD ON THE CLIENT, NEVER A LINK-ONLY `ArcDef`. ADR-098 rejected
 * listing the pitch because a record with no sections would have to be
 * special-cased in every `ARCS.map` walk — the static params, the
 * registry's guards, the smokes' slug loops. A page on the CLIENT reaches
 * the two listings and nothing else, which is the whole of what a link
 * needs. The owner's ask (2026-09-13: "we have to wire it up to the right
 * subpage") reversed the "deliberately absent" ruling; this is the shape
 * that honours both.
 */
export interface ClientPageDef {
  /** Where the card goes — a site route OUTSIDE `/arcs/` (the registry test
   *  pins it), because an `/arcs/` page is an arc and belongs in `ARCS`. */
  href: string;
  /** The card's chip, e.g. "pitch". The overview smoke asserts every chip
   *  on the page is distinct, this one included. */
  chip: string;
  title: string;
  lede: string;
  image: { src: string; alt: string };
  kind: ArcKind;
}

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
  /** Pages of the client's that are not arcs, listed FIRST in the band. */
  pages?: readonly ClientPageDef[];
}

export const TRINNY_CLIENT: ClientDef = {
  slug: "trinny-london",
  name: "Trinny London",
  lede: "A beauty brand in London, and a creative team that would run its own imagery, briefs and numbers on one layer.",
  /* The pitch is a homepage variant (ADR-093), not an arc: it re-choreographs
     the corridor, stacks the Loop proof, re-forms the mark as theirs and ends
     on the configuration their team would own — with the proposal's offer
     appended after it (ADR-094 U9). It links out; nothing under `/arcs/`
     renders it. */
  pages: [
    {
      href: "/trinny-london",
      chip: "pitch",
      title: "Trinny London · the pitch",
      lede: "The Loop proof as a stack of cards, the mark re-formed as theirs, the configuration their team would own, and the offer.",
      image: { src: "/images/services/embedded.webp", alt: "" },
      kind: "production",
    },
  ],
};

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
export const CLIENTS: readonly ClientDef[] = [TRINNY_CLIENT, SURI_CLIENT, LOOP_CLIENT];

export function clientSlugs(): string[] {
  return CLIENTS.map((client) => client.slug);
}

export function getClient(slug: string): ClientDef | undefined {
  return CLIENTS.find((client) => client.slug === slug);
}

/** Everything a client's band lists: its non-arc pages and its arcs. */
export function clientPageCount(client: ClientDef, arcs: readonly ArcDef[]): number {
  return (client.pages?.length ?? 0) + arcs.length;
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
