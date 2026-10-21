"use client";

/* The stack as the opening shows it: the three plates of the steps below,
   closed, in the donor's crop of `EmbedStack`'s drawing. The plates are the
   ones `NetworkPlug` draws (the copy that takes its projection as a
   parameter), through `EmbedStack`'s own projection, so the stack here is
   the stack there.

   This drawing IS the arrival's donor: the steps' section finds it by its
   class, reads its box and hides it while it carries the stack down
   (`stack/travel.ts`). It holds still and reads no scroll. */

import { makeIso } from "../iso";
import { PLATES } from "../network/NetworkPlug";

import { HERO_BOX, STACK } from "./travel";

const iso = makeIso(STACK.unit, STACK.ox, STACK.oy);

export function ClosedStack() {
  return (
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
          <g key={i} transform={`translate(0 ${i * STACK.closed})`} data-plate={i}>
            <Plate iso={iso} />
          </g>
        ))}
    </svg>
  );
}
