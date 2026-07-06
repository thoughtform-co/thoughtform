"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";
import type { BrandmarkTransform } from "@/lib/brandmark/journey";

/** Mirrors the painters' `VISIBILITY_EPSILON` — below this nothing is
 *  drawn, so time passing has no visible effect. */
const LIVE_EPSILON = 0.005;

/** Mirrors `BrandmarkSilhouettePoints`' `SUBSTRATE_HANDOFF_EPSILON`:
 *  past it the silhouette suppresses itself (the intelligence-layer
 *  mesh owns the mark), so its breathing is not visible. */
const SUBSTRATE_HANDOFF_EPSILON = 0.001;

/**
 * True while some painter output visibly depends on `uTime`, i.e. the
 * render loop must keep running with no store writes arriving:
 *
 *   - the silhouette point cloud breathes whenever it paints
 *     (ADR-019 wander), which is whenever `silhouetteMorph` is up and
 *     the substrate window hasn't claimed the mark;
 *   - the atmosphere field's wander amplitude is `dispersion` —
 *     non-zero only during transits (parked keyframes are all
 *     dispersion 0), so exhaust dust keeps drifting mid-transit.
 *
 * Everything else the painters read (rect, density, rotation, morphs)
 * only changes when `useBrandmarkJourney` writes the store — and every
 * write already triggers one repaint via the subscription below.
 */
function isTimeAnimated(t: BrandmarkTransform): boolean {
  if (!t.visible || t.opacity <= LIVE_EPSILON) return false;
  if (t.dispersion > LIVE_EPSILON) return true;
  return t.silhouetteMorph > LIVE_EPSILON && t.substrateMorph <= SUBSTRATE_HANDOFF_EPSILON;
}

/**
 * BrandmarkFrameDriver — frame pump for the demand-mode brandmark
 * canvas. The corridor's `FrameInvalidator` pattern re-keyed from
 * "corridor engaged" to "journey transform is time-animated".
 *
 * Every journey-store write repaints exactly one frame (scroll,
 * resize, visibility and pageshow recomputes all funnel through
 * `setTransform`). While a time-animated term is visible the pump
 * self-sustains on rAF; the moment amplitude drops to zero it dies and
 * the GPU goes fully idle — during hero dwell and past the post-orbit
 * fade the canvas previously burned a full-viewport clear+composite
 * at up to dpr 2 for zero visible pixels.
 *
 * The Canvas stays at a CONSTANT `frameloop="demand"` — toggling the
 * prop resets `clock.elapsedTime` (see BEST-PRACTICES, "frameloop
 * toggles reset the clock"), and `uTime` phase continuity matters to
 * the wander shaders. Phase jumps across idle gaps are invisible by
 * construction: frames only stop while wander amplitude is zero.
 */
export function BrandmarkFrameDriver() {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let raf = 0;
    const pump = () => {
      if (!isTimeAnimated(useBrandmarkJourneyStore.getState().transform)) {
        raf = 0;
        return;
      }
      invalidate();
      raf = requestAnimationFrame(pump);
    };
    const kick = () => {
      invalidate();
      if (!raf) raf = requestAnimationFrame(pump);
    };
    // Settle frame on mount — also covers the glEpoch context-loss
    // remount, which needs one paint to re-sync with the store.
    kick();
    const unsubscribe = useBrandmarkJourneyStore.subscribe(kick);
    return () => {
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [invalidate]);

  return null;
}
