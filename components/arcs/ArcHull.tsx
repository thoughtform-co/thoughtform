import type { CSSProperties } from "react";

import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { hullLayout, polygonPath } from "./hull/hullLayout";

interface ArcHullProps {
  section: ArcSectionOf<"hull">;
  index: number;
  motion?: ArcMotion;
}

const pct = (f: number) => `${(f * 100).toFixed(3)}%`;

/**
 * ArcHull — agent-shaped work (ADR-139 U1). The answer to the turn's
 * question: of everything a team does, which part goes to an agent?
 *
 * Matthew Schwartz's convex hull ("Claude-shaped science", Anthropic),
 * drawn in the house's ink. The team's knowledge is a jagged star, one
 * spike per role, deep in one direction each. A dashed line runs round the
 * tips: everything inside it is within reach of what the team already
 * knows. The bays between the spikes, inside the line, are gold particles,
 * the beat's one bright object: work that crosses fields and can be
 * checked, which is the work an agent does best. The spikes stay the
 * people's, because that is where the judgement comes from.
 *
 * ⚠ PEOPLE ARE SHAPES, THE AGENT IS PARTICLES. The spectrum two beats back
 * draws intelligence as the cloud; this holds the same reading, so a room
 * meets one material for one thing.
 *
 * ⚠ THE SVG LETTERS NOTHING. Each role is DOM on a seat the layout emits as
 * a fraction of the crop, hung off its tip on the side the spike points.
 *
 * ⚠ SERVER, NO STATE, NO LISTENER. `data-hull-*` only.
 */
export function ArcHull({ section, index, motion = "reveal" }: ArcHullProps) {
  const { team, field, source, alt } = section;
  const L = hullLayout(team.roles.length);
  const roles = team.roles.slice(0, L.tips.length);
  return (
    <ArcBeat
      id={section.id}
      kind="hull"
      className="arc-section arc-sec arc-sec--hull"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="hull"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure
          className="arc-hull arc-reveal"
          data-hull-figure=""
          style={{ "--arc-hull-aspect": `${L.w} / ${L.h}` } as CSSProperties}
          {...rung(motion, 0.14)}
        >
          <div className="arc-hull__stage" role="img" aria-label={alt}>
            <svg
              className="arc-hull__svg"
              viewBox={`0 0 ${L.w.toFixed(2)} ${L.h.toFixed(2)}`}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <path className="arc-hull__line" d={polygonPath(L.hull)} />
              <g className="arc-hull__field">
                {L.field.map((d, i) => (
                  <circle
                    key={i}
                    cx={d.x.toFixed(2)}
                    cy={d.y.toFixed(2)}
                    r={d.r.toFixed(2)}
                    opacity={d.a.toFixed(2)}
                  />
                ))}
              </g>
              <path className="arc-hull__star" d={polygonPath(L.star)} />
              <g className="arc-hull__tips">
                {L.tips.map((t, i) => (
                  <circle key={roles[i] ?? i} cx={t.x.toFixed(2)} cy={t.y.toFixed(2)} r="3.2" />
                ))}
              </g>
            </svg>
            {roles.map((role, i) => (
              <span
                key={role}
                className="arc-hull__role"
                data-hull-side={L.seats[i].side}
                style={{ left: pct(L.seats[i].fx), top: pct(L.seats[i].fy) }}
              >
                {role}
              </span>
            ))}
          </div>

          <div className="arc-hull__key">
            <div className="arc-hull__keyrow" data-hull-key="team">
              <svg className="arc-hull__mark" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 L15 16 L12 13 L9 16 Z" />
              </svg>
              <span className="arc-hull__keylabel">{team.label}</span>
              <span className="arc-hull__keyline">{team.line}</span>
            </div>
            <div className="arc-hull__keyrow" data-hull-key="field">
              <svg className="arc-hull__mark" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="7" r="1.8" />
                <circle cx="14" cy="5" r="1.4" />
                <circle cx="19" cy="11" r="1.8" />
                <circle cx="9" cy="14" r="1.5" />
                <circle cx="16" cy="18" r="1.8" />
                <circle cx="5" cy="20" r="1.3" />
              </svg>
              <span className="arc-hull__keylabel">{field.label}</span>
              <span className="arc-hull__keyline">{field.line}</span>
            </div>
            <p className="arc-hull__source">{source}</p>
          </div>
        </figure>
      </div>
    </ArcBeat>
  );
}
