"use client";

import { RUNWAY_BLOCKS } from "./journey";

/**
 * Six empty spacers standing in for the landing page's sections.
 *
 * They carry the REAL `.station` class so the frame is judged against
 * production's actual full-bleed starfield bed rather than a flat void, and
 * so `useLandingScroll`'s active-station sweep (which queries `.station`)
 * finds them unmodified. The lab sheet zeroes `.station`'s own
 * `min-height` / `padding` and pins an explicit height, so the runway
 * proportions are exactly the table in `journey.ts`.
 *
 * Two things are deliberate rather than incidental:
 *
 *   • The corridor mount is NOT a `.station`. In production it is not one
 *     either — that is precisely why `resolveActiveIdx` carries its
 *     seam-gap rule 3, and marking it here would hide the behaviour.
 *   • `#hero` does NOT get the `.hero` class. That class drags in the
 *     sticky video machinery; all this lab needs from the hero is a
 *     one-viewport block that `useLandingScroll` can measure the curtain
 *     lift against. It does still get the starfield, which `.hero` would
 *     have excluded — a consistent bed reads better here.
 *
 * The blocks stay EMPTY: `.station:not(.hero)` sets `content-visibility:
 * auto`, so any content would be skipped off-screen anyway, and the lab
 * sheet pins `content-visibility: visible` on them so `scrollHeight` — the
 * denominator of every detent — cannot jitter as blocks enter and leave.
 */
export function Runway() {
  return (
    <div className="hil-runway">
      {RUNWAY_BLOCKS.map((block) => {
        const isMount = block.station == null;
        return (
          <div
            key={block.id}
            id={block.id}
            className={isMount ? "hil-block hil-block--mount" : "hil-block station"}
            style={{ height: block.height }}
            {...(isMount ? { "data-home-corridor-mount": "" } : { "data-station": block.station })}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
