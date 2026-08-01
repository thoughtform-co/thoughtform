import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcPortraitProps {
  section: ArcSectionOf<"portrait">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcPortrait — portrait in a corner-bracketed frame (the HUD corner
 * idiom) beside bio paragraphs and a mono meta list.
 *
 * Terminal: the frame is an aperture (its four corner brackets ride the
 * opening edges, the caption-card law) and the copy column enters from
 * the right — the opposite dimension, so the two halves converge.
 */
export function ArcPortrait({ section, index, motion = "reveal" }: ArcPortraitProps) {
  const terminal = motion === "terminal";
  return (
    <ArcBeat
      id={section.id}
      kind="portrait"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="portrait"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-portrait arc-reveal">
          <figure
            className={`arc-portrait__frame${terminal ? " arc-ap" : ""}`}
            {...rung(motion, 0.2)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.image.src} alt={section.image.alt} loading="lazy" decoding="async" />
            <i className="arc-portrait__corner is-tl" aria-hidden="true" />
            <i className="arc-portrait__corner is-tr" aria-hidden="true" />
            <i className="arc-portrait__corner is-bl" aria-hidden="true" />
            <i className="arc-portrait__corner is-br" aria-hidden="true" />
          </figure>
          <div className="arc-portrait__copy">
            {section.bio.map((paragraph, pi) => (
              <p
                key={paragraph.slice(0, 32)}
                className="arc-prose"
                {...rung(motion, ladder(0.34, 0.05, pi, 0.48), 40)}
              >
                {paragraph}
              </p>
            ))}
            <dl className="arc-portrait__meta" {...rung(motion, 0.5, 0, 24)}>
              {section.meta.map((row) => (
                <div key={row.label} className="arc-portrait__meta-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
