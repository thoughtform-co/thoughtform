import type { ArcDef } from "../types";

import { FRONTIER_CURVE } from "./shared/frontierCurve";
import {
  TOM_ANCHOR_IMAGE,
  TOM_BENCH_EXAMPLE,
  TOM_PATH_NOTE,
  TOM_PATH_STAGES,
  TOM_WALL_CAPTION,
  TOM_WALL_MEDIA,
} from "./shared/tom-on-the-moon";

/**
 * AI storytelling, class one, as an arc: the deck the first class is taught
 * from (ADR-136). The course page (`/arcs/ai-storytelling`) is the term on
 * one track; this is one class, and its station on that track links here.
 *
 * ⚠ THE FLOW IS THE MOIRA WORKSHOP'S SECOND SESSION ("From a prompt to an
 * agent you can trust", 2026-09-29), which the owner wants taught to his
 * students in the same order: a prompt, a tool, an agent; each release
 * finishes longer work; it is hard to steer; we measure it like software;
 * the real question; one piece of work with six questions around it; the
 * two plates you write; person or agent; why it needs the checks; what the
 * market pays for. Then the class's own subject, and the setup.
 *
 * ⚠ THE CASES ARE ABOUT A WORLD, NOT ABOUT CHECKING ERRORS. Moira's bench
 * reads a risk record, a product image and an invoice; this class reads how
 * a brand world was found and written down — Tom on the Moon, the ship's
 * own record, by reference — and puts two more worlds beside it: the
 * practice's own, still being found, and In The Pocket's nine sectors in one
 * look. The tease is the course's assignment: this term the student builds
 * one, and the practice builds Tom on the Moon's configuration to draw
 * theirs for every brief.
 *
 * ⚠ FIVE CHAPTERS, THE REGISTRY CAP: today · the situation · the loop · the
 * world · now you. Every framing figure letters no digit; the counts live in
 * subs and captions. English, like the course page.
 */
export const AI_STORYTELLING_CLASS_1_ARC: ArcDef = {
  slug: "ai-storytelling-class-1",
  format: "workshop",
  cardChip: "course",
  status: "running",
  date: "2026-09-29",
  cardTitle: "AI storytelling · class one",
  cardLede:
    "The first class: what AI is, how it went from a prompt to an agent, and the brand world we build around it this term.",
  cardImage: { src: "/images/services/workshop.webp", alt: "" },
  hero: {
    eyebrow: "Thoughtform · Course · Class one",
    title: { pre: "A world,", em: "not a prompt." },
    lede: "How AI went from answering to running the work, and how you will use that to build a brand world this term.",
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
    title: "AI storytelling, class one · Thoughtform",
    description:
      "Class one of the AI storytelling course: from a prompt to an agent, the intelligence configuration, and the brand world you build this term.",
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
        title: { pre: "What AI is,", em: "and what we build with it." },
        sub: "One class of theory before you touch anything: what this technology is, why it is strange, and how a brand world gets built on it. Then your own setup, and your first images.",
      },
      groups: [
        {
          id: "course",
          label: "The course",
          blurb: "One project, nine classes",
          items: [
            { id: "subject", tag: "Subject", name: "Yourself, or a product from the future" },
            { id: "term", tag: "The term", name: "Nine classes, a gate after each" },
            { id: "gate", tag: "Today's gate", name: "Your first images, filed in your repo" },
          ],
          foot: {
            label: "You launch",
            lines: ["A poster, a website and two films, in the last class."],
          },
        },
        {
          id: "class",
          label: "This class",
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
              tag: "The setup",
              name: "One piece of work, six questions",
              href: "#configuration",
            },
            {
              id: "hours",
              tag: "For hours",
              name: "Why an agent needs the checks",
              href: "#horizon",
            },
            {
              id: "world",
              tag: "A world",
              name: "How Tom on the Moon was found",
              href: "#tom-on-the-moon",
            },
            { id: "you", tag: "Now you", name: "Your accounts, your first images", href: "#setup" },
          ],
          foot: {
            label: "The order",
            lines: ["Navigate, encode, build. You cannot build on what nobody has encoded."],
          },
        },
      ],
    },
    {
      /* Who is teaching, for a room that has not met the practice — and
         why his own brand is the example: the homepage's About, its
         portrait in the drawing's rings, the way the Pandora page carries
         it. Cut first if the deck needs trimming. */
      id: "who",
      kind: "portrait",
      layout: "orbit",
      menuLabel: "Who teaches",
      ariaLabel: "About Vince Buyssens",
      head: {
        eyebrow: "02 · Who is teaching",
        title: { pre: "Vince Buyssens" },
        sub: "Creative technologist · Founder of Thoughtform · Your teacher this term",
      },
      image: { src: "/images/vince-portrait.jpg", alt: "Vince Buyssens, founder of Thoughtform" },
      bio: [
        "For over a decade Vince has worked where digital change lands first: social media, online communities, and now intelligence itself.",
        "AI is not software you command. It is an intelligence you navigate. Through Thoughtform he helps teams build that relationship on their own work, and this course teaches it the same way: on yours, with a gate after every class.",
        "His own brand is the worked example. Thoughtform is a retro-futurist navigation interface for an AI practice, and its world is being built with the method you will use on your own.",
      ],
      meta: [
        { label: "Base", value: "Antwerp · BE" },
        { label: "Teaches", value: "Thomas More" },
        { label: "Also at", value: "Loop Earplugs" },
      ],
    },

    /* ── Chapter two · THE SITUATION ───────────────────────────────────── */
    {
      id: "three-ways",
      kind: "stages",
      menuLabel: "Three ways",
      menuPrimary: true,
      head: {
        eyebrow: "03 · A prompt, a tool, an agent",
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
        eyebrow: "04 · The curve",
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
        eyebrow: "05 · Hard to steer",
        title: {
          pre: "But it is hard to steer,",
          em: "because it is a tool and a collaborator at once.",
        },
        sub: "Sometimes you tell it exactly what to do. Sometimes you explain what you are after and let it work it out. Nothing we worked with before was both.",
      },
      poles: [
        {
          label: "Tool",
          head: "Executes commands",
          lines: [
            "You say exactly what to do",
            "It does that, or fails clearly",
            "You check every result",
          ],
        },
        {
          label: "Collaborator",
          head: "Interprets intent",
          lines: [
            "You explain what you are after",
            "It works out the steps",
            "You agree on what good looks like",
          ],
        },
      ],
      middle: {
        label: "AI sits here",
        head: "Both, at once",
        line: "Neither end is wrong. It is a third skill: brief it, give it room, judge what comes back.",
      },
      bands: { start: "Software", end: "Intelligence" },
    },
    {
      id: "resource",
      kind: "resource",
      menuLabel: "A resource",
      head: {
        eyebrow: "06 · A strange resource",
        title: { pre: "We work with an intelligence,", em: "but measure it like software." },
        sub: "We count it in tokens, the way we count software in seats. Tokens say how much it read and wrote, and nothing about whether the work was any good.",
      },
      columns: ["Resource", "Counted in", "What the count tells you"],
      rows: [
        { id: "people", resource: "People", unit: "Hours", tells: "How long the work took" },
        { id: "money", resource: "Money", unit: "Euros", tells: "What the work cost" },
        { id: "software", resource: "Software", unit: "Seats", tells: "Who can use it" },
        {
          id: "intelligence",
          resource: "Intelligence",
          unit: "Tokens",
          tells: "How much the model read and wrote",
          misses: "Nothing about what it was worth, or whether it worked",
          open: true,
        },
      ],
    },
    {
      /* A beat: no picture, and twenty seconds of silence in the room. */
      id: "real-question",
      kind: "interstitial",
      variant: "question",
      eyebrow: "07 · The real question",
      line: {
        pre: "The real question is:",
        em: "how should intelligence take part in the work?",
      },
      subline:
        "Which model, how many tokens, whether it was any good: every question you will ask about it sits downstream of this one.",
    },
    {
      id: "configuration",
      kind: "questions",
      menuLabel: "The configuration",
      head: {
        eyebrow: "08 · The configuration",
        title: { pre: "One piece of work.", em: "Six questions around it." },
        sub: "The answer is written down, per piece of work. Here it is for a brand world, Tom on the Moon's. This term, two of the six are yours to write.",
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
    {
      id: "leverage",
      kind: "cards",
      menuLabel: "Your two plates",
      columns: 2,
      /* ⚠ NOT "leverage" (Moira's word for this beat): it is on the voice
         skill's post-2022 list and the grader fails the page on it. */
      head: {
        eyebrow: "09 · The two you write",
        title: { pre: "The two plates", em: "only you can write." },
        sub: "The model, the data and the interface are set up for everyone. What it knows and what good looks like can only come from the person who does the work. This term, that is you: written once, in your own words, and it outlives the model.",
      },
      /* ⚠ NO TIPS STRIP, AND ONE-LINE BODIES: with Moira's three chips under
         the two cards the beat ran 915px at 1280×720, the room's own frame,
         against the archetype's one-screen law. The chips' three claims are
         the sub's last sentence now. */
      cards: [
        {
          id: "context",
          kicker: "The context",
          title: "What it knows",
          body: "Your world, written down so a model can read it.",
          metaRows: [
            { label: "Rules", value: "What you always check" },
            { label: "Examples", value: "Good frames, and frames sent back" },
            { label: "Sources", value: "Where the references live" },
          ],
        },
        {
          id: "evals",
          kicker: "The evaluations",
          title: "How you know it is good",
          body: "Real frames, the verdict each must get, and where it stops.",
          metaRows: [
            { label: "Cases", value: "Real frames, with the expected verdict" },
            { label: "Checks", value: "What must be true of every frame" },
            { label: "Gates", value: "Where it stops and asks you" },
          ],
        },
      ],
    },

    /* ── Chapter three · THE LOOP ──────────────────────────────────────── */
    {
      /* The turn, as a beat. The horizon is its proof. */
      id: "person-or-agent",
      kind: "interstitial",
      variant: "question",
      eyebrow: "10 · The turn",
      line: { pre: "Is the workflow for a person,", em: "or for an agent?" },
      subline:
        "A workflow for a person has a person check in at every step. An agent that runs for hours needs the context and the evals instead, and finds the steps itself.",
    },
    {
      id: "horizon",
      kind: "horizon",
      menuLabel: "For hours",
      menuPrimary: true,
      head: {
        eyebrow: "11 · Why it needs checks",
        title: { pre: "It can only work for hours", em: "when it has the context and the evals." },
        sub: "A tool you operate needs you at every step. An agent on a long task checks its work against the evals, retries when it slips, and stops to ask when it should. A wave of images is exactly such a task.",
      },
      axis: { from: "five minutes", to: "half a day" },
      operated: {
        label: "A tool you operate",
        check: "you check",
        steps: 8,
        line: "You check after every step, eight times over.",
      },
      agent: {
        label: "An agent on a long task",
        start: "You set the goal and the checks",
        gates: [
          { kind: "check", at: 0.27, label: "Checks its own work" },
          { kind: "retry", at: 0.52, label: "Steps back and tries again" },
          { kind: "ask", at: 0.77, label: "Stops and asks you" },
        ],
        end: "You judge the result",
      },
      note: "Small slips compound. One slip in twenty every ten minutes leaves a four-hour task about a three-in-ten chance of ending clean. Checks that catch a slip early keep it going.",
    },
    {
      /* Four public sources, dated on each card. Companies and publications
         are named; no person is. */
      id: "signal",
      kind: "signal",
      menuLabel: "The market",
      head: {
        eyebrow: "12 · Where the money goes",
        title: { pre: "The labs just bet billions", em: "on the two things only you can write." },
        sub: "Both labs are paying to put engineers inside companies to write their context down. The teams that write evals are the ones pulling ahead. Both are skills you can start on this week.",
      },
      columns: [
        {
          id: "context",
          plate: "context",
          label: "The context",
          line: "The labs are paying to embed engineers who write a company's way of working down.",
          cards: [
            {
              id: "openai",
              mark: "OpenAI",
              corner: "$10B",
              tag: "Joint venture",
              kicker: "Launch · May 2026",
              title: "OpenAI launches the Deployment Company.",
              dek: [
                { text: "$4B from 19 investment partners", strong: true },
                {
                  text: " at a $10B valuation, and about 150 forward deployed engineers from day one, to build AI into how companies work.",
                },
              ],
              source: "openai.com",
              date: "11 May 2026",
              href: "https://openai.com/index/openai-launches-the-deployment-company/",
            },
            {
              id: "anthropic",
              mark: "Anthropic",
              corner: "$1.5B",
              tag: "Joint venture",
              kicker: "Launch · May 2026",
              title: "Anthropic's $1.5B answer.",
              dek: [
                { text: "With Blackstone, Hellman & Friedman and Goldman Sachs: " },
                { text: "engineers placed inside mid-sized companies", strong: true },
                { text: " to bring Claude into their most important work." },
              ],
              source: "CNBC",
              date: "4 May 2026",
              href: "https://www.cnbc.com/2026/05/04/anthropic-goldman-blackstone-ai-venture.html",
            },
          ],
        },
        {
          id: "evals",
          plate: "evals",
          label: "The evaluations",
          line: "The teams that write down what good looks like are pulling ahead.",
          cards: [
            {
              id: "lennys",
              mark: "Lenny's",
              corner: "35→83%",
              tag: "Hiring · Results",
              kicker: "Newsletter · Sep 2026",
              title: "Nearly half of 25 product job openings ask for evals.",
              dek: [
                { text: "Ramp's receipt matching: " },
                { text: "35% to 83% precision", strong: true },
                { text: ". Shopify's workflow builder: " },
                { text: "2.2× faster, 68% cheaper", strong: true },
                { text: ". Cursor's routing: " },
                { text: "41% lower cost.", strong: true },
              ],
              source: "Lenny's Newsletter",
              date: "22 Sep 2026",
              href: "https://www.lennysnewsletter.com/p/advanced-evals-how-to-find-and-fix",
            },
            {
              id: "claude",
              mark: "Claude",
              corner: "90.5%",
              tag: "Engineering blog",
              kicker: "Engineering · Sep 2026",
              title: "Anthropic automates designing the evals.",
              dek: [
                {
                  text: "Claude interviews you, builds the tests and the grader, and pauses for your approval. On support tickets held back from tuning: ",
                },
                { text: "78.6% to 90.5%", strong: true },
                { text: ", at about a fifth of the cost." },
              ],
              source: "claude.dev",
              date: "28 Sep 2026",
              href: "https://claude.dev/blog/automating-eval-design-and-hillclimbing/",
            },
          ],
        },
      ],
      caption:
        "Four public sources from May to September 2026, dated on each card. The figures are theirs, and none of it is a study.",
    },

    /* ── Chapter four · THE WORLD ──────────────────────────────────────── */
    {
      id: "tom-on-the-moon",
      kind: "path",
      menuLabel: "Tom on the Moon",
      menuPrimary: true,
      head: {
        eyebrow: "13 · A world, found",
        title: { pre: "Tom on", em: "the Moon." },
        sub: "A brand world for an agency of creators, built this way over three weeks: wide first, then narrow, then one frame the client called perfect. Next for them, a configuration that draws this world for every brief. This term, the same method on yours.",
      },
      stages: TOM_PATH_STAGES,
      note: TOM_PATH_NOTE,
    },
    {
      id: "tom-skill",
      kind: "bench",
      menuLabel: "The skill",
      head: {
        eyebrow: "14 · The world as a skill",
        title: { pre: "The world,", em: "written down." },
        sub: "The brief became rules a model reads, and checks it runs on its own frames before anyone looks. This is the template you get in class three; press run.",
      },
      example: TOM_BENCH_EXAMPLE,
    },
    {
      id: "tom-scale",
      kind: "media",
      menuLabel: "At scale",
      head: {
        eyebrow: "15 · At scale",
        title: { pre: "One wave,", em: "on the wall." },
        sub: "Once the world is a skill, the images come in waves, and you judge a wall instead of a picture. Every frame here passed the checks before a person saw it.",
      },
      media: TOM_WALL_MEDIA,
      caption: TOM_WALL_CAPTION,
    },
    {
      /* Two more worlds beside the worked example, one still being found
         and one held across nine subjects. Two cards, not three: the card
         grid falls to two columns at the room's own 1280px and a third
         card orphans there (ADR-131's own measurement). */
      id: "two-more-worlds",
      kind: "cards",
      menuLabel: "Two more worlds",
      columns: 2,
      head: {
        eyebrow: "16 · Two more worlds, one method",
        title: { pre: "Two more worlds,", em: "one method." },
        sub: "References, then the rules, then the checks, then the wave. One closed on an anchor; the other is still being found.",
      },
      /* Two rows a card, the course page's own offer cards' measure: with
         four the beat ran 981px at 1280×720 in the headed capture. */
      cards: [
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
        {
          id: "itp",
          kicker: "In The Pocket",
          title: "Nine sectors, one world",
          body: "Nine sector heroes in one look: the same two references on every draw.",
          image: {
            src: "/arcs/ai-storytelling/itp-ai-readiness-main-visual.webp",
            alt: "In The Pocket's AI readiness campaign: a woman pushing a shopping trolley across a car park at dusk, lit coral against a blue sky",
          },
          metaRows: [
            { label: "The check", value: "The palette holds across the set" },
            { label: "The anchor", value: "The retail hero, on every draw" },
          ],
        },
      ],
    },

    /* ── Chapter five · NOW YOU ────────────────────────────────────────── */
    {
      id: "setup",
      kind: "list-groups",
      menuLabel: "Your setup",
      menuPrimary: true,
      layout: "readout",
      head: {
        eyebrow: "17 · Your setup",
        title: { pre: "Now you", em: "set up." },
        sub: "Three accounts and two folders, once. Everything you make this term lives in them, and nothing lives on a desktop.",
      },
      groups: [
        {
          id: "accounts",
          label: "Your accounts",
          blurb: "Once, today",
          items: [
            { id: "claude", tag: "Claude", name: "The account you think and build in" },
            { id: "github", tag: "GitHub", name: "Where the files live, with a history" },
            { id: "drive", tag: "Drive", name: "Google Drive or Dropbox, for the images" },
          ],
          foot: {
            label: "Why three",
            lines: [
              "The words in a repository, the pixels on a drive, the intelligence in Claude.",
            ],
          },
        },
        {
          id: "folders",
          label: "Your folders",
          blurb: "The shape of the project",
          items: [
            {
              id: "repo",
              tag: "The repo",
              name: "Your world, its rules and its checks",
              href: "#rung-image",
            },
            { id: "images", tag: "The drive", name: "Every frame, kept, even the rejects" },
            { id: "keys", tag: "The keys", name: "In one .env, never on the desktop" },
          ],
          foot: {
            label: "The rule",
            lines: ["Nothing is deleted. A rejected frame is evidence for the next brief."],
          },
        },
      ],
    },
    {
      /* The archetype's first rung, with a student's words: the same four
         rows in the same order, so the room learns the shape once. */
      id: "rung-image",
      kind: "anatomy",
      menuLabel: "One image",
      badge: "Rung one · Image",
      head: {
        eyebrow: "18 · Your first image",
        title: { pre: "Start with", em: "one picture." },
        sub: "One image you find beautiful, and one line about the world it could belong to. Nothing is made from nothing, and that is the first rule.",
      },
      rows: [
        {
          id: "drop",
          label: "Drop in",
          body: "One image you brought: a place, a texture, a light you like.",
        },
        {
          id: "ask",
          label: "Ask",
          body: "Describe the world this belongs to, then draw one frame of it.",
        },
        {
          id: "get",
          label: "You get",
          body: "A first frame, and the words it was drawn from. Keep both.",
        },
        {
          id: "check",
          label: "The check",
          body: "The frame and its words are in your repository, the frame on your drive. That is the gate.",
        },
      ],
    },
    {
      /* A beat: no picture. */
      id: "ambition",
      kind: "interstitial",
      variant: "question",
      eyebrow: "19 · What you could not do",
      line: {
        pre: "The bottleneck is no longer the doing.",
        em: "It is what you dare to ask for.",
      },
      subline:
        "Every stage is within reach this term. What decides the next one is a world you could not draw before, written down with what good looks like.",
    },
    {
      id: "your-turn",
      kind: "anatomy",
      menuLabel: "Your turn",
      badge: "Homework · Class two",
      head: {
        eyebrow: "20 · Your turn",
        title: { pre: "Your world,", em: "in one line each." },
        sub: "Before class two. Write it down badly; the board you build next week will correct it.",
      },
      /* Four rows of one line, the anatomy's own measure: five rows ran
         790px at 1280×720, and four with a wrapped body 742. */
      rows: [
        {
          id: "subject",
          label: "The subject",
          body: "Yourself, or a product from the future, and one sentence on why.",
        },
        {
          id: "place",
          label: "A place, a feeling",
          body: "A place you could stand in, and what a stranger feels there first.",
        },
        {
          id: "reference",
          label: "One reference",
          body: "One image by someone else that already feels like it. Bring the file.",
        },
        {
          id: "never",
          label: "It must never",
          body: "The one thing that would make it somebody else's world.",
        },
      ],
    },
    {
      /* A beat: no picture. Moira's closing lesson in one line. */
      id: "rewarded",
      kind: "interstitial",
      variant: "callout",
      eyebrow: "21 · What gets rewarded",
      line: { pre: "What gets rewarded gets learned.", em: "Even how to fool the grader." },
      subline:
        "Models are trained by grading them, millions of times, and what scores gets reinforced, shortcuts included. The rule holds at your size: check the work, not a report of it, and leave it a way to say it cannot.",
    },
    {
      id: "close",
      kind: "close",
      menuLabel: "Class two",
      head: {
        eyebrow: "22 · Before class two",
        title: { pre: "See you", em: "in class two." },
        sub: "Bring the five lines and the one reference. Next week we build the board your world is read from.",
      },
      actions: [
        { id: "course", label: "The course", href: "/arcs/ai-storytelling", primary: true },
        { id: "mail", label: "vince@thoughtform.co", href: "mailto:vince@thoughtform.co" },
      ],
      footerLine: "Thoughtform · Antwerp · 2026",
      signature: "Vince Buyssens",
    },
  ],
};
