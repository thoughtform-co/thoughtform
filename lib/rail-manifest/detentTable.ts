/**
 * Rail Manifest — the detent table (ADR-031 Update 9, the detent diamond).
 *
 * The left rail's gold diamond snaps to one vertical detent per journey
 * entry, spaced PROPORTIONAL to each section's real scroll distance (the
 * long WebGL corridor occupies a tall slice; short stations cluster). This
 * builds that table: a normalized 0..1 scroll position per `MANIFEST_ENTRIES`
 * index, reusing the SAME offset recipe as click-to-navigate
 * (`scrollTargetForEntry`) so the two never drift.
 *
 * It reads live layout, so it is called ONLY on mount / resize / content
 * change — NEVER per scroll frame. The diamond's position stays a pure
 * function of the active index into this table (ADR-031 "no scroll writer"
 * invariant); scroll only re-resolves WHICH index is active, never re-reads
 * geometry.
 *
 * Data-driven: adding / removing / reordering a `MANIFEST_ENTRIES` entry
 * reshuffles the whole table automatically — the marker's pace and spacing
 * follow the content with no controller change.
 */

import { scrollTargetForEntry } from "./clickToNavigate";
import { MANIFEST_ENTRIES } from "./entries";

/**
 * Normalized 0..1 detent per `MANIFEST_ENTRIES` index (`null` when the
 * entry's target element is absent — hold the last position, never snap to
 * hero). 0 = top of the scroll range, 1 = bottom.
 */
export function computeDetentTable(): (number | null)[] {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return MANIFEST_ENTRIES.map((entry) => {
    const pos = scrollTargetForEntry(entry);
    return pos == null ? null : Math.max(0, Math.min(1, pos / maxScroll));
  });
}
