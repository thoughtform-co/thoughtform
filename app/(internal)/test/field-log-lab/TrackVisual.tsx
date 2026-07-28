"use client";

import Image from "next/image";

import { SignalChart } from "./SignalChart";
import { type FlVisual, resolveTools } from "./fieldLogData";

/**
 * TrackVisual — one switch over the evidence-plate kinds.
 *
 * Mirrors `lib/v7-parse/proofStation.ts`'s single switch, including its
 * `never` exhaustiveness check: adding a kind to `FlVisual` is a compile
 * error until a branch exists, which is what stops a new plate silently
 * rendering as a hole.
 *
 * `readouts` renders NOTHING here — for that kind the readout block itself is
 * the plate, and `TrackPanel` promotes it instead.
 *
 * Rows are keyed by INDEX throughout. These are fixed, ordered lists that
 * never reorder or splice, and content is not unique — a placeholder register
 * is four identical `Field / Awaiting content` rows, which a content-derived
 * key collides on.
 */
export function TrackVisual({ visual }: { visual: FlVisual }) {
  switch (visual.kind) {
    case "signal":
      return <SignalChart points={visual.points} t0={visual.t0} now={visual.now} />;

    case "log":
      return (
        <div className="fll-plate fll-plate--log">
          <ul className="fll-log">
            {visual.rows.map((r, i) => (
              <li className="fll-log__row" key={i}>
                <span className="fll-log__t">{r.t}</span>
                <i className="fll-log__rule" aria-hidden="true" />
                <span className="fll-log__event">{r.event}</span>
              </li>
            ))}
          </ul>
          {visual.tail ? <p className="fll-plate__foot">{visual.tail}</p> : null}
        </div>
      );

    case "registry":
      return (
        <div className="fll-plate fll-plate--registry">
          <dl className="fll-reg__groups">
            {visual.groups.map((g, i) => (
              <div className="fll-reg__group" key={i}>
                <dt className="fll-reg__name">{g.name}</dt>
                <dd className="fll-reg__gloss">{g.gloss}</dd>
              </div>
            ))}
          </dl>
          <ul className="fll-reg__rows">
            {visual.rows.map((r, i) => (
              <li className="fll-reg__row" key={i}>
                <span className="fll-reg__team">{r.team}</span>
                <span className="fll-reg__skill">{r.name}</span>
                {r.tag ? <span className="fll-reg__tag">{r.tag}</span> : null}
              </li>
            ))}
          </ul>
          {visual.footer ? <p className="fll-plate__foot">{visual.footer}</p> : null}
        </div>
      );

    case "register":
      return (
        <div className="fll-plate fll-plate--register">
          <ul className="fll-register">
            {visual.rows.map((r, i) => (
              <li className="fll-register__row" key={i}>
                <span className="fll-register__k">{r.k}</span>
                <i className="fll-register__ld" aria-hidden="true" />
                <span className="fll-register__v">{r.v}</span>
              </li>
            ))}
          </ul>
          {visual.footer ? <p className="fll-plate__foot">{visual.footer}</p> : null}
        </div>
      );

    case "tools":
      return (
        <div className="fll-plate fll-plate--tools">
          <ul className="fll-tools">
            {resolveTools(visual.toolIds).map((tool) => (
              <li className="fll-tool" key={tool.id}>
                <Image
                  className="fll-tool__shot"
                  src={tool.image.src}
                  alt={tool.image.alt}
                  width={tool.image.width}
                  height={tool.image.height}
                />
                <span className="fll-tool__name">{tool.codename}</span>
                <span className="fll-tool__tag">{tool.tagline}</span>
                <span className="fll-tool__state">{tool.status}</span>
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
