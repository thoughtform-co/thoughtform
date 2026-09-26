import type { ArcBenchBand, ArcBenchState } from "@/lib/arcs/types";

/**
 * The bench's CHROME — every string the renderer letters that the record does
 * not author (ADR-128 B2). Moira's workshop module authors these per page; on
 * this surface a proposal's record may only say what its OWN checker does, so
 * the tab names, the pane flags, the state words and the band definitions are
 * constants here, walked by `tests/lib/arc-bench-chrome.test.ts` through the
 * proposal copy law and the digit ban — a string a renderer composes is
 * outside every content scanner (ADR-070 U15's own finding).
 *
 * ⚠ ONE WORD PER STATE, AND THEY ARE THE HOUSE'S: pass, review, block — the
 * homepage's own card says "a result passes, goes to review, or is blocked".
 * A check returns one of these, never a score.
 */

export const BENCH_TABS = [
  { id: "run", label: "Run" },
  { id: "skill", label: "Skill" },
  { id: "evals", label: "Evals" },
] as const;

export type BenchTab = (typeof BENCH_TABS)[number]["id"];

export const BENCH_PANES = {
  input: "What goes in",
  output: "What comes back",
  rail: "The checks",
  strict: "How strictly each rule holds",
  cases: "The cases on file",
  folder: "The folder",
  actions: "What happens next",
} as const;

export const BENCH_TABLIST_LABEL = "The bench: the run, the skill, the evals";
export const BENCH_INPUTS_LABEL = "Which input to show";

export const BENCH_STATE_LABEL: Record<ArcBenchState, string> = {
  pass: "Pass",
  review: "Review",
  block: "Block",
};

/** What a case on file must get, said over it. */
export const BENCH_EXPECTS: Record<ArcBenchState, string> = {
  pass: "Must pass",
  review: "Must go to review",
  block: "Must block",
};

export const BENCH_BANDS: Record<ArcBenchBand, { label: string; line: string }> = {
  fixed: { label: "Fixed", line: "Checked word for word. It passes or it blocks." },
  adapt: { label: "Adapt", line: "Checked with judgment. It passes or it goes to review." },
  free: { label: "Free", line: "Checked by nobody. Left to the person doing the work." },
};

/** Every chrome string, flat, for the guard. */
export function benchChromeStrings(): readonly string[] {
  return [
    ...BENCH_TABS.map((t) => t.label),
    ...Object.values(BENCH_PANES),
    BENCH_TABLIST_LABEL,
    BENCH_INPUTS_LABEL,
    ...Object.values(BENCH_STATE_LABEL),
    ...Object.values(BENCH_EXPECTS),
    ...Object.values(BENCH_BANDS).flatMap((b) => [b.label, b.line]),
  ];
}
