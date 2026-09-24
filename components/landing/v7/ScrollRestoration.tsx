"use client";

import { useEffect } from "react";

import { releaseCorridorImportGate } from "./hooks/useCorridorMount";
import { readScrollMemory, shouldRestore, startScrollMemory } from "@/lib/landing/scrollMemory";

/**
 * The landing lands where the reader was (ADR-123 §Part 1, commit A).
 *
 * `history.scrollRestoration` is set to `manual` for this route while it is
 * mounted (and put back on unmount): the browser's own restore runs before
 * the corridor chunk has arrived and before the pile has split, so on a
 * reload three viewports into the proof stack it clamps against a document
 * that is still short — the "lands at the bottom" the owner saw.
 *
 * The replay instead:
 *   1. reads the memory `scrollMemory.ts` kept (≤4 Hz + `pagehide`),
 *   2. skips when an anchor, a bfcache restore, a rotation or a stale record
 *      says the reader did not come back to THIS layout,
 *   3. releases the ≤960 corridor import gate (which otherwise waits for the
 *      first scroll — and there will be no scroll, the page is being put back),
 *   4. waits for the stage and, on the split rung, the split pile to mount,
 *      then for `scrollHeight` to be still for three frames AND tall enough
 *      to hold the remembered y (4 s cap),
 *   5. scrolls there with `behavior: "instant"`, and re-applies once at
 *      +500 ms if the document grew more than 2px after the landing.
 *
 * Every downstream state is a function of rects, so it reconstructs on the
 * next frame — the stacked cards' channels, the corridor's exit, card 0's
 * covered seed (`ProofStack.tsx`). `navigate` is restored as well as
 * `reload`/`back_forward`, because a jetsam reload may report either; the
 * diag stamps which.
 */

const SPLIT_MEDIA = "(max-width: 960px)";
const CAP_MS = 4000;
const STILL_FRAMES = 3;

export function ScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathname = window.location.pathname;
    const previous = history.scrollRestoration;
    try {
      history.scrollRestoration = "manual";
    } catch {
      /* not writable — the browser keeps its own */
    }

    let cancelled = false;
    let raf = 0;
    let settleTimer = 0;
    let observer: MutationObserver | null = null;

    const rec = readScrollMemory(pathname);
    const persisted =
      (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)
        ?.type === "back_forward";
    const go = shouldRestore(rec, {
      hash: window.location.hash,
      persisted,
      vw: window.innerWidth,
      now: Date.now(),
    });

    const stop = startScrollMemory(pathname);

    if (go) {
      releaseCorridorImportGate();
      const target = rec.y;
      const started = performance.now();
      const isSplit = window.matchMedia?.(SPLIT_MEDIA).matches ?? false;
      const vh = document.documentElement.clientHeight || window.innerHeight;

      const mounted = () =>
        !!document.querySelector(".home-v2-stage") &&
        (!isSplit || !!document.querySelector(".pf-stack--split"));

      const land = () => {
        window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
        const h0 = document.documentElement.scrollHeight;
        settleTimer = window.setTimeout(() => {
          if (cancelled) return;
          if (Math.abs(document.documentElement.scrollHeight - h0) > 2) {
            window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
          }
        }, 500);
      };

      let still = 0;
      let lastH = -1;
      const tick = () => {
        if (cancelled) return;
        const h = document.documentElement.scrollHeight;
        const ready = mounted() && h - vh >= target;
        if (ready && h === lastH) still += 1;
        else still = 0;
        lastH = h;
        if ((ready && still >= STILL_FRAMES) || performance.now() - started > CAP_MS) {
          observer?.disconnect();
          observer = null;
          land();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      observer = new MutationObserver(() => {
        /* the observer only exists to keep the tick honest about a stage that
           mounts late; the rAF loop does the reading */
      });
      observer.observe(document.body, { childList: true, subtree: true });
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      stop();
      if (raf) cancelAnimationFrame(raf);
      if (settleTimer) window.clearTimeout(settleTimer);
      observer?.disconnect();
      try {
        history.scrollRestoration = previous;
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
