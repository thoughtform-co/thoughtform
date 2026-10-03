import type { ArcSectionOf } from "../../types";

/**
 * "A prompt, a tool, an agent. Each runs longer without you." — the stages
 * beat with LOOP'S OWN examples (ADR-131, hoisted by ADR-143). The archetype,
 * its second cut and its third house cut all show it whole, at the same place
 * (02, after the opening slide), so each puts this object in its sections
 * array as it is and `arcs-registry` pins every word-for-word copy `toBe` it
 * (the guard found the archetype's own copy the day it was written).
 *
 * ⚠ NOT THE AP LECTURE'S OR THE CLASS DECK'S. Those carry the same three
 * stages over Tom on the Moon's own examples ("A wave: drawn, graded,
 * delivered"), so they are different sections, authored in their own files.
 */
export const THREE_WAYS_LOOP: ArcSectionOf<"stages"> = {
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
  own: "Loop's own",
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
      example: "An image tool with a checker inside it",
    },
    {
      id: "agent",
      label: "An agent",
      name: "It runs the loop",
      body: "You set the goal and the checks. It runs, checks, retries, and asks.",
      example: "Packaging, from brief to render",
      lit: true,
    },
  ],
};
