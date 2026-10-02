import type { ArcSectionOf } from "../../types";

/**
 * "Hand it to an agent. Trust what comes back." — the opening slide's RECORD
 * (ADR-137's hero-board, hoisted by ADR-141 U2). Two pages show this beat
 * whole: the workshop's second cut opens its arc on it, and the AP Hogeschool
 * lecture replaced its Today readout with it (owner, 2026-10-02). Each puts
 * this object in its sections array as it is, so a change to the line or the
 * lit plates lands on both at once; `arcs-registry` pins every section that
 * shows this head `toBe` it.
 *
 * ⚠ THE WHOLE SECTION, NOT ONLY THE EVIDENCE. The spectrum's record shares
 * its drawing and lets each page author its head (ADR-072), but here the head
 * IS the beat: the drawing letters nothing, and the owner asked for this
 * section, title and sub, as it is on v2.
 *
 * ⚠ v1 IS NOT A READER. The archetype's opening carries the same title over a
 * different sub ("…it ends with the checks your team writes so it can"), so it
 * is a different section, authored in its own file.
 */
export const HAND_IT_TO_AN_AGENT: ArcSectionOf<"hero-board"> = {
  id: "the-workshop",
  kind: "hero-board",
  menuLabel: "The workshop",
  menuPrimary: true,
  head: {
    eyebrow: "01 · The workshop",
    title: { pre: "Hand it to an agent.", em: "Trust what comes back." },
    sub: "Three ways to work with AI: ask it, have it build you a tool, or give it the goal and let it run. This workshop is about the third, and it ends with one piece of your own work set up to run that way.",
  },
  lit: [
    ["right", 0],
    ["right", 1],
  ],
};
