"use client";

import type { NodeContent } from "@/lib/home-v2/corridorMap";

/**
 * StationTitle — celestial-navigation instrument readout that
 * STRADDLES the central brandmark/reticle at each parked gate
 * (Navigate / Encode / Build).
 *
 * Two world-anchored clusters, positioned + faded per frame by
 * `useWorldDomTracker` against `{base}.title` and `{base}.support`
 * (defined in `sceneGeom.COPY_ANCHORS`):
 *   - the TITLE cluster sits just ABOVE the reticle  (`bottom-center` origin)
 *   - the SUPPORT cluster sits just BELOW it         (`top-center` origin)
 *
 * Each cluster is a bracketed mono HUD readout in the v7 instrument
 * grammar (gold L-corner brackets, mono header chips, status badge,
 * tick rules) with a leader line + diamond node that visually binds
 * the cluster to the reticle. Type is `PT Mono` uppercase tracked —
 * the brand's display voice — so the text reads as part of the
 * navigation instrument rather than floating over it.
 *
 * World-anchor ids, anchor origins, and the two-element straddle
 * (title above / support below) are unchanged from the prior
 * frameless variant, so the world-DOM projection plumbing in
 * `useWorldDomTracker` + `COPY_ANCHORS` keeps working as-is.
 *
 * `content` and the optional `content.telemetry` block come straight
 * off the corridor-map node (single source of truth).
 */

interface StationTitleProps {
  content: NodeContent;
  /** Anchor id base — `{base}.title` / `{base}.support` resolve in COPY_ANCHORS. */
  base: "navigate" | "diagnostic" | "intelligence";
}

export function StationTitle({ content, base }: StationTitleProps) {
  const t = content.telemetry;
  return (
    <>
      {/* ── Title cluster ─────────────────────────────────────────
          The bracketed instrument readout above the reticle. Header
          row carries `sector // callsign · code · metric` plus a
          `[VALID]` status badge; the title sits inside the gold
          L-corner frame; a leader line drops from the cluster's
          bottom edge toward the reticle. */}
      <div
        className="home-v2-readout home-v2-readout--title"
        data-world-anchor={`${base}.title`}
        data-anchor-origin="bottom-center"
      >
        {t && (
          <div className="home-v2-readout__header" aria-hidden="true">
            <span className="home-v2-readout__chip home-v2-readout__chip--sector">{t.sector}</span>
            <span className="home-v2-readout__chip-sep">{"//"}</span>
            <span className="home-v2-readout__chip home-v2-readout__chip--callsign">
              {t.callsign}
            </span>
            <span className="home-v2-readout__chip-spacer" />
            <span className="home-v2-readout__chip home-v2-readout__chip--code">{t.code}</span>
            <span className="home-v2-readout__chip-dot" aria-hidden="true">
              ·
            </span>
            <span className="home-v2-readout__chip home-v2-readout__chip--metric">{t.metric}</span>
            <span className="home-v2-readout__badge">
              <span className="home-v2-readout__badge-tick" aria-hidden="true" />
              {t.status}
            </span>
          </div>
        )}
        <div className="home-v2-readout__frame">
          <span
            className="home-v2-readout__corner home-v2-readout__corner--tl"
            aria-hidden="true"
          />
          <span
            className="home-v2-readout__corner home-v2-readout__corner--tr"
            aria-hidden="true"
          />
          <h2
            className="home-v2-readout__title home-v2-copy-title home-v2-station-title"
            dangerouslySetInnerHTML={{ __html: content.titleHtml }}
          />
          <span
            className="home-v2-readout__corner home-v2-readout__corner--bl"
            aria-hidden="true"
          />
          <span
            className="home-v2-readout__corner home-v2-readout__corner--br"
            aria-hidden="true"
          />
        </div>
        <span className="home-v2-readout__leader home-v2-readout__leader--down" aria-hidden="true">
          <span className="home-v2-readout__leader-node" />
        </span>
      </div>

      {/* ── Support cluster ───────────────────────────────────────
          Calm sentence-case mono caption that sits below the reticle.
          A short, soft leader rises toward the reticle so the cluster
          stays visually tethered to the gate centre without reading
          as a telemetry stamp. The earlier `SCAN :: <STATUS> ——`
          prefix was removed (W1, plan 03adb0dd): support is now just
          the support sentence so the copy can carry the weight, with
          gold <em> for the accent words. */}
      {content.supportHtml && (
        <div
          className="home-v2-readout home-v2-readout--support"
          data-world-anchor={`${base}.support`}
          data-anchor-origin="top-center"
        >
          <span className="home-v2-readout__leader home-v2-readout__leader--up" aria-hidden="true">
            <span className="home-v2-readout__leader-node" />
          </span>
          <p
            className="home-v2-readout__support home-v2-copy-body home-v2-station-support"
            dangerouslySetInnerHTML={{ __html: content.supportHtml }}
          />
        </div>
      )}
    </>
  );
}
