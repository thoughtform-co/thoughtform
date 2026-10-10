/**
 * The adoption → automation flow, as numbers every option in
 * `/test/adoption-flow-lab` draws from. Read BY REFERENCE off the Loop
 * casefile (the one record of the engagement), never typed again here:
 *
 * - the five shapes and their Skill counts are `LOOP_INTELLIGENCE_MAP.shapes`;
 * - the run modes are each work's own `cfg.a`, placed on the ladder by
 *   `runModeOf` (prompt · tool · agent, and person-led work as `hand`).
 *
 * What the drawings add is DISTANCE (how far a run travels before it comes
 * back to a person), and that is illustrative: the record says each rung runs
 * longer without you, not how much longer.
 */

import {
  runModeOf,
  type RunMode,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import { LOOP_INTELLIGENCE_MAP } from "@/lib/cases/content/loop-earplugs";

export interface FlowShape {
  key: string;
  label: string;
  skills: number;
}

/** The layer: the five shapes, heaviest first. */
export const FLOW_SHAPES: readonly FlowShape[] = [...LOOP_INTELLIGENCE_MAP.shapes]
  .map((s) => ({ key: s.key, label: s.label, skills: s.skills }))
  .sort((a, b) => b.skills - a.skills);

export const FLOW_SKILLS = FLOW_SHAPES.reduce((sum, s) => sum + s.skills, 0);

function countRuns(): Record<RunMode, number> {
  const out: Record<RunMode, number> = { prompt: 0, tool: 0, agent: 0, hand: 0 };
  for (const w of LOOP_INTELLIGENCE_MAP.works) {
    const mode = runModeOf(w);
    if (mode === null) throw new Error(`adoption-flow: ${w.id} has a run mode off the ladder`);
    out[mode] += 1;
  }
  return out;
}

/** How each of the record's works runs today. */
export const FLOW_RUNS: Readonly<Record<RunMode, number>> = countRuns();
export const FLOW_WORKS = LOOP_INTELLIGENCE_MAP.works.length;
export const FLOW_CONFIGURED = FLOW_WORKS - FLOW_RUNS.hand;

/** The three automated rungs, low to high: each runs longer without a person. */
export const FLOW_RUNGS = [
  {
    mode: "prompt",
    label: "Prompt",
    count: FLOW_RUNS.prompt,
    line: "A person asks and checks every run",
  },
  { mode: "tool", label: "Tool", count: FLOW_RUNS.tool, line: "A person operates it" },
  {
    mode: "agent",
    label: "Agent",
    count: FLOW_RUNS.agent,
    line: "Runs the loop itself, asks when unsure",
  },
] as const;

/** The three stages, in the proposals' own words (X-Bionic, ADR-152). */
export const FLOW_STAGES = [
  { id: "adopt", label: "Adopt", line: "Your team learns on its own work" },
  { id: "encode", label: "Write it down", line: "How the work is done, and what good looks like" },
  { id: "automate", label: "Automate", line: "Claude runs it, and asks when unsure" },
] as const;

/** A mote's rung, dealt in the record's own proportion (12 · 5 · 7 of 24). */
export function rungOf(i: number): 0 | 1 | 2 {
  const k = i % FLOW_CONFIGURED;
  if (k < FLOW_RUNS.prompt) return 0;
  if (k < FLOW_RUNS.prompt + FLOW_RUNS.tool) return 1;
  return 2;
}
