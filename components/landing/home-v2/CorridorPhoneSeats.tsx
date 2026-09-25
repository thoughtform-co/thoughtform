"use client";

import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { phoneCorridorSeats } from "@/lib/home-v2/phoneCorridorClock";

/**
 * CorridorPhoneSeats — the phone corridor's four soft seats (ADR-125 U1).
 *
 * Four absolute, full-width, invisible children of `.home-v2-stage` (siblings
 * of the sticky cell, which stays no snap area): each beat's dwell, its first
 * frame the aligned position, `start` under the root's `proximity` snap and
 * NEVER `always`. A rest within the root's reach lands on the composed frame;
 * a rest further out is travel — the reader is mid-flight, on purpose — and a
 * nudge lands the beat. A flick glides through (the owner's second decision,
 * 2026-09-25: the first cut's one-flick-one-beat read as "it just jumps").
 *
 * ⚠ ONE SOURCE, NO LITERAL. `top` and `height` are `phoneCorridorSeats()`'s
 * fractions of the SCRUB spent as `calc(f * (100% - 100svh))`: for an absolute
 * child `100%` is the stage's own height, so `(100% − 100svh)` IS
 * `useDepthScroll`'s scrub (stage − cell) with no stage-height literal here.
 *
 * ⚠ THE GATE IS THE SAME PREDICATE AS THE DWELLS'. `useDeviceTier()` is
 * `"mobile"` below `MOBILE_MAX_WIDTH`, exactly `isMobileComposition()`'s
 * threshold, so a seat can never exist without the dwell under it (the ≤760
 * CSS block is off by one from that predicate; this brace is the gate, the
 * sheet is the belt). `HomeCorridor` mounts it behind `!fallback`, so the
 * static text corridor and the desktop carry none.
 */
export function CorridorPhoneSeats() {
  const tier = useDeviceTier();
  if (tier !== "mobile") return null;
  return (
    <>
      {phoneCorridorSeats().map((seat) => (
        <div
          key={seat.id}
          className={`home-v2-stage__seat home-v2-stage__seat--${seat.id}`}
          data-corridor-seat={seat.id}
          aria-hidden="true"
          style={{
            top: `calc(${seat.top} * (100% - 100svh))`,
            height: `calc(${seat.height} * (100% - 100svh))`,
          }}
        />
      ))}
    </>
  );
}
