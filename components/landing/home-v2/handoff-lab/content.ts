export type HandoffScenarioId = "orbit" | "veil" | "collapse";

export interface HandoffService {
  id: "navigate" | "encode" | "build";
  index: string;
  verb: string;
  title: string;
  line: string;
  body: string;
  engagement: string;
  proof: string;
  readout: string;
}

export interface HandoffScenarioMeta {
  id: HandoffScenarioId;
  route: string;
  label: string;
  title: string;
  thesis: string;
  borrow: string;
}

export const HANDOFF_PIVOT = {
  eyebrow: "TRANSIT 04 -> 05 / PRACTICE LAYER",
  title: "The layer becomes useful when it inherits judgment.",
  body: "The labs are building the intelligence. Thoughtform works on the part a model cannot buy: the rules, examples, evidence, and taste that make a team worth amplifying.",
};

export const HANDOFF_SERVICES: HandoffService[] = [
  {
    id: "navigate",
    index: "01",
    verb: "Navigate",
    title: "Find the real workflow.",
    line: "We work with the team inside real workflows until the domain reveals what AI needs to know.",
    body: "Field notes before strategy slides. The first move is to sit close enough to the work that the judgment points become visible: where a senior person decides, rejects, rewrites, routes, or asks for better evidence.",
    engagement: "Keynotes, quick-start workshops, workflow labs",
    proof: "Loop pattern: 22 team sessions, each ending with one workflow worth encoding.",
    readout: "ASKING AXIOM / BENEDICT EVANS",
  },
  {
    id: "encode",
    index: "02",
    verb: "Encode",
    title: "Turn judgment into substrate.",
    line: "We turn the team's rules, examples, evidence, and review logic into a reusable operating contract.",
    body: "The durable work is not a prompt. It is the material a model can inherit: rules, examples, source hierarchy, freedom bands, evaluation cases, and the team's own standard for what good looks like.",
    engagement: "Encoding sprints, strategy-to-substrate passes",
    proof: "Loop pattern: transcripts become Skills, Skills graduate into a versioned mono-repo.",
    readout: "SUBSTRATE CONTRACT / VERSIONED",
  },
  {
    id: "build",
    index: "03",
    verb: "Build",
    title: "Ship a thin capability.",
    line: "We ship a thin running capability before the larger enterprise build begins.",
    body: "The surface stays small on purpose. A briefing agent, review console, generator, or curation tool proves whether the substrate works in daily use before anyone commits to a larger system.",
    engagement: "Embedded co-builds, guided builds",
    proof: "Loop pattern: Mimir, Vesper, Heimdall, and Babylon grew from repeated team patterns.",
    readout: "CAPABILITY ONLINE / DAILY USE",
  },
];

export const HANDOFF_SCENARIOS: Record<HandoffScenarioId, HandoffScenarioMeta> = {
  orbit: {
    id: "orbit",
    route: "/test/handoff-a",
    label: "A / Orbit and Dock",
    title: "Stay in the instrument.",
    thesis:
      "The globe never leaves the scene. It stays the fixed instrument each service readout scrolls past and orbits around.",
    borrow:
      "Supports the deadrabbit and Astral Frontier direction: fixed celestial object, sparse copy, slow drift, and a docked proof object at the end.",
  },
  veil: {
    id: "veil",
    route: "/test/handoff-b",
    label: "B / The Veil",
    title: "Cut cleanly into editorial dark.",
    thesis:
      "The 3D scene closes behind a shutter mask and releases into a calm, flat services surface with one idea per viewport.",
    borrow:
      "Supports the Zentry and Glyphic direction: DOM mask transition, strong information architecture, and the best performance path.",
  },
  collapse: {
    id: "collapse",
    route: "/test/handoff-c",
    label: "C / Collapse and Unfold",
    title: "Leave only the artifact.",
    thesis:
      "The outer scene collapses inward until only the intelligence artifact remains, then the artifact unfolds into the three service bands.",
    borrow:
      "Supports the Auremin and Zentry inversion direction: geometric compression, sphere-to-layout transformation, and the most authored Thoughtform transition.",
  },
};

export const HANDOFF_EXIT = {
  eyebrow: "NEXT STATION / BUILD CASES",
  title: "When the pattern repeats, it becomes a tool.",
  body: "The test pages stop here on purpose. The production path should hand this calm services layer into the existing build cases: Mimir, Vesper, Babylon, and Heimdall.",
};
