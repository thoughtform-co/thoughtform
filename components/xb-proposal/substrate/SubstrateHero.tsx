/* Substrate · P4 · the Unsiloed hero. Text left, the drawing right: the
   team's raw work as a stack of faded standing sheets at the back, the
   configuration as one gold panel at the front with six structured cells
   (context, skills, evals, two each), gold leaders from the raw sheets to
   the cells, a skewed banner over the panel and tag pairs riding the
   panel's plane on the right. An isometric floor grid fades out behind. */

import { OFFER } from "../copy";
import { Stage } from "../Frame";
import { makeIso, over, type Pt } from "../iso";
import { GOLD, pts, TEXT } from "./wire";

const W = 600;
const H = 500;
const U = 29;
const iso = makeIso(U, 105, 330);

/* Standing planes at fixed x; on screen their width runs up-right (−y). */
const SHEET = { w: 7, h: 7.6, y0: 3.4 };
const RAW_X = [0, 0.55, 1.1, 1.65, 2.2];
const PANEL = { x: 6.6, w: 10, h: 8.8, y0: 3.0 };
const FRAME_GAP = 0.32;

/** A flat drawing laid on the plane x = xd: 1 drawing px = 1 screen px
    along each axis, origin at the plane's top-left (y = yl, z = zt). */
const onPlane = (xd: number, yl: number, zt: number) => {
  const [e, f] = iso.p(xd, yl, zt);
  return `matrix(0.866 -0.5 0 1 ${e.toFixed(2)} ${f.toFixed(2)})`;
};
const quad = (xd: number, yl: number, w: number, z0: number, z1: number): Pt[] => [
  iso.p(xd, yl, z1),
  iso.p(xd, yl - w, z1),
  iso.p(xd, yl - w, z0),
  iso.p(xd, yl, z0),
];
/** A point on the panel from its drawing coordinates. */
const onPanel = (dx: number, dy: number): Pt => iso.p(PANEL.x, PANEL.y0 - dx / U, PANEL.h - dy / U);

const PW = PANEL.w * U; // panel width in drawing px
const CELL = { x0: 14, y0: 16, w: (PW - 14 * 3) / 2, h: 70, gap: 12 };
const ROWS = [
  { id: "context", cells: ["FACTS", "VOICE"] },
  { id: "skills", cells: ["BRIEFS", "NAMING"] },
  { id: "evals", cells: ["ACCURACY", "VOICE CHECK"] },
];
const TAGS = [
  ["CONTEXT", "FACTS"],
  ["SKILLS", "BRIEFS"],
  ["EVALS", "CHECKS"],
];

function Cell({ r, c }: { r: number; c: number }) {
  const x = CELL.x0 + c * (CELL.w + 14);
  const y = CELL.y0 + r * (CELL.h + CELL.gap);
  const inner = (() => {
    const k = `${r}${c}`;
    if (k === "00")
      return [0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={x + 10}
            y={y + 30 + i * 12}
            width={34}
            height={5}
            fill={GOLD}
            fillOpacity={0.45}
          />
          <rect
            x={x + 52}
            y={y + 30 + i * 12}
            width={[40, 28, 46][i]}
            height={5}
            fill={TEXT}
            fillOpacity={0.35}
          />
        </g>
      ));
    if (k === "01")
      return [0, 1, 2].map((i) => (
        <rect
          key={i}
          x={x + 10}
          y={y + 30 + i * 12}
          width={[86, 70, 54][i]}
          height={5}
          fill={TEXT}
          fillOpacity={0.35}
        />
      ));
    if (k === "10")
      return (
        <g>
          <rect
            x={x + 10}
            y={y + 34}
            width={16}
            height={22}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.8}
          />
          <path d={`M${x + 30} ${y + 45}H${x + 42}`} stroke={GOLD} strokeOpacity={0.6} />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={x + 46 + i * 11}
              y={y + 37}
              width={8}
              height={16}
              fill={GOLD}
              fillOpacity={0.3 + i * 0.1}
            />
          ))}
        </g>
      );
    if (k === "11")
      return [0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={x + 10}
            y={y + 30 + i * 12}
            width={6}
            height={6}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.7}
          />
          <rect
            x={x + 22}
            y={y + 30.5 + i * 12}
            width={[58, 66, 44][i]}
            height={5}
            fill={TEXT}
            fillOpacity={0.35}
          />
        </g>
      ));
    if (k === "20")
      return [0, 1, 2].map((i) => (
        <g key={i}>
          <path
            d={`M${x + 10} ${y + 33 + i * 12}l3 3 6 -6`}
            fill="none"
            stroke={GOLD}
            strokeWidth={1.4}
          />
          <rect
            x={x + 26}
            y={y + 31 + i * 12}
            width={[60, 48, 66][i]}
            height={5}
            fill={TEXT}
            fillOpacity={0.35}
          />
        </g>
      ));
    return (
      <g>
        {[0.55, 0.8, 0.7, 0.92, 0.85, 0.96].map((v, i) => (
          <rect
            key={i}
            x={x + 10 + i * 15}
            y={y + 60 - 26 * v}
            width={9}
            height={26 * v}
            fill={GOLD}
            fillOpacity={0.25 + 0.6 * v * v}
          />
        ))}
      </g>
    );
  })();
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL.w}
        height={CELL.h}
        fill={over(GOLD, 0.06)}
        stroke={GOLD}
        strokeOpacity={0.7}
      />
      <text x={x + 10} y={y + 19} fill={GOLD}>
        {ROWS[r].cells[c]}
      </text>
      {inner}
    </g>
  );
}

export function SubstrateHero() {
  /* the floor grid, in the plane z = 0, faded toward the edges */
  const grid: string[] = [];
  for (let i = -1; i <= 8.5; i += 1) {
    const a = iso.p(i, -8, 0);
    const b = iso.p(i, 3, 0);
    grid.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  for (let j = -8; j <= 3; j += 1) {
    const a = iso.p(-1, j, 0);
    const b = iso.p(8.5, j, 0);
    grid.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  const center = iso.p(4, 0, 3);

  /* leaders: points on the front raw sheet to the cells' left edges */
  const leaders: [Pt, Pt][] = ROWS.flatMap((_, r) => {
    const src = iso.p(RAW_X[RAW_X.length - 1], 1.4 - r * 1.3, 6.2 - r * 2.0);
    const dst = onPanel(CELL.x0, CELL.y0 + r * (CELL.h + CELL.gap) + CELL.h / 2);
    return [[src, dst] as [Pt, Pt]];
  });

  return (
    <Stage route="P4 · Unsiloed hero">
      <div className="xbH">
        <div className="xbH__text">
          <p className="xbH__eyebrow">
            [ <span>{OFFER.eyebrow}</span> ]
          </p>
          <h2 className="xbH__title">
            Where Thoughtform
            <br />
            plugs in.
          </h2>
          <p className="xbH__lede">{OFFER.intro}</p>
          <ol className="xbH__steps">
            <li>
              <span>01</span>Embed in the team
            </li>
            <li>
              <span>02</span>Write the work down
            </li>
            <li>
              <span>03</span>Plug it into Claude
            </li>
          </ol>
        </div>
        <div className="xbH__fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="The team's raw work as a stack of sheets, written into one gold configuration panel of context, skills and evals."
          >
            <defs>
              <radialGradient
                id="xbh-fade"
                cx={center[0]}
                cy={center[1]}
                r={330}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#fff" stopOpacity="1" />
                <stop offset="0.65" stopColor="#fff" stopOpacity="0.35" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <mask id="xbh-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <rect width={W} height={H} fill="url(#xbh-fade)" />
              </mask>
            </defs>
            <path
              d={grid.join("")}
              stroke={TEXT}
              strokeOpacity={0.09}
              fill="none"
              mask="url(#xbh-mask)"
            />

            {/* the team's raw work, back to front */}
            {RAW_X.map((x, i) => {
              const o = 0.25 + i * 0.16;
              return (
                <g key={x} opacity={o}>
                  <polygon
                    points={pts(quad(x, SHEET.y0, SHEET.w, 0, SHEET.h))}
                    fill="#0e0d0b"
                    stroke={TEXT}
                    strokeOpacity={0.6}
                  />
                  <g transform={onPlane(x, SHEET.y0, SHEET.h)}>
                    <rect x={14} y={14} width={90} height={6} fill={TEXT} fillOpacity={0.5} />
                    {i === RAW_X.length - 1 && (
                      <rect
                        x={14}
                        y={30}
                        width={70}
                        height={56}
                        fill="none"
                        stroke={TEXT}
                        strokeOpacity={0.5}
                      />
                    )}
                    {Array.from({ length: 11 }, (_, l) => (
                      <rect
                        key={l}
                        x={14}
                        y={(i === RAW_X.length - 1 ? 100 : 34) + l * 11}
                        width={[150, 120, 170, 96, 140, 160, 110, 150, 80, 130, 100][l]}
                        height={3}
                        fill={TEXT}
                        fillOpacity={0.3}
                      />
                    ))}
                  </g>
                </g>
              );
            })}

            {/* leaders: the work, written into the cells */}
            {leaders.map(([a, b], i) => (
              <g key={i}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={GOLD} strokeOpacity={0.75} />
                <circle cx={a[0]} cy={a[1]} r={2.5} fill={GOLD} />
              </g>
            ))}

            {/* the configuration: an outer frame and the panel */}
            <polygon
              points={pts(
                quad(PANEL.x - FRAME_GAP, PANEL.y0 + 0.4, PANEL.w + 0.8, -0.4, PANEL.h + 0.4)
              )}
              fill="none"
              stroke={GOLD}
              strokeOpacity={0.45}
            />
            <polygon
              points={pts(quad(PANEL.x, PANEL.y0, PANEL.w, 0, PANEL.h))}
              fill={over(GOLD, 0.05)}
              stroke={GOLD}
              strokeOpacity={0.9}
            />
            <g transform={onPlane(PANEL.x, PANEL.y0, PANEL.h)}>
              {ROWS.map((row, r) => row.cells.map((_, c) => <Cell key={`${r}${c}`} r={r} c={c} />))}
            </g>

            {/* the banner over the panel */}
            <g transform={onPlane(PANEL.x - 0.15, PANEL.y0 + 0.2, PANEL.h + 1.5)}>
              <rect
                x={0}
                y={0}
                width={232}
                height={24}
                fill={over(GOLD, 0.16)}
                stroke={GOLD}
                strokeOpacity={0.8}
              />
              <text x={12} y={16} fill={GOLD}>
                WRITING THE WORK DOWN
              </text>
            </g>

            {/* tag pairs, riding the panel's plane on its right */}
            {TAGS.map((pair, r) =>
              pair.map((t, k) => (
                <g
                  key={`${r}${k}`}
                  transform={onPlane(
                    PANEL.x,
                    PANEL.y0 - PANEL.w - 0.7,
                    PANEL.h - 0.6 - r * 2.8 - k * 0.95
                  )}
                >
                  <rect
                    x={0}
                    y={0}
                    width={20}
                    height={20}
                    fill="none"
                    stroke={GOLD}
                    strokeOpacity={0.8}
                  />
                  <rect x={6} y={6} width={8} height={8} fill={GOLD} fillOpacity={0.6} />
                  <rect
                    x={26}
                    y={0}
                    width={86}
                    height={20}
                    fill={over(GOLD, 0.1)}
                    stroke={GOLD}
                    strokeOpacity={0.8}
                  />
                  <text x={34} y={14.5} fill={GOLD}>
                    {t}
                  </text>
                </g>
              ))
            )}
          </svg>
        </div>
      </div>
    </Stage>
  );
}
