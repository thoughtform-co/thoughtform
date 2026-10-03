import type { ArcBenchExample, ArcImage, ArcPathStage, ArcSectionOf } from "../../types";

/**
 * Tom on the Moon — SHARED EVIDENCE (ADR-134 U1, hoisted by ADR-136).
 *
 * The ship's own record (`Arcs_Tom On The Moon`): a brand world for an agency
 * of specialist creators, rebranding to Tom on the Moon. Every frame below is
 * on file there, every date and figure is the eval log's, and every quote is
 * the client's, verbatim. The course page (`/arcs/thoughtform/ai-storytelling`) and the
 * class-one deck (`/arcs/thoughtform/ai-storytelling-class-1`) import these by reference
 * and author only their heads; the registry pins the two pages `toBe` the
 * same records, so the worked example cannot drift between them.
 *
 * Frames come from `scripts/arcs/prep-ai-storytelling-assets.mjs`, which
 * only reads the ship and its Drive folder.
 */

/** The frame the client called perfect, pinned byte for byte in the ship. */
export const TOM_ANCHOR_IMAGE: ArcImage & { width: number; height: number } = {
  src: "/arcs/ai-storytelling/anchor-r1-chic-glazing.webp",
  alt: "A creative in white at the glazing of a concrete studio, the region's tower outside",
  width: 1045,
  height: 1400,
};

/** How the world was found: wide, then narrow, then one frame. */
export const TOM_PATH_STAGES: readonly ArcPathStage[] = [
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
    images: [TOM_ANCHOR_IMAGE],
    line: "“That could be a real creative; the way she stands, the clothes.”",
  },
];

export const TOM_PATH_NOTE =
  "Wide first, then narrow. Every frame here was drawn, graded and kept on file.";

/** The world as a skill: three frames from the record, as the checks read them. */
export const TOM_BENCH_EXAMPLE: ArcBenchExample = {
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
        image: TOM_ANCHOR_IMAGE,
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
      brief: "A creator working on a slab of rock by the water, the moon large over the shore.",
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
        image: { ...TOM_ANCHOR_IMAGE, alt: "" },
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
};

/** One wave as it went to the client: every keeper of wave 23 on one wall. */
export const TOM_WALL_MEDIA: ArcSectionOf<"media">["media"] = {
  type: "image",
  src: "/arcs/ai-storytelling/wall-wave-23-keepers.webp",
  alt: "A wall of Tom on the Moon frames: creatives at work in the Mineral Dunes and the Living Arches",
};

export const TOM_WALL_CAPTION: ArcSectionOf<"media">["caption"] = {
  label: "Wave 23, as delivered",
  meta: "108 of the 114 frames on the client's page, from 165 drawn and graded",
  sourceLabel: "Tom on the Moon · key visuals",
};
