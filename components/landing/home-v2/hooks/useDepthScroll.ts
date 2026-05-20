"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  INITIAL_TRANSFORM,
  deriveChambers,
  smoothstep,
  lerp,
  useDepthGatewayStore,
} from "@/lib/stores/depthGatewayStore";

/**
 * useDepthScroll — rAF-throttled scroll watcher for the home-v2
 * depth-gateway stage.
 *
 * Modeled on `useLandingScroll` (the v7 production hook): we listen
 * to `window.scroll`, schedule a single rAF tick per frame, and
 * compute a 0..1 progress across the sticky stage. Progress is
 * written to:
 *
 *   1. CSS custom properties on the stage root
 *      (`--depth-progress`, `--chamber-a-progress`,
 *      `--chamber-b-progress`, `--chamber-c-progress`,
 *      `--definition-translate-z`, `--definition-scale`,
 *      `--definition-opacity`, `--diagnostic-opacity`).
 *      These drive the DOM overlay text plane and any CSS-driven
 *      decorations on the stage.
 *
 *   2. `depthGatewayStore` — the single store the R3F painters read
 *      imperatively inside `useFrame` so per-frame work stays at
 *      uniform writes only.
 *
 * The stage element is identified by its ref. We use the element's
 * `getBoundingClientRect()` against the viewport to derive progress:
 *
 *   - `progress = 0` when the stage's top edge meets the viewport top
 *   - `progress = 1` when the stage's top edge has scrolled (height -
 *     vh) past the viewport top
 *
 * For a 300svh stage with a 100svh sticky interior that means the
 * sticky stays pinned for 200svh of progress, which is the canonical
 * "pin and scrub" pattern (no GSAP, no ScrollTrigger needed — just
 * rAF math).
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

    // Raw progress in 0..1 across the sticky window.
    const rawProgress = clamp01(-rect.top / scrubHeight);
    const progress = rawProgress;

    const { chamberA, chamberB, chamberC, chamberId } = deriveChambers(progress);

    // Stage CSS vars — drive the DOM overlay text plane and the
    // debug HUD readouts. CSS reads these synchronously so any
    // overlay text follows scroll with no JS frame lag.
    stage.style.setProperty("--depth-progress", progress.toFixed(4));
    stage.style.setProperty("--chamber-a-progress", chamberA.toFixed(4));
    stage.style.setProperty("--chamber-b-progress", chamberB.toFixed(4));
    stage.style.setProperty("--chamber-c-progress", chamberC.toFixed(4));

    // Definition chamber DOM plane choreography. The plane starts
    // far behind the screen (Z = -240px in perspective space), is
    // legible mid-Chamber A, then accelerates past the viewer at
    // the end (Z = +600px) so it falls off the front of the camera.
    // Opacity peaks mid-chamber and fades as it rushes past — this
    // gives the "text approaches the viewer, then passes" feel
    // the user described.
    const pA = chamberA;
    const definitionZ = lerp(-240, 600, smoothstep(0, 1, pA));
    const definitionScale = lerp(0.78, 1.8, smoothstep(0, 1, pA));
    // Opacity envelope: ramp in over first 20%, hold to ~70%, fade
    // out as it rushes past.
    let definitionOpacity = 0;
    if (pA < 0.18) definitionOpacity = smoothstep(0, 1, pA / 0.18);
    else if (pA > 0.78) definitionOpacity = 1 - smoothstep(0, 1, (pA - 0.78) / 0.22);
    else definitionOpacity = 1;
    // If we've left Chamber A entirely, force opacity to 0 so the
    // DOM plane never bleeds into Chambers B / C.
    if (progress > 1 / 3 + 0.02) definitionOpacity = 0;

    stage.style.setProperty("--definition-translate-z", `${definitionZ.toFixed(1)}px`);
    stage.style.setProperty("--definition-scale", definitionScale.toFixed(3));
    stage.style.setProperty("--definition-opacity", definitionOpacity.toFixed(3));

    // Diagnostic eyebrow visibility — fade in across Chamber B and
    // out as we leave it. Lives at the bottom of the canvas and
    // gives a textual context for the orbital rings.
    const pB = chamberB;
    let diagnosticOpacity = 0;
    if (pB > 0 && pB < 0.25) diagnosticOpacity = smoothstep(0, 1, pB / 0.25);
    else if (pB >= 0.25 && pB <= 0.85) diagnosticOpacity = 1;
    else if (pB > 0.85) diagnosticOpacity = 1 - smoothstep(0, 1, (pB - 0.85) / 0.15);
    stage.style.setProperty("--diagnostic-opacity", diagnosticOpacity.toFixed(3));

    // Stage active state — the canvas + painters can short-circuit
    // when the stage is fully off-screen.
    const active = rect.bottom > 0 && rect.top < vh;

    // Skip the store write if nothing meaningful changed. The R3F
    // painters poll the store via `getState()` inside `useFrame`,
    // so an identical write triggers no work, but skipping
    // construction of the next object reduces GC pressure during
    // fast scroll.
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

  // First frame must happen synchronously before paint so the canvas
  // doesn't flash with INITIAL_TRANSFORM during hydration.
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
