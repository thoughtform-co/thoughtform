/* Substrate · P3 B · the board, second cut (owner, 2026-10-11, on P3: "the
   Thoughtform brand mark a bit more engraved, etched … that configuration
   a bit wider … the Claude Enterprise block in front of it should just be
   separate … Shopify, analytics, agents are like the interface … upright
   … in front of it, like they're really like windows … so it really feels
   like their interface is coming out of that entire flow").

   P3's board and grammar, with three changes:
     - the configuration chip is wider, and the mark is ETCHED into its top
       face: a recess darker than the face, a shadow along the walls the
       light cannot reach, a lit rim on the far walls, and a cut ring
       around it;
     - Claude Enterprise is one block on its own, nothing stacked on it;
     - the four interfaces stand upright in front of it as windows, off the
       board, each wired out of Claude Enterprise, each named in its own
       title bar. */

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";
import { OFFER, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { GLYPH } from "../glyphs";
import { boxFaces, C30, makeIso, over, type Box, type Pt } from "../iso";
import { Cross, GOLD, pts, Tag, TEXT } from "./wire";

const W = 860;
const H = 450;
const U = 31;
const iso = makeIso(U, 500, 268);

const BOARD = { x0: -8.4, x1: 5.0, y0: -4.4, y1: 4.4 };
const CHIP: Box = { x0: -2.8, x1: 1.4, y0: -2.1, y1: 2.1, z0: 0, z1: 0.42 };
const TEAM_Y = [-3.0, -1.0, 1.0, 3.0];
const TEAM_X = -6.8;
const CL: Box = { x0: 2.2, x1: 4.0, y0: -2.2, y1: 2.2, z0: 0, z1: 0.85 };
/* the windows: an upright 2 × 2 bank on the plane x = WIN_X, off the
   board's front edge, columns along y, rows up z */
const WIN_X = 8.4;
const WIN_W = 3.4;
const WIN_H = 1.55;
const WIN_GAP = 0.35;
const WIN_Z0 = 0.75;
const WIN_MID = -1.4; // the bank's centre in y: right of Claude Enterprise on screen
const WIN_COLS = [WIN_MID - (WIN_W + WIN_GAP / 2), WIN_MID + WIN_GAP / 2]; // each column's low y
/* top row, then bottom row; the right column first */
const WINDOWS = [
  { name: "AGENTS", col: 0, row: 1 },
  { name: "MODELS", col: 1, row: 1 },
  { name: "SHOPIFY", col: 0, row: 0 },
  { name: "ANALYTICS", col: 1, row: 0 },
];

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

/** A flat drawing on the upright plane x = xd: 1 drawing px = 1 screen px
    along the plane's width (up-right as y falls) and its height. */
const onWindow = (xd: number, yl: number, zt: number) => {
  const [e, f] = iso.p(xd, yl, zt);
  return `matrix(${C30} -0.5 0 1 ${e.toFixed(2)} ${f.toFixed(2)})`;
};

/** The mark, etched into a face: recess, shadow wall, lit rim, cut ring. */
export function EtchedMark({ transform, id }: { transform: string; id: string }) {
  const { w, h } = BRANDMARK_VIEWBOX;
  const d = 16; // wall depth, in mark units
  const ring = { cx: w / 2, cy: h / 2, r: Math.max(w, h) * 0.6 };
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={`${id}-clip`}>
          {BRANDMARK_PATHS.map((p, i) => (
            <path key={i} d={p} />
          ))}
        </clipPath>
      </defs>
      {/* the cut ring: a groove, dark wall then lit lip */}
      <circle
        cx={ring.cx}
        cy={ring.cy}
        r={ring.r}
        fill="none"
        stroke="#000"
        strokeOpacity={0.55}
        strokeWidth={14}
      />
      <circle
        cx={ring.cx + 5}
        cy={ring.cy + 5}
        r={ring.r}
        fill="none"
        stroke={GOLD}
        strokeOpacity={0.55}
        strokeWidth={3}
      />
      {/* the recess floor */}
      <g fill={over(GOLD, 0.06)}>
        {BRANDMARK_PATHS.map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>
      <g clipPath={`url(#${id}-clip)`}>
        {/* shadow along the near walls: everything but the mark, shifted */}
        <path
          d={`M-200 -200H${w + 200}V${h + 200}H-200Z ${BRANDMARK_PATHS.join(" ")}`}
          transform={`translate(${d} ${d})`}
          fillRule="evenodd"
          fill="#000"
          fillOpacity={0.75}
        />
        {/* the lit rim on the far walls */}
        <g
          transform={`translate(${-d * 0.45} ${-d * 0.45})`}
          fill="none"
          stroke={GOLD}
          strokeWidth={5}
          strokeOpacity={0.9}
        >
          {BRANDMARK_PATHS.map((p, i) => (
            <path key={i} d={p} />
          ))}
        </g>
      </g>
      {/* the cut edge */}
      <g fill="none" stroke={GOLD} strokeOpacity={0.55} strokeWidth={2}>
        {BRANDMARK_PATHS.map((p, i) => (
          <path key={i} d={p} />
        ))}
      </g>
    </g>
  );
}

export function SubstrateBoardB() {
  const board: Pt[] = [
    iso.p(BOARD.x0, BOARD.y0, 0),
    iso.p(BOARD.x1, BOARD.y0, 0),
    iso.p(BOARD.x1, BOARD.y1, 0),
    iso.p(BOARD.x0, BOARD.y1, 0),
  ];
  const dots: Pt[] = [];
  for (let x = BOARD.x0 + 0.7; x <= BOARD.x1 - 0.5; x += 1)
    for (let y = -3.9; y <= 3.9; y += 1) dots.push(iso.p(x, y, 0));

  /* the mark on the chip's top face, centred, a little inside its edge */
  const chipW = CHIP.x1 - CHIP.x0;
  const markU = Math.min(chipW, CHIP.y1 - CHIP.y0) * 0.72;
  const k = markU / BRANDMARK_VIEWBOX.w;
  const cx = (CHIP.x0 + CHIP.x1) / 2;
  const markT = iso.plane(cx - markU / 2, -markU / 2, CHIP.z1, k);

  /* chip pins: short stubs along all four edges */
  const pins: string[] = [];
  for (let i = 0; i < 9; i++) {
    const t = CHIP.y0 + 0.3 + ((CHIP.y1 - CHIP.y0 - 0.6) * i) / 8;
    const tx = CHIP.x0 + 0.3 + ((chipW - 0.6) * i) / 8;
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
    <Stage route="P3 B · the board, windows">
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
            aria-label="One board: the team's four workstreams wired into the configuration at the centre, the configuration wired into Claude Enterprise, and four windows (agents, models, Shopify, analytics) standing in front of it, wired out of it."
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
              const ey = [-1.2, -0.4, 0.4, 1.2][i];
              const jx = [-4.4, -5.2, -5.2, -4.4][i];
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
            {[-1.1, 0, 1.1].map((y) => (
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

            {/* the configuration: the chip, wider, the mark etched in */}
            <path d={pins.join("")} stroke={GOLD} strokeOpacity={0.8} />
            <Solid b={CHIP} gold tint={0.12} o={0.95} />
            <EtchedMark transform={markT} id="p3b-mark" />

            {/* Claude Enterprise: one block, nothing on it, in front of the
                chip, so painted after it */}
            <Solid b={CL} tint={0.05} o={0.7} />

            {/* out of Claude Enterprise into the bank: the flow, continued */}
            {[-1.6, -0.5, 0.6].map((y) => {
              const a = iso.p(CL.x1, y, 0.01);
              const b = iso.p(WIN_X, y, 0.01);
              const c = iso.p(WIN_X, y, WIN_Z0);
              return (
                <g key={`c${y}`}>
                  <path
                    d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`}
                    fill="none"
                    stroke={GOLD}
                    strokeOpacity={0.8}
                    strokeDasharray="2 4"
                  />
                  <rect x={c[0] - 2} y={c[1] - 2} width={4} height={4} fill={GOLD} />
                </g>
              );
            })}

            {/* the windows: upright, facing out of the flow */}
            {WINDOWS.map((win) => {
              const y0 = WIN_COLS[win.col];
              const z0 = WIN_Z0 + win.row * (WIN_H + WIN_GAP);
              const z1 = z0 + WIN_H;
              const q: Pt[] = [
                iso.p(WIN_X, y0 + WIN_W, z1),
                iso.p(WIN_X, y0, z1),
                iso.p(WIN_X, y0, z0),
                iso.p(WIN_X, y0 + WIN_W, z0),
              ];
              const wpx = WIN_W * U;
              const hpx = WIN_H * U;
              return (
                <g key={win.name}>
                  <polygon
                    points={pts(q)}
                    fill={over(TEXT, 0.05)}
                    stroke={TEXT}
                    strokeOpacity={0.75}
                  />
                  <g transform={onWindow(WIN_X, y0 + WIN_W, z1)}>
                    <rect
                      x={0}
                      y={0}
                      width={wpx}
                      height={22}
                      fill={over(TEXT, 0.12)}
                      stroke={TEXT}
                      strokeOpacity={0.75}
                    />
                    <text x={9} y={16} fill={TEXT}>
                      {win.name}
                    </text>
                    {[0, 1].map((r) => (
                      <rect
                        key={r}
                        x={9}
                        y={31 + r * 8}
                        width={[wpx - 40, wpx - 58][r]}
                        height={3}
                        fill={TEXT}
                        fillOpacity={0.3}
                      />
                    ))}
                    <rect
                      x={wpx - 24}
                      y={hpx - 13}
                      width={15}
                      height={7}
                      fill={GOLD}
                      fillOpacity={0.85}
                    />
                  </g>
                </g>
              );
            })}

            {/* labels */}
            {TEAM_Y.map((y, i) => (
              <Tag
                key={y}
                at={iso.p(TEAM_X - 0.8, y + 0.6, 0.15)}
                to={iso.p(BOARD.x0, BOARD.y1, 0)[0] - 18}
                head={WORKSTREAMS[i].name.replace("Creative ", "").toUpperCase()}
                anchor="end"
              />
            ))}
            <text
              x={iso.p(BOARD.x0, BOARD.y1, 0)[0] - 28}
              y={iso.p(TEAM_X - 0.8, TEAM_Y[0] + 0.6, 0.15)[1] - 34}
              textAnchor="end"
              fill={TEXT}
              fillOpacity={0.5}
            >
              THE TEAM
            </text>
            {(() => {
              const a = iso.p(cx, CHIP.y0 + 0.2, CHIP.z1);
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
            {(() => {
              /* named from below, clear of the configuration's label */
              const a = iso.p(CL.x1, CL.y1 - 0.3, 0.3);
              const base = H - 12;
              return (
                <g>
                  <rect x={a[0] - 2} y={a[1] - 2} width={4} height={4} fill={TEXT} />
                  <path d={`M${a[0]} ${a[1]}V${base - 22}`} stroke={TEXT} strokeOpacity={0.45} />
                  <text x={a[0]} y={base} textAnchor="middle" fill={TEXT}>
                    CLAUDE ENTERPRISE
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
