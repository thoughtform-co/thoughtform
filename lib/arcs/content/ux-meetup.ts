import type { ArcDef } from "../types";

import { ITP_WALL_CAPTION, ITP_WALL_MEDIA } from "./shared/in-the-pocket";
import {
  TOM_BENCH_EXAMPLE,
  TOM_PATH_NOTE,
  TOM_PATH_STAGES,
  TOM_WALL_CAPTION,
  TOM_WALL_MEDIA,
} from "./shared/tom-on-the-moon";
import { HARD_TO_STEER_BEAT, THE_CURVE_BEAT } from "./shared/workshopFraming";
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
 * ⚠ U1 (2026-10-15, the owner's storyline of the morning of the talk): the
 * tail follows his order. The reality (the claim, why so fast, the clone that
 * is not the threat, the threat), an intelligence (the electricity line, the
 * curve and the spectrum under this talk's heads), what happened when he
 * trusted it (Tom on the Moon, In The Pocket), the two ways out, and what is
 * left to design (the turn, four cards, headless or told), then the close.
 * The prompt-tool-agent stages left: workshop material, and the room has
 * twenty-five minutes.
 *
 * ⚠ THE CURVE AND THE SPECTRUM ARE THE SHARED RECORDS UNDER THIS PAGE'S
 * HEADS, as v3 and Suri's cut turn them: the drawing is the record's, the
 * words the talk's. So this page is no longer a word-for-word reader of
 * either, and `arcs-registry` no longer names it.
 *
 * ⚠ ONE IDEA PER VIEWPORT (ADR-131's law): sixteen sections, the archetype's
 * ceiling, five chapters in the header (the close is the exit, never a
 * chapter), a picture-less section is a beat.
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

export const UX_MEETUP_ARC: ArcDef = {
  slug: "thoughtform-ux-meetup",
  leaf: "ux-meetup",
  format: "workshop",
  /* A house arc: no `client`, so it lives at `/arcs/thoughtform/ux-meetup`
     (owner, 2026-10-13). No `theme`, no `motion`, no `worked` anywhere. */
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
      { id: "world", label: "Tom on the Moon", href: "#tom-on-the-moon" },
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
    /* ── Chapter one · THE REALITY ─────────────────────────────────────────
       The humbling half: the claim, why it goes this fast, the obvious threat
       that is not one, and the one that is. */
    {
      /* A beat: no picture. */
      id: "the-claim",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "The reality",
      menuPrimary: true,
      eyebrow: "01 · The reality",
      line: {
        pre: "Within two years, digital content and products",
        em: "are a commodity.",
      },
      subline:
        "The cost of making one more drops to almost nothing. I made my first Midjourney picture in 2022; this year our AI films ran as paid media, and Claude built whole tools for the teams.",
    },
    {
      /* Four cards, two-line titles, no kicker: the grid's own measure on
         these pages (ADR-143), or it runs past one screen at 1280×720. */
      id: "why-so-fast",
      kind: "cards",
      menuLabel: "Why so fast",
      columns: 4,
      head: {
        eyebrow: "02 · Why so fast",
        title: { pre: "Two labs read", em: "the whole internet." },
        sub: "Two labs read the whole internet and most of human culture, paid almost nothing for it, and now turn it into features faster than any software company can follow.",
      },
      cards: [
        {
          id: "trained",
          title: "Trained on all of it",
          body: "Every picture, codebase and book online went into the models. The social contract around that work was broken, and it is not coming back.",
        },
        {
          id: "weeks",
          title: "A product in a few weeks",
          body: "What a software company puts on a two-year roadmap, Anthropic or OpenAI ships as a feature of the chat window.",
        },
        {
          id: "open",
          title: "Open models follow",
          body: "Give it months, and a model on your own laptop does what the frontier does today. Holding back a release only buys time.",
        },
        {
          id: "utility",
          title: "A utility, like electricity",
          body: "Regulation can slow it down. It will not stop intelligence becoming something you pay for by the meter.",
        },
      ],
    },
    {
      /* A beat: no picture. He shows the clone live, in the browser. */
      id: "rebuilt",
      kind: "interstitial",
      variant: "question",
      menuLabel: "Rebuilt",
      eyebrow: "03 · Rebuilt",
      line: {
        pre: "One person rebuilt an Adobe app and Word,",
        em: "open source, with AI.",
      },
      subline:
        "Up close it is not as good, and no company leaves a subscription for a clone. Bringing new software into a team is hard enough, so this is not where the threat sits.",
    },
    {
      /* A beat: no picture. */
      id: "the-threat",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "The threat",
      eyebrow: "04 · The threat",
      line: {
        pre: "The threat is that nobody",
        em: "opens the other software.",
      },
      subline:
        "People make the image, the film or the deck inside Claude or ChatGPT, turn it into any format, and when something breaks they say so and it gets fixed. Every digital tool gets absorbed into those two windows.",
    },

    /* ── Chapter two · AN INTELLIGENCE ─────────────────────────────────────
       Why this commodity is unlike the others. The curve and the spectrum
       are the shared drawings under this talk's own heads. */
    {
      /* A beat: no picture. His own comparison, and its caveat. */
      id: "not-software",
      kind: "interstitial",
      variant: "callout",
      menuLabel: "Not software",
      menuPrimary: true,
      eyebrow: "05 · Not software",
      line: {
        pre: "A commodity like electricity,",
        em: "except this one solves problems.",
      },
      subline:
        "More power plants run more machines and solve nothing. More intelligence solves more problems. This is no claim about consciousness: trained on our language, it reasons through a problem, and that is what intelligence is.",
    },
    {
      ...THE_CURVE_BEAT,
      menuLabel: "No ceiling yet",
      head: {
        eyebrow: "06 · No ceiling yet",
        title: { pre: "The more intelligent the model,", em: "the more it can finish." },
        sub: "Each release makes fewer small mistakes, so it gets further on long and difficult work. No upper bound has shown up yet: give it a harder problem and it goes further.",
      },
    },
    {
      ...HARD_TO_STEER_BEAT,
      menuLabel: "An intelligence",
      head: {
        eyebrow: "07 · An intelligence",
        title: { pre: "A tool and a collaborator at once:", em: "an intelligence." },
        sub: "Sometimes you tell it exactly what to do. Sometimes you explain what you are after and let it work it out. Nothing we designed for before was both.",
      },
    },

    /* ── Chapter three · WHAT HAPPENED WHEN I TRUSTED IT ───────────────── */
    {
      id: "tom-on-the-moon",
      kind: "path",
      menuLabel: "Tom on the Moon",
      menuPrimary: true,
      head: {
        eyebrow: "08 · Trusting it",
        title: { pre: "Tom on", em: "the Moon." },
        sub: "A brand world for an agency of creators. I gave Claude the brief, the references, a few API keys and a way to check its own frames, and let it run: wide first, then narrow, then one frame the client called perfect.",
      },
      stages: TOM_PATH_STAGES,
      note: TOM_PATH_NOTE,
    },
    {
      id: "tom-skill",
      kind: "bench",
      menuLabel: "The checks",
      head: {
        eyebrow: "09 · The checks",
        title: { pre: "The checks,", em: "written down." },
        sub: "The brief became rules a model reads, and checks it runs on its own frames before anyone looks. Press run: the anchor passes, a vista goes back with a note, and our own Moon is refused.",
      },
      example: TOM_BENCH_EXAMPLE,
    },
    {
      id: "tom-scale",
      kind: "media",
      menuLabel: "At scale",
      head: {
        eyebrow: "10 · At scale",
        title: { pre: "One wave,", em: "on the wall." },
        sub: "Once the world is written down, the frames come in waves: drawn, graded and delivered while nobody watches. You judge a wall instead of a picture.",
      },
      media: TOM_WALL_MEDIA,
      caption: TOM_WALL_CAPTION,
    },
    {
      id: "itp-wall",
      kind: "media",
      menuLabel: "Nine sectors",
      head: {
        eyebrow: "11 · Nine briefs, one look",
        title: { pre: "Nine sectors,", em: "one world." },
        sub: "In The Pocket asked for one key visual per sector, from finance to public transport. Two references anchored every draw, so nine briefs came back as one place.",
      },
      media: ITP_WALL_MEDIA,
      caption: ITP_WALL_CAPTION,
    },

    /* ── Chapter four · TWO WAYS OUT ───────────────────────────────────── */
    {
      id: "two-ways",
      kind: "cards",
      menuLabel: "Two ways out",
      menuPrimary: true,
      columns: 2,
      head: {
        eyebrow: "12 · Two ways out",
        title: { pre: "When making costs nothing,", em: "value moves to the two ends." },
        sub: "As AI takes over most digital content, one end is what only people can make together. The other end is the intelligence itself.",
      },
      cards: [
        {
          id: "authentic",
          kicker: "One end",
          title: "Toward the authentic",
          body: "Cinema is doing well, festivals sell out, investors buy experiences. The slop marks the end of a social media that was dying anyway. Do not compete with AI on the uncanny axis: the harder it tries to be human, the less human it reads.",
        },
        {
          id: "intelligence",
          kicker: "The other end",
          title: "Toward the intelligence",
          body: "Here AI is no longer a tool that makes content but a mind you work with. Nobody has designed for that yet, and that is where this room comes in.",
        },
      ],
    },

    /* ── Chapter five · WHAT IS LEFT TO DESIGN ─────────────────────────── */
    {
      /* A beat: no picture. */
      id: "the-turn",
      kind: "interstitial",
      variant: "question",
      eyebrow: "13 · The turn",
      menuLabel: "The turn",
      menuPrimary: true,
      line: {
        pre: "So what is left to design?",
        em: "The interface is the intelligence.",
      },
      subline:
        "People will build what they need on the fly and fix it by saying what is wrong. Architecture, frontend, backend and the roadmap stop being the scarce part. A Claude page in salmon and serif is a default, and defaults get changed.",
    },
    {
      /* Four cards, two-line titles, no kicker (ADR-143's measure). */
      id: "what-is-left",
      kind: "cards",
      menuLabel: "What is left",
      columns: 4,
      head: {
        eyebrow: "14 · What is left to design",
        title: { pre: "Interfaces for and with", em: "an intelligence." },
        sub: "Most of the field is drawing checkout flows for agents right now. The larger brief sits one level up: how two kinds of mind work together.",
      },
      cards: [
        {
          id: "context",
          title: "What it knows about your work",
          body: "The models are smart enough. What they lack is your context, so someone has to write down what the team knows.",
        },
        {
          id: "checks",
          title: "What good looks like, as checks",
          body: "Taste cannot be written down once. It moves, so the people who have it keep rewriting the checks.",
        },
        {
          id: "language",
          title: "A shared language between minds",
          body: "Our agents will read what theirs want, and the other way round. New economies run on that meeting, and somebody designs it.",
        },
        {
          id: "unconceived",
          title: "Interfaces nobody has drawn yet",
          body: "Built, shown and changed on the fly, for one person and one moment. Most of them will never be a product.",
        },
      ],
    },
    {
      id: "headless-or-told",
      kind: "list-groups",
      menuLabel: "Headless or told",
      layout: "columns",
      head: {
        eyebrow: "15 · Headless or told",
        title: { pre: "Where your story matters,", em: "tell it yourself." },
        sub: "Where your story matters, impose it and encode it deeper than a website. Where it does not, go headless and let people build their own view.",
      },
      groups: [
        /* Told first: the first group is the lit one (`data-lead`), and the
           brand story is the room's side of the line. */
        {
          id: "told",
          label: "Told",
          blurb:
            "Encode the brand deeper than a website, so every intelligence that renders you renders you right.",
          items: [
            { id: "shaders", name: "Shader libraries" },
            { id: "source", name: "A design system shipped as source, the way shadcn does" },
            { id: "motion", name: "Motion and type rules a model reads" },
            { id: "checks", name: "Checks for what is on brand" },
          ],
        },
        {
          id: "headless",
          label: "Headless",
          blurb:
            "Ship the data and the rules, and let each person's intelligence draw the view they need.",
          items: [
            { id: "dashboard", name: "A financial dashboard" },
            { id: "internal", name: "Internal tools" },
            { id: "reporting", name: "Reporting" },
            { id: "settings", name: "Anything a person would rebuild for themselves" },
          ],
        },
      ],
      closing:
        "The range a brand can express itself in has only widened. It asks for a different way of thinking.",
    },

    /* ── The close ─────────────────────────────────────────────────────── */
    {
      id: "close",
      kind: "close",
      menuLabel: "Thank you",
      head: {
        eyebrow: "16 · Thank you",
        title: { pre: "The most interesting time", em: "to be a designer." },
        sub: "Interfaces and experiences nobody has conceived yet are ours to make. If you build one for a reader that is not a person, send it to me.",
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
