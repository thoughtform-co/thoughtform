"use client";

import type { CSSProperties } from "react";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { CaseTrackVisual } from "@/lib/cases/types";

import { FilmsPlate } from "./FilmsPlate";
import { SignalChart } from "./SignalChart";
import { StillsPlate } from "./StillsPlate";
import { ToolGallery } from "./ToolGallery";

/**
 * TrackVisual — one switch over the evidence-plate kinds.
 *
 * Carries a `never` exhaustiveness check: adding a kind to `CaseTrackVisual`
 * is a compile error until a branch exists here, which is what stops a new
 * plate silently rendering as a hole.
 *
 * `readouts` renders NOTHING — for that kind the readout block itself is the
 * plate, and `TrackPanel` promotes it instead.
 *
 * Rows are keyed by INDEX throughout. These are fixed, ordered lists that
 * never reorder or splice, and their content is not guaranteed unique — a
 * register can legitimately repeat a label, which a content-derived key
 * collides on.
 */

/** Tool rows resolved against the canonical module. `lib/cases/` stores IDs
 *  only, so `PROJECT_CASES` stays the single source of tool copy; unknown
 *  ids drop out, and `tests/lib/cases-registry.test.ts` pins that none do. */
function resolveTools(toolIds: readonly string[]) {
  return toolIds
    .map((id) => PROJECT_CASES.find((c) => c.id === id))
    .filter((c): c is (typeof PROJECT_CASES)[number] => Boolean(c));
}

interface TrackVisualProps {
  visual: CaseTrackVisual;
  /** Selected tool, for the `tools` branch only. Owned by `TrackPanel` so the
   *  panel foot can read the same selection; ignored by every other kind. */
  toolIdx?: number;
  onToolIdx?: (idx: number) => void;
}

export function TrackVisual({ visual, toolIdx = 0, onToolIdx = () => {} }: TrackVisualProps) {
  switch (visual.kind) {
    case "signal":
      return <SignalChart points={visual.points} t0={visual.t0} now={visual.now} />;

    case "log":
      return (
        <div className="fl-plate fl-plate--log">
          <ul className="fl-log">
            {visual.rows.map((r, i) => (
              <li className="fl-log__row" key={i}>
                <span className="fl-log__t">{r.t}</span>
                <i className="fl-log__rule" aria-hidden="true" />
                <span className="fl-log__event">{r.event}</span>
              </li>
            ))}
          </ul>
          {visual.tail ? <p className="fl-plate__foot">{visual.tail}</p> : null}
        </div>
      );

    case "registry": {
      /* WEIGHTED when the groups carry counts (ADR-056 U12) — the bar is
         scaled against the LARGEST group, not the total, so the smallest
         shape still reads as a bar rather than a sliver. `count` is digits
         only and the width derives from it, so the printed figure and the
         drawn bar cannot disagree. Groups are all-or-none (pinned), so the
         first one decides the plate.

         The gloss does not disappear when weighted, it goes VISUALLY
         hidden: the weight line takes its slot, but "what this shape is"
         is the definition of the term beside it and a screen reader still
         needs it. */
      const peak = visual.groups.reduce((max, g) => Math.max(max, Number(g.count) || 0), 0);
      return (
        <div className="fl-plate fl-plate--registry" data-weighted={peak > 0 || undefined}>
          <dl className="fl-reg__groups">
            {visual.groups.map((g, i) => (
              <div className="fl-reg__group" key={i}>
                <dt className="fl-reg__name">{g.name}</dt>
                {g.count ? (
                  <>
                    <dd className="fl-reg__gloss visually-hidden">{g.gloss}</dd>
                    <dd className="fl-reg__weight">
                      <span className="fl-reg__count">{g.count}</span>
                      <i
                        className="fl-reg__bar"
                        aria-hidden="true"
                        style={{ "--w": Number(g.count) / peak } as CSSProperties}
                      />
                      {g.teams ? <span className="fl-reg__teams">{g.teams}</span> : null}
                    </dd>
                  </>
                ) : (
                  <dd className="fl-reg__gloss">{g.gloss}</dd>
                )}
              </div>
            ))}
          </dl>
          <ul className="fl-reg__rows">
            {visual.rows.map((r, i) => (
              <li className="fl-reg__row" key={i}>
                <span className="fl-reg__team">{r.team}</span>
                <span className="fl-reg__skill">{r.name}</span>
                {r.tag ? <span className="fl-reg__tag">{r.tag}</span> : null}
              </li>
            ))}
          </ul>
          {visual.footer ? <p className="fl-plate__foot">{visual.footer}</p> : null}
        </div>
      );
    }

    case "register":
      return (
        <div className="fl-plate fl-plate--register">
          <ul className="fl-register">
            {visual.rows.map((r, i) => (
              <li className="fl-register__row" key={i}>
                <span className="fl-register__k">{r.k}</span>
                <i className="fl-register__ld" aria-hidden="true" />
                <span className="fl-register__v">{r.v}</span>
              </li>
            ))}
          </ul>
          {visual.footer ? <p className="fl-plate__foot">{visual.footer}</p> : null}
        </div>
      );

    case "tools":
      /* The only CONTROLLED branch. `TrackPanel` owns the selected index
         because the panel FOOT follows the tool in view — see ToolGallery. */
      return (
        <ToolGallery
          tools={resolveTools(visual.toolIds)}
          activeIdx={toolIdx}
          onActive={onToolIdx}
        />
      );

    case "stills":
      return <StillsPlate shots={visual.shots} />;

    case "films":
      return <FilmsPlate films={visual.films} />;

    case "readouts":
      return null;

    default: {
      const exhaustive: never = visual;
      return exhaustive;
    }
  }
}
