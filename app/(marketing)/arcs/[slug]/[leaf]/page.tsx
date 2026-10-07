import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { ArcWorkedSwitch } from "@/components/arcs/ArcWorkedSwitch";
import { getClient } from "@/lib/arcs/clients";
import { ARCS, getArcAt } from "@/lib/arcs/registry";
import { groupOf } from "@/lib/arcs/routes";
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
// The setup guide (ADR-151 U1), `.arc-guide*`-scoped: an arc without a guide
// beat gets bytes and no matching rule. After arcs.css, before theme.css.
import "@/components/arcs/guide.css";
// ADR-148 U1: a generic-route arc may mount Prompt to Loop (`prompt-to-loop`
// kind); its sheet is scoped under `.ptl`, so it is inert everywhere else.
import "@/components/arcs/prompt-to-loop/prompt-to-loop.css";
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
 * /arcs/[slug]/[leaf] — one arc (ADR-052), at `/arcs/<group>/<leaf>` since
 * ADR-142: the group is the arc's client, or `thoughtform` for a house
 * format. `../page.tsx` is the group's own page, the listing.
 *
 * Statically generated; an unknown pair 404s (`dynamicParams = false`).
 * Unlisted: robots noindex. The detail shell writes `--hero-lift` from
 * scroll so the HUD rails clip-uncover with the hero curtain, exactly like
 * the landing.
 *
 * ⚠ THE ADDRESS IS DERIVED (`lib/arcs/routes.ts`). The params below are
 * `groupOf(arc)` and `arc.leaf`, so a record whose client changes moves its
 * page, and its old address needs a row in `lib/arcs/legacyRoutes.mjs`.
 */
export const dynamicParams = false;

/**
 * Arcs served by a STATIC folder of their own (ADR-137): the folder wins over
 * this dynamic segment, so emitting the pair here too would build a page
 * nobody can reach. The `ArcDef` stays in `ARCS` — the overview, the
 * registry guards and `HERO_ROUTES` read it — and only the route moves.
 * Keyed by the arc's id, as `getArc` is.
 */
const OWN_ROUTE_SLUGS: ReadonlySet<string> = new Set([
  "thoughtform-workshop",
  "thoughtform-workshop-v2",
  "thoughtform-workshop-v3",
  "ap-hogeschool-lecture",
  "suri-lunch-and-learn",
]);

export function generateStaticParams() {
  return ARCS.filter((arc) => !OWN_ROUTE_SLUGS.has(arc.slug)).map((arc) => ({
    slug: groupOf(arc),
    leaf: arc.leaf,
  }));
}

interface ArcRouteParams {
  /* Next 16: route params arrive as a Promise. */
  params: Promise<{ slug: string; leaf: string }>;
}

export async function generateMetadata({ params }: ArcRouteParams): Promise<Metadata> {
  const { slug, leaf } = await params;
  const arc = getArcAt(slug, leaf);
  if (!arc) return { robots: { index: false, follow: false } };
  return {
    title: arc.meta.title,
    description: arc.meta.description,
    robots: { index: false, follow: false },
  };
}

export default async function ArcPage({ params }: ArcRouteParams) {
  const { slug, leaf } = await params;
  const slice = sliceV7Sections([]);
  const arc = getArcAt(slug, leaf);
  if (!arc) notFound();
  const menu = arc.sections
    .filter((section) => section.menuLabel)
    .map((section) => ({
      id: section.id,
      label: section.menuLabel as string,
      primary: section.menuPrimary,
    }));
  // Absent motion is the ADR-052 reveal — resolved once, here, so the
  // rest of the tree never has to know the flag is optional.
  const motion = arc.motion ?? "reveal";
  const gatewayPlate = arc.hero.plate === "gateway";
  return (
    <>
      {/* ⚠ NO STATIC PRELOAD FOR A GATEWAY HERO (ADR-075). The plate is
          theme-dependent, and the preload scanner runs before any script:
          a static link would always pull the DARK plate and light
          visitors would pay for both. `lib/theme/heroPreload.ts` injects
          the right one from the theme the bootstrap just stamped. An arc
          with its own plate has one file for both themes and keeps the
          static link. */}
      {gatewayPlate ? null : <link rel="preload" as="image" href={arc.hero.image.src} />}
      <ArcShell
        hudHtml={slice.hudHtml}
        bodyClass={slice.bodyClass}
        variant="detail"
        menu={menu}
        motion={motion}
        gatewayPlate={gatewayPlate}
        curtain={arc.hero.curtain ?? false}
        format={arc.format}
        lock={arc.theme}
        rhythm={arc.rhythm}
        clientMark={arc.client ? getClient(arc.client)?.mark : undefined}
      >
        <ArcHero hero={arc.hero} />
        <ArcSectionRenderer sections={arc.sections} motion={motion} />
        {/* The worked-example switch (ADR-139), mounted only where a record
            carries one: until ADR-146 every switched page had its own route
            and mounted the island there; the first switched arc on this
            route is the Armada companion. Without it the first panel of
            each group reads whole and the bar stays away, by design. */}
        {arc.sections.some((section) => section.worked) ? <ArcWorkedSwitch /> : null}
      </ArcShell>
    </>
  );
}
