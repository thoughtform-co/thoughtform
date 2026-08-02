"use client";

import { Fragment, useSyncExternalStore } from "react";

import { CLUSTER_ZONES, JOURNEY_MARKS } from "@/components/landing/v7/rail-instruments/clusters";
import { SECTION_GLYPHS } from "@/components/landing/v7/rail-instruments/sectionGlyphs";
import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { journeyRef, subscribeJourney } from "../journeyRef";

/**
 * The journey row — every section as a mark, in one cluster, top-left.
 *
 * ⚠ CONTENT COMES FROM THE PRODUCTION MODULE. `JOURNEY_MARKS` lives in
 * `components/landing/v7/rail-instruments/` and the landing page renders
 * the same array; a copy here would drift the moment a section is added,
 * and the lab would then quietly disagree with the surface it exists to
 * judge. Only the CLOCK differs — production reads the real `<html>` bus,
 * this reads the synthetic runway's `journeyRef`.
 *
 * It was two clusters (approach top-left, destinations bottom-right) until
 * the bottom-right corner became SETTINGS (owner, 2026-08-02). The
 * grouping survives as rules inside the row rather than as distance across
 * the frame.
 *
 * Informational only — `pointer-events: none` on the host, `aria-hidden`
 * throughout. The nav corner remains the single navigation.
 */

type MarkState = "ahead" | "passed" | "here";

const stateFor = (seat: number, active: number): MarkState =>
  active === seat ? "here" : active > seat ? "passed" : "ahead";

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
        {JOURNEY_MARKS.map((mark) => (
          <Fragment key={mark.id}>
            {mark.ruleBefore && <i className="hil-cl__rule" />}
            <span
              className="hil-ri"
              data-hil-mark
              data-mark={mark.id}
              // Two clocks in one row: the Arc's beats exist only on the
              // manifest index, `proof` only on the readout index.
              data-state={stateFor(mark.idx, mark.clock === "beat" ? activeIdx : seat)}
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
