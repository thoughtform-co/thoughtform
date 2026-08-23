/**
 * The journey's sections as marks, split across the two working corners.
 *
 * ⚠ SHARED BY PRODUCTION AND THE LAB, which is why it lives here rather
 * than under `/test`. `RailInstruments` renders the top-left row and
 * `SettingsCluster` the bottom-right; `/test/hud-instruments-lab` renders
 * both against a synthetic runway. A copy in each would drift the moment a
 * section is added, and the drift would show up as the lab quietly
 * disagreeing with the site it exists to judge. Nothing in this file may
 * import react, three, or anything under `app/`.
 *
 * ⚠ THE ROSTER IS SECTIONS, NOT BEATS (owner, 2026-08-03 — ADR-059 U3).
 * Top-left is the journey as a reader experiences it — Home · Thesis · Arc ·
 * Proof · Services · About · Voidwalker (ADR-074) — with the Arc as ONE mark
 * rather than its three corridor beats. Bottom-right is the exit and the controls: the theme
 * switch, Contact, and a session mark only an allowlisted user ever sees.
 *
 * `practice` carries NO mark (owner, same day). It is still a station in
 * `MANIFEST_ENTRIES` and still a readout row, so nothing here breaks — but
 * nothing lights gold while it holds the viewport. That is a known hole,
 * pending the section's own removal.
 *
 * ⚠ TWO CLOCKS, and they are not interchangeable. The Arc's beats only
 * exist on the MANIFEST index (`READOUT_SECTIONS` collapses all four to a
 * single `arc` row), and `proof` only exists on the READOUT index (the
 * casefile has no manifest entry at all — ADR-056). So each mark declares
 * which one resolves it. Feeding a row-clock mark the beat index, or the
 * reverse, silently lights the wrong glyph — it does not throw.
 */

import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

export interface JourneyMark {
  /** Stable key, the glyph lookup, and the `data-mark` hook. */
  id: string;
  /** Printed by the live mark, and by every mark in the lab's explain mode. */
  name: string;
  /** Which index resolves this mark's state. See the two-clocks note above. */
  clock: "beat" | "row";
  /** Into `MANIFEST_ENTRIES` when `beat`, into `READOUT_SECTIONS` when `row`. */
  idx: number;
  /**
   * Inclusive END of a beat RANGE — a mark that stands for several beats.
   *
   * Only `arc` uses it, and it is what stops the Arc double-lighting with
   * Thesis. See `ARC_MARK` for why that pair cannot share a clock.
   */
  idxEnd?: number;
  /** A rule opens a new group before this mark. */
  ruleBefore?: boolean;
}

export type MarkState = "ahead" | "passed" | "here";

/**
 * A mark's state against the two clocks.
 *
 * A mark may stand for a RANGE of beats (`idxEnd`) — the Arc does, covering
 * navigate…build — so `here` is containment rather than equality and
 * `passed` is measured from the range's END. With no `idxEnd` the range is
 * one seat wide and this is the plain three-way compare it replaced.
 *
 * Kept here rather than beside the component that calls it so that the
 * "exactly ONE mark is gold at every position" invariant can be pinned
 * without a DOM — see `tests/lib/rail-instrument-marks.test.ts`. That is
 * the invariant the Arc's range exists to protect.
 */
export function markState(mark: JourneyMark, activeIdx: number, seat: number): MarkState {
  const active = mark.clock === "beat" ? activeIdx : seat;
  const end = mark.idxEnd ?? mark.idx;
  if (active >= mark.idx && active <= end) return "here";
  return active > end ? "passed" : "ahead";
}

/**
 * Resolve an id to its index, loudly.
 *
 * Both source lists are under drift guards, so a rename there is caught —
 * but nothing would catch it HERE, and a silently missing mark is exactly
 * the class of defect the lab exists to avoid shipping.
 */
function beatIdx(id: string): number {
  const i = MANIFEST_ENTRIES.findIndex((e) => e.id === id);
  if (i < 0) throw new Error(`[rail-instruments] no MANIFEST_ENTRIES row "${id}"`);
  return i;
}
function rowIdx(id: string): number {
  const i = READOUT_SECTIONS.findIndex((r) => r.id === id);
  if (i < 0) throw new Error(`[rail-instruments] no READOUT_SECTIONS row "${id}"`);
  return i;
}

const beat = (id: string, name: string, ruleBefore = false): JourneyMark => ({
  id,
  name,
  clock: "beat",
  idx: beatIdx(id),
  ruleBefore,
});
const row = (id: string, ruleBefore = false): JourneyMark => ({
  id,
  name: READOUT_SECTIONS[rowIdx(id)].label,
  clock: "row",
  idx: rowIdx(id),
  ruleBefore,
});

/**
 * The Arc as ONE mark — a BEAT RANGE, and it has to be.
 *
 * ⚠ THESIS AND ARC CANNOT SHARE A CLOCK. `thesis` is `kind: "corridor"` in
 * `MANIFEST_ENTRIES`, and `READOUT_SECTIONS` collapses EVERY corridor entry
 * into the single `arc` row — so on the row clock, the readout seat during
 * the thesis beat IS `arc`. A row-clocked Arc mark beside a beat-clocked
 * Thesis mark puts TWO marks in `here` at once, and gold is wayfinding: it
 * marks where you are and nothing else.
 *
 * Ranging it over navigate…build on the BEAT clock keeps the two disjoint.
 * It also fixes a second, quieter bug: `sectionReadout` falls back to seat 0
 * for an id it does not know, and `hero` is not a readout row — so a
 * row-clocked Arc would light gold on the hero as well.
 *
 * The name comes from the readout row rather than a literal, so renaming
 * the Arc anywhere renames it here.
 */
const ARC_MARK: JourneyMark = {
  id: "arc",
  name: READOUT_SECTIONS[rowIdx("arc")].label,
  clock: "beat",
  idx: beatIdx("navigate"),
  idxEnd: beatIdx("build"),
};

/**
 * TOP-LEFT — the journey, as a reader would list it.
 *
 * Home and Thesis are per-beat because neither is a readout row of its own
 * (`hero` is skipped entirely; `thesis` collapses into `arc`). Everything
 * past the Arc is row-level, because none of those sections have beats and
 * because that is the only index `proof` appears on.
 *
 * ⚠ The mockup's roster is not this site's. It carried three sections that
 * do not exist (HERALDING / TRANSMISSIONS / CONSTELLATION); if they are
 * ever built they join here and nothing else has to change.
 */
export const JOURNEY_MARKS: readonly JourneyMark[] = [
  beat("hero", "Home"),
  beat("thesis", "Thesis"),
  ARC_MARK,
  row("proof"),
  row("services"),
  row("about"),
  // ADR-074: the through-line follows the bio. Row-clocked like every
  // section past the Arc; `rowIdx` throws if the manifest row is missing,
  // so this line and `MANIFEST_ENTRIES` move in one commit.
  row("voidwalker"),
];

/**
 * BOTTOM-RIGHT — the exit.
 *
 * One mark. The theme switch leads the row and the session mark closes it;
 * both are controls and live in `SettingsCluster`, not here, because this
 * file may not import react.
 */
export const EXIT_MARKS: readonly JourneyMark[] = [row("contact")];

/**
 * Both corners in journey order — the LAB's row.
 *
 * The lab prints them as ONE labelled cluster because the open question
 * there is the GLYPHS (ADR-059 §4: whether these read as instrument
 * geometry or as app icons), and the whole set side by side with their
 * names under them is the way to judge that. The geometry question is
 * settled on the live frame, not here.
 *
 * The rule is where the frame's corner split falls.
 */
export const LAB_MARKS: readonly JourneyMark[] = [
  ...JOURNEY_MARKS,
  { ...EXIT_MARKS[0], ruleBefore: true },
  ...EXIT_MARKS.slice(1),
];

/**
 * ⚠ THE LAB'S ZONE LABEL, and nowhere else's (owner, 2026-08-03).
 *
 * Production prints NO zone. The bottom-right never had room for one — the
 * settings controls occupy that corner's inboard terminus, and a word
 * wedged between a glyph row and a theme switch labels neither — so a word
 * at one row's end and nothing at the other's made the two read as
 * different kinds of object rather than one instrument seen from both ends.
 *
 * The lab keeps it for the same reason it keeps per-mark labels: its row is
 * scaffolding for judging the drawings, not a copy of the frame.
 */
export const CLUSTER_ZONES = {
  journey: "Journey",
} as const;
