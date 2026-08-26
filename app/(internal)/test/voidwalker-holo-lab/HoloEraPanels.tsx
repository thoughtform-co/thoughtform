"use client";

import type { CharacterEra } from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, type VwSegment } from "@/lib/voidwalker/voidwalkerData";
import { VOIDWALKER_WIREFRAMES } from "@/components/landing/home-v2/voidwalker/wireframes/voidwalkerWireframes";

/**
 * HoloEraPanels — the "little design grids" that flank the figure.
 *
 * ⚠ THE DRAWINGS ARE NOT NEW WORK. Three eras already have an authored
 * wireframe plate in the ADR-074 record (`genai` → latent, `azeroth` →
 * azeroth, `the-crowd` → expanse), and each is a zero-prop component
 * with no context and no scroll dependency, so it mounts here verbatim
 * — the only cost is `voidwalker-wire.css` and its `--w-*` token block,
 * which the lab already imports. A drawing declares what it letters in
 * `voidwalkerWireLabels.ts`; nothing here adds a label, so no guard moves.
 *
 * ⚠ THREE ERAS HAVE NO DRAWING (`loop`, `thoughtform`, `creatives`) and
 * they must not therefore look unfinished. They get a SCOPE plate built
 * from the record's own fields instead — the era's wardrobe line, its
 * motto, its loadout — which is what the owner asked the panels to say:
 * what the era was and what its scope was, not an essay.
 */

function plain(segments: readonly VwSegment[]): string {
  return segments.map((s) => (typeof s === "string" ? s : "em" in s ? s.em : s.mark)).join("");
}

function Panel({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <article className="vwh__panel">
      <p className="vwh__panel__kicker">{kicker}</p>
      {children}
    </article>
  );
}

/**
 * ⚠ TWO SIDE STACKS, NOT `display: contents`. The first cut let the
 * panels place themselves as grid items of `.vwh` — which auto-placed
 * four of them onto four ROWS, so the section measured 1411px against a
 * 595px viewport and the figure sat below the fold. A landing section
 * has to hold one screen; the sides are their own columns and the figure
 * keeps the middle at full height.
 */
export function HoloEraPanels({ era }: { era: CharacterEra }) {
  const beat = VOIDWALKER_BEATS.find((b) => b.id === era.beatId);
  const Wire = beat?.wire ? VOIDWALKER_WIREFRAMES[beat.wire] : null;

  return (
    <>
      <div className="vwh__side" data-side="l">
        {/* What the era WAS. Always present, always the same shape, so the
            rail's six stops read as one instrument. */}
        <Panel kicker="Era">
          <p className="vwh__panel__title">{era.wardrobe}</p>
          <p className="vwh__panel__year">{era.year}</p>
          <p className="vwh__panel__motto">{era.motto}</p>
        </Panel>

        {/* The scope, in the record's own words. */}
        <Panel kicker="Scope">
          <p className="vwh__panel__body">{beat ? plain(beat.body) : era.motto}</p>
        </Panel>
      </div>

      <div className="vwh__side" data-side="r">
        {/* The drawing when the record has one, the loadout when it does
            not. Same frame, different content — an era without an artefact
            must not read as an era that failed to load one. */}
        {Wire ? (
          <Panel kicker="Artefact">
            <div className="vwh__panel__wire">
              <Wire />
            </div>
            {beat?.artefact ? <p className="vwh__panel__cap">{beat.artefact}</p> : null}
          </Panel>
        ) : (
          <Panel kicker="Loadout">
            <p className="vwh__panel__body">{era.loadout}</p>
          </Panel>
        )}

        {beat?.press ? (
          <Panel kicker="On record">
            <p className="vwh__panel__press">{beat.press.headline}</p>
            <p className="vwh__panel__cap">{beat.press.outlet}</p>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
