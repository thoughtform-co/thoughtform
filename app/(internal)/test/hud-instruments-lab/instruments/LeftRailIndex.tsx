"use client";

import { useSyncExternalStore } from "react";

import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

import { journeyRef, subscribeJourney } from "../journeyRef";
import { ROW_GLYPH_CLIPS } from "./glyphs";
import { useRowDetents } from "./useRowDetents";

interface LeftRailIndexProps {
  /** Draw the accruing ordinals / glyphs. */
  index: boolean;
  /** Draw silhouettes instead of ordinals. */
  glyph: boolean;
  /** Draw the one travelling selection bracket. */
  bracket: boolean;
}

/** Zero-padded, matching the manifest's two-digit convention. */
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The left rail — DISCRETE. Where you have been.
 *
 * One mark per `READOUT_SECTIONS` row, seated at that row's real scroll
 * detent, drawn ONLY once you have reached it. The ladder fills in behind
 * you: at the top of the page this adds zero elements, and at `#contact` it
 * holds six two-character marks. That progressive accrual is what keeps the
 * frame quiet, and it makes the rail a LOG of where you have been rather
 * than a map of where you could go.
 *
 * A single bracket marks HERE — two 5px L-corners on one diagonal, never
 * four. Four corners close the composition into a box; a diagonal pair
 * registers it without framing it (the rule the casefile's corner reticles
 * carry). It is ONE element gliding between detents on the rail's own
 * 350ms tween, not six brackets cross-fading.
 *
 * `reachedRows` counts READOUT rows, not manifest indices — the Arc's four
 * beats collapse to one row here, and counting indices would draw four Arc
 * marks.
 *
 * Informational only: `pointer-events: none`, `aria-hidden`. The journey is
 * already announced by the nav corner's `.visually-hidden` label and the
 * manifest diamond's `aria-label`; a third voice is noise.
 */
export function LeftRailIndex({ index, glyph, bracket }: LeftRailIndexProps) {
  const { detents, ready } = useRowDetents();
  const reached = useSyncExternalStore(
    subscribeJourney,
    () => journeyRef.current.reachedRows,
    () => 0
  );

  // The active row is the last one reached. `reachedRows` is 1-based.
  const activeRow = Math.max(0, Math.min(READOUT_SECTIONS.length - 1, reached - 1));
  const activeTop = detents[activeRow];

  return (
    <div className="hil-layer" aria-hidden="true" data-ready={ready || undefined}>
      {index &&
        READOUT_SECTIONS.map((row, i) => {
          const top = detents[i];
          // Progressive disclosure: nothing is drawn ahead of the reader.
          if (top == null || i >= reached) return null;
          const on = i === activeRow || undefined;
          const clip = ROW_GLYPH_CLIPS[row.id];
          return glyph ? (
            <i
              key={row.id}
              className="hil-mark hil-glyph"
              data-hil-mark
              data-glyph={row.id}
              data-on={on}
              style={{ top: `${(top * 100).toFixed(3)}%`, clipPath: clip ?? undefined }}
            />
          ) : (
            <span
              key={row.id}
              className="hil-mark hil-idx"
              data-hil-mark
              data-on={on}
              style={{ top: `${(top * 100).toFixed(3)}%` }}
            >
              {pad(i + 1)}
            </span>
          );
        })}

      {bracket && activeTop != null && reached > 0 && (
        <span
          className="hil-mark hil-bracket"
          data-hil-mark
          style={{ top: `${(activeTop * 100).toFixed(3)}%` }}
        >
          <i className="hil-bracket__c hil-bracket__c--tl" />
          <i className="hil-bracket__c hil-bracket__c--br" />
        </span>
      )}
    </div>
  );
}
