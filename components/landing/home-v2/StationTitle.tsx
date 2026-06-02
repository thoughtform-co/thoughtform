"use client";

import type { NodeContent } from "@/lib/home-v2/corridorMap";

/**
 * StationTitle — frameless section copy that STRADDLES the central
 * brandmark/reticle at each parked gate (Navigate / Encode / Build).
 *
 * Two world-anchored elements, positioned + faded per frame by
 * useWorldDomTracker against `{base}.title` and `{base}.support` (defined
 * in sceneGeom's COPY_ANCHORS):
 *   - the TITLE sits just ABOVE the reticle  (`bottom-center` origin)
 *   - the SUPPORT line sits just BELOW it    (`top-center` origin)
 *
 * No card, scrim, corner brackets, or tether — the gold text-shadow glow
 * (in home-v2.css) reads the copy as "lit by the gate" against the
 * starfield. The kicker is intentionally dropped (it duplicated the
 * title's verb). `content` comes straight off the corridor-map node.
 */

interface StationTitleProps {
  content: NodeContent;
  /** Anchor id base — `{base}.title` / `{base}.support` resolve in COPY_ANCHORS. */
  base: "navigate" | "diagnostic" | "intelligence";
}

export function StationTitle({ content, base }: StationTitleProps) {
  return (
    <>
      <h2
        className="home-v2-copy-title home-v2-station-title"
        data-world-anchor={`${base}.title`}
        data-anchor-origin="bottom-center"
        dangerouslySetInnerHTML={{ __html: content.titleHtml }}
      />
      {content.supportHtml && (
        <p
          className="home-v2-copy-body home-v2-station-support"
          data-world-anchor={`${base}.support`}
          data-anchor-origin="top-center"
          dangerouslySetInnerHTML={{ __html: content.supportHtml }}
        />
      )}
    </>
  );
}
