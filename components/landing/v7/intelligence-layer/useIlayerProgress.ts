"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { create } from "zustand";
import { useIlayerGeomStore } from "./intelligenceLayerGeom";

gsap.registerPlugin(ScrollTrigger);

/**
 * useIlayerProgressStore — per-frame scroll progress for the
 * intelligence-layer section.
 *
 * The R3F scene reads `progress` inside `useFrame` to drive its
 * single-scalar splitProgress envelope (rotation + per-ring
 * extrusion + tick / diamond / arc geometric reveals). A Zustand
 * store is used (not React state) so per-frame writes do not
 * cascade re-renders through the rest of the page; the canvas
 * pulls the value imperatively.
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
 * useIlayerProgress — owns the scroll trigger that drives the
 * intelligence-layer choreography (ADR-012 v5).
 *
 * Responsibilities:
 *
 *   1. Wires one ScrollTrigger to `#intelligence-layer` with
 *      `scrub: true` so the per-frame progress mirrors scroll
 *      position exactly. The trigger window is generous
 *      (top of section enters at 80% of viewport, bottom leaves at
 *      20%) so the rotate / extrude / settle / hold / retract /
 *      handoff arc has room to breathe across the full section
 *      height (100svh).
 *
 *   2. Writes `--ilayer-progress` on the section root element so
 *      the floating annotation labels' per-label opacity gates
 *      (declared in landing.css via clamp() expressions on this
 *      variable) can fade in sequentially as the rings emerge.
 *      This is the ONLY CSS variable the hook writes — every other
 *      visible state is owned by the R3F scene's geometric
 *      transforms.
 *
 *   3. Sizes the substrate dock anchor (`.ilayer__brandmark-anchor`)
 *      to match the encode ring's projected screen rect on init
 *      and on resize. This is the precondition for the boundary
 *      HARD SWAP between the global brandmark painter (entering
 *      the section) and the local R3F particle cloud (taking
 *      ownership for the duration) to be VISUALLY INVISIBLE — both
 *      paint the brandmark glyph at exactly the same pixels at the
 *      swap instant.
 *
 *   4. Writes `progress` (0..1) into `useIlayerProgressStore`
 *      every scroll frame so the R3F scene's `useFrame` can read
 *      it imperatively.
 *
 * What this hook does NOT do (intentionally, per ADR-012 v5):
 *
 *   - No per-frame opacity writes. The boundary handoffs are HARD
 *     SWAPS via the `[data-ilayer-mode="r3f"]` CSS attribute (set
 *     by `IntelligenceLayerPortal`); within the section, the
 *     visible reveal of major scene elements is geometric (scale
 *     0 = invisible, scale 1 = visible).
 *
 *   - No `--ilayer-tilt-deg`, no `--ilayer-anchor-x/y/scale`. The
 *     v4 anchor descent + tilt envelope is gone. The SVG dock
 *     inside the anchor is hidden the moment the canvas mounts;
 *     it doesn't tilt or descend, it's just not visible.
 *
 *   - No `--ilayer-svg-dock-opacity`. The crossfade is replaced by
 *     a static CSS attribute gate. See `landing.css`'s
 *     `[data-ilayer-mode="r3f"] .ilayer__brandmark-anchor` rule.
 *
 * Mounted from `IntelligenceLayerPortal` so it only runs when the
 * section's DOM exists. No-op when there is no
 * `#intelligence-layer` element.
 */
export function useIlayerProgress(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const section = document.getElementById("intelligence-layer");
    if (!section) return;

    const setProgress = useIlayerProgressStore.getState().setProgress;

    /**
     * Size the substrate dock anchor to match the encode ring's
     * projected screen rect. Reads from `useIlayerGeomStore.encodeRect`
     * (populated each frame by the R3F scene's `EncodeRectReporter`)
     * and writes static inline `top` / `left` / `width` / `height`
     * on `.ilayer__brandmark-anchor`.
     *
     * Run on init and on resize. NOT every frame — the anchor's
     * size only matters at the boundary swap instants (progress 0
     * and progress 1, where the parent rotation is 0 and the ring
     * is at z=0). At those moments the R3F brandmark cloud and the
     * SVG dock at the anchor share the same pixels.
     */
    const sizeAnchor = (): void => {
      const anchor = section.querySelector<HTMLElement>(".ilayer__brandmark-anchor");
      if (!anchor) return;
      const encodeRect = useIlayerGeomStore.getState().encodeRect;
      const sectionRect = section.getBoundingClientRect();
      let target: { top: number; left: number; width: number; height: number };
      if (encodeRect && encodeRect.width > 8) {
        // Convert from viewport coords (encodeRect) to the
        // section's positioning context coords.
        target = {
          top: encodeRect.y - sectionRect.top,
          left: encodeRect.x - sectionRect.left,
          width: encodeRect.width,
          height: encodeRect.height,
        };
      } else {
        // Synthetic fallback when the R3F scene hasn't projected
        // a rect yet (static-fallback mode, or before first frame):
        // place the anchor centred horizontally near the section's
        // vertical centre at a sensible default size.
        const fallbackDiameter = Math.min(sectionRect.width, sectionRect.height) * 0.32;
        target = {
          top: sectionRect.height * 0.5 - fallbackDiameter / 2,
          left: sectionRect.width * 0.5 - fallbackDiameter / 2,
          width: fallbackDiameter,
          height: fallbackDiameter,
        };
      }
      anchor.style.top = `${target.top.toFixed(1)}px`;
      anchor.style.left = `${target.left.toFixed(1)}px`;
      anchor.style.width = `${target.width.toFixed(1)}px`;
      anchor.style.height = `${target.height.toFixed(1)}px`;
      // Clear the fallback `transform: translateX(-50%)` from the CSS
      // because we're now writing `left` as the rect's LEFT edge
      // (not the centre); leaving the transform would offset the
      // anchor by another -50% width and break the boundary swap.
      anchor.style.transform = "none";
    };

    // Initial anchor sizing (best-effort, will likely use the
    // synthetic fallback because the R3F scene hasn't projected
    // its first frame yet). The next call after ~500ms will pick
    // up the real projected rect.
    sizeAnchor();

    // Subscribe to the geom store so we re-size the anchor
    // whenever the encode rect changes (resize, canvas remount).
    const unsubscribeGeom = useIlayerGeomStore.subscribe(() => {
      sizeAnchor();
    });

    // Re-size on window resize too — `EncodeRectReporter` will
    // update the store, which triggers our subscription, but
    // running it on `resize` is belt-and-braces.
    const onResize = (): void => sizeAnchor();
    window.addEventListener("resize", onResize);

    /**
     * Per-scroll-frame writer. Updates the section root's
     * `--ilayer-progress` variable for the floating-label opacity
     * gates and pushes progress into the Zustand store for the
     * R3F scene.
     */
    const writeFrame = (progress: number): void => {
      section.style.setProperty("--ilayer-progress", progress.toFixed(3));
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        setProgress(p);
        writeFrame(p);
      },
    });

    // Initial write so the variable exists before the first scroll
    // event (otherwise CSS clamp expressions would fall back to 0
    // and the labels would briefly stay hidden after section entry).
    writeFrame(0);

    return () => {
      trigger.kill();
      setProgress(0);
      unsubscribeGeom();
      window.removeEventListener("resize", onResize);
      section.style.removeProperty("--ilayer-progress");
      // We deliberately do NOT clear the anchor's inline width /
      // height / top / left here — leaving them in place keeps the
      // anchor at the right size across HMR cycles. They're
      // overwritten on the next mount.
    };
  }, []);
}
