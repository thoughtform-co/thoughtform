"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { journeyRef, subscribeJourney } from "../journeyRef";

interface RightRailInstrumentsProps {
  /** Continuous pointer + range readout. */
  pointer: boolean;
  /** Stacked key/value readouts on ticks 2 / 6 / 11. */
  telemetry: boolean;
  /** The active section's name, set vertically. */
  name: boolean;
  /** Printed graduations on every other tick — the scale the pointer rides. */
  scale: boolean;
}

/** Tick positions on the 13-rung ladder, as fractions of the rail box. */
const TICK = { t2: 2 / 12, t6: 6 / 12, t11: 11 / 12 } as const;

/**
 * The graduated scale — every other rung of the 13-tick ladder, printed.
 *
 * Straight from the Departure Mono sheet's right-hand column, and the
 * reason it belongs on THIS side: a bare track gives the pointer nothing
 * to be read against, so the right rail was carrying one moving mark on an
 * empty line. Graduations make it an instrument you can take a value off.
 *
 * The values are the tick's own fraction of the journey, so they land on
 * 000 / 017 / 033 / 050 / 067 / 083 / 100. The uneven numbers are the point
 * — a scale reading in seventeenths is a real ruler; one reading in round
 * twenties has been rounded for the viewer's benefit.
 */
const GRADUATIONS = [0, 2, 4, 6, 8, 10, 12].map((tick) => ({
  tick,
  pct: (tick / 12) * 100,
  label: String(Math.round((tick / 12) * 100)).padStart(3, "0"),
}));

/**
 * The right rail — CONTINUOUS. How far.
 *
 * The counterpart to the left rail's discrete log, and the reason the two
 * rails are not a mirror. The pointer is UN-SNAPPED: it rides total scroll
 * directly, so it moves whenever the page moves, where the left rail only
 * changes at section boundaries. That contrast is the instrument.
 *
 * The pointer's position is pure CSS off `--hil-journey`, which the journey
 * writer already publishes on the lab root — no JS touches it per frame.
 * Only the text readouts need a write, and those go through the journey
 * subscription rather than a scroll listener of their own (effect order:
 * a portalled child's listener would register before the writer's).
 *
 * Every value printed here is real: BEARING is document scroll, SECTOR is
 * the readout's own seat, LOCAL is progress through the current section.
 * Nothing is invented telemetry.
 */
export function RightRailInstruments({
  pointer,
  telemetry,
  name,
  scale,
}: RightRailInstrumentsProps) {
  const rangeRef = useRef<HTMLElement>(null);
  const bearingRef = useRef<HTMLElement>(null);
  const localRef = useRef<HTMLElement>(null);

  // Discrete — a handful of changes per journey, so React owns it.
  const reached = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.reachedRows,
    () => 0
  );
  const activeIdx = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.activeIdx,
    () => 0
  );

  // Continuous — imperative, delta-gated, never React state.
  useEffect(
    () =>
      subscribeJourney((j) => {
        const range = String(Math.round(j.scroll01 * 100)).padStart(3, "0");
        if (rangeRef.current && rangeRef.current.textContent !== range) {
          rangeRef.current.textContent = range;
        }
        if (bearingRef.current && bearingRef.current.textContent !== range) {
          bearingRef.current.textContent = range;
        }
        const local = j.blockLocal.toFixed(2);
        if (localRef.current && localRef.current.textContent !== local) {
          localRef.current.textContent = local;
        }
      }),
    []
  );

  const seat = sectionReadout(activeIdx, servicesRingProgressRef.current.proofRelease < 0.75);
  const label = READOUT_SECTIONS[Math.max(0, reached - 1)]?.label ?? seat.label;

  return (
    <div className="hil-layer" aria-hidden="true">
      {scale &&
        GRADUATIONS.map((g) => (
          <span
            key={g.tick}
            className="hil-mark hil-grad"
            data-hil-mark
            style={{ top: `${g.pct.toFixed(3)}%` }}
          >
            {g.label}
          </span>
        ))}

      {pointer && (
        <>
          <i className="hil-mark hil-pointer" data-hil-mark />
          <span className="hil-mark hil-range" data-hil-mark ref={rangeRef}>
            000
          </span>
        </>
      )}

      {telemetry && (
        <>
          <span
            className="hil-mark hil-tele"
            data-hil-mark
            style={{ top: `${(TICK.t2 * 100).toFixed(3)}%` }}
          >
            <b className="hil-tele__k">Bearing</b>
            <i className="hil-tele__rule" />
            <b className="hil-tele__v" ref={bearingRef}>
              000
            </b>
          </span>
          <span
            className="hil-mark hil-tele"
            data-hil-mark
            style={{ top: `${(TICK.t6 * 100).toFixed(3)}%` }}
          >
            <b className="hil-tele__k">Sector</b>
            <i className="hil-tele__rule" />
            <b className="hil-tele__v">{`${seat.num}/${seat.total}`}</b>
          </span>
          <span
            className="hil-mark hil-tele"
            data-hil-mark
            style={{ top: `${(TICK.t11 * 100).toFixed(3)}%` }}
          >
            <b className="hil-tele__k">Local</b>
            <i className="hil-tele__rule" />
            <b className="hil-tele__v" ref={localRef}>
              0.00
            </b>
          </span>
        </>
      )}

      {name && (
        <span className="hil-mark hil-vertname" data-hil-mark>
          {label}
        </span>
      )}
    </div>
  );
}
