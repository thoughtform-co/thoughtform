import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcStepsVisualView } from "./ArcScanVisual";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcStepsProps {
  section: ArcSectionOf<"steps">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcSteps — the deliverables, as a stepped list beside a stage (ADR-103).
 *
 * LEFT: one row per item in the plates' own head-band material (`.arc-plate`
 * with only its head and a body line), so on the Trinny page the three phase
 * plates can collapse to their bands and travel here to BECOME these rows
 * with no change of material. RIGHT: the stages, one per item, each holding
 * that item's drawing.
 *
 * ⚠ SERVER, NO STATE, NO POINTER. The stepping is a scroll clock a route
 * writes onto custom properties (`--tl-lit` on a row's head, `--tl-row-h` on
 * a row, `--tl-vis` and `--tl-step` on a stage); with nothing written every
 * row is open and filled and every stage is shown, stacked — the static form
 * the phone, no-JS and reduced motion read.
 *
 * ⚠ `data-steps-*` ONLY. `data-arc-*` is the beat grammar
 * (`arc-terminal-markup` pins that reveal mode emits none of it), and this
 * leaf publishes its own channel the way the board publishes `data-board-*`.
 *
 * Terminal rungs: the rows rise in sequence from below (the plates' own rung),
 * the stages after them.
 */
export function ArcSteps({ section, index, motion = "reveal" }: ArcStepsProps) {
  return (
    <ArcBeat
      id={section.id}
      kind="steps"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="steps"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-steps" data-steps-n={section.items.length}>
          <ol className="arc-steps__list">
            {section.items.map((item, i) => (
              <li
                key={item.id}
                className="arc-plate arc-steps__item arc-reveal"
                data-steps-item={item.id}
                {...rung(motion, ladder(0.16, 0.08, i, 0.5), 0, 36)}
              >
                <header className="arc-plate__head">
                  <span className="arc-plate__kicker">{item.kicker}</span>
                  <span className="arc-plate__name">{item.name}</span>
                </header>
                <p className="arc-steps__body">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="arc-steps__stages">
            {section.items.map((item, i) => (
              <div
                key={item.id}
                className="arc-steps__stage arc-reveal"
                data-steps-stage={item.id}
                style={{ "--i": i } as CSSProperties}
                {...rung(motion, ladder(0.4, 0.06, i, 0.52), 24)}
              >
                <ArcStepsVisualView visual={item.visual} index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
