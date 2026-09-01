/**
 * The synthetic scroll runway.
 *
 * DERIVED from `MANIFEST_ENTRIES`, not authored: the manifest's nine rows
 * collapse onto SIX unique `targetId`s (the Arc's four beats all share the
 * corridor mount), and those six are the runway's blocks. Adding a manifest
 * entry therefore reshapes this lab's runway automatically, which is what
 * keeps the ADR-031 drift guard meaningful here.
 *
 * Heights mirror the production runways so the detent SPACING the rail
 * computes is honest — the whole point of a section-presence instrument is
 * that the long corridor takes a tall slice and the short stations cluster,
 * and that only reads true at production proportions:
 *
 *   corridor  820svh   `.home-v2-stage` (ADR-018; EPILOGUE_START = 620/820)
 *   services  DERIVED  `--svc-proof-runway` + the 500svh ring runway
 *   about     250svh   the ADR-047 deck-flip stage
 *   hero / practice / contact  one viewport each
 *
 * ⚠ **THE SERVICES ROW WAS `620svh` AND HAD BEEN WRONG FOR A MONTH** — the
 * casefile's dwell went 120 → 320svh on 2026-08-02 and this lab kept
 * mirroring the old number, so the block a section-presence instrument is
 * judged against was 200svh short of production while the comment beside it
 * asserted the mirror. It reads `SERVICES_PROOF_RUNWAY_VH` now (ADR-087
 * Phase B made that constant a derivation over `CASES`, which is exactly
 * when a hand-copied mirror stops being maintainable), so the lab's detent
 * SPACING follows the real runway for free — including the day a second
 * client lengthens the browse band.
 *
 * ⚠ `scrollTargetForEntry` reads `el.offsetTop` for station entries, which
 * is only document-absolute while no ancestor is positioned. The runway
 * wrapper must stay `position: static` — see the note in
 * `lib/rail-manifest/clickToNavigate.ts`.
 */

import { SERVICES_PROOF_RUNWAY_VH } from "@/components/landing/home-v2/unifiedServicesInstrument";
import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";

export interface RunwayBlock {
  /** DOM id — the manifest entry's `targetId`. */
  id: string;
  /**
   * `data-station` value, or `null` for the corridor mount.
   *
   * The mount is deliberately NOT a `.station` — in production it is not
   * one either, which is exactly why `resolveActiveIdx` needs its seam-gap
   * rule 3. Making it one here would paper over the behaviour under study.
   */
  station: string | null;
  /** Explicit block height (the lab sheet zeroes `.station`'s own padding). */
  height: string;
  /** Console label. The four corridor beats collapse to one block, so it
   *  takes the readout's collapsed name rather than any single beat's. */
  name: string;
  /** Index of the FIRST `MANIFEST_ENTRIES` row targeting this block. */
  entryIdx: number;
}

const BLOCK_HEIGHTS: Readonly<Record<string, string>> = {
  hero: "100svh",
  [CORRIDOR_MOUNT_ID]: "820svh",
  services: `${SERVICES_PROOF_RUNWAY_VH * 100 + 500}svh`,
  about: "250svh",
  practice: "100svh",
  contact: "100svh",
};

/** The corridor's collapsed name — matches `ARC_SECTION_LABEL`'s intent. */
const CORRIDOR_BLOCK_NAME = "The Arc";

export const RUNWAY_BLOCKS: readonly RunwayBlock[] = (() => {
  const seen = new Set<string>();
  const blocks: RunwayBlock[] = [];
  MANIFEST_ENTRIES.forEach((entry, entryIdx) => {
    if (seen.has(entry.targetId)) return;
    seen.add(entry.targetId);
    blocks.push({
      id: entry.targetId,
      station: entry.kind === "corridor" ? null : entry.targetId,
      height: BLOCK_HEIGHTS[entry.targetId] ?? "100svh",
      name: entry.kind === "corridor" ? CORRIDOR_BLOCK_NAME : entry.name,
      entryIdx,
    });
  });
  return blocks;
})();

/**
 * The corridor beats, in order, with the runway fraction each one parks at.
 *
 * Derived from `scrollFraction` so the lab's phase hand-offs cannot drift
 * from the detent table. NOTE this is a deliberate departure from
 * production, which hands off at `CORRIDOR_BEAT_ENTER` (0.2 / 0.48 / 0.78 in
 * paintProgress) — a little AHEAD of each park. Flipping at the parks
 * instead means the diamond arrives at its detent on the same frame the
 * phase flips, which makes the instrument easier to read while judging it.
 * Do not "fix" this by copying the production thresholds.
 */
export const CORRIDOR_BEATS: readonly { phase: string; at: number }[] = MANIFEST_ENTRIES.filter(
  (e) => e.kind === "corridor" && e.corridorPhase
).map((e) => ({ phase: e.corridorPhase as string, at: e.scrollFraction ?? 0 }));

/** The corridor block's index within `RUNWAY_BLOCKS`. */
export const CORRIDOR_BLOCK_IDX = RUNWAY_BLOCKS.findIndex((b) => b.id === CORRIDOR_MOUNT_ID);

/** The `#services` block's index within `RUNWAY_BLOCKS`. */
export const SERVICES_BLOCK_IDX = RUNWAY_BLOCKS.findIndex((b) => b.id === "services");
