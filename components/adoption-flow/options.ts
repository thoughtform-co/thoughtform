/**
 * The adoption-flow options, as words: what each is and which reference it
 * answers. Plain data, so the lab's server page reads it; the scenes, cameras
 * and trackers are wired client-side in `scenes.ts`.
 */

export type FlowOptionId = "axis" | "stack" | "field" | "dish";

export interface FlowOption {
  id: FlowOptionId;
  letter: string;
  title: string;
  after: string;
  reads: string;
}

export const FLOW_OPTIONS: Record<FlowOptionId, FlowOption> = {
  axis: {
    id: "axis",
    letter: "A",
    title: "Axis",
    after: "The equilibrium, holo.ui8",
    reads:
      "One axis, left to right. The team's work is a drifting contour mass in a cradle of 27 ticks. It is written down as five gold collars, one per shape, caged by one strut per Skill. Then it runs down a line of identical rings, each run stopping at its rung's gate: prompt, tool, agent.",
  },
  stack: {
    id: "stack",
    letter: "B",
    title: "Exploded stack",
    after: "anime.js, the instrument's organisation altitude",
    reads:
      "One coaxial stack, exploded on a slow breath. The work is the base plate, the five shapes are the plates above it, as thick as their Skill counts and toothed one per Skill, and the three run modes sit on top, tallest for the one that runs longest alone. Motes climb the bore and stop at their rung.",
  },
  field: {
    id: "field",
    letter: "C",
    title: "Field",
    after: "the wireframe surface",
    reads:
      "A ruled surface over a graticule. Across, adoption to automation; up, how long the work runs without a person. Low and restless where the team learns by hand, a gold band where it is written down, then three plateaus. One bar per stream on each plateau: 3 by hand, 12 prompt, 5 tool, 7 agent.",
  },
  dish: {
    id: "dish",
    letter: "D",
    title: "Dish",
    after: "Scan::Tron, Atranik",
    reads:
      "A dodecagonal plate, the house housing. Dust from the rim is drawn into the core: adoption. The core is a column of 47 point rings in five bands, read by a rising scan: the layer. Three pylons on the rim take the runs out, as tall as how long each rung runs alone: automation.",
  },
};

export const FLOW_ORDER: FlowOptionId[] = ["axis", "stack", "field", "dish"];

export const isFlowOptionId = (v: unknown): v is FlowOptionId =>
  typeof v === "string" && (FLOW_ORDER as string[]).includes(v);
