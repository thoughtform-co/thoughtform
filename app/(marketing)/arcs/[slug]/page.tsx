import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { arcSlugs, getArc } from "@/lib/arcs/registry";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
// The casefile's console + bay sheets, AHEAD of arcs.css (ADR-072): the
// dossier beat mounts the landing's tools console, and arcs.css hosts it.
// Both sheets are fully `.fl-*` / `.services-*` scoped, so an arc without
// a dossier gets bytes and no matching rule. Route-level on purpose — a
// client-component import would make the cascade order bundle-dependent.
import "@/components/landing/home-v2/services/casefile/casefile.css";
import "@/components/landing/home-v2/services/casefile/console/console.css";
import "@/components/arcs/arcs.css";
// Theme sheet LAST (ADR-058) — after arcs.css so the light cascade wins.
import "@/components/landing/v7/theme.css";

/**
 * /arcs/[slug] — one client arc (ADR-052). Statically generated from
 * the registry; unknown slugs 404 (`dynamicParams = false`). Unlisted:
 * robots noindex on every arc. The detail shell writes `--hero-lift`
 * from scroll so the HUD rails clip-uncover with the hero curtain,
 * exactly like the landing.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return arcSlugs().map((slug) => ({ slug }));
}

interface ArcRouteParams {
  /* Next 16: route params arrive as a Promise. */
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArcRouteParams): Promise<Metadata> {
  const { slug } = await params;
  const arc = getArc(slug);
  if (!arc) return { robots: { index: false, follow: false } };
  return {
    title: arc.meta.title,
    description: arc.meta.description,
    robots: { index: false, follow: false },
  };
}

export default async function ArcPage({ params }: ArcRouteParams) {
  const { slug } = await params;
  const arc = getArc(slug);
  if (!arc) notFound();
  const slice = sliceV7Sections([]);
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
  return (
    <>
      <link rel="preload" as="image" href={arc.hero.image.src} />
      <ArcShell
        hudHtml={slice.hudHtml}
        bodyClass={slice.bodyClass}
        variant="detail"
        menu={menu}
        motion={motion}
      >
        <ArcHero hero={arc.hero} />
        <ArcSectionRenderer sections={arc.sections} motion={motion} />
      </ArcShell>
    </>
  );
}
