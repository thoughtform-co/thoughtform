import type { CSSProperties } from "react";

import { band, housing } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  AXIS_END_X,
  AXIS_TOP_Y,
  AXIS_X,
  FLOOR_Y,
  GRATICULE,
  STAGE_BOXES,
  STAGE_CUT,
  STAGE_HEAD,
  STAGES_VB,
  TICK_LEN,
  floorTicks,
  stageFraction,
  stageTagSeat,
} from "./framing/stagesLayout";

interface ArcStagesProps {
  section: ArcSectionOf<"stages">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }) => ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * ArcStages — a prompt, a tool, an agent, each running longer without you
 * (ADR-130). The Moira workshop's opening picture in the house's register:
 * three machined housings standing on a graticule over the dot matrix, the
 * width how long each runs without you and the height how much of the work it
 * holds, beside three rows in the plates' own head-band material that say
 * what each one is on this client's own work.
 *
 * ⚠ GOLD BUYS ONE THING: the agent's housing (and its row's lit band). The
 * other two are the plate and the seam, and their rows are ring-only
 * (`--tl-lit: 0`, ADR-089 U4: the open one filled, the rest outlined).
 *
 * ⚠ THE SVG LETTERS NOTHING, AND NOTHING CARRIES A `transform`. The tags and
 * the axis words are DOM on their own beds, seated by fraction; the SVG is
 * `preserveAspectRatio="none"` inside a stage that holds its crop's aspect, so
 * a fraction of the stage IS a fraction of the drawing.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-stages-*` only.
 */
export function ArcStages({ section, index, motion = "reveal" }: ArcStagesProps) {
  const { stages, axes, ends } = section;
  const last = STAGE_BOXES[2];
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
                {GRATICULE.map((y) => (
                  <line
                    key={`g${y}`}
                    className="arc-floor__grat"
                    x1={AXIS_X}
                    y1={y}
                    x2={AXIS_END_X}
                    y2={y}
                  />
                ))}
                {floorTicks().map((x) => (
                  <line
                    key={`t${x}`}
                    className="arc-floor__tick"
                    x1={x}
                    y1={FLOOR_Y}
                    x2={x}
                    y2={FLOOR_Y + TICK_LEN}
                  />
                ))}
                <line
                  className="arc-floor__axis"
                  x1={AXIS_X}
                  y1={FLOOR_Y}
                  x2={AXIS_END_X}
                  y2={FLOOR_Y}
                />
                <line
                  className="arc-floor__axis"
                  x1={AXIS_X}
                  y1={FLOOR_Y}
                  x2={AXIS_X}
                  y2={AXIS_TOP_Y}
                />
                <path
                  className="arc-floor__axis"
                  d={`M${AXIS_END_X - 8} ${FLOOR_Y - 5} L${AXIS_END_X} ${FLOOR_Y} L${AXIS_END_X - 8} ${FLOOR_Y + 5}`}
                />
                <path
                  className="arc-floor__axis"
                  d={`M${AXIS_X - 5} ${AXIS_TOP_Y + 8} L${AXIS_X} ${AXIS_TOP_Y} L${AXIS_X + 5} ${AXIS_TOP_Y + 8}`}
                />
                {STAGE_BOXES.map((b, i) => {
                  const stage = stages[i];
                  const outline = housing(b.x, b.y, b.w, b.h, STAGE_CUT);
                  return (
                    <g
                      key={stage.id}
                      className="arc-floor__housing"
                      data-stages-housing={stage.id}
                      data-stages-lit={stage.lit ? "" : undefined}
                    >
                      <path className="arc-floor__plate" d={outline} />
                      <path className="arc-floor__wash" d={outline} />
                      <path
                        className="arc-floor__band"
                        d={band(b.x, b.y, b.w, STAGE_HEAD, STAGE_CUT)}
                      />
                      <line
                        className="arc-floor__bandrule"
                        x1={b.x}
                        y1={b.y + STAGE_HEAD}
                        x2={b.x + b.w}
                        y2={b.y + STAGE_HEAD}
                      />
                      <path className="arc-floor__outline" d={outline} />
                      {/* The rule STOPS at the cut — run to the corner, it
                          overshoots into the notch (ADR-070 U13). */}
                      <line
                        className="arc-floor__rule"
                        x1={b.x}
                        y1={b.y + 1}
                        x2={b.x + b.w - STAGE_CUT}
                        y2={b.y + 1}
                      />
                    </g>
                  );
                })}
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
                style={seat(stageFraction((AXIS_X + last.x + last.w) / 2, FLOOR_Y + 24))}
              >
                {axes.time}
              </span>
              <span className="arc-floor__end" style={seat(stageFraction(AXIS_X, FLOOR_Y + 24))}>
                {ends.near}
              </span>
              <span
                className="arc-floor__end arc-floor__end--far"
                style={seat(stageFraction(last.x + last.w, FLOOR_Y + 24))}
              >
                {ends.far}
              </span>
              <span
                className="arc-floor__word arc-floor__word--work"
                style={seat(stageFraction(AXIS_X - 30, (AXIS_TOP_Y + FLOOR_Y) / 2))}
              >
                {axes.work}
              </span>
              <span
                className="arc-floor__end arc-floor__end--top"
                style={seat(stageFraction(AXIS_X, AXIS_TOP_Y - 16))}
              >
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
