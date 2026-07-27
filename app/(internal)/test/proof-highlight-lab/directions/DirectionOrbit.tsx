import type { ReactNode } from "react";

import { OrbitalNodes } from "@/components/landing/v7/CelestialConnector/shapes";

import { LAB_HIGHLIGHT_EXTRAS as X } from "../proofHighlightLabData";

/**
 * D — MISSION ORBIT. The rollout log made spatial.
 *
 * A wide dashed track with the five milestones riding its upper arc, the
 * artefact at the focus, and the outcomes read beneath. An orbit IS a track
 * record, so the engagement's chronology gets the shape instead of a tile grid.
 *
 * The track comes from `OrbitalNodes` (ADR-026) rendered directly — it is a
 * pure presentational `<g>`, so it needs no `DiagramSvg` router. Two
 * deliberate departures from its defaults:
 *   · `nodes: 0` — its markers are CIRCLES, and the shape law is diamonds, so
 *     the milestones are drawn here at the same parametric positions.
 *   · no `spin` — wall-clock rotation behind readable copy is the ADR-021
 *     motion-sickness rule.
 */

const RX = 115;
const RY = 34;
/** viewBox = [minX, minY, w, h]; labels ride above the arc, so the box is
 *  taller on top. Percentages below map HTML labels onto the same space. */
const VB = { x: -140, y: -70, w: 280, h: 110 };

/** Milestones sweep the UPPER arc left→right: a = π → 2π. */
function milestonePoint(i: number, count: number) {
  const a = Math.PI + (i / (count - 1)) * Math.PI;
  return { x: RX * Math.cos(a), y: RY * Math.sin(a) };
}

const pctX = (x: number) => `${(((x - VB.x) / VB.w) * 100).toFixed(3)}%`;
const pctY = (y: number) => `${(((y - VB.y) / VB.h) * 100).toFixed(3)}%`;

export function DirectionOrbit({ capture }: { capture: ReactNode }) {
  const points = X.milestones.map((_, i) => milestonePoint(i, X.milestones.length));

  return (
    <section className="phl-or">
      <div className="phl-or__track">
        {/* Subject at the focus. */}
        <div
          className="phl-or__subject"
          style={{ left: pctX(0), top: pctY(0), width: `${((72 / VB.w) * 100).toFixed(3)}%` }}
        >
          {capture}
        </div>

        <svg
          className="phl-or__svg"
          viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <OrbitalNodes orbits={[{ rx: RX, ry: RY, dash: "4 4", nodes: 0 }]} />
          {points.map((p, i) => (
            <g key={i}>
              {/* Drop leader from the node up to its label. */}
              <path
                className="phl-or__lead"
                d={`M${p.x} ${p.y}L${p.x} ${p.y - 11}`}
                strokeDasharray="1 3"
              />
              <rect
                className="phl-or__node"
                x={p.x - 3.2}
                y={p.y - 3.2}
                width={6.4}
                height={6.4}
                transform={`rotate(45 ${p.x} ${p.y})`}
              />
            </g>
          ))}
        </svg>

        {/* Milestone labels — HTML, so the mono ramp survives every width. */}
        {X.milestones.map((m, i) => (
          <div
            className="phl-or__ms"
            key={m.label}
            style={{ left: pctX(points[i].x), top: pctY(points[i].y - 13) }}
          >
            <span className="phl-or__ms-t">{m.t}</span>
            <span className="phl-or__ms-l">{m.label}</span>
          </div>
        ))}
      </div>

      <div className="phl-or__foot">
        <ul className="phl-or__stats">
          {X.impactStats.map((s) => (
            <li key={s.label}>
              <span className="phl-or__stat-v">{s.value}</span>
              <span className="phl-or__stat-l">
                {s.label}
                {s.detail ? <i>{s.detail}</i> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="phl-cta">
          {X.cta} <i aria-hidden="true">→</i>
        </p>
      </div>
    </section>
  );
}
