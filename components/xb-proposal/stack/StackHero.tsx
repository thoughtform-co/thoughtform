"use client";

/* "AI capability your teams own.", opened on the stack (owner, 2026-10-13,
   after arrakis.tech/platform: "use our stacked flow and place it at the
   center, then move it to the section afterwards … it allows us to use our
   intelligence artifact to travel consistently across three sections").

   One figure under the title: the three plates of the steps below, closed
   into one stack and centred in four corner brackets; an index on its left
   and the three names on its right, each level with the plate it names and
   linking to its step. The layer is the one lit row.

   The plates are the ones `NetworkPlug` draws (the copy that takes its
   projection as a parameter), through `EmbedStack`'s own projection, so the
   stack here is the stack there. This section is the DONOR of the arrival:
   it holds still and reads no scroll; the steps' section draws the stack on
   its way down and stamps `data-handed` here while it does
   (`stack/travel.ts`). Nothing idles. */

import type { CSSProperties } from "react";

import { makeIso } from "../iso";
import { MastheadTitle } from "../Masthead";
import { PLATES } from "../network/NetworkPlug";
import { TITLE } from "../plug/PlugFlow";
import { PLUG_STEPS, stepAnchor } from "../plugSteps";

import { HERO_BOX, STACK } from "./travel";

const iso = makeIso(STACK.unit, STACK.ox, STACK.oy);

/* The first and the last plate's top-face centres, as fractions of the
   figure's height: a column's three rows are spread between exactly these,
   so each row is level with the plate it names. */
const at = (i: number) => (STACK.ref[1] + i * STACK.closed - HERO_BOX.y) / HERO_BOX.h;
const ROWS = { "--y0": at(0).toFixed(4), "--y2": at(2).toFixed(4) } as CSSProperties;

export function StackHero() {
  return (
    <div className="sh">
      <MastheadTitle lines={TITLE} />

      <figure
        className="sh-fig"
        aria-label="One stack of three plates: your team, the layer it writes, and the agents that run on it"
      >
        <div className="sh-side" aria-hidden>
          <ol className="sh-col sh-index" style={ROWS}>
            {PLUG_STEPS.map((st) => (
              <li key={st.id} data-tone={st.tone}>
                <svg viewBox="0 0 34 20" className="sh-mini">
                  <path d="M17 1.5L32.5 10L17 18.5L1.5 10Z" />
                </svg>
                <span>{st.n}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="sh-stage">
          {(["tl", "tr", "br", "bl"] as const).map((c) => (
            <i key={c} className="sh-corner" data-c={c} aria-hidden />
          ))}
          <svg
            viewBox={`${HERO_BOX.x} ${HERO_BOX.y} ${HERO_BOX.w} ${HERO_BOX.h}`}
            className="sh-svg"
            role="img"
            aria-label="Three plates closed into one stack"
          >
            {/* painted bottom plate first: the upper plate sits in front */}
            {PLATES.map((Plate, i) => ({ Plate, i }))
              .reverse()
              .map(({ Plate, i }) => (
                <g key={i} transform={`translate(0 ${i * STACK.closed})`}>
                  <Plate iso={iso} />
                </g>
              ))}
          </svg>
        </div>

        <div className="sh-side">
          <ol className="sh-col sh-names" style={ROWS}>
            {PLUG_STEPS.map((st) => (
              <li key={st.id} data-tone={st.tone} data-lit={st.tone === "gold" ? "" : undefined}>
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
