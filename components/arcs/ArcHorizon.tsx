import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcHoloStageMount } from "./ArcHoloStageMount";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  HORIZON_VB,
  agentRun,
  checksAt,
  gateAt,
  horizonDust,
  horizonGrid,
  horizonSeats,
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
 * ArcHorizon — the same stretch of time, twice (ADR-130, redrawn in U1). Two
 * lanes over one isometric datum. Far and above, a tool you operate: short
 * runs, a person after every one, until the repetition is the point. Near and
 * on the plane, an agent on one long task — a person sets the goal and the
 * checks, the run passes three GATE FRAMES standing on the floor (it checks
 * its work, it steps back and retries, it stops and asks), and a person judges
 * the end. The long gold run is the drawing's one bright object.
 *
 * ⚠ THE DIAL'S LAW FOR EVERY MARK (ADR-106): a FILLED node is a person's
 * hand, an OPEN one the model. That is the whole reading — eight filled nodes
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
  const grid = horizonGrid();
  const seats = horizonSeats(operated.steps, agent.gates);
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
          {/* Two rails and three standing gates, turned (ADR-130 U2). ⚠ The
              dial's law travels with them: a FILLED node is a person's hand
              and an OPEN one the model, which is the whole reading and needs
              no legend (ADR-106). */}
          <ArcHoloStageMount
            scene={{
              kind: "horizon",
              data: {
                operated: { steps: operated.steps },
                agent: { gates: agent.gates.map((g) => ({ kind: g.kind, at: g.at })) },
              },
            }}
            labels={[
              { id: "operated", text: operated.label, priority: 0 },
              { id: "agent", text: agent.label, priority: 0 },
              /* ⚠ THE GATES OUTRANK THE TWO PEOPLE AT THE ENDS. They are what
                 this beat argues — the agent checks, retries and asks — and on
                 the first live shoot all three dropped while "Jij zet het doel"
                 kept its slot. A drop rule is only as good as its order. */
              ...agent.gates.map((g) => ({
                id: g.kind,
                text: g.label,
                by: (g.kind === "ask" ? "person" : "model") as "person" | "model",
                priority: 1,
              })),
              { id: "start", text: agent.start, by: "person" as const, priority: 2 },
              { id: "end", text: agent.end, by: "person" as const, priority: 2 },
              /* ⚠ LETTERED ONCE, on the last check. Eight repetitions of the
                 same three words along a lane is the map city's plaque defect
                 in a new place; the eight filled nodes already say how often. */
              {
                id: `check-${operated.steps - 1}`,
                text: operated.check,
                by: "person" as const,
                priority: 4,
              },
              { id: "from", text: axis.from, priority: 5 },
              { id: "to", text: axis.to, priority: 5 },
            ]}
            gutters={{ top: 8, bottom: 8 }}
          />
          <div className="arc-hz__stage">
            <svg
              className="arc-hz__svg"
              viewBox={`0 0 ${HORIZON_VB.w} ${HORIZON_VB.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {grid.along.map((d, i) => (
                <path key={`ga${i}`} className="arc-hz__grat" d={d} />
              ))}
              {grid.across.map((d, i) => (
                <path key={`gc${i}`} className="arc-hz__grat" d={d} />
              ))}
              {horizonDust().map((p, i) => (
                <rect key={`d${i}`} className="arc-hz__mote" x={p.x} y={p.y} width="1" height="1" />
              ))}
              {operatedRuns(operated.steps).map((d, i) => (
                <path key={`s${i}`} className="arc-hz__step" d={d} />
              ))}
              {agent.gates.map((g) => {
                const gate = gateAt(g.at);
                return (
                  <g key={g.kind} data-horizon-gate={g.kind}>
                    <path className="arc-hz__drop" d={gate.drop} />
                    <path className="arc-hz__gate-frame" d={gate.frame} />
                  </g>
                );
              })}
              {loop ? (
                <>
                  <path className="arc-hz__loop" d={loop.loop} />
                  <path className="arc-hz__loop" d={loop.head} />
                </>
              ) : null}
              <path className="arc-hz__run" d={agentRun()} pathLength={100} />
            </svg>

            {/* The operated lane: a person after every step. */}
            <span className="arc-hz__track" style={seat(seats.operatedLabel)}>
              {operated.label}
            </span>
            {seats.checks.map((p, i) => (
              <i
                key={`c${i}`}
                className="arc-hz__node"
                data-horizon-by="person"
                aria-hidden="true"
                style={seat(p)}
              />
            ))}
            {/* ⚠ LETTERED ONCE, at the last check. Eight repetitions of the
                same three words along an isometric lane is the map city's
                plaque defect in a new place; the eight filled nodes already
                say how often, and the phone list carries the sentence. */}
            <span className="arc-hz__check" style={seat(seats.check)}>
              {operated.check}
            </span>

            {/* The agent's lane: two people at the ends, three gates between. */}
            <span
              className="arc-hz__track"
              data-horizon-track="agent"
              style={seat(seats.agentLabel)}
            >
              {agent.label}
            </span>
            {seats.agentEnds.map((p, i) => (
              <i
                key={`e${i}`}
                className="arc-hz__node"
                data-horizon-by="person"
                aria-hidden="true"
                style={seat(p)}
              />
            ))}
            {agent.gates.map((g, i) => (
              <span key={g.kind}>
                <i
                  className="arc-hz__node"
                  data-horizon-by={g.kind === "ask" ? "person" : "model"}
                  data-horizon-gate={g.kind}
                  aria-hidden="true"
                  style={seat(seats.gates[i])}
                />
                <span
                  className="arc-hz__gate"
                  data-horizon-gate={g.kind}
                  style={seat(seats.gateLabels[i])}
                >
                  {g.label}
                </span>
              </span>
            ))}
            <span className="arc-hz__person" style={seat(seats.start)}>
              {agent.start}
            </span>
            <span className="arc-hz__person arc-hz__person--end" style={seat(seats.end)}>
              {agent.end}
            </span>
            <span className="arc-hz__axislbl" style={seat(seats.from)}>
              {axis.from}
            </span>
            <span className="arc-hz__axislbl arc-hz__axislbl--end" style={seat(seats.to)}>
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
