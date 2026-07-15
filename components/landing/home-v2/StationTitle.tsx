"use client";

import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import type { NodeContent } from "@/lib/home-v2/corridorMap";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";

/**
 * StationTitle — celestial-navigation instrument readout for each
 * parked corridor gate (Navigate / Encode / Build).
 *
 * Two world-anchored clusters, positioned + faded per frame by
 * `useWorldDomTracker` against `{base}.title` and `{base}.support`
 * (defined in `sceneGeom.COPY_ANCHORS`):
 *
 *   - Desktop (Linear-style two-column header, 2026-06-08):
 *       title cluster top-LEFT of the gate, support cluster top-RIGHT,
 *       both anchored along the same upper Y band. Frees the lower
 *       half of the frame for the instrument (gimbal sphere, stack
 *       fan, etc.) and gives the copy a generous editorial rhythm.
 *   - Mobile: keeps the prior straddle (title above / support below
 *       the reticle) with vertical leaders, so the centred mobile
 *       composition still reads as one navigation instrument.
 *
 * Each cluster is a bracketed mono HUD readout in the v7 instrument
 * grammar (gold L-corner brackets, mono header chips, status badge).
 * Mobile keeps the small leader line + diamond node to bind the
 * cluster to the reticle; desktop drops the leaders because the
 * clusters no longer point at the reticle.
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
  const isMobile = useDeviceTier() === "mobile";
  const titleOrigin = isMobile ? "bottom-center" : "top-left";
  const supportOrigin = isMobile ? "top-center" : "top-left";
  const layoutClass = isMobile ? "" : " home-v2-readout--twocol";
  const supportHtml = isMobile && content.floorHtml ? content.floorHtml : content.supportHtml;

  return (
    <>
      {/* ── Title cluster ──────────────────────────────────────────
          Desktop (Linear-style, 2026-06-08 follow-up): the telemetry
          chip row was removed so the title text top-aligns cleanly
          with the support paragraph on the right. Only the corner
          brackets + title remain — clean, large, top-LEFT of the gate.
          Mobile: above the reticle (origin bottom-center) with the
          legacy chip row + vertical leader hinting at the reticle. */}
      <div
        className={`home-v2-readout home-v2-readout--title${layoutClass}`}
        data-world-anchor={`${base}.title`}
        data-anchor-origin={titleOrigin}
      >
        {isMobile && t && (
          // Mobile quality pass (2026-07-15): the pre-pass chip row
          // packed sector + callsign + code + metric + status into a
          // single `white-space: nowrap` flex row that overflowed the
          // 380px mobile container. Simplified to sector + callsign +
          // status only — the `code` and `metric` chips were literal
          // duplicates of `sector` / `status` in the corridor map, so
          // dropping them removes redundancy AND stops the wrap.
          <div className="home-v2-readout__header" aria-hidden="true">
            <span className="home-v2-readout__chip home-v2-readout__chip--sector">{t.sector}</span>
            <span className="home-v2-readout__chip-sep">{"//"}</span>
            <span className="home-v2-readout__chip home-v2-readout__chip--callsign">
              {t.callsign}
            </span>
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
        {isMobile && (
          <span
            className="home-v2-readout__leader home-v2-readout__leader--down"
            aria-hidden="true"
          >
            <span className="home-v2-readout__leader-node" />
          </span>
        )}
      </div>

      {/* ── Support cluster ────────────────────────────────────────
          Desktop: top-RIGHT band of the gate, paired with the title
          column. Mobile: below the reticle with a vertical up-leader. */}
      {supportHtml && (
        <div
          className={`home-v2-readout home-v2-readout--support${layoutClass}`}
          data-world-anchor={`${base}.support`}
          data-anchor-origin={supportOrigin}
        >
          {isMobile && (
            <span
              className="home-v2-readout__leader home-v2-readout__leader--up"
              aria-hidden="true"
            >
              <span className="home-v2-readout__leader-node" />
            </span>
          )}
          <p
            className="home-v2-readout__support home-v2-copy-body home-v2-station-support"
            dangerouslySetInnerHTML={{ __html: supportHtml }}
          />
          {/* Mobile Build-park case index (ADR-033): capable phones run
              the real corridor but get no cases orbit (gate parity with
              the CTA layer), so the four production cases surface here
              as static mini-cards riding the same world anchor + fade
              as the support copy. Non-interactive by design.
              Mobile quality pass (2026-07-15): the plain mono chips
              were upgraded to two-line cards (codename + tagline) that
              echo the desktop `ArcCasesCard` grammar — same 2x2 grid
              feel, gold ordinal, dawn codename, muted tagline. */}
          {isMobile && base === "intelligence" && (
            <ul className="home-v2-case-cards" aria-label="Production cases">
              {PROJECT_CASES.map((projectCase) => (
                <li key={projectCase.id} className="home-v2-case-cards__card">
                  <span className="home-v2-case-cards__index">{projectCase.index}</span>
                  <span className="home-v2-case-cards__codename">
                    {projectCase.codename.toUpperCase()}
                  </span>
                  <span className="home-v2-case-cards__tagline">{projectCase.tagline}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
