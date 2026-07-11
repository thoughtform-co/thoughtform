"use client";

import { useEffect, type RefObject } from "react";

/**
 * Stack geometry — single JS/CSS source of truth. The stack component
 * mirrors these onto the runway as inline CSS vars (`--pc-top-base`,
 * `--pc-peek`) so the hook math and the sticky offsets can never drift
 * apart.
 *
 *   topBase — sticky top of card 0 (px)
 *   peek    — additional top offset per card = the visible strip of every
 *             covered card's header (vorszk cascade)
 */
export const STACK = { count: 4, topBase: 16, peek: 48 } as const;

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
 * and on the runway:
 *   data-pc-active    highest index with enter >= 0.5 (pagination rail)
 *
 * All values are pure functions of live rects, so reverse scroll resets
 * state by construction (BEST-PRACTICES "reset when scrolling back").
 *
 * Mobile / reduced-motion (`isInert`): parks every slot at enter=1 /
 * cover=0 / pinned so the stack reads as a plain document. The 960px
 * breakpoint aligns with the landing services desktop gate (961px, ADR-030)
 * and MUST stay in lockstep with the `@media (max-width: 960px)`
 * static-flow rules in tools-cards.css (and the lab's project-cards.css).
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
    let currentActive = -1;

    const isInert = () =>
      (window.matchMedia?.("(max-width: 960px)").matches ?? false) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

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

    const setActive = (step: number) => {
      if (step === currentActive) return;
      runway.setAttribute("data-pc-active", String(step));
      currentActive = step;
    };

    const write = () => {
      frame = 0;
      if (disposed) return;

      if (isInert()) {
        for (let i = 0; i < slots.length; i++) {
          setEnter(i, 1);
          setCover(i, 0);
          setState(i, "pinned");
        }
        setActive(slots.length - 1);
        return;
      }

      const vh = window.innerHeight || 1;

      // Reads first (batched), then writes — never interleaved.
      const enters = slots.map((slot, i) => {
        const pinTop = STACK.topBase + i * STACK.peek;
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

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    document.addEventListener("visibilitychange", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", requestWrite);
    };
  }, [runwayRef]);
}
