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
 * rings-emerging + tilt animation. A Zustand store is used (not
 * React state) so per-frame writes do not cascade re-renders
 * through the rest of the page; the canvas pulls the value
 * imperatively.
 *
 *   progress = 0   the section's top is at viewport bottom (just
 *                  about to enter)
 *   progress = 1   the section's bottom has reached the upper
 *                  third of the viewport (about to leave)
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
 * tiltEnvelope — must match the R3F scene's `tiltEnvelope` shape
 * exactly. Ramps 0 → 1 across [0.00..0.50], holds at 1 across
 * [0.50..0.85], eases back to 0 across [0.85..1.00]. Returning the
 * brandmark to an un-rotated state by progress=1 keeps the
 * choreography handoff to rail clean (the substrate dock anchor's
 * bbox stays axis-aligned for the actor's pinToRect read).
 *
 * This duplication is intentional: the R3F module owns its copy so
 * the canvas stays self-contained, and this hook owns its copy so
 * a CSS-only consumer (the brandmark dock anchor) stays decoupled
 * from the R3F bundle. They are tested against each other via
 * shared progress writes — if one drifts, the brandmark and the
 * rings will visibly diverge in tilt.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
function tiltEnvelope(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 0;
  if (progress < 0.5) return smoothstep(0.0, 0.5, progress);
  if (progress < 0.85) return 1;
  return 1 - smoothstep(0.85, 1.0, progress);
}
const MAX_TILT_DEG = 22;

/**
 * useIlayerProgress — owns the scroll trigger that drives the
 * intelligence-layer choreography.
 *
 * Wires one ScrollTrigger to `#intelligence-layer` with
 * `scrub: true` so the per-frame progress mirrors scroll position
 * exactly (no lag, no smoothing). The trigger window is generous
 * (top of section enters at 80% of viewport, bottom leaves at
 * 20%) so the rings-emerging + tilt animation has room to breathe
 * across the full section height (100svh).
 *
 * Side effects:
 *   - writes `progress` (0..1) into the Zustand store every frame
 *     so the R3F scene can read it imperatively
 *   - writes `--ilayer-tilt-deg` on the brandmark anchor in
 *     lockstep with the R3F group's tilt, so the SVG brandmark
 *     and the surrounding rings share one X-rotation
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
    const dockAnchor = section.querySelector<HTMLElement>(".ilayer__brandmark-anchor");

    const setProgress = useIlayerProgressStore.getState().setProgress;

    const writeTilt = (progress: number) => {
      if (!dockAnchor) return;
      const tiltDeg = MAX_TILT_DEG * tiltEnvelope(progress);
      // Round to 0.1deg to keep the inline-style write churn low —
      // sub-decidegree changes aren't visible on a 220–320px element.
      dockAnchor.style.setProperty("--ilayer-tilt-deg", `${tiltDeg.toFixed(1)}deg`);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        setProgress(p);
        writeTilt(p);
      },
    });

    return () => {
      trigger.kill();
      setProgress(0);
      if (dockAnchor) dockAnchor.style.removeProperty("--ilayer-tilt-deg");
    };
  }, []);
}
