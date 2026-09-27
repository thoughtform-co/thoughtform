import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  AXIS_Y,
  CURVE_VB,
  GRID_TOP,
  LETTERED_TREADS,
  NOW_X,
  TREADS,
  X0,
  X1,
  curveFraction,
  ladderPath,
  treadY,
  yearX,
} from "./framing/curveLayout";

interface ArcCurveProps {
  section: ArcSectionOf<"curve">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }) => ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * ArcCurve — the longer the task, per release (ADR-130). METR's finding in
 * the program board's register: a dated graticule, seven treads (one per
 * doubling), and a step ladder with a riser every seven months that arrives
 * at NOW — the drawing's one gold mark. A dashed reference names the length
 * of the work this room is here to hand over, so the ladder is read against
 * something the reader owns.
 *
 * ⚠ THE LADDER IS INK, NOT GOLD, and it draws on once (`pathLength` 100 on a
 * path that never takes `vector-effect`). The static line work does take it,
 * so a hairline is one device pixel at every width.
 *
 * ⚠ THE SVG LETTERS NOTHING; the years are the one digit on the figure.
 * ⚠ SERVER, NO STATE. `data-curve-*` only.
 */
export function ArcCurve({ section, index, motion = "reveal" }: ArcCurveProps) {
  const { years, now, treads, axis, reference, note } = section;
  const top = treadY(TREADS - 1);
  const refY = treadY(reference.tread);
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
          <div className="arc-curve__stage">
            <svg
              className="arc-curve__svg"
              viewBox={`0 0 ${CURVE_VB.w} ${CURVE_VB.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {years.map((year, i) => (
                <line
                  key={`y${year}`}
                  className="arc-curve__grat"
                  x1={yearX(i)}
                  y1={GRID_TOP}
                  x2={yearX(i)}
                  y2={AXIS_Y}
                />
              ))}
              {Array.from({ length: TREADS }, (_, i) => treadY(i)).map((y) => (
                <line
                  key={`t${y.toFixed(1)}`}
                  className="arc-curve__tread"
                  x1={X0}
                  y1={y}
                  x2={X1}
                  y2={y}
                />
              ))}
              <line
                className="arc-curve__ref"
                data-curve-ref=""
                x1={X0}
                y1={refY}
                x2={X1}
                y2={refY}
              />
              <line className="arc-curve__axis" x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} />
              <line className="arc-curve__axis" x1={X0} y1={GRID_TOP} x2={X0} y2={AXIS_Y} />
              <line className="arc-curve__now" x1={NOW_X} y1={top} x2={NOW_X} y2={AXIS_Y} />
              <path className="arc-curve__ladder" d={ladderPath()} pathLength={100} />
            </svg>

            {LETTERED_TREADS.map((t, i) => (
              <span
                key={treads[i]}
                className="arc-curve__lbl arc-curve__lbl--tread"
                style={seat(curveFraction(X0 - 12, treadY(t)))}
              >
                {treads[i]}
              </span>
            ))}
            {years.map((year, i) => (
              <span
                key={year}
                className="arc-curve__lbl arc-curve__lbl--year"
                style={seat(curveFraction(yearX(i), AXIS_Y + 8))}
              >
                {year}
              </span>
            ))}
            <span
              className="arc-curve__lbl arc-curve__lbl--now"
              style={seat(curveFraction(NOW_X, AXIS_Y + 8))}
            >
              {now}
            </span>
            <i
              className="arc-curve__seat"
              aria-hidden="true"
              style={seat(curveFraction(NOW_X, top))}
            />
            <span
              className="arc-curve__desig arc-curve__desig--y"
              style={seat(curveFraction(X0 - 12, GRID_TOP - 16))}
            >
              {axis.y}
            </span>
            <span
              className="arc-curve__desig arc-curve__desig--along"
              style={seat(curveFraction(X0 + 24, (treadY(5) + top) / 2))}
            >
              {axis.along}
            </span>
            <span
              className="arc-curve__lbl arc-curve__lbl--ref"
              style={seat(curveFraction(X1, refY - 8))}
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
