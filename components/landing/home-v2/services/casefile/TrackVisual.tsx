"use client";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { CaseTrackVisual } from "@/lib/cases/types";

import { FilmsPlate } from "./FilmsPlate";
import { IntelligenceMapPlate } from "./IntelligenceMapPlate";
import { SheetsPlate } from "./SheetsPlate";
import { SignalChart } from "./SignalChart";
import { SkillsBrowserPlate } from "./SkillsBrowserPlate";
import { StillsPlate } from "./StillsPlate";
import { ToolGallery } from "./ToolGallery";

/**
 * TrackVisual — one switch over the evidence-plate kinds.
 *
 * Carries a `never` exhaustiveness check: adding a kind to `CaseTrackVisual`
 * is a compile error until a branch exists here, which is what stops a new
 * plate silently rendering as a hole.
 *
 * `readouts` renders nothing: compatibility readouts are normalized into the
 * left-column proof register by `TrackProofRegister`.
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
  /** Selected tool, for the controlled `tools` branch only. */
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

    case "intelligence-map":
      /* The city (ADR-062). `groups`/`rows` stay on the visual for the
         beat-sharing and count-agreement guards.

         ⚠ `skills` IS DRAWN NOW. It was "evidence the plate sums rather
         than geometry it has to place" while reading 03 was the pin
         grid, which lettered aggregate counts only. The grid's five
         rows are five CARDS of named Skills now, so the reservoir feeds
         the drawing directly — and the count agreement the registry
         test asserts is the thing a reader can now check by counting
         plates on screen. */
      return (
        <IntelligenceMapPlate
          shapes={visual.shapes}
          districts={visual.districts}
          works={visual.works}
          skills={visual.skills ?? []}
          envelope={visual.envelope}
        />
      );

    case "registry": {
      /* THE BROWSER when the track carries a portfolio (ADR-056 U13) — the
         engine tabs carry the U12 counts, so the weighted overview and the
         clickable skills are one surface. (The U12 weighted-bar render this
         replaces lived for one pass; its counts live on the tabs now.)

         The `rows` exemplars are NOT rendered on the browser plate — the
         portfolio shows the real thing they stood in for — but they stay in
         the data: the beat renders them, and the plate-sharing guard still
         asserts them shared. The name+gloss fallback below serves a future
         case's plain registry. */
      if (visual.skills?.length) {
        /* `intelligence` promotes the lattice to the full MAP (ADR-056
           U16) — three views over one dataset. Absent, the plate is the
           lattice alone, which is what a second client would get. */
        return (
          <SkillsBrowserPlate
            groups={visual.groups}
            skills={visual.skills}
            intelligence={visual.intelligence}
            teamDraw={visual.teamDraw}
          />
        );
      }
      return (
        <div className="fl-plate fl-plate--registry">
          <dl className="fl-reg__groups">
            {visual.groups.map((g, i) => (
              <div className="fl-reg__group" key={i}>
                <dt className="fl-reg__name">{g.name}</dt>
                <dd className="fl-reg__gloss">{g.gloss}</dd>
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
      /* The only CONTROLLED branch. `TrackPanel` owns the selected index so
         the tab rail and full-height tool instrument change as one surface. */
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

    case "sheets":
      return <SheetsPlate sheets={visual.sheets} />;

    case "readouts":
      return null;

    default: {
      const exhaustive: never = visual;
      return exhaustive;
    }
  }
}
