import type { ArcDef, ArcFigureSpec } from "../types";

import { WORKSHOP_INTRO, type WorkshopIntro } from "./shared/workshopIntro";

/**
 * The UX meetup talk, A CUT OF THE WORKSHOP'S THIRD HOUSE CUT (ADR-156).
 *
 * The owner's talk for the UX Gent AI-design meetup of 15 October 2026. v3's
 * spine whole and by import (hero → the equilibrium → About → the eras → the
 * Arc → the Loop proof pile), then a tail written for a room of designers.
 * His brief: not a portfolio; a reality check, then what comes next.
 *
 * ⚠ THE SPINE ALREADY TELLS WHO HE IS. The About, the eras and the pile are
 * v3's, read from `WORKSHOP_INTRO` through the same seams, so none of that is
 * repeated here. The tail begins where the pile ends.
 *
 * ⚠ U2 (2026-10-15, the owner's read of U1 hours before the talk): the
 * talk sits between the eras and the corridor, so the corridor's thesis
 * ("AI sits somewhere between tool and collaborator") and the Arc close it.
 * Seven beats, a STATEMENT then a SECTION WITH ITS PICTURE in turn: the
 * claim, PhotoCraft, the threat, the curve under the electricity line, the
 * two ends, the stack (headless or told), the designer. Out: Tom on the
 * Moon, In The Pocket, the spectrum (the thesis says it), and every card
 * grid ("a glorified PowerPoint", owner). No equilibrium (page.tsx).
 *
 * ⚠ THE CURVE IS THE SHARED DRAWING UNDER THIS TALK'S HEAD, as v3 and
 * Suri's cut turn it, so `arcs-registry` does not count this page a
 * word-for-word reader.
 *
 * ⚠ What his notes ruled out stays out: the geopolitics, and the
 * jobs-and-unrest tangent (one spoken line at most, never a slide).
 */

/** The hero's copy, written over the shared prototype's at parse time (v3's
 *  `replaceHeroCopy`). The house measure holds (`HERO_MEASURE`). */
export const UX_MEETUP_HERO: WorkshopIntro["hero"] = {
  headlineHtml: "AI is not<br />software.",
  descHtml: "A talk on what is left to design once making digital things costs almost nothing.",
};

/** v3's proof ledes, with the one clause that promises a workshop removed
 *  ("The rest of today is how."): a talk does not show how. */
export const UX_MEETUP_PROOF_LEDES: WorkshopIntro["proof"]["ledes"] = {
  ...WORKSHOP_INTRO.proof.ledes,
  "ai-transformation":
    "Then we built for the agents: what each team knows, written down, and the checks they run on their own work.",
};

/** The two lanes and the rail, one record for both proof beats (U3): the
 *  first draws the products lane as a ghost, the second draws it in.
 *  ⚠ The Loop films' month is not on the record: dated late 2025 here,
 *  the owner's to confirm (ADR-156 U3, left open). */
const TIMELINE_LANES: Extract<ArcFigureSpec, { id: "timeline" }>["lanes"] = [
  {
    id: "content",
    label: "Digital content",
    events: [
      { id: "c-first", date: "2023", label: "My first Midjourney image", source: { label: "Vince Buyssens, 2023" } },
      {
        id: "c-sora",
        date: "2024-02",
        label: "A minute of AI video",
        source: { label: "OpenAI, Sora, 15 February 2024", href: "https://openai.com/index/sora/" },
      },
      { id: "c-veo", date: "2025-05", label: "Video with its own sound", source: { label: "Google, Veo 3, I/O 20 May 2025" } },
      { id: "c-loop", date: "2025-11", label: "AI films on paid media", source: { label: "Loop Earplugs creative archive" } },
    ],
  },
  {
    id: "products",
    label: "Digital products",
    events: [
      { id: "p-sketch", date: "2023-03", label: "A sketch becomes a website", source: { label: "OpenAI, GPT-4 livestream, 14 March 2023" } },
      { id: "p-agent", date: "2025-02", label: "An agent in the terminal", source: { label: "Anthropic, Claude Code, 24 February 2025" } },
      { id: "p-imo", date: "2025-07", label: "Gold at the Maths Olympiad", source: { label: "Google DeepMind, IMO 2025, certified" } },
      {
        id: "p-photocraft",
        date: "2026-09",
        label: "Photoshop, rebuilt with Claude",
        source: { label: "PhotoCraft, github.com/storytold/photocraft", href: "https://github.com/storytold/photocraft" },
      },
    ],
  },
];

function uxMeetupTimeline(show: "content" | "both"): ArcFigureSpec {
  return {
    id: "timeline",
    show,
    alt:
      show === "content"
        ? "An isometric timeline from 2023 to 2026. On the front lane, digital content: a first Midjourney image in 2023, a minute of AI video in February 2024, video with sound in May 2025, AI films on paid media in late 2025, each block taller than the last. Behind it, the digital products lane is still a ghost. A gold rail of compute climbs the time edge."
        : "The same isometric timeline with both lanes drawn. Digital products: a sketch becomes a website in March 2023, an agent in the terminal in February 2025, gold at the Maths Olympiad in July 2025, Photoshop rebuilt with Claude in September 2026. Both lanes climb with the gold compute rail.",
    lanes: TIMELINE_LANES,
    rail: {
      label: "Training compute · ×4 to 5 a year",
      source: {
        label: "Epoch AI",
        href: "https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-to-5x-per-year",
      },
    },
    axes: { time: "Time", height: "What it can finish" },
    note: "Height: the task an agent can finish, ×2 every 7 months (METR) · Rail: training compute (Epoch AI)",
  };
}

export const UX_MEETUP_ARC: ArcDef = {
  slug: "thoughtform-ux-meetup",
  leaf: "ux-meetup",
  format: "workshop",
  /* A house arc: no `client`, so it lives at `/arcs/thoughtform/ux-meetup`
     (owner, 2026-10-13). No `theme`, no `worked` anywhere. */
  /* U3 (owner, 2026-10-15): "no movement or travel, just a glitch effect".
     The terminal grammar (ADR-057): every beat parks, its title decodes
     where it stands, nothing slides in. */
  motion: "terminal",
  cardChip: "talk",
  status: "running",
  date: "2026-10-13",
  cardTitle: "UX meetup · talk",
  cardLede:
    "What is left to design once making digital things costs almost nothing: interfaces for and with an intelligence.",
  cardImage: { src: "/images/services/keynote.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · UX Gent · 15 October 2026",
    title: { pre: "AI is", em: "not software." },
    lede: "A talk on what is left to design once making digital things costs almost nothing.",
    actions: [
      { id: "start", label: "The claim", href: "#the-claim", primary: true },
      { id: "proof", label: "The proof", href: "#proof-content" },
    ],
    image: {
      src: "/images/Thoughtform_Key%20Visual_14d.webp",
      alt: "",
      width: 2400,
      height: 1350,
    },
    plate: "gateway",
    curtain: true,
  },
  meta: {
    title: "AI is not software · UX meetup",
    description:
      "A talk for designers: digital content and products become a commodity, and what is left to design is the interface with an intelligence.",
  },
  sections: [
    /* ── U3 (owner, 2026-10-15): the wake-up call, then the proof as an act
       of three drawings on one floor (the content lane, the products lane
       added, then both absorbed by the machine), a voice, the turn to an
       intelligence. Statements glitch in where they stand; nothing slides. */
    {
      id: "the-claim",
      kind: "interstitial",
      variant: "statement",
      /* The wake-up call (U3): it glitches in over the emptied eras. */
      glitch: true,
      menuLabel: "The wake-up call",
      menuPrimary: true,
      eyebrow: "01 · The wake-up call",
      line: {
        pre: "Within two years, all digital content and products",
        em: "will be absorbed.",
      },
    },
    {
      id: "proof-content",
      kind: "figure",
      menuLabel: "Digital content",
      menuPrimary: true,
      head: {
        eyebrow: "02 · The proof · Digital content",
        title: { pre: "What a model could make,", em: "month by month." },
        sub: "Each block stands as tall as the task an agent could finish that month, a length that doubles about every seven months. In 2023, my first strange picture. Now, AI films running as paid media.",
      },
      figure: uxMeetupTimeline("content"),
    },
    {
      id: "proof-products",
      kind: "figure",
      menuLabel: "Digital products",
      head: {
        eyebrow: "03 · The proof · Digital products",
        title: { pre: "The same climb,", em: "in code and in maths." },
        sub: "A sketch became a website, then an agent ran in the terminal, then gold at the Maths Olympiad, then Photoshop rebuilt with Claude. Both lanes rise because the gold rail does: compute grows four to five times a year. Scale beat cleverness again, the bitter lesson.",
      },
      figure: uxMeetupTimeline("both"),
    },
    {
      id: "absorbed",
      kind: "figure",
      menuLabel: "Absorbed",
      head: {
        eyebrow: "04 · Absorbed",
        title: { pre: "The frontier labs", em: "become the interface." },
        sub: "Content and products feed one machine. People stop opening the other software: they ask the model, and their agents use the tools for them. Nobody has to build their own SAP for that to happen.",
      },
      figure: {
        id: "absorption",
        alt: "An isometric machine: two panels on the floor, digital content with images, video, ads and decks, and digital products with code, tools, apps and dashboards, each feeding a ribbon of wires into a housing labelled the frontier labs. On the housing sits the model, the one gold block, and over it the interface; small agents in front are wired up to the interface.",
        panels: [
          { id: "content", label: "Digital content", items: ["Images", "Video", "Ads", "Decks"] },
          { id: "products", label: "Digital products", items: ["Code", "Tools", "Apps", "Dashboards"] },
        ],
        machine: {
          label: "The frontier labs",
          core: "The model",
          interface: "The interface",
          compute: "Compute",
        },
        agents: { label: "Agents", tools: ["Using every other tool for you"] },
      },
    },
    {
      id: "your-tool",
      kind: "interstitial",
      variant: "quote",
      frame: "marks",
      menuLabel: "A voice",
      eyebrow: "05 · Heard in the industry",
      line: {
        pre: "I don\u2019t want to use your agent.",
        em: "I want my agent to use your tool.",
      },
    },
    {
      id: "an-intelligence",
      kind: "figure",
      menuLabel: "An intelligence",
      menuPrimary: true,
      head: {
        eyebrow: "06 · An intelligence",
        title: { pre: "A new kind", em: "of automation." },
        sub: "Every earlier wave automated steps you could write down. This one works wherever there is enough data and the answer can be checked: a logic problem becomes a statistics problem. And nobody knows its limits yet. It is not software. It is an intelligence.",
      },
      figure: {
        id: "logic",
        alt: "On the left, a stair of five steps on one wire: logic, steps you can write down. On the right, a cloud of observations with one gold line fitted through it: statistics, anything with enough data and an answer you can check.",
        logic: { label: "Logic", line: "Steps you can write down: mainframes, spreadsheets, software." },
        statistics: { label: "Statistics", line: "Anything with enough data and an answer you can check." },
        source: {
          label: "Benedict Evans, AI Is Eating the World, hx Live NYC 2026, 24:18",
          href: "https://www.youtube.com/watch?v=EbqiuDtFWxA&t=1458s",
        },
        note: "After Benedict Evans, AI Is Eating the World, hx Live NYC 2026",
      },
    },
  ],
};
