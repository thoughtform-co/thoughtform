import type { ArcTip } from "../../types";

/**
 * The three ways a tool removes a bottleneck — SHARED EVIDENCE (ADR-072).
 *
 * `ProjectCase.mode` (toolCardData.ts) names one of these per tool; the
 * definitions were authored on the keynote's cases strip and are hoisted
 * here so the keynote's tips, the portfolio's legend rows and every
 * dossier's mode line say the same sentence. Keys match the modes as they
 * read on a page; `toolCardData` carries them in caps.
 */
export const MODE_LEGEND = {
  Compress: "Collapse fragmented steps into one continuous flow.",
  Repair: "Fix the gaps between tools the team must keep using.",
  Invent: "Build a workflow that didn't exist before.",
} as const;

export type CaseModeLabel = keyof typeof MODE_LEGEND;

/** The keynote's tips strip, in its original order. */
export const MODE_TIPS: readonly ArcTip[] = [
  { id: "compress", tag: "Compress", body: MODE_LEGEND.Compress },
  { id: "repair", tag: "Repair", body: MODE_LEGEND.Repair },
  { id: "invent", tag: "Invent", body: MODE_LEGEND.Invent },
];
