/**
 * lib/latent-flight/flags — the page's URL switches, parsed once.
 *
 *   ?boot=0        skip the power-on sequence (rest state from the first frame)
 *   ?hold=<cue>    freeze the boot clock at a cue's `at` (deterministic stills)
 *   ?capture=1     expose `window.__latentFlight` and keep the drawing buffer
 *   ?rm=1          force reduced motion (the media query also sets it)
 *
 * Pure over a search string so it is unit-testable and SSR-safe; the shell
 * reads `location.search` through `useSyncExternalStore` and hands the
 * string here.
 */

export interface LfFlags {
  /** Run the boot sequence (default true). */
  boot: boolean;
  /** Freeze the boot clock at this cue id, or null. */
  hold: string | null;
  /** Capture mode: debug handle + preserved drawing buffer. */
  capture: boolean;
  /** Reduced motion, from the query. The engine ORs it with the media query. */
  reducedMotion: boolean;
  /** `?bloom=0` mutes the bloom pass — the on/off diff is a capture gate. */
  bloom: boolean;
}

export const DEFAULT_FLAGS: LfFlags = {
  boot: true,
  hold: null,
  capture: false,
  reducedMotion: false,
  bloom: true,
};

export function parseFlags(search: string): LfFlags {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const hold = q.get("hold");
  return {
    boot: q.get("boot") !== "0",
    hold: hold && /^[a-z0-9-]+$/i.test(hold) ? hold : null,
    capture: q.get("capture") === "1",
    reducedMotion: q.get("rm") === "1",
    bloom: q.get("bloom") !== "0",
  };
}
