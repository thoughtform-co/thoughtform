/**
 * The corner clusters' content — which sections sit in which cluster.
 *
 * ⚠ SHARED BY PRODUCTION AND THE LAB, which is why it lives here rather
 * than under `/test`. `RailInstruments` renders it on the landing page and
 * `/test/hud-instruments-lab` renders it against a synthetic runway; a copy
 * in each would drift the moment a section is added, and the drift would
 * show up as the lab quietly disagreeing with the site it exists to judge.
 * Nothing in this file may import react, three, or anything under `app/`.
 *
 * Round 3 (owner mockup, 2026-08-02). Rounds 1 and 2 both distributed marks
 * ALONG the left rail and differed only in whether the spacing was
 * proportional (a scale, rejected) or fixed (a roster). This round takes the
 * marks OFF the ladder entirely and groups them by ROLE in the frame's two
 * working corners, so position encodes what a section IS rather than how far
 * down it sits. That is a third answer to the progress-bar complaint, not a
 * restyling of the first two.
 *
 * ⚠ THE MOCKUP'S ROSTER IS NOT THIS SITE'S. It carried twelve sections,
 * three of which do not exist — HERALDING, TRANSMISSIONS and CONSTELLATION,
 * which between them replace `practice` (the mockup's own HERALDING section
 * header reads "DISPATCHES FROM THE PRACTICE"). Owner's call was to wire the
 * LIVE roster, so:
 *
 *   - the mockup's NAV row survives unchanged — it is exactly the five
 *     approach beats;
 *   - its COMMS cluster is DROPPED, both its sections being invented. The
 *     right rail therefore stays empty in this variant, which is worth
 *     seeing before anything is invented to fill it;
 *   - its bottom row survives 1:1 with CONSTELLATION → PRACTICE, keeping the
 *     LOG / DOCK split and the rule between them.
 *
 * If those three sections are ever built, they join here and the COMMS
 * cluster comes back — nothing else has to change.
 */

import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

export interface ClusterMark {
  /** Stable key, the glyph lookup, and the `data-mark` hook. */
  id: string;
  /** Printed by the active mark and by every mark in explain mode. */
  name: string;
  /** A rule opens a new sub-group before this mark. */
  ruleBefore?: boolean;
}

/**
 * Resolve a manifest id to its index, loudly.
 *
 * `MANIFEST_ENTRIES` is under a DOM drift guard, so a rename there is caught
 * — but nothing would catch it HERE, and a silently missing mark is the kind
 * of defect this lab exists to avoid producing.
 */
function manifestIdx(id: string): number {
  const i = MANIFEST_ENTRIES.findIndex((e) => e.id === id);
  if (i < 0) throw new Error(`[hud-instruments-lab] no MANIFEST_ENTRIES row "${id}"`);
  return i;
}

/**
 * TOP-LEFT — the approach: everything before the offer.
 *
 * Per-BEAT, deliberately. `journeyRef.ts` warns that `reachedRows` and
 * `activeIdx` are different numbers because the four corridor beats collapse
 * to one readout row, and that mixing them "draws four Arc marks". This
 * cluster WANTS those four marks — the Arc's beats are the approach, and
 * collapsing them would leave the corner with two marks and nothing to say.
 * So it keys on `activeIdx` (manifest granularity), which is the opposite of
 * what `RailStationRoster` needs. Both are correct for their own design.
 */
export const APPROACH_MARKS: readonly ClusterMark[] = [
  { id: "hero", name: "Hero" },
  { id: "thesis", name: "Thesis" },
  { id: "navigate", name: "Navigate" },
  { id: "encode", name: "Encode" },
  { id: "build", name: "Build" },
];

/** `activeIdx` values for the approach marks, resolved once at module load. */
export const APPROACH_IDX: readonly number[] = APPROACH_MARKS.map((m) => manifestIdx(m.id));

/**
 * BOTTOM-RIGHT — the destinations: the record, the offer, and the way out.
 *
 * This is `READOUT_SECTIONS` minus its leading `arc` row, which is exactly
 * the set the approach cluster does not carry — derived rather than
 * re-authored, so a new readout row lands here automatically. Row-level is
 * the right granularity here (none of these have beats), and it also gets
 * `proof` for free: the casefile is a readout row with NO manifest entry
 * (ADR-056), so a manifest-keyed list could not have held it.
 *
 * The rule sits where the mockup put it — after ABOUT, splitting what is on
 * the record from where you are going.
 */
const DOCK_RULE_AFTER = "about";

export const DOCK_MARKS: readonly ClusterMark[] = READOUT_SECTIONS.slice(1).map((row, i, rows) => ({
  id: row.id,
  name: row.label,
  ruleBefore: i > 0 && rows[i - 1].id === DOCK_RULE_AFTER,
}));

/**
 * Zone labels — one per cluster, seated at its outer edge.
 *
 * The mockup stacked TWO above the bottom row (LOG and DOCK, capping each
 * half). That placement is unavailable: the BR corner's curtain clip has a
 * top inset that saturates at 0px, so nothing can paint above that corner's
 * box at rest. The rule inside the row carries the split instead.
 */
export const CLUSTER_ZONES = {
  approach: "Nav",
  dock: "Dock",
} as const;
