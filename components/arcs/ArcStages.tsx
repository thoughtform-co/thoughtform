import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcHoloStageMount } from "./ArcHoloStageMount";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  STAGES_VB,
  stageLeader,
  stageNameSeat,
  stagesAxes,
  stagesBoxes,
  stagesGrid,
  stagesWordSeats,
} from "./framing/stagesLayout";

interface ArcStagesProps {
  section: ArcSectionOf<"stages">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }, rot?: number) =>
  ({ "--ax": p.ax, "--at": p.at, ...(rot ? { "--rot": `${rot}deg` } : {}) }) as CSSProperties;

/**
 * ArcStages — a prompt, a tool, an agent, each running longer without you
 * (ADR-130, redrawn in U4 on the Moira workshop's own figure). One floor seen
 * from its front corner — the time axis up the right-hand edge, the work up
 * the left — and three blocks standing further along both, larger and taller
 * each time; the agent's, at the back, is the drawing's one gold object.
 * Beside it, three rows in the plates' head-band material that say what each
 * one is on this client's own work.
 *
 * ⚠ ONE PICTURE, TWO RENDERINGS. The SVG below is what a reader without
 * WebGL, a phone and the printed handout get; the hologram is the same crop
 * through a fixed parallel camera (`stageFit.ts`), mounted INSIDE the stage
 * so the two share one box. The words are these DOM spans in both.
 *
 * ⚠ THE SVG LETTERS NOTHING, AND NOTHING CARRIES A `transform`. The names sit
 * beside each block's right-hand edge (Moira's `plinthSide`) on a short tick;
 * the axis words run along their edges (a DOM `rotate`, lawful on a span).
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-stages-*` only.
 */
export function ArcStages({ section, index, motion = "reveal" }: ArcStagesProps) {
  const { stages, axes, ends, own } = section;
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
            <div
              className="arc-floor__stage"
              style={{ aspectRatio: `${STAGES_VB.w} / ${STAGES_VB.h}` }}
            >
              <ArcHoloStageMount
                scene={{
                  kind: "stages",
                  data: { stages: stages.map((s) => ({ id: s.id, lit: s.lit })) },
                }}
              />
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
                <path className="arc-floor__axis" d={axis.time} />
                <path className="arc-floor__axis" d={axis.work} />
                {/* ⚠ FARTHEST FIRST. SVG has no z-buffer, so the order the
                    blocks are written IS the order they occlude in, and the
                    faces are opaque so a nearer block covers a farther one. */}
                {boxes.map(({ i, paths }) => {
                  const stage = stages[i];
                  return (
                    <g
                      key={stage.id}
                      className="arc-floor__housing"
                      data-stages-housing={stage.id}
                      data-stages-lit={stage.lit ? "" : undefined}
                    >
                      <path className="arc-floor__face" data-face="left" d={paths.left} />
                      <path className="arc-floor__face" data-face="right" d={paths.right} />
                      <path className="arc-floor__face" data-face="top" d={paths.top} />
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
                  style={seat(stageNameSeat(i))}
                >
                  {stage.label}
                </span>
              ))}
              <span className="arc-floor__word" style={seat(words.time, -22)}>
                {axes.time} →
              </span>
              <span className="arc-floor__end arc-floor__end--far" style={seat(words.far)}>
                {ends.far}
              </span>
              <span className="arc-floor__word" style={seat(words.work, 22)}>
                ← {axes.work}
              </span>
              <span className="arc-floor__end arc-floor__end--top" style={seat(words.top)}>
                {ends.top}
              </span>
              <span className="arc-floor__end" style={seat(words.near)}>
                {ends.near}
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
                  {stage.body ? <p className="arc-steps__body">{stage.body}</p> : null}
                  {/* The client's own work at this stage (ADR-136): a fourth
                      line in the ROW, never on the plinth — the plinth's
                      labels are the walk's, and a label on a slanted face is
                      the plaque defect ADR-130 U1 closed. */}
                  {stage.example ? (
                    <span className="arc-floor__example" data-stages-example="">
                      {own ? <span className="arc-floor__own">{own}</span> : null}
                      {stage.example}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </ArcBeat>
  );
}
