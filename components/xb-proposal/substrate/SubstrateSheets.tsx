/* Substrate · P1 · exploded sheets. Unsiloed's hero: standing sheets in a
   row, receding in depth, each carrying its own content, with connectors
   crossing the gaps. Back to front: the team's four workstreams (raw
   work), the configuration (context, skills, evals: the only gold), and
   Claude Enterprise with its agents, models and tools. Tags ride on the
   sheets' top edges, skewed into their plane. */

import type { ReactNode } from "react";
import { OFFER, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { GLYPH } from "../glyphs";
import { makeIso, over, type Pt } from "../iso";
import { Cross, GOLD, pts, Tag, TEXT } from "./wire";

const W = 700;
const H = 560;
const U = 34;
const SW = 6; // sheet width (x)
const SH = 7; // sheet height (z)
const iso = makeIso(U, 262, 278);

const TEAM_Y = [0, 0.6, 1.2, 1.8];
const CONF_Y = [3.8, 4.4, 5.0];
const CL_Y = [7.0, 7.6];

function corners(y: number): Pt[] {
  return [iso.p(0, y, 0), iso.p(SW, y, 0), iso.p(SW, y, SH), iso.p(0, y, SH)];
}

/** Lay a flat drawing (1 unit = 1 px along the axes) onto the sheet at depth y. */
function onSheet(y: number) {
  const [e, f] = iso.p(0, y, SH);
  return `matrix(0.866 0.5 0 1 ${e} ${f})`;
}

function Sheet({
  y,
  gold,
  strong,
  children,
}: {
  y: number;
  gold?: boolean;
  strong?: boolean;
  children?: ReactNode;
}) {
  const c = gold ? GOLD : TEXT;
  const q = corners(y);
  return (
    <g>
      <polygon
        points={pts(q)}
        fill={gold ? over(GOLD, strong ? 0.12 : 0.07) : over(TEXT, strong ? 0.05 : 0.025)}
        stroke={c}
        strokeOpacity={strong ? 0.85 : 0.45}
      />
      {q.map((p, i) => (
        <Cross key={i} at={p} c={c} o={strong ? 0.9 : 0.5} s={4} />
      ))}
      <g transform={onSheet(y)}>{children}</g>
    </g>
  );
}

/** A tag bar on a sheet's top edge, in the sheet's own plane. */
function SheetTag({ text, gold, w = 150 }: { text: string; gold?: boolean; w?: number }) {
  const c = gold ? GOLD : TEXT;
  return (
    <g>
      <rect
        x={12}
        y={12}
        width={w}
        height={22}
        fill={gold ? over(GOLD, 0.2) : over(TEXT, 0.06)}
        stroke={c}
        strokeOpacity={0.7}
      />
      <text x={22} y={27} fill={c}>
        {text}
      </text>
    </g>
  );
}

const bars = (y0: number, n: number, c: string, o: number) =>
  Array.from({ length: n }, (_, i) => (
    <rect
      key={i}
      x={14}
      y={y0 + i * 18}
      width={[150, 120, 168, 96, 140, 110][i % 6]}
      height={6}
      fill={c}
      fillOpacity={o}
    />
  ));

export function SubstrateSheets() {
  const SCALE = U * SW; // sheet width in drawing px along x
  return (
    <Stage route="P1 · exploded sheets">
      <div className="xbS">
        <div className="xbS__text">
          <div className="xb-eyebrow">{OFFER.eyebrow}</div>
          <h2 className="xb-title">
            {OFFER.title[0]}
            <br />
            <span>{OFFER.title[1]}</span>
          </h2>
          <p className="xb-body xbS__intro">{OFFER.intro}</p>
          <ol className="xbS__steps">
            {OFFER.steps.map((s) => (
              <li key={s.n}>
                <span className="xbS__n">{s.n}</span>
                {s.head}
              </li>
            ))}
          </ol>
        </div>
        <div className="xbS__fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Standing sheets, back to front: the team's four workstreams, the configuration's context, skills and evals, and Claude Enterprise with its agents, models and tools."
          >
            {TEAM_Y.map((y, i) => (
              <Sheet key={y} y={y} strong={i === TEAM_Y.length - 1}>
                <SheetTag
                  text={WORKSTREAMS[i].name.replace("Creative ", "").toUpperCase()}
                  w={130}
                />
                <path
                  d={GLYPH[WORKSTREAMS[i].id]}
                  transform="translate(14 52) scale(1.4)"
                  fill="none"
                  stroke={TEXT}
                  strokeOpacity={0.8}
                />
                {bars(104, 6, TEXT, 0.22)}
              </Sheet>
            ))}

            {/* team → configuration: the work crossing the gap */}
            {[5.6, 4.0, 2.4].map((z, k) => {
              const a = iso.p(1.6 + k * 1.4, TEAM_Y[3], z);
              const b = iso.p(1.6 + k * 1.4, CONF_Y[0], z);
              return (
                <g key={z}>
                  <line
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={GOLD}
                    strokeOpacity={0.75}
                    strokeDasharray="2 4"
                  />
                  <rect x={a[0] - 2} y={a[1] - 2} width={4} height={4} fill={GOLD} />
                </g>
              );
            })}

            {CONF_Y.map((y, i) => (
              <Sheet key={y} y={y} gold strong={i === CONF_Y.length - 1}>
                <SheetTag text={["CONTEXT", "SKILLS", "EVALS"][i]} gold w={110} />
                {Array.from({ length: 6 }, (_, r) => (
                  <g key={r}>
                    <rect
                      x={14}
                      y={52 + r * 26}
                      width={64}
                      height={18}
                      fill="none"
                      stroke={GOLD}
                      strokeOpacity={0.45}
                    />
                    <rect
                      x={84}
                      y={52 + r * 26}
                      width={SCALE - 104}
                      height={18}
                      fill={r === 1 + i ? over(GOLD, 0.35) : "none"}
                      stroke={GOLD}
                      strokeOpacity={0.45}
                    />
                  </g>
                ))}
              </Sheet>
            ))}

            {/* configuration → Claude Enterprise */}
            {[5.0, 3.4].map((z, k) => {
              const a = iso.p(2.2 + k * 2, CONF_Y[2], z);
              const b = iso.p(2.2 + k * 2, CL_Y[0], z);
              return (
                <g key={z}>
                  <line
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    stroke={GOLD}
                    strokeOpacity={0.75}
                    strokeDasharray="2 4"
                  />
                  <rect x={a[0] - 2} y={a[1] - 2} width={4} height={4} fill={GOLD} />
                </g>
              );
            })}

            <Sheet y={CL_Y[0]}>
              <SheetTag text="CONNECTORS" w={124} />
              {["SHOPIFY", "ANALYTICS"].map((t, i) => (
                <g key={t}>
                  <rect
                    x={14}
                    y={56 + i * 46}
                    width={150}
                    height={34}
                    fill="none"
                    stroke={TEXT}
                    strokeOpacity={0.5}
                  />
                  <text x={26} y={78 + i * 46} fill={TEXT} fillOpacity={0.8}>
                    {t}
                  </text>
                </g>
              ))}
            </Sheet>
            <Sheet y={CL_Y[1]} strong>
              <SheetTag text="CLAUDE ENTERPRISE" w={192} />
              {["AGENTS", "MODELS", "CHAT", "PROJECTS"].map((t, i) => (
                <g key={t}>
                  <rect
                    x={14 + (i % 2) * 96}
                    y={56 + Math.floor(i / 2) * 46}
                    width={86}
                    height={34}
                    fill="none"
                    stroke={TEXT}
                    strokeOpacity={0.6}
                  />
                  <text
                    x={24 + (i % 2) * 96}
                    y={78 + Math.floor(i / 2) * 46}
                    fill={TEXT}
                    fillOpacity={0.85}
                  >
                    {t}
                  </text>
                </g>
              ))}
            </Sheet>

            <Tag
              at={iso.p(SW, TEAM_Y[3], 6.2)}
              to={470}
              head="THE TEAM"
              sub="Four creative workstreams"
            />
            <Tag
              at={iso.p(SW, CONF_Y[2], 4.4)}
              to={470}
              head="THE CONFIGURATION"
              sub="Written with the team"
              gold
            />
            <Tag
              at={iso.p(SW, CL_Y[1], 2.6)}
              to={470}
              head="CLAUDE ENTERPRISE"
              sub="Already at X-Bionic"
            />
          </svg>
        </div>
      </div>
    </Stage>
  );
}
