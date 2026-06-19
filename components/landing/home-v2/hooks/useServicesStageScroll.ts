"use client";

import { useEffect, type RefObject } from "react";

/** Number of services / scroll segments in the pinned stage. */
const STEP_COUNT = 3;

/**
 * useServicesStageScroll — single-rAF scroll watcher for the pinned
 * Services stage (Jasmina-style stepped stage, replaces the old card
 * stack).
 *
 * The stage is a `position: sticky` panel inside a tall runway
 * (`.services-stage-root`, ~3×100vh — see `services.css`). As the runway
 * scrolls past, this hook maps scroll progress to a discrete active step
 * (0..2) and writes it as `data-active-step` on the sticky stage
 * element. `services.css` keys the left-list highlight + the
 * right-paragraph crossfade off that attribute; the actual fade is a
 * plain CSS `transition` on `opacity` / `color`, so this hook only ever
 * flips one integer.
 *
 * Why a rect-rAF read of the runway, NOT IntersectionObserver: the stage
 * is pinned, so its content does not move relative to the viewport
 * during a segment — IO sentinels would only fire at the pin boundaries
 * and leave the active step stale mid-pin (the same dead-zone the v7
 * phase picker documents in `LandingPage.tsx`). Reading the *runway*
 * rect every frame has no dead zones.
 *
 * Mirrors the rAF / passive-scroll / resize structure of
 * `useCorridorExitScroll`. It touches NONE of the corridor channels or
 * the depth store — its only output is `data-active-step` on its own
 * element (single-writer of that attribute). On mobile / reduced motion
 * the stage drops the pin and renders as a static vertical list, so the
 * hook stays parked at step 0 and CSS reveals every step.
 *
 * @param stageRef ref to the sticky `.services-stage` element. Its
 *   parent is the `.services-stage-root` runway the progress is read from.
 */
export function useServicesStageScroll(stageRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    let frame = 0;
    let disposed = false;
    let current = -1;

    const isInert = () =>
      (window.matchMedia?.("(max-width: 960px)").matches ?? false) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    const setStep = (stage: HTMLElement, step: number) => {
      if (step === current) return;
      stage.setAttribute("data-active-step", String(step));
      current = step;
    };

    const write = () => {
      frame = 0;
      if (disposed) return;
      const stage = stageRef.current;
      if (!stage) return;

      // Static layouts (mobile / reduced motion): no stepping — CSS
      // reveals all three steps; keep the attribute parked at 0.
      if (isInert()) {
        setStep(stage, 0);
        return;
      }

      const runway = stage.parentElement; // .services-stage-root (the tall slot)
      if (!runway) return;

      const vh = window.innerHeight || 1;
      const r = runway.getBoundingClientRect();
      // `travel` is the exact pinned scroll distance: with a sticky stage
      // of height 100svh inside a `min-height: 300vh` runway, the stage
      // is pinned while `-r.top` runs 0 → (r.height - vh).
      const travel = r.height - vh;
      const p = travel > 0 ? Math.max(0, Math.min(1, -r.top / travel)) : 0;
      const step = Math.max(0, Math.min(STEP_COUNT - 1, Math.floor(p * STEP_COUNT)));
      setStep(stage, step);
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
    };
  }, [stageRef]);
}
