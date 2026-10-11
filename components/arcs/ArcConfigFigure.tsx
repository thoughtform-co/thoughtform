import type { ArcLeverageIdea } from "@/lib/arcs/types";

/**
 * ArcConfigFigure — the vision console's left cell as the configuration
 * itself (owner, 2026-10-11: "we build an intelligence configuration that
 * plugs into your system and is leveraged by your team"). Drawn in the
 * grammar picked on /test/proposition-artifact (P4, after Unsiloed's hero):
 *
 *   - THE CONFIGURATION: one gold panel standing in a slot, a row per
 *     course (context, skills, evals), its name on a banner over it;
 *   - PLUGGED INTO THEIR SYSTEM: the slot is cut into Claude Enterprise,
 *     drawn as the board the panel stands on, beside the tools the company
 *     already connects (Shopify, analytics), wired to the slot in gold;
 *   - LEVERAGED BY THE TEAM: four traces, one per workstream, come in from
 *     the right, the side the console's four workstreams sit on.
 *
 * Every label sits in one column on the right, on a leader; only the
 * panel's own rows are lettered in its plane, as a screen is.
 *
 * ⚠ SERVER, NO STATE. Every size and colour is inline (tokens through
 * `var()`), so `leverage.css` stays at zero in the lattice ratchet. Labels
 * letter at 12.5 user units in a 370-wide box, which the cell renders at
 * about one to one at 1280×720: the type floor.
 */

const W = 370;
const H = 330;
const U = 17;
const OX = 108;
const OY = 206;
const C30 = Math.cos(Math.PI / 6);

type Pt = readonly [number, number];
const p = (x: number, y: number, z: number): Pt => [
  OX + (x - y) * C30 * U,
  OY + (x + y) * 0.5 * U - z * U,
];
const pts = (l: readonly Pt[]) => l.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** A flat drawing laid on the plane x = xd: 1 drawing unit = 1 user unit
    along each axis, its origin at the plane's top-left (y = yl, z = zt). */
const onPlane = (xd: number, yl: number, zt: number) => {
  const [e, f] = p(xd, yl, zt);
  return `matrix(${C30.toFixed(4)} -0.5 0 1 ${e.toFixed(2)} ${f.toFixed(2)})`;
};

const PANEL = { x: 0, y0: 3.0, w: 7.4, h: 7.4 };
const BOARD = { x0: -1.4, x1: 5.4, y0: -5.4, y1: 4.2 };
/* The tools on the board, in front of the panel: the first (upper, back)
   module is `tools[0]`. */
const MODS = [
  { x0: 2.4, x1: 4.4, y0: -2.8, y1: -0.8 },
  { x0: 2.4, x1: 4.4, y0: 0.6, y1: 2.6 },
] as const;
/* One trace per workstream, at these heights on the panel's right edge. */
const TEAM_Z = [4.8, 3.9, 3.0, 2.1];
/* The label column. */
const COL = 280;

/* The gold ramp by role (ADR-063 U2): a line takes `--gold-line`, a letter
   `--gold-ink`, a wash the raw hue; all three are one value in dark. */
const GOLD = "var(--gold-line)";
const GOLD_INK = "var(--gold-ink)";
const ink = (a: number) => `rgba(var(--dawn-rgb), ${a})`;
const goldA = (a: number) => `rgba(var(--gold-rgb), ${a})`;
const ground = (a: number) => `rgba(var(--void-rgb), ${a})`;
const MONO = { fontFamily: "var(--lv-mono)", fontSize: 12.5, letterSpacing: "0.08em" } as const;
const SANS = { fontFamily: "var(--lv-sans)", fontSize: 13 } as const;

function box(x0: number, x1: number, y0: number, y1: number, z1: number) {
  return {
    top: pts([p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)]),
    front: pts([p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, 0), p(x0, y1, 0)]),
    side: pts([p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, 0), p(x1, y0, 0)]),
  };
}

export function ArcConfigFigure({ idea, id }: { idea: ArcLeverageIdea; id: string }) {
  const PW = PANEL.w * U;
  const PH = PANEL.h * U;
  const rowH = (PH - 14) / idea.courses.length;
  const yr = PANEL.y0 - PANEL.w; // the panel's right edge

  const board = [
    p(BOARD.x0, BOARD.y0, 0),
    p(BOARD.x1, BOARD.y0, 0),
    p(BOARD.x1, BOARD.y1, 0),
    p(BOARD.x0, BOARD.y1, 0),
  ];
  const dots: Pt[] = [];
  for (let x = BOARD.x0 + 0.7; x < BOARD.x1; x += 0.85)
    for (let y = BOARD.y0 + 0.7; y < BOARD.y1; y += 0.85) dots.push(p(x, y, 0));

  const teamIn = TEAM_Z.map((z) => p(PANEL.x, yr, z));
  const hostAt = p(4.2, BOARD.y1, 0);

  return (
    <svg
      className="arc-lev__config"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={`${id}-cfg-t`}
      style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}
    >
      <title id={`${id}-cfg-t`}>
        {`${idea.config}: ${idea.courses.map((c) => c.label.toLowerCase()).join(", ")}, plugged into ${idea.host} beside ${idea.tools.join(" and ")}, used by ${idea.team.toLowerCase()} across ${idea.teamLine.toLowerCase()}.`}
      </title>

      {/* their system: the board the configuration plugs into */}
      <polygon points={pts(board)} fill={ground(0.55)} stroke={ink(0.42)} strokeWidth={1} />
      <g fill={ink(0.2)}>
        {dots.map(([x, y], i) => (
          <rect key={i} x={x - 0.6} y={y - 0.6} width={1.2} height={1.2} />
        ))}
      </g>

      {/* the slot cut into the board */}
      <polygon
        points={pts([
          p(PANEL.x - 0.3, PANEL.y0 + 0.3, 0),
          p(PANEL.x - 0.3, yr - 0.3, 0),
          p(PANEL.x + 0.3, yr - 0.3, 0),
          p(PANEL.x + 0.3, PANEL.y0 + 0.3, 0),
        ])}
        fill={goldA(0.22)}
        stroke={GOLD}
        strokeWidth={1}
      />

      {/* the slot wired to the tools, three conductors each */}
      {MODS.map((m, i) => {
        const yc = (m.y0 + m.y1) / 2;
        return (
          <g key={`w${i}`}>
            {[-0.32, 0, 0.32].map((d) => {
              const a = p(PANEL.x + 0.3, yc + d, 0);
              const b = p(m.x0, yc + d, 0);
              return (
                <line
                  key={d}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={GOLD}
                  strokeOpacity={0.8}
                  strokeWidth={1}
                />
              );
            })}
          </g>
        );
      })}

      {/* the tools already connected */}
      {MODS.map((m, i) => {
        const f = box(m.x0, m.x1, m.y0, m.y1, 0.6);
        return (
          <g key={`m${i}`} stroke={ink(0.65)} strokeWidth={1} fill={ground(0.92)}>
            <polygon points={f.front} />
            <polygon points={f.side} />
            <polygon points={f.top} />
          </g>
        );
      })}

      {/* the configuration: an outer frame, then the panel */}
      <polygon
        points={pts([
          p(PANEL.x - 0.2, PANEL.y0 + 0.35, PANEL.h + 0.35),
          p(PANEL.x - 0.2, yr - 0.35, PANEL.h + 0.35),
          p(PANEL.x - 0.2, yr - 0.35, 0),
          p(PANEL.x - 0.2, PANEL.y0 + 0.35, 0),
        ])}
        fill="none"
        stroke={GOLD}
        strokeOpacity={0.45}
        strokeWidth={1}
      />
      <polygon
        points={pts([
          p(PANEL.x, PANEL.y0, PANEL.h),
          p(PANEL.x, yr, PANEL.h),
          p(PANEL.x, yr, 0),
          p(PANEL.x, PANEL.y0, 0),
        ])}
        fill={ground(0.94)}
        stroke={GOLD}
        strokeWidth={1.2}
      />
      <g transform={onPlane(PANEL.x, PANEL.y0, PANEL.h)}>
        {idea.courses.map((c, i) => {
          const y = 8 + i * rowH;
          return (
            <g key={c.label}>
              <rect
                x={8}
                y={y}
                width={PW - 16}
                height={rowH - 6}
                fill={goldA(0.07)}
                stroke={GOLD}
                strokeOpacity={0.7}
                strokeWidth={1}
              />
              <text x={16} y={y + 17} fill={GOLD_INK} style={MONO}>
                {c.label.toUpperCase()}
              </text>
              {/* what the row holds, as a short run of written lines under
                  its name: never through it */}
              {[0, 1, 2].map((k) => (
                <rect
                  key={k}
                  x={16 + [0, 34, 60][k]}
                  y={y + rowH - 13}
                  width={[28, 20, [36, 24, 30][i]][k]}
                  height={3}
                  fill={goldA(k === 0 ? 0.75 : 0.4)}
                />
              ))}
            </g>
          );
        })}
      </g>

      {/* the banner over the panel */}
      <g transform={onPlane(PANEL.x - 0.1, PANEL.y0 + 0.1, PANEL.h + 1.45)}>
        <rect x={0} y={0} width={PW} height={20} fill={goldA(0.16)} stroke={GOLD} strokeWidth={1} />
        <text x={8} y={14} fill={GOLD_INK} style={MONO}>
          {idea.config.toUpperCase()}
        </text>
      </g>

      {/* used by the team: one trace per workstream, in from the right */}
      {teamIn.map(([x, y], i) => (
        <g key={`t${i}`}>
          <path
            d={`M${W} ${y.toFixed(1)}H${x.toFixed(1)}`}
            stroke={GOLD}
            strokeOpacity={0.75}
            strokeDasharray="2 4"
            strokeWidth={1}
          />
          <rect x={x - 2} y={y - 2} width={4} height={4} fill={GOLD} />
        </g>
      ))}
      <text x={W} y={teamIn[0][1] - 30} textAnchor="end" fill={ink(0.92)} style={MONO}>
        {idea.team.toUpperCase()}
      </text>
      <text x={W} y={teamIn[0][1] - 13} textAnchor="end" fill={ink(0.62)} style={SANS}>
        {idea.teamLine}
      </text>

      {/* the tools and the host, on leaders into one column */}
      {MODS.map((m, i) => {
        const a = p(m.x1, (m.y0 + m.y1) / 2, 0.3);
        return (
          <g key={`l${i}`}>
            <path d={`M${a[0]} ${a[1]}H${COL - 8}`} stroke={ink(0.38)} strokeWidth={1} />
            <rect x={a[0] - 1.5} y={a[1] - 1.5} width={3} height={3} fill={ink(0.8)} />
            <text x={COL} y={a[1] + 4.5} fill={ink(0.78)} style={MONO}>
              {idea.tools[i].toUpperCase()}
            </text>
          </g>
        );
      })}
      <g>
        <path d={`M${hostAt[0]} ${hostAt[1]}H${COL - 8}`} stroke={ink(0.38)} strokeWidth={1} />
        <rect x={hostAt[0] - 1.5} y={hostAt[1] - 1.5} width={3} height={3} fill={ink(0.8)} />
        <text x={COL} y={hostAt[1] + 4.5} fill={ink(0.95)} style={MONO}>
          {idea.host.split(" ")[0].toUpperCase()}
        </text>
        <text x={COL} y={hostAt[1] + 21} fill={ink(0.95)} style={MONO}>
          {idea.host.split(" ").slice(1).join(" ").toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
