"use client";

import { useEffect } from "react";

/**
 * useDiagnosticPillOrbits — re-purposed engagement observer for
 * `#missing-layer` (the Diagnostic section).
 *
 * Was a per-frame orbital drift driver for the pill labels (10-13
 * min revolutions). Removed once the labels grew into full sentences
 * the reader needed to settle on. Now the hook owns one job: watch
 * `#missing-layer` with an IntersectionObserver and set
 * `data-miss-engaged="true"` on the landing root while the section
 * is solidly in view.
 *
 * The flag is read by:
 *
 *   - [TravelingOrbits.tsx](../orbits/TravelingOrbits.tsx) — the
 *     four-ring painter early-outs its per-frame compute while
 *     engaged AND parked at miss, so the orbits hold a perfect
 *     snapshot instead of jiggling on every scroll tick.
 *   - [useBrandmarkJourney.ts](./useBrandmarkJourney.ts) — skips
 *     the per-frame store write under the same conditions so the
 *     brandmark vector glyph holds in lockstep with the orbits.
 *
 * Reverse-scrolling out of the section drops the attribute and the
 * live computes resume immediately, so the journey reverses
 * naturally as the user scrolls back up into `#definition`.
 *
 * The 10% / 10% rootMargin shrink means the freeze only engages
 * once the section is clearly the dominant one in the viewport — it
 * never traps mid-transit, when the brandmark is still in motion
 * along the sigil → miss leg.
 */
export function useDiagnosticPillOrbits(rootRef?: React.RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = rootRef?.current ?? null;

    const target = (root ?? document).querySelector<HTMLElement>("#missing-layer");
    if (!target) return;

    // Resolve the attribute host — prefer the landing root so this
    // is scoped to the v7 page, fall back to the documentElement so
    // any prototype variant that hosts #missing-layer in a different
    // tree still gets the flag.
    const host: HTMLElement = root ?? document.documentElement;

    const setEngaged = (engaged: boolean) => {
      if (engaged) host.setAttribute("data-miss-engaged", "true");
      else host.removeAttribute("data-miss-engaged");
    };

    const io = new IntersectionObserver(
      ([entry]) => setEngaged(!!entry?.isIntersecting),
      // Shrink by 10% top/bottom so the freeze only kicks in once
      // the section is clearly dominant in the viewport (avoids
      // catching the brandmark mid-transit at the section edges).
      { rootMargin: "-10% 0px -10% 0px", threshold: 0 }
    );
    io.observe(target);

    return () => {
      io.disconnect();
      host.removeAttribute("data-miss-engaged");
    };
  }, [rootRef]);
}
