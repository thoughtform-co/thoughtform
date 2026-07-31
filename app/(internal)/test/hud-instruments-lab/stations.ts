/**
 * Station designations — the roster's content.
 *
 * ⚠ WHY CODES AND NOT NAMES. The rail column is `clamp(48px, 4.27vw, 82px)`
 * wide. `SERVICES` at the 8.5px chrome size is ~48px of glyph, which only
 * fits by bleeding past the rail into the content gutter. Three-character
 * designations are the HUD-native answer and they fit inside the column
 * with room for the connector — the full name is what the ACTIVE slot
 * expands to reveal, so the long form is available exactly once at a time.
 *
 * Codes are picked to stay distinguishable at a glance: `PRF`/`PRC` would
 * have been a confusable pair, so proof takes `DOC` (it is a casefile) and
 * practice takes `PRC`.
 */

import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

export const ROW_CODES: Readonly<Record<string, string>> = {
  arc: "ARC",
  proof: "DOC",
  services: "SVC",
  about: "ABT",
  practice: "PRC",
  contact: "CNT",
};

/**
 * Slot positions — EVEN, on the 13-rung tick ladder, NOT at each section's
 * scroll detent.
 *
 * This is the whole correction (owner, 2026-07-31): detent-proportional
 * placement makes the rail a SCALE, and a scale reads as a progress bar
 * however it is styled. Fixed slots read as a roster — an equipment bay, an
 * outliner, a part list — where position is structure and only STATE moves.
 *
 * Odd tick indices 1/3/5/7/9/11 give six evenly-spaced seats that each land
 * on a minor tick and clear BOTH majors (indices 4 and 8), so the bearing
 * labels "2" and "5" keep their own column with nothing seated beside them.
 */
export const SLOT_TICKS: readonly number[] = READOUT_SECTIONS.map(
  (_, i) => ((i * 2 + 1) / 12) * 100
);
