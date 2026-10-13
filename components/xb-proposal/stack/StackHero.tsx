"use client";

/* "AI capability your teams own.", opened on the stack (owner, 2026-10-13,
   after arrakis.tech/platform: "use our stacked flow and place it at the
   center, then move it to the section afterwards … it allows us to use our
   intelligence artifact to travel consistently across three sections").

   One figure under the title: the three plates of the steps below, closed
   into one stack and centred in four corner brackets; a number on its left
   and a name on its right for each plate, both on a level line to the plate
   they name (owner, same day: "you can really see the lines connecting to
   the different parts of the stack"). The layer is the one lit row. Each
   name links to its step.

   Everything but the title is seated in the stack's own units, over the
   donor's crop (`heroLayouts.ts`), so a line and the plate it meets cannot
   drift. The stack is the arrival's donor (`ClosedStack`); the lines let go
   as it leaves (`--sh-away`, written by the steps' section). Nothing
   idles. */

import type { CSSProperties } from "react";

import { pathOf, type Pt } from "../kit/trace";
import { MastheadTitle } from "../Masthead";
import { TITLE } from "../plug/PlugFlow";
import { PLUG_STEPS, stepAnchor } from "../plugSteps";

import { ClosedStack } from "./ClosedStack";
import { inCrop, INDEX as L, PORTS } from "./heroLayouts";
import { HERO_BOX } from "./travel";

const seat = (p: Pt) => {
  const [x, y] = inCrop(p);
  return { "--px": x.toFixed(4), "--py": y.toFixed(4) } as CSSProperties;
};
/** A line's end on a plate: a small square in the plate's own tone. */
const TAP = 5;

export function StackHero() {
  return (
    <div className="sh">
      <MastheadTitle lines={TITLE} />

      <figure
        className="sh-fig"
        aria-label="One stack of three plates: your team, the layer it writes, and the agents that run on it"
      >
        <div className="sh-seat">
          <div className="sh-stage">
            {(["tl", "tr", "br", "bl"] as const).map((c) => (
              <i key={c} className="sh-corner" data-c={c} aria-hidden />
            ))}
            <ClosedStack />
          </div>

          <svg
            viewBox={`${HERO_BOX.x} ${HERO_BOX.y} ${HERO_BOX.w} ${HERO_BOX.h}`}
            className="sh-leads"
            aria-hidden
          >
            {L.leads.map((l, i) => (
              <g key={i} data-tone={PLUG_STEPS[i].tone}>
                <path d={pathOf(l.left)} />
                <path d={pathOf(l.right)} />
                {[PORTS[i].left, PORTS[i].right].map(([x, y], n) => (
                  <rect key={n} x={x - TAP / 2} y={y - TAP / 2} width={TAP} height={TAP} />
                ))}
              </g>
            ))}
          </svg>

          <ol className="sh-col sh-index" aria-hidden>
            {PLUG_STEPS.map((st, i) => (
              <li key={st.id} data-tone={st.tone} style={seat(L.index[i])}>
                <svg viewBox="0 0 34 20" className="sh-mini">
                  <path d="M17 1.5L32.5 10L17 18.5L1.5 10Z" />
                </svg>
                <span>{st.n}</span>
              </li>
            ))}
          </ol>

          <ol className="sh-col sh-names">
            {PLUG_STEPS.map((st, i) => (
              <li
                key={st.id}
                data-tone={st.tone}
                data-lit={st.tone === "gold" ? "" : undefined}
                style={seat(L.names[i])}
              >
                <a href={`#${stepAnchor(st.id)}`}>
                  <span>{st.flow[0]}</span> <b>{st.flow[1]}</b>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </figure>
    </div>
  );
}
