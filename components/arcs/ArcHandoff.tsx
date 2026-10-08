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
 *   steps  three panels in a row, joined by one rule; the hinge is lit and
 *          raised, its siblings quiet (Cyberpunk's chooser).
 *   time   where the team's time goes, today and configured: two bars of
 *          named segments. The widths carry the shares; no figure is lettered.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. The widths are inline custom properties, so
 * the drawing is whole in a static render.
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
            {steps.map((s, i) => (
              <li key={s.id} className="arc-hand__step" data-hand-lit={s.lit ? "" : undefined}>
                <p className="arc-hand__step-label">
                  <span className="arc-hand__step-n">{String(i + 1).padStart(2, "0")}</span>
                  {s.label}
                </p>
                <p className="arc-hand__step-title">{s.title}</p>
                <p className="arc-hand__step-who">{s.who}</p>
              </li>
            ))}
          </ol>
          <div className="arc-hand__time">
            <div className="arc-hand__time-head">
              <p className="arc-hand__time-label">{time.label}</p>
              <p className="arc-hand__time-note">{time.note}</p>
            </div>
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
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
