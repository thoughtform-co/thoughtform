import type { Metadata } from "next";

import { ArcCardGrid } from "@/components/arcs/ArcCardGrid";
import { ArcShell } from "@/components/arcs/ArcShell";
import { ARCS } from "@/lib/arcs/registry";
import { sliceV7Sections } from "@/lib/v7-parse";

import "@/components/landing/v7/landing.css";
import "@/components/arcs/arcs.css";
// Theme sheet LAST (ADR-058) — after arcs.css so the light cascade wins.
import "@/components/landing/v7/theme.css";

/**
 * /arcs — the client-arc overview (ADR-052). Unlisted: reachable by
 * link, never indexed. HUD chrome comes from the v7 slice; with no hero
 * curtain on this page, `--hero-lift: 1` is pinned statically by the
 * shell so the rails are uncovered from first paint.
 *
 * Stylesheet order is load-bearing: landing.css (tokens + HUD + hero)
 * first, arcs.css LAST so its scoped rules win the cascade.
 */
export const metadata: Metadata = {
  title: "Arcs — Thoughtform",
  description:
    "Client arcs — the briefing as a place: each engagement's context, proof, and practice on one page.",
  robots: { index: false, follow: false },
};

export default function ArcsPage() {
  const slice = sliceV7Sections([]);
  return (
    <ArcShell hudHtml={slice.hudHtml} bodyClass={slice.bodyClass} variant="index">
      <section className="arc-section arc-index-hero" aria-label="Arcs">
        <div className="arc-band arc-index-hero__band">
          <p className="arc-desig arc-reveal">Thoughtform · Client arcs</p>
          <h1 className="arc-title arc-index-hero__title arc-reveal">
            The briefing, <em>as a place.</em>
          </h1>
          <p className="arc-index-hero__lede arc-reveal">
            Every engagement gets an arc — the context, the proof, and the practice on one page, in
            the same instrument the work ships in.
          </p>
          <p className="arc-cue arc-reveal" aria-hidden="true">
            The arcs
          </p>
        </div>
      </section>
      <section className="arc-section arc-index-grid" aria-label="All arcs">
        <div className="arc-band">
          <ArcCardGrid arcs={ARCS} />
        </div>
      </section>
    </ArcShell>
  );
}
