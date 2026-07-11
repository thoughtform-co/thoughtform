"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

export interface ScrollProgressRef {
  /** Document scroll progress [0,1] (Lenis-smoothed values flow through window.scrollY). */
  value: number;
  /** When non-null, overrides the live scroll (control-panel simulation slider). */
  simulate: number | null;
}

/**
 * rAF-written scroll progress ref for per-frame consumers. `useLenis()`
 * re-renders React per scroll frame (fine for DOM readouts); WebGL
 * treatments read THIS ref inside useFrame instead so shader uniform
 * updates never churn React (ADR-002: rAF-batched scroll reads).
 */
export function useScrollProgressRef(active: boolean): MutableRefObject<ScrollProgressRef> {
  const ref = useRef<ScrollProgressRef>({ value: 0, simulate: null });

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      ref.current.value = Math.min(1, Math.max(0, p));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return ref;
}

/** Effective progress: simulation slider wins over live scroll. */
export function readProgress(ref: ScrollProgressRef): number {
  return ref.simulate ?? ref.value;
}
