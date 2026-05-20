"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  INITIAL_TRANSFORM,
  deriveChambers,
  smoothstep,
  useDepthGatewayStore,
} from "@/lib/stores/depthGatewayStore";

/**
 * useDepthScroll — rAF-throttled scroll watcher for the home-v2
 * depth-gateway stage.
 *
 * Modeled on `useLandingScroll` (the v7 production hook): listens
 * to `window.scroll`, schedules a single rAF tick per frame, and
 * computes a 0..1 progress across the sticky stage. Progress is
 * written to:
 *
 *   1. CSS custom properties on the stage root —
 *      `--depth-progress`, `--chamber-{a,b,c}-progress`, plus the
 *      three section opacity vars `--chamber-{A,B,C}-section-opacity`
 *      that gate the chamber DOM sections' cross-fade.
 *
 *   2. `depthGatewayStore` — single store the R3F painters read
 *      imperatively inside `useFrame` so per-frame work stays at
 *      uniform writes only.
 *
 * Cross-fade envelopes are smoothstep'd across ~12% of global
 * progress at each chamber boundary so transitions feel like
 * camera passing through, not abrupt swaps.
 *
 *   global progress     0     0.27   0.39  0.61   0.73  1.0
 *   chamber A opacity   1 ─────────╲                          0
 *                                    ╲
 *   chamber B opacity   0          ╱──────────────╲           0
 *                                                  ╲
 *   chamber C opacity   0                            ╲──────────1
 */
export function useDepthScroll(stageRef: React.RefObject<HTMLDivElement | null>): void {
  const rafId = useRef<number | null>(null);
  const lastProgress = useRef<number>(-1);

  const writeFrame = useCallback(() => {
    rafId.current = null;
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight;
    const stageHeight = rect.height;
    const scrubHeight = Math.max(1, stageHeight - vh);

    const progress = clamp01(-rect.top / scrubHeight);

    const { chamberA, chamberB, chamberC, chamberId } = deriveChambers(progress);

    stage.style.setProperty("--depth-progress", progress.toFixed(4));
    stage.style.setProperty("--chamber-a-progress", chamberA.toFixed(4));
    stage.style.setProperty("--chamber-b-progress", chamberB.toFixed(4));
    stage.style.setProperty("--chamber-c-progress", chamberC.toFixed(4));

    // ── Chamber section cross-fade envelopes ───────────────────
    // Each chamber owns a window. Outside it: opacity 0. At its
    // boundary edge: smoothstep fade. In the center of its window:
    // opacity 1.
    //
    // Boundaries (smoothstep transition zones):
    //   A → B  : progress 0.27..0.39
    //   B → C  : progress 0.61..0.73
    //
    // Held at 1 in the central windows:
    //   A      : progress < 0.27
    //   B      : 0.39 < progress < 0.61
    //   C      : progress > 0.73
    const aOpacity = 1 - smoothstep(0.27, 0.39, progress);
    const bOpacity = smoothstep(0.27, 0.39, progress) * (1 - smoothstep(0.61, 0.73, progress));
    const cOpacity = smoothstep(0.61, 0.73, progress);

    stage.style.setProperty("--chamber-A-section-opacity", aOpacity.toFixed(4));
    stage.style.setProperty("--chamber-B-section-opacity", bOpacity.toFixed(4));
    stage.style.setProperty("--chamber-C-section-opacity", cOpacity.toFixed(4));

    const active = rect.bottom > 0 && rect.top < vh;

    if (Math.abs(progress - lastProgress.current) > 0.00005 || active !== getActive()) {
      lastProgress.current = progress;
      useDepthGatewayStore.getState().setTransform({
        progress,
        chamberId,
        chamberA,
        chamberB,
        chamberC,
        active,
      });
    }
  }, [stageRef]);

  const onScroll = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = window.requestAnimationFrame(writeFrame);
  }, [writeFrame]);

  // First frame synchronously before paint so the canvas + sections
  // don't flash with INITIAL_TRANSFORM during hydration.
  useLayoutEffect(() => {
    writeFrame();
  }, [writeFrame]);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current != null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      useDepthGatewayStore.getState().setTransform(INITIAL_TRANSFORM);
    };
  }, [onScroll]);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function getActive(): boolean {
  return useDepthGatewayStore.getState().transform.active;
}
