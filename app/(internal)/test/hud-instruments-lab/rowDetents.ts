/**
 * Where each readout row sits on the rail, 0..1 down the scroll range.
 *
 * The production `computeDetentTable()` is indexed by `MANIFEST_ENTRIES`
 * (9 rows, the corridor at BEAT granularity). The left-rail index is
 * indexed by `READOUT_SECTIONS` (6 rows, the Arc collapsed) — the same list
 * the nav corner names — so it needs its own table. Same discipline:
 * reads live layout, called on mount / resize ONLY, never per scroll frame.
 *
 * One row needs care. `PROOF` and `SERVICES` are two beats of ONE DOM
 * section — the casefile owns the front of the `#services` runway — so
 * `offsetTop` would seat them on the same detent and stack their marks.
 * They are separated here exactly the way the runway separates them: the
 * casefile's dwell is `SERVICES_PROOF_RUNWAY_VH` viewports, so the offer's
 * mark starts there. That is not a nudge for legibility; it is where the
 * offer actually begins.
 */

import { SERVICES_PROOF_RUNWAY_VH } from "@/components/landing/home-v2/unifiedServicesInstrument";
import { CORRIDOR_MOUNT_ID } from "@/lib/rail-manifest/entries";
import {
  ARC_SECTION_ID,
  PROOF_SECTION_ID,
  READOUT_SECTIONS,
} from "@/lib/rail-manifest/sectionLabel";

/** The element a readout row is anchored to. */
function anchorIdFor(rowId: string): string {
  if (rowId === ARC_SECTION_ID) return CORRIDOR_MOUNT_ID;
  if (rowId === PROOF_SECTION_ID) return "services";
  return rowId;
}

/**
 * Normalized 0..1 position per `READOUT_SECTIONS` row (`null` when the
 * anchor is absent — hold, never snap to the top).
 */
export function computeRowDetents(): (number | null)[] {
  const vh = window.innerHeight;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  return READOUT_SECTIONS.map((row) => {
    const el = document.getElementById(anchorIdFor(row.id));
    if (!el) return null;
    // `offsetTop` is document-absolute only while no ancestor is
    // positioned — the runway wrapper stays `position: static` for this
    // reason (see `lib/rail-manifest/clickToNavigate.ts`).
    const top = el.offsetTop + (row.id === "services" ? SERVICES_PROOF_RUNWAY_VH * vh : 0);
    return Math.max(0, Math.min(1, top / maxScroll));
  });
}
