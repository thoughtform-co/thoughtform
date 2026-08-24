import type { CSSProperties } from "react";

import { LOOP_FIGURES } from "@/lib/arcs/content/shared/loop-figures";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcFlywheelProps {
  section: ArcSectionOf<"flywheel">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcFlywheel — the thesis, drawn (ADR-078).
 *
 * It replaced three text cards headed *Adoption that works IS automation*,
 * on a page with five drawn consoles on it. This is the one beat that
 * ARGUES rather than reports, which is exactly why it was the one that
 * most needed to be an instrument.
 *
 * ⚠ IT IS A RATCHET, NOT A WHEEL, and that is the doctrine's own word:
 * *the cost of encoding a shape falls on the first piece of work that needs
 * it; every later piece inherits it — not a loop that closes, a ratchet.*
 * So there is no circle anywhere on it. The mechanism reads left to right
 * like every other instrument in this house:
 *
 *   · the PEOPLE strand (green — green is the human, everywhere on this
 *     estate) runs flat across the top: workshops, stewards, fluency;
 *   · the SYSTEM strand is a STAIRCASE that only ever rises, one square per
 *     tool taking its place on the layer;
 *   · the ENCODE teeth drop from the rail to each riser with a one-way
 *     pawl — cost paid once, inherited after;
 *   · the RETURN LIFTS climb back to the rail landing AHEAD of where they
 *     dropped. That forward displacement is the flywheel, told honestly: a
 *     helix flattened, not an arrow chasing its own tail.
 *
 * ⚠ THE FIGURES ARE `LOOP_FIGURES`, READ HERE. The content module carries
 * the head, the route and the footnote and no digits at all — the same
 * contract `dossier` has with `PROJECT_CASES`. A hand-typed count is the
 * one that goes stale, and the canon is parity-pinned to the casefile in
 * exactly one place.
 *
 * ⚠ `14` MUST READ "TEAMS USING THE LAYER". It is a different and smaller
 * set than the 22 teams briefed, and the wording is the only thing keeping
 * them apart (`.claude/rules/proof.md`; the registry test fails a bare
 * "14 teams").
 *
 * ⚠ DOM, NOT AN SVG CANVAS. The host box runs w/h ≈ 3.3 → 2.1 across the
 * three reference viewports, and no authored viewBox survives that spread
 * without letterboxing — the measured reason the tool wireframes are DOM.
 * Only closed shapes (the pawls, the lifts' heads, the position glyph) are
 * inline SVG; every connector is a 1px DIV, because a stroked single-axis
 * path reports a zero-height client rect and vanishes from the collapse
 * guard.
 *
 * ⚠ GOLD BUYS ONE THING (ADR-068 U5, four deletions deep): the seat plate
 * at the route's end. The waypoints' diamonds and the wayline are the dim
 * wayfinding rung, not a second bright object.
 */
export function ArcFlywheel({ section, index, motion = "reveal" }: ArcFlywheelProps) {
  /* The registers, in the reading order the mechanism has: what adoption
     moved, what encoding produced, what got built. Two rows per stage. */
  const registers = [
    { id: "workshops", figure: LOOP_FIGURES.workshops, label: "Workshops run" },
    { id: "people", figure: LOOP_FIGURES.people, label: "People on the layer" },
    { id: "skills", figure: LOOP_FIGURES.skills, label: "Skills encoded" },
    { id: "teams", figure: LOOP_FIGURES.teamsUsing, label: "Teams using the layer" },
    { id: "tools", figure: LOOP_FIGURES.tools, label: "Tools in production" },
    { id: "studio", figure: LOOP_FIGURES.studioAi, label: "Of briefings involve AI" },
  ] as const;

  /* Four steps: the staircase's rhythm, and the count of tools that took
     their place on it. The correspondence is compositional — the register
     letters the number, the drawing never counts its own squares. */
  const steps = [0, 1, 2, 3];

  return (
    <ArcBeat
      id={section.id}
      kind="flywheel"
      className="arc-section arc-sec arc-sec--fly"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        <ArcSectionHead
          head={section.head}
          kind="flywheel"
          index={index}
          sectionId={section.id}
          motion={motion}
        />

        <div className="arc-fly arc-reveal" {...rung(motion, 0.12, 0)}>
          {/* The panel's header band — the reference boards' grammar: what
              the instrument is, and what state it is in. No invented
              serial: an ordinal in costume is still an ordinal. */}
          <div className="arc-fly__hd">
            <span className="arc-fly__hd-ttl">The flywheel</span>
            <span className="arc-fly__hd-st">Self-improving system</span>
          </div>

          <div className="arc-fly__body">
            <div className="arc-fly__field">
              {/* Chart furniture: a tick ladder attached to no figure. It
                  is the instrument's edge, not a scale — nothing on this
                  drawing is measured against it. */}
              <div className="arc-fly__ticks" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>

              {/* THE MECHANISM. Every mark is decorative by construction —
                  the sentence below carries it for a screen reader, and
                  the three stage labels are real text on top. */}
              <div className="arc-fly__mech" aria-hidden="true">
                <div className="arc-fly__rail" />
                {steps.map((i) => (
                  <i
                    className="arc-fly__node"
                    key={`node-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  />
                ))}

                {steps.map((i) => (
                  <div
                    className="arc-fly__step"
                    key={`step-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <i className="arc-fly__step-run" />
                    {/* The riser connects a tread DOWN to the one before
                        it, so the lowest tread has none — drawn, it was a
                        stub hanging through the field's floor. */}
                    {i > 0 ? <i className="arc-fly__step-rise" /> : null}
                    <i className="arc-fly__tool" />
                  </div>
                ))}

                {/* The teeth: cost paid once, at the riser. */}
                {steps.map((i) => (
                  <div
                    className="arc-fly__tooth"
                    key={`tooth-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <i className="arc-fly__tooth-line" />
                    <svg className="arc-fly__pawl" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M0 0 L10 0 L5 8 Z" />
                    </svg>
                  </div>
                ))}

                {/* The return lifts: back to the rail, landing AHEAD. */}
                {steps.slice(0, 3).map((i) => (
                  <div
                    className="arc-fly__lift"
                    key={`lift-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <i className="arc-fly__lift-line" />
                    <svg className="arc-fly__lift-head" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M0 8 L5 0 L10 8 Z" />
                    </svg>
                  </div>
                ))}

                {/* Both strands leave the field together, into the seat. */}
                <div className="arc-fly__drop arc-fly__drop--people" />
                <div className="arc-fly__drop arc-fly__drop--system" />
              </div>

              <span className="arc-fly__stage arc-fly__stage--nav">Navigate</span>
              <span className="arc-fly__stage arc-fly__stage--enc">Encode</span>
              <span className="arc-fly__stage arc-fly__stage--bld">Build</span>

              <p className="arc-fly__sr">
                Navigate produces the read, encode produces the layer, build produces the map. Every
                encoded shape is paid for once and inherited by the work that follows.
              </p>
            </div>

            <dl className="arc-fly__reg">
              {registers.map((r) => (
                <div className="arc-fly__reg-row" key={r.id}>
                  <dt className="arc-fly__fig">{r.figure}</dt>
                  <dd className="arc-fly__lbl">{r.label}</dd>
                </div>
              ))}
            </dl>

            {/* THE COURSE STRIP — the page's own chart, and it sits in the
                FIELD'S OWN COLUMN rather than across the panel. That is
                what puts the seat directly beneath the exit column both
                strands leave by: the terminus has to read as what the
                mechanism produced, and under the register stack it read as
                a caption beside it instead. The registers span both rows. */}
            <nav className="arc-fly__route" aria-label="The route through this page">
              <ol>
                {section.route.map((wp) => {
                  const inner = (
                    <>
                      <span className="arc-fly__wp-lbl">{wp.label}</span>
                      {wp.sub ? <span className="arc-fly__wp-sub">{wp.sub}</span> : null}
                    </>
                  );
                  return (
                    <li
                      className={`arc-fly__wp${wp.seat ? " arc-fly__wp--seat" : ""}`}
                      key={wp.id}
                      data-wp={wp.id}
                    >
                      {wp.target ? (
                        <a className="arc-fly__wp-hit" href={`#${wp.target}`}>
                          {wp.seat ? (
                            <span className="arc-fly__seat-in">{inner}</span>
                          ) : (
                            <>
                              <i className="arc-fly__wp-dia" aria-hidden="true" />
                              {inner}
                            </>
                          )}
                        </a>
                      ) : (
                        <span className="arc-fly__wp-hit">
                          <i className="arc-fly__wp-dia" aria-hidden="true" />
                          {inner}
                        </span>
                      )}
                      {wp.seat ? (
                        <>
                          <i className="arc-fly__br arc-fly__br--tl" aria-hidden="true" />
                          <i className="arc-fly__br arc-fly__br--tr" aria-hidden="true" />
                          <i className="arc-fly__br arc-fly__br--bl" aria-hidden="true" />
                          <i className="arc-fly__br arc-fly__br--br" aria-hidden="true" />
                        </>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </div>

        {section.footnote ? (
          <p className="arc-footnote arc-reveal" {...rung(motion, 0.22, 0)}>
            {section.footnote}
          </p>
        ) : null}
      </div>
    </ArcBeat>
  );
}
