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

/** Scroll to a manifest entry's target. `reduceMotion` jumps instead of gliding. */
export function scrollToManifestEntry(entry: ManifestEntry, reduceMotion: boolean): void {
  const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
  if (entry.kind === "corridor") {
    const mount = document.getElementById(CORRIDOR_MOUNT_ID);
    if (!mount) return;
    const runway = Math.max(0, mount.offsetHeight - window.innerHeight);
    window.scrollTo({ top: mount.offsetTop + (entry.scrollFraction ?? 0) * runway, behavior });
  } else {
    document.getElementById(entry.targetId)?.scrollIntoView({ behavior, block: "start" });
  }
}
