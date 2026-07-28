"use client";

import Image from "next/image";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import type { CaseTrackVisual } from "@/lib/cases/types";

import { SignalChart } from "./SignalChart";

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

export function TrackVisual({ visual }: { visual: CaseTrackVisual }) {
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

    case "registry":
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
      return (
        <div className="fl-plate fl-plate--tools">
          <ul className="fl-tools">
            {resolveTools(visual.toolIds).map((tool) => (
              <li className="fl-tool" key={tool.id}>
                <Image
                  className="fl-tool__shot"
                  src={tool.image.src}
                  alt={tool.image.alt}
                  width={tool.image.width}
                  height={tool.image.height}
                />
                <span className="fl-tool__name">{tool.codename}</span>
                <span className="fl-tool__tag">{tool.tagline}</span>
                <span className="fl-tool__state">{tool.status}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "readouts":
      return null;

    default: {
      const exhaustive: never = visual;
      return exhaustive;
    }
  }
}
