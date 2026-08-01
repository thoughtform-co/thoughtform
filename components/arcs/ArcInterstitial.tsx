import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcDecodeTitle, ArcTypeCopy } from "./ArcDecodeText";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

/**
 * ArcInterstitial — a quiet full-bleed band carrying one display line
 * in the station voice, scaled up: chapter `question`, jumbo `callout`,
 * or `quote` with a mono attribution under a short gold rule. Emphasis
 * is upright gold (`em`) — the Shards italics never port.
 *
 * Terminal: a pure decode beat — one panel, no travel. The QUOTE variant
 * TYPES rather than scrambles: the glyph pool is mono caps, so sentence
 * case through it reads as noise — but the masthead law is absolute
 * (nothing comes into view except via the effect), and a quotation
 * being typed out is the honest register for someone else's voice.
 */
export function ArcInterstitial({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"interstitial">;
  motion?: ArcMotion;
}) {
  const quote = section.variant === "quote";
  return (
    <ArcBeat
      id={section.id}
      kind="interstitial"
      className={`arc-section arc-inter arc-inter--${section.variant}`}
      ariaLabel={section.ariaLabel ?? arcTitleText(section.line)}
      motion={motion}
    >
      <div
        className="arc-band arc-inter__band arc-reveal"
        {...(motion === "terminal" ? { "data-arc-still": "" } : {})}
        {...rung(motion, 0.1)}
      >
        {section.eyebrow ? <p className="arc-desig arc-inter__eyebrow">{section.eyebrow}</p> : null}
        <ArcDecodeTitle
          title={section.line}
          motion={motion}
          className="arc-inter__line"
          as="p"
          effect={quote ? "type" : "scramble"}
        />
        {section.subline ? (
          <ArcTypeCopy text={section.subline} motion={motion} className="arc-inter__subline" />
        ) : null}
        {section.attribution ? (
          <p className="arc-inter__attribution">
            <span className="arc-inter__rule" aria-hidden="true" />
            {section.attribution}
          </p>
        ) : null}
      </div>
    </ArcBeat>
  );
}
