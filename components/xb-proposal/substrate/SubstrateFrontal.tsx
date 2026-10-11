/* Substrate · P2 · frontal planes. Unsiloed's "raw document to LLM-ready
   data" view: three horizontal planes seen from the front and a little
   above, drawn as outlines with crosses and a dashed bounding volume. The
   team on top, the configuration in the middle (the one tinted plane, the
   mark at its centre), X-Bionic's Claude Enterprise below. The team's work
   converges into the configuration; the configuration fans out to the
   agents, the models and the tools. */

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";
import { OFFER } from "../copy";
import { Stage } from "../Frame";
import { over, type Pt } from "../iso";
import { Cross, GOLD, pts, Tag, TEXT, WirePlane } from "./wire";

const W = 1000;
const H = 540;
const CX = 380;
const CY = 352;
const HALF = 290; // half the front edge, in px
const DEPTH = 96; // screen depth of a plane
const LIFT = 152; // screen distance between planes
const BACK = 0.8; // the back edge's width against the front's

/** x from -1 to 1 across the plane, y from 0 (back) to 1 (front), z = plane index. */
function P(x: number, y: number, z: number): Pt {
  const s = BACK + (1 - BACK) * y;
  return [CX + x * HALF * s, CY + y * DEPTH - z * LIFT];
}

const plane = (z: number): Pt[] => [P(-1, 0, z), P(1, 0, z), P(1, 1, z), P(-1, 1, z)];

const TEAM = ["PRODUCTION", "OPS", "REVIEW", "STRATEGY"];
const BASE = ["AGENTS", "MODELS", "SHOPIFY", "ANALYTICS"];
const XS = [-0.66, -0.22, 0.22, 0.66];

/** A small square lying on a plane, in the plane's perspective. */
function Pad({
  x,
  y,
  z,
  w = 0.16,
  d = 0.32,
  gold,
  lit,
}: {
  x: number;
  y: number;
  z: number;
  w?: number;
  d?: number;
  gold?: boolean;
  lit?: boolean;
}) {
  const q = [
    P(x - w / 2, y - d / 2, z),
    P(x + w / 2, y - d / 2, z),
    P(x + w / 2, y + d / 2, z),
    P(x - w / 2, y + d / 2, z),
  ];
  const c = gold ? GOLD : TEXT;
  return (
    <polygon
      points={pts(q)}
      fill={lit ? over(c, 0.16) : "#0a0908"}
      stroke={c}
      strokeOpacity={0.75}
    />
  );
}

export function SubstrateFrontal() {
  const hub = P(0, 0.5, 1);
  /* The mark, laid flat on the middle plane at its centre: foreshortened
     the way the plane is (the plane is shallow, so an affine squash reads true). */
  const mw = 112;
  const mh = mw * 0.34 * (BRANDMARK_VIEWBOX.h / BRANDMARK_VIEWBOX.w);
  const mark = `translate(${hub[0] - mw / 2} ${hub[1] - mh / 2}) scale(${mw / BRANDMARK_VIEWBOX.w} ${mh / BRANDMARK_VIEWBOX.h})`;

  return (
    <Stage route="P2 · frontal planes">
      <div className="xbP">
        <header className="xbP__head">
          <div>
            <div className="xb-eyebrow">{OFFER.eyebrow}</div>
            <h2 className="xb-title xbP__title">
              {OFFER.title[0]} <span>{OFFER.title[1]}</span>
            </h2>
          </div>
          <p className="xb-body xbP__intro">{OFFER.intro}</p>
        </header>
        <div className="xbP__fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Three planes: X-Bionic's team on top, the intelligence configuration in the middle, Claude Enterprise below. The team's work converges into the configuration, which fans out to the agents, the models and the tools."
          >
            {/* the bounding volume */}
            {[
              [-1, 0],
              [1, 0],
              [1, 1],
              [-1, 1],
            ].map(([x, y]) => {
              const a = P(x, y, 2);
              const b = P(x, y, 0);
              return (
                <line
                  key={`${x}${y}`}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={TEXT}
                  strokeOpacity={0.18}
                  strokeDasharray="2 5"
                />
              );
            })}

            {/* 03 · Claude Enterprise */}
            <WirePlane corners={plane(0)} o={0.45} />
            {XS.map((x) => (
              <Pad key={x} x={x} y={0.5} z={0} />
            ))}

            {/* the configuration fans out to their agents, models and tools */}
            {XS.map((x) => {
              const b = P(x, 0.5, 0);
              return (
                <line
                  key={`f${x}`}
                  x1={hub[0]}
                  y1={hub[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={GOLD}
                  strokeOpacity={0.7}
                  strokeDasharray="2 4"
                />
              );
            })}

            {/* 02 · the configuration: the one tinted plane */}
            <WirePlane corners={plane(1)} gold fill={over(GOLD, 0.08)} o={0.7} />
            <g transform={mark} fill={GOLD} fillOpacity={0.9}>
              {BRANDMARK_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {/* its front band */}
            <rect
              x={P(-1, 1, 1)[0]}
              y={P(-1, 1, 1)[1]}
              width={HALF * 2}
              height={26}
              fill={over(GOLD, 0.14)}
              stroke={GOLD}
              strokeOpacity={0.7}
            />
            <text x={P(-1, 1, 1)[0] + 12} y={P(-1, 1, 1)[1] + 17} fill={GOLD}>
              [ CONTEXT ]
            </text>
            <text x={CX} y={P(-1, 1, 1)[1] + 17} textAnchor="middle" fill={GOLD}>
              [ SKILLS ]
            </text>
            <text x={P(1, 1, 1)[0] - 12} y={P(-1, 1, 1)[1] + 17} textAnchor="end" fill={GOLD}>
              [ EVALS ]
            </text>

            {/* the team's work converges into it */}
            {XS.map((x) => {
              const a = P(x, 0.5, 2);
              return (
                <g key={`c${x}`}>
                  <line
                    x1={a[0]}
                    y1={a[1]}
                    x2={hub[0]}
                    y2={hub[1]}
                    stroke={GOLD}
                    strokeOpacity={0.7}
                    strokeDasharray="2 4"
                  />
                </g>
              );
            })}
            <Cross at={hub} c={GOLD} o={1} s={7} />

            {/* 01 · the team */}
            <WirePlane corners={plane(2)} o={0.45} />
            {XS.map((x, i) => {
              const top = P(x, 0.5 - 0.16, 2);
              return (
                <g key={`t${x}`}>
                  <Pad x={x} y={0.5} z={2} lit />
                  <text
                    x={top[0]}
                    y={top[1] - 10}
                    textAnchor="middle"
                    fill={TEXT}
                    fillOpacity={0.85}
                  >
                    {TEAM[i]}
                  </text>
                </g>
              );
            })}
            {XS.map((x, i) => {
              const bot = P(x, 0.5 + 0.16, 0);
              return (
                <text
                  key={`b${x}`}
                  x={bot[0]}
                  y={bot[1] + 22}
                  textAnchor="middle"
                  fill={TEXT}
                  fillOpacity={0.7}
                >
                  {BASE[i]}
                </text>
              );
            })}

            {/* the three levels, read top to bottom */}
            <Tag at={P(1, 0.5, 2)} to={760} head="01 · THE TEAM" sub="Four creative workstreams" />
            <Tag
              at={P(1, 0.5, 1)}
              to={760}
              head="02 · THE CONFIGURATION"
              sub="Written with the team"
              gold
            />
            <Tag
              at={P(1, 0.5, 0)}
              to={760}
              head="03 · CLAUDE ENTERPRISE"
              sub="Already running at X-Bionic"
            />
          </svg>
        </div>
      </div>
    </Stage>
  );
}
