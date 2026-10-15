import type { CSSProperties } from "react";

import type { ArcFigureSpec } from "@/lib/arcs/types";

import {
  laneSeat,
  prismTag,
  railSeat,
  timelineAxis,
  timelineBoxes,
  timelineFrame,
  timelineGrid,
  timelinePrisms,
  timelineRail,
} from "./layout";

type TimelineSpec = Extract<ArcFigureSpec, { id: "timeline" }>;

const seat = (p: { ax: number; at: number }) =>
  ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** `2025-07` reads "Jul 2025"; a year alone reads as itself. */
const when = (date: string) => {
  const [y, m] = date.split("-");
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
};

/**
 * Timeline — the bitter lesson as a record (ADR-156 U3): two lanes of dated
 * milestones, digital content in front and digital products behind, each one
 * a prism as tall as the capability curve stood that month, and the gold
 * compute rail climbing the time edge in front of them on the same scale.
 *
 * `show: "content"` draws the products lane as a ghost (its hidden edges
 * only, no tags): the second beat adds it to the same floor.
 *
 * ⚠ SERVER, NO STATE. The SVG letters nothing; every word is a DOM span on a
 * leader, seated as a fraction of the derived crop (`arc-floor__*`, the
 * stages' own classes, so the talk's drawings read as one instrument).
 */
export function Timeline({ spec }: { spec: TimelineSpec }) {
  const lanes = spec.lanes.map((l) => l.events);
  const prisms = timelinePrisms(lanes);
  const f = timelineFrame(prisms);
  const grid = timelineGrid(f);
  const axis = timelineAxis(f);
  const rail = timelineRail(f);
  const boxes = timelineBoxes(prisms, f);
  const label = new Map(spec.lanes.flatMap((l) => l.events.map((e) => [e.id, e])));
  const ghost = (lane: 0 | 1) => spec.show === "content" && lane === 1;

  return (
    <div
      className="arc-floor arc-fig__floor"
      data-fig="timeline"
      data-fig-show={spec.show}
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
            {grid.along.map((d, i) => (
              <path key={`ga${i}`} className="arc-floor__grat" d={d} />
            ))}
            {grid.across.map((d, i) => (
              <path key={`gc${i}`} className="arc-floor__grat" d={d} />
            ))}
            <path className="arc-floor__axis" d={axis.edge} />
            {/* The rail is BEHIND both lanes: drawn before them, so a block
                in front of it covers it, as a nearer thing does. */}
            {rail.ties.map((d, i) => (
              <path key={`t${i}`} className="arc-fig__rail-tie" d={d} />
            ))}
            <path className="arc-fig__rail" d={rail.line} />
            {axis.years.map((y) => (
              <path key={y.year} className="arc-floor__tick" d={y.tick} />
            ))}
            {boxes.map(({ id, lane, paths }) =>
              ghost(lane) ? (
                <g key={id} className="arc-floor__housing" data-fig-ghost="" data-fig-prism={id}>
                  <path className="arc-floor__hidden" d={paths.visible} />
                </g>
              ) : (
                <g key={id} className="arc-floor__housing" data-fig-lane={lane} data-fig-prism={id}>
                  <path className="arc-floor__face" data-face="left" d={paths.left} />
                  <path className="arc-floor__face" data-face="right" d={paths.right} />
                  <path className="arc-floor__face" data-face="top" d={paths.top} />
                  <path className="arc-floor__hidden" d={paths.hidden} />
                  <path className="arc-floor__edge" d={paths.visible} />
                </g>
              )
            )}
            {prisms
              .filter((p) => !ghost(p.lane))
              .map((p) => (
                <path key={`l${p.id}`} className="arc-floor__leader" d={prismTag(p, f).leader} />
              ))}
          </svg>
          {prisms
            .filter((p) => !ghost(p.lane))
            .map((p) => {
              const e = label.get(p.id);
              const t = prismTag(p, f);
              return (
                <span
                  key={p.id}
                  className="arc-floor__tag arc-fig__tag"
                  data-anchor={t.anchor}
                  style={seat(t.seat)}
                >
                  <span className="arc-fig__date">{e ? when(e.date) : null}</span>
                  {e?.label}
                </span>
              );
            })}
          {spec.lanes.map((l, i) => (
            <span
              key={l.id}
              className="arc-floor__end arc-fig__lane"
              data-fig-ghost={ghost(i as 0 | 1) ? "" : undefined}
              data-anchor={laneSeat(i as 0 | 1, f).anchor}
              style={seat(laneSeat(i as 0 | 1, f))}
            >
              {l.label}
            </span>
          ))}
          {axis.years.map((y) => (
            <span key={y.year} className="arc-floor__end arc-fig__year" style={seat(y.seat)}>
              {y.year}
            </span>
          ))}
          <span className="arc-floor__tag arc-fig__rail-word" style={seat(railSeat(f))}>
            {spec.rail.label}
          </span>
        </div>
        {spec.note ? <figcaption className="arc-fig__note">{spec.note}</figcaption> : null}
      </figure>
    </div>
  );
}
