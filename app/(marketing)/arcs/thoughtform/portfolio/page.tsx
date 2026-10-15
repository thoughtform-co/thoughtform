import type { Metadata } from "next";

import { ArcHero } from "@/components/arcs/ArcHero";
import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcShell } from "@/components/arcs/ArcShell";
import { THOUGHTFORM_PORTFOLIO_ARC as ARC } from "@/lib/arcs/content/thoughtform-portfolio";
import { sliceV7Sections } from "@/lib/v7-parse";

import { PORTFOLIO_RUN } from "./chapters";
import { CHAPTER_MENU, CHAPTER_VIEWS } from "./PortfolioChapters";

import "@/components/landing/v7/landing.css";
import "@/components/arcs/arcs.css";
// The case's own beats, `.tfp-*`-scoped. After arcs.css, whose ramp it reads.
import "./portfolio.css";
// The close mounts the site footer (ADR-127). Before theme.css.
import "@/components/landing/v7/site-footer/site-footer.css";
// Theme sheet LAST of the composition sheets (ADR-058).
import "@/components/landing/v7/theme.css";
import "@/components/landing/v7/rail-instruments/rail-instruments.css";

export const metadata: Metadata = {
  title: ARC.meta.title,
  description: ARC.meta.description,
  // A link handed to a reader, like every page under /arcs.
  robots: { index: false, follow: false },
};

/** The beats that open a chapter of the page in the header's inline row. */
const PRIMARY = new Set(["film", "the-video", "the-check", "close"]);

type ChapterId = keyof typeof CHAPTER_VIEWS;
const isChapter = (id: string): id is ChapterId => id in CHAPTER_VIEWS;

/**
 * /arcs/thoughtform/portfolio — Prompt to Loop, converted (owner,
 * 2026-10-15): the breakdown of one real motion ad, in the register of the
 * X-Bionic proposal and the UX meetup talk.
 *
 *   hero → the film → how it runs
 *        → PART ONE (ask · look · idea · plan · ingredients · make · sound)
 *        → PART TWO (check · cost · next time) → close
 *
 * ⚠ IT FLOWS (ADR-076: a deck is presented, a portfolio is scrolled). No
 * pin, no tail: every beat is one screen and its words are there with it.
 *
 * ⚠ AN OWN ROUTE under `[slug]`'s namespace: the folder wins over the
 * dynamic segment and `[slug]/[leaf]` filters the slug (`OWN_ROUTE_SLUGS`).
 * The record's sections (statements, the close) render through
 * `ArcSectionRenderer`; the case's chapters through `PortfolioChapters`, in
 * `PORTFOLIO_RUN`'s order, numbered as one run.
 */
export default function PortfolioPage() {
  const slice = sliceV7Sections([]);
  const motion = ARC.motion ?? "reveal";
  const byId = new Map(ARC.sections.map((s) => [s.id, s]));

  const menu = PORTFOLIO_RUN.map((id) => {
    const label = isChapter(id) ? CHAPTER_MENU[id] : byId.get(id)?.menuLabel;
    if (!label) throw new Error(`portfolio: no beat "${id}"`);
    return { id, label, primary: PRIMARY.has(id) };
  });

  return (
    <ArcShell
      hudHtml={slice.hudHtml}
      bodyClass={slice.bodyClass}
      variant="detail"
      menu={menu}
      motion={motion}
      gatewayPlate={ARC.hero.plate === "gateway"}
      curtain={ARC.hero.curtain ?? false}
      format={ARC.format}
    >
      <ArcHero hero={ARC.hero} />
      {PORTFOLIO_RUN.map((id, index) => {
        if (isChapter(id)) {
          const View = CHAPTER_VIEWS[id];
          return <View key={id} index={index} motion={motion} />;
        }
        const section = byId.get(id);
        if (!section) throw new Error(`portfolio: no section "${id}"`);
        return (
          <ArcSectionRenderer key={id} sections={[section]} motion={motion} indexOffset={index} />
        );
      })}
    </ArcShell>
  );
}
