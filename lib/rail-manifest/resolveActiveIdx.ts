/**
 * Rail Manifest — shared active-index resolver (ADR-031).
 *
 * The single source of truth for "where is the reader in the journey",
 * resolved from the existing single-writer `<html>` attributes. Lifted
 * out of `RailManifestController` into a pure, testable helper so the
 * subtle seam-gap geometric rule lives in exactly one place.
 *
 * activeIdx resolution priority:
 *   1. `data-corridor-engaged` → the entry matching `data-corridor-phase`
 *      (Update 9: the corridor publishes BEAT granularity — thesis /
 *      navigate / encode / build; thesis fallback — the WebGL fallback
 *      has no corridor writer);
 *   2. else `data-active-station` → its station entry;
 *   3. seam-gap fix: if that yields hero but the corridor mount sits
 *      above viewport-mid, the corridor has been PASSED → its last beat
 *      (Build). (The mount is not a `.station`, so `data-active-station`
 *      lags at "hero" between corridor disengage and the services
 *      crossing.)
 *
 * Pure read — never mutates. The rail controller keys its wake
 * sources (MutationObserver on the three attributes below + a
 * hero/corridor-gated scroll listener for rule 3) off this.
 */

import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES } from "./entries";

export const THESIS_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "thesis");

/** Index of the corridor's LAST beat (Build) — the seam-gap fallback and
 *  the boundary of the hero/corridor scroll-wake regime. */
export const LAST_CORRIDOR_IDX = MANIFEST_ENTRIES.reduce(
  (acc, e, i) => (e.kind === "corridor" ? i : acc),
  0
);

/** The `<html>` attributes the resolver reads — the shared MutationObserver filter. */
export const ACTIVE_IDX_ATTRIBUTES = [
  "data-active-station",
  "data-corridor-engaged",
  "data-corridor-phase",
] as const;

/**
 * Resolve the active journey index from the live `<html>` attribute bus.
 *
 * `preMountStationId` names the station that sits immediately BEFORE the
 * corridor mount on the page being read — the one `data-active-station`
 * lags on while the corridor holds the viewport, because the mount is not
 * a `.station`. On the production page that is `hero`, which is why rule 3
 * was written as `idx === 0`; a homepage variant can order its sections
 * differently (ADR-093: `/trinny-london` opens hero → about → corridor, so
 * the lag station is `about`) and without this parameter its About mark
 * would stay lit through the whole corridor.
 *
 * ⚠ The default keeps `/` and every existing caller byte-identical: only
 * `hero` carries `targetId: "hero"`, and the `idx < 0` fallback lands on it
 * too, so `targetId === "hero"` is exactly the old `idx === 0`.
 */
export function resolveActiveIdx(html: HTMLElement, preMountStationId = "hero"): number {
  if (html.getAttribute("data-corridor-engaged") === "true") {
    const phase = html.getAttribute("data-corridor-phase");
    const idx = phase ? MANIFEST_ENTRIES.findIndex((e) => e.corridorPhase === phase) : -1;
    return idx >= 0 ? idx : THESIS_IDX;
  }
  const key = html.getAttribute("data-active-station") || "hero";
  let idx = MANIFEST_ENTRIES.findIndex((e) => e.kind === "station" && e.targetId === key);
  if (idx < 0) idx = 0;
  if (MANIFEST_ENTRIES[idx]?.targetId === preMountStationId) {
    // Rule 3 — seam gap. Single batched rect read, active only in the
    // hero/corridor regime (callers gate their scroll listener on
    // `idx <= LAST_CORRIDOR_IDX`).
    const mount = document.getElementById(CORRIDOR_MOUNT_ID);
    if (mount && mount.getBoundingClientRect().top < window.innerHeight / 2)
      return LAST_CORRIDOR_IDX;
  }
  return idx;
}
