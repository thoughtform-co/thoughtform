import type { ArcHead } from "@/lib/arcs/types";

/**
 * The case's own bodies: Prompt to Loop's twelve chapters as data, in the
 * breakdown's words (the owner's artifact, 1 October 2026). The setup is the
 * arc's `stack` beat and lives in the record; everything here is one case,
 * so it stays beside the route that draws it.
 *
 * Frames are the loop's own: 240 at 24 a second, one beat every 10.
 */

export const FRAMES = 240;

export interface Chapter {
  id: string;
  menuLabel: string;
  head: ArcHead;
}

const ch = (id: string, menuLabel: string, n: string, kick: string, pre: string, em: string, sub: string): Chapter => ({
  id,
  menuLabel,
  head: { eyebrow: `${n} · ${kick}`, title: { pre, em }, sub },
});

export const CHAPTERS = {
  film: ch(
    "film",
    "The film",
    "00",
    "The film",
    "Ten seconds,",
    "looping forever.",
    "A stop-motion Halloween ad for Loop Experience 2 Gold, made in one evening from one message."
  ),
  runs: ch(
    "runs",
    "How it runs",
    "02",
    "How it runs",
    "Claude picks the skill.",
    "You make the call.",
    "It follows the skill's steps, checks its own work, and hands you the decision."
  ),
  ask: ch(
    "ask",
    "Ask",
    "03",
    "The ask",
    "You send one message.",
    "Claude asks four questions.",
    "Each one comes with a recommended answer. You click, and the work starts."
  ),
  look: ch(
    "look",
    "Look",
    "04",
    "Look first",
    "Look before drawing.",
    "Your ads first, then the world.",
    "Loop's own approved ads set the rules. Outside trends set the mood."
  ),
  idea: ch(
    "idea",
    "Idea",
    "05",
    "The idea",
    "One idea, one hinge.",
    "The earplug is the O.",
    "A matte paper world. The only shiny, real thing in it is the product."
  ),
  plan: ch(
    "plan",
    "Plan",
    "06",
    "The plan",
    "Every beat on a frame.",
    "Before anything moves.",
    "The tempo was picked so the maths is exact. Cuts land where the music really hits."
  ),
  stuff: ch(
    "ingredients",
    "Ingredients",
    "07",
    "Ingredients",
    "Generate a little.",
    "Never redraw the product.",
    "Only paper and sound were generated. Everything else is code, or Loop's own files."
  ),
  make: ch(
    "make",
    "Make",
    "08",
    "Making it",
    "Drawn in code, frame by frame.",
    "Like stop-motion on a table.",
    "No video model. Code draws all 240 frames, the same way every time."
  ),
  sound: ch(
    "sound",
    "Sound",
    "09",
    "Sound",
    "The claim, made audible.",
    "Noise drops 17 dB.",
    "The moment the earplug lands. The music keeps playing, clear, and every effect lands on its frame."
  ),
  check: ch(
    "check",
    "Check",
    "10",
    "Check",
    "Look. Fix. Look again.",
    "Nine rounds of stills.",
    "Code measures, an AI viewer watches, and the person who asked decides."
  ),
  cost: ch(
    "cost",
    "Cost",
    "11",
    "Cost",
    "About $27.",
    "Mostly Claude.",
    "The evening of 1 October, at published prices. No video model, so no video bill."
  ),
  next: ch(
    "next",
    "Next time",
    "12",
    "Next time",
    "Now it's a skill.",
    "Just ask.",
    "Everything on this page is written down in one skill, in the studio's plugin. Open a chat and say what you want."
  ),
} as const satisfies Record<string, Chapter>;

/** The skill's nine steps, the spine of part two. */
export const STEPS = [
  "Ask",
  "Look",
  "Idea",
  "Plan",
  "Ingredients",
  "Make",
  "Sound",
  "Check",
  "Cost",
] as const;

/** The page's reading order: record sections and case chapters, interleaved. */
export const PORTFOLIO_RUN = [
  "film",
  "the-skill",
  "setup",
  "runs",
  "the-video",
  "ask",
  "look",
  "idea",
  "plan",
  "ingredients",
  "make",
  "sound",
  "the-check",
  "check",
  "cost",
  "next",
  "close",
] as const;

/** The index on the film beat: each step's chapter, in order. */
export const INDEX = [
  { n: "01", label: "Setup", href: "#setup" },
  { n: "02", label: "How it runs", href: "#runs" },
  { n: "03", label: "Ask", href: "#ask" },
  { n: "04", label: "Look", href: "#look" },
  { n: "05", label: "Idea", href: "#idea" },
  { n: "06", label: "Plan", href: "#plan" },
  { n: "07", label: "Ingredients", href: "#ingredients" },
  { n: "08", label: "Make", href: "#make" },
  { n: "09", label: "Sound", href: "#sound" },
  { n: "10", label: "Check", href: "#check" },
  { n: "11", label: "Cost", href: "#cost" },
  { n: "12", label: "Next time", href: "#next" },
] as const;

/** The loop's scenes on its 240 frames (the plan's timeline). */
export const SCENES = [
  { name: "BOO", from: 0, to: 44, tone: "black" },
  { name: "", from: 44, to: 50, tone: "dive" },
  { name: "Haunted raves", from: 50, to: 80, tone: "orange" },
  { name: "House parties", from: 80, to: 108, tone: "violet" },
  { name: "AAAAH", from: 108, to: 120, tone: "black" },
  { name: "Less ringing", from: 120, to: 160, tone: "black" },
  { name: "Endcard", from: 160, to: 234, tone: "violet" },
  { name: "", from: 234, to: 240, tone: "dive" },
] as const;

/** Camera hits, each on a measured kick. */
export const KICKS = [0, 20, 50, 80, 90, 100, 120, 130, 160, 180, 210] as const;

/** Every effect hit, each on its frame: 19 sounds, some placed twice. */
export const FX = [
  0, 12, 20, 21, 23, 32, 50, 52, 60, 70, 78, 80, 84, 90, 104, 106, 110, 120, 122, 130, 140, 158,
  160, 167, 172, 188, 221, 235,
] as const;

/** The noise bed, frame → level (0 floor, 1 loudest); it falls 17 dB at 120. */
export const NOISE: readonly (readonly [number, number])[] = [
  [0, 0.07],
  [48, 0.11],
  [81.6, 0.43],
  [103.2, 0.76],
  [118.8, 1],
  [120, 1],
  [120, 0.14],
  [140.4, 0.14],
  [164.4, 0.02],
  [240, 0.02],
];

export const THUMBS = [
  { src: "/arcs/prompt-to-loop/ptl-09.jpg", alt: "BOO" },
  { src: "/arcs/prompt-to-loop/ptl-10.jpg", alt: "Haunted raves" },
  { src: "/arcs/prompt-to-loop/ptl-11.jpg", alt: "House parties" },
  { src: "/arcs/prompt-to-loop/ptl-12.jpg", alt: "AAAAH" },
  { src: "/arcs/prompt-to-loop/ptl-13.jpg", alt: "Less ringing, minus 17 dB" },
  { src: "/arcs/prompt-to-loop/ptl-14.jpg", alt: "The endcard" },
] as const;
