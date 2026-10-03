import { PROMPT_TO_LOOP_SLIDES } from "@/components/arcs/prompt-to-loop/promptToLoopSlides";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";

/**
 * The third house cut's tail in five runs (ADR-143): the situation, Prompt to
 * Loop up to and including its bill, the economics chapter that answers the
 * bill, the breakdown's last slide ("Now it's a skill. Just ask."), then
 * Laura's test and the close. Every seam is found by ID, so a beat added
 * inside a run lands in it rather than shifting the seams.
 *
 * Its own module, pure, so the route test can pin the split without mounting
 * the renderer.
 */
const SECTIONS = THOUGHTFORM_WORKSHOP_V3_ARC.sections;
const AT_MONEY = SECTIONS.findIndex((s) => s.id === "the-money");
const AT_OTHER_HANDS = SECTIONS.findIndex((s) => s.id === "in-other-hands");
const AT_COST = PROMPT_TO_LOOP_SLIDES.findIndex((s) => s.id === "ptl-cost");

export const V3_SITUATION = SECTIONS.slice(0, AT_MONEY);
export const V3_BREAKDOWN = PROMPT_TO_LOOP_SLIDES.slice(0, AT_COST + 1);
export const V3_ECONOMICS = SECTIONS.slice(AT_MONEY, AT_OTHER_HANDS);
export const V3_JUST_ASK = PROMPT_TO_LOOP_SLIDES.slice(AT_COST + 1);
export const V3_CLOSE = SECTIONS.slice(AT_OTHER_HANDS);

/* One running index across the five runs: it letters each beat's coord stamp
   (`ARC / … · NN`), so a slide and the section after it never share one. */
export const AT_BREAKDOWN = V3_SITUATION.length;
export const AT_ECONOMICS = AT_BREAKDOWN + V3_BREAKDOWN.length;
export const AT_JUST_ASK = AT_ECONOMICS + V3_ECONOMICS.length;
export const AT_CLOSE = AT_JUST_ASK + V3_JUST_ASK.length;
