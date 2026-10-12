"use client";

/* F1 · TRACE. The flow as production draws it, every line made straight
   (owner, 2026-10-12: "we use these rounded lines to connect but we kind of
   avoid rounded shapes").

   What changes against `PlugFlow`, and nothing else:
     · the four workstreams sit on a tick rail (the page rail's own ladder)
       where they sat on three faded circles;
     · each runs level off its chip and cuts 45 degrees onto one plumb
       collector, which meets the layer's bundle at a square junction, where
       four soft curves converged on a point;
     · the hub's outer ring is graduated and held in four corner brackets,
       the About drawing's register; its three stations are diamonds.
   The chips, the tags, the cards, the bus and every word are production's,
   by reference. */

import { BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { polar } from "../kit/dial";
import { Bracket, Diamond, Junction } from "../kit/marks";
import { MastheadTitle } from "../Masthead";
import { useArrive } from "../useArrive";

import { HUB, TAB_Y, TRACE as L } from "./flowLayouts";
import { Bundle, CARDS, H, PARTS, Tab, TITLE, W } from "./PlugFlow";
import { Cards, Chips, delay, Draw, FIG_LABEL, Mark, Marks, PartTags, Ring } from "./plugShared";

export function PlugTrace() {
  const ref = useArrive<HTMLDivElement>();
  const markH = 46;
  const k = markH / BRANDMARK_VIEWBOX.h;
  const [rim, station, inner] = L.hub.rings;

  return (
    <div className="pl pl--trace" ref={ref}>
      <MastheadTitle lines={TITLE} />

      <figure className="pl-fig" aria-label={FIG_LABEL}>
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          {/* the rail the workstreams sit on */}
          <g className="plv-fade" style={delay(0)}>
            <path d={`M${L.rail.x} ${L.rail.y0}V${L.rail.y1}`} className="kit-line" />
            {L.rail.ticks.map((t) => (
              <path
                key={t.y}
                d={`M${L.rail.x} ${t.y}H${L.rail.x + (t.major ? L.rail.major : L.rail.minor)}`}
                className={t.major ? "kit-tick" : "kit-tick kit-tick--minor"}
              />
            ))}
          </g>

          {/* the team's lines: level, one cut, onto the collector */}
          {L.wires.map((w, i) => (
            <Draw key={i} pts={w.pts} className="pl-wire" d={300 + i * 60} />
          ))}
          {L.collector.map((w, i) => (
            <Draw key={i} pts={w.pts} className="pl-wire" d={520 + i * 40} />
          ))}
          <g className="plv-fade" style={delay(600)}>
            <Junction at={L.junction.at} size={L.junction.size} />
          </g>
          <Bundle x0={L.bundleIn.x0} x1={L.bundleIn.x1} y={L.bundleIn.y} d="620ms" />

          {/* the layer: a graduated ring in its brackets */}
          <g className="pl-core">
            <Ring c={HUB} r={rim} a={0.3} />
            <Marks segs={L.hub.ticks} className="kit-tick kit-tick--minor" />
            <Marks segs={L.hub.stubs} className="kit-tick" />
            {L.hub.brackets.map((b, i) => (
              <Bracket key={i} pts={b} />
            ))}
            <circle cx={HUB[0]} cy={HUB[1]} r={station} className="pl-ring pl-ring--gold" />
            <circle cx={HUB[0]} cy={HUB[1]} r={inner} className="pl-ring" />
            <circle cx={HUB[0]} cy={HUB[1]} r={L.hub.core} className="pl-coreDisc" />
            <Mark x={HUB[0] - (BRANDMARK_VIEWBOX.w * k) / 2} y={HUB[1] - markH / 2} k={k} />
            {PARTS.map((p) => (
              <Diamond key={p.name} at={polar(HUB, station, p.deg)} size={4.5} />
            ))}
          </g>

          {/* out: production's own bus, taps and stubs */}
          <Bundle x0={L.bundleOut.x0} x1={L.bundleOut.x1} y={L.bundleOut.y} d="1100ms" />
          <path d={`M${L.tie.x} ${L.tie.y0}V${L.tie.y1}`} className="pl-tie" />
          <path
            d={`M${L.bus.x} ${L.bus.y0}V${L.bus.y1}`}
            className="pl-bus pl-draw"
            style={delay(1300)}
            pathLength={1}
          />
          {L.cards.rows.map((y, i) => (
            <g key={y}>
              <path
                d={`M${L.bus.x} ${y}H${L.cards.x0}`}
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
        <PartTags seats={PARTS.map((p) => polar(HUB, station + p.out, p.deg))} />
        <Cards x0={L.cards.x0} x1={L.cards.x1} rows={L.cards.rows} />
      </figure>
    </div>
  );
}
