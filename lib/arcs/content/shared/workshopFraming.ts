import type { ArcSectionOf } from "../../types";

import { FRONTIER_CURVE } from "./frontierCurve";
import { TOOL_AND_COLLABORATOR } from "./toolAndCollaborator";

/**
 * The situation's three middle beats as the AP lecture tells them (ADR-141),
 * hoisted by ADR-143 because the workshop's third house cut shows them whole
 * at the same places (03 · 04 · 05), and the archetype (v1) carried the first
 * two word for word too. Each page puts these objects in its sections array as
 * they are; `arcs-registry` pins every word-for-word copy `toBe` them.
 *
 * ⚠ THE DATA HALVES WERE ALREADY SHARED. The curve's lanes and prices are
 * `FRONTIER_CURVE` and the spectrum's poles and bands `TOOL_AND_COLLABORATOR`,
 * each spread into every page that draws them. What this module adds is the
 * HEAD, which the other readers (the class deck, the second cut, Plopsa's
 * Dutch copy) author themselves at their own positions and in their own words.
 */
export const THE_CURVE_BEAT: ArcSectionOf<"curve"> = {
  id: "the-curve",
  kind: "curve",
  menuLabel: "The curve",
  head: {
    eyebrow: "03 · The curve",
    title: { pre: "Each release finishes longer work,", em: "and costs more per token." },
    sub: "Each release makes fewer small mistakes, so it gets further on long and difficult work. And every model has a second dial: how hard it thinks.",
  },
  ...FRONTIER_CURVE,
};

export const HARD_TO_STEER_BEAT: ArcSectionOf<"spectrum"> = {
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
};

/* A beat: no picture, and twenty seconds of silence in the room. */
export const REAL_QUESTION_BEAT: ArcSectionOf<"interstitial"> = {
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
};

/**
 * THE CATCH (ADR-147 U7, shared since ADR-148 U2): the real question's beat
 * re-lined as the owner's own, "AI is a superhuman intelligence, but sucks
 * at running itself." The lunch and learn says it after the spectrum; the
 * Suri setup page after the curve. One line, one record, a page's own
 * eyebrow (the `theHorizon(eyebrow)` idiom).
 */
export const THE_CATCH_LINE = {
  pre: "AI is a superhuman intelligence,",
  em: "but sucks at running itself.",
} as const;

export function theCatch(eyebrow: string): ArcSectionOf<"interstitial"> {
  return {
    ...REAL_QUESTION_BEAT,
    subline: undefined,
    eyebrow,
    line: THE_CATCH_LINE,
  };
}
