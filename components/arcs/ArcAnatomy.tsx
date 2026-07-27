import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

interface ArcAnatomyProps {
  section: ArcSectionOf<"anatomy">;
  index: number;
}

/**
 * ArcAnatomy — labelled rows under an optional filled-gold chip badge
 * (the card-face chip grammar at DOM scale): mono `dt` labels left,
 * body `dd` right, dashed gold separators.
 */
export function ArcAnatomy({ section, index }: ArcAnatomyProps) {
  return (
    <section
      id={section.id}
      className="arc-section arc-sec"
      aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
    >
      <div className="arc-band">
        {section.badge ? (
          <span className="arc-badge arc-reveal">
            <i className="arc-badge__dia" aria-hidden="true" />
            {section.badge}
          </span>
        ) : null}
        <ArcSectionHead head={section.head} kind="anatomy" index={index} sectionId={section.id} />
        <dl className="arc-anatomy arc-reveal">
          {section.rows.map((row) => (
            <div key={row.id} className="arc-anatomy__row">
              <dt>{row.label}</dt>
              <dd>{row.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
