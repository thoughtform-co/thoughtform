import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
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
 * ArcCrew — THE CREW (ADR-133): the business case as a drawn record, never a
 * calculator (owner, 2026-09-28). Left, the shape the work took at Loop — a
 * few people, one configuration each, the output drawn as the quantity it is.
 * Right, the same shape at the client, its readouts framed and EMPTY: counted
 * from week one, never promised. The circuit's own glyph library, static.
 *
 * ⚠ SERVER, NO STATE, NO SCRIPT. On a phone the drawing gives way to the same
 * record as two ruled lists (a 1400-unit drawing at 390px paints at 4px).
 */
export function ArcCrew({ section, index, motion = "reveal" }: ArcCrewProps) {
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
          <h3 className="arc-cir-list__label">{section.record.label}</h3>
          <dl className="arc-cir-list__rows">
            {section.record.rows.map((r) => (
              <div key={r.id}>
                <dt>{r.who}</dt>
                <dd>
                  <strong>{r.value}</strong> {r.unit}
                  <span className="arc-cir-list__was">{r.config}</span>
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="arc-cir-list__label">{section.plan.label}</h3>
          <dl className="arc-cir-list__rows">
            {section.plan.rows.map((r) => (
              <div key={r.id}>
                <dt>{r.who}</dt>
                <dd>
                  <strong>{r.measure}</strong>
                  <span className="arc-cir-list__was">{r.source}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ArcBeat>
  );
}
