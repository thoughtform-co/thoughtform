/**
 * The X-Bionic core lab's one record (2026-10-11): the four workstreams and
 * who owns each, the layer's three banks, and what X-Bionic's Claude
 * Enterprise already holds. Every variation reads this, so the words cannot
 * drift between routes. From the 8 October call: Claude Enterprise is in
 * place and connected to Shopify and the analytics; the departing
 * copywriter's product voice is the first thing to write down; a freelance
 * paid social lead joins the digital team. People by role, never by name.
 */
export const WORKSTREAMS = [
  { id: "production", name: "Creative production", owner: "Creative lead" },
  { id: "ops", name: "Creative ops", owner: "Digital team" },
  { id: "review", name: "Creative review", owner: "Copy editor" },
  { id: "strategy", name: "Creative strategy", owner: "Paid social lead" },
] as const;

export const BANKS = [
  {
    id: "context",
    name: "Context",
    what: "What the work knows",
    items: ["Product facts", "The product voice"],
    detail: [
      ["Product facts", "Socks, base layers, shoes"],
      ["The product voice", "The copywriter's best ads"],
      ["Audiences", "Who each ad is for"],
    ],
  },
  {
    id: "skills",
    name: "Skills",
    what: "How the work is done",
    items: ["Brief to variants", "Naming and filing"],
    detail: [
      ["Brief to variants", "One brief, ten ads"],
      ["Product copy", "Short form, per channel"],
      ["Naming and filing", "Every ad findable"],
    ],
  },
  {
    id: "evals",
    name: "Evals",
    what: "What good looks like",
    items: ["Product accuracy", "Voice and specs"],
    detail: [
      ["Product accuracy", "Render matches product"],
      ["Voice check", "Reads like X-Bionic"],
      ["Format and specs", "Right size, right length"],
    ],
  },
] as const;

export const CLAUDE = {
  name: "Claude Enterprise",
  status: "Running at X-Bionic",
  surfaces: ["Chat and projects", "Agents and scheduled runs"],
  connectors: ["Shopify", "Analytics"],
} as const;

export const PHASES = [
  {
    id: "embed",
    n: "01",
    tag: "The team",
    title: "Embed in the team",
    line: "Two weeks inside the four workstreams, on real paid social jobs with the people who run them.",
  },
  {
    id: "encode",
    n: "02",
    tag: "The layer",
    title: "Encode how the work is done",
    line: "The product facts, the product voice, the skills that do the work and the evals that check it.",
  },
  {
    id: "plug",
    n: "03",
    tag: "Claude Enterprise",
    title: "Plug it into Claude Enterprise",
    line: "One plugin in the Claude X-Bionic already runs, next to Shopify and the analytics.",
  },
] as const;

export const OFFER_HEAD = {
  eyebrow: "The offering",
  title: "Where Thoughtform",
  dim: "plugs in.",
  lede: "Thoughtform works inside X-Bionic's four creative workstreams, writes down how each one works, and installs that layer in the Claude Enterprise the company already runs.",
} as const;

export const LAYER_HEAD = {
  eyebrow: "The layer, expanded",
  title: "How adoption and",
  dim: "automation connect.",
  lede: "Claude can only automate what the team has written down. Every job the team runs with Claude adds to the layer, and every addition lets an agent take a longer task off the team's hands.",
} as const;

/** The layer's horizon: how long Claude runs on its own, step by step, and
 *  what the team wrote down to get there. Illustrative order, the plan's. */
export const HORIZON = [
  {
    n: "1",
    when: "Week 1",
    level: 0,
    wrote: "The product voice, from the copywriter's best ads",
    runs: "Claude drafts one ad at a time",
    team: [60, 30, 10],
  },
  {
    n: "2",
    when: "Week 2",
    level: 1,
    wrote: "Brief to variants, checked against the product facts",
    runs: "An agent turns one brief into ten ads",
    team: [45, 35, 20],
  },
  {
    n: "3",
    when: "Quarter 1",
    level: 2,
    wrote: "The render review: wrong product details flagged",
    runs: "A batch runs overnight, checked in the morning",
    team: [25, 30, 45],
  },
  {
    n: "4",
    when: "Quarter 2",
    level: 3,
    wrote: "The test plan, read from the analytics",
    runs: "A week of variants, briefed, made and filed",
    team: [15, 20, 65],
  },
] as const;

export const HORIZON_LEVELS = ["Minutes", "An hour", "A day", "A week"] as const;
export const TEAM_TIME = ["Making", "Checking", "Deciding"] as const;

/** The ladder: the work from upstream to downstream, and who does each
 *  rung in each phase. t = the team by hand, c = the team with Claude,
 *  w = written down (a skill or an eval), a = an agent runs it. */
export const RUNGS = [
  { id: "decide", name: "Deciding what to test" },
  { id: "brief", name: "Writing the brief" },
  { id: "make", name: "Making the ads" },
  { id: "check", name: "Checking the ads" },
  { id: "file", name: "Naming and filing" },
] as const;

export const LADDER = [
  {
    n: "01",
    name: "Adoption",
    when: "Week 1",
    cells: [
      ["t", "The team"],
      ["c", "With Claude"],
      ["c", "With Claude"],
      ["t", "The team"],
      ["t", "The team"],
    ],
  },
  {
    n: "02",
    name: "Encoding",
    when: "Week 2",
    cells: [
      ["t", "The team"],
      ["w", "Skill written"],
      ["w", "Skill written"],
      ["w", "Evals written"],
      ["w", "Skill written"],
    ],
  },
  {
    n: "03",
    name: "Automation",
    when: "From week 3",
    cells: [
      ["t", "The team"],
      ["c", "The team, with Claude"],
      ["a", "An agent runs it"],
      ["a", "An agent, asks when unsure"],
      ["a", "An agent runs it"],
    ],
  },
] as const;
