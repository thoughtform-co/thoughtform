import { SURI_RUNS, SURI_STUDIO_CONFIGURATION } from "@/lib/arcs/content/shared/suriWork";

import { fromQuestions } from "../adapt";
import type { InstrumentRecord } from "../types";

/**
 * SURI, AS ONE RECORD AT FIVE ALTITUDES (ADR-154): the studio configuration
 * the Suri page already draws (`SURI_STUDIO_CONFIGURATION`, read through
 * `fromQuestions` so the six stay the shared record's), opened downward into
 * the briefing run and its checks (`SURI_RUNS.briefing`, ADR-148) and upward
 * into the plugin (`ai-suri`, the facts of ADR-151's guide) and the
 * organisation (the three workstreams of 5 October).
 *
 * ⚠ PEOPLE BY ROLE. ⚠ Every file and figure is the plugin repository's own.
 */
const base = fromQuestions("suri", SURI_STUDIO_CONFIGURATION);
const run = SURI_RUNS.briefing;

export const SURI_INSTRUMENT: InstrumentRecord = {
  ...base,
  run: {
    ask: run.ask,
    skill: run.skill,
    steps: run.steps,
    decide: run.decide,
  },
  checks: [
    ...run.checks.map((c, i) => ({
      id: `check-${i + 1}`,
      label: c.line,
      ...(c.gate ? { gate: true as const } : {}),
      state: "pass" as const,
    })),
    { id: "case-names", label: "Names at brief stage", state: "not-run" as const },
  ],
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
    work: base.alt.work,
    org: "Suri's studio as one frame: the model, the data and the interface shared along its top edge, the plugin at the centre with three workstreams, and the context, the evaluations and the owner per workstream below",
    plugin:
      "The ai-suri plugin as a frame under the marketplace and the organisation: the skills and the evals lit, the mother at the centre, the connectors and the owner beside them, the interfaces on a bar underneath",
    run: "The briefing run as five stations: you ask, Claude picks the brief skill, it follows the steps, it checks itself, the strategist decides",
    check:
      "The briefing run's checks, four gates passed and one case not yet run, with the strategist's decision beside them",
  },
};
