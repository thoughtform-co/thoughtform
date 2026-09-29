import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { CircuitDrawing } from "./circuit/CircuitDrawing";
import { circuitGeom } from "./circuit/circuitLayout";

interface ArcCircuitProps {
  section: ArcSectionOf<"circuit">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcCircuit — ONE LAYER, EVERY WORKFLOW (ADR-133 U2): a map of the client's
 * marketing OS. Each workflow is a small configuration in the restored board's
 * shape, its card the board's own card, all wired to the OS at the centre.
 *
 * ⚠ SERVER, NO STATE, NO SCRIPT. ADR-133's first two cuts ran this beat as the
 * third pose of one drawing in a pinned scene; U2 (owner, 2026-09-29) put
 * "today" back on the `board`, moved "your team owns it" into the horizon and
 * asked for this one as its own picture, so the scene and its runway are gone.
 * The arrival is the page's plain reveal.
 *
 * Above 960px the drawing; below it a short ruled list, because a 1400-unit
 * map at 390px paints its type at 4px.
 */
export function ArcCircuit({ section, index, motion = "reveal" }: ArcCircuitProps) {
  const geom = circuitGeom(section);
  return (
    <ArcBeat
      id={section.id}
      kind="circuit"
      className="arc-section arc-sec arc-sec--circuit"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="circuit"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
      </div>
      <div className="arc-band">
        <figure
          className="arc-cir arc-cir--map arc-reveal"
          data-cir-state="a"
          role="group"
          aria-label={section.alt}
          {...rung(motion, 0.14)}
        >
          <CircuitDrawing geom={geom} uid={section.id} label={section.alt} />
        </figure>
        <div className="arc-cir-list" data-cir-list="map">
          <dl className="arc-cir-list__rows">
            <div data-cir-os="">
              <dt>{section.os.key}</dt>
              <dd>
                <strong>{section.os.name}</strong>
                <span className="arc-cir-list__was">{section.os.line}</span>
              </dd>
            </div>
            {section.configs.map((c) => (
              <div key={c.id}>
                <dt>{c.name}</dt>
                <dd>{c.line}</dd>
              </div>
            ))}
            <div data-cir-future="">
              <dt>{section.socket.key}</dt>
              <dd>{section.socket.name}</dd>
            </div>
          </dl>
        </div>
      </div>
    </ArcBeat>
  );
}
