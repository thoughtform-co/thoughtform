import type { CSSProperties } from "react";

import type { ArcFigureSpec } from "@/lib/arcs/types";

import { logicFrame, logicScene, logicSeats } from "./layout";

type LogicSpec = Extract<ArcFigureSpec, { id: "logic" }>;

const seat = (p: { ax: number; at: number }) =>
  ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * Logic — Benedict Evans's turn, drawn (ADR-156 U3): a stair of instructions
 * on one wire, beside a cloud of observations and the gold line a model fits
 * through it. ⚠ SERVER, NO STATE; words are DOM spans on leaders.
 */
export function Logic({ spec }: { spec: LogicSpec }) {
  const f = logicFrame();
  const s = logicScene(f);
  const seats = logicSeats(f);
  return (
    <div
      className="arc-floor arc-fig__floor"
      data-fig="logic"
      style={{ "--fig-aspect": (f.w / f.h).toFixed(3) } as CSSProperties}
    >
      <figure className="arc-floor__figure" aria-label={spec.alt}>
        <div className="arc-floor__stage" style={{ aspectRatio: `${f.w} / ${f.h}` }}>
          <svg
            className="arc-floor__svg"
            viewBox={`0 0 ${f.w} ${f.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {s.grid.along.map((d, i) => (
              <path key={`ga${i}`} className="arc-floor__grat" d={d} />
            ))}
            {s.grid.across.map((d, i) => (
              <path key={`gc${i}`} className="arc-floor__grat" d={d} />
            ))}
            <path className="arc-floor__hidden" d={s.region} />
            {s.steps.map(({ i, paths }) => (
              <g key={i} className="arc-floor__housing" data-fig-part="step">
                <path className="arc-floor__face" data-face="left" d={paths.left} />
                <path className="arc-floor__face" data-face="right" d={paths.right} />
                <path className="arc-floor__face" data-face="top" d={paths.top} />
                <path className="arc-floor__hidden" d={paths.hidden} />
                <path className="arc-floor__edge" d={paths.visible} />
              </g>
            ))}
            <path className="arc-fig__wire" d={s.wire} />
            {s.dots.map((p, i) => (
              <circle key={i} className="arc-fig__dot" cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="1.6" />
            ))}
            <path className="arc-fig__rail" d={s.line} />
            <path className="arc-floor__leader" d={seats.logic.leader} />
            <path className="arc-floor__leader" d={seats.statistics.leader} />
          </svg>
          <span className="arc-fig__block" data-anchor="end" style={seat(seats.logic.seat)}>
            <span className="arc-fig__block-name">{spec.logic.label}</span>
            {spec.logic.line}
          </span>
          <span className="arc-fig__block" data-anchor="start" data-lit="" style={seat(seats.statistics.seat)}>
            <span className="arc-fig__block-name">{spec.statistics.label}</span>
            {spec.statistics.line}
          </span>
        </div>
        {spec.note ? <figcaption className="arc-fig__note">{spec.note}</figcaption> : null}
      </figure>
    </div>
  );
}
