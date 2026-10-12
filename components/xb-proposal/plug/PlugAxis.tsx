"use client";

/* F3 · AXIS. The mark's own horizontal bar is the datum, and everything
   hangs off it (owner, 2026-10-11, on the artifact: "the center … is the
   Thoughtform brand mark. And then the left side would represent maybe
   upstream, and then the right side downstream").

   The mark stands large at the centre. Its bar is carried west and east as
   the three-line bundle, at the bar's own thickness, so the datum is the
   mark continued and not a line drawn through it. The four workstreams sit
   two above and two below the datum upstream, each on a plumb stub; the
   four interfaces sit the same way downstream. One graduated ring in four
   corner brackets holds the mark; Context, Skills and Evals ride it.

   The chips, the tags and every word are production's, by reference. */

import type { CSSProperties } from "react";

import { Bracket, Diamond, Tap } from "../kit/marks";
import { MastheadTitle } from "../Masthead";
import { useArrive } from "../useArrive";

import { AXIS as L, CHIP_W, HUB, TAB_Y } from "./flowLayouts";
import { at, CARDS, H, Tab, TITLE, W } from "./PlugFlow";
import { Chips, delay, Draw, FIG_LABEL, Mark, Marks, PartTags, Ring } from "./plugShared";

export function PlugAxis() {
  const ref = useArrive<HTMLDivElement>();

  return (
    <div className="pl pl--axis" ref={ref}>
      <MastheadTitle lines={TITLE} />

      <figure className="pl-fig" aria-label={FIG_LABEL}>
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          {/* upstream: the stubs first (they sit under the datum's taps) */}
          {L.stubsWest.map((s, i) => (
            <Draw key={i} pts={s.pts} className="pl-wire" d={260 + i * 60} />
          ))}
          {L.datumWest.map((pts, i) => (
            <Draw key={i} pts={pts} className="pl-bundle" d={520} />
          ))}
          <g className="plv-fade" style={delay(560)}>
            {L.tapsWest.map((p, i) => (
              <Tap key={i} at={p} className="kit-tap--green" />
            ))}
          </g>

          {/* the layer: the mark, held in one graduated ring */}
          <g className="pl-core">
            <Ring c={HUB} r={L.ring.r} a={0.3} />
            <Marks segs={L.ring.ticks} className="kit-tick kit-tick--minor" />
            <Marks segs={L.ring.stubs} className="kit-tick" />
            {L.ring.brackets.map((b, i) => (
              <Bracket key={i} pts={b} />
            ))}
            <Mark x={L.mark.x} y={L.mark.y} k={L.mark.k} />
            {L.parts.map((p, i) => (
              <Diamond key={i} at={p.node} size={4.5} open />
            ))}
          </g>

          {/* downstream */}
          {L.datumEast.map((pts, i) => (
            <Draw key={i} pts={pts} className="pl-bundle" d={1100} />
          ))}
          {L.stubsEast.map((s, i) => (
            <Draw
              key={i}
              pts={s.pts}
              className={`pl-wire pl-wire--out${CARDS[i].lit ? " pl-wire--lit" : ""}`}
              d={1300 + i * 70}
            />
          ))}
          <g className="plv-fade" style={delay(1340)}>
            {L.tapsEast.map((p, i) => (
              <Tap key={i} at={p} />
            ))}
          </g>
          <path d={`M${L.tie.x} ${L.tie.y0}V${L.tie.y1}`} className="pl-tie" />
        </svg>

        <Tab id="embed" x={L.tabs.team} y={TAB_Y} d="0ms" />
        <Tab id="encode" x={L.tabs.layer} y={TAB_Y} d="800ms" />
        <Tab id="run" x={L.tabs.run} y={TAB_Y} d="1200ms" />

        <Chips seats={L.chips} />
        <PartTags seats={L.parts.map((p) => p.tag)} />

        {CARDS.map((c, i) => (
          <div
            key={c.tool}
            className="plv-out pl-in"
            data-lit={c.lit ? "" : undefined}
            style={
              {
                ...at(L.reads[i].x, L.reads[i].y),
                "--w": (CHIP_W / W).toFixed(4),
                ...delay(1500 + i * 90),
              } as CSSProperties
            }
          >
            <span className="plv-out__key">
              {c.tool}
              <em>{c.time}</em>
            </span>
            <span className="plv-out__title">{c.title}</span>
          </div>
        ))}
      </figure>
    </div>
  );
}
