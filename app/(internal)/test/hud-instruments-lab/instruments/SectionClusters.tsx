"use client";

import { Fragment, useSyncExternalStore } from "react";

import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { APPROACH_IDX, APPROACH_MARKS, CLUSTER_ZONES, DOCK_MARKS } from "../clusters";
import { journeyRef, subscribeJourney } from "../journeyRef";
import { SECTION_GLYPHS } from "./sectionGlyphs";

/**
 * The corner clusters — the journey's sections as small marks grouped by
 * ROLE, in the frame's two working corners.
 *
 * The design claim, and the reason this is a third round rather than a
 * restyling of the second: rounds 1 and 2 both ran the marks ALONG the left
 * rail and argued about the spacing. Anything on a rail is on a scale, and a
 * scale reads as progress — the roster fixed that by making the seats
 * stationary, but it still occupies the ladder. Here the ladder keeps its own
 * job and the sections live in the corners, where GROUPING is the message:
 * five marks for the approach, five for the destinations. You read what kind
 * of thing a section is from which corner it is in.
 *
 * Three states, the lab's standing doctrine: dim for what is ahead, a
 * measured dawn for what you have passed, full gold for where you are, and
 * only the live mark prints its name.
 *
 * Informational only — `pointer-events: none` on the host, `aria-hidden`
 * throughout. The nav corner remains the single navigation (owner ruling).
 */

type MarkState = "ahead" | "passed" | "here";

function stateFor(seat: number, active: number): MarkState {
  if (active === seat) return "here";
  return active > seat ? "passed" : "ahead";
}

/** One seat: the glyph, and the name it prints when live or when explained. */
function ClusterMarkView({ id, name, state }: { id: string; name: string; state: MarkState }) {
  return (
    <span className="hil-ri" data-hil-mark data-state={state} data-mark={id}>
      {SECTION_GLYPHS[id] ?? null}
      <b className="hil-ri__label">{name}</b>
    </span>
  );
}

/**
 * TOP-LEFT — the approach, per BEAT.
 *
 * ⚠ Keys on `activeIdx`, NOT `reachedRows`. `journeyRef.ts` warns those are
 * different numbers and that mixing them "draws four Arc marks" — this
 * cluster wants exactly those four, because the Arc's beats ARE the approach.
 * The warning is aimed at the roster, which collapses them by design. Both
 * readings are correct for their own instrument; neither is a bug.
 */
export function ApproachCluster() {
  const activeIdx = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.activeIdx,
    () => 0
  );

  // ⚠ NOT `hil-layer` — that class is `display: contents`, which is right for
  // the roster (its marks position against the host) and fatal here: the
  // cluster IS a positioned box its children resolve against, and with no box
  // the row lands on the corner's own origin, off the viewport edge.
  return (
    <div className="hil-cl hil-cl--approach" aria-hidden="true">
      <span className="hil-cl__zone">{CLUSTER_ZONES.approach}</span>
      <span className="hil-cl__row">
        {APPROACH_MARKS.map((mark, i) => (
          <ClusterMarkView
            key={mark.id}
            id={mark.id}
            name={mark.name}
            state={stateFor(APPROACH_IDX[i], activeIdx)}
          />
        ))}
      </span>
    </div>
  );
}

/**
 * Which READOUT row owns the frame right now, as a seat index.
 *
 * Returned as a NUMBER on purpose: `useSyncExternalStore` re-reads this on
 * every render, and an object snapshot would be a fresh reference each time.
 *
 * `proofOwns` is the ADR-056 split of the single `services` index into its
 * casefile and offer beats, read the way `CornerPlates` reads it.
 */
function dockSeat(): number {
  const proofOwns = servicesRingProgressRef.current.proofRelease < 0.75;
  const { id } = sectionReadout(journeyRef.current.activeIdx, proofOwns);
  return READOUT_SECTIONS.findIndex((row) => row.id === id);
}

/**
 * BOTTOM-RIGHT — the destinations, at ROW level.
 *
 * Row level rather than beat level because none of these have beats, and
 * because it is what lets `proof` appear at all: the casefile is a readout
 * row with no manifest entry (ADR-056), so a manifest-keyed cluster could not
 * have seated it.
 *
 * The rule after ABOUT is the mockup's own LOG / DOCK split — what is on the
 * record, then where you are going.
 *
 * ⚠ Hosted in the RIGHT RAIL, not the BR corner — see the mount comment in
 * `HudInstrumentsLabShell`. It still replaces that corner's bracket; it just
 * cannot live inside it and clear the toggle band at the same time.
 */
export function DockCluster() {
  const activeSeat = useSyncExternalStore(subscribeJourney, dockSeat, () => -1);

  return (
    <div className="hil-cl hil-cl--dock" aria-hidden="true">
      {/* ⚠ ONE zone label, seated BEFORE the row — not the mockup's two
          stacked above it. Labels never sit above a row in this design:
          every host here carries a curtain clip whose top inset saturates
          at 0px, so anything above the box is silently clipped at rest. The
          rule inside the row still carries the LOG | DOCK split. */}
      <span className="hil-cl__zone">{CLUSTER_ZONES.dock}</span>
      <span className="hil-cl__row">
        {DOCK_MARKS.map((mark, i) => (
          <Fragment key={mark.id}>
            {mark.ruleBefore && <i className="hil-cl__rule" />}
            <ClusterMarkView
              id={mark.id}
              name={mark.name}
              // Seat 0 is the Arc row, which this cluster does not carry.
              state={stateFor(i + 1, activeSeat)}
            />
          </Fragment>
        ))}
      </span>
    </div>
  );
}
