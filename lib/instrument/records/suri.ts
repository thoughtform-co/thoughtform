import {
  SURI_RUNS,
  SURI_STUDIO_CONFIGURATION,
  SURI_WORKSTREAMS,
  type RunBody,
  type SuriWorkstream,
} from "@/lib/arcs/content/shared/suriWork";
import type { ArcRunCase } from "@/lib/arcs/types";

import { fromQuestions } from "../adapt";
import type { CheckState, InstrumentCheck, InstrumentRecord } from "../types";

/**
 * SURI, AS ONE RECORD AT FIVE ALTITUDES (ADR-154): the studio configuration
 * the Suri page already draws (`SURI_STUDIO_CONFIGURATION`, read through
 * `fromQuestions` so the six stay the shared record's), opened downward into
 * a workstream's run and its checks (`SURI_RUNS`, ADR-148) and upward into
 * the plugin (`ai-suri`, the facts of ADR-151's guide) and the organisation
 * (the three workstreams of 5 October).
 *
 * ⚠ THE CHECK ROWS ARE THE EVAL LOG'S, NEVER INVENTED (ADR-148): the rubric's
 * checks pass when every case that ran held in full, go to review when one
 * missed, and have not run when none has; each case is a row of its own
 * with its result as filed, and the log's one line sits under them.
 *
 * ⚠ PEOPLE BY ROLE. ⚠ Every file and figure is the plugin repository's own.
 */

function caseState(c: ArcRunCase): CheckState {
  if (!c.with) return "not-run";
  const [got, of] = c.with.split(" of ").map(Number);
  return got === of ? "pass" : "review";
}

function checksOf(run: RunBody): InstrumentCheck[] {
  const ran = run.evals.cases.filter((c) => c.with);
  const rubric: CheckState =
    ran.length === 0 ? "not-run" : ran.every((c) => caseState(c) === "pass") ? "pass" : "review";
  return [
    ...run.checks.map(
      (c, i): InstrumentCheck => ({
        id: `check-${i + 1}`,
        label: c.line,
        ...(c.gate ? { gate: true as const } : {}),
        state: rubric,
      })
    ),
    ...run.evals.cases.map(
      (c): InstrumentCheck => ({
        id: `case-${c.name}`,
        label: c.name,
        code: true,
        ...(c.with ? { figure: c.without ? `${c.with}, ${c.without} without` : c.with } : {}),
        state: caseState(c),
      })
    ),
  ];
}

/** One workstream's record: the studio's six, its run opened and its checks. */
export function suriWorkstreamInstrument(which: SuriWorkstream): InstrumentRecord {
  const base = fromQuestions(`suri-${which}`, SURI_STUDIO_CONFIGURATION);
  const run = SURI_RUNS[which];
  const label = SURI_WORKSTREAMS[which].label;
  return {
    ...base,
    run: {
      ask: run.ask,
      skill: run.skill,
      steps: run.steps,
      decide: run.decide,
    },
    checks: checksOf(run),
    checksNote: run.evals.note,
    alt: {
      work: base.alt.work,
      run: `The ${label.toLowerCase()} run as five stations: you ask, Claude picks the ${run.skill.name} skill, it follows the steps, it checks itself, ${run.decide.who.toLowerCase()} decides`,
      check: `The ${label.toLowerCase()} run's checks, the rubric's rows and the eval cases as the log filed them, with ${run.decide.who.toLowerCase()}'s decision beside them`,
    },
  };
}

const briefing = suriWorkstreamInstrument("briefing");

export const SURI_INSTRUMENT: InstrumentRecord = {
  ...briefing,
  id: "suri",
  plugin: {
    label: "Plugin",
    name: "ai-suri",
    skills: [
      { id: "mother", name: "mother", state: "lit", reads: true },
      { id: "brief", name: "brief", state: "lit" },
      { id: "brand", name: "brand", state: "lit" },
      { id: "design-review", name: "design-review", state: "lit" },
      { id: "video-edit", name: "video-edit", state: "lit" },
      { id: "skill-feedback", name: "skill-feedback", state: "lit", sorts: true },
    ],
    above: [
      { label: "Marketplace", name: "suri-ai-studio", line: "A private GitHub repository, synced" },
      { label: "Claude", name: "Suri's organisation", line: "Sets the model, once" },
    ],
    bar: { line: "Chat · Desktop · Cowork · Claude Code" },
  },
  org: {
    label: "Suri",
    name: "The studio",
    os: { name: "ai-suri", line: "One plugin, every workstream" },
    workstreams: [
      { id: "briefing", name: "Briefing + naming", lit: ["context", "evals"] },
      { id: "iterations", name: "Iterations" },
      { id: "video", name: "Video retouch + edit" },
    ],
    socket: { label: "Enterprise", name: "Suri's Claude organisation" },
  },
  alt: {
    ...briefing.alt,
    org: "Suri's studio as one frame: the model, the data and the interface shared along its top edge, the plugin at the centre with three workstreams, and the context, the evaluations and the owner per workstream below",
    plugin:
      "The ai-suri plugin as a frame under the marketplace and the organisation: the skills and the evals lit, the mother at the centre, the connectors and the owner beside them, the interfaces on a bar underneath",
  },
};
