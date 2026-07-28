/**
 * Section readout — the label the nav-corner shows for a journey index
 * (ADR-055, the successor to the retired left/right section menus).
 *
 * Derived from `MANIFEST_ENTRIES` rather than authored, so the corner
 * readout and the rail marker can never disagree about a section's name
 * (`manifestTitle` lives beside this for the same reason).
 *
 * The corridor's four beats — thesis / navigate / encode / build — all
 * collapse to ONE row: the Arc is a single section on this surface, and
 * its beats were subsections, which retired with the side menus. That
 * collapse also makes the hero→corridor seam flicker-proof:
 * `resolveActiveIdx` crosses hero → thesis → navigate there, all three
 * resolve to the same string, and `queueScramble` no-ops when the
 * incoming text equals the current text — so no decode fires on a seam
 * the reader experiences as one continuous move.
 *
 * HERO maps to the Arc row too. The readout only appears past the 50vh
 * collapse threshold (before that the corner carries the inline links),
 * by which point the Arc is what the reader is entering — printing
 * "HERO" there would name the thing they just left.
 *
 * Pure; unit-pinned in `tests/lib/section-label.test.ts`.
 */

import { MANIFEST_ENTRIES } from "./entries";

/** The Arc's single readout name — its three beats are not rows here. */
export const ARC_SECTION_LABEL = "THE ARC";
/** The collapsed sequence's id for the corridor row. */
export const ARC_SECTION_ID = "arc";

export interface SectionReadout {
  /** Id within the collapsed sequence — `"arc"` or a station id. */
  id: string;
  /** Display label, uppercase (the chrome register is caps). */
  label: string;
  /** 1-based position in the collapsed sequence, zero-padded. */
  num: string;
  /** Total rows in the collapsed sequence, zero-padded. */
  total: string;
}

/** Zero-pad to the manifest's two-digit convention. */
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The readout's DETAIL slot — the text left of the section name.
 *
 * One slot, two jobs: the current subsection when the section has one
 * (`navigate //`), and the journey position when it does not (`03/06`).
 * They share an element ON PURPOSE — it makes the swap a plain decode
 * between two strings instead of a conditional mount, so nothing can
 * flicker between the two forms mid-transition, and the `//` decodes
 * away with the word that earned it.
 *
 * The trailing `//` is the house path idiom, carried in the string
 * rather than as its own styled node for exactly that reason.
 */
export function readoutDetail(readout: SectionReadout, sub?: string | null): string {
  return sub ? `${sub} //` : `${readout.num}/${readout.total}`;
}

/**
 * The journey as the corner reads it: the Arc once, then every station.
 * Hero is dropped — it is the one entry with no readout (hero canon, the
 * same rule `manifestTitle` applies via `hideActiveName`).
 */
export const READOUT_SECTIONS: readonly { id: string; label: string }[] = (() => {
  const rows: { id: string; label: string }[] = [];
  let arcSeated = false;
  for (const entry of MANIFEST_ENTRIES) {
    if (entry.id === "hero") continue;
    if (entry.kind === "corridor") {
      if (arcSeated) continue;
      arcSeated = true;
      rows.push({ id: ARC_SECTION_ID, label: ARC_SECTION_LABEL });
      continue;
    }
    rows.push({ id: entry.id, label: entry.name.toUpperCase() });
  }
  return rows;
})();

/**
 * Resolve a `MANIFEST_ENTRIES` index to its corner readout. Falls back to
 * the Arc row for hero and for any index outside the manifest — the
 * corner must never render an empty label, since it is also the nav
 * trigger.
 */
export function sectionReadout(idx: number): SectionReadout {
  const entry = MANIFEST_ENTRIES[idx];
  const id = !entry || entry.id === "hero" || entry.kind === "corridor" ? ARC_SECTION_ID : entry.id;
  const pos = READOUT_SECTIONS.findIndex((row) => row.id === id);
  const seat = pos >= 0 ? pos : 0;
  const row = READOUT_SECTIONS[seat];
  return {
    id: row?.id ?? ARC_SECTION_ID,
    label: row?.label ?? ARC_SECTION_LABEL,
    num: pad(seat + 1),
    total: pad(READOUT_SECTIONS.length),
  };
}
