/* Substrate · P3 · the board. The Cyberpunk motherboard laid flat in
   isometric and drawn as a diagram: one board (X-Bionic), the configuration
   as the chip at its centre with the mark on it, the team's four workstreams
   wired into it from the back-left, and Claude Enterprise on the front-right
   with the agents, models and tools it already runs. Traces are bundles of
   three; only the chip and the traces out of it are gold. */

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";
import { OFFER, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { GLYPH } from "../glyphs";
import { boxFaces, makeIso, over, type Box, type Pt } from "../iso";
import { Cross, GOLD, pts, Tag, TEXT } from "./wire";

const W = 1000;
const H = 520;
const iso = makeIso(31, 510, 262);

const BOARD = { x0: -7.2, x1: 7.2, y0: -4.4, y1: 4.4 };
const CHIP: Box = { x0: -1.8, x1: 1.8, y0: -1.5, y1: 1.5, z0: 0, z1: 0.42 };
const TEAM_Y = [-3.0, -1.0, 1.0, 3.0];
const TEAM_X = -5.6;
const CL: Box = { x0: 3.4, x1: 6.4, y0: -3.0, y1: 3.0, z0: 0, z1: 0.55 };
const SUB_Y = [-2.4, -0.9, 0.6, 2.1];
const SUB = ["AGENTS", "MODELS", "SHOPIFY", "ANALYTICS"];

const path = (list: Pt[]) =>
  list.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

/** An orthogonal route on the board's plane, drawn as a bundle of three. */
function Bundle({
  route,
  gold,
  o = 0.55,
}: {
  route: [number, number][];
  gold?: boolean;
  o?: number;
}) {
  const c = gold ? GOLD : TEXT;
  return (
    <g>
      {[-0.13, 0, 0.13].map((d) => (
        <path
          key={d}
          d={path(
            route.map(([x, y], i) => {
              // offset perpendicular to each leg, so the three run parallel
              const n = route[Math.min(i + 1, route.length - 1)];
              const pr = route[Math.max(i - 1, 0)];
              const horiz = Math.abs(n[0] - pr[0]) > Math.abs(n[1] - pr[1]);
              return iso.p(x + (horiz ? 0 : d), y + (horiz ? d : 0), 0.01);
            })
          )}
          fill="none"
          stroke={c}
          strokeOpacity={o}
          strokeWidth={1}
        />
      ))}
    </g>
  );
}

function Solid({
  b,
  gold,
  tint = 0.05,
  o = 0.6,
}: {
  b: Box;
  gold?: boolean;
  tint?: number;
  o?: number;
}) {
  const f = boxFaces(iso, b);
  const c = gold ? GOLD : TEXT;
  return (
    <g>
      <polygon points={f.left} fill={over(c, tint * 1.4)} stroke={c} strokeOpacity={o} />
      <polygon points={f.right} fill={over(c, tint)} stroke={c} strokeOpacity={o} />
      <polygon points={f.top} fill={over(c, tint * 2)} stroke={c} strokeOpacity={o} />
    </g>
  );
}

export function SubstrateBoard() {
  const board: Pt[] = [
    iso.p(BOARD.x0, BOARD.y0, 0),
    iso.p(BOARD.x1, BOARD.y0, 0),
    iso.p(BOARD.x1, BOARD.y1, 0),
    iso.p(BOARD.x0, BOARD.y1, 0),
  ];
  const dots: Pt[] = [];
  for (let x = -6.5; x <= 6.5; x += 1)
    for (let y = -3.9; y <= 3.9; y += 1) dots.push(iso.p(x, y, 0));

  /* the mark on the chip's top face */
  const k = 2.6 / BRANDMARK_VIEWBOX.w;
  const markT = iso.plane(-1.3, -1.3 + 0.0, CHIP.z1, k);

  /* chip pins: short stubs along all four edges */
  const pins: string[] = [];
  for (let i = 0; i < 7; i++) {
    const t = -1.2 + (2.4 * i) / 6;
    const tx = -1.5 + (3.0 * i) / 6;
    const segs: [Pt, Pt][] = [
      [iso.p(CHIP.x0 - 0.25, t, 0), iso.p(CHIP.x0, t, 0)],
      [iso.p(CHIP.x1, t, 0), iso.p(CHIP.x1 + 0.25, t, 0)],
      [iso.p(tx, CHIP.y0 - 0.25, 0), iso.p(tx, CHIP.y0, 0)],
      [iso.p(tx, CHIP.y1, 0), iso.p(tx, CHIP.y1 + 0.25, 0)],
    ];
    for (const [a, b] of segs)
      pins.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }

  return (
    <Stage route="P3 · the board">
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
            aria-label="One board: the team's four workstreams wired into the configuration at the centre, and the configuration wired into Claude Enterprise with its agents, models and tools."
          >
            {/* the board */}
            <polygon points={pts(board)} fill="none" stroke={TEXT} strokeOpacity={0.3} />
            {board.map((p, i) => (
              <Cross key={i} at={p} o={0.55} />
            ))}
            <g fill={TEXT} fillOpacity={0.22}>
              {dots.map(([x, y], i) => (
                <rect key={i} x={x - 0.75} y={y - 0.75} width={1.5} height={1.5} />
              ))}
            </g>

            {/* team → chip */}
            {TEAM_Y.map((y, i) => {
              /* Outer modules jog nearest the chip, inner ones further out,
                 so no bundle crosses another on its way in. */
              const ey = [-0.9, -0.3, 0.3, 0.9][i];
              const jx = [-2.8, -3.6, -3.6, -2.8][i];
              return (
                <Bundle
                  key={y}
                  route={[
                    [TEAM_X + 0.8, y],
                    [jx, y],
                    [jx, ey],
                    [CHIP.x0 - 0.25, ey],
                  ]}
                />
              );
            })}
            {/* chip → Claude Enterprise */}
            {[-0.9, 0, 0.9].map((y) => (
              <Bundle
                key={y}
                route={[
                  [CHIP.x1 + 0.25, y],
                  [CL.x0, y],
                ]}
                gold
                o={0.8}
              />
            ))}

            {/* the team: four modules */}
            {TEAM_Y.map((y, i) => {
              const b: Box = {
                x0: TEAM_X - 0.8,
                x1: TEAM_X + 0.8,
                y0: y - 0.6,
                y1: y + 0.6,
                z0: 0,
                z1: 0.3,
              };
              return (
                <g key={y}>
                  <Solid b={b} />
                  <path
                    d={GLYPH[WORKSTREAMS[i].id]}
                    transform={iso.plane(b.x0 + 0.35, b.y0 + 0.1, b.z1, 1.0 / 24)}
                    fill="none"
                    stroke={TEXT}
                    strokeOpacity={0.85}
                  />
                </g>
              );
            })}

            {/* Claude Enterprise and what it already runs */}
            <Solid b={CL} tint={0.04} o={0.55} />
            {SUB_Y.map((y) => {
              const b: Box = {
                x0: CL.x0 + 0.5,
                x1: CL.x1 - 0.5,
                y0: y,
                y1: y + 1.1,
                z0: CL.z1,
                z1: CL.z1 + 0.22,
              };
              return <Solid key={y} b={b} tint={0.03} o={0.5} />;
            })}

            {/* the configuration: the chip */}
            <path d={pins.join("")} stroke={GOLD} strokeOpacity={0.8} />
            <Solid b={CHIP} gold tint={0.12} o={0.95} />
            <g transform={markT} fill={GOLD}>
              {BRANDMARK_PATHS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>

            {/* labels */}
            {TEAM_Y.map((y, i) => (
              <Tag
                key={y}
                at={iso.p(TEAM_X - 0.8, y + 0.6, 0.15)}
                to={148}
                head={WORKSTREAMS[i].name.replace("Creative ", "").toUpperCase()}
                anchor="end"
              />
            ))}
            <text
              x={138}
              y={iso.p(TEAM_X - 0.8, TEAM_Y[0] + 0.6, 0.15)[1] - 34}
              textAnchor="end"
              fill={TEXT}
              fillOpacity={0.5}
            >
              THE TEAM
            </text>
            {SUB_Y.map((y, i) => (
              <Tag key={y} at={iso.p(CL.x1 - 0.5, y + 0.55, CL.z1 + 0.22)} to={836} head={SUB[i]} />
            ))}
            <text
              x={830}
              y={iso.p(CL.x1 - 0.5, SUB_Y[0] + 0.55, CL.z1 + 0.22)[1] - 30}
              fill={TEXT}
              fillOpacity={0.5}
            >
              CLAUDE ENTERPRISE
            </text>
            {(() => {
              const a = iso.p(0, CHIP.y0, CHIP.z1);
              return (
                <g>
                  <rect x={a[0] - 2} y={a[1] - 2} width={4} height={4} fill={GOLD} />
                  <path d={`M${a[0]} ${a[1]}V92`} stroke={GOLD} strokeOpacity={0.5} />
                  <text x={a[0]} y={52} textAnchor="middle" fill={GOLD}>
                    THE CONFIGURATION
                  </text>
                  <text
                    x={a[0]}
                    y={76}
                    textAnchor="middle"
                    className="xb-t-sans"
                    fill={TEXT}
                    fillOpacity={0.6}
                  >
                    Written with the team
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </Stage>
  );
}
