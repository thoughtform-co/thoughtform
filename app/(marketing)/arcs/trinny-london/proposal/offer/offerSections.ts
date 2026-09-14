import type { ArcSection } from "@/lib/arcs/types";

/**
 * The offer — the proposal's beats after the configuration, on the pitch
 * page (ADR-094 U9).
 *
 * `#proposition` is where the proposal STARTS (owner, 2026-09-13); what the
 * deck says next — the phases, the loop, what it needs and leaves, the fee,
 * the people, the next steps, the appendix — follows here, rendered by the
 * arcs' own components over this record, so the Suri proposal and this page
 * draw the same beats from one renderer and a fix on either lands on both.
 *
 * ⚠ PLACEHOLDER COPY, BY THE OWNER'S OWN INSTRUCTION. This is the Suri
 * proposal's content (`lib/arcs/content/suri-proposal.ts`, v25 of the deck)
 * with the client's nouns swapped — Suri → Trinny London, and Suri's people
 * → the roles the configuration above already names (the founder, the
 * studio lead, creative ops). "I know it's Suri, not Trinny, but it's
 * basically the same approach. I can change the contents later, but in
 * terms of the offering, this PowerPoint is the latest version." Rewrite
 * the strings; keep the shapes.
 *
 * ⚠ THE SAME COPY LAW AS A PROPOSAL ARC, AND ITS OWN GUARD: this module is
 * outside `ARCS`, so `arcs-registry` never sees it —
 * `tests/lib/trinny-offer.test.ts` walks it with `PROPOSAL_COPY_BANS` and
 * fails on any Suri noun that survived the swap.
 *
 * Type-only import: the arcs' section union, nothing at runtime.
 */
/**
 * The configuration — the beat `#proposition` mounts (ADR-099), drawn as
 * THE BOARD since ADR-100.
 *
 * It was the arcs' `configuration` kind — the old Aether headless panel:
 * the layer left, two arrows across a seam, three team tiles over a
 * five-question readout, all on one framed plate. The owner's read: "it
 * doesn't look bad, but it's a lot of things to look at", and the beat is
 * really the PROBLEM STATEMENT. So the record is the discovery call now, in
 * TWO STATES the drawing sets side by side: the studio as it runs today
 * (dormant — no owner seated, everything by hand, nothing written down,
 * the tools unwired) and the same studio with a configuration seated (lit
 * — the proof's own R4 board, expanded to page scale).
 *
 * ⚠ THE `today` COPY IS THE CALL'S OWN WORDS, in roles, never names: "no
 * single ownership to make it happen", "a Friday afternoon job", "all of
 * our creative studios are 100% in-house … not using AI in a way that we
 * could", "we've kind of lost momentum".
 *
 * ⚠ ONE RECORD, FIVE FACTS, TWO DRAWINGS (U2, owner 2026-09-14; the fifth
 * is U4's). Both states answer the same five questions — who owns it, the
 * context, the work, the tools, where it scales — and the DRAWING is what
 * differs: a ledger on the left, the assembled board on the right. So the
 * copy is written as five pairs, not as two compositions.
 *
 * ⚠ WHERE IT SCALES IS THE ANSWER TO THE WHOLE BEAT (U4, owner: the
 * capability "can be scaled and plugged into other parts of the business,
 * because that's the entire thing"). Today the work stops at the studio;
 * configured it goes out. It is the one pair that states the consequence
 * rather than the setup, which is why it sits at the FLOOR of both
 * drawings — last read on the ledger, last node on the board. ⚠ **THE RIGHT SIDE'S HEART IS THE CAPABILITY
 * ITSELF**, not a workstream with a Skill in it: they want it in-house, so
 * the lit card is `AI capability` / "owned by the team" and everything else
 * on that board is what it sits on.
 *
 * ⚠ NO DIGIT ON EITHER BOARD, no bracket, no em dash. ⚠ THE BEAT KEEPS ITS
 * ID: `seatOf("configuration")` is what the datum guard measures and
 * `#configuration` is the page's own anchor.
 */
export const TRINNY_BOARD: ArcSection = {
  id: "configuration",
  kind: "board",
  head: {
    eyebrow: "Trinny London · where the studio stands",
    title: { pre: "The studio today, and", em: "configured." },
    sub: "The teams are trained on Claude, but nobody owns AI as their day job and the studio still works by hand. Left, the studio as it runs today. Right, the same studio with its configuration seated.",
  },
  states: [
    {
      mode: "today",
      label: "As it runs today",
      alt: "Trinny London's creative work as it runs today, written out as a ledger: no owner seated, nothing of the brand written down, the studio working by hand, four tools nothing connects, and nothing that reaches past the studio.",
      seat: { q: "Who owns it", a: "No one, as their day job" },
      card: { name: "The work", work: "all by hand" },
      layer: { label: "The context", sub: "not written down", rows: [] },
      tools: {
        label: "The tools",
        items: [
          { id: "claude", name: "Claude" },
          { id: "figma", name: "Figma" },
          { id: "monday", name: "Monday" },
          { id: "slack", name: "Slack" },
        ],
      },
      reach: { label: "Where it scales", value: "not past the studio" },
    },
    {
      mode: "configured",
      label: "With a configuration",
      alt: "The same studio with its configuration seated: the studio lead owns it with the founder's sign-off, an AI capability the team owns runs at the centre, it reads the context they keep, it runs inside the tools they already use, and it scales into the rest of the business.",
      seat: { q: "Who owns it", a: "The studio lead, with the founder's sign-off." },
      card: { name: "AI capability", work: "owned by the team" },
      layer: {
        label: "The context",
        rows: [
          { id: "rules", tag: "Rules" },
          { id: "examples", tag: "Examples" },
          { id: "sources", tag: "Sources" },
          { id: "loops", tag: "Loops" },
        ],
      },
      tools: {
        label: "Where it runs",
        items: [
          { id: "claude", name: "Claude" },
          { id: "figma", name: "Figma" },
          { id: "monday", name: "Monday" },
          { id: "slack", name: "Slack" },
        ],
      },
      reach: { label: "Where it scales", value: "into the rest of the business" },
    },
  ],
};

export const TRINNY_OFFER_SECTIONS: readonly ArcSection[] = [
  {
    id: "phases",
    kind: "list-groups",
    layout: "plates",
    head: {
      eyebrow: "Trinny London · the shape of the work",
      title: { pre: "We propose a modular approach", em: "that compounds." },
      sub: "The process from briefing to final delivery has many moving parts, so the work is built in modules: Trinny London's team can take the low-hanging fruit first, or run them in parallel.",
    },
    groups: [
      {
        id: "m1",
        label: "M1 · about three weeks",
        blurb: "Setup, insight and briefing",
        items: [
          {
            id: "m1w1",
            tag: "Week 1 · on site",
            name: "Kickoff with the team",
            body: "The setup configured with the designers, on Trinny London's creative stack: Figma, Claude, GitHub",
          },
          {
            id: "m1w2",
            tag: "Week 2",
            name: "Workstreams mapped out and made AI-ready",
            body: "Creative strategy, tone of voice and brand guidelines encoded into the creative intelligence configuration",
          },
          {
            id: "m1w3",
            tag: "Week 3",
            name: "A new AI-first workstream the team runs without us",
            body: "An intelligence layer that plugs into M2",
          },
        ],
        foot: {
          label: "Deliverable",
          lines: ["The creative intelligence configuration", "A team that runs M1 on its own"],
        },
      },
      {
        id: "m2",
        label: "M2 · about three weeks",
        blurb: "Asset generation and design",
        items: [
          {
            id: "m2w1",
            tag: "Week 1",
            name: "Visual and semantic analysis of creatives",
            body: "Encoding sprint: creative and art direction, visual and copy guidelines codified into the system",
          },
          {
            id: "m2w2",
            tag: "Week 2",
            name: "Generation sprint: the image and video flow tested and improved in real time by the creative team",
            body: "Prompt and model best practice encoded into the broader system",
          },
          {
            id: "m2w3",
            tag: "Week 3",
            name: "Encoding sprint on ad design best practice",
            body: "Design sprint: ad generation tested inside Figma",
          },
        ],
        foot: {
          label: "Deliverable",
          lines: [
            "Compounding layers for asset generation and ad creation",
            "A team that manages M1 and M2 on its own",
          ],
        },
      },
      {
        id: "m3",
        label: "M3 · about three weeks",
        blurb: "Creative operations and scaling",
        items: [
          {
            id: "m3w1",
            tag: "Week 1",
            name: "All layers unified in one production-ready workflow",
            body: "Debrief and next steps with the founder and the studio lead",
          },
          {
            id: "m3w2",
            tag: "Week 2",
            name: "Tech transfer of best practice to creative ops",
            body: "Automation sprint for project managers",
          },
          {
            id: "m3w3",
            tag: "Week 3",
            name: "Handover workshop",
            body: "Final review with the founder and the studio lead",
          },
        ],
        foot: {
          label: "Deliverable",
          lines: [
            "A working setup: brief in, asset out, creative ops unburdened",
            "A blueprint for scaling beyond the creative departments",
          ],
        },
      },
    ],
  },
  {
    /* THE FLOW (ADR-099, owner 2026-09-13): "a new section where we
       visualize the flow, sort of like a diagram — on the left side a
       briefing template… it flows into the center where we see some product
       renders… and then the third phase is the scaling, where these assets
       get localized."

       ⚠ THE BRIEF'S FIELDS ARE A REAL TEMPLATE'S, not an invention. They are
       the eight a working creative team fills on every page — the set mined
       from 340 briefs and 153 briefing docs of one brand, which is the
       practice's own record of what a brief IS
       (`paid-social-praxis/references/briefing-grammar.md`). The owner
       pointed at a client's Figma template for this; that file is not
       readable from here, and the mined set is the same eight labels a
       reader of either would recognise. If the Figma is opened later, the
       fields are one array to correct.

       ⚠ THE RENDERS ARE THE CLIENT'S OWN PRODUCTS, the same four cutouts the
       turn sweeps in two stations up — already on the page, already paid
       for, and alpha-cut against any ground. The Drive also holds eight
       GENERATED packshots from this engagement's own calibration wave; they
       are the honest illustration of what the setup makes and are the first
       thing to try if this plate should show output rather than input. */
    id: "flow",
    kind: "flow",
    head: {
      eyebrow: "Trinny London · the pipeline",
      title: { pre: "From one brief to", em: "every market." },
      sub: "The brief goes in as the team already writes it. The setup makes the imagery, the studio grades it, and what passes is localised for every market it ships to.",
    },
    brief: {
      label: "The brief",
      fields: ["Idea", "Why", "Audience", "Formats", "Variants", "Visual", "Copy", "Product"],
    },
    renders: {
      label: "What it makes",
      images: [
        { src: "/trinny-london/naked-ambition.webp", alt: "" },
        { src: "/trinny-london/be-your-best.webp", alt: "" },
        { src: "/trinny-london/overnight-sensation.webp", alt: "" },
      ],
    },
    scale: {
      label: "Every market",
      markets: ["UK", "DE", "FR", "NL"],
    },
    steps: ["Generate", "Localise"],
  },
  {
    id: "how-we-work",
    kind: "list-groups",
    layout: "columns",
    head: {
      eyebrow: "Trinny London · inside every phase",
      title: { pre: "How we work together,", em: "inside every phase." },
      sub: "One loop, run with Trinny London's team. We set it up in week one, then run it beside them until they are running it without us.",
    },
    groups: [
      {
        id: "loop",
        label: "The loop, on one workstream",
        blurb: "The imagery workstream, M1. Composition and briefing follow on the same loop.",
        items: [
          {
            id: "owns",
            tag: "Who owns it",
            name: "The studio lead, and the designers",
            body: "The studio lead decides what passes. The designers run the rounds themselves.",
          },
          {
            id: "runs",
            tag: "What runs it",
            name: "Trinny London's Skills, in Claude",
            body: "Brand, tone of voice and the review rules as files, on Trinny London's own keys. The imagery Skill first.",
          },
          {
            id: "bar",
            tag: "The bar",
            name: "The studio lead's rubric, in their words",
            body: "Every frame is graded against it before they open the sheet. What they say twice becomes a check.",
          },
          {
            id: "where",
            tag: "Where it runs",
            name: "Figma and the image models",
            body: "Claude connected to Figma, to the image models, and to Trinny London's product facts.",
          },
        ],
      },
      {
        id: "people",
        label: "In the loop, and how much",
        blurb: "Who is in the room, and what it costs them in time.",
        items: [
          {
            id: "lead",
            tag: "Trinny London",
            name: "The studio lead, the last gate",
            body: "Writes the review rules in their words in week one, then grades every wave.",
            meta: "Two half-days a week",
          },
          {
            id: "designers",
            tag: "Trinny London",
            name: "The designers, who make the work",
            body: "In every session from day one. From week two they run the rounds themselves.",
            meta: "Two sessions a week, then their normal week",
          },
          {
            id: "founder",
            tag: "Trinny London",
            name: "The founder, on ambition, volume and channels",
            body: "The kickoff interviews and one review at the end of each phase.",
            meta: "One session a phase",
          },
          {
            id: "vince",
            tag: "Thoughtform",
            name: "Vince, on AI and creative technology",
            body: "On site for week one, then encoding what the studio lead sends back. By the third phase, watching.",
            meta: "Week one full time, then two sessions a week",
          },
          {
            id: "rob",
            tag: "Thoughtform",
            name: "Rob, on strategic marketing and culture",
            body: "The sessions with the founder on structure and how the team changes as the work does.",
            meta: "With the founder, each phase",
          },
        ],
      },
    ],
  },
  {
    id: "needs-keeps",
    kind: "list-groups",
    layout: "columns",
    head: {
      eyebrow: "Trinny London · the terms of the work",
      title: { pre: "What we need, and", em: "what you keep." },
      sub: "Three dependencies. Six things that stay behind when we stop showing up.",
    },
    groups: [
      {
        id: "needs",
        label: "What this needs from Trinny London",
        items: [
          {
            id: "brand",
            tag: "01",
            name: "Brand definition",
            body: "Works best where identity, tone of voice and guidelines exist. Where they do not, defining them becomes part of M1 and affects pace.",
          },
          {
            id: "access",
            tag: "02",
            name: "Access",
            body: "Figma, plus the accounts and API access for image generation. Opened in Trinny London's name so nothing needs migrating later.",
          },
          {
            id: "time",
            tag: "03",
            name: "Stakeholder time",
            body: "The founder and the studio lead for interviews and sign-off. The studio lead's review time is what the rubric learns from, so it is not optional.",
          },
        ],
      },
      {
        id: "keeps",
        label: "What Trinny London has at the end",
        items: [
          {
            id: "setup",
            tag: "Keeps",
            name: "The configuration",
            body: "Claude, Figma and image generation in Trinny London's environment, on Trinny London's keys.",
          },
          {
            id: "skills",
            tag: "Keeps",
            name: "Claude Skills",
            body: "Brand, tone of voice, design standards and the review rules.",
          },
          {
            id: "workflow",
            tag: "Keeps",
            name: "A tested workflow",
            body: "Best practice and red flags earned through graded waves, not assumed.",
          },
          {
            id: "assets",
            tag: "Keeps",
            name: "Assets at volume",
            body: "On-brand and ready for paid social. Composition still takes human oversight.",
          },
          {
            id: "team",
            tag: "Keeps",
            name: "A team that runs it",
            body: "Half a day on a real production run, then check-ins at one and three months.",
          },
          {
            id: "nodep",
            tag: "Keeps",
            name: "No dependency",
            body: "No platform to license, no retainer, nothing that breaks if we stop answering.",
          },
        ],
      },
    ],
  },
  {
    id: "pricing",
    kind: "cards",
    columns: 4,
    ledger: { columns: ["Phase", "What", "Fee"] },
    head: {
      eyebrow: "Trinny London · the fee",
      title: { pre: "Priced", em: "one phase at a time." },
      sub: "Each phase is a stage gate, priced on its own, so nothing beyond it is committed until it has earned the next.",
    },
    cards: [
      { id: "fee-m1", kicker: "M1", title: "£10,000", body: "Setup, insight and briefing" },
      { id: "fee-m2", kicker: "M2", title: "+£15,000", body: "Image, video and composition" },
      { id: "fee-m3", kicker: "M3", title: "+£20,000", body: "Creative operations and scaling" },
      {
        id: "fee-total",
        kicker: "Total",
        title: "£45,000",
        body: "If all three phases are commissioned",
      },
    ],
    tips: [
      {
        id: "separate",
        tag: "Commitment",
        body: "Each phase is a separate decision, and nothing beyond M1 is committed upfront. If M1 shows that video or localisation is the nearer-term need, we say so before pricing anything else.",
      },
      {
        id: "expenses",
        tag: "Expenses",
        body: "Travel at cost. Model and API usage billed to Trinny London directly by the providers, typically low hundreds per month at this volume.",
      },
      {
        id: "owns",
        tag: "Ownership",
        body: "Trinny London owns its configured setup, its Skills and its outputs outright. The underlying method is not exclusive to Trinny London.",
      },
    ],
    footnote:
      "M1 stands on its own. If Trinny London stops after it, the team still has a working imagery setup and the Skills behind it.",
  },
  {
    id: "people",
    kind: "cards",
    columns: 2,
    head: {
      eyebrow: "Thoughtform · who shows up",
      title: { pre: "Two people, both of whom", em: "did this at Loop." },
      sub: "One built the capability inside the creative team. The other ran the organisation it had to work for.",
    },
    cards: [
      {
        id: "vince",
        kicker: "AI and creative technology",
        title: "Vince Buyssens",
        body: "Built Loop's AI capability inside its creative team over three years, and now leads its company-wide AI transformation. Runs the workshops, the encoding and the graded waves.",
      },
      {
        id: "rob",
        kicker: "Commercial and organisation",
        title: "Rob Weston",
        body: "Ran the Commercial and Marketing teams at Loop and sat on the executive team that decided, in 2024, to make Loop AI-first. Focuses on organisation, process, governance and the senior stakeholder relationships.",
      },
    ],
  },
  {
    id: "next-steps",
    kind: "cards",
    columns: 3,
    head: {
      eyebrow: "Trinny London · from here",
      title: { pre: "Next", em: "steps." },
      sub: "Three of them, and the first is a date in a diary.",
    },
    cards: [
      {
        id: "onsite",
        n: "01",
        title: "Confirm the on-site week",
        body: "Five days in London. We work around the studio lead's availability first.",
      },
      {
        id: "prep",
        n: "02",
        title: "Short prep calls",
        body: "An hour each with the founder and the studio lead, so week one starts with the questions already asked.",
      },
      {
        id: "kickoff",
        n: "03",
        title: "Kick off M1",
        body: "The setup in on day one. First graded imagery wave by the end of week two.",
      },
    ],
  },
  {
    id: "appendix",
    kind: "list-groups",
    layout: "columns",
    head: {
      eyebrow: "Appendix",
      title: { pre: "Why not just subscribe to", em: "Higgsfield?" },
      sub: "Because the same models sit behind both. A subscription rents your team a front end to them. This puts them inside the tools the team already uses, on Trinny London's own keys, learning from Trinny London's own work.",
    },
    groups: [
      {
        id: "subscription",
        label: "A generation tool on subscription",
        blurb: "What a seat buys, and where it leaves the work.",
        items: [
          {
            id: "s-pay",
            tag: "What you pay for",
            name: "A seat per person, per month, for as long as you use it",
          },
          {
            id: "s-where",
            tag: "Where the work happens",
            name: "In their app. The prompt is written somewhere else and pasted in",
          },
          {
            id: "s-keys",
            tag: "Who holds the keys",
            name: "They do. History and settings live in their account",
          },
          {
            id: "s-models",
            tag: "Which models",
            name: "The frontier models, behind their front end",
          },
          {
            id: "s-new",
            tag: "When a better model ships",
            name: "When they add it",
          },
          {
            id: "s-better",
            tag: "How it gets better",
            name: "A prompt enhancer of its own, kept apart from the Claude your team talks to",
          },
        ],
      },
      {
        id: "own",
        label: "Your own configuration",
        blurb: "Claude, on Trinny London's keys, inside the tools the team already has open.",
        items: [
          {
            id: "o-pay",
            tag: "What you pay for",
            name: "The setup and the adoption, once. Model usage at cost. No seats",
          },
          {
            id: "o-where",
            tag: "Where the work happens",
            name: "Inside Claude and Figma, where the team already works",
          },
          {
            id: "o-keys",
            tag: "Who holds the keys",
            name: "Trinny London does. Files, accounts and outputs stay Trinny London's",
          },
          {
            id: "o-models",
            tag: "Which models",
            name: "The same frontier models, called directly, with Claude running them",
          },
          {
            id: "o-new",
            tag: "When a better model ships",
            name: "The setup takes it. A new key, not a new tool",
          },
          {
            id: "o-better",
            tag: "How it gets better",
            name: "The Claude your team already uses, with its memory of your work and your written rules",
          },
        ],
      },
    ],
    closing:
      "A subscription tool is a good tool, and it stays available: connect it and the team's own setup gets smarter either way. The question is where Trinny London's judgment ends up, in a vendor's account or written down in Trinny London's own setup, where the next team inherits it.",
  },
];
