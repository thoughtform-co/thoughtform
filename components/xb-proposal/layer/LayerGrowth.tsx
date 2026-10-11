/* Section 2 · C · the layer, growing. One ruled frame read left to right
   over time: the section 1 slab gains a stratum per step, a gold line under
   it rises as an agent runs longer on its own, and the team's own work
   moves upstream on the bottom row. A progression, not a cycle. */

import { GROWTH, HORIZON, LAYER } from "../copy";
import { Stage } from "../Frame";
import { boxFaces, makeIso } from "../iso";
import { LayerSlab, type SlabGeometry } from "../LayerSlab";

const GOLD = "#caa554";
const TEXT = "#ebe3d6";
const W = 1000;
const H = 450;
const AXIS = 110;
const COLW = (W - AXIS) / 3;
const CX = GROWTH.map((_, i) => AXIS + COLW * (i + 0.5));
const LEVEL_Y = [270, 236, 202];
const CHART = { top: 160, bottom: 284 };

export function LayerGrowth() {
  const line: string[] = [];
  GROWTH.forEach((s, i) => {
    const y = LEVEL_Y[s.level];
    if (i === 0) line.push(`M${AXIS + 12} ${y}`);
    else line.push(`H${CX[i]}`, `V${y}`);
    if (i === GROWTH.length - 1) line.push(`H${W - 24}`);
  });

  return (
    <Stage route="S2 · C · growth">
      <div className="xbS2C">
        <header className="xbS2C__head">
          <div>
            <div className="xb-eyebrow">{LAYER.eyebrow}</div>
            <h2 className="xb-title xbS2C__title">
              {LAYER.title[0]} <span>{LAYER.title[1]}</span>
            </h2>
          </div>
          <p className="xb-body xbS2C__intro">{LAYER.intro}</p>
        </header>
        <div className="xb-frame xbS2C__frame">
          <div className="xb-frame__in" data-xb-ruled>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="The layer over three steps: context in week one, skills in week two, evals by the first quarter. An agent runs for minutes, then an hour, then a day, and the team moves from making the ads to deciding what to test."
            >
              {[1, 2].map((k) => (
                <line
                  key={k}
                  x1={AXIS + COLW * k}
                  y1={0}
                  x2={AXIS + COLW * k}
                  y2={H}
                  stroke={TEXT}
                  strokeOpacity={0.12}
                />
              ))}
              <line
                x1={0}
                y1={CHART.top - 14}
                x2={W}
                y2={CHART.top - 14}
                stroke={TEXT}
                strokeOpacity={0.12}
              />
              <line
                x1={0}
                y1={CHART.bottom + 16}
                x2={W}
                y2={CHART.bottom + 16}
                stroke={TEXT}
                strokeOpacity={0.12}
              />

              {/* the slab, one stratum more each step */}
              {GROWTH.map((s, i) => {
                const iso = makeIso(13, CX[i], 104);
                const g: SlabGeometry = {
                  x0: -3.6,
                  x1: 3.6,
                  y0: -2.2,
                  y1: 2.2,
                  z0: 0,
                  t: 0.62,
                  gap: 0.12,
                };
                return (
                  <g key={s.when}>
                    <text x={AXIS + COLW * i + 20} y={30} fill={TEXT} fillOpacity={0.55}>
                      {s.when.toUpperCase()}
                    </text>
                    <text x={AXIS + COLW * (i + 1) - 20} y={30} textAnchor="end" fill={GOLD}>
                      {s.adds.toUpperCase()}
                    </text>
                    <GrowingSlab iso={iso} g={g} count={i + 1} />
                  </g>
                );
              })}

              {/* the measured line: how long an agent runs on its own */}
              <text x={20} y={CHART.top + 16} fill={TEXT} fillOpacity={0.55}>
                AGENT RUNS
              </text>
              {HORIZON.map((h, k) => (
                <g key={h}>
                  <line
                    x1={AXIS}
                    y1={LEVEL_Y[k]}
                    x2={W}
                    y2={LEVEL_Y[k]}
                    stroke={TEXT}
                    strokeOpacity={0.1}
                    strokeDasharray="1 5"
                  />
                  <text
                    x={AXIS - 12}
                    y={LEVEL_Y[k] + 4}
                    textAnchor="end"
                    fill={TEXT}
                    fillOpacity={0.55}
                  >
                    {h.toUpperCase()}
                  </text>
                </g>
              ))}
              <path d={line.join("")} fill="none" stroke={GOLD} strokeWidth={1.5} />
              {GROWTH.map((s, i) => (
                <rect
                  key={s.when}
                  x={CX[i] - 5}
                  y={LEVEL_Y[s.level] - 5}
                  width={10}
                  height={10}
                  fill={GOLD}
                />
              ))}

              {/* what it means, and where the team's own work goes */}
              {GROWTH.map((s, i) => (
                <g key={`t-${s.when}`}>
                  <text
                    x={AXIS + COLW * i + 20}
                    y={CHART.bottom + 52}
                    className="xb-t-sans"
                    fill={TEXT}
                  >
                    {s.runs[0]}
                  </text>
                  <text
                    x={AXIS + COLW * i + 20}
                    y={CHART.bottom + 74}
                    className="xb-t-sans"
                    fill={TEXT}
                    fillOpacity={0.6}
                  >
                    {s.runs[1]}
                  </text>
                  <text
                    x={AXIS + COLW * i + 20}
                    y={CHART.bottom + 128}
                    fill={TEXT}
                    fillOpacity={0.5 + 0.25 * i}
                  >
                    {s.team.toUpperCase()}
                  </text>
                </g>
              ))}
              <line
                x1={0}
                y1={CHART.bottom + 100}
                x2={W}
                y2={CHART.bottom + 100}
                stroke={TEXT}
                strokeOpacity={0.12}
              />
            </svg>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/** The section 1 slab with only its first `count` strata written; the rest
    stand as a dashed outline of where they will go. */
function GrowingSlab({
  iso,
  g,
  count,
}: {
  iso: ReturnType<typeof makeIso>;
  g: SlabGeometry;
  count: number;
}) {
  const ghostZ1 = g.z0 + 3 * g.t + 2 * g.gap;
  const ghost = boxFaces(iso, {
    x0: g.x0,
    x1: g.x1,
    y0: g.y0,
    y1: g.y1,
    z0: g.z0,
    z1: ghostZ1,
  }).outline;
  return (
    <g>
      {count < 3 && (
        <polygon
          points={ghost}
          fill="none"
          stroke={GOLD}
          strokeOpacity={0.4}
          strokeDasharray="3 4"
        />
      )}
      <LayerSlab iso={iso} g={g} count={count as 1 | 2 | 3} etch={count === 3} />
    </g>
  );
}
