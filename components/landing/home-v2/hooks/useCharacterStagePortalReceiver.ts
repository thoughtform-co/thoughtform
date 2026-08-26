"use client";

import { useEffect, type RefObject } from "react";

import { getCharacterStagePortalState } from "@/lib/voidwalker/characterStagePortalRef";

/**
 * useCharacterStagePortalReceiver — the ADR-082 receiver side of the
 * About → character-stage portal transition.
 *
 * The About runway's exit clock publishes to `characterStagePortalRef`
 * on every scroll frame (via `useAboutStageScroll`); this hook reads
 * that state and writes:
 *
 *   - `--ch-portal-in` on the character-stage root (0..1) — the CSS
 *     receiver, which the viewport uses to fade the stage in over its
 *     rest state (the six-still rail) as the portrait arrives;
 *   - `data-ch-portal="arriving"` at portal ≥ 0.9, so a matching CSS
 *     rule can trigger a single-shot glitch flash sub-animation
 *     (deliberately CSS-only, no JS choreography).
 *
 * ⚠ TWO WRITERS, ONE CHANNEL — the About hook is the ONLY writer of
 * the portal state; this hook is the ONLY writer of the CSS channel on
 * the character stage. The character stage's own scroll hook does not
 * touch this channel.
 *
 * The hook runs an rAF loop only while the portal is ACTIVE (the flag
 * is on and the About runway is engaged). Off, it removes its DOM
 * writes and cancels the loop.
 */
export function useCharacterStagePortalReceiver(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Same conveyance as `useCharacterStageScroll` — the ref may be
    // on the RUNWAY (`.ch-runway`), but the CSS keys on the STAGE
    // (`.ch`). Walk once at effect start.
    const chEl: HTMLElement | null = root.classList.contains("ch")
      ? root
      : root.querySelector<HTMLElement>(".ch");
    if (!chEl) return;

    let raf = 0;
    let disposed = false;
    let lastP = -1;
    let lastArriving: boolean | null = null;

    const clear = () => {
      chEl.style.removeProperty("--ch-portal-in");
      chEl.removeAttribute("data-ch-portal");
      lastP = -1;
      lastArriving = null;
    };

    const tick = () => {
      raf = 0;
      if (disposed) return;
      const state = getCharacterStagePortalState();
      if (!state.active) {
        if (lastP !== 0) clear();
        // Keep the loop primed but idle — check again next frame. This
        // is cheap; the receiver only runs on the marketing page, and
        // the flag is a compile-time constant everywhere else.
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = state.progress;
      if (Math.abs(p - lastP) >= 0.002) {
        chEl.style.setProperty("--ch-portal-in", p.toFixed(4));
        lastP = p;
      }
      const arriving = p >= 0.9;
      if (arriving !== lastArriving) {
        if (arriving) chEl.setAttribute("data-ch-portal", "arriving");
        else chEl.removeAttribute("data-ch-portal");
        lastArriving = arriving;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      clear();
    };
  }, [rootRef]);
}
