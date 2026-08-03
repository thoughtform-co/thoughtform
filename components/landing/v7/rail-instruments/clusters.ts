/**
 * The journey's sections as marks, split across the two working corners.
 *
 * ⚠ SHARED BY PRODUCTION AND THE LAB, which is why it lives here rather
 * than under `/test`. `RailInstruments` renders it on the landing page and
 * `/test/hud-instruments-lab` renders it against a synthetic runway; a copy
 * in each would drift the moment a section is added, and the drift would
 * show up as the lab quietly disagreeing with the site it exists to judge.
 * Nothing in this file may import react, three, or anything under `app/`.
 *
 * ⚠ TWO CLUSTERS AGAIN (owner, 2026-08-03 — ADR-059 Update 2). Update 1
 * merged them into one top-left row because the bottom-right had become the
 * settings corner and the two could not share it. They share it now: the
 * destinations and the SETTINGS CONTROLS are one flex row, marks outboard
 * on the rail's track line, controls inboard where the zone label was. So
 * grouping-by-corner carries the approach/destination split again — the
 * strong signal U1 gave up and called its acknowledged cost.
 *
 * The frame still reads by corner: journey top-left, nav top-right, brand
 * bottom-left, settings bottom-right. The bottom-right just carries the
 * destinations WITH its settings rather than instead of them.
 *
 * ⚠ TWO CLOCKS, and they are not interchangeable. The Arc's beats only
 * exist on the MANIFEST index (`READOUT_SECTIONS` collapses all four to a
 * single `arc` row), and `proof` only exists on the READOUT index (the
 * casefile has no manifest entry at all — ADR-056). So each mark declares
 * which one resolves it. Feeding a row-clock mark the beat index, or the
 * reverse, silently lights the wrong glyph — it does not throw. The split
 * falls on that seam by construction: the approach is beat-clocked, the
 * destinations are row-clocked.
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
  /** A rule opens a new group before this mark. */
  ruleBefore?: boolean;
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
 * TOP-LEFT — the approach: how you arrive at the argument.
 *
 * Per-BEAT, because the Arc's four beats ARE the approach — collapsing them
 * to one `arc` mark would leave the corner saying almost nothing about the
 * longest part of the page.
 */
export const APPROACH_MARKS: readonly JourneyMark[] = [
  beat("hero", "Hero"),
  beat("thesis", "Thesis"),
  beat("navigate", "Navigate"),
  beat("encode", "Encode"),
  beat("build", "Build"),
];

/**
 * BOTTOM-RIGHT — the destinations: the record, the offer, and the way out.
 *
 * This is `READOUT_SECTIONS` minus its leading `arc` row, which is exactly
 * the set the approach does not carry. Row-level is the right granularity
 * (none of these have beats) and it is also the only index that HAS
 * `proof`: the casefile is a readout row with no manifest entry at all
 * (ADR-056), so a beat-clocked list could not have held it.
 *
 * The rule splits what is on the record from where you are going.
 *
 * ⚠ The mockup's roster is not this site's. It carried three sections that
 * do not exist (HERALDING / TRANSMISSIONS / CONSTELLATION, which between
 * them replace `practice`); if they are ever built they join here and
 * nothing else has to change.
 */
export const DESTINATION_MARKS: readonly JourneyMark[] = [
  row("proof"),
  row("services"),
  row("about"),
  // record │ destination
  row("practice", true),
  row("contact"),
];

/**
 * The full roster in journey order — the LAB's row, not production's.
 *
 * `/test/hud-instruments-lab` prints all ten with labels in one cluster
 * because the open question there is the GLYPHS (ADR-059 §4: whether these
 * read as instrument geometry or as app icons), and ten of them side by
 * side with their names under them is the way to judge that. The geometry
 * question was settled across rounds 1–3 and again in Update 2, and it is
 * settled on the live frame, not here.
 *
 * The rule between the two halves is what the lab's single row keeps of the
 * corner split.
 */
export const JOURNEY_MARKS: readonly JourneyMark[] = [
  ...APPROACH_MARKS,
  { ...DESTINATION_MARKS[0], ruleBefore: true },
  ...DESTINATION_MARKS.slice(1),
];

/**
 * Printed at the approach row's inboard end.
 *
 * The bottom-right has NO zone label: the settings controls occupy that
 * corner's inboard terminus, and a word wedged between a glyph row and a
 * theme switch labels neither.
 */
export const CLUSTER_ZONES = {
  approach: "Approach",
} as const;
