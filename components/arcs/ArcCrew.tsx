import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcCrewCase } from "./ArcCrewCase";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { Letter, Mark, Module, Wire } from "./circuit/CircuitDrawing";
import { crewGeom } from "./circuit/crewLayout";

interface ArcCrewProps {
  section: ArcSectionOf<"crew">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcCrew — THE CREW (ADR-133 U5): what it returned at Loop, one row per role
 * read left to right — who, then what is possible now, drawn as the quantity
 * it is and said in one line. Never a calculator. The circuit's own glyphs.
 *
 * ⚠ SERVER, NO STATE, NO SCRIPT. On a phone the drawing gives way to the same
 * record as one ruled list (a 1400-unit drawing at 390px paints at 4px).
 *
 * ⚠ `layout: "case"` (ADR-153 U5) sets the same record in the job cards'
 * housing instead (`ArcCrewCase`); absent, this drawing, byte-identical.
 */
export function ArcCrew({ section, index, motion = "reveal" }: ArcCrewProps) {
  if (section.layout === "case") {
    return <ArcCrewCase section={section} index={index} motion={motion} />;
  }
  const g = crewGeom(section);
  return (
    <ArcBeat
      id={section.id}
      kind="crew"
      className="arc-section arc-sec arc-sec--crew"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="crew"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
      </div>
      <div className="arc-band">
        <figure
          className="arc-cir arc-cir--crew arc-reveal"
          data-cir-state="a"
          {...rung(motion, 0.14)}
        >
          <svg
            className="arc-cir__svg"
            viewBox={`0 0 ${g.vb.w} ${g.vb.h}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label={section.alt}
          >
            {g.wires.map((w) => (
              <Wire key={w.id} w={w} />
            ))}
            {g.modules.map((m) => (
              <Module key={m.id} m={m} />
            ))}
            {g.marks.map((mark, i) => (
              <Mark key={i} mark={mark} />
            ))}
            {g.letters.map((l) => (
              <Letter key={l.slot} l={l} />
            ))}
          </svg>
        </figure>
        <div className="arc-cir-list" data-cir-list="crew">
          <dl className="arc-cir-list__rows">
            {section.rows.map((r) => (
              <div key={r.id}>
                <dt>{r.who}</dt>
                <dd>
                  <strong>{r.work}</strong> {r.line}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ArcBeat>
  );
}
