import type { InstrumentRecord } from "../types";

/**
 * X-BIONIC, AS ONE RECORD (ADR-154 step 3): the creative engine the proposal
 * offers, drawn at the organisation altitude on `/arcs/x-bionic/proposal`
 * (`circuit` → `instrument[org]`, static, one lit workstream).
 *
 * ⚠ IT IS A PROPOSAL, NOT A BUILD. Every answer is what phase one sets up,
 * from the 8 October call: Claude Enterprise is already X-Bionic's, wired to
 * Shopify and analytics; the AI champion owns that setup; the copywriter's
 * product voice is written down first. The lit workstream is the one phase
 * one starts with. No plugin altitude: the plugin has no name yet.
 *
 * ⚠ PEOPLE BY ROLE.
 */
export const X_BIONIC_INSTRUMENT: InstrumentRecord = {
  id: "x-bionic",
  parts: [
    {
      id: "model",
      title: "The model",
      question: "What runs it",
      answer: "Claude, in X-Bionic's own Enterprise organisation",
      state: "quiet",
    },
    {
      id: "context",
      title: "The context",
      question: "What it knows",
      answer: "The product voice, the product facts and the brief, as skills",
      state: "lit",
    },
    {
      id: "evals",
      title: "The evaluations",
      question: "How we know it is good",
      answer: "The checks the copy editor and the product designer write",
      state: "lit",
    },
    {
      id: "data",
      title: "The data",
      question: "What it can reach",
      answer: "Shopify, analytics and the ad accounts, through your connectors",
      state: "quiet",
    },
    {
      id: "interface",
      title: "The interface",
      question: "Where you meet it",
      answer: "Claude, where the team already works",
      state: "quiet",
    },
    {
      id: "owner",
      title: "The owner",
      question: "Who answers for it",
      answer: "One owner per workstream, by role",
      state: "human",
    },
  ],
  work: {
    label: "The work",
    name: "X-Bionic's paid social",
    line: "Product education told many ways, tested and read back.",
    bar: {
      label: "Good looks like",
      line: "The product shown right, in its own voice, and a person who decides.",
    },
  },
  org: {
    label: "X-Bionic",
    name: "Creative and digital",
    os: { name: "Creative engine", line: "One plugin, every workstream" },
    workstreams: [
      { id: "voice", name: "Product voice + copy", lit: ["context", "evals"] },
      { id: "brief", name: "Brief + variants" },
      { id: "imagery", name: "Imagery + review" },
    ],
    socket: { label: "Enterprise", name: "X-Bionic's Claude Enterprise" },
  },
  tag: "You write this",
  alt: {
    work: "X-Bionic's paid social as one configuration: Claude in X-Bionic's own Enterprise organisation runs it; the product voice, the product facts and the brief are the context the team writes; the copy editor's and the product designer's checks are the evaluations; Shopify, analytics and the ad accounts are the data; the team meets it in Claude; one owner per workstream answers for it",
    org: "X-Bionic's creative and digital team as one frame: the model, the data and the interface shared along its top edge, the creative engine at the centre as one plugin, three workstreams (the product voice and copy, lit as the first, the brief and variants, and the imagery and review), and the context, the evaluations and the owner per workstream below, plugged into X-Bionic's Claude Enterprise",
  },
};
