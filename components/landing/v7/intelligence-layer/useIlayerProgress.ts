"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { create } from "zustand";

gsap.registerPlugin(ScrollTrigger);

/**
 * useIlayerProgressStore — per-frame scroll progress for the
 * intelligence-layer section.
 *
 * The R3F scene reads `progress` inside `useFrame` to drive its
 * tilt + Y-split animation. A Zustand store is used (not React
 * state) so per-frame writes do not cascade re-renders through
 * the rest of the page; the canvas pulls the value imperatively.
 *
 *   progress = 0   the section's top is at viewport bottom (just
 *                  about to enter)
 *   progress = 1   the section's bottom has reached the upper third
 *                  of the viewport (about to leave)
 *
 * The store is also where the static-fallback hook flips
 * `mode` from `"r3f"` to `"static"` on small screens or when
 * `prefers-reduced-motion: reduce` is set. The portal reads
 * `mode` to decide whether to mount the canvas at all.
 */

export type IlayerMode = "r3f" | "static";

interface IlayerProgressState {
  progress: number;
  mode: IlayerMode;
  setProgress: (p: number) => void;
  setMode: (m: IlayerMode) => void;
}

export const useIlayerProgressStore = create<IlayerProgressState>((set) => ({
  progress: 0,
  mode: "r3f",
  setProgress: (p) => set((state) => (state.progress === p ? state : { progress: p })),
  setMode: (m) => set((state) => (state.mode === m ? state : { mode: m })),
}));

/**
 * useIlayerProgress — owns the scroll trigger that drives the
 * intelligence-layer choreography.
 *
 * Wires one ScrollTrigger to `#intelligence-layer` with
 * `scrub: true` so the per-frame progress mirrors scroll position
 * exactly (no lag, no smoothing). The trigger window is generous
 * (top of section enters at 80% of viewport, bottom leaves at
 * 20%) so the rotate-and-split animation has room to breathe
 * across the full section height (100svh).
 *
 * Side effects:
 *   - writes `progress` (0..1) into the Zustand store every frame
 *   - sets `data-ilayer-state="open"` on `.ilayer__stack` once
 *     progress crosses 0.4, so the annotation clusters fade in
 *   - resets to `closed` when progress drops back below 0.3
 *     (hysteresis prevents flicker on slow back-scrolls)
 *
 * Mounted from {@link IntelligenceLayerPortal} so it only runs
 * when the section's DOM exists. No-op when there is no
 * `#intelligence-layer` element.
 */
export function useIlayerProgress(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = document.getElementById("intelligence-layer");
    if (!section) return;
    const stack = section.querySelector<HTMLElement>(".ilayer__stack");

    const setProgress = useIlayerProgressStore.getState().setProgress;

    let openState: "open" | "closed" = "closed";
    const setOpenState = (next: "open" | "closed") => {
      if (next === openState) return;
      openState = next;
      if (stack) stack.setAttribute("data-ilayer-state", next);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        setProgress(p);
        if (p > 0.4) setOpenState("open");
        else if (p < 0.3) setOpenState("closed");
      },
    });

    return () => {
      trigger.kill();
      setProgress(0);
      if (stack) stack.removeAttribute("data-ilayer-state");
    };
  }, []);
}
