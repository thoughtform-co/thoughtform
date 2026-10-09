import type { ArcDef } from "../types";

import { X_BIONIC_JOBS } from "./shared/jobs";
import { LOOP_PROOF_CARDS, LOOP_RETURN, VINCE_ABOUT } from "./shared/loopProof";
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
 * ⚠ ONE ARGUMENT, READ TOP TO BOTTOM (owner, 2026-10-09; ADR-153 U1):
 * who I am, then my approach (the vision, then how adoption and automation
 * connect), then the proof (Loop, then two other brands), then what we set
 * up at X-Bionic and the fee. Three chapter bands carry it, each with the
 * index of its beats. Plain titles, no slogans. One vocabulary runs down
 * the page three times: the vision's four disciplines, the four jobs'
 * buckets and the engine's four workstreams are the same four words.
 *
 * ⚠ OTHER CLIENTS BY NAME, THEIR PEOPLE BY ROLE (owner, 2026-10-08): Samako
 * and Suri are named on their jobs; no staff name, no quote from a
 * colleague, no fee. One job a screen, in one template (`shared/jobs.ts`).
 *
 * ⚠ THE FEE IS THE DAY RATE AND THE SHAPE (owner, 2026-10-08, Pandora's
 * rule, ADR-133 U5): the rate, about ten days, two days a quarter. No total.
 */

const DAY_RATE = 1000;
const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;

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
      { id: "read", label: "How I see it", href: "#vision", primary: true },
      { id: "plan", label: "The two weeks", href: "#phases" },
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
       the new key visuals and an About section"), its bio cut to two
       paragraphs here (owner, 2026-10-09: "more concise"); the shared
       record is the homepage's and stays whole. */
    {
      ...VINCE_ABOUT,
      id: "about",
      menuLabel: "About",
      head: { ...VINCE_ABOUT.head, eyebrow: "Thoughtform · who I am" },
      bio: [
        "Vince is a creative technologist. For over a decade he has worked where digital change meets creative teams: social media, online communities, now AI.",
        "Through Thoughtform he helps teams work with the intelligence they already have. He runs the same practice inside Loop Earplugs, leading AI adoption in its creative studio.",
      ],
    },

    /* ── My approach (ADR-153) ─────────────────────────────────────────
       Rebuilt for a board (owner, 2026-10-08: "I don't know what people
       should be looking at"), then written as the proposal's own view
       (2026-10-09): first my vision, the layer only X-Bionic can write and
       what my approach adds to it, then how adoption and automation
       connect. */
    {
      id: "vision",
      kind: "leverage",
      menuLabel: "How I see it",
      menuPrimary: true,
      head: {
        eyebrow: "Thoughtform · my approach",
        title: { pre: "How intelligence should", em: "take part in the work." },
        sub: "My view: every company gets the same models and the same Claude. What makes them work like X-Bionic is the layer your team writes down.",
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
        label: "What my approach adds",
        line: "I write the first layer with your team, in your Claude, and hand it over with an owner per workstream.",
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
            line: "Briefs with an audience and variants",
          },
          {
            id: "production",
            glyph: "frame",
            label: "Production",
            line: "Imagery, motion and copy, at volume",
          },
          {
            id: "ops",
            glyph: "flow",
            label: "Ops",
            line: "Every ad briefed, named and filed",
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
        title: { pre: "How adoption and", em: "automation connect." },
        sub: "Claude can only automate what your team has written down. So adoption comes first: the team learns on its own work, then Claude takes the repetitive part.",
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

    /* ── Proof · Loop ──────────────────────────────────────────────────
       Part one of three (owner, 2026-10-09: the AI-first line introduces
       the Loop cases): the line, then the part's index, then Loop's four
       cards in the pile's order and what they returned. */
    {
      id: "proof-loop",
      kind: "interstitial",
      variant: "chapter",
      chapter: { n: 1, of: 3 },
      menuLabel: "Proof · Loop",
      menuPrimary: true,
      eyebrow: "Proof · Loop Earplugs, 2024 to now",
      line: { pre: "In 2024, Loop decided to go", em: "AI-first." },
      subline: "Creative operations came first. This is what it produced, in four parts.",
      index: [
        { n: "01", label: "Films", href: "#practice-frontier" },
        { n: "02", label: "Tools", href: "#practice-tools" },
        { n: "03", label: "Studio", href: "#practice-studio" },
        { n: "04", label: "The layer", href: "#practice-layer" },
      ],
    },
    ...LOOP_PROOF_CARDS,
    LOOP_RETURN,

    /* ── Proof · two brands ────────────────────────────────────────────
       Part two: four jobs, one screen each, in one template, on the same
       four buckets as the vision's 2×2 (ADR-153 U1). */
    {
      id: "proof-brands",
      kind: "interstitial",
      variant: "chapter",
      chapter: { n: 2, of: 3 },
      menuLabel: "Proof · two brands",
      menuPrimary: true,
      eyebrow: "Proof · Samako and Suri, October 2026",
      line: { pre: "The same approach,", em: "at two other brands." },
      subline:
        "Four jobs from the first week of October, one per discipline, each run in the brand's own Claude.",
      index: [
        { n: "01", label: "Strategy · Samako", href: "#job-strategy" },
        { n: "02", label: "Production · Suri", href: "#job-production" },
        { n: "03", label: "Ops · Suri", href: "#job-ops" },
        { n: "04", label: "Review · Samako", href: "#job-review" },
      ],
    },
    ...X_BIONIC_JOBS,

    /* ── The offer ─────────────────────────────────────────────────────
       Part three: what we set up at X-Bionic, then the fee. */
    {
      id: "offer",
      kind: "interstitial",
      variant: "chapter",
      chapter: { n: 3, of: 3 },
      menuLabel: "The offer",
      menuPrimary: true,
      eyebrow: "X-Bionic · the offer",
      line: { pre: "What we set up", em: "at X-Bionic." },
      subline:
        "Paid social at X-Bionic is product education: form, fit, function and materials, told many ways and tested.",
      index: [
        { n: "01", label: "The engine", href: "#engine" },
        { n: "02", label: "The two weeks", href: "#phases" },
        { n: "03", label: "Who takes part", href: "#how-we-work" },
        { n: "04", label: "The fee", href: "#pricing" },
      ],
    },
    {
      /* WHAT PLUGS INTO CLAUDE ENTERPRISE (Ganesh on the call: "anything that
         you say that links into our Claude enterprise, the investors will be
         like, perfect"). The instrument at the organisation altitude, drawn
         as the exploded stack (ADR-154 U4): the four workstreams on the
         layer the team writes, on X-Bionic's own Claude Enterprise. */
      id: "engine",
      kind: "instrument",
      menuLabel: "The engine",
      head: {
        eyebrow: "X-Bionic · the engine",
        title: { pre: "Four skills, one plugin,", em: "in your Claude Enterprise." },
        sub: "Each discipline gets a skill its owner keeps. The product voice comes first, written down with the copywriter in week one.",
      },
      record: X_BIONIC_INSTRUMENT,
      altitude: "org",
    },
    {
      id: "phases",
      kind: "list-groups",
      menuLabel: "The two weeks",
      menuPrimary: true,
      layout: "plates",
      head: {
        eyebrow: "X-Bionic · the two weeks",
        title: { pre: "The two weeks." },
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
        eyebrow: "X-Bionic · who takes part",
        title: { pre: "Who takes part." },
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
      menuLabel: "The fee",
      head: {
        eyebrow: "X-Bionic · the fee",
        title: { pre: "The fee." },
        sub: "One rate for every day on the work; what it returns is counted from your own ad accounts and your own Claude.",
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
