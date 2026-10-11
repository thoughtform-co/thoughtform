/**
 * Every string on /test/halyard, in one record. Third person, plain, and
 * readable by someone outside the company (the brief's copy rule).
 */

export const OFFER = {
  eyebrow: "The offering",
  title: "Where Thoughtform plugs in",
  lede: "Thoughtform sits with the team, writes down how it works, and plugs that into the Claude X-Bionic already runs.",
  steps: [
    {
      n: "01",
      key: "A",
      title: "Embed",
      body: "Thoughtform works inside X-Bionic's four creative workstreams: production, operations, review and strategy.",
    },
    {
      n: "02",
      key: "B",
      title: "Write it down",
      body: "How each workstream does its work is written down as one layer the company's AI can read.",
    },
    {
      n: "03",
      key: "C",
      title: "Plug in",
      body: "The layer runs inside the Claude Enterprise X-Bionic already uses, next to Shopify and analytics.",
    },
  ],
  workstreams: [
    { id: "production", label: "Creative production" },
    { id: "ops", label: "Creative ops" },
    { id: "review", label: "Creative review" },
    { id: "strategy", label: "Creative strategy" },
  ],
  zones: {
    team: "The team",
    layer: "The layer",
    claude: "The company's Claude",
  },
  layer: "The layer",
  claude: "Claude Enterprise",
  tools: { shopify: "Shopify", analytics: "Analytics" },
  figure: "Fig. 1 · The team, the layer, the company's Claude",
  meta: "X-Bionic · Claude Enterprise",
} as const;

export type Workstream = (typeof OFFER.workstreams)[number];
