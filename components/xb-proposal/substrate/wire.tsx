/* Drawing parts for the substrate permutations: the "diagram, not a full
   shape" grammar from Unsiloed. Planes are outlines with a cross at each
   corner, hidden edges are dashed, and only the configuration is tinted. */

import type { Pt } from "../iso";

export const GOLD = "#caa554";
export const TEXT = "#ebe3d6";

export const pts = (list: readonly Pt[]) =>
  list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** A registration cross at a vertex. */
export function Cross({
  at,
  c = TEXT,
  o = 0.55,
  s = 5,
}: {
  at: Pt;
  c?: string;
  o?: number;
  s?: number;
}) {
  const [x, y] = at;
  return (
    <path
      d={`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`}
      stroke={c}
      strokeOpacity={o}
      strokeWidth={1}
    />
  );
}

/** A quad drawn as an outline with crosses on its corners. */
export function WirePlane({
  corners,
  gold,
  fill,
  dashed,
  o = 0.4,
}: {
  corners: readonly Pt[];
  gold?: boolean;
  fill?: string;
  dashed?: boolean;
  o?: number;
}) {
  const c = gold ? GOLD : TEXT;
  return (
    <g>
      <polygon
        points={pts(corners)}
        fill={fill ?? "none"}
        stroke={c}
        strokeOpacity={o}
        strokeWidth={1}
        strokeDasharray={dashed ? "3 5" : undefined}
      />
      {corners.map((p, i) => (
        <Cross key={i} at={p} c={c} o={o + 0.2} />
      ))}
    </g>
  );
}

/** A label on a leader: a square on the object, a rule, mono text. */
export function Tag({
  at,
  to,
  head,
  sub,
  gold,
  anchor = "start",
}: {
  at: Pt;
  to: number;
  head: string;
  sub?: string;
  gold?: boolean;
  anchor?: "start" | "end";
}) {
  const c = gold ? GOLD : TEXT;
  const tx = anchor === "start" ? to + 10 : to - 10;
  return (
    <g>
      <rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={c} />
      <path d={`M${at[0]} ${at[1]}H${to}`} stroke={c} strokeOpacity={0.45} />
      <text x={tx} y={at[1] + 4} textAnchor={anchor} fill={c}>
        {head}
      </text>
      {sub && (
        <text
          x={tx}
          y={at[1] + 26}
          textAnchor={anchor}
          className="xb-t-sans"
          fill={TEXT}
          fillOpacity={0.6}
        >
          {sub}
        </text>
      )}
    </g>
  );
}
