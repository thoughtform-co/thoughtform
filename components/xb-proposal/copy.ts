/* The words of the two sections, from the brief. Third person throughout;
   every label has to read for someone outside X-Bionic. */

import type { GlyphName } from "./glyphs";

export const OFFER = {
  eyebrow: "The offering",
  title: ["Where Thoughtform", "plugs in."],
  intro:
    "Thoughtform works inside X-Bionic's creative team, writes down how the team works, and installs that in the Claude Enterprise the company already runs.",
  steps: [
    {
      n: "01",
      head: "Embedded in the team",
      body: "Inside the four creative workstreams, on real paid social work, with the people who run it.",
      short: "On real paid social work, with the people who run it.",
    },
    {
      n: "02",
      head: "The work, written down",
      body: "How each workstream works becomes a layer Claude can read: the context, the skills and the evals.",
      short: "Context, skills and evals: how the work is done, in a form Claude can read.",
    },
    {
      n: "03",
      head: "Plugged into Claude Enterprise",
      body: "The layer installs in the Claude Enterprise X-Bionic already runs, next to Shopify and analytics.",
      short: "Next to Shopify and analytics, in the company's own Claude.",
    },
  ],
} as const;

export const WORKSTREAMS: { id: GlyphName; name: string }[] = [
  { id: "production", name: "Creative production" },
  { id: "ops", name: "Creative ops" },
  { id: "review", name: "Creative review" },
  { id: "strategy", name: "Creative strategy" },
];

export const STRATA = [
  { id: "context", name: "Context", gist: "Product facts, brand voice" },
  { id: "skills", name: "Skills", gist: "How the work is done" },
  { id: "evals", name: "Evals", gist: "What good looks like" },
] as const;

export const TOOLS: { id: GlyphName; name: string }[] = [
  { id: "shopify", name: "Shopify" },
  { id: "analytics", name: "Analytics" },
];

/* Section 2: the layer, opened up. Adoption writes it, automation reads it,
   and the team's own work moves upstream as it grows. A progression, never
   a loop. */
export const LAYER = {
  eyebrow: "The layer",
  title: ["How adoption and", "automation connect."],
  intro:
    "The team builds the layer by using Claude on real work. Each thing written down lets an agent take on a longer task by itself, which frees the team for the decisions upstream.",
  steps: [
    {
      n: "01",
      head: "Adoption",
      body: "The team makes the ads with Claude, on real briefs, and checks every step.",
    },
    {
      n: "02",
      head: "Written down",
      body: "What works becomes the layer: the product facts and the voice, the skills, the evals.",
    },
    {
      n: "03",
      head: "Automation",
      body: "An agent runs longer jobs against the evals. The team moves on to what to test next.",
    },
  ],
} as const;

/** Each stratum, top to bottom as drawn: where it comes from (adoption) and
 *  what an agent can then do with it (automation). */
export const OPENED = [
  {
    id: "evals",
    name: "Evals",
    gist: "What good looks like",
    from: ["From the team's reviews", "What the creative lead sends back"],
    lets: ["An agent checks its own work", "before anyone at X-Bionic sees it"],
  },
  {
    id: "skills",
    name: "Skills",
    gist: "How the work is done",
    from: ["From the team's own jobs", "Each brief run with Claude"],
    lets: ["An agent runs the job end to end", "from brief to ten variants"],
  },
  {
    id: "context",
    name: "Context",
    gist: "Product facts, brand voice",
    from: ["From what X-Bionic knows", "Product sheets, the best ads"],
    lets: ["An agent knows the product", "and writes in the brand's voice"],
  },
] as const;

/** The layer over time: what is added, and how long an agent then runs on
 *  its own. The order is the plan; the timing is illustrative. */
export const GROWTH = [
  {
    when: "Week 1",
    adds: "+ Context",
    runs: ["Claude drafts one ad at a time.", "The team checks every one."],
    team: "Team · making the ads",
    level: 0,
  },
  {
    when: "Week 2",
    adds: "+ Skills",
    runs: ["An agent turns one brief", "into ten ads in the voice."],
    team: "Team · reviewing batches",
    level: 1,
  },
  {
    when: "Quarter 1",
    adds: "+ Evals",
    runs: ["A batch runs overnight,", "checked against the evals."],
    team: "Team · deciding what to test",
    level: 2,
  },
] as const;

export const HORIZON = ["Minutes", "An hour", "A day"] as const;
