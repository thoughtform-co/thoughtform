import type { Metadata } from "next";

import { ArcClientGroups } from "@/components/arcs/ArcClientGroups";
import { ArcKindFilter } from "@/components/arcs/ArcKindFilter";
import { ArcShell } from "@/components/arcs/ArcShell";
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
          {/* ⚠ THE CONTROL LIVES IN THE HEAD, NOT IN THE PEEK (ADR-098).
              The hero is 86svh on purpose, so the grid's top edge shows
              above the fold and invites the scroll — but the wordmark is
              FIXED at the viewport's bottom-left, so anything full-width
              in that band lands on it (measured: the row at 648-685
              against the lockup at 653-684). A page-level control belongs
              with the page's own head anyway. Last child, so the four
              reveal delays above are untouched. */}
          <ArcKindFilter />
        </div>
      </section>
      <section className="arc-section arc-index-grid" aria-label="All arcs">
        <div className="arc-band">
          <ArcClientGroups />
        </div>
      </section>
    </ArcShell>
  );
}
