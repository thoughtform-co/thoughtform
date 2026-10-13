"use client";

/* The canvas the two iterations of Swarm share (S4·B, S4·C): sized to whole
   device pixels, built once a size, painted every frame while it runs and
   once, at t = 0, while it is held. S4 itself keeps its own copy of this in
   `Swarm.tsx`, untouched. */

import { useEffect, useRef } from "react";

export interface SwarmPainter<S> {
  /** The scene for a canvas of `w` by `h` device px. */
  build(w: number, h: number, dpr: number): S;
  /** One frame at `t` seconds (0 is the rest frame). It may seat the words
      that stand beside the drawing, which live inside `el`. */
  paint(
    ctx: CanvasRenderingContext2D,
    scene: S,
    open: number,
    t: number,
    el: HTMLElement,
    dpr: number
  ): void;
}

/** `painter` must be one object for the component's life (a module constant). */
export function useSwarmCanvas<S>(painter: SwarmPainter<S>, open: number, motion: "run" | "hold") {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(open);
  const repaint = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    let scene: S | null = null;
    let dpr = 1;
    let raf = 0;
    let t0 = -1;

    const size = () => {
      const box = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(box.width * dpr));
      const h = Math.max(2, Math.round(box.height * dpr));
      cv.width = w;
      cv.height = h;
      /* one canvas pixel to one device pixel, whatever the box rounds to */
      cv.style.width = `${w / dpr}px`;
      cv.style.height = `${h / dpr}px`;
      scene = painter.build(w, h, dpr);
    };
    const draw = (t: number) => {
      if (scene) painter.paint(ctx, scene, openRef.current, t, el, dpr);
    };
    const frame = (ts: number) => {
      if (t0 < 0) t0 = ts;
      draw((ts - t0) / 1000);
      raf = requestAnimationFrame(frame);
    };

    size();
    if (motion === "run") raf = requestAnimationFrame(frame);
    else draw(0);
    /* held, a change of pose still has to be painted */
    repaint.current = () => {
      if (motion !== "run") draw(0);
    };
    const ro = new ResizeObserver(() => {
      size();
      if (motion !== "run") draw(0);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      repaint.current = null;
    };
  }, [motion, painter]);

  useEffect(() => {
    openRef.current = open;
    repaint.current?.();
  }, [open]);

  return { wrap, canvas };
}
