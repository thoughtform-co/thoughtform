"use client";

import { useEffect, useState, type RefObject } from "react";

import {
  voidwalkerHologramEnterT,
  voidwalkerHologramExitT,
  voidwalkerHologramProgressRef,
} from "@/lib/voidwalker/voidwalkerHologramClock";
import { clamp01 } from "@/lib/math";

import { VOIDWALKER_HOLOGRAM_STAGE } from "../unifiedServicesInstrument";

const CAPABLE_QUERY = "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";
const INTERACTIVE_ENTER = 0.58;
const INTERACTIVE_EXIT = 0.82;

/**
 * Single scroll writer for the production Voidwalker hologram.
 *
 * It follows the About-stage contract: progress is derived from the sticky
 * runway on every scroll frame, reveal/exit values are pure functions of that
 * progress, and every disengage returns to a finished static layout. The
 * outer station receives the mode because it owns both the runway geometry
 * and the compositing exception; the inner `.vwh` owns visual motion only.
 */
export function useVoidwalkerHologramScroll(rootRef: RefObject<HTMLElement | null>): boolean {
  const [stageActive, setStageActive] = useState(false);

  useEffect(() => {
    const mountedRoot = rootRef.current;
    let frame = 0;
    let disposed = false;
    let engaged = false;
    let interactive = true;
    let currentEnter = -1;
    let currentExit = -1;
    let stationEl: HTMLElement | null = null;
    let corridorStage: HTMLElement | null = null;

    const capableMedia = window.matchMedia(CAPABLE_QUERY);

    const stationOf = (root: HTMLElement) => root.closest<HTMLElement>("#voidwalker");
    const fallbackActive = () => {
      if (!corridorStage || !corridorStage.isConnected) {
        corridorStage = document.querySelector<HTMLElement>(".home-v2-stage");
      }
      return !corridorStage || corridorStage.dataset.fallback === "true";
    };

    const resetProgress = () => {
      voidwalkerHologramProgressRef.current = {
        progress: 0,
        enter: 1,
        exit: 0,
        engaged: false,
      };
    };

    const disengage = (root: HTMLElement | null) => {
      if (stationEl?.dataset.vwMode === "hologram") stationEl.removeAttribute("data-vw-mode");
      root?.removeAttribute("data-vwh-ready");
      root?.style.removeProperty("--vwh-in");
      root?.style.removeProperty("--vwh-exit");
      if (root) root.inert = false;
      if (engaged && !disposed) setStageActive(false);
      engaged = false;
      interactive = true;
      currentEnter = currentExit = -1;
      resetProgress();
    };

    const write = () => {
      frame = 0;
      if (disposed) return;
      const root = rootRef.current;
      if (!root) {
        disengage(null);
        return;
      }

      stationEl = stationOf(root);
      if (!stationEl) return;

      // The surface attribute removes the authored star tile on every
      // hologram path. Static/mobile/PRM remain solid-void; only capable
      // stage mode becomes a transparent window onto the live corridor.
      stationEl.setAttribute("data-vw-surface", "hologram");

      const capable = VOIDWALKER_HOLOGRAM_STAGE && capableMedia.matches && !fallbackActive();
      if (!capable) {
        disengage(root);
        return;
      }

      if (!engaged) {
        engaged = true;
        stationEl.setAttribute("data-vw-mode", "hologram");
        root.setAttribute("data-vwh-ready", "");
        setStageActive(true);
      }

      const runway = root.parentElement; // .vw--hologram
      if (!runway) return;
      const vh = window.innerHeight || 1;
      const rect = runway.getBoundingClientRect();
      const travel = rect.height - vh;
      const progress = travel > 0 ? clamp01(-rect.top / travel) : 0;
      const enter = voidwalkerHologramEnterT(progress);
      const exit = voidwalkerHologramExitT(progress);

      voidwalkerHologramProgressRef.current = { progress, enter, exit, engaged: true };

      if (Math.abs(enter - currentEnter) >= 0.001) {
        root.style.setProperty("--vwh-in", enter.toFixed(4));
        currentEnter = enter;
      }
      if (Math.abs(exit - currentExit) >= 0.001) {
        root.style.setProperty("--vwh-exit", exit.toFixed(4));
        currentExit = exit;
      }

      const nextInteractive = enter >= INTERACTIVE_ENTER && exit <= INTERACTIVE_EXIT;
      if (nextInteractive !== interactive) {
        root.inert = !nextInteractive;
        interactive = nextInteractive;
      }
    };

    const requestWrite = () => {
      if (!frame) frame = window.requestAnimationFrame(write);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") requestWrite();
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    document.addEventListener("visibilitychange", onVisibility);
    capableMedia.addEventListener?.("change", requestWrite);
    const settleA = window.setTimeout(requestWrite, 600);
    const settleB = window.setTimeout(requestWrite, 1800);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(settleA);
      window.clearTimeout(settleB);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", onVisibility);
      capableMedia.removeEventListener?.("change", requestWrite);
      disengage(mountedRoot);
      if (stationEl?.dataset.vwSurface === "hologram") {
        stationEl.removeAttribute("data-vw-surface");
      }
    };
  }, [rootRef]);

  return stageActive;
}
