/* Section 2 · B · the opened slab. The technical manual's exploded view:
   the section 1 layer pulled apart into its three strata, centred, with one
   leader out of each side. Left is adoption, where each stratum comes from;
   right is automation, what an agent can do once it is written. */

import { LAYER, OPENED } from "../copy";
import { Stage } from "../Frame";
import { makeIso } from "../iso";
import { LayerSlab, slabBoxes, type SlabGeometry } from "../LayerSlab";

const GOLD = "#caa554";
const TEXT = "#ebe3d6";
const W = 1000;
const H = 400;
const L_X = 318;
const R_X = 682;

export function LayerOpened() {
  const iso = makeIso(24, W / 2, 290);
  const g: SlabGeometry = { x0: -3.5, x1: 3.5, y0: -3.5, y1: 3.5, z0: 0, t: 0.5, gap: 2.6 };
  const strata = slabBoxes(g);
  /* Top to bottom as drawn: Evals, Skills, Context (the boxes run base first). */
  const rows = OPENED.map((o, i) => {
    const b = strata[2 - i];
    const zm = (b.z0 + b.z1) / 2;
    return { o, left: iso.p(b.x0, b.y1, zm), right: iso.p(b.x1, b.y0, zm) };
  });

  return (
    <Stage route="S2 · B · opened">
      <div className="xbS2B">
        <header className="xbS2B__head">
          <div>
            <div className="xb-eyebrow">{LAYER.eyebrow}</div>
            <h2 className="xb-title xbS2B__title">
              {LAYER.title[0]} <span>{LAYER.title[1]}</span>
            </h2>
          </div>
          <p className="xb-body xbS2B__intro">{LAYER.intro}</p>
        </header>
        <div className="xbS2B__fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="The X-Bionic layer pulled apart into evals, skills and context. Each is written from the team's work on the left and lets an agent do more on the right."
          >
            <text x={L_X - 10} y={22} textAnchor="end" fill={TEXT} fillOpacity={0.5}>
              ADOPTION · WRITTEN BY THE TEAM
            </text>
            <text x={R_X + 10} y={22} fill={GOLD}>
              AUTOMATION · RUN BY AN AGENT
            </text>

            {/* the slab's axis: where the three strata stood when closed */}
            {[
              [g.x0, g.y1],
              [g.x1, g.y0],
              [g.x1, g.y1],
            ].map(([x, y]) => {
              const a = iso.p(x, y, strata[0].z0);
              const b = iso.p(x, y, strata[2].z1);
              return (
                <line
                  key={`${x}${y}`}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={GOLD}
                  strokeOpacity={0.35}
                  strokeDasharray="2 4"
                />
              );
            })}

            <LayerSlab iso={iso} g={g} />

            {rows.map(({ o, left, right }) => (
              <g key={o.id}>
                <rect x={left[0] - 2} y={left[1] - 2} width={4} height={4} fill={TEXT} />
                <path
                  d={`M${left[0] - 4} ${left[1]}H${L_X}`}
                  stroke={TEXT}
                  strokeOpacity={0.35}
                  fill="none"
                />
                <text
                  x={L_X - 10}
                  y={left[1] - 6}
                  textAnchor="end"
                  className="xb-t-sans"
                  fill={TEXT}
                >
                  {o.from[0]}
                </text>
                <text
                  x={L_X - 10}
                  y={left[1] + 16}
                  textAnchor="end"
                  className="xb-t-sans"
                  fill={TEXT}
                  fillOpacity={0.6}
                >
                  {o.from[1]}
                </text>

                <rect x={right[0] - 2} y={right[1] - 2} width={4} height={4} fill={GOLD} />
                <path
                  d={`M${right[0] + 4} ${right[1]}H${R_X}`}
                  stroke={GOLD}
                  strokeOpacity={0.55}
                  fill="none"
                />
                <text x={R_X + 10} y={right[1] - 24} fill={GOLD}>
                  {`${o.name.toUpperCase()} · ${o.gist.toUpperCase()}`}
                </text>
                <text x={R_X + 10} y={right[1] - 2} className="xb-t-sans" fill={TEXT}>
                  {o.lets[0]}
                </text>
                <text
                  x={R_X + 10}
                  y={right[1] + 18}
                  className="xb-t-sans"
                  fill={TEXT}
                  fillOpacity={0.6}
                >
                  {o.lets[1]}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </Stage>
  );
}
