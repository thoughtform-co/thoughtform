import type { ArcDef, ArcSectionOf } from "../types";

/**
 * Suri, the kickoff of the four-week sprint, as an arc: the page the room
 * runs on Monday 5 October 2026 in London and the handout it prints to.
 *
 * Twelve beats, one idea per viewport, two cards to a row because the
 * room's 1280 draws the house grid in two columns. Plopsa's workshop III is the shape;
 * the frame (tool and collaborator, intelligence as a resource, the
 * configuration and its leverage) is the one the evals workshop teaches.
 * What Suri asked for comes first: the briefing, then the statics in Figma.
 * Generated imagery is named as what waits, because their product library
 * is better than what a model draws today.
 *
 * ⚠ IT IS THE CLIENT'S PAGE. It may name Kate and quote the kick-off call;
 * it prints no fee, no break clause and no fleet vocabulary, and the
 * proposal copy law does not run on a workshop, so it was read by hand.
 */
/**
 * The loop on one brief, and who decides at each step: the kickoff's record
 * (27 September), read by the lunch-and-learn too (ADR-147). ONE SECTION, ONE
 * RECORD: a page spreads these under its own head, never a copy of them.
 */
export const SURI_LOOP_GROUPS: ArcSectionOf<"list-groups">["groups"] = [
  {
    id: "run",
    label: "The loop, on one brief",
    blurb: "A real brief that is live this week. Every other brief runs on the same loop.",
    items: [
      {
        id: "brief",
        tag: "Brief",
        name: "The questions, answered",
        body: "Asks until the brief is complete, then writes the Monday item.",
      },
      {
        id: "set",
        tag: "Set",
        name: "Variants of one idea",
        body: "From your components and library. One thing varies, named in the brief.",
      },
      {
        id: "checks",
        tag: "Checks",
        name: "Read three times",
        body: "In the words Kate uses to send work back. They advise, never decide.",
      },
      {
        id: "finish",
        tag: "Finish",
        name: "The last details, by hand",
        body: "The designer takes it live. That part stays human, and gets shorter.",
      },
    ],
  },
  {
    id: "people",
    label: "Who decides, and where",
    blurb: "Who is the last gate at each step.",
    items: [
      {
        id: "owner",
        tag: "Suri",
        name: "The channel owner, on the brief",
        body: "Answers the questions. An unready brief goes back before the studio.",
      },
      {
        id: "strategists",
        tag: "Suri",
        name: "The strategists, on the idea",
        body: "Decide what a set tests and which ad type it is.",
      },
      {
        id: "kate",
        tag: "Suri",
        name: "Kate, the last gate on the work",
        body: "Says what goes live and why. What she says twice becomes a check.",
      },
      {
        id: "vince",
        tag: "Thoughtform",
        name: "Vince, on the setup and the checks",
        body: "Writes down what you send back. By week three he watches.",
      },
    ],
  },
];

/** What the month asks of the team on top of the week, the kickoff's record. */
export const SURI_ASK_CARDS: ArcSectionOf<"cards">["cards"] = [
  {
    id: "kate",
    n: "01",
    kicker: "This week",
    title: "Kate, two half-days",
    body: "What a complete brief holds, and what she sends back most.",
  },
  {
    id: "strategist",
    n: "02",
    kicker: "Tuesday",
    title: "A strategist at the keyboard",
    body: "The briefing skill, built on one live brief.",
  },
  {
    id: "designer",
    n: "03",
    kicker: "Wed and Thu",
    title: "The lead designer in Figma",
    body: "The first two ad types, on your own components.",
  },
  {
    id: "access",
    n: "04",
    kicker: "Today",
    title: "Access, and one live brief",
    body: "Monday, Claude and Figma, on your own accounts.",
  },
];

export const SURI_WORKSHOP_ARC: ArcDef = {
  slug: "suri-workshop",
  leaf: "workshop",
  format: "workshop",
  client: "suri",
  kind: "workshop",
  status: "running",
  // Filed the day the page was made (ADR-118); the kickoff itself is 5 October, in the copy.
  date: "2026-09-27",
  cardTitle: "Suri · kickoff",
  cardLede:
    "The briefing skill, three ad types in Figma, and the four weeks until the creative team runs it.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Suri · Kickoff · 5 October 2026",
    title: { pre: "A brief in Monday,", em: "a set in Figma." },
    lede: "Four weeks to build it on your own briefs and components, and to hand it to the team that runs it.",
    actions: [
      { id: "start", label: "What we heard", href: "#what-we-heard", primary: true },
      { id: "live", label: "Live", href: "#live" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    /* The gateway plate, as on Plopsa's page (ADR-075): it earns the route
       its `HERO_ROUTES` row and drops the static preload. */
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "Suri · kickoff — Thoughtform",
    description:
      "The setup Suri's creative team runs: the briefing skill, three ad types in Figma, the checks and the four weeks.",
  },
  sections: [
    {
      id: "what-we-heard",
      kind: "cards",
      menuLabel: "What we heard",
      menuPrimary: true,
      columns: 2,
      head: {
        eyebrow: "01 · What we heard",
        title: { pre: "Where the time", em: "goes today." },
        sub: "From the calls with Kate, Nick and Adam in September. Your words, not ours; correct us where we heard it wrong.",
      },
      cards: [
        {
          id: "briefing",
          n: "01",
          kicker: "Briefing",
          title: "Briefs arrive late and uneven",
          body: "Some are complete, some are a headline, and nobody sees how many come in per channel. The gaps get filled by chasing the channel owner.",
        },
        {
          id: "artwork",
          n: "02",
          kicker: "Artwork",
          title: "The last step takes the longest",
          body: "The product library is strong. What takes the time is getting a static from nearly there to live, and too often it waits for a freelancer.",
        },
      ],
    },
    {
      id: "the-question",
      kind: "interstitial",
      variant: "quote",
      eyebrow: "02 · The first thing we build",
      line: {
        pre: "It's not going to deliver it",
        em: "until you've answered",
        post: "those questions.",
      },
      subline:
        "The question is not which model. It is what a complete brief holds, who fills it in, and who says it is ready.",
      attribution: "The kick-off call, 21 September 2026",
    },
    {
      id: "two-things",
      kind: "cards",
      menuLabel: "Two things",
      columns: 2,
      head: {
        eyebrow: "03 · What we are working with",
        title: { pre: "Software,", em: "and an intelligence." },
        sub: "AI is the first technology that is both at once. Brief it like a capable colleague who started this morning, and check it like software.",
      },
      cards: [
        {
          id: "tool",
          n: "01",
          kicker: "A tool",
          title: "Executes commands",
          body: "Figma, Monday, Photoshop. It does what you click, the same way every time, and has no opinion about it.",
        },
        {
          id: "collaborator",
          n: "03",
          kicker: "A collaborator",
          title: "Interprets intent",
          body: "It reads a brief, fills a gap and argues back. What it lacks is what a new colleague lacks: your context.",
        },
      ],
    },
    {
      id: "a-resource",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "04 · A resource",
      line: {
        pre: "Intelligence used to arrive",
        em: "attached to a person.",
      },
      subline:
        "Now it can be configured: which model, what it knows, what it may touch, who checks it and who owns it. The real question is how it takes part in your work.",
    },
    {
      id: "the-configuration",
      kind: "configuration",
      menuLabel: "The configuration",
      menuPrimary: true,
      head: {
        eyebrow: "05 · What the team owns",
        title: { pre: "One setup,", em: "yours." },
        sub: "One layer the team writes and keeps extending after we leave. Pick a workstream to see it read differently.",
      },
      owner: "Owned by Suri",
      layer: [
        { id: "briefs", tag: "Briefs", name: "what a complete brief holds" },
        { id: "brand", tag: "Brand", name: "the products, the voice and what is approved" },
        { id: "types", tag: "Ad types", name: "the layouts the team has agreed" },
        { id: "checks", tag: "Checks", name: "what the team sends back, written down" },
      ],
      seam: {
        adoption: "The team learns on its own briefs and writes down what good looks like.",
        automation: "The layer runs in Claude, Monday and Figma, and gives the hours back.",
      },
      teams: [
        {
          id: "briefing",
          name: "Briefing",
          work: "every brief into Monday",
          layers: ["briefs", "brand", "checks"],
          owner: "The creative strategists",
          runs: "The briefing skill, in Suri's Claude",
          bar: "No brief reaches the studio with a gap in it",
          reach: "Monday, and the insights you already pull",
          where: "Claude, with Monday",
        },
        {
          id: "statics",
          name: "Statics",
          work: "paid social sets in Figma",
          layers: ["brand", "types", "checks"],
          owner: "Kate, the last gate",
          runs: "The set skill, on Suri's components",
          bar: "The product right and the layout on type, ready to finish",
          reach: "The product library and the Figma components",
          where: "Claude, with Figma",
        },
      ],
      next: { name: "Operations", work: "status and handovers" },
      kickers: ["One configuration", "The team runs it", "No vendor in between"],
    },
    {
      id: "the-loop",
      kind: "list-groups",
      menuLabel: "The loop",
      layout: "columns",
      head: {
        eyebrow: "06 · The loop",
        title: { pre: "Brief, set, checks,", em: "and then you." },
        sub: "One loop, one ad type at a time. We set it up this week and run it with you until you run it without us.",
      },
      groups: SURI_LOOP_GROUPS,
    },
    {
      id: "live",
      kind: "cards",
      menuLabel: "Live",
      menuPrimary: true,
      columns: 2,
      head: {
        eyebrow: "07 · Live, in the room",
        title: { pre: "Your last three months,", em: "read live." },
        sub: "Twenty minutes on your own Monday boards: what came in, from which channel, how long it waited and how often it went back. What it finds is the baseline we measure the month against.",
      },
      cards: [
        {
          id: "volume",
          n: "01",
          kicker: "Volume",
          title: "Briefs per channel, per week",
          body: "Ads, email, organic, retail and the requests around the edges, counted rather than guessed.",
        },
        {
          id: "lead-time",
          n: "02",
          kicker: "Lead time and rounds",
          title: "How long a brief waits, and how often it goes back",
          body: "Per channel and per kind of brief. The rounds are the number the briefing skill is there to bring down.",
        },
      ],
    },
    {
      id: "workstreams",
      kind: "cards",
      menuLabel: "Workstreams",
      menuPrimary: true,
      columns: 2,
      head: {
        eyebrow: "08 · This month",
        title: { pre: "Two workstreams,", em: "this month." },
        sub: "Video and generated imagery wait: your product library is better than what a model draws today, so they get one bounded test in week three.",
      },
      cards: [
        {
          id: "briefing",
          n: "01",
          kicker: "Workstream one",
          title: "Briefing",
          body: "The briefing skill in Suri's Claude, every new brief through it from the second week, and a status roundup from Monday for leadership.",
        },
        {
          id: "statics",
          n: "02",
          kicker: "Workstream two",
          title: "Statics in Figma",
          body: "Three paid social ad types, chosen with Kate today, built on your components to the point where a designer finishes rather than starts.",
        },
      ],
    },
    {
      id: "what-we-ask",
      kind: "cards",
      menuLabel: "What we ask",
      columns: 4,
      head: {
        eyebrow: "09 · What we ask",
        title: { pre: "A few hours,", em: "on top of the week." },
        sub: "Most of the month runs inside the meetings and tools you already have. These are the hours it needs on top.",
      },
      cards: SURI_ASK_CARDS,
    },
    {
      id: "four-weeks",
      kind: "cards",
      menuLabel: "Four weeks",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "10 · Four weeks",
        title: { pre: "Four weeks,", em: "dated today." },
        sub: "The handover date is set in the first week. After it, a check-in at one month and at three.",
      },
      cards: [
        {
          id: "week-1",
          n: "01",
          kicker: "5 to 8 October",
          title: "On site",
          body: "The Monday read, the briefing skill and the first two ad types.",
        },
        {
          id: "week-2",
          n: "02",
          kicker: "Week two",
          title: "The team runs it",
          body: "Every brief through the skill, the third ad type, a review on 16 October.",
        },
        {
          id: "week-3",
          n: "03",
          kicker: "Week three",
          title: "Without us",
          body: "The team works alone by design, then operations and one video test.",
        },
        {
          id: "week-4",
          n: "04",
          kicker: "Week four",
          title: "Handover",
          body: "Kate grades a full set, the team fixes one check itself, and it is Suri's.",
        },
      ],
    },
    {
      id: "what-it-installs",
      kind: "cards",
      menuLabel: "IT",
      columns: 2,
      head: {
        eyebrow: "11 · What IT installs",
        title: { pre: "Two things,", em: "in this order." },
        sub: "Everything in Suri's name, nothing in ours. The plugin goes in as a file today, and updates itself from GitHub once Suri has an account there.",
      },
      cards: [
        {
          id: "plugin",
          n: "01",
          kicker: "Claude",
          title: "The plugin",
          body: "Organisation settings, Plugins and skills, Add. Installed by default for the creative team.",
        },
        {
          id: "connectors",
          n: "02",
          kicker: "Connectors",
          title: "Monday and Figma",
          body: "Both connectors switched on in Claude for the creative team, so the skills read the boards and the components where they already are.",
        },
      ],
      footnote: "The full steps are in docs/SETUP.md in the repository.",
    },
    {
      id: "questions",
      kind: "close",
      menuLabel: "Questions",
      head: {
        eyebrow: "12 · Questions",
        title: { pre: "Questions,", em: "then the work." },
        sub: "Everything on this page is a starting point. What you correct today is the first thing the setup learns.",
      },
      actions: [
        {
          id: "mail",
          label: "vince@thoughtform.co",
          href: "mailto:vince@thoughtform.co",
          primary: true,
        },
      ],
      footerLine: "Thoughtform · Antwerp · 2026",
      signature: "Vince Buyssens",
    },
  ],
};
