"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { journeyRef, subscribeJourney } from "../journeyRef";

/**
 * The corner and rail-foot modules — the frame's quiet zones, carrying
 * something.
 *
 * Owner note (2026-07-31): the corners hold "some stuff" and there is room
 * to work INWARD from them — "not too much, but we have some space". So
 * each module hangs off the open side of its own bracket and runs a short
 * way in, rather than sitting on top of the bracket or floating free of it.
 *
 * ⚠ Working inward means leaving the 37.5px corner box, and each corner
 * carries `clip-path: inset(<its own top offset> 0 0 0)` for the hero
 * curtain — side insets 0, so an overhang is clipped away. The lab sheet
 * re-declares that clip with NEGATIVE side insets, exactly as `.hud__rail`
 * already does for its 21px tick overhang. The top inset is copied
 * verbatim, so the curtain reveal is untouched; only the sides open up.
 *
 * The rail FOOT block needs none of that: it lives inside the left rail's
 * own host, anchored to the rail's bottom terminus — which already clears
 * the ADR-043 wordmark on short viewports — so it inherits the rail's clip,
 * its box and its responsive gates for free.
 */

const useReached = () =>
  useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.reachedRows,
    () => 0
  );

/** Live document range, written imperatively — it changes every frame. */
function useRange(ref: React.RefObject<HTMLElement | null>) {
  useEffect(
    () =>
      subscribeJourney((j) => {
        const range = String(Math.round(j.scroll01 * 100)).padStart(3, "0");
        if (ref.current && ref.current.textContent !== range) ref.current.textContent = range;
      }),
    [ref]
  );
}

/** TOP-LEFT — the sector stamp, hanging off the bracket's horizontal arm. */
export function CornerSector() {
  const reached = useReached();
  const activeIdx = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.activeIdx,
    () => 0
  );
  if (reached < 1) return null;
  const seat = sectionReadout(activeIdx, servicesRingProgressRef.current.proofRelease < 0.75);
  return (
    <span className="hil-cnr hil-cnr--tl" aria-hidden="true" data-hil-mark>
      <b className="hil-cnr__k">Sector</b>
      <i className="hil-cnr__rule" />
      <b className="hil-cnr__v">
        {String(reached).padStart(2, "0")}
        <em>/{seat.total}</em>
      </b>
    </span>
  );
}

/** BOTTOM-RIGHT — the range register, tucked into the bracket's open side. */
export function CornerRange() {
  const rangeRef = useRef<HTMLElement>(null);
  useRange(rangeRef);
  return (
    <span className="hil-cnr hil-cnr--br" aria-hidden="true" data-hil-mark>
      <b className="hil-cnr__k">Range</b>
      <i className="hil-cnr__rule" />
      <b className="hil-cnr__v" ref={rangeRef}>
        000
      </b>
    </span>
  );
}

/**
 * RAIL FOOT — a manifest summary seated at the left rail's bottom terminus,
 * just above the wordmark.
 *
 * It is the roster's SUMMARY, deliberately: the slots above say which
 * stations exist and which one is lit; this says how many there are and how
 * many are behind you. Both numbers are real — no invented telemetry, which
 * is also why this is not the scrolling system log the reference HUDs use
 * in this corner.
 */
export function RailFoot() {
  const reached = useReached();
  return (
    <span className="hil-mark hil-foot" aria-hidden="true" data-hil-mark>
      {/* Keys are clipped to three characters on purpose: `STATIONS` at the
          8px chrome size is ~48px, which is wider than the rail column has
          to spare and pushed the block onto the track. */}
      <b className="hil-foot__row">
        <em className="hil-foot__k">Stn</em>
        <i className="hil-foot__ld" />
        <em className="hil-foot__v">{String(READOUT_SECTIONS.length).padStart(2, "0")}</em>
      </b>
      <b className="hil-foot__row">
        <em className="hil-foot__k">Log</em>
        <i className="hil-foot__ld" />
        <em className="hil-foot__v hil-foot__v--on">{String(reached).padStart(2, "0")}</em>
      </b>
    </span>
  );
}
