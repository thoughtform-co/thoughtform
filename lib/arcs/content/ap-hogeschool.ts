import type { ArcDef } from "../types";

import { FRONTIER_CURVE } from "./shared/frontierCurve";
import { TOOL_AND_COLLABORATOR } from "./shared/toolAndCollaborator";
import {
  TOM_ANCHOR_IMAGE,
  TOM_BENCH_EXAMPLE,
  TOM_PATH_NOTE,
  TOM_PATH_STAGES,
  TOM_WALL_CAPTION,
  TOM_WALL_MEDIA,
} from "./shared/tom-on-the-moon";

/**
 * The AP Hogeschool guest lecture, THE WORKSHOP'S THIRD CUT (ADR-141).
 *
 * The second cut's spine (ADR-139) with a different tail: the same corridor,
 * the same About, the same era stage and the same Loop proof pile, and then a
 * tail written for a room of students rather than a team that is buying. The
 * owner's brief: show and tell, not technical; his AI story, the films he made
 * at Loop, and concrete brand worlds built with the method.
 *
 * ⚠ THE SPINE ALREADY TELLS THE STORY. Who he is is the About, what he did
 * before is the era stage, the Loop films play from the pile's first card, so
 * none of that is repeated here. The tail begins where the pile ends.
 *
 * ⚠ THE WORLDS ARE THE CLASS-ONE DECK'S, BY REFERENCE (ADR-136). Tom on the
 * Moon's path, bench and wall are the shared records, pinned `toBe` the
 * course's and the class's by the registry; the six-question board is the
 * class's verbatim, because it is Tom on the Moon's record and not this
 * page's. What this page adds is In The Pocket's nine sectors on one wall, a
 * picture the class deck held as one card.
 *
 * ⚠ WHAT WAS CUT, AND WHY. The ground, the resource, the two plates, the turn,
 * the horizon, the market and the whole built chapter are a buyer's beats; a
 * student is not choosing between a shelf of tools and a stack. The horizon is
 * not re-added either: the stages' "a wave: drawn, graded, delivered" is
 * explained three beats later by the bench (graded) and the wall (drawn,
 * delivered), which is why the wall's sub uses those three words.
 *
 * ⚠ ONE IDEA PER VIEWPORT (ADR-131's law): sixteen sections, five chapters,
 * one picture each, a picture-less section is a beat, every section one screen
 * at 1280×720. English, like the spine it hangs off.
 */
export const AP_HOGESCHOOL_ARC: ArcDef = {
  slug: "ap-hogeschool",
  format: "workshop",
  /* No `client` (a lecture, not an engagement), no `theme` (it reads in
     both), no `motion` (reveal is the default), no `worked` anywhere. */
  cardChip: "lecture",
  status: "running",
  date: "2026-10-01",
  cardTitle: "AP Hogeschool · guest lecture",
  cardLede:
    "The story, then three brand worlds built with AI: how each was found, written down and drawn at scale.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · AP Hogeschool · Guest lecture",
    title: { pre: "Building", em: "brand worlds." },
    lede: "How AI went from answering to running the work, and how a brand world gets built on top of it.",
    actions: [
      { id: "start", label: "Today", href: "#today", primary: true },
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
    title: "Building brand worlds · AP Hogeschool",
    description:
      "A guest lecture for AP Hogeschool: how AI went from a prompt to an agent, and three brand worlds built with it.",
  },
  sections: [
    /* ── Chapter one · TODAY ───────────────────────────────────────────── */
    {
      id: "today",
      kind: "list-groups",
      menuLabel: "Today",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "01 · Today",
        title: { pre: "What AI is,", em: "and what gets built with it." },
        sub: "Nothing today you cannot see. What this technology is, why it is strange to work with, and three brand worlds built on it this year, every frame on file.",
      },
      groups: [
        {
          id: "hour",
          label: "This hour",
          blurb: "Where we go",
          items: [
            {
              id: "three",
              tag: "Three ways",
              name: "A prompt, a tool, an agent",
              href: "#three-ways",
            },
            {
              id: "config",
              tag: "One world",
              name: "One piece of work, six questions",
              href: "#configuration",
            },
            {
              id: "worlds",
              tag: "Worlds, built",
              name: "How Tom on the Moon was found",
              href: "#tom-on-the-moon",
            },
            { id: "you", tag: "Now you", name: "Your first world, this week", href: "#this-week" },
          ],
          foot: {
            label: "The order",
            lines: ["Navigate, encode, build. You cannot build on what nobody has written down."],
          },
        },
        {
          id: "worlds",
          label: "The worlds you will see",
          blurb: "All real, all this year",
          items: [
            /* The Loop films play from the proof pile above this tail, which
               is not an arc section, so the row carries no link. */
            { id: "loop", tag: "Loop Earplugs", name: "Two AI films and a studio" },
            {
              id: "tom",
              tag: "Tom on the Moon",
              name: "A world for an agency of creators",
              href: "#tom-on-the-moon",
            },
            { id: "itp", tag: "In The Pocket", name: "Nine sectors, one look", href: "#itp-wall" },
            { id: "tf", tag: "Thoughtform", name: "Still being found", href: "#two-anchors" },
          ],
          foot: {
            label: "The rule",
            lines: ["Every frame you will see was drawn, graded and kept on file."],
          },
        },
      ],
    },

    /* ── Chapter two · THE SITUATION ───────────────────────────────────── */
    {
      id: "three-ways",
      kind: "stages",
      menuLabel: "Three ways",
      menuPrimary: true,
      head: {
        eyebrow: "02 · A prompt, a tool, an agent",
        title: { pre: "A prompt, a tool, an agent.", em: "Each runs longer without you." },
        sub: "Ask it and check every answer. Have it build a tool, and you still run it. Give it the goal and the checks, and it runs for hours while you do other work.",
      },
      axes: { time: "How long, without you", work: "How much of the work" },
      ends: { near: "minutes", far: "half a day", top: "all of it" },
      own: "Tom on the Moon's own",
      stages: [
        {
          id: "prompt",
          label: "A prompt",
          name: "Ask, and check the answer",
          body: "One question, one answer. You do the rest, and you check every one.",
          example: "One image, one prompt at a time",
        },
        {
          id: "tool",
          label: "A tool",
          name: "It builds, you operate",
          body: "It writes the tool. You still press every button, and check the output.",
          example: "A world skill with the rubric inside",
        },
        {
          id: "agent",
          label: "An agent",
          name: "It runs the loop",
          body: "You set the goal and the checks. It runs, checks, retries, and asks.",
          example: "A wave: drawn, graded, delivered",
          lit: true,
        },
      ],
    },
    {
      id: "the-curve",
      kind: "curve",
      menuLabel: "The curve",
      head: {
        eyebrow: "03 · The curve",
        title: { pre: "Each release finishes longer work,", em: "and costs more per token." },
        sub: "Each release makes fewer small mistakes, so it gets further on long and difficult work. And every model has a second dial: how hard it thinks.",
      },
      ...FRONTIER_CURVE,
    },
    {
      id: "between",
      kind: "spectrum",
      menuLabel: "Hard to steer",
      head: {
        eyebrow: "04 · Hard to steer",
        title: {
          pre: "But it is hard to steer,",
          em: "because it is a tool and a collaborator at once.",
        },
        sub: "Sometimes you tell it exactly what to do. Sometimes you explain what you are after and let it work it out. Nothing we worked with before was both.",
      },
      ...TOOL_AND_COLLABORATOR,
    },
    {
      /* A beat: no picture, and twenty seconds of silence in the room. */
      id: "real-question",
      kind: "interstitial",
      variant: "question",
      eyebrow: "05 · The real question",
      line: {
        pre: "The real question is:",
        em: "how should intelligence take part in the work?",
      },
      subline:
        "Which model, how many tokens, whether it was any good: every question you will ever ask about it sits downstream of this one.",
    },

    /* ── Chapter three · ONE WORLD ─────────────────────────────────────── */
    {
      /* Tom on the Moon's record, word for word the class-one deck's
         (ADR-136): the owner's page reads this board, and the one chip it
         derives is Claude in the interface's answer. Only the sub is this
         page's. */
      id: "configuration",
      kind: "questions",
      menuLabel: "The configuration",
      menuPrimary: true,
      head: {
        eyebrow: "06 · The configuration",
        title: { pre: "One piece of work.", em: "Six questions around it." },
        sub: "The answer is written down, per piece of work. Here it is for a brand world, Tom on the Moon's. Two of the six can only come from the people who do the work.",
      },
      work: {
        label: "The work",
        name: "A brand world",
        line: "Tom on the Moon: real creators, made extraordinary by the world they stand on.",
        image: { src: TOM_ANCHOR_IMAGE.src, alt: TOM_ANCHOR_IMAGE.alt },
        bar: {
          label: "Good looks like",
          line: "Every frame reads as the same place, and the client calls it perfect.",
        },
      },
      left: [
        {
          id: "model",
          title: "The model",
          question: "What runs it",
          answer: "An image model, chosen per wave",
        },
        {
          id: "context",
          title: "The context",
          question: "What it knows",
          answer: "The world's vocabulary, as a skill",
          lit: true,
        },
        {
          id: "evals",
          title: "The evaluations",
          question: "How we know it is good",
          answer: "The rubric: gates, a known-good, a known-bad",
          lit: true,
        },
      ],
      right: [
        {
          id: "data",
          title: "The data",
          question: "What it can reach",
          answer: "The brief, the references, the anchor",
        },
        {
          id: "interface",
          title: "The interface",
          question: "Where you meet it",
          answer: "Claude, in a folder you own",
        },
        {
          id: "owner",
          title: "The owner",
          question: "Who answers for it",
          answer: "The client's creative lead decides",
          human: true,
        },
      ],
      tag: "You write this",
      alt: "One piece of work, a brand world, with six questions wired around it: the context and the evaluations lit, the owner in green",
    },

    /* ── Chapter four · WORLDS, BUILT ──────────────────────────────────── */
    {
      id: "tom-on-the-moon",
      kind: "path",
      menuLabel: "Tom on the Moon",
      menuPrimary: true,
      head: {
        eyebrow: "07 · A world, found",
        title: { pre: "Tom on", em: "the Moon." },
        sub: "A brand world for an agency of creators, built this way over three weeks: wide first, then narrow, then one frame the client called perfect. Next for them, a configuration that draws this world for every brief.",
      },
      stages: TOM_PATH_STAGES,
      note: TOM_PATH_NOTE,
    },
    {
      id: "tom-skill",
      kind: "bench",
      menuLabel: "The skill",
      head: {
        eyebrow: "08 · The world as a skill",
        title: { pre: "The world,", em: "written down." },
        sub: "The brief became rules a model reads, and checks it runs on its own frames before anyone looks. Press run: the anchor passes, a vista goes back with a note, and our own Moon is refused.",
      },
      example: TOM_BENCH_EXAMPLE,
    },
    {
      id: "tom-scale",
      kind: "media",
      menuLabel: "At scale",
      head: {
        eyebrow: "09 · At scale",
        title: { pre: "One wave,", em: "on the wall." },
        sub: "Once the world is a skill, the frames come in waves: drawn, graded and delivered while nobody watches, and you judge a wall instead of a picture. Every frame here passed the checks before a person saw it.",
      },
      media: TOM_WALL_MEDIA,
      caption: TOM_WALL_CAPTION,
    },
    {
      /* The client's own words, in his own language; the course page's beat. */
      id: "tom-verdict",
      kind: "interstitial",
      variant: "quote",
      eyebrow: "10 · The verdict",
      line: { pre: "“Amai, dit is echt", em: "een wereld van verschil.”" },
      subline:
        "“Wow, this really is a world of difference. This is perfectly usable.” The client, on the average output of the world skill.",
      attribution: "Christophe · Tom on the Moon · 23 September",
    },
    {
      /* The one picture this page adds: nine briefs held in one look. The
         class deck showed this world as a single card. */
      id: "itp-wall",
      kind: "media",
      menuLabel: "Nine sectors",
      head: {
        eyebrow: "11 · Nine briefs, one look",
        title: { pre: "Nine sectors,", em: "one world." },
        sub: "In The Pocket asked for one hero image per sector, from finance to public transport. The same two references anchored every draw, so nine briefs came back as one place.",
      },
      media: {
        type: "image",
        src: "/arcs/ap-hogeschool/itp-nine-sectors-wall.webp",
        alt: "A wall of nine In The Pocket sector heroes in one look, the retail hero at the centre: finance, government, health, insurance, public transport, social secretariats, telco and utilities around it",
      },
      caption: {
        label: "Nine briefs, one look",
        meta: "Nine sector heroes, signed off in August for the September campaign",
        sourceLabel: "In The Pocket · AI readiness",
      },
    },
    {
      /* Two anchors beside each other, one found and one not: the card grid
         falls to two columns at the room's own 1280px and a third card orphans
         there (ADR-131's own measurement). Two rows a card. */
      id: "two-anchors",
      kind: "cards",
      menuLabel: "Two anchors",
      columns: 2,
      head: {
        eyebrow: "12 · The anchor",
        title: { pre: "Every world", em: "has an anchor." },
        sub: "One approved frame that every later draw is read against. In The Pocket's is the retail hero. Thoughtform's own world is four waves in, and still looking for one.",
      },
      cards: [
        {
          id: "itp",
          kicker: "In The Pocket",
          title: "The retail hero",
          body: "The frame the client approved first. Every sector after it was drawn against this one.",
          image: {
            src: "/arcs/ai-storytelling/itp-ai-readiness-main-visual.webp",
            alt: "In The Pocket's AI readiness campaign: a woman pushing a shopping trolley across a car park at dusk, lit coral against a blue sky",
          },
          metaRows: [
            { label: "The check", value: "The palette holds across the set" },
            { label: "The anchor", value: "The retail hero, on every draw" },
          ],
        },
        {
          id: "thoughtform",
          kicker: "Thoughtform",
          title: "Still being found",
          body: "The gateway is the identity. Four waves in, no frame approved yet.",
          image: {
            src: "/images/Gateway_v1b.webp",
            alt: "The Thoughtform key visual: a ring of gateway stone in the dark",
          },
          metaRows: [
            { label: "The check", value: "The founder's own read: cheap fails" },
            { label: "The anchor", value: "None yet" },
          ],
        },
      ],
    },

    /* ── Chapter five · NOW YOU ────────────────────────────────────────── */
    {
      /* A beat: no picture. */
      id: "ambition",
      kind: "interstitial",
      variant: "question",
      eyebrow: "13 · What you could not do",
      line: {
        pre: "The bottleneck is no longer the doing.",
        em: "It is what you dare to ask for.",
      },
      subline:
        "Every stage you saw today is within reach. What decides the next one is a world you could not draw before, written down with what good looks like.",
    },
    {
      /* A takeaway, not a room exercise: four one-line rows, the anatomy's
         own measure (five rows ran 790px at 1280×720 on the class deck). */
      id: "this-week",
      kind: "anatomy",
      menuLabel: "This week",
      menuPrimary: true,
      badge: "This week",
      head: {
        eyebrow: "14 · Your first world",
        title: { pre: "Your world,", em: "in one line each." },
        sub: "Not homework. One image, one line, one rule and one check, written badly, this week. The second frame tells you whether it is a world.",
      },
      rows: [
        {
          id: "image",
          label: "One image",
          body: "One picture you already love: a place, a texture, a light. Not one you made.",
        },
        {
          id: "line",
          label: "One line",
          body: "The world it belongs to, in a sentence a stranger could draw from.",
        },
        {
          id: "rule",
          label: "One rule",
          body: "The one thing that would make it somebody else's world. Write it as a never.",
        },
        {
          id: "check",
          label: "The check",
          body: "Draw a second frame from the line. If it reads as the same place, you have a world.",
        },
      ],
    },
    {
      /* A beat: no picture. Moira's closing lesson in one line. */
      id: "rewarded",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "15 · What gets rewarded",
      line: { pre: "What gets rewarded gets learned.", em: "Even how to fool the grader." },
      subline:
        "Models are trained by grading them, millions of times, and what scores gets reinforced, shortcuts included. The rule holds at your size: check the work, not a report of it, and leave it a way to say it cannot.",
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Until next time",
      head: {
        eyebrow: "16 · Until next time",
        title: { pre: "Build a world,", em: "and show me." },
        sub: "The frames, the rules and the checks are the whole method. Send me a second frame that reads as the same place as the first.",
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
