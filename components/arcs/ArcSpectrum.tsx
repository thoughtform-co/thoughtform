import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcHoloStageMount } from "./ArcHoloStageMount";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcSpectrumProps {
  section: ArcSectionOf<"spectrum">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcSpectrum — between two things (ADR-136): the Moira workshop's rail from
 * tool to collaborator, ported by hand onto the arcs' ink ramp. A rail with a
 * handle resting in the overlap, two bands under it, three columns under
 * those.
 *
 * ⚠ THE WORD FRAMES A BAND, NEVER THE MIDDLE (Moira's own law). A
 * collaborator is an intelligence too, so "intelligence" cannot be the name
 * of the point between the two ends: it is a band that reaches from the
 * collaborator's end, and software a band that reaches from the tool's; they
 * overlap where the middle column sits. The overlap, with the handle above
 * it, is the beat's one bright object. The middle column is marked by type
 * alone, no box.
 *
 * ⚠ THE HANDLE MOVES ONCE. Moira's drifts for ever; the house allows arrival
 * motion only (ADR-080), so it slides into the overlap on `.is-in` and rests,
 * and rests from the start under reduced motion.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-spectrum-*` only.
 *
 * ⚠ THE FIELD UNDER THE TRACK IS LIVE SINCE ADR-140: a particle lattice on
 * the tool's side dissolving into a cloud on the collaborator's, built from
 * the band boxes the mount measures here. The rail, the bands, the box, the
 * handle and every word are this DOM, in both modes.
 */
export function ArcSpectrum({ section, index, motion = "reveal" }: ArcSpectrumProps) {
  const { poles, middle, bands } = section;
  const [tool, collaborator] = poles;
  const cols = [
    { at: "start", label: tool.label, head: tool.head, lines: tool.lines },
    { at: "middle", label: middle.label, head: middle.head, line: middle.line },
    { at: "end", label: collaborator.label, head: collaborator.head, lines: collaborator.lines },
  ] as const;
  return (
    <ArcBeat
      id={section.id}
      kind="spectrum"
      className="arc-section arc-sec arc-sec--spectrum"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="spectrum"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-spectrum arc-reveal" data-spectrum-figure="" {...rung(motion, 0.14)}>
          <div className="arc-spectrum__track">
            <ArcHoloStageMount scene={{ kind: "spectrum" }} />
            <div
              className="arc-spectrum__rail"
              role="img"
              aria-label={`A line from ${tool.label} to ${collaborator.label}, with ${middle.label.toLowerCase()} between them, where ${bands.start.toLowerCase()} and ${bands.end.toLowerCase()} overlap`}
            >
              <span className="arc-spectrum__end" data-spectrum-end="start" aria-hidden="true" />
              <span className="arc-spectrum__end" data-spectrum-end="end" aria-hidden="true" />
              <span className="arc-spectrum__handle" aria-hidden="true" />
            </div>
            <div className="arc-spectrum__bands" aria-hidden="true">
              <span className="arc-spectrum__band" data-spectrum-band="start">
                <span className="arc-spectrum__bandlabel">{bands.start}</span>
              </span>
              <span className="arc-spectrum__band" data-spectrum-band="end">
                <span className="arc-spectrum__bandlabel">{bands.end}</span>
              </span>
            </div>
          </div>

          <div className="arc-spectrum__cols">
            {cols.map((col) => (
              <div key={col.at} className="arc-spectrum__col" data-spectrum-at={col.at}>
                <span className="arc-spectrum__label">{col.label}</span>
                <span className="arc-spectrum__head">{col.head}</span>
                {"lines" in col ? (
                  <ul className="arc-spectrum__lines">
                    {col.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="arc-spectrum__line">{col.line}</span>
                )}
              </div>
            ))}
          </div>
        </figure>
      </div>
    </ArcBeat>
  );
}
