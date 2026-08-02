/**
 * The journey row's content — every section, in order, as one cluster.
 *
 * ⚠ SHARED BY PRODUCTION AND THE LAB, which is why it lives here rather
 * than under `/test`. `RailInstruments` renders it on the landing page and
 * `/test/hud-instruments-lab` renders it against a synthetic runway; a copy
 * in each would drift the moment a section is added, and the drift would
 * show up as the lab quietly disagreeing with the site it exists to judge.
 * Nothing in this file may import react, three, or anything under `app/`.
 *
 * ⚠ ONE ROW, NOT TWO (owner, 2026-08-02 — ADR-059 Update 1). It was two
 * corner clusters: the approach top-left, the destinations bottom-right,
 * with grouping-by-corner carrying the meaning. The bottom-right corner is
 * now the SETTINGS corner, so the destinations came up to join the approach
 * and the frame reads by corner instead: journey / nav / brand / settings.
 *
 * The grouping survives as RULES inside the row rather than as distance
 * across the frame — approach │ record │ destination. That is a weaker
 * signal than two corners were, and it is the acknowledged cost of the
 * four-corner scheme.
 *
 * ⚠ TWO CLOCKS IN ONE ROW, and they are not interchangeable. The Arc's
 * beats only exist on the MANIFEST index (`READOUT_SECTIONS` collapses all
 * four to a single `arc` row), and `proof` only exists on the READOUT index
 * (the casefile has no manifest entry at all — ADR-056). So each mark
 * declares which one resolves it. Feeding a row-clock mark the beat index,
 * or the reverse, silently lights the wrong glyph — it does not throw.
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
 * The whole journey, left to right.
 *
 * The approach is per-BEAT because the Arc's four beats ARE the approach —
 * collapsing them to one `arc` mark would leave the row saying almost
 * nothing about the longest part of the page. Everything past it is
 * row-level, because none of those sections have beats, and because that is
 * the only index `proof` appears on.
 *
 * ⚠ The mockup's roster is not this site's. It carried three sections that
 * do not exist (HERALDING / TRANSMISSIONS / CONSTELLATION, which between
 * them replace `practice`); if they are ever built they join here and
 * nothing else has to change.
 */
export const JOURNEY_MARKS: readonly JourneyMark[] = [
  beat("hero", "Hero"),
  beat("thesis", "Thesis"),
  beat("navigate", "Navigate"),
  beat("encode", "Encode"),
  beat("build", "Build"),
  // approach │ record
  row("proof", true),
  row("services"),
  row("about"),
  // record │ destination
  row("practice", true),
  row("contact"),
];

/** Printed once at the row's outboard end. */
export const CLUSTER_ZONES = {
  journey: "Journey",
} as const;
