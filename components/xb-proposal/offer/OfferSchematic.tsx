/* Direction B · the schematic. One ruled frame holds one drawing read left
   to right like a circuit: the four workstreams are the inputs, the layer is
   the one component drawn in gold (the slab of direction A, seen from the
   front: the same three strata), and Claude Enterprise is the bus it plugs
   into, where Shopify and analytics already hang. A manual's legend under
   the drawing keys 1 · 2 · 3 to the three zones, and its cells take the
   zones' own widths. */

import { OFFER, STRATA, TOOLS, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { Glyph } from "../glyphs";

const GOLD = "#caa554";
const TEXT = "#ebe3d6";
const W = 1054;
const H = 320;
/** The three zones, in drawing px; the legend's columns are these widths. */
const ZONES = [0, 300, 740, W] as const;

const CHIP = { x0: 364, x1: 684, y0: 52, y1: 292, cut: 14 };
const HEAD_RULE = 96;
const ROW_H = (CHIP.y1 - HEAD_RULE) / 3;
/** Top to bottom as in the slab: Evals on top, Context at the base. */
const ROWS = [...STRATA].reverse().map((s, i) => ({ ...s, cy: HEAD_RULE + ROW_H * (i + 0.5) }));
const TEAM_Y = [84, 140, 196, 252];
const BUS_X = 792;
const TOOL_Y = [168, 236];

export function OfferSchematic() {
  return (
    <Stage route="S1 · B · schematic">
      <div className="xbB">
        <header className="xbB__head">
          <div>
            <div className="xb-eyebrow">{OFFER.eyebrow}</div>
            <h2 className="xb-title xbB__title">
              {OFFER.title[0]} <span>{OFFER.title[1]}</span>
            </h2>
          </div>
          <p className="xb-body xbB__intro">{OFFER.intro}</p>
        </header>

        <div className="xb-frame xbB__frame">
          <div className="xb-frame__in xbB__in" data-xb-ruled>
            <div className="xbB__strip">
              <span className="xb-label">Fig. 1 · The offering</span>
              <span className="xb-label">Read left to right</span>
            </div>
            <div className="xbB__fig">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label="Four workstreams feed the X-Bionic layer, which plugs into Claude Enterprise beside Shopify and analytics"
              >
                <Schematic />
              </svg>
            </div>
            <ol
              className="xbB__legend"
              style={{
                gridTemplateColumns: `${ZONES[1] - ZONES[0]}fr ${ZONES[2] - ZONES[1]}fr ${ZONES[3] - ZONES[2]}fr`,
              }}
            >
              {OFFER.steps.map((s, i) => (
                <li key={s.n} data-gold={i === 1 || undefined}>
                  <span className="xbB__tag">{i + 1}</span>
                  <span className="xbB__lh">{s.head}</span>
                  <p className="xbB__lb">{s.short}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Stage>
  );
}

function Tag({ x, y, n, gold }: { x: number; y: number; n: number; gold?: boolean }) {
  const c = gold ? GOLD : TEXT;
  return (
    <g>
      <rect x={x} y={y} width={18} height={18} fill="none" stroke={c} strokeOpacity={0.6} />
      <text x={x + 9} y={y + 13} textAnchor="middle" fill={c} style={{ letterSpacing: 0 }}>
        {n}
      </text>
    </g>
  );
}

function Schematic() {
  const { x0, x1, y0, y1, cut } = CHIP;
  const chipPath = `M${x0} ${y0}H${x1 - cut}L${x1} ${y0 + cut}V${y1}H${x0}Z`;
  return (
    <g>
      {/* Zone keys, aligned with the legend's cells. */}
      <Tag x={ZONES[0] + 24} y={16} n={1} />
      <Tag x={ZONES[1] + 24} y={16} n={2} gold />
      <Tag x={ZONES[2] + 24} y={16} n={3} />

      {/* 1 · the team: four inputs. */}
      {WORKSTREAMS.map((w, i) => {
        const y = TEAM_Y[i];
        return (
          <g key={w.id}>
            <Glyph name={w.id} x={24} y={y - 12} size={24} stroke={TEXT} strokeWidth={1} />
            <text className="xb-t-sans" x={62} y={y + 5} fill={TEXT}>
              {w.name}
            </text>
            <line x1={222} y1={y} x2={x0} y2={y} stroke={TEXT} strokeOpacity={0.4} />
            <rect
              x={218}
              y={y - 3}
              width={6}
              height={6}
              fill="none"
              stroke={TEXT}
              strokeOpacity={0.6}
            />
            <rect x={x0 - 4} y={y - 3} width={8} height={6} fill={GOLD} />
          </g>
        );
      })}

      {/* 2 · the layer: the one gold component. */}
      <path d={chipPath} fill="#15120c" stroke={GOLD} strokeWidth={1.25} />
      <text x={x0 + 20} y={80} fill={GOLD}>
        X-BIONIC LAYER
      </text>
      <line x1={x0} y1={HEAD_RULE} x2={x1} y2={HEAD_RULE} stroke={GOLD} strokeOpacity={0.5} />
      {ROWS.map((r, i) => (
        <g key={r.id}>
          {i > 0 && (
            <line
              x1={x0 + 20}
              y1={HEAD_RULE + ROW_H * i}
              x2={x1 - 20}
              y2={HEAD_RULE + ROW_H * i}
              stroke={GOLD}
              strokeOpacity={0.22}
            />
          )}
          <text x={x0 + 20} y={r.cy + 4} fill={GOLD} fillOpacity={0.85}>
            {r.name.toUpperCase()}
          </text>
          <text className="xb-t-sans" x={x0 + 112} y={r.cy + 5} fill={TEXT}>
            {r.gist}
          </text>
          <line x1={x1} y1={r.cy} x2={BUS_X} y2={r.cy} stroke={GOLD} strokeOpacity={0.8} />
          <rect x={x1 - 4} y={r.cy - 3} width={8} height={6} fill={GOLD} />
          <rect x={BUS_X - 4} y={r.cy - 3} width={8} height={6} fill={GOLD} />
        </g>
      ))}

      {/* 3 · Claude Enterprise: the bus already in place. */}
      <line x1={BUS_X} y1={y0} x2={BUS_X} y2={y1} stroke={TEXT} strokeWidth={2} />
      <text x={BUS_X + 20} y={y0 + 10} fill={TEXT}>
        CLAUDE ENTERPRISE
      </text>
      <text x={BUS_X + 20} y={y0 + 32} fill={TEXT} fillOpacity={0.5}>
        ALREADY IN USE
      </text>
      {TOOLS.map((t, i) => {
        const y = TOOL_Y[i];
        return (
          <g key={t.id}>
            <line x1={BUS_X} y1={y} x2={BUS_X + 64} y2={y} stroke={TEXT} strokeOpacity={0.5} />
            <rect x={BUS_X - 3} y={y - 3} width={6} height={6} fill={TEXT} />
            <rect
              x={BUS_X + 60}
              y={y - 3}
              width={6}
              height={6}
              fill="none"
              stroke={TEXT}
              strokeOpacity={0.6}
            />
            <Glyph name={t.id} x={BUS_X + 80} y={y - 12} size={24} stroke={TEXT} strokeWidth={1} />
            <text className="xb-t-sans" x={BUS_X + 116} y={y + 5} fill={TEXT}>
              {t.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}
