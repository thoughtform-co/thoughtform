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

/**
 * The substrate-parked scroll range, in document (page) coordinates.
 * Written by the brandmark choreography hook every frame from the live
 * miss → substrate → rail station centres + PARK_FRAC. Used by the
 * progress hook to align R3F rotation with the brandmark-handoff
 * window, and by `BrandmarkRingfield` to gate the local brandmark
 * particle cloud's visibility.
 *
 *   engageY  = scrollY at which the brandmark journey hands ownership
 *              to the substrate dock (end of miss → substrate transit)
 *   exitY    = scrollY at which the journey hands ownership back to
 *              global particles (start of substrate → rail transit)
 *
 * `null` until the choreography hook resolves all five station anchors
 * (a few frames after first paint, typically). The progress hook falls
 * back to the section's own ScrollTrigger window in that case so the
 * scene still paints something sensible during initial mount.
 */
export interface SubstrateRange {
  engageY: number;
  exitY: number;
}

interface IlayerProgressState {
  progress: number;
  mode: IlayerMode;
  /** True only while the brandmark journey is parked at the substrate
   *  station in particle mode. Used by `BrandmarkRingfield` to gate
   *  the brandmark cloud + bearing decorations: outside this range
   *  the global particle field is the painter and the local R3F
   *  brandmark must stay invisible to avoid a double paint. */
  handoffActive: boolean;
  /** Live substrate-parked scroll range published by the choreography
   *  hook. Used by this hook to compute progress so that progress 0
   *  and progress 1 always coincide with the brandmark hand-off
   *  instants (clean swap from / back to the global particle field). */
  substrateRange: SubstrateRange | null;
  setProgress: (p: number) => void;
  setMode: (m: IlayerMode) => void;
  setHandoffActive: (active: boolean) => void;
  setSubstrateRange: (range: SubstrateRange | null) => void;
}

export const useIlayerProgressStore = create<IlayerProgressState>((set) => ({
  progress: 0,
  mode: "r3f",
  handoffActive: false,
  substrateRange: null,
  setProgress: (p) => set((state) => (state.progress === p ? state : { progress: p })),
  setMode: (m) => set((state) => (state.mode === m ? state : { mode: m })),
  setHandoffActive: (active) =>
    set((state) => (state.handoffActive === active ? state : { handoffActive: active })),
  setSubstrateRange: (range) =>
    set((state) => {
      const prev = state.substrateRange;
      if (prev === range) return state;
      if (
        prev &&
        range &&
        Math.abs(prev.engageY - range.engageY) < 0.5 &&
        Math.abs(prev.exitY - range.exitY) < 0.5
      ) {
        return state;
      }
      return { substrateRange: range };
    }),
}));

/**
 * useIlayerProgress — owns the scroll trigger that drives the
 * intelligence-layer choreography (ADR-012 v5b — handoff-aligned).
 *
 * Responsibilities:
 *
 *   1. Drives the R3F scene's `progress` from the live
 *      substrate-parked scroll range published by the brandmark
 *      choreography hook. progress = 0 at the moment the global
 *      particle field hands ownership to the local R3F brandmark
 *      cloud; progress = 1 at the moment the R3F cloud hands
 *      ownership back to the global field for the substrate → rail
 *      transit. This keeps the brandmark axis-aligned at both swap
 *      instants (per `splitRotation`'s rotate-only [0..0.30] and
 *      handoff [0.92..1.00] beats), so the swap reads as visual
 *      continuity instead of a sudden rotated re-appearance.
 *      Falls back to a `top 80% → bottom 20%` ScrollTrigger window
 *      while the choreography is still resolving its anchors (first
 *      few frames after mount) so the scene paints something
 *      sensible during initial mount.
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

    /**
     * Compute progress from the live substrate-parked range published
     * by the brandmark choreography hook. The range is the scroll
     * window during which the journey is parked at the intelligence-
     * layer substrate station — i.e. the window during which the
     * R3F ringfield owns the brandmark.
     *
     *   progress = 0  at the moment global particles silence and the
     *                 R3F brandmark cloud takes over (axis-aligned)
     *   progress = 1  at the moment the R3F brandmark cloud yields
     *                 back to global particles for the substrate →
     *                 rail transit (axis-aligned again, per the
     *                 splitRotation envelope's HANDOFF beat)
     *
     * Outside the range the value is clamped to 0 / 1 so the scene's
     * `useFrame` reads a sensible value either way; the brandmark
     * cloud's visibility is gated on `handoffActive`, NOT on
     * progress, so the R3F scene is invisible (or geometrically
     * absent) at progress 0 while the global particle field paints.
     */
    const computeProgressFromRange = (scrollY: number, range: SubstrateRange): number => {
      const span = range.exitY - range.engageY;
      if (span <= 1) return 0;
      const t = (scrollY - range.engageY) / span;
      return t < 0 ? 0 : t > 1 ? 1 : t;
    };

    /**
     * Fallback ScrollTrigger window. Used only when the choreography
     * hook has not yet published a substrate range (first few frames
     * after mount, or when one of the journey's anchors fails to
     * resolve). Tuned to the same conservative `top 80% → bottom 20%`
     * window the v5 hook used so behaviour is unchanged for visitors
     * who land directly on / scroll past the section before the
     * choreography stabilises.
     */
    const fallbackProgressFromTrigger = (): number => {
      // We use ScrollTrigger.getById so we don't fight with the
      // primary scroll-driven update path; it's only consulted when
      // substrateRange is null.
      const t = fallbackTrigger?.progress ?? 0;
      return t;
    };

    const fallbackTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
      // No onUpdate — the rAF writer below reads `.progress` directly
      // when no substrate range is published yet.
    });

    let lastWrittenProgress = -1;
    const writeProgressIfChanged = (p: number): void => {
      if (Math.abs(p - lastWrittenProgress) < 0.001) return;
      lastWrittenProgress = p;
      setProgress(p);
      writeFrame(p);
    };

    let rafId = 0;
    const scheduleWrite = (): void => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const range = useIlayerProgressStore.getState().substrateRange;
        const p = range
          ? computeProgressFromRange(window.scrollY, range)
          : fallbackProgressFromTrigger();
        writeProgressIfChanged(p);
      });
    };

    // React to scroll, resize, and to the choreography hook's
    // substrateRange writes. Each path schedules one rAF tick that
    // recomputes progress from whichever input is current.
    window.addEventListener("scroll", scheduleWrite, { passive: true });
    window.addEventListener("resize", scheduleWrite);
    const unsubscribeRange = useIlayerProgressStore.subscribe((state, prev) => {
      if (state.substrateRange !== prev.substrateRange) scheduleWrite();
    });

    // Initial write so the variable exists before the first scroll
    // event (otherwise CSS clamp expressions would fall back to 0
    // and the labels would briefly stay hidden after section entry).
    writeFrame(0);
    scheduleWrite();

    return () => {
      fallbackTrigger.kill();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleWrite);
      window.removeEventListener("resize", scheduleWrite);
      unsubscribeRange();
      setProgress(0);
      useIlayerProgressStore.getState().setHandoffActive(false);
      useIlayerProgressStore.getState().setSubstrateRange(null);
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
