"use client";

import { useSyncExternalStore } from "react";

import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

import { journeyRef, subscribeJourney } from "../journeyRef";
import { ROW_CODES, SLOT_TICKS } from "../stations";

interface RailStationRosterProps {
  /** The active slot expands to reveal its full section name. */
  expand: boolean;
  /** Draw each slot's bounded plate, not just its tab + code. */
  bays: boolean;
}

/**
 * The station roster — six STATIONARY slots, one per section.
 *
 * This replaces the accruing ordinal ladder, and the difference is not
 * cosmetic. The ordinals sat at each section's true scroll detent, which
 * makes the rail a SCALE — and a scale reads as a progress bar no matter
 * how it is styled (owner, 2026-07-31: "they just feel like showing
 * progression, and that's not really what I want"). Here position is
 * STRUCTURE: six fixed seats on the tick ladder, and only state moves.
 * That is the grammar of an equipment bay, a Stellaris outliner, a
 * character-creator part list — interface components, not marks on a rule.
 *
 * THE SLOT IS ALWAYS THERE; ITS CONTENT IS NOT. Three states:
 *
 *   ahead   the tab alone — an empty seat, structure with nothing in it
 *   passed  the designation fills in
 *   here    gold, pipped onto the rail's track, expanded to the full name
 *
 * That keeps the owner's earlier progressive-disclosure ruling intact
 * while fixing the complaint: the panel is stationary and complete from
 * the first frame, and what fills it is what you have reached. An empty
 * slot beside a filled one is a game-HUD idiom in its own right.
 *
 * The active slot's expansion is the ONE thing that bleeds past the rail
 * column, into the gutter before the content band — the Cyberpunk
 * part-list move, where selecting a row opens it. Bounded by construction:
 * only ever one at a time.
 *
 * Informational only: `pointer-events: none`, `aria-hidden`. The nav corner
 * already announces the journey twice over.
 */
export function RailStationRoster({ expand, bays }: RailStationRosterProps) {
  const reached = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.reachedRows,
    () => 0
  );
  const activeRow = Math.max(0, Math.min(READOUT_SECTIONS.length - 1, reached - 1));

  return (
    <div className="hil-layer" aria-hidden="true" data-bays={bays || undefined}>
      {READOUT_SECTIONS.map((row, i) => {
        const state = i === activeRow && reached > 0 ? "here" : i < reached ? "passed" : "ahead";
        return (
          <span
            key={row.id}
            className="hil-mark hil-slot"
            data-hil-mark
            data-state={state}
            style={{ top: `${SLOT_TICKS[i].toFixed(3)}%` }}
          >
            {/* The connector back to the rail's 2px track — what makes the
                slot read as WIRED to the bus rather than floating beside it. */}
            <i className="hil-slot__tab" />
            {state === "here" && <i className="hil-slot__pip" />}
            {/* The live seat SWAPS its code for the full name rather than
                appending it. Measured at 1440×900: code + name ran to 142px
                against a content band starting at 145px — three pixels of
                clearance, and less on narrower viewports. The swap keeps the
                expansion inside the gutter at every width. */}
            <b className="hil-slot__code" data-wide={expand && state === "here" ? "" : undefined}>
              {state === "ahead" ? "" : expand && state === "here" ? row.label : ROW_CODES[row.id]}
            </b>
          </span>
        );
      })}
    </div>
  );
}
