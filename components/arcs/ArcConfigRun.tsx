import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { configRun } from "./configRun";
import type { CfgSeat } from "./configRun";

const at = (s: CfgSeat) => ({ "--ax": s.ax, "--at": s.at }) as CSSProperties;
const two = (n: number) => String(n).padStart(2, "0");

interface ArcConfigRunProps {
  section: ArcSectionOf<"handoff">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcConfigRun — the configuration, drawn as one run (the X-Bionic
 * proposal, 2026-10-10; the owner's eight-step outline, "Draw it"). One
 * drawing in six parts, left to right:
 *
 *   1  the vision's own layer, in its own paint, a tile per workstream
 *      standing on it, the lit tile the workstream the reader follows
 *   2  that tile opened onto one panel, its jobs across the head, the job
 *      worked through lit
 *   3  the job's three inputs on the left and the finished ad on the right
 *   4  adoption: the upper pass, made with Claude, a person at every step
 *   5  encoding: the band between the passes, a skill and its evals, fed by
 *      the checks that are kept
 *   6  automation: the lower pass, one line through the evals to one
 *      person, asked before it goes out
 *
 * ⚠ READ WHOLE, ON ONE SCREEN (owner, 2026-10-11, "Whole"): the six parts
 * at once at 1280×720 and 1470×830. A runway lighting them in turn and the
 * handoff's rail over them were the other two readings, and came out with
 * his pick.
 *
 * ⚠ THE SVG LETTERS NOTHING. Every word is DOM on a seat `configRun`
 * computes, so no word sits on a drawn face and every collision is a box a
 * test can measure.
 * ⚠ SERVER, NO STATE, DOM ONLY: the drawing is whole in a static render.
 */
export function ArcConfigRun({ section, index, motion = "reveal" }: ArcConfigRunProps) {
  const { run, steps } = section;
  if (!run) return null;
  const count = run.layer.workstreams.length;
  const litIndex = Math.max(
    0,
    run.layer.workstreams.findIndex((w) => w.lit)
  );
  const d = configRun(section.id, count, litIndex);
  const lit = run.layer.workstreams[litIndex];
  /* The slab's hatch, the stack's own (StackFigure), its id per instance. */
  const hatch = `${section.id}-cfg-hatch`;

  const figure = (
    <figure className="cfg__fig" role="img" aria-label={run.alt}>
      <div className="cfg__stage">
        <svg
          className="cfg__svg"
          viewBox={`0 0 ${d.vb.w} ${d.vb.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <pattern
              id={hatch}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45) scale(0.42)"
            >
              <line x1="0" y1="0" x2="0" y2="6" className="cfg__hatch" />
            </pattern>
          </defs>
          {d.groups.map((g) => (
            <g key={g.step} className="cfg__part">
              {g.marks.map((m, i) => (
                <path
                  key={`${m.cls}-${i}`}
                  className={`cfg__${m.cls}`}
                  d={m.d}
                  fill={m.cls === "plate-hatch" ? `url(#${hatch})` : undefined}
                  fillOpacity={m.a}
                />
              ))}
            </g>
          ))}
        </svg>
        <div className="cfg__words" aria-hidden="true">
          <p className="cfg__tag" data-cfg-tag="layer" style={at(d.seats.layer)}>
            {run.layer.label}
          </p>
          <ul className="cfg__tag cfg__list" data-cfg-tag="list" style={at(d.seats.list)}>
            {run.layer.workstreams.map((w) => (
              <li key={w.id} className="cfg__ws" data-cfg-lit={w.lit ? "" : undefined}>
                <span className="cfg__ws-mark" />
                {w.name}
              </li>
            ))}
          </ul>
          <p className="cfg__tag cfg__head" data-cfg-tag="head" style={at(d.seats.head)}>
            <span className="cfg__head-ws">{lit?.name}</span>
            <span className="cfg__head-run">›</span>
            {run.jobs.map((j) => (
              <span key={j.id} className="cfg__job" data-cfg-lit={j.lit ? "" : undefined}>
                {j.name}
              </span>
            ))}
          </p>
          {run.inputs.map((label, i) => (
            <p key={label} className="cfg__tag" data-cfg-tag="input" style={at(d.seats.inputs[i])}>
              {label}
            </p>
          ))}
          <p className="cfg__tag" data-cfg-tag="output" style={at(d.seats.output)}>
            {run.output}
          </p>
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="cfg__tag cfg__row"
              data-cfg-tag="row"
              data-cfg-row={i}
              style={at(d.seats.rows[i])}
            >
              <p className="cfg__row-key">
                <span className="cfg__row-n">{two(i + 1)}</span>
                {s.label}
              </p>
              <p className="cfg__row-line">{run.lines[i]}</p>
            </div>
          ))}
          <p className="cfg__tag" data-cfg-tag="key" style={at(d.seats.keys.skill)}>
            {run.keys.skill}
          </p>
          <p className="cfg__tag" data-cfg-tag="key" style={at(d.seats.keys.evals)}>
            {run.keys.evals}
          </p>
        </div>
      </div>
    </figure>
  );

  /* The phone's words: the drawing is too small there to seat them, so the
     three passes are a list under it. Hidden on the desktop. */
  const legend = (
    <ol className="cfg__legend">
      {steps.map((s, i) => (
        <li key={s.id} className="cfg__legend-row">
          <p className="cfg__row-key">
            <span className="cfg__row-n">{two(i + 1)}</span>
            {s.label}
          </p>
          <p className="cfg__row-line">{run.lines[i]}</p>
        </li>
      ))}
    </ol>
  );

  return (
    <ArcBeat
      id={section.id}
      kind="handoff"
      className="arc-section arc-sec arc-sec--handoff arc-sec--handoff-run"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="handoff"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="cfg arc-reveal" {...rung(motion, 0.14)}>
          {figure}
          {legend}
        </div>
      </div>
    </ArcBeat>
  );
}
