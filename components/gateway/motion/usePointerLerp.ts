"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";

export interface PointerLerpRef {
  /** Smoothed pointer in [-1, 1]^2 relative to the stage center. */
  x: number;
  y: number;
  /** Raw target (pre-smoothing) — exposed for debugging. */
  tx: number;
  ty: number;
}

/**
 * Pointer position over `stageRef`, normalized to [-1,1] from the stage
 * center and lerped toward the target each rAF (decaying back to center
 * when the pointer leaves). Written into a mutable ref — NO React state,
 * so per-frame consumers (shader uniforms, camera rigs) read it for free.
 *
 * The rAF only runs while `active` is true (stage on screen).
 */
export function usePointerLerp(
  stageRef: RefObject<HTMLElement | null>,
  active: boolean,
  smoothing = 0.08
): MutableRefObject<PointerLerpRef> {
  const pointer = useRef<PointerLerpRef>({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !active) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.current.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.current.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onLeave = () => {
      pointer.current.tx = 0;
      pointer.current.ty = 0;
    };

    let raf = 0;
    const tick = () => {
      const p = pointer.current;
      p.x += (p.tx - p.x) * smoothing;
      p.y += (p.ty - p.y) * smoothing;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [stageRef, active, smoothing]);

  return pointer;
}
