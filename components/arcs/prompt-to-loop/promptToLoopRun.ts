import type { ArcSectionOf } from "@/lib/arcs/types";

import { PROMPT_TO_LOOP_SLIDES, type PromptToLoopSlide } from "./promptToLoopSlides";

/**
 * The run of the breakdown a `prompt-to-loop` section mounts (ADR-148 U1):
 * `from` to `to` by slide id, inclusive, the whole record when both are
 * omitted. Throws on an id the record does not have, so a renamed slide fails
 * the build rather than mounting an empty run.
 */
export function promptToLoopRun(
  section: Pick<ArcSectionOf<"prompt-to-loop">, "from" | "to">
): readonly PromptToLoopSlide[] {
  const at = (id: string | undefined, fallback: number) => {
    if (id === undefined) return fallback;
    const i = PROMPT_TO_LOOP_SLIDES.findIndex((s) => s.id === id);
    if (i < 0) throw new Error(`prompt-to-loop: no slide "${id}"`);
    return i;
  };
  const start = at(section.from, 0);
  const end = at(section.to, PROMPT_TO_LOOP_SLIDES.length - 1);
  return PROMPT_TO_LOOP_SLIDES.slice(start, end + 1);
}
