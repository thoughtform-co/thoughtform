/**
 * Rail Manifest — shared active-index resolver (ADR-031).
 *
 * The single source of truth for "where is the reader in the journey",
 * resolved from the existing single-writer `<html>` attributes. Lifted
 * out of `RailManifestController` so the rolodex (RailManifest.tsx) and
 * the resource loadout (RailLoadout.tsx) resolve identically — the
 * seam-gap geometric rule is subtle and two copies would drift.
 *
 * activeIdx resolution priority:
 *   1. `data-corridor-engaged` → the entry matching `data-corridor-phase`
 *      (thesis fallback — the WebGL fallback has no corridor writer);
 *   2. else `data-active-station` → its station entry;
 *   3. seam-gap fix: if that yields hero but the corridor mount sits
 *      above viewport-mid, the corridor has been PASSED → Arc. (The
 *      mount is not a `.station`, so `data-active-station` lags at
 *      "hero" between corridor disengage and the services crossing.)
 *
 * Pure read — never mutates. Both controllers key their wake sources
 * (MutationObserver on the three attributes below + a hero/corridor-gated
 * scroll listener for rule 3) off this.
 */

import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES } from "./entries";

export const THESIS_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "thesis");
export const ARC_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "arc");

/** The `<html>` attributes the resolver reads — the shared MutationObserver filter. */
export const ACTIVE_IDX_ATTRIBUTES = [
  "data-active-station",
  "data-corridor-engaged",
  "data-corridor-phase",
] as const;

/** Resolve the active journey index from the live `<html>` attribute bus. */
export function resolveActiveIdx(html: HTMLElement): number {
  if (html.getAttribute("data-corridor-engaged") === "true") {
    const phase = html.getAttribute("data-corridor-phase");
    const idx = phase ? MANIFEST_ENTRIES.findIndex((e) => e.corridorPhase === phase) : -1;
    return idx >= 0 ? idx : THESIS_IDX;
  }
  const key = html.getAttribute("data-active-station") || "hero";
  let idx = MANIFEST_ENTRIES.findIndex((e) => e.kind === "station" && e.targetId === key);
  if (idx < 0) idx = 0;
  if (idx === 0) {
    // Rule 3 — seam gap. Single batched rect read, active only in the
    // hero/corridor regime (callers gate their scroll listener on
    // `idx <= ARC_IDX`).
    const mount = document.getElementById(CORRIDOR_MOUNT_ID);
    if (mount && mount.getBoundingClientRect().top < window.innerHeight / 2) return ARC_IDX;
  }
  return idx;
}
