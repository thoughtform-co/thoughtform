import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { writtenDrawing } from "./approachWritten";
import type { AprLead, AprSeat } from "./approachWritten";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

const at = (s: AprSeat) => ({ "--ax": s.ax, "--at": s.at }) as CSSProperties;
const lead = (l: AprLead) =>
  ({ "--ax": l.ax, "--at": l.at, "--aw": l.aw, "--ah": l.ah }) as CSSProperties;
const two = (n: number) => String(n).padStart(2, "0");

/** The figure's number, chrome: the vision's figure is the first. */
const FIG_N = "02";

interface ArcApproachWrittenProps {
  section: ArcSectionOf<"handoff">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcApproachWritten — the layer, written, read whole (the approach's lab
 * direction `written`, 2026-10-11). The head above; ONE figure cell across
 * the band on the job's dot ground with its corner ticks, height-bound to
 * the beat's remainder; in it the stack at its written state, static: the
 * host slab, the gold layer with its courses drawn and named beside it (the
 * skills as filled ticks, the evals open), the team's four diamonds on a
 * deck one course higher, Claude's beads along the front edge to the
 * owner's diamond. The three passes are a right column, each on a 1px DOM
 * leader to its mark: 01 to the team, 02 to the courses, 03 to the beads'
 * end. `Fig. 02` bottom-left.
 *
 * ⚠ THE SVG LETTERS NOTHING: every word is DOM on a seat `writtenDrawing`
 * computes (`--ax` / `--at`, fractions of the crop), every leader a DOM
 * span seated the same way. ⚠ SERVER, NO STATE, DOM ONLY: whole in a
 * static render, no stepper, no hologram.
 */
export function ArcApproachWritten({ section, index, motion = "reveal" }: ArcApproachWrittenProps) {
  const { written, steps } = section;
  if (!written) return null;
  const d = writtenDrawing(section.id, {
    tiles: written.team,
    skills: written.courses.skills.length,
    evals: written.courses.evals.length,
  });
  const hatch = `${section.id}-apr-hatch`;

  const stage = (
    <div className="apr__stage" style={{ "--apr-w": d.vb.w, "--apr-h": d.vb.h } as CSSProperties}>
      <svg
        className="apr__svg"
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
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" className="apr__hatch" />
          </pattern>
        </defs>
        <g className="apr__plate" data-apr-tier="host">
          <path className="apr__hidden" d={d.host.hidden} />
          <path className="apr__face apr__face--left" d={d.host.left} />
          <path className="apr__face apr__face--right" d={d.host.right} />
          <path className="apr__face apr__face--top" d={d.host.top} />
        </g>
        <g className="apr__plate" data-apr-tier="layer" data-apr-lit="">
          <path className="apr__hidden" d={d.layer.hidden} />
          <path className="apr__face apr__face--left" d={d.layer.left} />
          <path className="apr__face apr__face--right" d={d.layer.right} />
          <path className="apr__face apr__face--top" d={d.layer.top} />
          <path className="apr__fill" d={d.layer.top} fill={`url(#${hatch})`} />
          {d.courses.map((c) => (
            <path key={c.d} className="apr__course" data-apr-course={c.kind} d={c.d} />
          ))}
          <path className="apr__run" d={d.run} />
        </g>
        {d.tiles.map((t) => (
          <g key={t.top} className="apr__tile" data-apr-lit={t.lit ? "" : undefined}>
            <path className="apr__hidden" d={t.hidden} />
            <path className="apr__face apr__face--left" d={t.left} />
            <path className="apr__face apr__face--right" d={t.right} />
            <path className="apr__face apr__face--top" d={t.top} />
          </g>
        ))}
        {d.beads.map((b) => (
          <path key={b.a} className="apr__bead" fillOpacity={b.a} d={b.d} />
        ))}
        {d.people.map((p) => (
          <path key={p} className="apr__person" d={p} />
        ))}
        <path className="apr__person" data-apr-ask="" d={d.ask} />
      </svg>
      <div className="apr__words" aria-hidden="true">
        <span className="apr__lead" data-apr-lead="layer" style={lead(d.leads.layer)} />
        <div className="apr__tag apr__callout" data-apr-tag="layer" style={at(d.seats.layer)}>
          <span className="apr__label">{written.layer}</span>
          <ul className="apr__courses">
            {written.courses.skills.map((sk) => (
              <li key={sk} data-apr-course="skill">
                {sk}
              </li>
            ))}
            {written.courses.evals.map((ev) => (
              <li key={ev} data-apr-course="eval">
                {ev}
              </li>
            ))}
          </ul>
        </div>
        <p className="apr__tag" data-apr-tag="host" style={at(d.seats.host)}>
          {written.host}
        </p>
        {steps.map((s, i) => [
          ...d.leads.passes[i].map((l, k) => (
            <span key={`${s.id}-lead-${k}`} className="apr__lead" style={lead(l)} />
          )),
          <div
            key={s.id}
            className="apr__tag apr__pass"
            data-apr-tag="pass"
            data-apr-pass={i}
            style={{ ...at(d.seats.passes[i]), "--aw": d.passW } as CSSProperties}
          >
            <p className="apr__pass-key">
              <span className="apr__pass-n">{two(i + 1)}</span>
              {s.label}
            </p>
            <p className="apr__pass-line">{written.lines[i]}</p>
          </div>,
        ])}
      </div>
    </div>
  );

  /* The phone's words: the drawing is too small there to seat them, so
     the courses and the three passes are a list under it. */
  const legend = (
    <ol className="apr__legend">
      {steps.map((s, i) => (
        <li key={s.id} className="apr__legend-row">
          <p className="apr__pass-key">
            <span className="apr__pass-n">{two(i + 1)}</span>
            {s.label}
          </p>
          <p className="apr__pass-line">{written.lines[i]}</p>
        </li>
      ))}
    </ol>
  );

  return (
    <ArcBeat
      id={section.id}
      kind="handoff"
      className="arc-section arc-sec arc-sec--handoff arc-sec--handoff-written"
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
        <div className="apr apr--written arc-reveal" {...rung(motion, 0.14)}>
          <figure className="apr__fig">
            <div className="apr__frame" role="img" aria-label={written.alt}>
              {stage}
            </div>
            <figcaption className="apr__caption">
              <span className="apr__fig-n">Fig. {FIG_N}</span>
              {written.caption}
            </figcaption>
          </figure>
          {legend}
        </div>
      </div>
    </ArcBeat>
  );
}
