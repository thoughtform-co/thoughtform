import type { ArcDef } from "../types";

import { LOOP_IN_PRACTICE, LOOP_PROOF_CARDS, LOOP_RETURN, VINCE_ABOUT } from "./shared/loopProof";
import { SAMAKO_AUTUMN_FILM, SAMAKO_PRODUCT_SHOTS } from "./shared/samakoWork";
import { SURI_ITERATIONS, UNDER_THE_GLASS } from "./shared/suriWork";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";

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
  // The fill rhythm (ADR-128 U3): the head 128px under the beat's top edge,
  // as Linear's, and the beat one screen, its figure taking the rest.
  rhythm: "fill",
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
      console: { name: "Intelligence configuration", status: "X-Bionic" },
      readout: [
        { label: "Models", value: "Shared" },
        { label: "Claude", value: "Installed" },
        { label: "Layer", value: "Owned" },
      ],
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
          when: "Week 1",
          label: "Adopt",
          title: "Your team learns on its own work",
          who: "Your team",
        },
        {
          id: "encode",
          when: "Weeks 1–2",
          label: "Write it down",
          title: "How the work is done, and what good looks like",
          who: "Your team, with me",
          lit: true,
        },
        {
          id: "automate",
          when: "From week 2",
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
    {
      ...LOOP_IN_PRACTICE,
      variant: "chapter",
      chapter: { n: 1, of: 3 },
      eyebrow: "Loop, 2024 to now",
      line: { pre: "In 2024, Loop decided to go", em: "AI-first." },
      subline: "Creative operations came first. This is what it produced.",
    },
    ...LOOP_PROOF_CARDS,
    LOOP_RETURN,

    /* ── Part two · the layer, at work ───────────────────────────────────
       Four jobs since September under one switch, each eyebrow naming the
       discipline it shows, so the vision's four tiles come back as proof. */
    {
      id: "the-layer",
      kind: "interstitial",
      variant: "chapter",
      chapter: { n: 2, of: 3 },
      menuLabel: "The layer, at work",
      menuPrimary: true,
      eyebrow: "The layer, at work",
      line: { pre: "The same layer,", em: "for other brands." },
      subline:
        "Four real jobs since September, inside two brands' own Claude. Switch between them on the bar.",
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
      variant: "chapter",
      chapter: { n: 3, of: 3 },
      eyebrow: "X-Bionic",
      line: { pre: "The product is the hero.", em: "Now make it teachable." },
      subline: "Form, fit, function and materials, told many ways, tested and read back.",
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
      /* WHAT PLUGS INTO CLAUDE ENTERPRISE (Ganesh on the call: "anything that
         you say that links into our Claude enterprise, the investors will be
         like, perfect"). The instrument at the organisation altitude
         (ADR-154 step 3): static, no picker, one lit workstream, the one
         phase one starts with. */
      id: "engine",
      kind: "instrument",
      menuLabel: "What plugs in",
      head: {
        eyebrow: "X-Bionic · what plugs into Claude Enterprise",
        title: { pre: "One plugin,", em: "in the Claude you run." },
        sub: "Each workstream gets a skill its owner keeps, installed as one plugin in your Claude organisation. The product voice is first.",
      },
      record: X_BIONIC_INSTRUMENT,
      altitude: "org",
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
        sub: "Phase one sets the engine up and runs it once on real work. Then I come back every quarter.",
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
            },
            {
              id: "w1-voice",
              tag: "The voice",
              name: "The product voice, written down first",
            },
            {
              id: "w1-brief",
              tag: "The brief",
              name: "From campaign to platform",
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
            },
            {
              id: "w2-review",
              tag: "Review",
              name: "The product designer's eye, as checks",
            },
            {
              id: "w2-handover",
              tag: "Handover",
              name: "In your Claude, in your repository",
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
            },
            {
              id: "q-upkeep",
              tag: "Upkeep",
              name: "The skills, brought up to date",
            },
            {
              id: "q-next",
              tag: "Next",
              name: "The next workflows",
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
        sub: "Who is in the room, and what it costs them in time.",
      },
      groups: [
        {
          id: "x-bionic",
          label: "From X-Bionic",
          blurb: "What phase one asks of each.",
          items: [
            {
              id: "sponsor",
              name: "Digital lead · owns the result",
              meta: "The kickoff, and the end of each week",
            },
            {
              id: "champion",
              name: "AI champion · keeps it running",
              meta: "Day one, and the handover",
            },
            {
              id: "process",
              name: "Business process lead · fits it in",
              meta: "Day one, and the handover",
            },
            {
              id: "creative",
              name: "Creative lead · the last gate",
              meta: "Two sessions in week one",
            },
            {
              id: "paid-social",
              name: "Paid social lead · runs it daily",
              meta: "From phase one, if in place",
            },
            {
              id: "copywriter",
              name: "Copywriter · the voice, first",
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
              name: "Vince · AI and creative technology",
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
                name: "A seat in your Claude Enterprise",
              },
              {
                id: "work",
                tag: "Week one",
                name: "Recent ads, their results, the best copy",
              },
            ],
          },
        },
      ],
    },
    {
      /* THE TERMS (ADR-153): the day rate and what it is measured against,
         one console, the page closing on the instrument it opened with. The
         rate and the shape, no total (owner, 2026-10-08, ADR-133 U5). */
      id: "pricing",
      kind: "terms",
      // The terminal menu entry is the exit mark, never a chapter (arc-marks).
      menuLabel: "Pricing",
      head: {
        eyebrow: "X-Bionic · the fee",
        title: { pre: "The day rate,", em: "and what it buys." },
        sub: "One rate for every day on the work. Everything is counted from your own ad accounts and your own Claude.",
      },
      console: { name: "Terms", status: "Phase one" },
      rate: {
        label: "Day rate",
        value: eur(DAY_RATE),
        unit: "a day",
        line: "On site or remote, invoiced on the days worked.",
      },
      shape: [
        { label: "Phase one", value: "About 10 days" },
        { label: "Week one", value: "On site" },
        { label: "Week two", value: "Remote" },
        { label: "Then", value: "2 days a quarter" },
      ],
      measures: {
        label: "What we measure",
        items: [
          {
            id: "roac",
            glyph: "ratio",
            label: "Return on ad cost creation",
            line: "What each ad cost to make, beside what it returned",
          },
          {
            id: "variety",
            glyph: "spread",
            label: "Ads in market",
            line: "Distinct ideas a week, not resized copies",
          },
          {
            id: "speed",
            glyph: "clock",
            label: "Brief to live",
            line: "How long an idea waits before it runs",
          },
          {
            id: "tokens",
            glyph: "meter",
            label: "Token spend",
            line: "Where the Claude budget goes, by workflow",
          },
        ],
      },
      readout: [
        { label: "Travel", value: "At cost" },
        { label: "Usage", value: "Your Claude" },
        { label: "Built", value: "Yours to keep" },
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
