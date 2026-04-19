"use client";

import { useMemo } from "react";

export interface SceneTransitionState {
  blur: number;
  progress: number;
  incoming: boolean;
  outgoing: boolean;
  active: boolean;
}

function smoothstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

/**
 * Computes a blur-and-swap transition around a scroll threshold.
 * Given the current scroll progress and a threshold+band, returns the
 * blur intensity (0-MAX_BLUR) and phase flags consumers can use to
 * crossfade DOM panels AND drive an R3F postprocessing pass in sync.
 */
export function useSceneTransition(
  scrollProgress: number,
  threshold: number,
  band = 0.05,
  maxBlur = 12
): SceneTransitionState {
  return useMemo(() => {
    const half = band / 2;
    const raw = (scrollProgress - (threshold - half)) / band;
    const t = smoothstep(raw);
    const active = raw > 0 && raw < 1;
    const blur = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * maxBlur;
    return {
      blur,
      progress: t,
      outgoing: active && t < 0.5,
      incoming: active && t >= 0.5,
      active,
    };
  }, [scrollProgress, threshold, band, maxBlur]);
}
