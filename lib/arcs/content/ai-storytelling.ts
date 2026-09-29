import type { ArcDef } from "../types";

import {
  TOM_BENCH_EXAMPLE,
  TOM_PATH_NOTE,
  TOM_PATH_STAGES,
  TOM_WALL_CAPTION,
  TOM_WALL_MEDIA,
} from "./shared/tom-on-the-moon";

/**
 * AI storytelling, as an arc: the nine-week course's syllabus, the page the
 * students open and the one it is taught from (ADR-132, re-cut by ADR-134).
 *
 * ⚠ THE COURSE IS ONE PICTURE (ADR-134, owner 2026-09-29). The first cut drew
 * one `anatomy` section per week, nine in a row with the same four rows, and
 * the owner read it as "a glorified PowerPoint". The weeks are ONE `syllabus`
 * track now: the two ways in, nine stations under the house arc's phases, a
 * gate after each, and what is launched at the end; the open station's sheet
 * carries the four rows (objective, you make, the gate, the tool) once.
 *
 * ⚠ THE ORDER IS THE OWNER'S NOTE ("AI Storytelling Course", Wispr Flow,
 * 2026-09-29): theory and setup, the world, the offer, the poster, the
 * website, the films, the launch. Photographing yourself into the world rides
 * the world-skill class rather than taking one of its own, and the website
 * takes one class and the films two (owner, same day). Motion still comes
 * last on purpose: by then the world has rules a film can obey.
 *
 * One project for the whole term, the student's choice of subject: a brand
 * world around themselves, or around a fictional futuristic product (first
 * years may have no practice of their own yet, and a product from the future
 * makes it easy to be bold).
 *
 * ⚠ THE WORKED EXAMPLE IS SHARED (ADR-136). Tom on the Moon's path, bench
 * and wall are `shared/tom-on-the-moon.ts`, imported by reference here and
 * on the class-one deck (`/arcs/ai-storytelling-class-1`), which class one's
 * station links to; the registry pins the two pages to the same records.
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
    "Nine weeks to build a brand world with AI, yours or a product's, and launch it with a poster, a website and two films.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Course · AI storytelling",
    title: { pre: "Build a world,", em: "then launch it." },
    lede: "One brand world all term, yours or a product's, made with AI and launched with a poster, a website and two films.",
    actions: [
      { id: "start", label: "The course", href: "#course", primary: true },
      { id: "example", label: "Tom on the Moon", href: "#tom-on-the-moon" },
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
      "A nine-week course: build a brand world with AI and launch it with a poster, a website and two films.",
  },
  sections: [
    /* ── The course, on one track ────────────────────────────────────── */
    {
      id: "course",
      kind: "syllabus",
      menuLabel: "The course",
      menuPrimary: true,
      head: {
        eyebrow: "The course",
        title: { pre: "From setup", em: "to launch." },
        sub: "One brand world all term, around yourself or a product from the future. Every class ends on a gate you can see from the start.",
      },
      entry: { label: "Two ways in", ways: ["Yourself", "A product from the future"] },
      phases: [
        { id: "navigate", label: "Navigate" },
        { id: "encode", label: "Encode" },
        { id: "build", label: "Build" },
        { id: "launch", label: "Launch" },
      ],
      classes: [
        {
          id: "what-ai-is",
          phase: "navigate",
          name: "What AI is",
          glyph: "setup",
          objective:
            "Understand what you are working with: why it answers differently every time, and why you steer it rather than command it.",
          make: "A Claude account, a GitHub repository and a shared drive, connected, and your first images.",
          gate: "Your first images are generated and filed in your own repository.",
          tool: "Claude, GitHub, Google Drive or Dropbox.",
          /* The class's own deck (ADR-136): the Moira second session's flow,
             with the brand world as its subject. */
          page: { label: "Class one, the deck", href: "/arcs/ai-storytelling-class-1" },
        },
        {
          id: "your-world",
          phase: "navigate",
          name: "Your world",
          glyph: "board",
          objective: "Decide what your world looks and feels like, before the AI decides for you.",
          make: "A reference board, the styles you are after, and a name that belongs to nobody else.",
          gate: "Someone else can describe your world from the board alone.",
          tool: "Your own eyes first, then Claude to research and challenge the references.",
          example: {
            label: "Tom on the Moon: four directions to one world",
            href: "#tom-on-the-moon",
          },
        },
        {
          id: "world-skill",
          phase: "encode",
          name: "The world skill",
          glyph: "wall",
          objective:
            "Write your world down as a skill with its own checks, so it can make images at scale.",
          make: "A world skill from the eval template, a first batch of images, and yourself or your product photographed into the world.",
          gate: "Twenty images that pass your own checks, and the rejects you learned from.",
          tool: "The eval template, Claude, an image model and a camera.",
          example: { label: "Tom on the Moon: the world as a skill", href: "#tom-skill" },
        },
        {
          id: "the-offer",
          phase: "encode",
          name: "The offer",
          glyph: "offer",
          objective:
            "Find the emotional truth of your world, then say what your brand does inside it.",
          make: "A one-line offer in the world's own voice, and three mockups where it meets the world.",
          gate: "The offer and the world read as one brand, not two.",
          tool: "Claude as your strategist and your critic, and your world skill.",
          example: { label: "Tom on the Moon: from a feeling to an offer", href: "#tom-offer" },
        },
        {
          id: "the-poster",
          phase: "build",
          name: "The poster",
          glyph: "poster",
          objective: "Choose rather than generate: land on the image that carries the world.",
          make: "One to three key visuals, and one of them printed.",
          gate: "The printed poster holds up on the wall, in the crit.",
          tool: "Your world skill, and a printer.",
        },
        {
          id: "the-website",
          phase: "build",
          name: "The website",
          glyph: "site",
          objective: "Build a page that is the world, not a page about it.",
          make: "A landing page in plain HTML with your key visuals and your offer, online.",
          gate: "It runs, it reads on a phone, and nothing on it is placeholder.",
          tool: "Claude, GitHub and a browser.",
        },
        {
          id: "launch-film",
          phase: "build",
          name: "The launch film",
          glyph: "film",
          objective: "Direct a short launch film about your offer that obeys the world's rules.",
          make: "A stop-motion launch spot, fifteen to thirty seconds long.",
          gate: "Every frame belongs to the world, and the offer is clear by the end.",
          tool: "Claude, a video model and your world skill.",
        },
        {
          id: "second-film",
          phase: "build",
          name: "The second film",
          glyph: "film",
          objective: "Make a film about the brand's personality rather than what it sells.",
          make: "A second film in the motion of your choice: stop motion, motion design, or yourself filmed into the world.",
          gate: "It could only be your brand.",
          tool: "What the launch film taught you, pushed further.",
        },
        {
          id: "launch",
          phase: "launch",
          name: "Launch",
          glyph: "launch",
          objective:
            "Show your world as one thing, with its offer, to people who have not seen it before.",
          make: "The launch: the poster, the website and both films, presented in class.",
          gate: "A stranger understands what you do, and wants to see more.",
          tool: "Everything you built, and nothing new.",
        },
      ],
      launch: { label: "You launch", items: ["A poster", "A website", "Two films"] },
      note: "Every class ends on a gate. The class is done when its gate is met, not when the bell goes.",
    },

    /* ── The worked example: Tom on the Moon ─────────────────────────────
       The ship's own record, shared by reference with the class-one deck
       (`shared/tom-on-the-moon.ts`): every frame is on file there, every
       date and figure is the eval log's, and every quote is the client's. */
    {
      id: "tom-on-the-moon",
      kind: "path",
      menuLabel: "Tom on the Moon",
      menuPrimary: true,
      head: {
        eyebrow: "Worked example · Tom on the Moon",
        title: { pre: "Tom on", em: "the Moon." },
        sub: "A brand world for an agency of creators. Their line was “Supernatural, above natural”: real people, made extraordinary by the world they stand on. This is how the world was found.",
      },
      stages: TOM_PATH_STAGES,
      note: TOM_PATH_NOTE,
    },
    {
      id: "tom-skill",
      kind: "bench",
      menuLabel: "The skill",
      head: {
        eyebrow: "Tom on the Moon · the world as a skill",
        title: { pre: "The world,", em: "written down." },
        sub: "The brief became rules a model reads, and checks it runs on its own frames before anyone looks. Three frames from the record, as the checks read them.",
      },
      example: TOM_BENCH_EXAMPLE,
    },
    {
      id: "tom-scale",
      kind: "media",
      menuLabel: "At scale",
      head: {
        eyebrow: "Tom on the Moon · at scale",
        title: { pre: "One wave,", em: "on the wall." },
        sub: "Once the world is a skill, the images come in waves, and you judge a wall instead of a picture. This is one wave as it went to the client.",
      },
      media: TOM_WALL_MEDIA,
      caption: TOM_WALL_CAPTION,
    },
    {
      id: "tom-offer",
      kind: "cards",
      menuLabel: "The offer",
      columns: 2,
      head: {
        eyebrow: "Tom on the Moon · the offer",
        title: { pre: "From a feeling", em: "to an offer." },
        sub: "A world is an emotional truth. It never has to show what the brand sells; it has to feel like the place where that work gets done.",
      },
      cards: [
        {
          id: "tom",
          kicker: "Tom on the Moon",
          title: "A hub for creators",
          body: "Copywriters, designers, video makers. The world never shows their service; it shows them at work, extraordinary because of where they stand.",
          image: {
            src: "/arcs/ai-storytelling/offer-tom-creative-table.webp",
            alt: "A creative at a laptop in a concrete studio, crimson strata through the glazing",
          },
          metaRows: [
            { label: "The world", value: "Supernatural, above natural" },
            { label: "The offer", value: "A network of specialist creators" },
          ],
        },
        {
          id: "thoughtform",
          kicker: "Thoughtform",
          title: "A navigation interface",
          body: "A retro-futurist instrument for an AI practice. It does not look like consultancy, and in a market where everything looks the same, that is the point.",
          image: {
            src: "/images/Gateway_v1b.webp",
            alt: "The Thoughtform key visual: a ring of gateway stone in the dark",
          },
          metaRows: [
            { label: "The world", value: "A retro-futurist navigation interface" },
            { label: "The offer", value: "Teams that run AI themselves" },
          ],
        },
      ],
    },
    {
      /* A beat: no picture. Christophe on the key-visuals call of 23 September,
         verbatim from the transcript (brief/BRIEF.md in the ship). */
      id: "tom-verdict",
      kind: "interstitial",
      variant: "quote",
      line: { pre: "“Amai, dit is echt", em: "een wereld van verschil.”" },
      subline:
        "“Wow, this really is a world of difference. This is perfectly usable.” The client, on the average output of the world skill.",
      attribution: "Christophe · Tom on the Moon · 23 September",
    },

    /* ── Before we start ─────────────────────────────────────────────── */
    {
      id: "close",
      kind: "close",
      menuLabel: "Before we start",
      head: {
        eyebrow: "Before the first class",
        title: { pre: "See you", em: "in class one." },
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
