"use client";

import { OFFER } from "./copy";
import { Glyph, type GlyphId } from "./glyphs";
import { iso, type IsoFrame } from "./iso";
import { Layer } from "./Layer";
import { monoWidth, useBox } from "./useBox";

/**
 * B · AXIS. One screen, a technical-manual exploded view on one horizontal
 * datum: the team on the left in flat elevation, the layer in the middle as
 * the drawing's only 3D object, Claude Enterprise on the right as a socket
 * with the tools it already runs plugged into it. Each part carries a
 * lettered key straight above it, and the caption row below is set on those
 * same keys, so text and drawing share one set of columns.
 */

const CHIP = 30;
const ROW = 50;
const LW = 70; /* the layer: short side, long side, thickness (world) */
const LD = 210;
const LT = 9;
const KEY = 22;
const HEAD = 40; /* the keys' band at the top of the drawing */
const SAFE_R = 8;

interface LayoutB {
  cy: number;
  keys: [number, number, number];
  rows: { id: string; short: string; y: number }[];
  nodeX: number;
  mergeX: number;
  f: IsoFrame;
  tipX: number;
  corner: readonly [number, number];
  hx: number;
  hy: number;
  hw: number;
  hh: number;
  toolX: number;
  datumEnd: number;
}

function layoutB(w: number, h: number): LayoutB {
  const cy = Math.round(HEAD + (h - HEAD) / 2 + 4);
  const rows = OFFER.workstreams.map((ws, i) => ({
    id: ws.id,
    short: ws.label.replace(/^Creative\s+/i, "").toUpperCase(),
    y: Math.round(cy - ((OFFER.workstreams.length - 1) * ROW) / 2 + i * ROW),
  }));
  const labelEnd = CHIP + 16 + Math.max(...rows.map((r) => monoWidth(r.short)));
  const nodeX = Math.round(labelEnd + 22);

  /* Claude from the right edge in: the tools' labels end at the safe edge. */
  const toolsW = 6 + 14 + CHIP + 14 + monoWidth("ANALYTICS");
  const right = w - SAFE_R;
  const hw = Math.round(Math.min(220, Math.max(170, w * 0.19)));
  const hh = Math.round(Math.min(156, h - HEAD - 36));
  const toolX = right - toolsW;
  const hx = Math.round(toolX - 44 - hw);
  const hy = cy - hh / 2;

  /* The layer between the team's merge and Claude, seated so its plug's tip
     sits ON the datum. */
  const spanL = nodeX + 90;
  const spanR = hx - 60;
  const k = Math.min(((spanR - spanL) * 0.78) / ((LW + LD + 18) * 0.866), ((h - HEAD) * 0.62) / ((LW + LD) * 0.5 + LT), 1.25);
  const f0: IsoFrame = { ox: 0, oy: 0, k };
  const pt = LT * 0.62;
  const [tipX0, tipY0] = iso(f0, [LW + 18, LD * 0.5, pt / 2]);
  const [lx0] = iso(f0, [0, LD, 0]);
  const ox = (spanL + spanR) / 2 - (lx0 + tipX0) / 2;
  const f: IsoFrame = { ox, oy: cy - tipY0, k };
  const corner = iso(f, [0, LD, LT]); /* the board's near-left corner, under key B */
  const mergeX = Math.round(Math.min(nodeX + 64, ox + lx0 - 30));

  return {
    cy,
    keys: [Math.round(CHIP / 2 - KEY / 2), Math.round(corner[0] - KEY / 2), hx],
    rows,
    nodeX,
    mergeX,
    f,
    tipX: ox + tipX0,
    corner,
    hx,
    hy,
    hw,
    hh,
    toolX,
    datumEnd: hx + hw + 22,
  };
}

function Drawing({ L, w, h }: { L: LayoutB; w: number; h: number }) {
  const { cy, rows, nodeX, mergeX, f, tipX, corner, hx, hy, hw, hh, toolX } = L;
  const cut = 14;
  const slot = 13;
  const housing = `M${hx} ${cy - slot} V${hy} H${hx + hw - cut} L${hx + hw} ${hy + cut} V${hy + hh} H${hx} V${cy + slot}`;
  const tools: { id: GlyphId; label: string; y: number }[] = [
    { id: "shopify", label: OFFER.tools.shopify.toUpperCase(), y: cy - 40 },
    { id: "analytics", label: OFFER.tools.analytics.toUpperCase(), y: cy + 40 },
  ];
  const targets = [rows[0].y - CHIP / 2 - 8, corner[1] - 8, hy - 8];
  const keyLabels = [OFFER.zones.team, OFFER.zones.layer, OFFER.zones.claude];

  return (
    <svg className="hy-svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      {/* the datum, dash-dot */}
      <path d={`M${nodeX} ${cy} H${L.datumEnd}`} className="hy-datum" />

      {/* lettered keys, straight above their parts */}
      {L.keys.map((x, i) => (
        <g key={i}>
          <rect x={x + 0.5} y={0.5} width={KEY} height={KEY} className="hy-key" />
          <text x={x + KEY / 2 + 0.5} y={15.5} textAnchor="middle" className="hy-svg-label hy-svg-label--ink">
            {"ABC"[i]}
          </text>
          <text x={x + KEY + 12} y={15.5} className="hy-svg-label">
            {keyLabels[i].toUpperCase()}
          </text>
          <path d={`M${x + KEY / 2 + 0.5} ${KEY + 1} V${targets[i]}`} className="hy-line-2" />
        </g>
      ))}

      {/* A · the team, four rows converging on the datum */}
      {rows.map((r) => (
        <g key={r.id}>
          <rect x={0.5} y={r.y - CHIP / 2 + 0.5} width={CHIP} height={CHIP} className="hy-chip" />
          <Glyph id={r.id as GlyphId} x={5} y={r.y - 10} size={20} />
          <text x={CHIP + 16} y={r.y + 4} className="hy-svg-label">
            {r.short}
          </text>
          <rect x={nodeX - 3} y={r.y - 3} width={6} height={6} className="hy-node" />
          <path
            d={`M${nodeX + 3} ${r.y} H${mergeX - 10} L${mergeX} ${r.y + Math.sign(cy - r.y) * 10} V${cy}`}
            className="hy-trace"
          />
        </g>
      ))}

      {/* B · the layer, threaded on the datum, plug toward Claude */}
      <Layer f={f} at={[0, 0, 0]} w={LW} d={LD} t={LT} plug="x" />
      <path d={`M${tipX + 6} ${cy} H${hx - 16}`} className="hy-gold-travel" />
      <path d={`M${hx - 25} ${cy - 5} L${hx - 19} ${cy} L${hx - 25} ${cy + 5}`} className="hy-gold-lead" />

      {/* C · the socket, and the tools it already runs */}
      <path d={housing} className="hy-housing" />
      <path d={`M${hx} ${cy - slot} H${hx + 46} V${cy + slot} H${hx}`} className="hy-line-dash" />
      <text x={hx + 24} y={hy + 34} className="hy-svg-label hy-svg-label--ink">
        {OFFER.claude.toUpperCase()}
      </text>
      <text x={hx + 24} y={hy + hh - 24} className="hy-svg-label hy-svg-label--dim">
        IN USE COMPANY-WIDE
      </text>
      {tools.map((t) => (
        <g key={t.id}>
          <path d={`M${hx + hw} ${t.y} H${toolX - 3}`} className="hy-trace hy-trace--tool" />
          <rect x={toolX - 3} y={t.y - 3} width={6} height={6} className="hy-node" />
          <rect x={toolX + 14.5} y={t.y - CHIP / 2 + 0.5} width={CHIP} height={CHIP} className="hy-chip" />
          <Glyph id={t.id} x={toolX + 19} y={t.y - 10} size={20} />
          <text x={toolX + 14 + CHIP + 14} y={t.y + 4} className="hy-svg-label">
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function DirectionB() {
  const [boxRef, box] = useBox<HTMLDivElement>();
  const L = box.w > 0 ? layoutB(box.w, box.h) : null;
  const capStyle = L
    ? { marginLeft: L.keys[0], gridTemplateColumns: `${L.keys[1] - L.keys[0]}px ${L.keys[2] - L.keys[1]}px minmax(0, 1fr)` }
    : undefined;
  return (
    <div className="hy-stage hy-stage--one">
      <section className="hy-box hy-b" aria-label={OFFER.title}>
        <header className="hy-b__head">
          <div>
            <p className="hy-eyebrow">{OFFER.eyebrow}</p>
            <h2 className="hy-title">{OFFER.title}</h2>
          </div>
          <p className="hy-body hy-b__lede">{OFFER.lede}</p>
        </header>
        <div ref={boxRef} className="hy-b__draw">
          {L ? <Drawing L={L} w={box.w} h={box.h} /> : null}
        </div>
        <ol className="hy-b__caps" style={capStyle}>
          {OFFER.steps.map((s) => (
            <li key={s.n}>
              <p className="hy-label">
                <span className="hy-b__key">{s.key}</span>
                {s.n} · {s.title}
              </p>
              <p className="hy-body">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
