import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  STAGES_VB,
  stageLeader,
  stageTagSeat,
  stagesAxes,
  stagesBoxes,
  stagesDust,
  stagesGrid,
  stagesWordSeats,
} from "./framing/stagesLayout";

interface ArcStagesProps {
  section: ArcSectionOf<"stages">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }) => ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * ArcStages — a prompt, a tool, an agent, each running longer without you
 * (ADR-130, redrawn in U1). Three wireframe prisms standing on a ruled datum
 * in the brandworld's own isometric register: the footprint along the time
 * axis is how long each runs without you, the height is how much of the work
 * it holds, and the hidden edges are dashed so a box reads as a machine
 * rather than as a flat hexagon. Beside it, three rows in the plates' own
 * head-band material that say what each one is on this client's own work.
 *
 * ⚠ GOLD BUYS ONE THING: the agent's prism (and its row's lit band). The
 * other two are the seam, and their rows are ring-only (`--tl-lit: 0`,
 * ADR-089 U4: the open one filled, the rest outlined).
 *
 * ⚠ THE SVG LETTERS NOTHING, AND NOTHING CARRIES A `transform`. The tags and
 * the axis words are DOM on their own beds, seated by fraction and joined to
 * their prism by a leader; the SVG is `preserveAspectRatio="none"` inside a
 * stage that holds its crop's aspect, so a fraction of the stage IS a
 * fraction of the drawing.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-stages-*` only.
 */
export function ArcStages({ section, index, motion = "reveal" }: ArcStagesProps) {
  const { stages, axes, ends } = section;
  const grid = stagesGrid();
  const axis = stagesAxes();
  const boxes = stagesBoxes();
  const words = stagesWordSeats();
  return (
    <ArcBeat
      id={section.id}
      kind="stages"
      className="arc-section arc-sec arc-sec--stages"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="stages"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-floor">
          <figure className="arc-floor__figure arc-reveal" {...rung(motion, 0.14)}>
            <div className="arc-floor__stage">
              <svg
                className="arc-floor__svg"
                viewBox={`0 0 ${STAGES_VB.w} ${STAGES_VB.h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {grid.along.map((d, i) => (
                  <path key={`ga${i}`} className="arc-floor__grat" d={d} />
                ))}
                {grid.across.map((d, i) => (
                  <path key={`gc${i}`} className="arc-floor__grat" d={d} />
                ))}
                {stagesDust().map((p, i) => (
                  <rect
                    key={`d${i}`}
                    className="arc-floor__mote"
                    x={p.x}
                    y={p.y}
                    width="1"
                    height="1"
                  />
                ))}
                {axis.ticks.map((d, i) => (
                  <path key={`t${i}`} className="arc-floor__tick" d={d} />
                ))}
                <path className="arc-floor__axis" d={axis.time} />
                <path className="arc-floor__axis" d={axis.work} />
                {/* ⚠ FARTHEST FIRST. SVG has no z-buffer, so the order the
                    prisms are written IS the order they occlude in. */}
                {boxes.map(({ i, paths }) => {
                  const stage = stages[i];
                  return (
                    <g
                      key={stage.id}
                      className="arc-floor__housing"
                      data-stages-housing={stage.id}
                      data-stages-lit={stage.lit ? "" : undefined}
                    >
                      <path className="arc-floor__hidden" d={paths.hidden} />
                      <path className="arc-floor__face" d={paths.top} />
                      <path className="arc-floor__edge" d={paths.visible} />
                    </g>
                  );
                })}
                {stages.map((stage, i) => (
                  <path key={`l${stage.id}`} className="arc-floor__leader" d={stageLeader(i)} />
                ))}
              </svg>
              {stages.map((stage, i) => (
                <span
                  key={stage.id}
                  className="arc-floor__tag"
                  data-stages-lit={stage.lit ? "" : undefined}
                  style={seat(stageTagSeat(i))}
                >
                  {stage.label}
                </span>
              ))}
              <span
                className="arc-floor__word arc-floor__word--time"
                style={seat(words.time)}
              >
                {axes.time}
              </span>
              <span className="arc-floor__end" style={seat(words.near)}>
                {ends.near}
              </span>
              <span className="arc-floor__end arc-floor__end--far" style={seat(words.far)}>
                {ends.far}
              </span>
              <span
                className="arc-floor__word arc-floor__word--work"
                style={seat(words.work)}
              >
                {axes.work}
              </span>
              <span className="arc-floor__end arc-floor__end--top" style={seat(words.top)}>
                {ends.top}
              </span>
            </div>
          </figure>
          <ol className="arc-floor__list">
            {stages.map((stage, i) => {
              const r = rung(motion, ladder(0.2, 0.08, i, 0.5), 0, 36);
              return (
                <li
                  key={stage.id}
                  className="arc-plate arc-steps__item arc-floor__row arc-reveal"
                  data-stages-row={stage.id}
                  {...r}
                  style={{ ...r.style, ...(stage.lit ? {} : { "--tl-lit": 0 }) } as CSSProperties}
                >
                  <header className="arc-plate__head">
                    <span className="arc-plate__kicker" data-lead={stage.lit || undefined}>
                      {stage.label}
                    </span>
                    <span className="arc-plate__name">{stage.name}</span>
                  </header>
                  <p className="arc-steps__body">{stage.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </ArcBeat>
  );
}
