"use client";

import { useEffect, type RefObject } from "react";

import { CONTINUUM_RAIL_STAGE } from "../unifiedServicesInstrument";
import {
  continuumApproachT,
  continuumBgInT,
  continuumCopyT,
} from "@/lib/services-ring/continuumStageMath";
import { continuumStageProgressRef } from "@/lib/services-ring/continuumStageProgressRef";
import { clamp01 } from "@/lib/math";

/** Continuum-stage beats (0 approach · 1 copy · 2 hold) for
 *  `data-continuum-step`. */
const CONTINUUM_STEP_COUNT = 3;

/**
 * useContinuumStageScroll — single rAF scroll watcher for the pinned
 * #continuum rail stage (ADR-049). The single writer of:
 *
 *   - `data-continuum-mode="stage"` on `#continuum` — the CSS mode switch
 *     that hides the static `.continuum__head` + `.crail` spectrum
 *     fallback and activates the 200svh runway + sticky transparent stage.
 *     Removed on ANY disengage (media gate, corridor fallback, unmount),
 *     so every failure mode collapses to the static crail (fail-static).
 *   - `--continuum-bg-in` on `#continuum` — the fail-opaque shield's
 *     channel (unwritten ⇒ 1 ⇒ opaque). 0 while pinned + capable;
 *     restores to 1 across the runway tail (CONTINUUM_BG_IN_WINDOW),
 *     completing at the unpin — i.e. BEFORE the retargeted ambient fade
 *     even starts (the ADR-030 lockstep ordering invariant).
 *   - `--continuum-copy-in` / `--continuum-approach` + `data-continuum-step`
 *     on the stage — the DOM mirrors of the beat windows (single source:
 *     continuumStageMath), driving the masthead/label reveal.
 *   - `continuumStageProgressRef` — the cross-root clock the WebGL mark
 *     lift (BrandmarkPhysicsCoreActor), the waist re-brighten getter
 *     (CorridorArmillary), and the thumb (ContinuumWaistRail) read.
 *
 * Progress = clamp01(−root.top / (root.height − vh)) over the
 * `.continuum-stage-root` runway (the useAboutStageScroll formula) — it
 * clamps to 0 above the stage and 1 below it, so every consumer's
 * envelope holds byte-stable outside the runway (no latch, no release
 * guard — the ADR-046 lesson).
 */
export function useContinuumStageScroll(stageRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!CONTINUUM_RAIL_STAGE) return;

    let frame = 0;
    let disposed = false;
    let engaged = false;
    let currentStep = -1;
    let currentApproach = -1;
    let currentCopy = -1;
    let currentBgIn = -1;

    const capableMedia = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    );
    let corridorStage: HTMLElement | null = null;
    const fallbackActive = () => {
      if (!corridorStage || !corridorStage.isConnected) {
        corridorStage = document.querySelector<HTMLElement>(".home-v2-stage");
      }
      return !corridorStage || corridorStage.dataset.fallback === "true";
    };

    const continuumOf = (stage: HTMLElement) => stage.closest<HTMLElement>("#continuum");

    const disengage = (stage: HTMLElement | null) => {
      if (!engaged) return;
      engaged = false;
      const continuum = stage
        ? continuumOf(stage)
        : document.querySelector<HTMLElement>("#continuum");
      continuum?.removeAttribute("data-continuum-mode");
      continuum?.style.removeProperty("--continuum-bg-in");
      continuumStageProgressRef.current.progress = 0;
      continuumStageProgressRef.current.engaged = false;
      currentStep = currentApproach = currentCopy = currentBgIn = -1;
    };

    const write = () => {
      frame = 0;
      if (disposed) return;
      const stage = stageRef.current;
      if (!stage) {
        // The stage null-renders when the media gate flips (ContinuumStage
        // returns null below the gate) — the ref goes null while THIS
        // effect keeps its listeners. Disengage explicitly or the
        // data-continuum-mode attribute strands and the static fallback
        // stays hidden (the useAboutStageScroll resize desktop → mobile
        // bug).
        disengage(null);
        return;
      }
      const continuum = continuumOf(stage);
      if (!continuum) return;

      const capable = capableMedia.matches && !fallbackActive();
      if (!capable) {
        disengage(stage);
        return;
      }

      if (!engaged) {
        engaged = true;
        continuum.setAttribute("data-continuum-mode", "stage");
      }

      const runway = stage.parentElement; // .continuum-stage-root
      if (!runway) return;
      const vh = window.innerHeight || 1;
      const r = runway.getBoundingClientRect();
      const travel = r.height - vh;
      const p = travel > 0 ? clamp01(-r.top / travel) : 0;

      continuumStageProgressRef.current.progress = p;
      continuumStageProgressRef.current.engaged = true;

      const approach = continuumApproachT(p);
      const copyIn = continuumCopyT(p);
      const bgIn = continuumBgInT(p);
      if (Math.abs(approach - currentApproach) >= 0.001) {
        stage.style.setProperty("--continuum-approach", approach.toFixed(4));
        currentApproach = approach;
      }
      if (Math.abs(copyIn - currentCopy) >= 0.001) {
        stage.style.setProperty("--continuum-copy-in", copyIn.toFixed(4));
        currentCopy = copyIn;
      }
      if (Math.abs(bgIn - currentBgIn) >= 0.001) {
        continuum.style.setProperty("--continuum-bg-in", bgIn.toFixed(4));
        currentBgIn = bgIn;
      }
      const step = Math.max(
        0,
        Math.min(CONTINUUM_STEP_COUNT - 1, Math.floor(p * CONTINUUM_STEP_COUNT))
      );
      if (step !== currentStep) {
        stage.setAttribute("data-continuum-step", String(step));
        currentStep = step;
      }
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };
    const onResize = () => {
      requestWrite();
    };
    // Tab-return re-sync (the ee48079 pattern): a forced idempotent write
    // on visibility restore so the vars/attr/ref reconstruct from the live
    // rect (the WebGL thumb clock resumes from its accumulator; nothing
    // latches on a stale frame).
    const onVisibility = () => {
      if (document.visibilityState === "visible") requestWrite();
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    capableMedia.addEventListener?.("change", onResize);
    // Bounded settle loop — the corridor stage (`.home-v2-stage`) is
    // code-split and can mount AFTER the first writes, and the services +
    // about runways inflate the page above this stage asynchronously. The
    // old two fixed passes (600ms + 1800ms) could both fire before the
    // corridor was ready, leaving the stage disengaged until the next scroll
    // event landed — a user who arrives at #continuum without a further
    // scroll frame then saw the static `.crail` fallback (fail-static)
    // instead of the pinned stage. Re-check on a cadence until we actually
    // engage (or give up), so engagement never hinges on a scroll event
    // arriving after the corridor mounts. Self-terminates the instant
    // `engaged` flips true; capped so a genuinely-incapable path stops.
    let settleTries = 0;
    const settle = window.setInterval(() => {
      requestWrite();
      if (engaged || ++settleTries >= 20) window.clearInterval(settle);
    }, 400);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearInterval(settle);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      capableMedia.removeEventListener?.("change", onResize);
      // Pass null (not stageRef.current — stale by cleanup): disengage
      // re-queries #continuum directly, so the attribute/vars/ref clear
      // correctly without reading the possibly-changed ref.
      disengage(null);
    };
  }, [stageRef]);
}
