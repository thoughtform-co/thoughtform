import type { ArcDef } from "../types";

import { LOOP_IN_PRACTICE, LOOP_PROOF_CARDS, LOOP_RETURN, VINCE_ABOUT } from "./shared/loopProof";
import { SAMAKO_AUTUMN_FILM, SAMAKO_PRODUCT_SHOTS } from "./shared/samakoWork";
import { SURI_ITERATIONS, UNDER_THE_GLASS } from "./shared/suriWork";

/**
 * X-Bionic, the proposal, as an arc (ADR-098; the Pandora cut of the format,
 * ADR-128, without the corridor).
 *
 * Written from the 8 October call with X-Bionic's digital lead. The ask is a
 * creative engine for paid social, whose job there is product education
 * (form, fit, function, materials across socks, base layers and trail
 * shoes), built inside the Claude Enterprise the company already runs and
 * owned by its team: a two-week phase one, then two days a quarter. The
 * company's AI champion and its investors read it for one thing above all,
 * WHAT PLUGS INTO CLAUDE ENTERPRISE, so the circuit beat says it plainly.
 *
 * ⚠ THE SPINE (owner, 2026-10-08): the hero on the house key visual, the
 * About, then the vision as ONE instrument (the configuration, its picker
 * tiles the four disciplines of creative technology, so "not just ads" is
 * drawn rather than listed), automation through adoption, Loop's four proof
 * cards landing on the layer the agents run on, what it returned, then that
 * layer at work since September on four real jobs under one switch, each
 * eyebrow naming its discipline. Then X-Bionic: the team today and
 * configured, the plugin, the engagement, who takes part, what we measure,
 * the day rate.
 *
 * ⚠ OTHER CLIENTS BY NAME, THEIR PEOPLE BY ROLE (owner, 2026-10-08): Samako
 * and Suri are named on their cases; no staff name, no quote from a
 * colleague, no fee. The cases are cut to two or three beats each, so the
 * page shows the work and how it was judged, not the recipe.
 *
 * ⚠ THE FEE IS THE DAY RATE AND THE SHAPE (owner, 2026-10-08, Pandora's
 * rule, ADR-133 U5): the rate, about ten days, two days a quarter. No total.
 */

const DAY_RATE = 1000;
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;

/** The case switch's group: every panel carries it, in this order. */
const CASE = "case";

export const X_BIONIC_PROPOSAL_ARC: ArcDef = {
  slug: "x-bionic-proposal",
  // The page lives at /arcs/x-bionic/proposal (ADR-142).
  leaf: "proposal",
  format: "proposal",
  client: "x-bionic",
  kind: "production",
  // A proposal is out until the client answers it (ADR-114).
  status: "proposed",
  // Filed the day of the call; the overview's monitor plots it (ADR-118).
  date: "2026-10-08",
  // Linear's rule for the head beats (ADR-128 U2): the head 128px under the
  // beat's top edge, the beat as tall as its content.
  rhythm: "flow",
  cardTitle: "X-Bionic · the proposal",
  cardLede:
    "A creative engine for paid social, built in X-Bionic's own Claude Enterprise and run by its team.",
  cardImage: { src: "/images/services/embedded.webp", alt: "" },
  hero: {
    eyebrow: "Proposal · X-Bionic · October 2026",
    title: { pre: "A creative engine,", em: "in your own Claude." },
    // One sentence, at most 120 characters: the homepage's measure (copyLaw.ts).
    lede: "Product education at the pace paid social asks for, built in X-Bionic's Claude Enterprise and run by your team.",
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
    actions: [
      { id: "read", label: "How I see it", href: "#vision", primary: true },
      { id: "plan", label: "Phase one", href: "#phases" },
    ],
  },
  meta: {
    title: "X-Bionic · proposal — Thoughtform",
    description:
      "A creative engine for paid social, built in X-Bionic's own Claude Enterprise and run by its team.",
  },
  sections: [
    /* ── Who ─────────────────────────────────────────────────────────────
       The homepage's About, first on this page (owner: "a hero section with
       the new key visuals and an About section"). */
    {
      ...VINCE_ABOUT,
      id: "about",
      menuLabel: "About",
      head: { ...VINCE_ABOUT.head, eyebrow: "Thoughtform · who I am" },
    },

    /* ── How I see it (ADR-153) ────────────────────────────────────────
       Rebuilt for a board (owner, 2026-10-08: "I don't know what people
       should be looking at"). One idea per beat: first where the leverage is
       (the layer only X-Bionic can write) and the four places it applies,
       then how it gets written (adoption) and what it frees (the time). */
    {
      id: "vision",
      kind: "leverage",
      menuLabel: "How I see it",
      menuPrimary: true,
      head: {
        eyebrow: "Thoughtform · how I see it",
        title: { pre: "How intelligence should", em: "take part in the work." },
        sub: "Every company can buy the same models. The difference is the layer your team writes down: how the work is done, and what good looks like.",
      },
      stack: [
        {
          id: "layer",
          label: "Your layer",
          line: "Skills and evals your team writes",
          chip: "Only yours",
          own: true,
        },
        {
          id: "claude",
          label: "Claude Enterprise",
          line: "Already running at X-Bionic",
          chip: "Already there",
        },
        {
          id: "models",
          label: "The models",
          line: "The same for every company",
          chip: "Everyone",
        },
      ],
      note: {
        label: "Where the leverage is",
        line: "The models keep improving for everyone. Your layer is what makes them work like X-Bionic.",
      },
      uses: {
        label: "One layer, four disciplines",
        items: [
          {
            id: "strategy",
            glyph: "brief",
            label: "Strategy",
            line: "Briefs with an audience, a reason and variants",
          },
          {
            id: "production",
            glyph: "frame",
            label: "Production",
            line: "Product imagery, motion and copy, at volume",
          },
          {
            id: "ops",
            glyph: "flow",
            label: "Ops",
            line: "Every ad briefed, named and filed before launch",
          },
          {
            id: "review",
            glyph: "check",
            label: "Review",
            line: "Checked against the real product first",
          },
        ],
      },
    },
    {
      id: "adoption",
      kind: "handoff",
      menuLabel: "The approach",
      head: {
        eyebrow: "Thoughtform · the approach",
        title: { pre: "Automation runs", em: "through adoption." },
        sub: "Claude can only run what your team has written down. So the team learns first, and the time it gets back goes to the ideas.",
      },
      steps: [
        {
          id: "adopt",
          label: "Adopt",
          title: "Your team learns on its own work",
          who: "Your team",
        },
        {
          id: "encode",
          label: "Write it down",
          title: "How the work is done, and what good looks like",
          who: "Your team, with me",
          lit: true,
        },
        {
          id: "automate",
          label: "Automate",
          title: "Claude runs it, and asks when unsure",
          who: "Claude, checked by your team",
        },
      ],
      time: {
        label: "Where your team's time goes",
        note: "Illustrative",
        rows: [
          {
            label: "Today",
            segments: [
              { label: "Making and resizing", share: 0.55 },
              { label: "Admin", share: 0.25 },
              { label: "Ideas", share: 0.2, lit: true },
            ],
          },
          {
            label: "Configured",
            segments: [
              { label: "Checking", share: 0.2 },
              { label: "Ideas, briefs and campaigns", share: 0.8, lit: true },
            ],
          },
        ],
      },
    },

    /* ── Part one · Loop ─────────────────────────────────────────────────
       Loop's four cards, by reference, in the pile's order: the last one is
       the layer the agents run on, which the next part picks up. */
    LOOP_IN_PRACTICE,
    ...LOOP_PROOF_CARDS,
    LOOP_RETURN,

    /* ── Part two · the layer, at work ───────────────────────────────────
       Four jobs since September under one switch, each eyebrow naming the
       discipline it shows, so the vision's four tiles come back as proof. */
    {
      id: "the-layer",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "The layer, at work",
      menuPrimary: true,
      eyebrow: "Part two · the layer, at work",
      line: { pre: "The layer agents run on is now", em: "what I set up for other brands." },
      subline:
        "Since September, inside two brands' own Claude: four real jobs across strategy, production and review. Switch between them on the bar.",
    },
    {
      id: "case-shots",
      kind: "breakdown",
      worked: { group: CASE, id: "shots", label: "Samako · Shots" },
      breakdown: SAMAKO_PRODUCT_SHOTS,
    },
    {
      id: "case-film",
      kind: "breakdown",
      worked: { group: CASE, id: "film", label: "Samako · Film" },
      breakdown: SAMAKO_AUTUMN_FILM,
    },
    {
      id: "case-teaser",
      kind: "breakdown",
      worked: { group: CASE, id: "teaser", label: "Suri · Teaser" },
      breakdown: {
        ...UNDER_THE_GLASS,
        eyebrow: "Production · Suri · Black Friday teaser · 6 Oct 2026",
        beats: UNDER_THE_GLASS.beats.filter((b) =>
          ["utg-idea", "utg-clean", "utg-check"].includes(b.id)
        ),
      },
    },
    {
      id: "case-review",
      kind: "breakdown",
      worked: { group: CASE, id: "review", label: "Suri · Review" },
      breakdown: SURI_ITERATIONS,
    },

    /* ── Part three · X-Bionic ───────────────────────────────────────────*/
    {
      id: "turn",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "Part three · X-Bionic",
      line: { pre: "The product is the hero.", em: "Now make it teachable at volume." },
      subline:
        "Form, fit, function and materials are already X-Bionic's. Paid social needs them told many ways, tested, and read back. That is what the setup is for.",
    },
    {
      /* THE LEDGER STATES THE SETUP, NEVER A GAP (Pandora's rule, owner
         2026-09-28): what the call described, without a column of
         shortcomings. The copywriter leaving lives in the phases. */
      id: "today",
      kind: "board",
      menuLabel: "X-Bionic today",
      head: {
        eyebrow: "X-Bionic · where the team stands",
        title: { pre: "The team today, and", em: "configured." },
        sub: "Left, the creative and digital work as it runs today. Right, the same team once its AI work has an owner and its knowledge is written down, inside the Claude it already runs.",
      },
      states: [
        {
          mode: "today",
          label: "As it runs today",
          alt: "X-Bionic's creative and digital work as it runs today, written out as a ledger: the creative lead owns it, the work is made in-house campaign by campaign, the product voice is held by the copywriter, the tools are Claude, Shopify and analytics, and it scales within the digital team.",
          seat: { q: "Who owns it", a: "The creative lead" },
          card: { name: "The work", work: "in-house, campaign by campaign" },
          layer: { label: "The context", sub: "held by the copywriter", rows: [] },
          tools: {
            label: "The tools",
            items: [
              { id: "claude", name: "Claude" },
              { id: "shopify", name: "Shopify" },
              { id: "analytics", name: "Analytics" },
            ],
          },
          reach: { label: "Where it scales", value: "within the digital team" },
        },
        {
          mode: "configured",
          label: "With a configuration",
          alt: "The same team once its AI work is set up: the paid social lead owns it, with the AI champion behind the setup, a creative engine the team owns runs at the centre inside Claude Enterprise, it reads the voice, the briefs, the checks and the data the team keeps, it runs inside Claude, Shopify and analytics, and it scales into Meta and TikTok.",
          seat: { q: "Who owns it", a: "The paid social lead" },
          card: { name: "Creative AI", work: "owned by the team" },
          layer: {
            label: "The context",
            rows: [
              { id: "voice", tag: "Voice" },
              { id: "briefs", tag: "Briefs" },
              { id: "checks", tag: "Checks" },
              { id: "data", tag: "Data" },
            ],
          },
          tools: {
            label: "Where it runs",
            items: [
              { id: "claude", name: "Claude" },
              { id: "shopify", name: "Shopify" },
              { id: "analytics", name: "Analytics" },
            ],
          },
          reach: { label: "Where it scales", value: "into Meta and TikTok" },
        },
      ],
    },
    {
      /* WHAT PLUGS INTO CLAUDE ENTERPRISE (Ganesh on the call: "anything
         that you say that links into our Claude enterprise, the investors
         will be like, perfect"). The circuit's own drawing: six configs, one
         centre, a socket for what is already there. */
      id: "engine",
      kind: "circuit",
      menuLabel: "What plugs in",
      head: {
        eyebrow: "X-Bionic · what plugs into Claude Enterprise",
        title: { pre: "One plugin,", em: "in the Claude you run." },
        sub: "Each workflow becomes a skill its owner keeps, installed as one plugin in X-Bionic's Claude organisation and kept in your own repository. It reads through the connectors you already have.",
      },
      configs: [
        { id: "voice", name: "Product voice", line: "the copy editor's" },
        { id: "brief", name: "Briefs", line: "the paid social lead's" },
        { id: "copy", name: "Ad copy", line: "the copy editor's" },
        { id: "imagery", name: "Imagery", line: "the creative lead's" },
        { id: "review", name: "Pre-review", line: "the designer's" },
        { id: "intake", name: "Intake", line: "the digital team's" },
      ],
      os: {
        key: "X-Bionic's",
        name: "Creative engine",
        line: "a plugin in Claude Enterprise",
      },
      socket: { key: "Already there", name: "The AI champion's enterprise setup" },
      alt: "X-Bionic's creative engine as a map: six workflows, each a skill with an owner. The product voice and the ad copy, kept by the copy editor; the briefs, by the paid social lead; the imagery, by the creative lead; the pre-review, by the product designer; the intake and naming, by the digital team. Every one is wired to the creative engine at the centre, a plugin in Claude Enterprise, which plugs into the enterprise setup the AI champion already runs.",
    },
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "The engagement",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "X-Bionic · the engagement",
        title: { pre: "Two weeks,", em: "then a rhythm." },
        sub: "Phase one sets the engine up and runs it once on real work. After that I come back every quarter, so the team keeps pace with what changes.",
      },
      groups: [
        {
          id: "w1",
          label: "Phase one · week one",
          blurb: "On site",
          items: [
            {
              id: "w1-map",
              tag: "Day one",
              name: "How the work really runs",
              body: "With the creative lead, the digital team and the AI champion: the briefs, the ads, the tools and the data.",
            },
            {
              id: "w1-voice",
              tag: "The voice",
              name: "The product voice, written down first",
              body: "From the copywriter's own work, before they leave, so the voice stays when they go.",
            },
            {
              id: "w1-brief",
              tag: "The brief",
              name: "From campaign to platform",
              body: "A campaign idea becomes briefs, audiences and variants a paid social lead can run.",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "The voice skill writes copy the copy editor keeps",
              "A brief goes from idea to variants in Claude",
            ],
          },
        },
        {
          id: "w2",
          label: "Phase one · week two",
          blurb: "Remote",
          items: [
            {
              id: "w2-run",
              tag: "One full run",
              name: "One iteration, end to end",
              body: "Brief, copy, imagery, pre-review, naming and launch, run by your team on a real product.",
            },
            {
              id: "w2-review",
              tag: "Review",
              name: "The product designer's eye, as checks",
              body: "Proportions, colour and materials: what only they can judge, written down so Claude reads it first.",
            },
            {
              id: "w2-handover",
              tag: "Handover",
              name: "In your Claude, in your repository",
              body: "The plugin installed with the AI champion, every skill with a named owner.",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "The team runs a second iteration without me",
              "Each skill has an owner who can change it",
            ],
          },
        },
        {
          id: "quarterly",
          label: "Then · every quarter",
          blurb: "Two days",
          items: [
            {
              id: "q-outside",
              tag: "Inspiration",
              name: "What changed out there",
              body: "New models, new formats, and what other growth brands are learning.",
            },
            {
              id: "q-upkeep",
              tag: "Upkeep",
              name: "The skills, brought up to date",
              body: "What the team learned, written back in; what broke, fixed.",
            },
            {
              id: "q-next",
              tag: "Next",
              name: "The next workflows",
              body: "Creators, TikTok, the next product pillar: whichever the numbers ask for.",
            },
          ],
          foot: {
            label: "Alongside",
            lines: [
              "Introductions to paid social and creative strategy freelancers",
              "Token budgets and return on ad cost creation, for leadership",
            ],
          },
        },
      ],
    },
    {
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "Who takes part",
      layout: "columns",
      head: {
        eyebrow: "X-Bionic · how we work",
        title: { pre: "Who", em: "takes part." },
        sub: "One week on site, one remote, then two days a quarter. In between, the team's own channels, never extra meetings.",
      },
      groups: [
        {
          id: "x-bionic",
          label: "From X-Bionic",
          blurb: "What phase one asks of each.",
          items: [
            {
              id: "sponsor",
              tag: "X-Bionic",
              name: "The digital lead, who owns the result",
              body: "Sets the goal, decides what runs, and reads what phase one produced.",
              meta: "The kickoff, and the end of each week",
            },
            {
              id: "champion",
              tag: "X-Bionic",
              name: "The AI champion, who keeps it running",
              body: "Installs the plugin in the enterprise setup and keeps it there after phase one.",
              meta: "Day one, and the handover",
            },
            {
              id: "process",
              tag: "X-Bionic",
              name: "The business process lead",
              body: "Where the engine meets the rest of the company's way of working.",
              meta: "Day one, and the handover",
            },
            {
              id: "creative",
              tag: "X-Bionic",
              name: "The creative lead, the last gate",
              body: "Decides what good looks like for the imagery and the campaigns, and what goes live.",
              meta: "Two sessions in week one",
            },
            {
              id: "paid-social",
              tag: "X-Bionic",
              name: "The paid social lead, who runs it",
              body: "Freelance, still to be found; I can make introductions. Runs the engine day to day once phase one ends.",
              meta: "From phase one, if in place",
            },
            {
              id: "copywriter",
              tag: "X-Bionic",
              name: "The copywriter, before they leave",
              body: "Two hours on the voice: what they always write, and what they never would.",
              meta: "Week one",
            },
          ],
        },
        {
          id: "thoughtform",
          label: "From Thoughtform",
          blurb: "On site, then beside the team.",
          items: [
            {
              id: "vince",
              tag: "Thoughtform",
              name: "Vince, on AI and creative technology",
              body: "On site for week one, remote for week two, then two days a quarter. Writes the skills with the team, then steps back.",
              meta: "About ten days in phase one",
            },
          ],
          sub: {
            label: "What I need",
            blurb: "Before week one.",
            items: [
              {
                id: "claude",
                tag: "Week one",
                name: "Access to Claude",
                body: "A seat in X-Bionic's Claude Enterprise, set up with the AI champion.",
              },
              {
                id: "work",
                tag: "Week one",
                name: "Access to the work",
                body: "Recent ads and their results, the product facts, and the copywriter's best work.",
              },
            ],
          },
        },
      ],
    },
    {
      /* THE DAY RATE (owner, 2026-10-08): the rate and the days, no total. */
      id: "pricing",
      kind: "cards",
      menuLabel: "Pricing",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "X-Bionic · the fee",
        title: { pre: "The", em: "day rate." },
        sub: "One rate for every day on the work, on site or remote.",
      },
      cards: [
        {
          id: "rate",
          kicker: "Rate",
          title: `${eur(DAY_RATE)} a day`,
          body: "The same rate on site or remote.",
        },
        {
          id: "phase-one",
          kicker: "Phase one",
          title: "About ten days",
          body: "Week one on site, week two remote.",
        },
        {
          id: "retainer",
          kicker: "Then",
          title: "Two days a quarter",
          body: "Booked a quarter ahead, at the same rate.",
        },
        {
          id: "invoicing",
          kicker: "Invoicing",
          title: "On the days worked",
          body: "At the end of phase one, then after each visit.",
        },
      ],
      footnote:
        "Travel at cost. Model usage runs on X-Bionic's own Claude Enterprise. Everything built belongs to X-Bionic, including if you stop after phase one.",
    },
    {
      /* THE BUSINESS CASE, PROMISED AS COUNTING (Pandora's rule): no figure
         is forecast; four numbers read from X-Bionic's own systems. ROAC is
         the owner's measure from Loop, named on the call. */
      id: "measures",
      kind: "cards",
      menuLabel: "What we measure",
      columns: 4,
      head: {
        eyebrow: "X-Bionic · the business case",
        title: { pre: "What we", em: "measure." },
        sub: "Read from your own ad accounts and your own Claude, from the first iteration on, beside the shift of media from search to paid social.",
      },
      cards: [
        {
          id: "roac",
          kicker: "ROAC",
          title: "Return on ad cost creation",
          body: "What each ad cost to make, in tokens and hours, beside what it returned.",
        },
        {
          id: "variety",
          kicker: "Variety",
          title: "Distinct ads in market a week",
          body: "Different ideas, not resized copies: what Meta needs to find new audiences.",
        },
        {
          id: "speed",
          kicker: "Speed",
          title: "From brief to live",
          body: "How long an idea waits before it runs.",
        },
        {
          id: "tokens",
          kicker: "Tokens",
          title: "Token spend, by workflow",
          body: "So leadership sees where the Claude budget goes, and what it buys.",
        },
      ],
    },
    {
      id: "close",
      kind: "close",
      head: {
        eyebrow: "X-Bionic",
        title: { pre: "Talk it", em: "through." },
        sub: "Questions on any of it, or dates for week one.",
      },
      actions: [
        {
          id: "vince",
          label: "Vince Buyssens",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Proposal for X-Bionic · October 2026.",
      signature: "Prepared for Ganesh, X-Bionic.",
    },
  ],
};
