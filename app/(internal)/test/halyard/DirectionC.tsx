"use client";

import { useId } from "react";

import { OFFER } from "./copy";
import { Glyph, type GlyphId } from "./glyphs";
import { monoWidth, useBox } from "./useBox";

/**
 * C · SCHEMATIC. One screen, one ruled frame (the Tensorlake grammar), all of
 * it flat. A strip names the figure; one wide cell holds a circuit: four
 * input pins trace into ONE gold chip, the layer drawn in plan (its cut
 * corner, its three lanes, its plug), whose plug runs onto Claude
 * Enterprise with Shopify and analytics tapped off it. The cells beneath
 * sit exactly under the part of the circuit they explain.
 */

const CHIP = 30;
const PITCH = 46;
const SAFE_R = 8;

interface LayoutC {
  z1: number;
  z2: number;
  cy: number;
  rows: { id: string; short: string; y: number }[];
  nodeX: number;
  jogX: number;
  chip: { x: number; y: number; w: number; h: number };
  pinY: number[];
  bus: { x: number; y: number; w: number; h: number };
  tapX: number;
}

function layoutC(w: number, h: number): LayoutC {
  const cy = Math.round(h / 2 + 8);
  const rows = OFFER.workstreams.map((ws, i) => ({
    id: ws.id,
    short: ws.label.replace(/^Creative\s+/i, "").toUpperCase(),
    y: Math.round(cy - ((OFFER.workstreams.length - 1) * PITCH) / 2 + i * PITCH),
  }));
  const padL = 28;
  const labelEnd = padL + CHIP + 14 + Math.max(...rows.map((r) => monoWidth(r.short)));
  const nodeX = Math.round(labelEnd + 20);
  const z1 = Math.round(Math.max(w * 0.33, nodeX + 90));
  const z2 = Math.round(w * 0.64);
  const jogX = z1 - 40;

  /* the layer, in plan: wide, with room for the lanes' writing */
  const chipW = Math.round(Math.min(260, (z2 - z1) * 0.62));
  const chipH = Math.round(Math.min(132, h - 92));
  const chip = { x: Math.round(z1 + 30), y: Math.round(cy - chipH / 2), w: chipW, h: chipH };
  const pinY = rows.map((_, i) => Math.round(chip.y + 22 + (i * (chipH - 44)) / 3));

  const right = w - SAFE_R;
  const toolsW = 6 + 14 + CHIP + 14 + monoWidth("ANALYTICS");
  const tapX = Math.round(right - toolsW);
  const busW = Math.round(Math.min(180, tapX - 40 - (z2 + 30)));
  const bus = { x: Math.round(tapX - 40 - busW), y: Math.round(cy - 70), w: busW, h: 140 };
  return { z1, z2, cy, rows, nodeX, jogX, chip, pinY, bus, tapX };
}

function Circuit({ L, w, h }: { L: LayoutC; w: number; h: number }) {
  const { cy, rows, nodeX, jogX, chip, pinY, bus, tapX } = L;
  const cut = 16;
  const id = useId().replace(/:/g, "");
  const chipPath = `M${chip.x} ${chip.y} H${chip.x + chip.w - cut} L${chip.x + chip.w} ${chip.y + cut} V${chip.y + chip.h} H${chip.x} Z`;
  /* three lanes, each a few rows of writing */
  const laneH = (chip.h - 20) / 3;
  const lanes = [1, 2].map((i) => `M${chip.x + 14} ${chip.y + 10 + laneH * i} H${chip.x + chip.w - 14}`).join(" ");
  const RUNS = [
    [0.28, 0.12, 0.22, 0.16],
    [0.18, 0.3, 0.12],
    [0.24, 0.1, 0.2, 0.14],
  ];
  const marks: string[] = [];
  for (let lane = 0; lane < 3; lane++) {
    for (let row = 0; row < 2; row++) {
      const y = chip.y + 10 + laneH * lane + (laneH * (row + 1)) / 3;
      let x = chip.x + 24;
      const run = RUNS[(lane + row) % 3];
      for (const frac of run) {
        const len = frac * (chip.w - 60);
        if (x + len > chip.x + chip.w - 24) break;
        marks.push(`M${x} ${y} H${x + len}`);
        x += len + 8;
      }
    }
  }
  const plugY0 = cy - 10;
  const tools: { id: GlyphId; label: string; y: number }[] = [
    { id: "shopify", label: OFFER.tools.shopify.toUpperCase(), y: bus.y + 34 },
    { id: "analytics", label: OFFER.tools.analytics.toUpperCase(), y: bus.y + bus.h - 34 },
  ];

  return (
    <svg className="hy-svg" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <defs>
        <pattern id={`${id}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect x="7.5" y="7.5" width="1" height="1" className="hy-dot" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={w} height={h} fill={`url(#${id}-dots)`} />

      {/* the zone guides continue the cells' rules up through the figure */}
      {[L.z1, L.z2].map((x) => (
        <path key={x} d={`M${x + 0.5} 0 V${h}`} className="hy-guide" />
      ))}

      {/* inputs: the four workstreams */}
      {rows.map((r, i) => (
        <g key={r.id}>
          <rect x={28.5} y={r.y - CHIP / 2 + 0.5} width={CHIP} height={CHIP} className="hy-chip hy-chip--solid" />
          <Glyph id={r.id as GlyphId} x={33} y={r.y - 10} size={20} />
          <text x={28 + CHIP + 14} y={r.y + 4} className="hy-svg-label">
            {r.short}
          </text>
          <rect x={nodeX - 3} y={r.y - 3} width={6} height={6} className="hy-node" />
          <path
            d={(() => {
              /* level run, one 45° step onto the pin's height, level in */
              const t = pinY[i];
              const dy = t - r.y;
              const xa = jogX - Math.abs(dy);
              return `M${nodeX + 3} ${r.y} H${xa} L${jogX} ${t} H${chip.x - 8}`;
            })()}
            className="hy-trace"
          />
        </g>
      ))}

      {/* the layer, in plan */}
      {pinY.map((y) => (
        <path key={y} d={`M${chip.x - 8} ${y} H${chip.x}`} className="hy-gold-lead" />
      ))}
      <path d={chipPath} className="hy-gold-top" />
      <path d={lanes} className="hy-gold-sep" />
      <path d={marks.join(" ")} className="hy-gold-mark" />
      <path d={`M${chip.x + chip.w} ${plugY0} h14 v20 h-14`} className="hy-gold-top" />
      <text x={chip.x} y={chip.y - 14} className="hy-svg-label hy-svg-label--gold">
        {OFFER.layer.toUpperCase()}
      </text>

      {/* onto Claude Enterprise */}
      <path d={`M${chip.x + chip.w + 14} ${cy} H${bus.x - 4}`} className="hy-trace" />
      <rect x={bus.x - 4} y={cy - 4} width={8} height={8} className="hy-node" />
      <rect x={bus.x + 0.5} y={bus.y + 0.5} width={bus.w} height={bus.h} className="hy-housing" />
      <text x={bus.x + 18} y={bus.y + 28} className="hy-svg-label hy-svg-label--ink">
        CLAUDE
      </text>
      <text x={bus.x + 18} y={bus.y + 46} className="hy-svg-label hy-svg-label--ink">
        ENTERPRISE
      </text>
      <path d={`M${bus.x + 18} ${bus.y + bus.h - 40} H${bus.x + bus.w - 18}`} className="hy-line-2" />
      <text x={bus.x + 18} y={bus.y + bus.h - 18} className="hy-svg-label hy-svg-label--dim">
        COMPANY-WIDE
      </text>
      {tools.map((t) => (
        <g key={t.id}>
          <path d={`M${bus.x + bus.w} ${t.y} H${tapX - 3}`} className="hy-trace hy-trace--tool" />
          <rect x={tapX - 3} y={t.y - 3} width={6} height={6} className="hy-node" />
          <rect x={tapX + 14.5} y={t.y - CHIP / 2 + 0.5} width={CHIP} height={CHIP} className="hy-chip hy-chip--solid" />
          <Glyph id={t.id} x={tapX + 19} y={t.y - 10} size={20} />
          <text x={tapX + 14 + CHIP + 14} y={t.y + 4} className="hy-svg-label">
            {t.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function DirectionC() {
  const [frameRef, frame] = useBox<HTMLDivElement>();
  const [figRef, fig] = useBox<HTMLDivElement>();
  const L = fig.w > 0 ? layoutC(fig.w, fig.h) : null;
  const cut = 18;
  const fw = frame.w;
  const fh = frame.h;
  return (
    <div className="hy-stage hy-stage--one">
      <section className="hy-box hy-c" aria-label={OFFER.title}>
        <header className="hy-c__head">
          <p className="hy-eyebrow">{OFFER.eyebrow}</p>
          <h2 className="hy-title">{OFFER.title}</h2>
        </header>
        <div ref={frameRef} className="hy-c__frame">
          {fw > 0 ? (
            <svg className="hy-c__ring" viewBox={`0 0 ${fw} ${fh}`} width={fw} height={fh} aria-hidden="true">
              <path d={`M0.5 0.5 H${fw - cut} L${fw - 0.5} ${cut + 0.5} V${fh - 0.5} H0.5 Z`} className="hy-frame-line" />
            </svg>
          ) : null}
          <div className="hy-c__strip">
            <span className="hy-label">{OFFER.figure}</span>
            <span className="hy-label">{OFFER.meta}</span>
          </div>
          <div ref={figRef} className="hy-c__fig">
            {L ? <Circuit L={L} w={fig.w} h={fig.h} /> : null}
          </div>
          <ol
            className="hy-c__cells"
            style={L ? { gridTemplateColumns: `${L.z1}px ${L.z2 - L.z1}px minmax(0, 1fr)` } : undefined}
          >
            {OFFER.steps.map((s) => (
              <li key={s.n}>
                <p className="hy-label">
                  {s.n} · {s.title}
                </p>
                <p className="hy-body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
