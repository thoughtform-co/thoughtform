import type { ArcDef } from "../types";

import { ITP_WALL_CAPTION, ITP_WALL_MEDIA } from "./shared/in-the-pocket";
import { THREE_WAYS_LOOP } from "./shared/threeWaysLoop";
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
 * ⚠ THE ARGUMENT'S MIDDLE IS THE SHARED RECORDS, AS THEY ARE. 02 · 03 · 04
 * are the stages, the curve and the spectrum at the positions the lecture
 * shows them, so each is the shared object and `arcs-registry` counts this
 * page among their readers. Tom on the Moon's path, bench and wall and In
 * The Pocket's nine sectors are the shared evidence under this page's heads.
 *
 * ⚠ ONE IDEA PER VIEWPORT (ADR-131's law): twelve sections, four chapters
 * in the header (the close is the exit, never a chapter), one picture each,
 * a picture-less section is a beat.
 *
 * ⚠ EVERY LINE BELOW IS A FIRST CUT FROM HIS TWO NOTES OF 11 AND 12 OCTOBER,
 * his to rewrite. What his notes ruled out stays out: the geopolitics, and
 * the jobs-and-unrest tangent.
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
    eyebrow: "Thoughtform · UX meetup · Talk",
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
    /* ── Chapter one · THE CLAIM ───────────────────────────────────────── */
    {
      /* A beat: no picture. */
      id: "the-claim",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "01 · The claim",
      line: {
        pre: "Within two years, digital content and products",
        em: "are a commodity.",
      },
      subline:
        "The cost of making one more drops to almost nothing. In three years we went from bad AI images to full short films, and from reviewing code to having whole tools built.",
    },

    /* ── Chapter two · WHY ─────────────────────────────────────────────────
       The shared records, as they are, at the positions the lecture shows
       them (ADR-143): each runs longer without you, each release finishes
       longer work, and it is a tool and a collaborator at once. */
    THREE_WAYS_LOOP,
    THE_CURVE_BEAT,
    HARD_TO_STEER_BEAT,
    {
      /* A beat: no picture. His own comparison, and its caveat. */
      id: "not-software",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "05 · Not software",
      line: {
        pre: "A commodity like electricity,",
        em: "except this one solves problems.",
      },
      subline:
        "Build more power plants and you can run more machines, but nothing gets solved. Add intelligence and more problems get solved. That is no claim about consciousness; it is what these models visibly do.",
    },

    /* ── Chapter three · WHAT HAPPENED WHEN I TRUSTED IT ───────────────── */
    {
      id: "tom-on-the-moon",
      kind: "path",
      menuLabel: "Tom on the Moon",
      menuPrimary: true,
      head: {
        eyebrow: "06 · Trusting it",
        title: { pre: "Tom on", em: "the Moon." },
        sub: "A brand world for an agency of creators. I gave Claude the brief, the references and a way to check its own frames, and let it run: wide first, then narrow, then one frame the client called perfect.",
      },
      stages: TOM_PATH_STAGES,
      note: TOM_PATH_NOTE,
    },
    {
      id: "tom-skill",
      kind: "bench",
      menuLabel: "The checks",
      head: {
        eyebrow: "07 · The checks",
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
        eyebrow: "08 · At scale",
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
        eyebrow: "09 · Nine briefs, one look",
        title: { pre: "Nine sectors,", em: "one world." },
        sub: "In The Pocket asked for one key visual per sector, from finance to public transport. Two references anchored every draw, so nine briefs came back as one place.",
      },
      media: ITP_WALL_MEDIA,
      caption: ITP_WALL_CAPTION,
    },

    /* ── Chapter four · THE TURN ───────────────────────────────────────── */
    {
      /* A beat: no picture. */
      id: "the-turn",
      kind: "interstitial",
      variant: "question",
      eyebrow: "10 · The turn",
      menuLabel: "The turn",
      menuPrimary: true,
      line: {
        pre: "So what is left to design?",
        em: "The interface is the intelligence.",
      },
      subline:
        "People will build what they need on the fly, inside Claude or ChatGPT, and fix it by saying what is wrong. Features, screens and file formats stop being the scarce part.",
    },
    {
      /* Four cards, two-line titles, no kicker: the grid's own measure on
         these pages (ADR-143), or it runs past one screen at 1280×720. */
      id: "what-is-left",
      kind: "cards",
      menuLabel: "What is left",
      menuPrimary: true,
      columns: 4,
      head: {
        eyebrow: "11 · What is left to design",
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
          body: "Our agents will read what theirs want, and the other way round. Somebody designs how those two meet.",
        },
        {
          id: "physical",
          title: "The things only people make",
          body: "Film, craft and rooms with people in them gain value as the digital part gets cheap.",
        },
      ],
    },

    /* ── Chapter five · THE CLOSE ──────────────────────────────────────── */
    {
      id: "close",
      kind: "close",
      menuLabel: "Thank you",
      head: {
        eyebrow: "12 · Thank you",
        title: { pre: "The most interesting time", em: "to be a designer." },
        sub: "If you build something for a reader that is not a person, send it to me.",
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
