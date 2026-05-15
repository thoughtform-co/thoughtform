"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { create } from "zustand";
import {
  BRAND_MORPH,
  DISC_GEOM,
  smoothstep,
  tiltEnvelope,
  useIlayerGeomStore,
  type ScreenRect,
} from "./intelligenceLayerGeom";

gsap.registerPlugin(ScrollTrigger);

/**
 * useIlayerProgressStore — per-frame scroll progress for the
 * intelligence-layer section.
 *
 * The R3F scene reads `progress` inside `useFrame` to drive its
 * podium deploy + camera-pitch animation. A Zustand store is used
 * (not React state) so per-frame writes do not cascade re-renders
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
 * Compute a synthetic encode rect from the canvas slot's bbox when
 * the R3F scene isn't mounted (static-fallback mode). Mirrors the
 * `DISC_GEOM.encode.outerR` proportion against the slot's width so
 * the brandmark anchor still lands on roughly the right spot.
 *
 * The slot is a square-ish region pinned to the bottom of the
 * section; the encode disc sits at ~30% of slot height up from the
 * bottom and is ~62% of slot width wide.
 */
function syntheticEncodeRect(slot: HTMLElement): ScreenRect {
  const r = slot.getBoundingClientRect();
  // Encode disc: centre at (slotCx, slotBottom - 0.30 * slotHeight),
  // diameter ~ 0.62 * slotWidth (matches DISC_GEOM.encode.outerR /
  // DISC_GEOM.build.outerR ratio).
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height * 0.7;
  const diameter = r.width * (DISC_GEOM.encode.outerR / DISC_GEOM.build.outerR);
  return {
    x: cx - diameter / 2,
    y: cy - diameter / 2,
    width: diameter,
    height: diameter,
  };
}

/**
 * useIlayerProgress — owns the scroll trigger that drives the
 * intelligence-layer choreography.
 *
 * Wires one ScrollTrigger to `#intelligence-layer` with
 * `scrub: true` so the per-frame progress mirrors scroll position
 * exactly (no lag, no smoothing). The trigger window is generous
 * (top of section enters at 80% of viewport, bottom leaves at
 * 20%) so the podium-deploy + brandmark-morph animation has room
 * to breathe across the full section height (100svh).
 *
 * Side effects, written each frame:
 *
 *   1. `useIlayerProgressStore.progress` (0..1) — read by the R3F
 *      scene's `useFrame` to drive disc reveal + podium pitch.
 *   2. `--ilayer-progress` on `#intelligence-layer` — read by the
 *      floating-label connectors (stroke-dashoffset reveal) and
 *      per-label fade-in keyframes in CSS.
 *   3. `--ilayer-tilt-deg` on `.ilayer__brandmark-anchor`'s
 *      children — keeps the SVG mark's X-tilt in lockstep with the
 *      podium's pitch envelope.
 *   4. `--ilayer-anchor-y`, `--ilayer-anchor-scale` on the anchor
 *      itself — translates + scales the whole anchor down toward
 *      the encode disc's projected screen rect across
 *      [BRAND_MORPH.descend.in..out]. The R3F scene writes the
 *      live encode rect into `useIlayerGeomStore` each frame; we
 *      read it here.
 *   5. `--ilayer-brand-opacity` on the anchor — crossfades the
 *      brandmark from 1 → 0 across [BRAND_MORPH.crossfade.in..out]
 *      so the SVG mark dissolves as the encode disc fades in.
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
    const canvasSlot = section.querySelector<HTMLElement>(".ilayer__stack__canvas");

    const setProgress = useIlayerProgressStore.getState().setProgress;

    /**
     * Resolve where the encode disc will land in viewport
     * coordinates. R3F-mode reads from the live geom store (the
     * scene projects the disc each frame). Static-fallback mode
     * derives a synthetic rect from the canvas slot's bbox so the
     * brandmark still lands sensibly without WebGL.
     */
    const resolveEncodeRect = (): ScreenRect | null => {
      const live = useIlayerGeomStore.getState().encodeRect;
      if (live) return live;
      if (canvasSlot) return syntheticEncodeRect(canvasSlot);
      return null;
    };

    /** Anchor's *resting* viewport rect (where it sits at progress 0,
     *  before any descent). Read live so window resizes are picked
     *  up automatically. */
    const readAnchorRect = (): DOMRect | null => {
      if (!dockAnchor) return null;
      // Strip the current transform so we read the *base* (untransformed)
      // rect. We do this by temporarily clearing the transform-driving
      // CSS variables, reading, then restoring. Cheap because the
      // browser already had to compose the transform for layout.
      // (For a one-off mount we just read what's there.)
      return dockAnchor.getBoundingClientRect();
    };

    const writeFrame = (progress: number) => {
      // Section root variables — read by .ilayer__label connector
      // SVG paths (stroke-dashoffset) and per-label fade-in.
      section.style.setProperty("--ilayer-progress", progress.toFixed(3));

      if (!dockAnchor) return;

      // 1. Tilt — same envelope shape as the R3F podium pitch.
      const tiltDeg = BRAND_MORPH.maxTiltDeg * tiltEnvelope(progress);
      dockAnchor.style.setProperty("--ilayer-tilt-deg", `${tiltDeg.toFixed(1)}deg`);

      // 2. Brandmark crossfade — 1 until crossfade.in, eases to 0 by
      //    crossfade.out. Multiplied with the existing dock-state
      //    opacity gate in landing.css.
      const fadeT = smoothstep(BRAND_MORPH.crossfade.in, BRAND_MORPH.crossfade.out, progress);
      const brandOpacity = 1 - fadeT;
      dockAnchor.style.setProperty("--ilayer-brand-opacity", brandOpacity.toFixed(3));

      // 3. Descent + scale — translate the anchor from its resting
      //    position toward the encode disc's projected centre, and
      //    scale it up so its visual diameter matches the disc.
      const descentT = smoothstep(BRAND_MORPH.descend.in, BRAND_MORPH.descend.out, progress);
      const encodeRect = resolveEncodeRect();
      const anchorRect = readAnchorRect();
      if (encodeRect && anchorRect && anchorRect.width > 1) {
        const anchorCx = anchorRect.left + anchorRect.width / 2;
        const anchorCy = anchorRect.top + anchorRect.height / 2;
        const encodeCx = encodeRect.x + encodeRect.width / 2;
        const encodeCy = encodeRect.y + encodeRect.height / 2;
        // The anchor's CSS transform is `translateX(-50%) translateY(--y)
        // scale(--s)`, so --y is a delta in viewport pixels from the
        // anchor's resting centre to the target centre. The current
        // anchorRect already includes any transform we wrote on the
        // previous frame — to avoid feedback we don't subtract our
        // own previous --y here; instead we treat --y as "where do
        // we want to be relative to the resting position", and the
        // resting position is anchorRect.top - lastY. But since the
        // resting position is what `top: clamp(...)` in CSS gave us,
        // and the translate is on top of it, the cleanest stable
        // formula is: target Y delta = encodeCy - (anchorCy - lastY).
        // We approximate by reading the inline style we wrote last
        // frame.
        const lastYStr = dockAnchor.style.getPropertyValue("--ilayer-anchor-y");
        const lastY = lastYStr ? parseFloat(lastYStr) : 0;
        const lastSStr = dockAnchor.style.getPropertyValue("--ilayer-anchor-scale");
        const lastS = lastSStr ? parseFloat(lastSStr) : 1;
        // Resting (untransformed) centre is current centre minus the
        // inline-applied Y translation. (X is centred via translateX(-50%)
        // and we don't write X, so anchorCx is already the resting X.)
        const restingCy = anchorCy - lastY;
        const restingHeight = anchorRect.height / Math.max(0.01, lastS);

        const targetY = (encodeCy - restingCy) * descentT;
        const restingDiameter = restingHeight; // anchor is square
        const encodeDiameter = encodeRect.height;
        const targetScaleAtMorphEnd = encodeDiameter / Math.max(8, restingDiameter);
        const targetScale = 1 + (targetScaleAtMorphEnd - 1) * descentT;

        dockAnchor.style.setProperty("--ilayer-anchor-y", `${targetY.toFixed(1)}px`);
        dockAnchor.style.setProperty("--ilayer-anchor-scale", targetScale.toFixed(3));

        // X-translation — usually zero (anchor is centred horizontally
        // and the encode disc is too), but we write it for safety so
        // any future asymmetry (e.g. side-mounted variant) just works.
        const targetX = (encodeCx - anchorCx) * descentT;
        dockAnchor.style.setProperty("--ilayer-anchor-x", `${targetX.toFixed(1)}px`);
      } else {
        // No rect yet (R3F still booting) — pin to identity so the
        // anchor stays put rather than glitching toward (0,0).
        dockAnchor.style.setProperty("--ilayer-anchor-y", "0px");
        dockAnchor.style.setProperty("--ilayer-anchor-x", "0px");
        dockAnchor.style.setProperty("--ilayer-anchor-scale", "1");
      }
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

    // Initial write so the anchor variables exist before the first
    // scroll event (otherwise the first frame paints with the
    // browser's `var(...)` fallback values).
    writeFrame(0);

    return () => {
      trigger.kill();
      setProgress(0);
      if (dockAnchor) {
        dockAnchor.style.removeProperty("--ilayer-tilt-deg");
        dockAnchor.style.removeProperty("--ilayer-anchor-y");
        dockAnchor.style.removeProperty("--ilayer-anchor-x");
        dockAnchor.style.removeProperty("--ilayer-anchor-scale");
        dockAnchor.style.removeProperty("--ilayer-brand-opacity");
      }
      section.style.removeProperty("--ilayer-progress");
    };
  }, []);
}
