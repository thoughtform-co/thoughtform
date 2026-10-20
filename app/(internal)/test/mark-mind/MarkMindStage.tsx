"use client";

import { useEffect, useRef, useState } from "react";
import { paintMind, type FloorsMode, type Theme } from "./paint";

/** One turn of the flywheel, seconds. */
const TURN = 96;

const ease = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Where the page's scroll puts the drum: the hero whole and detailed, the
    section as dot fields, the deep view parted. */
export const scrollState = (p: number) => ({ detail: 1 - ease(0.12, 0.45, p), part: ease(0.55, 0.9, p) });

/**
 * The drum on a canvas. The flywheel turns on the clock (clockwise as seen),
 * pauses offscreen and in a hidden tab, and holds still under reduced motion.
 * `t` freezes the clock for a still. `scroll` reads the page's scroll for the
 * part and the detail; otherwise they come in as props.
 */
export function MarkMindStage({ theme, floors, el, still, t: frozen, part = 0, detail = 1, scroll = false }: { theme: Theme; floors: FloorsMode; el: number; still: boolean; t?: number; part?: number; detail?: number; scroll?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let alive = true;
    let inView = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animated = !still && frozen === undefined && !reduced;
    const start = performance.now();
    const clock = () => (frozen !== undefined ? frozen : animated ? (performance.now() - start) / 1000 : 0);
    const progress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? window.scrollY / max : 0;
    };

    const paint = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1); // the kit's cap for live layers
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const t = clock();
      const s = scroll ? scrollState(progress()) : { part, detail };
      paintMind(ctx, { w, h, theme, floors, el, t, theta: (t / TURN) * Math.PI * 2, ...s });
    };
    const loop = () => {
      raf = 0;
      if (!alive) return;
      paint();
      if (animated && inView && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      if (animated && inView && !document.hidden && !raf) raf = requestAnimationFrame(loop);
    };
    const onScroll = () => {
      if (!animated) paint();
    };
    const io = new IntersectionObserver(([e]) => {
      inView = !!e?.isIntersecting;
      wake();
    });
    const ro = new ResizeObserver(() => paint());
    io.observe(canvas);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", wake);
    if (scroll) window.addEventListener("scroll", onScroll, { passive: true });
    paint();
    setReady(true);
    wake();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("scroll", onScroll);
    };
  }, [theme, floors, el, still, frozen, part, detail, scroll]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="The mark is the mind: a drum of stacked slices cut by the Thoughtform mark into four. Offices of people on the left, gold circuits on the right, a light where the bars cross, and the drum turning like a flywheel, what reaches the slanted bar crossing it as dots."
      data-mark-mind=""
      data-ready={ready ? "" : undefined}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
