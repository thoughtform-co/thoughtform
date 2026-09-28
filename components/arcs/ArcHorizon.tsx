import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcHorizonProps {
  section: ArcSectionOf<"horizon">;
  index: number;
  motion?: ArcMotion;
}

/* The Moira workshop's own geometry (`loop-moira/lib/workshops/geometry.ts`
   §horizon), copied, never imported (ADR-106): two tracks on one time axis.
   Above the agent's line sit the gate labels, on it the gates, below it the
   start and end labels and the retry loop, so no two labels share a band.
   Everything left of x 170 is the track names. */
const W = 1200;
const H = 360;
const AXIS = { x0: 170, x1: 1150, y: 330 } as const;
const TRACK_A_Y = 96;
const TRACK_B_Y = 236;
const along = (t: number) => AXIS.x0 + t * (AXIS.x1 - AXIS.x0);
const checksAt = (steps: number) =>
  Array.from({ length: steps }, (_, i) => AXIS.x0 + ((i + 1) * (AXIS.x1 - AXIS.x0)) / steps);

const x = (u: number) => `${((u / W) * 100).toFixed(3)}%`;
const y = (u: number) => `${((u / H) * 100).toFixed(3)}%`;

/** A person: a head over shoulders, standing on the line at (cx, base). */
function Person({ cx, base, tone }: { cx: number; base: number; tone?: "lit" }) {
  return (
    <g className="arc-hzm__person" data-tone={tone} transform={`translate(${cx} ${base})`}>
      <circle cx="0" cy="-15" r="5.5" />
      <path d="M-9.5 1 a9.5 9.5 0 0 1 19 0 z" />
    </g>
  );
}

/**
 * ArcHorizon — the same stretch of time, twice (ADR-130 U5: the Moira
 * workshop's figure, ported). On the top track a person operates a tool, so a
 * person checks after every step: the people repeat until the repetition is
 * the point. On the bottom track an agent runs one long task between a person
 * who sets the goal and the checks and a person who judges the result, and in
 * between it passes three gates of its own: it checks its work, it steps back
 * and retries, and it stops and asks. That long gold run is the one bright
 * object.
 *
 * ⚠ U1/U2's isometric lanes, gate frames and hologram are gone (owner,
 * 2026-09-28: "because it's 3D it looks ugly"; "use the cleaner
 * visualization from the Moira workshop"). The record is unchanged, so every
 * arc that draws a horizon (Plopsa, Pandora) gets the same figure.
 *
 * A PICTURE OF THE ARGUMENT, NOT A MEASUREMENT: the axis has two words and no
 * scale. Lines and marks are SVG; every word is HTML placed over it by
 * percentage, so the type never scales. Below 900px it gives way to two lists.
 *
 * ⚠ SERVER, NO STATE. `data-horizon-*` only. The one `transform` is Moira's
 * person mark, a `<g>` translate that no overlap walk reads.
 */
export function ArcHorizon({ section, index, motion = "reveal" }: ArcHorizonProps) {
  const { axis, operated, agent, note } = section;
  const checks = checksAt(operated.steps);
  const [checkGate, retryGate, askGate] = agent.gates;
  const retryX = along(retryGate.at);
  const askX = along(askGate.at);

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
        <figure className="arc-hzm arc-reveal" data-horizon-figure="" {...rung(motion, 0.14)}>
          <div className="arc-hzm__stage">
            <svg
              className="arc-hzm__svg"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {/* The operated tool: short steps, a person after each. */}
              <g className="arc-hzm__steps">
                {checks.map((cx, i) => {
                  const from = i === 0 ? AXIS.x0 : checks[i - 1] + 14;
                  return <line key={cx} x1={from} y1={TRACK_A_Y} x2={cx - 14} y2={TRACK_A_Y} />;
                })}
              </g>
              {checks.map((cx) => (
                <Person key={cx} cx={cx} base={TRACK_A_Y} />
              ))}

              {/* The agent: one long run between two people, three gates. */}
              <Person cx={AXIS.x0} base={TRACK_B_Y} />
              <line
                className="arc-hzm__run"
                x1={AXIS.x0 + 16}
                y1={TRACK_B_Y}
                x2={AXIS.x1 - 16}
                y2={TRACK_B_Y}
              />
              <g className="arc-hzm__gates">
                {[checkGate, retryGate].map((g) => (
                  <line
                    key={g.kind}
                    x1={along(g.at)}
                    y1={TRACK_B_Y - 10}
                    x2={along(g.at)}
                    y2={TRACK_B_Y + 10}
                  />
                ))}
                <path
                  className="arc-hzm__loop"
                  d={`M${retryX} ${TRACK_B_Y + 12} C${retryX} ${TRACK_B_Y + 46}, ${retryX - 64} ${TRACK_B_Y + 46}, ${retryX - 64} ${TRACK_B_Y + 12}`}
                />
                <path
                  className="arc-hzm__loop"
                  d={`M${retryX - 70} ${TRACK_B_Y + 21} L${retryX - 64} ${TRACK_B_Y + 12} L${retryX - 58} ${TRACK_B_Y + 21}`}
                />
              </g>
              <Person cx={askX} base={TRACK_B_Y - 4} tone="lit" />
              <Person cx={AXIS.x1} base={TRACK_B_Y} />

              <line className="arc-hzm__axis" x1={AXIS.x0} y1={AXIS.y} x2={AXIS.x1} y2={AXIS.y} />
            </svg>

            <span className="arc-hzm__track" style={{ top: y(TRACK_A_Y) }}>
              {operated.label}
            </span>
            {checks.map((cx) => (
              <span
                key={cx}
                className="arc-hzm__check"
                style={{ left: x(cx), top: y(TRACK_A_Y + 14) }}
              >
                {operated.check}
              </span>
            ))}

            <span className="arc-hzm__track" data-track="agent" style={{ top: y(TRACK_B_Y) }}>
              {agent.label}
            </span>
            {agent.gates.map((g) => (
              <span
                key={g.kind}
                className="arc-hzm__gate"
                data-horizon-gate={g.kind}
                style={{ left: x(along(g.at)), top: y(TRACK_B_Y - 64) }}
              >
                {g.label}
              </span>
            ))}
            <span
              className="arc-hzm__who"
              style={{ left: x(AXIS.x0 + 18), top: y(TRACK_B_Y + 18) }}
            >
              {agent.start}
            </span>
            <span
              className="arc-hzm__who"
              data-at="end"
              style={{ right: x(W - AXIS.x1), top: y(TRACK_B_Y + 18) }}
            >
              {agent.end}
            </span>

            <span className="arc-hzm__axislabel" style={{ left: x(AXIS.x0), top: y(AXIS.y + 8) }}>
              {axis.from}
            </span>
            <span
              className="arc-hzm__axislabel"
              data-at="end"
              style={{ right: x(W - AXIS.x1), top: y(AXIS.y + 8) }}
            >
              {axis.to}
            </span>
          </div>

          {/* The same picture as two lists, for a phone. */}
          <div className="arc-hzm__lists">
            <div className="arc-hzm__list">
              <span className="arc-hzm__listhead">{operated.label}</span>
              <span className="arc-hzm__listline">{operated.line}</span>
            </div>
            <div className="arc-hzm__list" data-track="agent">
              <span className="arc-hzm__listhead">{agent.label}</span>
              <ol className="arc-hzm__liststeps">
                <li>{agent.start}</li>
                {agent.gates.map((g) => (
                  <li key={g.kind}>{g.label}</li>
                ))}
                <li>{agent.end}</li>
              </ol>
            </div>
          </div>

          {note ? <figcaption className="arc-hzm__caption">{note}</figcaption> : null}
        </figure>
      </div>
    </ArcBeat>
  );
}
