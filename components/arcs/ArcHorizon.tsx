import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  AGENT_RUN,
  AXIS,
  HORIZON_VB,
  TRACK_A_Y,
  TRACK_B_Y,
  along,
  checksAt,
  horizonFraction,
  operatedRuns,
  retryLoop,
} from "./framing/horizonLayout";

interface ArcHorizonProps {
  section: ArcSectionOf<"horizon">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }) => ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * ArcHorizon — the same stretch of time, twice (ADR-130). Above, a tool you
 * operate: short runs, a person after every one, until the repetition is the
 * point. Below, an agent on one long task: a person sets the goal and the
 * checks, the run passes the model's own two gates (it checks its work, it
 * steps back and retries), stops for a person once, and a person judges the
 * end. The long gold run is the drawing's one bright object.
 *
 * ⚠ THE DIAL'S LAW FOR EVERY MARK (ADR-106): a FILLED node is a person's
 * hand, an OPEN one the model. That is the whole reading — nine filled nodes
 * above, two open gates below — and it needs no legend.
 *
 * ⚠ THE NODES ARE DOM, seated by fraction, so they stay 7px at every width
 * and nothing on the figure carries a `transform`. Below 900px the drawing
 * gives way to two plain lists (Moira's own fallback).
 *
 * ⚠ SERVER, NO STATE. `data-horizon-*` only.
 */
export function ArcHorizon({ section, index, motion = "reveal" }: ArcHorizonProps) {
  const { axis, operated, agent, note } = section;
  const checks = checksAt(operated.steps);
  const retry = agent.gates.find((g) => g.kind === "retry");
  const loop = retry ? retryLoop(retry.at) : null;
  return (
    <ArcBeat
      id={section.id}
      kind="horizon"
      className="arc-section arc-sec arc-sec--horizon"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="horizon"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-hz arc-reveal" data-horizon-figure="" {...rung(motion, 0.14)}>
          <div className="arc-hz__stage">
            <svg
              className="arc-hz__svg"
              viewBox={`0 0 ${HORIZON_VB.w} ${HORIZON_VB.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {checks.map((cx) => (
                <line
                  key={`g${cx}`}
                  className="arc-hz__grat"
                  x1={cx}
                  y1={TRACK_A_Y - 36}
                  x2={cx}
                  y2={AXIS.y}
                />
              ))}
              {operatedRuns(operated.steps).map((r) => (
                <line
                  key={`s${r.x1}`}
                  className="arc-hz__step"
                  x1={r.x1}
                  y1={TRACK_A_Y}
                  x2={r.x2}
                  y2={TRACK_A_Y}
                />
              ))}
              <path
                className="arc-hz__run"
                d={`M${AGENT_RUN.x1} ${TRACK_B_Y} L${AGENT_RUN.x2} ${TRACK_B_Y}`}
                pathLength={100}
              />
              {loop ? (
                <>
                  <path className="arc-hz__loop" d={loop.loop} />
                  <path className="arc-hz__loop" d={loop.head} />
                </>
              ) : null}
              <line className="arc-hz__axis" x1={AXIS.x0} y1={AXIS.y} x2={AXIS.x1} y2={AXIS.y} />
            </svg>

            {/* The operated track: a person after every step. */}
            <span className="arc-hz__track" style={seat(horizonFraction(0, TRACK_A_Y))}>
              {operated.label}
            </span>
            {checks.map((cx) => (
              <span key={`c${cx}`}>
                <i
                  className="arc-hz__node"
                  data-horizon-by="person"
                  aria-hidden="true"
                  style={seat(horizonFraction(cx, TRACK_A_Y))}
                />
                <span className="arc-hz__check" style={seat(horizonFraction(cx, TRACK_A_Y + 14))}>
                  {operated.check}
                </span>
              </span>
            ))}

            {/* The agent's track: two people at the ends, three gates between. */}
            <span
              className="arc-hz__track"
              data-horizon-track="agent"
              style={seat(horizonFraction(0, TRACK_B_Y))}
            >
              {agent.label}
            </span>
            <i
              className="arc-hz__node"
              data-horizon-by="person"
              aria-hidden="true"
              style={seat(horizonFraction(AXIS.x0, TRACK_B_Y))}
            />
            <i
              className="arc-hz__node"
              data-horizon-by="person"
              aria-hidden="true"
              style={seat(horizonFraction(AXIS.x1, TRACK_B_Y))}
            />
            {agent.gates.map((g) => (
              <span key={g.kind}>
                <i
                  className="arc-hz__node"
                  data-horizon-by={g.kind === "ask" ? "person" : "model"}
                  data-horizon-gate={g.kind}
                  aria-hidden="true"
                  style={seat(horizonFraction(along(g.at), TRACK_B_Y))}
                />
                <span
                  className="arc-hz__gate"
                  data-horizon-gate={g.kind}
                  style={seat(horizonFraction(along(g.at), TRACK_B_Y - 16))}
                >
                  {g.label}
                </span>
              </span>
            ))}
            <span
              className="arc-hz__person"
              style={seat(horizonFraction(AXIS.x0 - 4, TRACK_B_Y + 18))}
            >
              {agent.start}
            </span>
            <span
              className="arc-hz__person arc-hz__person--end"
              style={seat(horizonFraction(AXIS.x1 + 4, TRACK_B_Y + 18))}
            >
              {agent.end}
            </span>
            <span className="arc-hz__axislbl" style={seat(horizonFraction(AXIS.x0, AXIS.y + 8))}>
              {axis.from}
            </span>
            <span
              className="arc-hz__axislbl arc-hz__axislbl--end"
              style={seat(horizonFraction(AXIS.x1, AXIS.y + 8))}
            >
              {axis.to}
            </span>
          </div>

          {/* The same picture as two lists, for a phone. */}
          <div className="arc-hz__lists">
            <div className="arc-hz__list">
              <span className="arc-hz__listhead">{operated.label}</span>
              <span className="arc-hz__listline">{operated.line}</span>
            </div>
            <div className="arc-hz__list" data-horizon-track="agent">
              <span className="arc-hz__listhead">{agent.label}</span>
              <ol className="arc-hz__liststeps">
                <li>{agent.start}</li>
                {agent.gates.map((g) => (
                  <li key={g.kind}>{g.label}</li>
                ))}
                <li>{agent.end}</li>
              </ol>
            </div>
          </div>
        </figure>
        {note ? (
          <p className="arc-footnote arc-reveal" {...rung(motion, 0.5, 0, 22)}>
            {note}
          </p>
        ) : null}
      </div>
    </ArcBeat>
  );
}
