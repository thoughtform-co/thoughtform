"use client";

/* F2 · BEARING. The hub is the dial behind the portrait on the About, with
   the mark at its centre, and the team arrives on bearings (owner,
   2026-10-12: "we have our diagrams … behind our profile picture. I think we
   can really play with those shapes to give it a more spatial navigational
   aesthetic").

   What changes against `PlugFlow`:
     · the three plain rings become the ring register: a graduated rim, the
       dash ladder, spokes on the diagonals, the gold station ring;
     · each workstream reaches the rim on a straight dotted bearing that ends
       in an open chevron, where a soft curve ran to a merge point;
     · the interfaces are one ruled readout of four rows sharing their
       edges, where four separate cards stood.
   The chips, the tags and every word are production's, by reference. */

import type { CSSProperties } from "react";

import { BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { Diamond } from "../kit/marks";
import { pathOf } from "../kit/trace";
import { MastheadTitle } from "../Masthead";
import { useArrive } from "../useArrive";

import { BEARING as L, HUB, TAB_Y } from "./flowLayouts";
import { at, Bundle, CARDS, H, Tab, TITLE, W } from "./PlugFlow";
import { Chips, delay, FIG_LABEL, Mark, Marks, PartTags, Ring } from "./plugShared";

export function PlugBearing() {
  const ref = useArrive<HTMLDivElement>();
  const markH = 46;
  const k = markH / BRANDMARK_VIEWBOX.h;
  const [rim, quiet, dashed, station, inner] = L.dial.rings;
  const R = L.readout;

  return (
    <div className="pl pl--bearing" ref={ref}>
      <MastheadTitle lines={TITLE} />

      <figure className="pl-fig" aria-label={FIG_LABEL}>
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          {/* the bearings: a dotted line cannot draw on (its dash is the
              channel), so it arrives whole */}
          {L.lines.map((l, i) => (
            <g key={i} className="plv-fade" style={delay(300 + i * 70)}>
              <path d={pathOf(l.pts)} className="kit-line kit-line--green kit-line--bearing" />
              <path d={pathOf(L.chevrons[i])} className="kit-line kit-line--green" />
            </g>
          ))}

          {/* the dial */}
          <g className="pl-core">
            <Ring c={HUB} r={rim} a={0.3} />
            <Ring c={HUB} r={quiet} a={0.42} dash="1 7" />
            <Ring c={HUB} r={dashed} tone="gold" a={0.4} dash="2 8" />
            <Ring c={HUB} r={station} tone="gold" a={0.6} />
            <Ring c={HUB} r={inner} a={0.3} dash="1 4" />
            <Marks segs={L.dial.ticks} className="kit-tick kit-tick--minor" />
            <Marks segs={L.dial.stubs} className="kit-tick" />
            <Marks segs={L.dial.spokes} className="kit-tick kit-tick--minor" />
            <circle cx={HUB[0]} cy={HUB[1]} r={L.dial.core} className="pl-coreDisc" />
            <Mark x={HUB[0] - (BRANDMARK_VIEWBOX.w * k) / 2} y={HUB[1] - markH / 2} k={k} />
            {L.parts.map((p, i) => (
              <Diamond key={i} at={p.node} size={4.5} />
            ))}
          </g>

          {/* out: the bundle, a bus, a tap and a stub per row */}
          <Bundle x0={L.bundleOut.x0} x1={L.bundleOut.x1} y={L.bundleOut.y} d="1100ms" />
          <path d={`M${L.tie.x} ${L.tie.y0}V${L.tie.y1}`} className="pl-tie" />
          <path
            d={`M${L.bus.x} ${L.bus.y0}V${L.bus.y1}`}
            className="pl-bus pl-draw"
            style={delay(1300)}
            pathLength={1}
          />
          {R.rows.map((y, i) => (
            <g key={y}>
              <path
                d={`M${L.bus.x} ${y}H${R.x0}`}
                className={`pl-wire pl-wire--out pl-draw${CARDS[i].lit ? " pl-wire--lit" : ""}`}
                style={delay(1400 + i * 70)}
                pathLength={1}
              />
              <rect x={L.bus.x - 3} y={y - 3} width={6} height={6} className="pl-tap" />
            </g>
          ))}
        </svg>

        <Tab id="embed" x={L.tabs.team} y={TAB_Y} d="0ms" />
        <Tab id="encode" x={L.tabs.layer} y={TAB_Y} d="800ms" />
        <Tab id="run" x={L.tabs.run} y={TAB_Y} d="1200ms" />

        <Chips seats={L.chips} />
        <PartTags seats={L.parts.map((p) => p.tag)} />

        <div
          className="plv-read pl-in"
          style={
            {
              ...at(R.x0, R.y0),
              "--w": ((R.x1 - R.x0) / W).toFixed(4),
              "--h": ((R.y1 - R.y0) / H).toFixed(4),
              ...delay(1500),
            } as CSSProperties
          }
        >
          {CARDS.map((c) => (
            <div key={c.tool} className="plv-row" data-lit={c.lit ? "" : undefined}>
              <span className="plv-row__key">{c.tool}</span>
              <span className="plv-row__title">{c.title}</span>
              <em className="plv-row__time">{c.time}</em>
            </div>
          ))}
        </div>
      </figure>
    </div>
  );
}
