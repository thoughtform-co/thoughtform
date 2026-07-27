import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcTitleText, arcTitleText } from "./chrome";

/**
 * ArcInterstitial — a quiet full-bleed band carrying one display line
 * in the station voice, scaled up: chapter `question`, jumbo `callout`,
 * or `quote` with a mono attribution under a short gold rule. Emphasis
 * is upright gold (`em`) — the Shards italics never port.
 */
export function ArcInterstitial({ section }: { section: ArcSectionOf<"interstitial"> }) {
  return (
    <section
      id={section.id}
      className={`arc-section arc-inter arc-inter--${section.variant}`}
      aria-label={section.ariaLabel ?? arcTitleText(section.line)}
    >
      <div className="arc-band arc-inter__band arc-reveal">
        {section.eyebrow ? <p className="arc-desig arc-inter__eyebrow">{section.eyebrow}</p> : null}
        <p className="arc-inter__line">
          <ArcTitleText title={section.line} />
        </p>
        {section.subline ? <p className="arc-inter__subline">{section.subline}</p> : null}
        {section.attribution ? (
          <p className="arc-inter__attribution">
            <span className="arc-inter__rule" aria-hidden="true" />
            {section.attribution}
          </p>
        ) : null}
      </div>
    </section>
  );
}
