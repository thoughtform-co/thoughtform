"use client";

import { useEffect, type RefObject } from "react";

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smoothstep on [0,1] — hook eases, CSS maps linearly (house pattern). */
function smoothstep01(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

type SlotState = "incoming" | "pinned" | "covered";

/**
 * useStackedCardsScroll — single-rAF watcher for the vorszk-style
 * sticky-SIBLING card stack (each `.pcl-slot` is sticky; the covering card
 * is simply the next sibling scrolling up — nothing is synthetic).
 *
 * Writes per slot i (delta-gated):
 *   --pc-enter  0..1  eased entrance of slot i (0 = top edge at viewport
 *                     bottom, 1 = pinned at its cascade offset)
 *   --pc-cover  0..1  how covered slot i is (= enter of slot i+1)
 *   data-pc-state     incoming | pinned | covered
 *   data-pc-current   present on the highest-index slot with enter >= 0.5
 * and on the runway:
 *   data-pc-active    the same active index for the fixed HUD rail register
 *
 * All values are pure functions of live rects, so reverse scroll resets
 * state by construction (BEST-PRACTICES "reset when scrolling back").
 *
 * CSS owns the enhancement query and all geometry. The hook detects whether
 * the slots resolved to `position: sticky`, caches their computed `top`
 * values on resize, and uses those exact pixels for its progress math. In
 * static/mobile/reduced-motion flow it parks every slot at enter=1, cover=0,
 * and pinned without naming a duplicate JS breakpoint.
 */
export function useStackedCardsScroll(runwayRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const runway = runwayRef.current;
    if (!runway) return;

    const slots = Array.from(runway.querySelectorAll<HTMLElement>("[data-pc-slot]"));
    if (slots.length === 0) return;

    let frame = 0;
    let disposed = false;
    const currentEnter = new Array<number>(slots.length).fill(-1);
    const currentCover = new Array<number>(slots.length).fill(-1);
    const currentState = new Array<SlotState | null>(slots.length).fill(null);
    let currentSlot = -1;
    let currentActive = -1;
    let stickyMode = false;
    let pinTops = new Array<number>(slots.length).fill(0);

    const readGeometry = () => {
      const styles = slots.map((slot) => getComputedStyle(slot));
      stickyMode = styles.every((style) => style.position === "sticky");
      pinTops = styles.map((style) => {
        const top = Number.parseFloat(style.top);
        return Number.isFinite(top) ? top : 0;
      });
    };

    const setEnter = (i: number, v: number) => {
      if (Math.abs(v - currentEnter[i]) < 0.001) return;
      slots[i].style.setProperty("--pc-enter", v.toFixed(4));
      currentEnter[i] = v;
    };

    const setCover = (i: number, v: number) => {
      if (Math.abs(v - currentCover[i]) < 0.001) return;
      slots[i].style.setProperty("--pc-cover", v.toFixed(4));
      currentCover[i] = v;
    };

    const setState = (i: number, s: SlotState) => {
      if (currentState[i] === s) return;
      slots[i].setAttribute("data-pc-state", s);
      currentState[i] = s;
    };

    const setCurrent = (index: number) => {
      if (index === currentSlot) return;
      if (currentSlot >= 0) slots[currentSlot]?.removeAttribute("data-pc-current");
      if (index >= 0) slots[index]?.setAttribute("data-pc-current", "true");
      currentSlot = index;
    };

    const setActive = (index: number) => {
      if (index === currentActive) return;
      runway.setAttribute("data-pc-active", String(index));
      currentActive = index;
    };

    const write = () => {
      frame = 0;
      if (disposed) return;

      if (!stickyMode) {
        for (let i = 0; i < slots.length; i++) {
          setEnter(i, 1);
          setCover(i, 0);
          setState(i, "pinned");
        }
        setCurrent(-1);
        setActive(0);
        return;
      }

      const vh = window.innerHeight || 1;

      // Reads first (batched), then writes — never interleaved.
      const enters = slots.map((slot, i) => {
        const pinTop = pinTops[i] ?? 0;
        const top = slot.getBoundingClientRect().top;
        const travel = Math.max(1, vh - pinTop);
        return smoothstep01((vh - top) / travel);
      });

      let active = 0;
      for (let i = 0; i < slots.length; i++) {
        const enter = enters[i];
        const cover = i < slots.length - 1 ? enters[i + 1] : 0;
        setEnter(i, enter);
        setCover(i, cover);
        setState(i, cover >= 0.999 ? "covered" : enter >= 0.999 ? "pinned" : "incoming");
        if (enter >= 0.5) active = i;
      }
      setCurrent(active);
      setActive(active);
    };

    const requestWrite = () => {
      // rAF is suspended in hidden tabs — a queued frame would sit forever
      // and leave the stack stale on tab restore (and unverifiable by
      // headless tooling). No paint happens while hidden, so writing
      // synchronously there is free.
      if (document.hidden) {
        write();
        return;
      }
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    const refreshGeometry = () => {
      readGeometry();
      requestWrite();
    };

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    refreshGeometry();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", refreshGeometry);
    document.addEventListener("visibilitychange", refreshGeometry);
    reducedMotion?.addEventListener?.("change", refreshGeometry);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", refreshGeometry);
      document.removeEventListener("visibilitychange", refreshGeometry);
      reducedMotion?.removeEventListener?.("change", refreshGeometry);
    };
  }, [runwayRef]);
}
