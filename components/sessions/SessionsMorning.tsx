import type { CSSProperties } from "react";

import { DIAL_RINGS, DIAL_VB, dialCirclePath, dialStubs, dialTicks } from "@/lib/sessions/dial";
import type { SessionsPageModel } from "@/lib/sessions/page";

import { MorningDial } from "./MorningDial";
import { SessionsHead } from "./SessionsHead";

const seat = (ax: number, at: number) => ({ "--ax": ax, "--at": at }) as CSSProperties;

/**
 * 01 · The morning (ADR-150) — Prime Intellect's pinned figure beside its
 * numbered steps, in the house register. The figure is THE DIAL: a clock face
 * of the three-hour morning in the About drawing's rings, the four movements
 * as sectors whose sweep is their time. As a step crosses the frame's
 * midline the dial turns to it (`MorningDial`, the one listener).
 *
 * ⚠ The server renders the LAST step lit, which is what no script, reduced
 * motion and a still all read. Every lettered thing on the figure is DOM.
 */
export function SessionsMorning({ morning }: { morning: SessionsPageModel["morning"] }) {
  const last = morning.steps.length - 1;
  const stepIds = morning.steps.map((s) => `hs-step-${s.id}`);
  return (
    <section
      className="hs-sec hs-morning"
      id="the-morning"
      aria-labelledby="hs-morning-title"
      data-hs-section="the-morning"
      data-step={last}
    >
      <div className="hs-band">
        <SessionsHead
          ord="01"
          kicker={morning.kicker}
          title={morning.title}
          id="hs-morning-title"
        />
        <div className="hs-morning__body">
          <figure
            className="hs-morning__fig hs-reveal"
            aria-label={`${morning.fig}: ${morning.span}`}
          >
            <figcaption className="hs-fig__cap">
              <span>{morning.fig}</span>
              <span>{morning.span}</span>
            </figcaption>
            <div className="hs-dial">
              <svg
                className="hs-dial__svg"
                viewBox={`${DIAL_VB.x} ${DIAL_VB.y} ${DIAL_VB.w} ${DIAL_VB.h}`}
                aria-hidden="true"
                focusable="false"
              >
                <circle className="hs-dial__disc" cx="0" cy="0" r="119" />
                {DIAL_RINGS.map((ring) => (
                  <path
                    key={ring.id}
                    className={`hs-dial__ring hs-ink--${ring.ink}`}
                    d={dialCirclePath(ring.r)}
                    strokeDasharray={ring.dash}
                  />
                ))}
                {morning.sectors.map((s, i) => (
                  <g key={s.id} className="hs-dial__sector" data-i={i}>
                    <path className="hs-dial__wedge" d={s.wedge} />
                    <path className="hs-dial__arc" d={s.arc} />
                    <line
                      className="hs-dial__hand"
                      x1={s.hand.x1}
                      y1={s.hand.y1}
                      x2={s.hand.x2}
                      y2={s.hand.y2}
                    />
                    <line
                      className="hs-dial__leader"
                      x1={s.leader.x1}
                      y1={s.leader.y1}
                      x2={s.leader.x2}
                      y2={s.leader.y2}
                    />
                  </g>
                ))}
                {dialTicks().map((t) => (
                  <line
                    key={t.id}
                    className="hs-dial__tick"
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                  />
                ))}
                {dialStubs().map((t) => (
                  <line
                    key={t.id}
                    className="hs-dial__stub"
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                  />
                ))}
              </svg>
              {morning.sectors.map((s, i) => (
                <span
                  key={s.id}
                  className="hs-dial__label"
                  data-i={i}
                  data-side={s.side}
                  style={seat(s.label.ax, s.label.at)}
                >
                  {morning.steps[i].short}
                </span>
              ))}
              <div className="hs-dial__hub" aria-hidden="true">
                {morning.steps.map((step, i) => (
                  <span key={step.id} className="hs-dial__hub-n" data-i={i}>
                    {step.n}
                  </span>
                ))}
              </div>
            </div>
          </figure>
          <ol className="hs-steps">
            {morning.steps.map((step, i) => (
              <li key={step.id} id={`hs-step-${step.id}`} className="hs-step hs-reveal" data-i={i}>
                <span className="hs-step__n">{step.n}</span>
                <h3 className="hs-step__name">{step.name}</h3>
                <p className="hs-step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <MorningDial sectionId="the-morning" stepIds={stepIds} />
    </section>
  );
}
