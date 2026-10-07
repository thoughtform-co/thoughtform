import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcRunJob } from "./ArcRunJob";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcSkillRunProps {
  section: ArcSectionOf<"skill-run">;
  index: number;
  motion?: ArcMotion;
}

/** The five steps, in the words Prompt to Loop's "How it runs" slide uses.
 *  Chrome, never content: every run reads the same five in the same words. */
export const SKILL_RUN_STATIONS = [
  "You ask",
  "Claude picks the skill",
  "It follows the steps",
  "It checks itself",
  "You decide",
] as const;

export const SKILL_RUN_EVALS_LABEL = "Its evals";
export const SKILL_RUN_WITH = "With the skill";
export const SKILL_RUN_WITHOUT = "Without";
export const SKILL_RUN_NOT_RUN = "Not run yet";
export const SKILL_RUN_GATE = "Gate";

/**
 * ArcSkillRun — one workstream, run once (ADR-148): what someone asks, the
 * skill Claude picks, the steps it follows, the checks it runs on its own
 * work, and who decides, on one rail; the skill's evals under it.
 *
 * ⚠ THE WORKSHOP FRAME, NOT A NEW ONE. Each station is a frame with the one
 * top-right notch (`arcs.css` §The workshop frame); the fifth is the beat's
 * one lit object, a gold ring over a faint wash, never a solid gold block.
 * The connectors are 1px DOM (ADR-068 U6: a stroked single-axis SVG path
 * reports a zero-height rect to every collapse guard).
 *
 * ⚠ SERVER, NO STATE. `data-run-*` only. Under a `worked` switch the panels
 * are hidden by `ArcWorkedSwitch`, never re-rendered.
 */
export function ArcSkillRun({ section, index, motion = "reveal" }: ArcSkillRunProps) {
  const { ask, skill, steps, checks, decide, evals } = section;
  const [askName, skillName, stepsName, checksName, decideName] = SKILL_RUN_STATIONS;
  return (
    <ArcBeat
      id={section.id}
      kind="skill-run"
      className="arc-section arc-sec arc-sec--run"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="skill-run"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-run arc-reveal" data-run-figure="" {...rung(motion, 0.14)}>
          <ol className="arc-run__rail">
            <li className="arc-run__stn" data-run-station="ask">
              <span className="arc-run__key">1 · {askName}</span>
              <p className="arc-run__ask">{ask}</p>
            </li>
            <li className="arc-run__stn" data-run-station="skill">
              <span className="arc-run__key">2 · {skillName}</span>
              <code className="arc-run__skill">{skill.name}</code>
              {skill.also?.length ? (
                <ul className="arc-run__also">
                  {skill.also.map((s) => (
                    <li key={s}>
                      <code>{s}</code>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
            <li className="arc-run__stn" data-run-station="steps">
              <span className="arc-run__key">3 · {stepsName}</span>
              <ol className="arc-run__list">
                {steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </li>
            <li className="arc-run__stn" data-run-station="checks">
              <span className="arc-run__key">4 · {checksName}</span>
              <ul className="arc-run__list arc-run__checks">
                {checks.map((c) => (
                  <li key={c.line} data-run-gate={c.gate ? "" : undefined}>
                    <span>{c.line}</span>
                    {c.gate ? <em className="arc-run__gate">{SKILL_RUN_GATE}</em> : null}
                  </li>
                ))}
              </ul>
            </li>
            <li className="arc-run__stn arc-run__stn--lit" data-run-station="decide">
              <span className="arc-run__key">5 · {decideName}</span>
              <p className="arc-run__who">{decide.who}</p>
              <p className="arc-run__line">{decide.line}</p>
            </li>
          </ol>
          <div className="arc-run__evals" data-run-evals="">
            <span className="arc-run__key">{SKILL_RUN_EVALS_LABEL}</span>
            <dl className="arc-run__cases">
              {evals.cases.map((c) => (
                <div className="arc-run__case" key={c.name} data-run-case={c.name}>
                  <dt>
                    <code>{c.name}</code>
                  </dt>
                  {c.with ? (
                    <dd>
                      <b>{c.with}</b>
                      <small>{SKILL_RUN_WITH}</small>
                      {c.without ? (
                        <>
                          <b className="arc-run__without">{c.without}</b>
                          <small>{SKILL_RUN_WITHOUT}</small>
                        </>
                      ) : null}
                    </dd>
                  ) : (
                    <dd>
                      <small>{SKILL_RUN_NOT_RUN}</small>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
            <p className="arc-run__note">{evals.note}</p>
          </div>
        </div>
        {section.job ? <ArcRunJob job={section.job} motion={motion} /> : null}
      </div>
    </ArcBeat>
  );
}
