import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcClipLoop } from "./ArcClipLoop";
import { ArcDecodeTitle, ArcTypeCopy } from "./ArcDecodeText";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

/**
 * ArcInterstitial — a quiet full-bleed band carrying one display line
 * in the station voice, scaled up: chapter `question`, jumbo `callout`,
 * or `quote` with a mono attribution under a short gold rule. Emphasis
 * is upright gold (`em`) — the Shards italics never port.
 *
 * `chapter` (ADR-153) is the same beat for a board's page: a band the
 * height of its content, set left, a part ruler above the line and, when
 * the part has one, its index under it (U1).
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
        {section.chapter ? (
          <div className="arc-inter__ruler" aria-hidden="true">
            <span className="arc-inter__part">
              Part {String(section.chapter.n).padStart(2, "0")} /{" "}
              {String(section.chapter.of).padStart(2, "0")}
            </span>
            <span className="arc-inter__ticks">
              {Array.from({ length: section.chapter.of }, (_, i) => (
                <span
                  key={i}
                  className="arc-inter__tick"
                  data-on={i < section.chapter!.n ? "" : undefined}
                />
              ))}
            </span>
          </div>
        ) : null}
        {section.eyebrow ? <p className="arc-desig arc-inter__eyebrow">{section.eyebrow}</p> : null}
        {/* The silent loop (ADR-143 U7), above the line it pictures. Absent,
            nothing is drawn: a beat with no file is the line alone. */}
        {section.clip ? (
          <figure className="arc-inter__clip">
            <ArcClipLoop clip={section.clip} />
          </figure>
        ) : null}
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
        {/* The part's index (ADR-153 U1): its beats as Linear's
            mono-numbered columns, each a link down the page. */}
        {section.index ? (
          <nav
            className="arc-inter__index"
            aria-label={`In this part: ${arcTitleText(section.line)}`}
          >
            <ol>
              {section.index.map((row) => (
                <li key={row.href}>
                  <a href={row.href}>
                    <span className="arc-inter__index-n">{row.n}</span>
                    {row.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
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
