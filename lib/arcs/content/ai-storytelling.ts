import type { ArcDef } from "../types";

/**
 * AI storytelling, as an arc: the nine-week course's syllabus, the page the
 * students open and the one it is taught from (ADR-132).
 *
 * ⚠ ONE PROJECT, NINE GATES. Every student builds one brand world across the
 * nine weeks — around themselves, or around a fictional futuristic product,
 * their choice — and launches it at the end with a poster, a website and a
 * film. Each week ends on a GATE stated before the week starts, which is the
 * owner's answer to his own weak spot as a teacher: open practical sheets.
 *
 * ⚠ EVERY WEEK IS THE SAME FOUR ROWS, IN THE SAME ORDER — objective · you make
 * · the gate · the tool — the workshop's practical rungs one level up
 * (ADR-131 U1). The student learns the shape in week one and never has to
 * ask what is expected again.
 *
 * ⚠ MOTION COMES LAST ON PURPOSE. The most impressive thing the tools do is
 * held back to week eight, because by then the world has rules a film can
 * obey; given away in week two it is a trick, not a story.
 *
 * The house arc maps onto the weeks: Navigate (one and two), Encode (three to
 * five), Build (six to eight), and the Launch.
 */
export const AI_STORYTELLING_ARC: ArcDef = {
  slug: "ai-storytelling",
  format: "workshop",
  /* No `client`: a course is a shape the practice sells. `cardChip` keeps the
     overview from reading it as a second workshop. */
  cardChip: "course",
  status: "running",
  date: "2026-09-28",
  cardTitle: "AI storytelling · the course",
  cardLede:
    "Nine weeks to build a brand world with AI, yours or a product's, and launch it with a poster, a website and a film.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Course · AI storytelling",
    title: { pre: "Build a world,", em: "then launch it." },
    lede: "One project across the term: a brand world of your own or a product's, made with AI and launched at the end.",
    actions: [
      { id: "start", label: "The course", href: "#course", primary: true },
      { id: "week-1", label: "Week one", href: "#week-1" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    /* The homepage's key visual, the landing's way (ADR-075): the gateway
       plate earns the route its `HERO_ROUTES` row. */
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "AI storytelling — Thoughtform",
    description:
      "A nine-week course: build a brand world with AI and launch it with a poster, a website and a film.",
  },
  sections: [
    /* ── The course ──────────────────────────────────────────────────── */
    {
      id: "course",
      kind: "list-groups",
      menuLabel: "The course",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "The course",
        title: { pre: "One world,", em: "built week by week." },
        sub: "You pick the subject once and keep it all term. Every week adds one thing to it, and every week ends on a gate you can see from the start.",
      },
      groups: [
        {
          id: "shape",
          label: "The project",
          blurb: "What you build",
          items: [
            { id: "subject", tag: "Subject", name: "Yourself, or a product from the future" },
            { id: "weeks", tag: "Weeks", name: "Nine, each ending on a gate" },
            { id: "setup", tag: "Setup", name: "Claude, GitHub and a shared drive" },
            { id: "leave", tag: "You leave with", name: "A poster, a website and a film" },
          ],
          foot: {
            label: "The gate",
            lines: ["A week is done when its gate is met, not when the class ends."],
          },
        },
        {
          id: "phases",
          label: "The term",
          blurb: "Four phases",
          items: [
            {
              id: "navigate",
              tag: "Navigate",
              name: "What AI is, and your world",
              href: "#week-1",
            },
            {
              id: "encode",
              tag: "Encode",
              name: "The world as a skill, then you in it",
              href: "#week-3",
            },
            {
              id: "build",
              tag: "Build",
              name: "The poster, the website, the film",
              href: "#week-6",
            },
            { id: "launch", tag: "Launch", name: "All of it, shown as one", href: "#week-9" },
          ],
          foot: {
            label: "The order",
            lines: ["The impressive part comes last, when the world can carry it."],
          },
        },
      ],
    },
    {
      /* A beat: no picture. The book's own line (Storytelling met AI, Vince
         Buyssens and Tom Rumes), translated from the Dutch. */
      id: "the-rule",
      kind: "interstitial",
      variant: "quote",
      line: {
        pre: "AI can't replace your creativity.",
        em: "It can only sharpen it.",
      },
      subline:
        "The whole course runs on it. The world is yours to find; the AI is how you build it faster than you could alone.",
      attribution: "Storytelling met AI",
    },

    /* ── Navigate · weeks one and two ────────────────────────────────── */
    {
      id: "week-1",
      kind: "anatomy",
      menuLabel: "Navigate",
      menuPrimary: true,
      badge: "Week one · Navigate",
      head: {
        eyebrow: "Week one",
        title: { pre: "AI is not", em: "software." },
        sub: "Why it answers differently every time, why you steer it rather than command it, and the setup the next eight weeks run on.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Understand what you are working with, then set up where your work lives.",
        },
        {
          id: "make",
          label: "You make",
          body: "A Claude account, a GitHub repository and a shared drive, connected.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "Your first ten images, generated and filed in your own repository.",
        },
        { id: "tool", label: "The tool", body: "Claude, GitHub, Google Drive or Dropbox." },
      ],
    },
    {
      id: "week-2",
      kind: "anatomy",
      menuLabel: "The world",
      badge: "Week two · The world",
      head: {
        eyebrow: "Week two",
        title: { pre: "Find", em: "your world." },
        sub: "Before anything is generated, you look. References, a mood, and a name that belongs to nobody else.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Decide what your world looks and feels like, before the AI decides for you.",
        },
        {
          id: "make",
          label: "You make",
          body: "A reference board, a name, and a one-page world bible.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "Someone else can describe your world from the board alone.",
        },
        {
          id: "tool",
          label: "The tool",
          body: "Your own eyes first, then Claude to research and challenge the references.",
        },
      ],
    },

    /* ── Encode · weeks three to five ────────────────────────────────── */
    {
      id: "week-3",
      kind: "anatomy",
      menuLabel: "Encode",
      menuPrimary: true,
      badge: "Week three · Encode",
      head: {
        eyebrow: "Week three",
        title: { pre: "Write the world", em: "down." },
        sub: "The world you found becomes a skill: rules a model can read, and checks it runs on its own images before you see them.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Turn the world bible into a skill with its own evals.",
        },
        {
          id: "make",
          label: "You make",
          body: "A world skill from the eval template, and a first batch of images at scale.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "Twenty images that pass your own checks, and the rejects you learned from.",
        },
        {
          id: "tool",
          label: "The tool",
          body: "The eval template, Claude and an image model.",
        },
      ],
    },
    {
      id: "week-4",
      kind: "anatomy",
      menuLabel: "You in it",
      badge: "Week four · You in it",
      head: {
        eyebrow: "Week four",
        title: { pre: "Put yourself", em: "in it." },
        sub: "Photograph yourself, or your product, and bring the photographs into the world without losing who or what is in them.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Make the world yours: a real person or a real object inside it.",
        },
        {
          id: "make",
          label: "You make",
          body: "A shoot of yourself or your product, edited into the world.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "Three portraits that are recognisably you and recognisably the world.",
        },
        { id: "tool", label: "The tool", body: "A camera or a phone, and your world skill." },
      ],
    },
    {
      id: "week-5",
      kind: "anatomy",
      menuLabel: "The offer",
      badge: "Week five · The offer",
      head: {
        eyebrow: "Week five",
        title: { pre: "From a feeling", em: "to an offer." },
        sub: "A world is an emotional truth. This week you decide what it is for: what you do, and for whom.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Say in one sentence what your brand does, in the world's own voice.",
        },
        {
          id: "make",
          label: "You make",
          body: "A one-line offer, and three mockups where it meets the world.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "The offer and the world read as one brand, not two.",
        },
        {
          id: "tool",
          label: "The tool",
          body: "Claude as your strategist and your antagonist, and your world skill.",
        },
      ],
    },

    /* ── Build · weeks six to eight ──────────────────────────────────── */
    {
      id: "week-6",
      kind: "anatomy",
      menuLabel: "Build",
      menuPrimary: true,
      badge: "Week six · The poster",
      head: {
        eyebrow: "Week six",
        title: { pre: "One image", em: "that carries it." },
        sub: "Out of everything you made, one to three key visuals: the one you would print and hang on a wall.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Choose rather than generate: land on your key visual.",
        },
        {
          id: "make",
          label: "You make",
          body: "One to three posters, and one of them printed.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "The printed poster holds up in the crit, on the wall.",
        },
        { id: "tool", label: "The tool", body: "Your world skill, and a printer." },
      ],
    },
    {
      id: "week-7",
      kind: "anatomy",
      menuLabel: "Website",
      badge: "Week seven · The website",
      head: {
        eyebrow: "Week seven",
        title: { pre: "Give it", em: "an address." },
        sub: "The key visuals become a landing page: clean, fast, and built by you and Claude in plain HTML.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Build a page that is the world, not a page about it.",
        },
        {
          id: "make",
          label: "You make",
          body: "One landing page in HTML, carrying your key visuals and your offer.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "The page runs, reads on a phone, and nothing on it is placeholder.",
        },
        { id: "tool", label: "The tool", body: "Claude, GitHub and a browser." },
      ],
    },
    {
      id: "week-8",
      kind: "anatomy",
      menuLabel: "Motion",
      badge: "Week eight · Motion",
      head: {
        eyebrow: "Week eight",
        title: { pre: "Make it", em: "move." },
        sub: "Motion comes last on purpose: by now the world has rules, so the film has something to obey.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Direct a short launch film that obeys your world's rules.",
        },
        {
          id: "make",
          label: "You make",
          body: "A stop-motion launch spot, fifteen to thirty seconds long.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "Every frame belongs to the world, and the offer is clear by the end.",
        },
        {
          id: "tool",
          label: "The tool",
          body: "Claude, a video model and your world skill.",
        },
      ],
    },

    /* ── Launch · week nine ──────────────────────────────────────────── */
    {
      id: "week-9",
      kind: "anatomy",
      menuLabel: "Launch",
      menuPrimary: true,
      badge: "Week nine · Launch",
      head: {
        eyebrow: "Week nine",
        title: { pre: "Launch", em: "it." },
        sub: "The poster, the page and the film, presented together as one world, to people who have not seen it before.",
      },
      rows: [
        {
          id: "objective",
          label: "Objective",
          body: "Show your world as one thing, with its offer, to a new audience.",
        },
        {
          id: "make",
          label: "You make",
          body: "The launch: poster, website and film, presented in class.",
        },
        {
          id: "gate",
          label: "The gate",
          body: "A stranger understands what you do, and wants to see more.",
        },
        { id: "tool", label: "The tool", body: "Everything you built, and nothing new." },
      ],
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Before we start",
      head: {
        eyebrow: "Before week one",
        title: { pre: "See you", em: "in week one." },
        sub: "Bring a laptop, a phone with a camera, and one image you find beautiful. We start from what you already see.",
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
