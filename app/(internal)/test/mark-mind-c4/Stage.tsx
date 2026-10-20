"use client";

import { useEffect, useRef, useState } from "react";
import { paintMind, type Theme } from "./paint";

const ease = (x: number) => x * x * (3 - 2 * x);

/**
 * The drawing on a canvas. `g` fixed, or `mode`: "scroll" (the page's scroll
 * takes the flat mark to the drum) or "loop" (it plays mark → drum → mark).
 * The flywheel turns on the clock; offscreen and hidden it pauses; reduced
 * motion holds a still.
 */
export function Stage({ theme, g: fixed, mode, t: frozen }: { theme: Theme; g: number; mode: "still" | "scroll" | "loop"; t?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let alive = true;
    let inView = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animated = frozen === undefined && !reduced;
    const start = performance.now();
    const clock = () => (frozen !== undefined ? frozen : animated ? (performance.now() - start) / 1000 : 0);
    const gOf = (t: number) => {
      if (mode === "scroll") {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        return max > 0 ? Math.min(1, window.scrollY / (max * 0.8)) : 1;
      }
      if (mode === "loop") {
        // 2 s flat, 5 s in, 8 s held, 5 s out
        const c = t % 20;
        return c < 2 ? 0 : c < 7 ? ease((c - 2) / 5) : c < 15 ? 1 : 1 - ease((c - 15) / 5);
      }
      return fixed;
    };
    const paint = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const t = clock();
      paintMind(ctx, { w, h, theme, g: gOf(t), t });
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
    const io = new IntersectionObserver(([e]) => {
      inView = !!e?.isIntersecting;
      wake();
    });
    const ro = new ResizeObserver(() => paint());
    const onScroll = () => {
      if (!animated) paint();
    };
    io.observe(canvas);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("scroll", onScroll, { passive: true });
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
  }, [theme, fixed, mode, frozen]);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="The Thoughtform brand mark becoming a drum: the mark tilts back, the drum grows down from it, the bars become slots cut through it. Offices of people on the left, gold circuits on the right, a light where the bars cross, the drum turning like a flywheel."
      data-mark-mind-c4=""
      data-ready={ready ? "" : undefined}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
