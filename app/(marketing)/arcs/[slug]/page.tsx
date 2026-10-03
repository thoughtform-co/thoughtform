import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SheetRenderer } from "@/components/sheet/SheetRenderer";
import { SheetShell } from "@/components/sheet/SheetShell";
import { getGroup, groupSlugs } from "@/lib/arcs/clients";
import { HOUSE_SLUG } from "@/lib/arcs/routes";
import { clientSheetSections } from "@/lib/sheet/arcs";
import { chaptersOf } from "@/lib/sheet/composition";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
// The casefile's console + bay sheets, AHEAD of arcs.css (ADR-072): the
// dossier beat mounts the landing's tools console, and arcs.css hosts it.
// Both sheets are fully `.fl-*` / `.services-*` scoped, so an arc without
// a dossier gets bytes and no matching rule. Route-level on purpose — a
// client-component import would make the cascade order bundle-dependent.
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
// The map console's own palette + svg rules (ADR-076) — the architecture
// beat mounts the casefile's three-reading instrument. Same tier as the
// two sheets above it: `.fl-pda*`-scoped, so an arc without the beat
// gets bytes and no matching rule.
import "@/components/landing/home-v2/services/casefile/map/pda/pda.css";
// The proof card's own sheet (ADR-128): a `proof-card` beat mounts the
// homepage's folder card at rest, and this is its skin. `.pf-stack`-scoped,
// so an arc without the beat gets bytes and no matching rule. Route-level for
// the same reason as the three above, ahead of arcs.css, which hosts it.
import "@/components/landing/home-v2/services/proof-stack/proof-stack.css";
import "@/components/arcs/arcs.css";
// The course's syllabus (ADR-134), `.arc-syl*`-scoped: an arc without one
// gets bytes and no matching rule. After arcs.css, whose tokens
// it reads, before theme.css.
import "@/components/arcs/course.css";
// The sheet (ADR-114) — the CLIENT page renders on it; an arc gets bytes and
// no matching rule. After arcs.css, before theme.css.
import "@/components/sheet/sheet.css";
// The site footer (ADR-105): the close mounts `SiteFooter`, and this is its
// sheet. Every route that mounts a close loads it (ADR-127 - until then no
// sheet route did, and the footer rendered unstyled). BEFORE theme.css like
// every route sheet.
import "@/components/landing/v7/site-footer/site-footer.css";
// Theme sheet LAST (ADR-058) — after arcs.css so the light cascade wins.
import "@/components/landing/v7/theme.css";
// The corner instruments (ADR-059 U6). LAST, mirroring the landing route
// exactly, so both surfaces cascade identically. It does not break ADR-058s
// theme-sheet-last rule: this sheet declares no [data-theme] rules at all,
// and theme.css own instruments rule outranks its base on specificity from
// either position.
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

/**
 * /arcs/[slug] — one GROUP's page (ADR-098, ADR-114, ADR-142): a client's,
 * or the house's at `/arcs/thoughtform`. A listing of what the group holds,
 * drawn as a sheet. The arcs themselves are one level down, at
 * `/arcs/<group>/<leaf>` (`./[leaf]/page.tsx`).
 *
 * Statically generated; unknown slugs 404 (`dynamicParams = false`).
 * Unlisted: robots noindex.
 *
 * ⚠ THE ENGAGEMENTS NEST NOW (ADR-142, owner 2026-10-03), which reverses
 * ADR-098 §2's "the engagements stay flat". Its reason was that an arc's
 * links are in inboxes; the answer is that every flat address it had
 * redirects (308) to the nested one, from `lib/arcs/legacyRoutes.mjs`, and
 * `arcs-routes` pins every address ever handed out to a live page.
 *
 * ⚠ A GROUP'S OWN ROUTE FOLDER DOES NOT SHADOW THIS PAGE. `trinny-london/`,
 * `thoughtform/` and `ap-hogeschool/` are real folders holding pages one
 * level down, with no page of their own, so `/arcs/<group>` still resolves
 * here: the router matches whole paths, never a folder first.
 *
 * ⚠ THE STYLESHEETS ARE THE ARC ROUTE'S, IN ITS ORDER. Until ADR-142 one
 * route rendered both shapes, so a client page was always drawn under this
 * whole cascade; it keeps it, byte for byte, rather than find out which
 * sheet it silently depended on.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return groupSlugs().map((slug) => ({ slug }));
}

interface GroupRouteParams {
  /* Next 16: route params arrive as a Promise. */
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GroupRouteParams): Promise<Metadata> {
  const { slug } = await params;
  const group = getGroup(slug);
  if (!group) return { robots: { index: false, follow: false } };
  return {
    // The house's page is Thoughtform's own, so it is titled by what it lists.
    title:
      group.slug === HOUSE_SLUG ? "House formats — Thoughtform" : `${group.name} — Thoughtform`,
    description: group.lede,
    robots: { index: false, follow: false },
  };
}

export default async function GroupPage({ params }: GroupRouteParams) {
  const { slug } = await params;
  const group = getGroup(slug);
  if (!group) notFound();
  const slice = sliceV7Sections([]);
  /* A group page is a SHEET page (ADR-114): a split head with the group's
     name and lede, its console at page scale, the close. `SheetShell` is the
     index-style shell — no hero, rails uncovered from the first paint. */
  const sections = clientSheetSections(group);
  return (
    <SheetShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      page={`arcs-${group.slug}`}
      chapters={chaptersOf(sections)}
    >
      <SheetRenderer sections={sections} />
    </SheetShell>
  );
}
