import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcHoloStageMount } from "./ArcHoloStageMount";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  CURVE_VB,
  LETTERED_TREADS,
  curveDust,
  curveGrid,
  curveSeats,
  ladder,
  referencePlane,
  yearPosts,
} from "./framing/curveLayout";

interface ArcCurveProps {
  section: ArcSectionOf<"curve">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }) => ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * ArcCurve — the longer the task, per release (ADR-130, redrawn in U1).
 * METR's finding in the brandworld's isometric register: a dated floor with a
 * year post at each mark, and the step ladder EXTRUDED into a stepped relief —
 * one tread per doubling, a riser every seven months — arriving at NOW, the
 * drawing's one gold mark. A dashed reference plane cuts through the relief at
 * the length of work this room is here to hand over, so the ladder is read
 * against something the reader owns.
 *
 * ⚠ THE CREST IS INK, NOT GOLD, and it draws on once (`pathLength` 100 on a
 * path that never takes `vector-effect`). The static line work does take it,
 * so a hairline is one device pixel at every width.
 *
 * ⚠ THE SVG LETTERS NOTHING; the years are the one digit on the figure.
 * ⚠ SERVER, NO STATE. `data-curve-*` only.
 */
export function ArcCurve({ section, index, motion = "reveal" }: ArcCurveProps) {
  const { years, now, treads, axis, reference, note } = section;
  const relief = ladder();
  const grid = curveGrid();
  const seats = curveSeats(years.length);
  return (
    <ArcBeat
      id={section.id}
      kind="curve"
      className="arc-section arc-sec arc-sec--curve"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="curve"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-curve arc-reveal" data-curve-figure="" {...rung(motion, 0.14)}>
          {/* The relief, in three dimensions. The SVG below is the fallback
              and the printed handout (ADR-130 U2). */}
          <ArcHoloStageMount
            scene={{
              kind: "curve",
              data: { years: section.years, reference: { tread: section.reference.tread } },
            }}
            labels={[
              { id: "now", text: section.now, priority: 0 },
              { id: "reference", text: section.reference.label, priority: 1 },
              { id: "axis-y", text: section.axis.y, priority: 2 },
              ...[0, 2, 4, 6]
                .filter((k) => section.treads[k] !== undefined)
                .map((k) => ({ id: `tread-${k}`, text: section.treads[k] as string, priority: 3 })),
              ...section.years.map((y, i) => ({ id: `year-${i}`, text: y, priority: 4 })),
            ]}
            gutters={{ top: 8, bottom: 8 }}
          />
          <div className="arc-curve__stage">
            <svg
              className="arc-curve__svg"
              viewBox={`0 0 ${CURVE_VB.w} ${CURVE_VB.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {grid.along.map((d, i) => (
                <path key={`ga${i}`} className="arc-curve__grat" d={d} />
              ))}
              {grid.across.map((d, i) => (
                <path key={`gc${i}`} className="arc-curve__grat" d={d} />
              ))}
              {curveDust().map((p, i) => (
                <rect
                  key={`d${i}`}
                  className="arc-curve__mote"
                  x={p.x}
                  y={p.y}
                  width="1"
                  height="1"
                />
              ))}
              {yearPosts(years.length).map((d, i) => (
                <path key={`p${i}`} className="arc-curve__tie" d={d} />
              ))}
              <path className="arc-curve__hidden" d={relief.footHidden} />
              <path className="arc-curve__ref" data-curve-ref="" d={referencePlane(reference.tread)} />
              {relief.ties.map((d, i) => (
                <path key={`t${i}`} className="arc-curve__tread" d={d} />
              ))}
              <path className="arc-curve__tread" d={relief.far} />
              <path className="arc-curve__axis" d={relief.footVisible} />
              <path className="arc-curve__ladder" d={relief.crest} pathLength={100} />
            </svg>

            {LETTERED_TREADS.map((t, i) => (
              <span
                key={treads[i]}
                className="arc-curve__lbl arc-curve__lbl--tread"
                style={seat(seats.treads[i])}
              >
                {treads[i]}
              </span>
            ))}
            {years.map((year, i) => (
              <span
                key={year}
                className="arc-curve__lbl arc-curve__lbl--year"
                style={seat(seats.years[i])}
              >
                {year}
              </span>
            ))}
            <span className="arc-curve__lbl arc-curve__lbl--now" style={seat(seats.now)}>
              {now}
            </span>
            <i className="arc-curve__seat" aria-hidden="true" style={seat(seats.seat)} />
            <span className="arc-curve__desig arc-curve__desig--y" style={seat(seats.axisY)}>
              {axis.y}
            </span>
            <span
              className="arc-curve__desig arc-curve__desig--along"
              style={seat(seats.axisAlong)}
            >
              {axis.along}
            </span>
            <span
              className="arc-curve__lbl arc-curve__lbl--ref"
              style={seat(seats.reference(reference.tread))}
            >
              {reference.label}
            </span>
          </div>
          <p className="arc-curve__phone">
            {treads[0]} → {treads[3]} · {years[0]} → {years[3]}
          </p>
        </figure>
        <p className="arc-footnote arc-reveal" {...rung(motion, 0.5, 0, 22)}>
          {note}
        </p>
      </div>
    </ArcBeat>
  );
}
