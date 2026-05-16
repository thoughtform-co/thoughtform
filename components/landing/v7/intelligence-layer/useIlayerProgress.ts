"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * useIlayerProgress (ADR-013 simplified) — writes the
 * `--ilayer-progress` CSS variable on `#intelligence-layer` so the
 * floating annotation labels (`.ilayer__label--*`) can fade in
 * sequentially as the substrate window's ring progress ramps 0 → 1.
 *
 * The hook subscribes to `brandmarkJourneyStore.transform.ringProgress`
 * — the single source of truth for "how far through the substrate
 * window are we?" — and mirrors it into the CSS variable. The label
 * fade-ins are TEXT labels, not brandmark decorations, so opacity
 * ramps are appropriate here (Principle 4 forbids opacity for
 * decoration appearance; the labels' opacity is fine).
 *
 * Retired in this hook (ADR-013 Phase 3b):
 *
 *   - `sizeAnchor` / `EncodeRectReporter` — the substrate dock
 *     anchor's CSS rect was previously written from the R3F
 *     encode-ring's projected screen rect so the SVG dock and the
 *     R3F brandmark cloud shared exactly the same pixels at the
 *     HARD SWAP. With the single-painter model there is no HARD
 *     SWAP; the substrate anchor's rect comes from its CSS
 *     defaults and the journey transform's `rect` reads it via
 *     `getBoundingClientRect()`.
 *
 *   - `setSubstrateRange` / `setHandoffActive` channels — replaced
 *     by `transform.ringsActive` + `transform.ringProgress` on the
 *     journey store.
 *
 *   - Per-frame ScrollTrigger fallback — the journey hook owns
 *     scroll math now and publishes a transform every rAF tick.
 */

export type IlayerMode = "r3f" | "static";

interface IlayerProgressState {
  /** Render mode of the intelligence-layer section. Set by
   *  `IntelligenceLayerPortal` based on WebGL + reduced-motion +
   *  viewport width. Drives whether the R3F canvas mounts. */
  mode: IlayerMode;
  setMode: (m: IlayerMode) => void;
}

/** Single mode channel for the intelligence-layer section. Everything
 *  else (progress, ringsActive, encode rect, substrate range) is
 *  derived from `brandmarkJourneyStore.transform` now. */
export const useIlayerProgressStore = create<IlayerProgressState>((set) => ({
  mode: "r3f",
  setMode: (m) => set((state) => (state.mode === m ? state : { mode: m })),
}));

/**
 * useIlayerProgress — mirror `ringProgress` from the journey store
 * into the section's `--ilayer-progress` CSS variable so the
 * annotation labels can fade in/out across the substrate window.
 *
 * Mounted from `IntelligenceLayerPortal`. No-op when the section
 * isn't present.
 */
export function useIlayerProgress(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = document.getElementById("intelligence-layer");
    if (!section) return;

    let lastWritten = -1;
    const writeVar = (value: number) => {
      if (Math.abs(value - lastWritten) < 0.001) return;
      lastWritten = value;
      section.style.setProperty("--ilayer-progress", value.toFixed(3));
    };

    // Initial write so the variable exists before the first scroll
    // event (CSS clamp expressions reading it fall back to 0 if the
    // variable is unset, but it's cleaner to publish from the start).
    writeVar(useBrandmarkJourneyStore.getState().transform.ringProgress);

    // Subscribe imperatively so per-frame writes don't cascade
    // re-renders. The journey store's transform pointer changes
    // whenever the journey hook writes a new transform; we only
    // mirror the `ringProgress` channel.
    const unsubscribe = useBrandmarkJourneyStore.subscribe((state) => {
      writeVar(state.transform.ringProgress);
    });

    return () => {
      unsubscribe();
      section.style.removeProperty("--ilayer-progress");
    };
  }, []);
}
