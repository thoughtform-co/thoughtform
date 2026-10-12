import type { ArcDef, ArcLeverageUse, ArcSectionOf } from "../types";

import { X_BIONIC_JOBS } from "./shared/jobs";
import { LOOP_PROOF_CARDS, LOOP_RETURN, VINCE_ABOUT } from "./shared/loopProof";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";

/* The Loop cards' four tabs, one workstream a card in the pile's order
   (owner, 2026-10-12: "let's use the proper workstreams … that way, it
   really leads up to my role"): the films are production, the tools ops,
   the studio review, the layer creative technology, a fifth name beside the
   page's four disciplines. */
/* The page's own words for some of Loop's claims (owner, 2026-10-12), keyed
   by the record's claim title; the record, which the homepage and Pandora
   read, stays as it is. */
const LOOP_RETITLE: Record<string, Readonly<Record<string, string>>> = {
  "atl-films": {
    "Two 30-second masters": "Two 30-second full AI videos",
    "One craft standard": "Same standard as live action",
    "Ran beside live action": "Used as a business case by Google",
  },
  tooling: { "One substrate, four tools": "Four tools connected by one layer" },
  "ai-transformation": { "Set the goal, let it run": "Knowledge shared across departments" },
};

const LOOP_WORKSTREAMS = [
  "Creative production",
  "Creative ops",
  "Creative review",
  "Creative technology",
] as const;

/**
 * X-Bionic, the proposal, as an arc (ADR-098; the Pandora cut of the format,
 * ADR-128, without the corridor).
 *
 * Written from the 8 October call with X-Bionic's digital lead. The ask is a
 * creative engine for paid social, whose job there is product education
 * (form, fit, function, materials across socks, base layers and trail
 * shoes), built inside the Claude Enterprise the company already runs and
 * owned by its team: a first month across the marketing team (2026-10-12). The
 * company's AI champion and its investors read it for one thing above all,
 * WHAT PLUGS INTO CLAUDE ENTERPRISE, so the circuit beat says it plainly.
 *
 * ⚠ ONE ARGUMENT, READ TOP TO BOTTOM (owner, 2026-10-09 and 2026-10-10;
 * ADR-153 U1, U4): who does the work, then the vision and how adoption and
 * automation connect, then Loop (one line, then its cards, landing on the
 * layer the agents run on), then the same approach at two other brands,
 * then what is set up at X-Bionic and the fee. THREE BARE LINES carry it,
 * each the owner's own sentence and nothing else (U4: "an interstitial
 * section with only that quote, and then we show the cases"). Plain titles,
 * no slogans, and NO FIRST PERSON anywhere on the page (owner, 2026-10-10).
 * One vocabulary runs down the page three times: the vision's four
 * workstreams, the four jobs' buckets and the engine's four workstreams are
 * the same four words, in the same order: Creative production, Creative
 * ops, Creative review, Creative strategy.
 *
 * ⚠ OTHER CLIENTS BY NAME, THEIR PEOPLE BY ROLE (owner, 2026-10-08): Samako
 * and Suri are named on their jobs; no staff name, no quote from a
 * colleague, no fee. One job a screen, in one template (`shared/jobs.ts`).
 *
 * ⚠ THE FEE IS THE DAY RATE AND THE SHAPE (owner, 2026-10-08, Pandora's
 * rule, ADR-133 U5): the rate and about 14 days in the first month (owner,
 * 2026-10-12: five on site, then about three a week remote). No total.
 */

const DAY_RATE = 1000;
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;

/* The vision's layer and its four workstreams, in the owner's order and
   words (2026-10-10): Creative production, Creative ops, Creative review,
   Creative strategy. The same four, in the same order, are the jobs'
   buckets and the engine's workstreams. Hoisted (2026-10-11) because the
   approach's run reads them too, by reference: the reader meets the same
   layer and the same four names twice, and they cannot drift apart. */
const LAYER = "Your layer";
const WORKSTREAMS: readonly [ArcLeverageUse, ArcLeverageUse, ArcLeverageUse, ArcLeverageUse] = [
  {
    id: "production",
    glyph: "frame",
    label: "Creative production",
    line: "Imagery, motion and copy, at volume",
  },
  {
    id: "ops",
    glyph: "flow",
    label: "Creative ops",
    line: "Every ad briefed, named and filed",
  },
  {
    id: "review",
    glyph: "check",
    label: "Creative review",
    line: "Checked against the real product first",
  },
  {
    id: "strategy",
    glyph: "brief",
    label: "Creative strategy",
    line: "Briefs with an audience and variants",
  },
];

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
    title: { pre: "A creative engine", em: "for X-Bionic." },
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
      { id: "read", label: "The vision", href: "#vision", primary: true },
      { id: "plan", label: "The four weeks", href: "#phases" },
    ],
  },
  meta: {
    title: "X-Bionic · proposal — Thoughtform",
    description:
      "A creative engine for paid social, built in X-Bionic's own Claude Enterprise and run by its team.",
  },
  sections: [
    /* ── The vision (ADR-153) ──────────────────────────────────────────
       Rebuilt for a board (owner, 2026-10-08: "I don't know what people
       should be looking at"), then written as the proposal's own view
       (2026-10-09): the layer only X-Bionic can write and what Thoughtform
       adds to it, then how adoption and automation connect. Never in the
       first person (owner, 2026-10-10: "we should NEVER talk in the first
       person"). */
    {
      id: "vision",
      kind: "leverage",
      menuLabel: "The vision",
      menuPrimary: true,
      head: {
        eyebrow: "Thoughtform · the vision",
        title: { pre: "How intelligence should", em: "take part in the work." },
        sub: "Every company gets the same models and the same Claude. What makes them work like X-Bionic is the layer your team writes down.",
      },
      stack: [
        {
          id: "layer",
          label: LAYER,
          line: "Skills and evals your team writes",
          chip: "Only yours",
          own: true,
        },
        {
          id: "claude",
          label: "Claude Enterprise",
          line: "Already running at X-Bionic",
          chip: "In place",
        },
        {
          id: "models",
          label: "The models",
          line: "The same for every company",
          chip: "Everyone",
        },
      ],
      note: {
        label: "What Thoughtform adds",
        line: "The first layer, written with your team in your Claude and handed over with an owner per workstream.",
      },
      // The section is the flow from /test/proposition-v2 (owner,
      // 2026-10-12: "AI capability your teams own", in place of the
      // equilibrium, S1 A and the approach's run). The console's fields
      // below stay in the record and are not drawn while this is set.
      port: "plug",
      console: { name: "Intelligence configuration", status: "X-Bionic" },
      readout: [
        { label: "Models", value: "Shared" },
        { label: "Claude", value: "Installed" },
        { label: "Layer", value: "Owned" },
      ],
      uses: { label: "One layer, four workstreams", items: WORKSTREAMS },
    },

    /* ── The approach: the configuration as one run ────────────────────
       The owner's eight-step outline (2026-10-10, "Draw it"), read whole
       on one screen (2026-10-11, "Whole"): the vision's layer and its four
       workstreams, creative production opened onto its jobs and ads design
       worked through, from its three inputs to the finished ad, and the
       three steps as three passes over the same ground: made with Claude
       and checked at every step, written down as a skill and its evals,
       run by an agent that asks the workstream's owner once. The plates
       and the time bars it replaced are a lab value now
       (/test/proposal-system, `approach=plates`). */
    {
      id: "adoption",
      kind: "handoff",
      menuLabel: "The approach",
      // Navigate, encode, build, from /test/proposition-v2 (owner, 2026-10-12).
      // The head, the steps and the run below stay in the record and are not
      // drawn while this is set.
      port: "steps",
      head: {
        eyebrow: "Thoughtform · the approach",
        title: { pre: "How adoption and", em: "automation connect." },
        sub: "Claude can only automate what your team has written down. The first phase starts with ads design: the team makes the ads with Claude, writes down what works, and an agent runs it from there. Loop Earplugs wrote the first layer of this kind in 2024.",
      },
      steps: [
        {
          id: "adopt",
          when: "Week 1",
          label: "Adoption",
          title: "Your team learns on its own work",
          who: "Your team",
        },
        {
          id: "encode",
          when: "Weeks 1–2",
          label: "Encoding",
          title: "How the work is done, and what good looks like",
          who: "Your team, with Thoughtform",
          lit: true,
        },
        {
          id: "automate",
          when: "From week 2",
          label: "Automation",
          title: "Claude runs it, and asks when unsure",
          who: "Claude, checked by your team",
        },
      ],
      run: {
        layer: {
          label: LAYER,
          workstreams: WORKSTREAMS.map((w) => ({
            id: w.id,
            name: w.label,
            ...(w.id === "production" ? { lit: true as const } : {}),
          })),
        },
        jobs: [
          { id: "ads", name: "Ads design", lit: true },
          { id: "imagery", name: "Product imagery" },
          { id: "motion", name: "Motion" },
        ],
        inputs: ["Product renders", "Tone of voice", "The brief"],
        output: "The finished ad",
        lines: [
          "Your team makes the ads with Claude, and checks every step",
          "What works, written down once for everyone",
          "An agent runs it against the evals, and asks the workstream's owner once",
        ],
        keys: { skill: "Skill", evals: "Evals" },
        alt: "The configuration as one run. X-Bionic's layer with its four workstreams, creative production opened onto its jobs and ads design worked through: the product renders, the tone of voice and the brief run into one job and out to the finished ad three ways. Made with Claude, a person checking every step; what works written down between the runs, as a skill and its evals, the checks the copy editor and the product designer write; run by an agent through the evals, which asks the workstream's owner once before the ad goes out.",
      },
    },

    /* The two lines ("Longer tasks for Claude, upstream time for your
       team.", outline steps 7 and 8) came off this page on 2026-10-11, on
       the owner's video: "completely out of place in terms of design …
       these rounded shapes, we shouldn't use them … doodle arrow". The
       approach's last sentence hands to Loop instead; the lab keeps the two
       lines as `upstream: lines`. */

    /* ── Loop ──────────────────────────────────────────────────────────
       The first of three bare lines (owner, 2026-10-10: "an interstitial
       section with only that quote, and then we show the cases"). No
       eyebrow, no ruler, no index: one sentence on a screen of its own,
       then Loop's four cards in the pile's order and what they returned. */
    {
      id: "proof-loop",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "Loop",
      menuPrimary: true,
      // owner, 2026-10-12: was "In 2024, Loop decided to go AI-first."
      line: { pre: "This is how we got there at", em: "Loop Earplugs." },
    },
    /* The four cards in the job cards' housing (owner, 2026-10-12, from
       /test/loop-proof-lab B55): Pandora reads the same record and keeps the
       homepage's folder card. */
    /* LOOP AS ONE STORY (owner, 2026-10-12, after augustus.com: "instead
       of trying to wrap it into cards, we just leave the right side for
       visuals"): the four projects in one section, the words sticky on the
       left, each project's own visual scrolling past on the right. The
       records are LOOP_PROOF_CARDS', read by reference; Pandora keeps the
       four folder cards. */
    {
      id: "practice",
      kind: "proof-card",
      menuLabel: "The way there",
      track: LOOP_PROOF_CARDS[0].track,
      layout: "story" as const,
      story: LOOP_PROOF_CARDS.map((c, i) => ({
        id: c.id,
        track: c.track,
        title: c.title,
        workstream: LOOP_WORKSTREAMS[i],
        ...(LOOP_RETITLE[c.track] ? { retitle: LOOP_RETITLE[c.track] } : {}),
      })),
    },
    /* What it returned at Loop came off the page on 2026-10-12 (owner: "we
       already have that in the individual" cards); its record stays below
       as `X_BIONIC_RETURN`. */

    /* ── Two brands ────────────────────────────────────────────────────
       The second line, the owner's own sentence: Loop set the layer up,
       and this is the same approach at two other brands. Then four jobs,
       one screen each, in one template, on the vision's four workstreams. */
    {
      id: "proof-brands",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "Two brands",
      menuPrimary: true,
      line: {
        pre: "How we've made other brands",
        em: "self-sufficient with AI.",
      },
    },
    ...X_BIONIC_JOBS,

    /* ── The offer ─────────────────────────────────────────────────────
       The third line, the owner's own: what is set up at X-Bionic, then
       the fee. */
    {
      id: "offer",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "The offer",
      menuPrimary: true,
      line: { pre: "And this is how we'll do it at", em: "X-Bionic." },
    },
    /* The plugin came off the page on 2026-10-12 (owner: "remove that");
       its record stays below as `X_BIONIC_ENGINE`. */
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "The four weeks",
      menuPrimary: true,
      layout: "plates",
      /* One hairline frame, three phases (owner, 2026-10-12: "it's 4
         weeks"; "I really want them to be in frames"). */
      port: "xb-weeks",
      head: {
        eyebrow: "X-Bionic · the four weeks",
        title: { pre: "The four weeks." },
        sub: "Four weeks across the whole marketing team: one on site, then three remote. What gets built comes out of the work itself, and it compounds.",
      },
      /* The first month across the whole department, never one voice or one
         brand (owner, 2026-10-12: "it's across the entire marketing
         department … I didn't know beforehand what the output would be, but
         we just had a compounding effect very quickly"). Week one a sprint
         on site, then a retro on the priorities, then the handover; the
         quarterly commitment is a separate thing, not part of this
         proposal. */
      groups: [
        {
          id: "w1",
          label: "Week one · on site",
          blurb: "The sprint",
          items: [
            {
              id: "w1-embed",
              tag: "Embed",
              name: "Five days inside the team",
            },
            {
              id: "w1-map",
              tag: "Map",
              name: "How production, ops, review and strategy run",
            },
            {
              id: "w1-run",
              tag: "First runs",
              name: "Claude on the team's own live work",
            },
          ],
          foot: {
            label: "Done when",
            lines: [
              "Every workstream has run real work with Claude",
              "The team knows where its time goes",
            ],
          },
        },
        {
          id: "w2",
          label: "Weeks two and three · remote",
          blurb: "The retro",
          items: [
            {
              id: "w2-retro",
              tag: "Retro",
              name: "What worked in week one, workstream by workstream",
            },
            {
              id: "w2-priorities",
              tag: "Priorities",
              name: "The workflows worth handing over",
            },
            {
              id: "w2-build",
              tag: "Build",
              name: "Their skills and evals, written with their owners",
            },
          ],
          foot: {
            label: "Done when",
            lines: ["Each priority has an owner", "Its skill runs on real work"],
          },
        },
        {
          id: "w4",
          label: "Week four · remote",
          blurb: "The handover",
          items: [
            {
              id: "w4-own",
              tag: "Self-sufficient",
              name: "Which parts of the team now run on their own",
            },
            {
              id: "w4-handover",
              tag: "Handover",
              name: "In your Claude, in your repository",
            },
            {
              id: "w4-next",
              tag: "Next",
              name: "Which departments to bring in next",
            },
          ],
          foot: {
            label: "Done when",
            lines: ["Each skill has an owner who can change it", "The next departments are named"],
          },
        },
      ],
    },
    {
      id: "how-we-work",
      kind: "list-groups",
      menuLabel: "Who takes part",
      layout: "columns",
      port: "xb-who",
      head: {
        eyebrow: "X-Bionic · who takes part",
        title: { pre: "Who takes part." },
        sub: "Who is in the room, and what it costs them in time.",
      },
      groups: [
        {
          id: "x-bionic",
          label: "From X-Bionic",
          blurb: "What the first month asks of each.",
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
              meta: "From week one, if in place",
            },
            {
              id: "copywriter",
              name: "Copywriter · writes with Claude",
              meta: "Week one",
            },
          ],
        },
        {
          id: "thoughtform",
          label: "From Thoughtform",
          blurb: "One week on site, then three remote.",
          items: [
            {
              id: "vince",
              name: "Vince · AI and creative technology",
              meta: "About 14 days in the first month",
            },
          ],
          sub: {
            label: "What Thoughtform needs",
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
              /* owner, 2026-10-12: "it's not just ads … brand guidelines,
                 briefing flow" */
              {
                id: "brand",
                tag: "Week one",
                name: "The brand guidelines",
              },
              {
                id: "briefing",
                tag: "Week one",
                name: "The briefing flow",
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
      menuLabel: "The fee",
      head: {
        eyebrow: "X-Bionic · the fee",
        title: { pre: "The fee." },
        sub: "One rate for every day on the work; what it returns is counted from your own ad accounts and your own Claude.",
      },
      console: { name: "Terms", status: "First month" },
      rate: {
        label: "Day rate",
        value: eur(DAY_RATE),
        unit: "a day",
        line: "On site or remote, invoiced on the days worked.",
      },
      shape: [
        { label: "First month", value: "About 14 days" },
        { label: "Week one", value: "5 days on site" },
        { label: "Weeks two to four", value: "About 3 days a week" },
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
    /* ── About, at the foot (owner, 2026-10-12: "the About section should
       be at the bottom"), the page's last read before the contact.
       The homepage's About (2026-10-11: the second
       section is the equilibrium now; it stood first, owner: "a hero section
       with the new key visuals and an About section"), its bio cut to two
       paragraphs here (owner, 2026-10-09: "more concise"); the shared
       record is the homepage's and stays whole. Its head is the record's
       own: the page never speaks in the first person (owner, 2026-10-10). */
    {
      ...VINCE_ABOUT,
      id: "about",
      menuLabel: "About",
      // the homepage's whole orbit behind the portrait, on this page alone
      // (owner, 2026-10-12: Pandora's About stays as sent)
      orbitArt: "homepage",
      bio: [
        "Vince is a creative technologist. For over a decade he has worked where digital change meets creative teams: social media, online communities, now AI.",
        "Through Thoughtform he helps teams work with the intelligence they already have. He runs the same practice inside Loop Earplugs, leading AI adoption in its creative studio.",
      ],
    },

    {
      id: "close",
      kind: "close",
      port: "xb-contact",
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

/* ── Off the page, kept as records (owner, 2026-10-12) ─────────────────
   The plugin and what it returned at Loop left the page the same day the
   flow and the steps arrived; the proposal system lab still composes them
   for its `engine: pinned` and `return: ledger` directions. */

/** What it returned at Loop, in the jobs' own housing (ADR-153 U5): one
    card, a lane per workstream. Pandora keeps the circuit. */
export const X_BIONIC_RETURN: ArcSectionOf<"crew"> = { ...LOOP_RETURN, layout: "case" };

/** The plugin, in your Claude Enterprise. */
export const X_BIONIC_ENGINE: ArcSectionOf<"instrument"> = {
  /* WHAT PLUGS INTO CLAUDE ENTERPRISE (the client's own lead on the
     call: anything that links into their Claude Enterprise is what the
     investors want to hear). The plugin drawn as the layer opened
     (ADR-153 U6, owner 2026-10-10: "Layer opened"): the gold slab the
     team writes, one lane per skill carrying the figure its
     workstream's lane draws on the Loop return, X-Bionic's Claude
     Enterprise as a plain slab under it. The words are the record's
     (`org.workstreams`); the drawing is the `face`. */
  id: "engine",
  kind: "instrument",
  menuLabel: "The plugin",
  head: {
    eyebrow: "X-Bionic · the plugin",
    title: { pre: "The plugin,", em: "in your Claude Enterprise." },
    sub: "One plugin in X-Bionic's own Claude Enterprise, with a skill for each workstream: the product voice, intake and naming, the pre-review, the brief and its variants. Each is written in phase one with the people who use it, checked by its own evals, and kept by them.",
  },
  record: X_BIONIC_INSTRUMENT,
  altitude: "org",
  face: {
    kind: "layer",
    console: { name: "Intelligence configuration", status: "X-Bionic" },
    layer: "Your layer",
    host: "X-Bionic's Claude Enterprise",
    connectors: ["Shopify", "Analytics", "Ad accounts"],
    lanes: LOOP_RETURN.rows.map((r) => ({
      id: r.bucket ?? r.id,
      output: r.output,
      seed: r.id,
      keepers: r.bucket === "production" ? 2 : r.bucket === "strategy" ? 1 : undefined,
    })),
  },
};
