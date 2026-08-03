"use client";

import type { ReactElement } from "react";

import { markState, type JourneyMark } from "./clusters";
import { SECTION_GLYPHS } from "./sectionGlyphs";

/**
 * One row of journey marks — the shared body of BOTH corners (ADR-059).
 *
 * The journey row (top-left, in `RailInstruments`) and the exit row
 * (bottom-right, in `SettingsCluster`) are the same instrument seen from
 * two ends of the frame, so they are one component rather than two that
 * happen to agree. Update 1 merged the clusters partly because keeping two
 * hand-written rows in step had already cost a pass; this is the version of
 * that lesson that survives them being separate again.
 *
 * Ink doctrine lives in CSS: dim ahead, a measured dawn for passed, full
 * `--gold` for here. `currentColor` on the SVG means the state colours the
 * drawing with no per-glyph rules.
 */

/**
 * ⚠ `markState` lives in `clusters.ts`, not here — it is pure logic over a
 * `JourneyMark` and that module imports no react, so the "exactly one mark
 * is gold" invariant can be unit-pinned without a DOM.
 */

/**
 * ⚠ NO LABEL, deliberately — unlike the lab, which prints one under every
 * mark for its `nExplain` scaffolding.
 *
 * Two reasons, and the second is the load-bearing one. The label band sits
 * at y 64–76, which on this page is occupied: measured collisions with
 * `services-masthead__desig` ("SVC / TITLE · 01") and the corridor's
 * `home-v2-stack-label__num`. Above the journey row is unavailable — the
 * corner's curtain inset saturates at 0px — so there is nowhere for it to
 * go.
 *
 * And it would be the THIRD place the active section is named, after the
 * ADR-055 nav corner and the right rail's vertical name. The gold mark says
 * where you are; something else already says what it is called.
 */
export function MarkRow({
  marks,
  activeIdx,
  seat,
}: {
  marks: readonly JourneyMark[];
  /** `MANIFEST_ENTRIES` index — resolves the `beat`-clocked marks. */
  activeIdx: number;
  /** `READOUT_SECTIONS` seat — resolves the `row`-clocked marks. */
  seat: number;
}): ReactElement {
  return (
    <span className="rin-cl__row">
      {marks.map((mark) => (
        // The seat wrapper is `display: contents` — it exists only to pair
        // a rule with its mark in JSX without becoming a flex item, which
        // would double the gap around every rule.
        <span key={mark.id} className="rin-cl__seat">
          {mark.ruleBefore && <i className="rin-cl__rule" />}
          {/* Two clocks — see the note in `clusters.ts`. The Arc's beats
              exist only on the manifest index; `proof` exists only on the
              readout index. Feed one the wrong index and it silently
              lights the wrong glyph. */}
          <span
            className="rin-mark"
            data-state={markState(mark, activeIdx, seat)}
            data-mark={mark.id}
          >
            {SECTION_GLYPHS[mark.id] ?? null}
          </span>
        </span>
      ))}
    </span>
  );
}
