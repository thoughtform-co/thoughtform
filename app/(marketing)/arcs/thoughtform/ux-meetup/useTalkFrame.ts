"use client";

import { useEffect, useRef } from "react";

/**
 * The talk's one scroll READER (ADR-156 U3).
 *
 * `LandingPage` owns this page's scroll writer (ADR-002), so the talk never
 * adds a second one: this is one passive listener and one rAF that read
 * `scrollY` and the viewport once a frame and hand them to the talk's own
 * consumers, the terminal motion's `onFrame` (as `ArcShell` hands it
 * `useArcScroll`'s frame) and any figure subscribed on the bus. Everything
 * it feeds writes only inside the talk's `.arc-root`: never `--hero-lift`,
 * `data-active-station` or a corridor channel.
 */

export type TalkFrame = (scrollY: number, vh: number) => void;

const bus = new Set<TalkFrame>();

/** A figure's subscription to the talk's frame. Returns the unsubscribe. */
export function subscribeTalkFrame(fn: TalkFrame): () => void {
  bus.add(fn);
  return () => {
    bus.delete(fn);
  };
}

export function useTalkFrame(onFrame: TalkFrame): void {
  const ref = useRef(onFrame);
  useEffect(() => {
    ref.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight || 1;
      ref.current(y, vh);
      for (const fn of bus) fn(y, vh);
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(run);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
}
