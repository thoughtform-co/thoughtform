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
