"use client";

import { useEffect, type RefObject } from "react";

import { RING_STEP_COUNT, exitProgressForRunway } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/** Scroll segments in the pinned stage: ONE lead-in segment where every
 *  plate is collapsed (step 0), one segment per service (steps 1..4)
 *  that opens that service's plate, and one EXIT-HOLD segment (step 5,
 *  ADR-030) during which the last card dwells while the #tools station
 *  sweeps up over the still-pinned stage. `STEP_COUNT = services + 2`;
 *  the runway `min-height` in services.css is kept in lockstep at
 *  `STEP_COUNT × 100svh` so each beat still owns one viewport of scroll
 *  travel. Aliased from RING_STEP_COUNT so the ring staircase and the
 *  step clock can never drift (ADR-029 guardrail). */
const STEP_COUNT = RING_STEP_COUNT;

/**
 * Brandmark "arrive" envelopes, in `--corridor-dissipate` units (0..1 —
 * the corridor-exit dissipate clock that `useCorridorExitScroll` writes on
 * `<html>` as the sphere expands and `#services` scrolls in).
 *
 * The centerpiece brandmark hands off from the inside-sphere mark (which
 * fades OUT across dissipate 0.5 → 0.95 in `ProjectedBrandmarkActor`). To
 * avoid a "dives away → gap → reappears" read, the SHRINK (scale) runs the
 * full dive while the FADE-IN (opacity) is kept EARLIER + tighter, so the
 * mark is already prominent and visibly shrinking while the sphere mark is
 * still on screen — a cross-dissolve, not a swap.
 *
 *   SHRINK: scale `--svc-arrive-from` → 1 across [SHRINK_START, SHRINK_END]
 *   FADE:   opacity 0 → 1            across [FADE_START,   FADE_END]
 *
 * These four edges are the timing knobs. Lower the FADE edges to bring the
 * mark on sooner (more overlap with the sphere); widen the SHRINK band for
 * a longer, slower shrink.
 */
const SHRINK_START = 0.35;
const SHRINK_END = 0.97;
const FADE_START = 0.4;
const FADE_END = 0.65;

/**
 * Services content entrance (2026-06-20). The list + paragraph fade/rise
 * IN off the corridor-exit dissipate, DELAYED so the in-sphere particle
 * core has already shrunk to the centred centerpiece before the copy
 * arrives. `smootherstep` (C2-continuous) gives a gentle ease-in/out, and
 * the late start (`CONTENT_IN_START`) is the "delay". `--svc-content-in`
 * (0..1) is mapped to opacity + a small upward translate in `services.css`.
 */
// Delayed so the hologram has finished its dome→wireframe transform before the
// DOM overlays (cards, orbits, scan notes) arrive over it.
const CONTENT_IN_START = 0.7;
const CONTENT_IN_END = 1.0;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smoothstep on [edge0, edge1]. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Smootherstep on [edge0, edge1] — C2-continuous (zero 1st AND 2nd
 *  derivative at both ends), so reveals read as a gentle settle rather
 *  than the slight kick smoothstep has at its endpoints. */
function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * useServicesStageScroll — single-rAF scroll watcher for the pinned
 * Services stage. Writes three channels on the sticky `.services-stage`
 * element:
 *
 *   - `data-active-step` (0..2): which service the runway scroll is on;
 *     `services.css` keys the left-list highlight + right-paragraph
 *     crossfade off it.
 *   - `--svc-arrive` (0..1): the brandmark SHRINK envelope, eased from the
 *     corridor-exit dissipate (`--corridor-dissipate` on `<html>`). 0 =
 *     sphere-scaled, 1 = parked at centerpiece size.
 *   - `--svc-arrive-op` (0..1): the brandmark FADE-IN envelope (kept
 *     earlier/tighter than the shrink so the mark cross-dissolves with the
 *     inside-sphere mark instead of reappearing after it).
 *
 * `services.css` maps `--svc-arrive` to the brandmark's scale and
 * `--svc-arrive-op` to its opacity, so the mark shrinks in as the user
 * dives into `#services` — a continuous handoff from the inside-sphere
 * brandmark. The corridor / sphere are NOT touched; this only READS the
 * dissipate the corridor already publishes.
 *
 * Why a rect-rAF read of the runway (not IntersectionObserver) for the
 * step: the stage is pinned, so its content does not move relative to the
 * viewport during a segment — IO sentinels would only fire at the pin
 * boundaries and leave the active step stale mid-pin.
 *
 * On mobile / reduced motion the stage is a static vertical list — the
 * hook parks `data-active-step="0"` and both envelopes at 1 (no shrink).
 *
 * @param stageRef ref to the sticky `.services-stage` element. Its parent
 *   is the `.services-stage-root` runway the step progress is read from.
 */
export function useServicesStageScroll(
  stageRef: RefObject<HTMLElement | null>,
  onStepChange?: (step: number) => void
): void {
  useEffect(() => {
    let frame = 0;
    let disposed = false;
    let currentStep = -1;
    let currentShrink = -1;
    let currentFade = -1;
    let currentContentIn = -1;
    let currentExit = -1;

    const isInert = () =>
      (window.matchMedia?.("(max-width: 960px)").matches ?? false) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

    const setStep = (stage: HTMLElement, step: number) => {
      const stepValue = String(step);
      if (step === currentStep && stage.getAttribute("data-active-step") === stepValue) return;
      stage.setAttribute("data-active-step", stepValue);
      currentStep = step;
      onStepChange?.(step);
    };

    const setArrive = (stage: HTMLElement, shrink: number, fade: number) => {
      if (Math.abs(shrink - currentShrink) >= 0.001) {
        stage.style.setProperty("--svc-arrive", shrink.toFixed(4));
        currentShrink = shrink;
      }
      if (Math.abs(fade - currentFade) >= 0.001) {
        stage.style.setProperty("--svc-arrive-op", fade.toFixed(4));
        currentFade = fade;
      }
    };

    const setContentIn = (stage: HTMLElement, v: number) => {
      if (Math.abs(v - currentContentIn) >= 0.001) {
        stage.style.setProperty("--svc-content-in", v.toFixed(4));
        currentContentIn = v;
      }
    };

    // Decommission clock mirror (ADR-030 Update 1) — CSS-readable copy of
    // exitProgressForRunway(p). Not load-bearing for the 3D consumers
    // (they derive the same pure function from the ref), but it gives CSS
    // and the smoke tests a channel.
    const setExit = (stage: HTMLElement, v: number) => {
      if (Math.abs(v - currentExit) >= 0.001) {
        stage.style.setProperty("--svc-exit", v.toFixed(4));
        currentExit = v;
      }
    };

    const write = () => {
      frame = 0;
      if (disposed) return;
      const stage = stageRef.current;
      if (!stage) return;

      // Static layouts (mobile / reduced motion): no stepping, no shrink,
      // content fully in (no scroll-driven entrance).
      if (isInert()) {
        setStep(stage, 0);
        setArrive(stage, 1, 1);
        setContentIn(stage, 1);
        setExit(stage, 0);
        servicesRingProgressRef.current.progress = 0;
        return;
      }

      // Brandmark arrive — read the corridor-exit dissipate the sphere
      // expansion already publishes. Defaults to 1 (parked) when the var
      // is absent, so the mark never gets stuck hidden.
      const dissipateRaw = parseFloat(
        document.documentElement.style.getPropertyValue("--corridor-dissipate")
      );
      const dissipate = Number.isFinite(dissipateRaw) ? dissipateRaw : 1;
      setArrive(
        stage,
        smoothstep(SHRINK_START, SHRINK_END, dissipate),
        smoothstep(FADE_START, FADE_END, dissipate)
      );
      // Services copy entrance — delayed + smootherstep so the list +
      // paragraph rise in gently AFTER the core has shrunk to centre.
      setContentIn(stage, smootherstep(CONTENT_IN_START, CONTENT_IN_END, dissipate));

      // Active step — from the runway scroll position.
      const runway = stage.parentElement; // .services-stage-root (the tall slot)
      if (!runway) return;
      const vh = window.innerHeight || 1;
      const r = runway.getBoundingClientRect();
      const travel = r.height - vh;
      const p = travel > 0 ? clamp01(-r.top / travel) : 0;
      // Continuous runway progress for the card ring (ADR-029) — same read,
      // same writer, bridged across React roots via the module ref. The step
      // below stays the floor() of this value, so ring rotation and the
      // active-service clock can never desync.
      servicesRingProgressRef.current.progress = p;
      setExit(stage, exitProgressForRunway(p));
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
  }, [onStepChange, stageRef]);
}
