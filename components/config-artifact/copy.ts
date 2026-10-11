/* The words every permutation shares. Third person; every label has to
   read for someone outside X-Bionic. */

export type FrameNo = 1 | 2;

export const TEAM = [
  { id: "production", name: "Creative production", short: "Production" },
  { id: "ops", name: "Creative ops", short: "Ops" },
  { id: "review", name: "Creative review", short: "Review" },
  { id: "strategy", name: "Creative strategy", short: "Strategy" },
] as const;

export const LAYERS = [
  { id: "context", name: "Context", gist: "Product facts, brand voice" },
  { id: "skills", name: "Skills", gist: "How the work is done" },
  { id: "evals", name: "Evals", gist: "What good looks like" },
] as const;

/** Downstream: what the company already runs. */
export const DOWNSTREAM = [
  { id: "agents", name: "Agents", group: "Claude Enterprise" },
  { id: "models", name: "Models", group: "Claude Enterprise" },
  { id: "shopify", name: "Shopify", group: "Connected" },
  { id: "analytics", name: "Analytics", group: "Connected" },
] as const;

/** Section 2: one progression, illustrative. */
export const STAGES = [
  { when: "Week 1", written: 4, runs: "Minutes", task: "Drafts one ad" },
  { when: "Week 2", written: 11, runs: "An hour", task: "One brief into ten ads" },
  { when: "Quarter 1", written: 22, runs: "A day", task: "A batch, checked overnight" },
  { when: "Quarter 2", written: 34, runs: "A week", task: "A week of variants" },
] as const;
export const WRITTEN_MAX = 40;

export const TEXT = {
  1: {
    eyebrow: "The offering",
    title: ["Where Thoughtform", "plugs in."],
    body: "Thoughtform builds a configuration inside X-Bionic's creative team: what the team knows, how it works and what good looks like, written down. It plugs into the Claude Enterprise the company already runs.",
    keys: [
      { n: "01", label: "The team", gold: false },
      { n: "02", label: "The configuration", gold: true },
      { n: "03", label: "Claude Enterprise", gold: false },
    ],
  },
  2: {
    eyebrow: "The configuration, over time",
    title: ["Adoption becomes", "automation."],
    body: "Every job the team runs with Claude adds to the configuration, and every addition lets an agent run longer on its own. The team moves up to the decisions.",
    keys: [
      { n: "A", label: "Written down", gold: true },
      { n: "B", label: "Runs on its own", gold: false },
    ],
  },
} as const;
