import { Instrument } from "@/components/instrument/Instrument";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcInstrumentProps {
  section: ArcSectionOf<"instrument">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcInstrument — the instrument as an arc beat (ADR-154): the arc's own
 * head over one `Instrument`. The drawing lives in `components/instrument`,
 * because it is mounted beyond the arcs (the labs, the explainers); this is
 * the beat's frame around it and nothing more.
 */
export function ArcInstrument({ section, index, motion = "reveal" }: ArcInstrumentProps) {
  return (
    <ArcBeat
      id={section.id}
      kind="instrument"
      className="arc-section arc-sec arc-sec--instrument"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="instrument"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-instrument arc-reveal" {...rung(motion, 0.14)}>
          <Instrument
            record={section.record}
            altitude={section.altitude}
            focus={section.focus}
            picker={section.picker}
            id={`ins-${section.id}`}
          />
        </div>
      </div>
    </ArcBeat>
  );
}
