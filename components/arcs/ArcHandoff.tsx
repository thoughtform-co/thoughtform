import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcHandoffProps {
  section: ArcSectionOf<"handoff">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcHandoff — automation runs through adoption (ADR-153).
 *
 *   steps  three of the arcs' chamfered plates, each with a head strip (its
 *          index and verb, and its timing as a readout), joined by chevron
 *          runs (their own elements: a plate's clip cuts anything hung
 *          outside it). The hinge carries the gold head band and its
 *          siblings fade back (Overmind's chooser on Mobbin; Cyberpunk's).
 *   time   where the team's time goes, today and configured, as bar-code
 *          tracks (Tensorlake's stripes): named segments above, no figures.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. The widths are inline flex weights, so the
 * drawing is whole in a static render.
 */
export function ArcHandoff({ section, index, motion = "reveal" }: ArcHandoffProps) {
  const { steps, time } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="handoff"
      className="arc-section arc-sec arc-sec--handoff"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="handoff"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-hand arc-reveal" {...rung(motion, 0.14)}>
          <ol className="arc-hand__steps">
            {steps.map((s, i) => [
              i > 0 ? (
                <li key={`${s.id}-run`} className="arc-hand__run" aria-hidden="true">
                  ›››
                </li>
              ) : null,
              <li
                key={s.id}
                className="arc-hand__step arc-plate"
                data-hand-lit={s.lit ? "" : undefined}
              >
                <div className={`arc-hand__head${s.lit ? " arc-plate__head" : ""}`}>
                  <p className="arc-hand__step-label">
                    <span className="arc-hand__step-n">{String(i + 1).padStart(2, "0")}</span>
                    {s.label}
                  </p>
                  <p className="arc-hand__when">{s.when}</p>
                </div>
                <div className="arc-hand__body">
                  <p className="arc-hand__step-title">{s.title}</p>
                  <p className="arc-hand__step-who">
                    <span className="arc-hand__who-key">Owner</span>
                    {s.who}
                  </p>
                </div>
              </li>,
            ])}
          </ol>
          <div className="arc-hand__time arc-plate">
            <div className="arc-hand__time-head">
              <p className="arc-hand__time-label">{time.label}</p>
              <p className="arc-hand__time-note">{time.note}</p>
            </div>
            <div className="arc-hand__rows">
              {time.rows.map((r) => (
                <div key={r.label} className="arc-hand__row">
                  <p className="arc-hand__row-label">{r.label}</p>
                  <div className="arc-hand__bar">
                    {r.segments.map((g) => (
                      <span
                        key={g.label}
                        className="arc-hand__seg"
                        data-hand-lit={g.lit ? "" : undefined}
                        style={{ flexGrow: g.share }}
                      >
                        <span className="arc-hand__seg-name">{g.label}</span>
                        <span className="arc-hand__seg-track" aria-hidden="true" />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
