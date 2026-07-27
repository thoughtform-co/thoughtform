/**
 * Rail Manifest — shared click-to-navigate (ADR-031).
 *
 * The manifest is diegetic navigation: clicking a journey entry scrolls
 * to its station (`scrollIntoView`) or, for the two corridor phases,
 * lands a tuned fraction into the shared corridor mount runway.
 * Extracted from `RailManifestController` as the single home for this
 * scroll behavior. Under `prefers-reduced-motion` the scroll jumps.
 */

import { CORRIDOR_MOUNT_ID, type ManifestEntry } from "./entries";

/**
 * The document-scroll offset (px from the top) at which a manifest entry's
 * target sits: a station's `offsetTop`, or, for the two corridor phases, a
 * tuned fraction into the shared corridor mount runway. Returns `null` when
 * the target element is absent. Single home for this recipe so the
 * click-to-scroll AND the rail detent table (`detentTable.ts`) agree.
 */
export function scrollTargetForEntry(entry: ManifestEntry): number | null {
  if (entry.kind === "corridor") {
    const mount = document.getElementById(CORRIDOR_MOUNT_ID);
    if (!mount) return null;
    const runway = Math.max(0, mount.offsetHeight - window.innerHeight);
    return mount.offsetTop + (entry.scrollFraction ?? 0) * runway;
  }
  const el = document.getElementById(entry.targetId);
  return el ? el.offsetTop : null;
}

/** Scroll to a manifest entry's target. `reduceMotion` jumps instead of gliding. */
export function scrollToManifestEntry(entry: ManifestEntry, reduceMotion: boolean): void {
  const target = scrollTargetForEntry(entry);
  if (target == null) return;
  window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
}

/**
 * Scroll to an element by id. For subsections that live INSIDE a station
 * and so have no manifest entry of their own — the `#proof` beats
 * (ADR-054). Absent element is a no-op.
 *
 * Deliberately NOT `offsetTop`, which the station entries above can use
 * safely only because they are direct children of the unpositioned
 * `.stations`. A nested beat's `offsetParent` is its station — and
 * `#proof` IS positioned while the corridor-exit band is live — so
 * `offsetTop` yields a station-relative number (~900 instead of ~11520)
 * and the click lands near the top of the page.
 */
export function scrollToElementTop(elementId: string, reduceMotion: boolean): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
}
