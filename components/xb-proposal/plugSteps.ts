/* The three steps, one record for the two drawings that name them; named
   for the Arc since 2026-10-12, Navigate · Encode · Build (owner: "let's
   also use Navigate, Encode, Build … that way, it's harmonized"; the ids
   stay as keys) (owner,
   2026-10-12: "your team, one layer, your stack, connect to embed, encode,
   and run"). The plug flow keys its three regions with them and links each
   to its step; the stack below walks them one at a time. Same names, same
   tones, same order, so the overview and the walk-through cannot drift.

   `span` is the region a step covers in the plug flow's 1200-wide frame. */

export type StepTone = "green" | "gold" | "dawn";

export interface PlugStep {
  n: "01" | "02" | "03";
  id: "embed" | "encode" | "run";
  step: string;
  key: string;
  tone: StepTone;
  /** One line under the flow, at most 30 characters. */
  line: string;
  /** The flow's tab for the step, its verb then what it acts on (owner,
      2026-10-12: "embed in your team, encode your context and then plug
      into Claude Enterprise"). */
  flow: readonly [verb: string, what: string];
  span: readonly [number, number];
}

export const PLUG_STEPS: readonly PlugStep[] = [
  {
    n: "01",
    id: "embed",
    step: "Navigate",
    key: "Your team",
    tone: "green",
    line: "Inside your four workstreams",
    flow: ["Navigate with", "your team"],
    span: [96, 448],
  },
  {
    n: "02",
    id: "encode",
    step: "Encode",
    key: "The layer",
    tone: "gold",
    line: "How they work, written down",
    flow: ["Encode", "your context"],
    span: [470, 730],
  },
  {
    n: "03",
    id: "run",
    step: "Build",
    key: "Your agents",
    tone: "dawn",
    line: "In the tools you already use",
    flow: ["Build on", "Claude Enterprise"],
    span: [770, 1200],
  },
];

/** The in-page anchor of a step in the stack's runway. */
export const stepAnchor = (id: PlugStep["id"]) => `step-${id}`;
