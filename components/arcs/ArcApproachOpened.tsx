import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { PlugFigure } from "./ArcPluginLayer";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { pluginLayer } from "./pluginLayer";

const two = (n: number) => String(n).padStart(2, "0");

/** The figure's number, chrome: the vision's figure is the first. */
const FIG_N = "02";

interface ArcApproachOpenedProps {
  section: ArcSectionOf<"handoff">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcApproachOpened — the lane opened (the approach's lab direction
 * `opened`, 2026-10-11). The plugin beat's own console: the chamfered
 * plate, the `SYS` head strip, the readout foot, split three to two. Left,
 * `pluginLayer`'s gold layer opened over the host slab with ONE lane lit,
 * the other three dim and dashed, and the three passes mapped along that
 * lane as three marks: the team's diamond at its head, the courses across
 * its middle, Claude's beads to the owner's diamond at its end; the lane's
 * skill lettered past the end, each pass's index tagged on a leader off its
 * mark. Right, the three passes under the same indices, then the lane's
 * skill and its two evals as a small ledger. `Fig. 02` bottom-left.
 *
 * ⚠ ONE DRAWING, NOT A SECOND: `PlugFigure` and `pluginLayer` are the
 * engine beat's, taking an opened lane. ⚠ THE SVG LETTERS NOTHING.
 * ⚠ SERVER, NO STATE, DOM ONLY.
 */
export function ArcApproachOpened({ section, index, motion = "reveal" }: ArcApproachOpenedProps) {
  const { opened, steps } = section;
  if (!opened) return null;
  const d = pluginLayer(opened.lanes, opened.connectors.length, {
    lane: opened.lit,
    courses: { skills: 3, evals: opened.evals.length },
    seed: section.id,
  });
  return (
    <ArcBeat
      id={section.id}
      kind="handoff"
      className="arc-section arc-sec arc-sec--handoff arc-sec--handoff-opened"
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
        <div
          className="arc-lev arc-plug arc-plate arc-reveal apr apr--opened"
          {...rung(motion, 0.14)}
        >
          <div className="arc-lev__bar">
            <p className="arc-lev__sys">
              <span className="arc-lev__sys-key">SYS</span>
              {opened.console.name}
            </p>
            <p className="arc-lev__status">
              <span className="arc-lev__pulse" aria-hidden="true" />
              {opened.console.status}
            </p>
          </div>
          <div className="arc-plug__split">
            <PlugFigure
              d={d}
              layer={opened.layer}
              host={opened.host}
              connectors={opened.connectors}
              alt={opened.alt}
              opened={{ skill: opened.skill, caption: { n: FIG_N, text: opened.caption } }}
            />
            <div className="arc-plug__list apr__col">
              <ol className="apr__passes">
                {steps.map((s, i) => (
                  <li key={s.id} className="apr__pass" data-apr-pass={i}>
                    <p className="apr__pass-key">
                      <span className="apr__pass-n">{two(i + 1)}</span>
                      {s.label}
                    </p>
                    <p className="apr__pass-line">{opened.lines[i]}</p>
                  </li>
                ))}
              </ol>
              <dl className="apr__ledger">
                <div>
                  <dt>Skill</dt>
                  <dd>{opened.skill}</dd>
                </div>
                {opened.evals.map((ev) => (
                  <div key={ev}>
                    <dt>Eval</dt>
                    <dd>{ev}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <dl className="arc-lev__readout">
            {opened.readout.map((r) => (
              <div key={r.label} className="arc-lev__read">
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ArcBeat>
  );
}
