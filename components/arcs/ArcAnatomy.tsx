import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcAnatomyProps {
  section: ArcSectionOf<"anatomy">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcAnatomy — labelled rows under an optional filled-gold chip badge
 * (the card-face chip grammar at DOM scale): mono `dt` labels left,
 * body `dd` right, dashed gold separators.
 *
 * Terminal rungs: the badge drops in from above as chrome (rung 0.10,
 * so it leaves near-last), the row list enters from the left. The list
 * is ONE panel, not one per row — its dashed separators are hairlines,
 * and hairlines take the flicker without the lateral tear.
 */
export function ArcAnatomy({ section, index, motion = "reveal" }: ArcAnatomyProps) {
  return (
    <ArcBeat
      id={section.id}
      kind="anatomy"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        {section.badge ? (
          <span className="arc-badge arc-reveal" {...rung(motion, 0.1, 0, -22)}>
            <i className="arc-badge__dia" aria-hidden="true" />
            {section.badge}
          </span>
        ) : null}
        <ArcSectionHead
          head={section.head}
          kind="anatomy"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <dl className="arc-anatomy arc-reveal" {...rung(motion, 0.18, -36)}>
          {section.rows.map((row) => (
            <div key={row.id} className="arc-anatomy__row">
              <dt>{row.label}</dt>
              <dd>{row.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ArcBeat>
  );
}
