import type { ArcHorizonUpstream, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { PERSON_MARK } from "./circuit/circuitGlyphData";
import {
  OWNED_AXIS,
  OWNED_H,
  OWNED_W,
  ownedAlong,
  ownedSpans,
  OWNED_TRACK_A_Y,
  OWNED_TRACK_B_Y,
  OWNED_ROW_HAND_Y,
  OWNED_ROW_GATE_Y,
} from "./framing/ownedLayout";

interface Props {
  section: ArcSectionOf<"horizon">;
  upstream: ArcHorizonUpstream;
  index: number;
  motion?: ArcMotion;
}

const x = (u: number) => `${((u / OWNED_W) * 100).toFixed(3)}%`;
const y = (u: number) => `${((u / OWNED_H) * 100).toFixed(3)}%`;

/** A person on a line, the horizon's own mark (Moira's). */
function Person({ cx, base }: { cx: number; base: number }) {
  return (
    <g className="arc-hzm__person" transform={`translate(${cx} ${base})`}>
      <circle cx="0" cy="-15" r="5.5" />
      <path d="M-9.5 1 a9.5 9.5 0 0 1 19 0 z" />
    </g>
  );
}

/** The owner's pixel bust, the board seat's own mark, in the plate's head. */
function Bust() {
  const c = 3;
  return (
    <svg
      className="arc-hzo__bust"
      viewBox={`0 0 ${7 * c} ${7 * c}`}
      width={7 * c}
      height={7 * c}
      aria-hidden="true"
    >
      {[...PERSON_MARK.sk, ...PERSON_MARK.sig].map(([col, row]) => (
        <rect key={`${col}-${row}`} x={col * c} y={row * c} width={c} height={c} />
      ))}
    </svg>
  );
}

/**
 * ArcHorizonOwned — YOUR TEAM OWNS IT (ADR-133 U2): the owner's plate beside
 * the horizon, re-cut for a proposal. Owner, 2026-09-29: "the owner gets more
 * time for more upstream work and the agent takes care of the rest … on the
 * left side, the owner panel, and on the right side, an adopted version of
 * those two timelines".
 *
 * THE SAME STRETCH OF TIME, TWICE, AND IT IS THE OWNER'S NOW. Moira's top track
 * is a person running a tool and checking after every step; here the top track
 * is the owner's own day, spent upstream in three spans (the brief, the
 * concepting, the campaign imagery — Kristin's own words from the call), and
 * the agent's long run below reaches up to it only THREE times: the owner sets
 * the goal and the checks, the agent asks once, the owner judges the result.
 * The handoffs are the green of the human and letter on one row; the agent's
 * own gates letter on the row under them, in gold.
 *
 * ⚠ ONE FIGURE, TWO READINGS OF ONE RECORD: a horizon with `upstream` draws
 * this, one with `operated` draws Moira's, and Plopsa's is byte-identical.
 * ⚠ SERVER, NO STATE. `data-horizon-*` only; lines are SVG, every word is DOM
 * placed by percentage so the type never scales (the horizon's own law).
 */
export function ArcHorizonOwned({ section, upstream, index, motion = "reveal" }: Props) {
  const { axis, agent, note, owner } = section;
  const [checkGate, retryGate, askGate] = agent.gates;
  const checkX = ownedAlong(checkGate.at);
  const retryX = ownedAlong(retryGate.at);
  const askX = ownedAlong(askGate.at);
  const spans = ownedSpans(askGate.at);
  const x0 = OWNED_AXIS.x0;
  const x1 = OWNED_AXIS.x1;
  const A = OWNED_TRACK_A_Y;
  const B = OWNED_TRACK_B_Y;

  return (
    <ArcBeat
      id={section.id}
      kind="horizon"
      className="arc-section arc-sec arc-sec--horizon arc-sec--owned"
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
        <figure
          className="arc-hzm arc-hzo arc-reveal"
          data-horizon-figure="owned"
          {...rung(motion, 0.14)}
        >
          <div className="arc-hzo__row">
            {owner ? (
              <aside className="arc-plate arc-hzo__owner" data-horizon-owner="">
                <div className="arc-plate__head arc-hzo__head">
                  <span className="arc-plate__kicker arc-hzo__kicker">{owner.key}</span>
                  <span className="arc-plate__name arc-hzo__name">{owner.name}</span>
                  <Bust />
                </div>
                <ul className="arc-plate__rows">
                  {owner.rows.map((r) => (
                    <li key={r.tag} className="arc-plate__row">
                      <span className="arc-plate__tag">{r.tag}</span>
                      <span className="arc-plate__line">{r.line}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}

            <div className="arc-hzo__right">
              <div className="arc-hzm__stage arc-hzo__stage">
                <svg
                  className="arc-hzm__svg"
                  viewBox={`0 0 ${OWNED_W} ${OWNED_H}`}
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  {/* The owner's day: three spans of upstream work, and the
                    three moments the agent reaches it. */}
                  <line className="arc-hzo__day" x1={x0} y1={A} x2={x1} y2={A} />
                  <g className="arc-hzo__spans">
                    {spans.map((s) => (
                      <line
                        key={s.from}
                        x1={ownedAlong(s.from)}
                        y1={A}
                        x2={ownedAlong(s.to)}
                        y2={A}
                      />
                    ))}
                  </g>
                  <Person cx={x0} base={A} />
                  <Person cx={askX} base={A} />
                  <Person cx={x1} base={A} />

                  {/* The handoffs: dashed, green, the human's. Down at the
                    start (the goal), up at the question and at the end. */}
                  <g className="arc-hzo__hand">
                    <line x1={x0} y1={A + 6} x2={x0} y2={B - 10} />
                    <line x1={askX} y1={B - 10} x2={askX} y2={A + 6} />
                    <line x1={x1} y1={B - 10} x2={x1} y2={A + 6} />
                    <path d={`M${x0 - 5} ${B - 18} L${x0} ${B - 10} L${x0 + 5} ${B - 18}`} />
                    <path d={`M${askX - 5} ${A + 14} L${askX} ${A + 6} L${askX + 5} ${A + 14}`} />
                    <path d={`M${x1 - 5} ${A + 14} L${x1} ${A + 6} L${x1 + 5} ${A + 14}`} />
                  </g>

                  {/* The agent: one long run, its own two gates, and the loop. */}
                  <line className="arc-hzm__run" x1={x0} y1={B} x2={x1} y2={B} />
                  <g className="arc-hzm__gates">
                    {[checkX, retryX, askX].map((gx) => (
                      <line key={gx} x1={gx} y1={B - 10} x2={gx} y2={B + 10} />
                    ))}
                    <path
                      className="arc-hzm__loop"
                      d={`M${retryX} ${B + 12} C${retryX} ${B + 46}, ${retryX - 64} ${B + 46}, ${retryX - 64} ${B + 12}`}
                    />
                    <path
                      className="arc-hzm__loop"
                      d={`M${retryX - 70} ${B + 21} L${retryX - 64} ${B + 12} L${retryX - 58} ${B + 21}`}
                    />
                  </g>

                  <line
                    className="arc-hzm__axis"
                    x1={x0}
                    y1={OWNED_AXIS.y}
                    x2={x1}
                    y2={OWNED_AXIS.y}
                  />
                </svg>

                <span className="arc-hzm__track arc-hzo__track" style={{ top: y(A) }}>
                  {upstream.label}
                </span>
                {spans.map((s, i) => (
                  <span
                    key={s.from}
                    className="arc-hzo__span"
                    style={{ left: x(ownedAlong((s.from + s.to) / 2)), top: y(A - 44) }}
                  >
                    {upstream.spans[i]}
                  </span>
                ))}

                <span className="arc-hzm__track" data-track="agent" style={{ top: y(B) }}>
                  {agent.label}
                </span>

                <span
                  className="arc-hzo__handlabel"
                  style={{ left: x(x0 + 14), top: y(OWNED_ROW_HAND_Y) }}
                >
                  {agent.start}
                </span>
                {/* The question letters to the LEFT of its connector: the
                  result's label runs in from the right on the same row. */}
                <span
                  className="arc-hzo__handlabel"
                  data-horizon-gate="ask"
                  data-at="end"
                  style={{ right: x(OWNED_W - askX + 14), top: y(OWNED_ROW_HAND_Y) }}
                >
                  {askGate.label}
                </span>
                <span
                  className="arc-hzo__handlabel"
                  data-at="end"
                  style={{ right: x(OWNED_W - x1 + 14), top: y(OWNED_ROW_HAND_Y) }}
                >
                  {agent.end}
                </span>

                {[checkGate, retryGate].map((g) => (
                  <span
                    key={g.kind}
                    className="arc-hzm__gate"
                    data-horizon-gate={g.kind}
                    style={{ left: x(ownedAlong(g.at)), top: y(OWNED_ROW_GATE_Y) }}
                  >
                    {g.label}
                  </span>
                ))}

                <span
                  className="arc-hzm__axislabel"
                  style={{ left: x(x0), top: y(OWNED_AXIS.y + 8) }}
                >
                  {axis.from}
                </span>
                <span
                  className="arc-hzm__axislabel"
                  data-at="end"
                  style={{ right: x(OWNED_W - x1), top: y(OWNED_AXIS.y + 8) }}
                >
                  {axis.to}
                </span>
              </div>
              {note ? <p className="arc-hzm__caption arc-hzo__caption">{note}</p> : null}
            </div>
          </div>

          {/* The same picture as two lists, for a phone. */}
          <div className="arc-hzm__lists">
            <div className="arc-hzm__list">
              <span className="arc-hzm__listhead">{upstream.label}</span>
              <span className="arc-hzm__listline">{upstream.line}</span>
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
        </figure>
      </div>
    </ArcBeat>
  );
}
