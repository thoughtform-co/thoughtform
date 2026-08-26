"use client";

import { useEffect, type RefObject } from "react";

import { ABOUT_DECK_STAGE, VOIDWALKER_CHARACTER_STAGE } from "../unifiedServicesInstrument";
import {
  aboutCopyT,
  aboutExitPortalT,
  aboutExitT,
  aboutFlipT,
  aboutShiftT,
} from "@/lib/services-ring/aboutDeckMath";
import { aboutStageProgressRef } from "@/lib/services-ring/aboutStageProgressRef";
import { invalidateAboutSlot, writeAboutSlotRect } from "@/lib/services-ring/aboutSlotRef";
import {
  setCharacterStagePortalActive,
  setCharacterStagePortalProgress,
} from "@/lib/voidwalker/characterStagePortalRef";
import { clamp01 } from "@/lib/math";

/** About-stage beats (0 flip · 1 shift+copy · 2 hold) for `data-about-step`. */
const ABOUT_STEP_COUNT = 3;

/**
 * useAboutStageScroll — single rAF scroll watcher for the pinned #about
 * deck-flip stage (ADR-047). The single writer of:
 *
 *   - `data-about-mode="stage"` on `#about` — the CSS mode switch that
 *     hides the static `.voidwalker` fallback and activates the 250svh
 *     runway + sticky stage. Removed on ANY disengage (media gate,
 *     corridor fallback, unmount), so every failure mode collapses to
 *     the static opaque station (fail-static).
 *   - `--about-bg-in` on `#about` — the fail-opaque shield's channel
 *     (unwritten ⇒ 1 ⇒ opaque). Written 0 ONCE at engage and left there
 *     for the stage's whole engaged life: the ADR-047-rev exit is a
 *     slide-out (below), not a fade-to-shield, so the shield stays
 *     transparent through the handoff — the live corridor bed shows
 *     through. The shield only restores to opaque via the disengage
 *     var-clear (→ default 1), so flag-off / mobile / JS-failure still
 *     land on a normal opaque station.
 *   - `--about-exit` on the stage — the exit-slide channel
 *     (ABOUT_EXIT_WINDOW): the copy column slides LEFT off-screen and the
 *     cluster (WebGL portrait deck) slides RIGHT as it ramps 0 → 1 across
 *     the runway tail. The continuum formation reads the same beat via
 *     continuumFormT (prelude), so the mark re-inks AS the slide happens.
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
    let currentExit = -1;
    let currentPortal = -1;

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
      // Clearing --about-bg-in restores the shield to its fail-opaque
      // default (1); clearing --about-exit resets the slide. Both are inert
      // once data-about-mode is gone (the selectors are mode-gated), but we
      // clear them so a re-engage starts from a known state.
      about?.style.removeProperty("--about-bg-in");
      stage?.style.removeProperty("--about-exit");
      stage?.style.removeProperty("--about-portal");
      aboutStageProgressRef.current.progress = 0;
      aboutStageProgressRef.current.engaged = false;
      setCharacterStagePortalActive(false);
      invalidateAboutSlot();
      currentStep = currentFlip = currentShift = currentCopy = currentExit = currentPortal = -1;
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
        // Drop the shield transparent for the whole engaged life (ADR-047
        // rev): the exit is a slide-out over the live corridor bed, so the
        // shield never restores mid-seam. Written once here; restored to
        // opaque only by the disengage var-clear (→ fail-opaque default 1).
        about.style.setProperty("--about-bg-in", "0");
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
      const exit = aboutExitT(p);
      // ⚠ ADR-082: the portal envelope shares the exit clock and only
      // engages when the character stage owns the through-line surface.
      // The DOM stage reads BOTH `--about-exit` and `--about-portal`
      // and applies the one that matches its data-about-exit attribute,
      // so the two transforms cannot both take effect on the same
      // frame — a lockstep by CSS selector rather than by hook state.
      const portal = VOIDWALKER_CHARACTER_STAGE ? aboutExitPortalT(p) : 0;
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
      if (Math.abs(exit - currentExit) >= 0.001) {
        stage.style.setProperty("--about-exit", exit.toFixed(4));
        currentExit = exit;
      }
      if (VOIDWALKER_CHARACTER_STAGE) {
        if (Math.abs(portal - currentPortal) >= 0.001) {
          stage.style.setProperty("--about-portal", portal.toFixed(4));
          currentPortal = portal;
        }
        // The receiver bus — the character stage viewport reads this.
        setCharacterStagePortalActive(true);
        setCharacterStagePortalProgress(portal);
      }
      const step = Math.max(0, Math.min(ABOUT_STEP_COUNT - 1, Math.floor(p * ABOUT_STEP_COUNT)));
      if (step !== currentStep) {
        stage.setAttribute("data-about-step", String(step));
        currentStep = step;
      }

      // The deck's seat — measured per frame (gBCR reads the cluster's
      // live translate; the one-frame R3F staleness is the accepted
      // brandmarkScreenRectRef precedent). ONLY while the runway
      // intersects the viewport: `write` runs on every page scroll while
      // engaged, and this gBCR (after the var writes above) forces a
      // synchronous layout — a page-wide per-scroll tax the deck only
      // needs inside its own band (outside it `flip` is null / the deck
      // is dead under the shield; the first in-band frame re-measures).
      const slot = slotRef.current;
      if (slot && r.bottom > 0 && r.top < vh) {
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
    // Tab-return re-sync (the ee48079 pattern, ported from
    // useContinuumStageScroll — plan 7.2): this rAF watcher freezes while the
    // tab is hidden and neither the browser nor Lenis reliably fires a
    // scroll/resize on return, so the mode attribute + --about-* vars + the
    // progress ref + the slot rect can hold a stale pre-hide frame. Force an
    // idempotent write on visibility restore so everything reconstructs from
    // the live rect (write() re-runs the same media/fallback/disengage
    // guards). NOTE: useContinuumStageScroll + useServicesStageScroll are the
    // two parallel copies of this pinned-stage watcher; a shared parametrized
    // factory is the eventual convergence fix (plan 7.2 / 5.1) — until then
    // keep the three in lockstep by hand.
    const onVisibility = () => {
      if (document.visibilityState === "visible") requestWrite();
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
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
      document.removeEventListener("visibilitychange", onVisibility);
      capableMedia.removeEventListener?.("change", onResize);
      disengage(stageRef.current);
    };
  }, [stageRef, slotRef, clusterRef]);
}
