import type { ArcDef } from "../types";

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
       The ship's own record (`Arcs_Tom On The Moon`): a brand world for an
       agency of specialist creators, rebranding to Tom on the Moon. Every
       frame below is on file there, every date and figure is the eval log's,
       and every quote is the client's, verbatim. */
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
      stages: [
        {
          id: "directions",
          date: "31 August",
          label: "Directions",
          name: "Four ways to read the brief",
          weight: 1.5,
          images: [
            {
              src: "/arcs/ai-storytelling/dir-a-garden-moon.webp",
              alt: "Garden Moon: a woman picking fruit off a trunk, a second body in the sky",
              width: 900,
              height: 604,
            },
            {
              src: "/arcs/ai-storytelling/dir-b-infrared.webp",
              alt: "Infrared: crimson growth and lime channels, a lone figure on the flat",
              width: 900,
              height: 604,
            },
            {
              src: "/arcs/ai-storytelling/dir-c-graphic-novel.webp",
              alt: "Graphic-novel grade: a man in red by a terraced hollow",
              width: 900,
              height: 502,
            },
            {
              src: "/arcs/ai-storytelling/dir-d-space-rebels.webp",
              alt: "Space Rebels: a man against a teal wall, a pale disc of plates behind him",
              width: 725,
              height: 900,
            },
          ],
        },
        {
          id: "worlds",
          date: "1 to 4 September",
          label: "Worlds",
          name: "Ten worlds, the same walk in each",
          weight: 3.75,
          images: (
            [
              ["01-rose-garden", "Rose Garden"],
              ["02-infrared", "Infrared"],
              ["03-rose-script", "Rose Script"],
              ["04-mirrorlight", "Mirrorlight"],
              ["05-furnished", "The Furnished World"],
              ["06-nightside", "Nightside"],
              ["07-seam-ice", "Seam Ice"],
              ["08-sulphur-field", "Sulphur Field"],
              ["09-amber-still", "Amber Still"],
              ["10-tideline", "Tideline"],
            ] as const
          ).map(([file, name]) => ({
            src: `/arcs/ai-storytelling/world-${file}.webp`,
            alt: `${name}: two colleagues walking through the world`,
            width: 720,
            height: 483,
          })),
        },
        {
          id: "regions",
          date: "15 September",
          label: "One planet",
          name: "Two regions: the Mineral Dunes and the Living Arches",
          weight: 1.1,
          images: [
            {
              src: "/arcs/ai-storytelling/region-r1-mineral-dunes.webp",
              alt: "The Mineral Dunes: a creative at a laptop, crimson strata through the glazing",
              width: 1400,
              height: 939,
            },
            {
              src: "/arcs/ai-storytelling/region-r2-living-arches.webp",
              alt: "The Living Arches: a designer at a desk under adobe arches",
              width: 1400,
              height: 939,
            },
          ],
        },
        {
          id: "anchor",
          date: "15 September",
          label: "The anchor",
          name: "The frame the client called perfect",
          weight: 1.3,
          images: [
            {
              src: "/arcs/ai-storytelling/anchor-r1-chic-glazing.webp",
              alt: "A creative in white at the glazing of a concrete studio, the region's tower outside",
              width: 1045,
              height: 1400,
            },
          ],
          line: "“That could be a real creative; the way she stands, the clothes.”",
        },
      ],
      note: "Wide first, then narrow. Every frame here was drawn, graded and kept on file.",
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
      example: {
        id: "tom-on-the-moon",
        task: "Reads a frame against the world's own rules and answers four named questions about it.",
        checks: [
          {
            id: "moon",
            label: "The moon",
            line: "A moon that reads as a body in the sky: never our own Moon, never a ball.",
          },
          {
            id: "world",
            label: "Another world",
            line: "Alive and not Earth: no recoloured landmark, no bunker, no desert through the window.",
          },
          {
            id: "person",
            label: "A real creator",
            line: "A working professional at ease, in ordinary clothes. No costume, no astronaut.",
          },
          {
            id: "focus",
            label: "No cut-out",
            line: "No sharp person pasted on a blurred backdrop: one focal plane, front to back.",
          },
        ],
        inputs: [
          {
            id: "anchor",
            label: "The anchor",
            brief:
              "A creative in a concrete studio, the region through the glass. The frame the client called perfect.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/ai-storytelling/anchor-r1-chic-glazing.webp",
                alt: "A creative in white at the glazing of a concrete studio, the region's tower outside",
                width: 1045,
                height: 1400,
              },
              regions: [
                { label: "The creator", check: "person", left: 38, top: 31, width: 23, height: 57 },
                { label: "The world", check: "world", left: 61, top: 16, width: 38, height: 60 },
              ],
            },
            results: [
              {
                check: "moon",
                state: "pass",
                note: "No sky in frame: the region arrives through the glass.",
              },
              {
                check: "world",
                state: "pass",
                note: "The region's tower and its growth, through the window.",
              },
              {
                check: "person",
                state: "pass",
                note: "Could be a real creative: the way she stands, the clothes.",
              },
              {
                check: "focus",
                state: "pass",
                note: "The glass lays her reflection over the view; nothing is blurred.",
              },
            ],
            verdict: {
              state: "pass",
              label: "Ships",
              line: "Pinned as the anchor every later wave is read against.",
            },
            actions: ["Kept byte for byte in the skill's references."],
          },
          {
            id: "vista",
            label: "A vista",
            brief:
              "The region from outside: the retreat, the lime vein, a walker, and the moon drawn small.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/ai-storytelling/flag-r1-vista-shaded-moon.webp",
                alt: "A concrete retreat on pale dunes with crimson growth, a small moon in a blue sky",
                width: 1400,
                height: 781,
              },
              regions: [
                { label: "The moon", check: "moon", left: 17, top: 6, width: 10, height: 20 },
                { label: "The world", check: "world", left: 50, top: 2, width: 49, height: 50 },
              ],
            },
            results: [
              {
                check: "moon",
                state: "review",
                note: "Read closely it is a shaded ball: the client's own word, a marble.",
              },
              {
                check: "world",
                state: "pass",
                note: "The retreat, the pool and the lime vein: plainly this region.",
              },
              { check: "person", state: "pass", note: "One walker, small, at home in the view." },
              { check: "focus", state: "pass", note: "Sharp from the rock to the retreat." },
            ],
            verdict: {
              state: "review",
              label: "Back with a note",
              line: "Keep the world, redraw the moon: flatter, and part of the sky.",
            },
            actions: ["Redrawn with the moon's size and place pinned in the prompt."],
          },
          {
            id: "our-moon",
            label: "Our own Moon",
            brief:
              "A creator working on a slab of rock by the water, the moon large over the shore.",
            output: {
              kind: "image",
              image: {
                src: "/arcs/ai-storytelling/fail-our-own-moon.webp",
                alt: "A woman with a laptop on a rock by pale water, a large mint moon above",
                width: 1400,
                height: 939,
              },
              regions: [
                { label: "Our Moon", check: "moon", left: 66, top: 4, width: 13, height: 20 },
                { label: "The creator", check: "person", left: 56, top: 28, width: 20, height: 38 },
              ],
            },
            results: [
              {
                check: "moon",
                state: "block",
                note: "The seas of our own Moon at full size, only tinted mint.",
              },
              {
                check: "world",
                state: "pass",
                note: "The shore and the mineral crust read as another world.",
              },
              {
                check: "person",
                state: "pass",
                note: "A creator at work, weight on the rock, unhurried.",
              },
              { check: "focus", state: "pass", note: "Sharp from the rock to the far shore." },
            ],
            verdict: {
              state: "block",
              label: "Does not ship",
              line: "Our own Moon in costume. Describe the body by its shape, never by its name.",
            },
            actions: ["Stays in the wave folder, marked, as evidence for the next brief."],
          },
        ],
        skill: {
          folder: "tom-on-the-moon/",
          files: [
            {
              name: "SKILL.md",
              line: "The world in words: the ground, the growth, the light, the moon, and the people in it.",
            },
            {
              name: "evals/",
              line: "The rubric, and every verdict on file: what passed, what was flagged, what failed and why.",
            },
            {
              name: "references/anchor.png",
              line: "The frame the client approved, pinned so every later wave is read against it.",
              image: {
                src: "/arcs/ai-storytelling/anchor-r1-chic-glazing.webp",
                alt: "",
                width: 1045,
                height: 1400,
              },
            },
            {
              name: "brief/vocabulary.md",
              line: "The client's own words for what was wrong, decoded into rules a model can follow.",
            },
          ],
        },
        rules: [
          {
            band: "fixed",
            check: "moon",
            line: "Our own Moon is a fail on sight, read at four times the size.",
          },
          {
            band: "fixed",
            check: "person",
            line: "No uniforms, no spacesuits, no astronauts: the client named them, so they are a list.",
          },
          {
            band: "adapt",
            check: "world",
            line: "Another world is judged, not listed: alive, not Earth, not a place a camera has been.",
          },
          {
            band: "adapt",
            check: "focus",
            line: "Blur is allowed on a moving hand, never behind a person standing still.",
          },
          {
            band: "free",
            line: "The season, the time of day and the mood. Nobody checks them, and nobody should.",
          },
        ],
        cases: [
          {
            id: "anchor",
            label: "The anchor",
            line: "Pinned byte for byte. Every new wave has to pass where this frame passes.",
            expect: "pass",
            checks: ["moon", "world", "person", "focus"],
          },
          {
            id: "landmark",
            label: "The landmark",
            line: "An alien monolith came back as Uluru, seven times in twenty-four. It has to fail.",
            expect: "block",
            checks: ["world"],
          },
          {
            id: "bunker",
            label: "The bunker",
            line: "Unnamed grey rock drew an Earth coastal bunker, eight times in eight. It has to fail.",
            expect: "block",
            checks: ["world"],
          },
          {
            id: "marble",
            label: "The marble",
            quote: "knikker",
            line: "A moon drawn as a shaded ball, in the client's own word. It goes back for a redraw.",
            expect: "review",
            checks: ["moon"],
          },
        ],
        record:
          "From the Tom on the Moon key visuals: the checks, the verdicts and the frames are the engagement's own record.",
      },
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
      media: {
        type: "image",
        src: "/arcs/ai-storytelling/wall-wave-23-keepers.webp",
        alt: "A wall of Tom on the Moon frames: creatives at work in the Mineral Dunes and the Living Arches",
      },
      caption: {
        label: "Wave 23, as delivered",
        meta: "108 of the 114 frames on the client's page, from 165 drawn and graded",
        sourceLabel: "Tom on the Moon · key visuals",
      },
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
