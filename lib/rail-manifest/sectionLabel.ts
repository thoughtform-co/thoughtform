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

/**
 * The client casefile's row (ADR-056).
 *
 * It is NOT a manifest entry: the casefile lives at the front of the
 * `#services` runway, so it shares one DOM section and one rail detent with
 * the offer — giving it a `MANIFEST_ENTRIES` row would break the drift guard
 * that pins station entries 1:1 against the parsed DOM.
 *
 * But it IS a beat the reader experiences as its own place, and the corner
 * readout is the journey indicator: printing "SERVICES" while someone reads
 * the proof names a section they have not reached yet. So the row is seated
 * here, immediately before services, and `sectionReadout` picks between the
 * two on the caller's `proofOwns` flag.
 */
export const PROOF_SECTION_LABEL = "PROOF";
export const PROOF_SECTION_ID = "proof";

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
    // ADR-056: the casefile is seated ahead of the offer it introduces.
    if (entry.id === "services") {
      rows.push({ id: PROOF_SECTION_ID, label: PROOF_SECTION_LABEL });
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
 *
 * `proofOwns` splits the one `services` index into its two beats (ADR-056).
 * It stays a PARAMETER rather than a read inside this module so the function
 * remains pure and index-addressable: the caller
 * (`useActiveSection`) owns the live scalar, and every other consumer —
 * tests, the rail — keeps calling the single-argument form and gets the
 * offer's row, which is the resting truth.
 */
export function sectionReadout(idx: number, proofOwns = false): SectionReadout {
  const entry = MANIFEST_ENTRIES[idx];
  const base =
    !entry || entry.id === "hero" || entry.kind === "corridor" ? ARC_SECTION_ID : entry.id;
  const id = proofOwns && base === "services" ? PROOF_SECTION_ID : base;
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
