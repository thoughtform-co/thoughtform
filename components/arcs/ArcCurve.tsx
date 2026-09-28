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
  curveAxis,
  curveGrid,
  curveSeats,
  curveTreads,
  heightPost,
  referencePlane,
  yearTicks,
} from "./framing/curveLayout";

interface ArcCurveProps {
  section: ArcSectionOf<"curve">;
  index: number;
  motion?: ArcMotion;
}

const seat = (p: { ax: number; at: number }, rot?: number) =>
  ({ "--ax": p.ax, "--at": p.at, ...(rot ? { "--rot": `${rot}deg` } : {}) }) as CSSProperties;

/**
 * ArcCurve — why long work only works now (ADR-130, redrawn in U4). METR's
 * finding on the same stage as the three stages before it: seven treads up
 * the time edge, a riser every seven months from January 2023, the last tread
 * the frontier now and the drawing's one gold object. On a doubling axis
 * every doubling is the same height, so the record IS a staircase. The
 * heights are read off a post at the end of the edge, each lettered tread
 * joined to it by a dashed contour; a dashed plane cuts through at the length
 * of work this room is here to hand over.
 *
 * ⚠ THE SVG LETTERS NOTHING; the years are the one digit on the figure. The
 * hologram is the same crop through the stage's parallel camera, mounted in
 * the same box (ADR-130 U4).
 * ⚠ SERVER, NO STATE. `data-curve-*` only.
 */
export function ArcCurve({ section, index, motion = "reveal" }: ArcCurveProps) {
  const { years, now, treads, axis, reference, note } = section;
  const grid = curveGrid();
  const treadsDrawn = curveTreads();
  const post = heightPost();
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
          <div
            className="arc-curve__stage"
            style={{ "--vb-ar": CURVE_VB.w / CURVE_VB.h } as CSSProperties}
          >
            <ArcHoloStageMount
              scene={{
                kind: "curve",
                data: { years: section.years, reference: { tread: section.reference.tread } },
              }}
            />
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
              <path className="arc-curve__axis" d={curveAxis()} />
              {yearTicks(years.length).map((d, i) => (
                <path key={`y${i}`} className="arc-curve__axis" d={d} />
              ))}
              {/* ⚠ FARTHEST FIRST: a later tread stands further up the edge,
                  and the faces are opaque, so the order is the occlusion. */}
              {treadsDrawn.map(({ k, lit, paths }) => (
                <g key={k} className="arc-curve__tread" data-curve-lit={lit ? "" : undefined}>
                  <path className="arc-curve__face" data-face="left" d={paths.left} />
                  <path className="arc-curve__face" data-face="right" d={paths.right} />
                  <path className="arc-curve__face" data-face="top" d={paths.top} />
                  <path className="arc-curve__edge" d={paths.visible} />
                </g>
              ))}
              {post.contours.map((d, i) => (
                <path key={`c${i}`} className="arc-curve__contour" d={d} />
              ))}
              <path className="arc-curve__axis" d={post.post} />
              {post.ticks.map((d, i) => (
                <path key={`pt${i}`} className="arc-curve__axis" d={d} />
              ))}
              <path className="arc-curve__axis arc-curve__now-tick" d={seats.nowTick} />
              <path
                className="arc-curve__ref"
                data-curve-ref=""
                d={referencePlane(reference.tread)}
              />
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
            <span className="arc-curve__desig arc-curve__desig--y" style={seat(seats.axisY)}>
              {axis.y}
            </span>
            <span
              className="arc-curve__desig arc-curve__desig--along"
              style={seat(seats.axisAlong, -22)}
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
