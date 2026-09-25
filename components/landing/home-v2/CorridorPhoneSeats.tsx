"use client";

import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { phoneCorridorSeats } from "@/lib/home-v2/phoneCorridorClock";

/**
 * CorridorPhoneSeats — the snap targets on the phone corridor's plateaus
 * (ADR-125).
 *
 * Eight absolute, full-width, invisible children of `.home-v2-stage`
 * (siblings of the sticky cell, which stays no snap area): each plateau's
 * first frame (`scroll-snap-stop: always` — one flick steps one beat, up and
 * down) and the stretch after it whose first frame is that plateau's LAST
 * composed frame (`normal`, ADR-123's `.vw-phone-snap` idiom). A rest in a
 * pass is pulled back onto the picture it left or forward onto the next; a
 * flick never lands between beats.
 *
 * ⚠ ONE SOURCE, NO LITERAL. `top` and `height` are `phoneCorridorSeats()`'s
 * fractions of the SCRUB spent as `calc(f * (100% - 100svh))`: for an absolute
 * child `100%` is the stage's own height, so `(100% − 100svh)` IS
 * `useDepthScroll`'s scrub (stage − cell) with no stage-height literal here.
 *
 * ⚠ THE GATE IS THE SAME PREDICATE AS THE PLATEAUS'. `useDeviceTier()` is
 * `"mobile"` below `MOBILE_MAX_WIDTH`, exactly `isMobileComposition()`'s
 * threshold, so a seat can never exist without the plateau under it (the
 * ≤760 CSS block is off by one from that predicate; this brace is the gate,
 * the sheet is the belt). `HomeCorridor` mounts it behind `!fallback`, so the
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
          data-corridor-stop={seat.stop}
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
