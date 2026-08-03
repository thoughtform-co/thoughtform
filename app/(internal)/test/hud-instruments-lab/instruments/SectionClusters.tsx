"use client";

import { Fragment, useSyncExternalStore } from "react";

import {
  CLUSTER_ZONES,
  LAB_MARKS,
  markState,
} from "@/components/landing/v7/rail-instruments/clusters";
import { SECTION_GLYPHS } from "@/components/landing/v7/rail-instruments/sectionGlyphs";
import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { journeyRef, subscribeJourney } from "../journeyRef";

/**
 * The journey row — every section as a mark, in one cluster, top-left.
 *
 * ⚠ CONTENT AND STATE BOTH COME FROM THE PRODUCTION MODULES. `LAB_MARKS`
 * lives in `components/landing/v7/rail-instruments/` and is exactly what
 * the two corners render, concatenated; `markState` is the same function
 * that colours them, which matters now that the Arc is a beat RANGE and a
 * re-implementation here could disagree about `here` without anyone
 * noticing. Only the CLOCK differs — production reads the real `<html>`
 * bus, this reads the synthetic runway's `journeyRef`.
 *
 * ⚠ THE LAB'S ROW IS STILL NOT PRODUCTION'S SHAPE. Production splits the
 * roster across two corners — the journey top-left, `contact` and the
 * controls bottom-right (ADR-059 U3) — and prints no labels at all. This
 * keeps the whole set in one labelled row on purpose: the open question
 * here is the GLYPHS (§4 — whether they read as instrument geometry or as
 * app icons), and the set side by side with their names under them is how
 * that gets judged. The geometry was settled on the live frame, not here.
 *
 * Informational only — `pointer-events: none` on the host, `aria-hidden`
 * throughout. The nav corner remains the single navigation.
 */

/** Which READOUT row owns the frame — the row-clock half of the pair. */
function dockSeat(): number {
  const proofOwns = servicesRingProgressRef.current.proofRelease < 0.75;
  const { id } = sectionReadout(journeyRef.current.activeIdx, proofOwns);
  return READOUT_SECTIONS.findIndex((row) => row.id === id);
}

export function JourneyCluster() {
  const activeIdx = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.activeIdx,
    () => 0
  );
  const seat = useSyncExternalStore(subscribeJourney, dockSeat, () => -1);

  // ⚠ NOT `hil-layer` — that class is `display: contents`, which is right
  // for the roster (its marks position against the host) and fatal here:
  // the cluster IS a positioned box its children resolve against, and with
  // no box the row lands on the corner's own origin, off the viewport edge.
  return (
    <div className="hil-cl hil-cl--journey" aria-hidden="true">
      <span className="hil-cl__zone">{CLUSTER_ZONES.journey}</span>
      <span className="hil-cl__row">
        {LAB_MARKS.map((mark) => (
          <Fragment key={mark.id}>
            {mark.ruleBefore && <i className="hil-cl__rule" />}
            <span
              className="hil-ri"
              data-hil-mark
              data-mark={mark.id}
              // Two clocks in one row: the Arc's beats exist only on the
              // manifest index, `proof` only on the readout index.
              data-state={markState(mark, activeIdx, seat)}
            >
              {SECTION_GLYPHS[mark.id] ?? null}
              <b className="hil-ri__label">{mark.name}</b>
            </span>
          </Fragment>
        ))}
      </span>
    </div>
  );
}
