"use client";

/* "AI capability your teams own.", the flow through the stack (owner,
   2026-10-13, on the stack-first opening: "we lost the context from the left
   and right sides. Let's make a combination where you can really see the
   lines connecting to the different parts of the stack").

   The proposal's flow with the stack where its ringed hub was, and smaller
   than the opening first drew it. What each line says:
     · left, your team: the four workstreams on one bus, which runs level
       into the TEAM's plate, the stack's top;
     · the layer, the middle plate: tied to its tab by one quiet line down
       the gutter the way out leaves free;
     · right, Claude Enterprise: the AGENTS' plate, the stack's bottom, runs
       level out onto the bus that feeds the tools.
   In high on the left, out low on the right: the figure turns onto itself
   about its centre.

   The chips, the cards, the tabs and every word are production's, by
   reference (`PlugFlow`, `plugShared`); the geometry is `heroLayouts.ts`.
   The stack is the arrival's donor (`ClosedStack`); the lines that touch it
   let go as it leaves (`--sh-away`, written by the steps' section). */

import type { CSSProperties } from "react";

import { Junction, Tap } from "../kit/marks";
import { pathOf } from "../kit/trace";
import { MastheadTitle } from "../Masthead";
import { CARDS, H, Tab, TITLE, W } from "../plug/PlugFlow";
import { Cards, Chips, delay, Draw, FIG_LABEL } from "../plug/plugShared";
import { useArrive } from "../useArrive";

import { ClosedStack } from "./ClosedStack";
import { FLOW as L } from "./heroLayouts";

export function StackFlow() {
  const ref = useArrive<HTMLDivElement>();
  const [team, layer, agents] = L.ports;

  return (
    <div className="pl sh shf" ref={ref}>
      <MastheadTitle lines={TITLE} />

      <figure
        className="pl-fig"
        aria-label={FIG_LABEL}
        style={{ "--shf-col": (L.col / W).toFixed(4) } as CSSProperties}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="pl-svg" aria-hidden>
          {/* your team: a stub a workstream, onto one bus */}
          {L.team.stubs.map((s, i) => (
            <g key={i}>
              <Draw pts={s} className="shf-team" d={260 + i * 60} />
              <Tap at={s[1]} className="kit-tap--green shf-fade" />
            </g>
          ))}
          <Draw pts={L.team.bus} className="shf-team" d={420} />

          {/* the tools: production's bus, taps and stubs */}
          <Draw pts={L.tools.bus} className="shf-run" d={1200} />
          {L.tools.stubs.map((s, i) => (
            <g key={i}>
              <Draw
                pts={s}
                className={`pl-wire pl-wire--out${CARDS[i].lit ? " pl-wire--lit" : ""}`}
                d={1300 + i * 70}
              />
              <Tap at={s[0]} className="kit-tap--dawn shf-fade" />
            </g>
          ))}

          {/* the three lines that touch the stack: they let go as it leaves */}
          <g className="shf-port">
            <Draw pts={L.runIn} className="shf-team" d={620} />
            <g className="shf-fade" style={delay(600)}>
              <Junction
                at={L.team.junction.at}
                size={L.team.junction.size}
                className="shf-junction--team"
              />
              <Tap at={team.left} size={5} className="kit-tap--green" />
            </g>

            <g className="shf-fade" style={delay(900)}>
              <path d={pathOf(L.tie)} className="shf-tie" />
              <Tap at={layer.right} size={5} />
            </g>

            <Draw pts={L.runOut} className="shf-run" d={1000} />
            <g className="shf-fade" style={delay(1100)}>
              <Junction
                at={L.tools.junction.at}
                size={L.tools.junction.size}
                className="shf-junction--run"
              />
              <Tap at={agents.right} size={5} className="kit-tap--dawn" />
            </g>
          </g>
        </svg>

        {/* the stack, in its box of the frame: seated to six places, finer
            than the words' four, because three lines end on its plates */}
        <div
          className="shf-stage"
          style={
            {
              "--px": (L.box.x / W).toFixed(6),
              "--py": (L.box.y / H).toFixed(6),
              "--s": (L.box.side / W).toFixed(6),
            } as CSSProperties
          }
        >
          <ClosedStack />
        </div>

        <Tab id="embed" x={L.tabs.team} y={L.tabs.y} d="0ms" />
        <Tab id="encode" x={L.tabs.layer} y={L.tabs.y} d="800ms" />
        <Tab id="run" x={L.tabs.run} y={L.tabs.y} d="1200ms" />

        <Chips seats={L.chips} />
        <Cards x0={L.cards.x0} x1={L.cards.x1} rows={L.cards.rows} />
      </figure>
    </div>
  );
}
