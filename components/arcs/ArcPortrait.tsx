import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

interface ArcPortraitProps {
  section: ArcSectionOf<"portrait">;
  index: number;
}

/**
 * ArcPortrait — portrait in a corner-bracketed frame (the HUD corner
 * idiom) beside bio paragraphs and a mono meta list.
 */
export function ArcPortrait({ section, index }: ArcPortraitProps) {
  return (
    <section
      id={section.id}
      className="arc-section arc-sec"
      aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
    >
      <div className="arc-band">
        <ArcSectionHead head={section.head} kind="portrait" index={index} sectionId={section.id} />
        <div className="arc-portrait arc-reveal">
          <figure className="arc-portrait__frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.image.src} alt={section.image.alt} loading="lazy" decoding="async" />
            <i className="arc-portrait__corner is-tl" aria-hidden="true" />
            <i className="arc-portrait__corner is-tr" aria-hidden="true" />
            <i className="arc-portrait__corner is-bl" aria-hidden="true" />
            <i className="arc-portrait__corner is-br" aria-hidden="true" />
          </figure>
          <div className="arc-portrait__copy">
            {section.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="arc-prose">
                {paragraph}
              </p>
            ))}
            <dl className="arc-portrait__meta">
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
    </section>
  );
}
