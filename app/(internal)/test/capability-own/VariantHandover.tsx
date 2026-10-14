"use client";

/* A · THE HANDOVER. The month on a ruler, left to right, and the four
   workstreams as four lines under it. Thoughtform is one gold line among
   them:
     · week one, on site: it runs inside the team, between the four lines,
       and ties into every one of them (every workstream runs real work with
       Claude);
     · weeks two and three: it steps from line to line, one owner at a time,
       from the bottom up, and where it leaves a line a skill is written and
       the line is the team's (solid green from there);
     · week four: it steps out over the team and runs on above them,
       dashed, three days a week remote;
     · after: it leaves the frame, straight up. It never crosses a line the
       team already owns. The four lines run on to the edge, owned.
   Rob Weston's three steps (2026-10-13), drawn: in person with the team,
   co-working the solutions, the team taking the lead with Thoughtform
   remote. A playhead reads the month off the scroll; what it has passed is
   drawn. */

import type { CSSProperties } from "react";

import { headAt, held, lerp, MONTH_DAYS, pathOf, PHASES, type Pt, seg, STREAMS } from "./model";
import { Chip, Fig, Mark, Word } from "./shared";

/** The frame's geometry, in frame units. */
export const A = {
  lanes: [128, 208, 288, 368] as const,
  /** Thoughtform's own line, between the second and third workstreams,
      and the line it runs on over the team in week four. */
  mid: 248,
  above: 96,
  laneX0: 212,
  laneX1: 1188,
  /** The ruler: its baseline, and the edges of its four stretches. */
  rulerY: 66,
  edges: [236, 470, 770, 960, 1188] as const,
  /** Week one: where Thoughtform ties into every workstream. */
  spineX: 330,
  /** Weeks two and three: where each workstream's skill is written, the
      bottom one first. */
  skills: [720, 660, 600, 540] as const,
} as const;

/** Thoughtform's line: in beside the team, a step to each line in turn,
    on beside them, and out. */
export const GOLD_IN: Pt[] = [
  [A.laneX0, A.mid],
  [490, A.mid],
  [490, A.lanes[3]],
  [550, A.lanes[3]],
  [550, A.lanes[2]],
  [610, A.lanes[2]],
  [610, A.lanes[1]],
  [670, A.lanes[1]],
  [670, A.lanes[0]],
  [730, A.lanes[0]],
  [730, A.above],
  [A.edges[2], A.above],
];
export const GOLD_REMOTE: Pt[] = [
  [A.edges[2], A.above],
  [A.edges[3], A.above],
];
/** Out, straight up from the start of "after", past the frame's top. */
export const GOLD_OUT: Pt[] = [
  [A.edges[3], A.above],
  [A.edges[3], -24],
];
const GOLD_ALL: Pt[] = [...GOLD_IN, ...GOLD_REMOTE.slice(1)];
/** How much of the ruler's "after" the way out takes: the line rises over it. */
const RISE = 60;

/** The four stretches the ruler is cut into, and their words. */
const STRETCHES = [
  { x0: A.edges[0], when: "Week 1", what: "On site" },
  { x0: A.edges[1], when: "Weeks 2–3", what: "One owner at a time" },
  { x0: A.edges[2], when: "Week 4", what: "Your team leads" },
  { x0: A.edges[3], when: "After", what: "On its own" },
];

/** Thoughtform's days, spread over the ruler's three stretches of the month. */
function daysAt(x: number): number {
  const spans: [number, number, number][] = [
    [A.edges[0], A.edges[1], PHASES[0].days],
    [A.edges[1], A.edges[2], PHASES[1].days + PHASES[2].days],
    [A.edges[2], A.edges[3], PHASES[3].days],
  ];
  return spans.reduce((n, [x0, x1, d]) => n + d * seg(x, x0, x1), 0);
}


export function VariantHandover({ p }: { p: number }) {
  const t = held(p);
  const x = lerp(A.edges[0], A.edges[4], t);
  /* the way out is plumb, so it rises over the first stretch of "after"
     where the clip would show it whole at once */
  const rise = seg(x, A.edges[3], A.edges[3] + RISE);
  const head: Pt =
    x <= A.edges[3]
      ? headAt(GOLD_ALL, x)
      : [A.edges[3], lerp(A.above, GOLD_OUT[1][1], rise)];
  const owned = A.skills.filter((s) => s <= x).length;
  const days = Math.round(daysAt(x));
  /* the mark leaves with the line, straight up, as "after" begins */
  const gone = seg(x, A.edges[3] + RISE * 0.5, A.edges[3] + RISE);

  /* the ruler's minor ticks, every stretch cut into equal steps */
  const ticks: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x0, x1] = [A.edges[i], A.edges[i + 1]];
    const n = Math.round((x1 - x0) / 24);
    for (let k = 1; k < n; k++) ticks.push(x0 + ((x1 - x0) * k) / n);
  }
  /* "after": the owned lines run, their agents ticking along them */
  const runs: number[] = [];
  for (let rx = A.edges[3] + 40; rx < A.laneX1 - 10; rx += 34) runs.push(rx);

  return (
    <Fig
      label="The month on a ruler and the four workstreams as four lines. Thoughtform's gold line runs inside the team in week one, steps to each workstream in turn in weeks two and three, where each gets its skill and its owner, runs on dashed in week four, and leaves the frame after; the four lines run on, owned."
      svg={
        <>
          <defs>
            <clipPath id="co-a-seen">
              <rect x={-40} y={-40} width={x + 40} height={540} />
            </clipPath>
          </defs>

          {/* the ruler */}
          <path d={`M${A.edges[0]} ${A.rulerY}H${A.edges[4]}`} className="co-rule" />
          {A.edges.map((ex) => (
            <path key={ex} d={`M${ex} ${A.rulerY - 9}V${A.rulerY + 9}`} className="co-rule" />
          ))}
          {ticks.map((tx) => (
            <path
              key={tx}
              d={`M${tx.toFixed(1)} ${A.rulerY - 4}V${A.rulerY + 4}`}
              className="co-rule co-rule--faint"
            />
          ))}
          {/* the stretches' edges, down through the lines */}
          {A.edges.slice(1, 4).map((ex) => (
            <path key={ex} d={`M${ex} ${A.rulerY + 16}V420`} className="co-edge" />
          ))}

          {/* the four workstreams, quiet until the playhead reaches them */}
          {A.lanes.map((y) => (
            <path key={y} d={`M${A.laneX0} ${y}H${A.laneX1}`} className="co-lane" />
          ))}

          <g clipPath="url(#co-a-seen)">
            {/* week one: every workstream runs real work, a line learning */}
            {A.lanes.map((y, i) => (
              <path
                key={y}
                d={`M${A.spineX} ${y}H${A.skills[i]}`}
                className="co-lane co-lane--learning"
              />
            ))}
            {/* from its skill on, the line is the team's */}
            {A.lanes.map((y, i) => (
              <path
                key={y}
                d={`M${A.skills[i]} ${y}H${A.laneX1}`}
                className="co-lane co-lane--owned"
              />
            ))}
            {runs.map((rx) =>
              A.lanes.map((y) => (
                <rect key={`${rx}-${y}`} x={rx - 1.5} y={y - 1.5} width={3} height={3} className="co-run-tick" />
              ))
            )}

            {/* Thoughtform */}
            <path d={pathOf(GOLD_IN)} className="co-gold" />
            <path d={pathOf(GOLD_REMOTE)} className="co-gold co-gold--remote" />
            {rise > 0 && (
              <path d={pathOf([GOLD_OUT[0], head])} className="co-gold co-gold--out" />
            )}
            <path d={`M${A.spineX} ${A.lanes[0]}V${A.lanes[3]}`} className="co-gold co-gold--tie" />
            {A.lanes.map((y) => (
              <rect key={y} x={A.spineX - 2.5} y={y - 2.5} width={5} height={5} className="co-tap-gold" />
            ))}
            {A.skills.map((sx, i) => (
              <path
                key={sx}
                d={`M${sx} ${A.lanes[i] - 6}L${sx + 6} ${A.lanes[i]}L${sx} ${A.lanes[i] + 6}L${sx - 6} ${A.lanes[i]}Z`}
                className="co-skill"
              />
            ))}
          </g>

          {/* the playhead */}
          <path d={`M${x.toFixed(1)} ${A.rulerY + 12}V432`} className="co-playhead" />
          <Mark c={[head[0], head[1]]} h={16} opacity={1 - gone} className="co-mark--gold" />
        </>
      }
    >
      {/* the counters, over the workstreams */}
      <Word x={12} y={38} className="co-mono">
        <b className="co-mono__key">Owners</b> {owned}/4
      </Word>
      <Word x={12} y={62} className="co-mono co-mono--gold">
        <b className="co-mono__key">Thoughtform</b> {days}/{MONTH_DAYS} days
      </Word>

      {STRETCHES.map((s) => (
        <Word
          key={s.when}
          x={s.x0 + 10}
          y={A.rulerY - 14}
          className="co-mono co-stretch"
          style={{ opacity: x >= s.x0 ? 1 : 0.45 } as CSSProperties}
        >
          <b className="co-mono__key">{s.when}</b>
          <span>{s.what}</span>
        </Word>
      ))}

      {STREAMS.map((s, i) => (
        <Chip
          key={s.id}
          id={s.id}
          name={s.name}
          x={12}
          y={A.lanes[i]}
          owned={A.skills[i] <= x}
        />
      ))}

      {/* where a skill is written, and by whom it is kept */}
      {A.skills.map((sx, i) => (
        <Word
          key={sx}
          x={sx}
          y={A.lanes[i] + 18}
          className="co-mono co-tag co-tag--c"
          style={{ opacity: sx <= x ? 1 : 0 } as CSSProperties}
        >
          Skill
        </Word>
      ))}
      {/* Thoughtform, riding its own line */}
      <Word
        x={head[0] + 14}
        y={head[1] - 16}
        className="co-mono co-mono--gold co-tag"
        style={{ opacity: 1 - gone } as CSSProperties}
      >
        Thoughtform
      </Word>
      {/* after: each line runs on its own */}
      {A.lanes.map((y) => (
        <Word
          key={y}
          x={A.laneX1}
          y={y - 16}
          className="co-mono co-tag co-tag--r co-tag--green"
          style={{ opacity: seg(x, A.edges[3] + 60, A.edges[3] + 140) } as CSSProperties}
        >
          Runs on its own
        </Word>
      ))}
    </Fig>
  );
}
