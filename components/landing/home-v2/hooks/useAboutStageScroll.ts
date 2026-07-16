"use client";

import { useEffect, type RefObject } from "react";

import { ABOUT_DECK_STAGE } from "../unifiedServicesInstrument";
import { aboutBgInT, aboutCopyT, aboutFlipT, aboutShiftT } from "@/lib/services-ring/aboutDeckMath";
import { aboutStageProgressRef } from "@/lib/services-ring/aboutStageProgressRef";
import { invalidateAboutSlot, writeAboutSlotRect } from "@/lib/services-ring/aboutSlotRef";
import { clamp01 } from "@/lib/math";

/** About-stage beats (0 flip · 1 shift+copy · 2 hold) for `data-about-step`. */
const ABOUT_STEP_COUNT = 3;

/**
 * useAboutStageScroll — single rAF scroll watcher for the pinned #about
 * deck-flip stage (ADR-047). The single writer of:
 *
 *   - `data-about-mode="stage"` on `#about` — the CSS mode switch that
 *     hides the static `.voidwalker` fallback and activates the 300svh
 *     runway + sticky stage. Removed on ANY disengage (media gate,
 *     corridor fallback, unmount), so every failure mode collapses to
 *     the static opaque station (fail-static).
 *   - `--about-bg-in` on `#about` — the fail-opaque shield's channel
 *     (unwritten ⇒ 1 ⇒ opaque). 0 while pinned + capable; restores to 1
 *     across the runway tail (ABOUT_BG_IN_WINDOW), completing at the
 *     unpin — i.e. BEFORE the retargeted ambient fade even starts (the
 *     ADR-030 lockstep ordering invariant).
 *   - `--about-flip` / `--about-shift` / `--about-copy-in` +
 *     `data-about-step` on the stage — the DOM mirrors of the beat
 *     windows (single source: aboutDeckMath), driving the cluster
 *     reveal, the right-shift translate, and the copy column.
 *   - `--about-center-dx` on the stage (mount/resize only) — how far the
 *     cluster's FINAL grid slot sits from viewport centre, measured via
 *     the offset chain (transform-independent), so the beat-0/1 translate
 *     is a pure CSS calc of `--about-shift`.
 *   - `aboutStageProgressRef` — the cross-root clock the WebGL deck
 *     (ServicesCardRing) + the flip-window fades (BrandmarkPhysicsCore,
 *     CorridorArmillary) read.
 *   - `aboutSlotRef` — the portrait slot rect (getBoundingClientRect per
 *     frame while engaged: it must ride the cluster's live translate),
 *     the deck's seat target. Invalidated on disengage so the deck never
 *     flies at stale pixels.
 *
 * Progress = clamp01(−root.top / (root.height − vh)) over the
 * `.about-stage-root` runway (the useServicesStageScroll formula) — it
 * clamps to 0 above the stage and 1 below it, so every consumer's
 * envelope holds byte-stable outside the runway (no latch, no release
 * guard — the ADR-046 lesson).
 */
export function useAboutStageScroll(
  stageRef: RefObject<HTMLElement | null>,
  slotRef: RefObject<HTMLElement | null>,
  clusterRef: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    if (!ABOUT_DECK_STAGE) return;

    let frame = 0;
    let disposed = false;
    let engaged = false;
    let currentStep = -1;
    let currentFlip = -1;
    let currentShift = -1;
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

    const aboutOf = (stage: HTMLElement) => stage.closest<HTMLElement>("#about");

    const measureCenterDx = () => {
      const stage = stageRef.current;
      const cluster = clusterRef.current;
      if (!stage || !cluster) return;
      // Offset-chain page X (transform-independent — the whole point: the
      // cluster's live translate must not feed back into its own target).
      // No horizontal scroll on the landing, so page X == viewport X.
      let x = 0;
      let el: HTMLElement | null = cluster;
      while (el && el !== document.body) {
        x += el.offsetLeft;
        el = el.offsetParent as HTMLElement | null;
      }
      const dx = window.innerWidth / 2 - (x + cluster.offsetWidth / 2);
      stage.style.setProperty("--about-center-dx", `${dx.toFixed(1)}px`);
    };

    const disengage = (stage: HTMLElement | null) => {
      if (!engaged) return;
      engaged = false;
      const about = stage ? aboutOf(stage) : document.querySelector<HTMLElement>("#about");
      about?.removeAttribute("data-about-mode");
      about?.style.removeProperty("--about-bg-in");
      aboutStageProgressRef.current.progress = 0;
      aboutStageProgressRef.current.engaged = false;
      invalidateAboutSlot();
      currentStep = currentFlip = currentShift = currentCopy = currentBgIn = -1;
    };

    const write = () => {
      frame = 0;
      if (disposed) return;
      const stage = stageRef.current;
      if (!stage) {
        // The stage null-renders when the media gate flips (AboutStage
        // returns null below the gate) — the ref goes null while THIS
        // effect keeps its listeners. Disengage explicitly or the
        // data-about-mode attribute strands and the static fallback
        // stays hidden (found live: resize desktop → mobile).
        disengage(null);
        return;
      }
      const about = aboutOf(stage);
      if (!about) return;

      const capable = capableMedia.matches && !fallbackActive();
      if (!capable) {
        disengage(stage);
        return;
      }

      if (!engaged) {
        engaged = true;
        about.setAttribute("data-about-mode", "stage");
        // The mode flip changes layout (runway inflates, cluster moves to
        // its grid slot) — measure AFTER this frame's style/layout apply.
        window.requestAnimationFrame(() => {
          measureCenterDx();
          requestWrite();
        });
      }

      const runway = stage.parentElement; // .about-stage-root
      if (!runway) return;
      const vh = window.innerHeight || 1;
      const r = runway.getBoundingClientRect();
      const travel = r.height - vh;
      const p = travel > 0 ? clamp01(-r.top / travel) : 0;

      aboutStageProgressRef.current.progress = p;
      aboutStageProgressRef.current.engaged = true;

      const flip = aboutFlipT(p);
      const shift = aboutShiftT(p);
      const copyIn = aboutCopyT(p);
      const bgIn = aboutBgInT(p);
      if (Math.abs(flip - currentFlip) >= 0.001) {
        stage.style.setProperty("--about-flip", flip.toFixed(4));
        currentFlip = flip;
      }
      if (Math.abs(shift - currentShift) >= 0.001) {
        stage.style.setProperty("--about-shift", shift.toFixed(4));
        currentShift = shift;
      }
      if (Math.abs(copyIn - currentCopy) >= 0.001) {
        stage.style.setProperty("--about-copy-in", copyIn.toFixed(4));
        currentCopy = copyIn;
      }
      if (Math.abs(bgIn - currentBgIn) >= 0.001) {
        about.style.setProperty("--about-bg-in", bgIn.toFixed(4));
        currentBgIn = bgIn;
      }
      const step = Math.max(0, Math.min(ABOUT_STEP_COUNT - 1, Math.floor(p * ABOUT_STEP_COUNT)));
      if (step !== currentStep) {
        stage.setAttribute("data-about-step", String(step));
        currentStep = step;
      }

      // The deck's seat — measured per frame (gBCR reads the cluster's
      // live translate; the one-frame R3F staleness is the accepted
      // brandmarkScreenRectRef precedent).
      const slot = slotRef.current;
      if (slot) {
        const rect = slot.getBoundingClientRect();
        writeAboutSlotRect(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          rect.width,
          rect.height,
          performance.now()
        );
      }
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };
    const onResize = () => {
      measureCenterDx();
      requestWrite();
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", onResize);
    capableMedia.addEventListener?.("change", onResize);
    // Late-hydration settle passes (the services runway inflates the page
    // above this stage asynchronously — remeasure once things land).
    const t1 = window.setTimeout(onResize, 600);
    const t2 = window.setTimeout(onResize, 1800);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", onResize);
      capableMedia.removeEventListener?.("change", onResize);
      disengage(stageRef.current);
    };
  }, [stageRef, slotRef, clusterRef]);
}
