import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { Absorption } from "./figures/absorption/Absorption";
import { Logic } from "./figures/logic/Logic";
import { Timeline } from "./figures/timeline/Timeline";

/**
 * ArcFigure — the `figure` kind (ADR-156 U3): the section head, then one
 * drawing from the figure registry at the band's width, on the framing's one
 * projection. Every figure is server-rendered and stateless; its words are
 * the record's, its geometry its own model's.
 */
export function ArcFigure({
  section,
  index,
  motion = "reveal",
}: {
  section: ArcSectionOf<"figure">;
  index: number;
  motion?: ArcMotion;
}) {
  const spec = section.figure;
  return (
    <ArcBeat
      id={section.id}
      kind="figure"
      className="arc-section arc-sec arc-sec--figure"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="figure"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-fig arc-reveal" data-fig-id={spec.id} {...rung(motion, 0.14)}>
          {spec.id === "timeline" ? <Timeline spec={spec} /> : null}
          {spec.id === "absorption" ? <Absorption spec={spec} /> : null}
          {spec.id === "logic" ? <Logic spec={spec} /> : null}
        </div>
      </div>
    </ArcBeat>
  );
}
