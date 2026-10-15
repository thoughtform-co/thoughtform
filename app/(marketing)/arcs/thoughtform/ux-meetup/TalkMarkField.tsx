"use client";

import { useEffect, useRef } from "react";

import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";

/** Source viewBox of the brand mark (as `ServicesBrandmarkField` reads it). */
const VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;
/** Sparser than the services centrepiece: an ambient field, not a glyph. */
const COUNT = 1400;
/** The mark's height as a share of the ground's. */
const SCALE = 0.86;

/**
 * TalkMarkField — the talk's ambient brand mark (ADR-156 U3): the full mark
 * sampled into particles (`sampleShape`, the stratified sampler every 2D
 * mark painter uses), drawn on its own 2D canvas filling the talk's ground,
 * each particle breathing slowly about its home.
 *
 * ⚠ ITS OWN CANVAS, NOT `ServicesBrandmarkField`: the services sheet hides
 * that field's canvas on desktop with `!important` (the R3F core takes its
 * place there), and a talk-only override would be a fight with a sheet this
 * page does not own. The painter is the brandmark-particle skill's
 * sanctioned exception, a self-contained 2D canvas, never a global painter.
 *
 * It draws only while its ground is on (`data-uxm-ground`) and the canvas is
 * on screen, and draws one still frame under reduced motion.
 */
export function TalkMarkField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sample = sampleShape({
      shapeKey: BRANDMARK_SHAPE_KEYS.full,
      paths: BRANDMARK_FULL_PATHS,
      viewBox: VIEWBOX,
      count: COUNT,
    });
    if (sample.count === 0) return;
    const holder = canvas.closest<HTMLElement>("[data-uxm-ground]");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let disposed = false;
    let onScreen = true;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      canvas.width = w;
      canvas.height = h;
    };

    const draw = (ms: number) => {
      ctx.clearRect(0, 0, w, h);
      const t = ms * 0.001;
      const size = Math.min(h, w) * SCALE;
      const cx = w / 2;
      const cy = h / 2;
      const dot = Math.max(1, 1.4 * dpr);
      const half = dot / 2;
      ctx.fillStyle = "rgba(202, 165, 84, 0.9)";
      const { home, seed, count } = sample;
      for (let i = 0; i < count; i++) {
        const sx = seed[i * 2];
        const sy = seed[i * 2 + 1];
        const x = cx + (home[i * 2] + 0.006 * Math.sin(t * 0.35 + sx)) * size;
        const y = cy + (home[i * 2 + 1] + 0.006 * Math.cos(t * 0.3 + sy)) * size;
        ctx.fillRect(x - half, y - half, dot, dot);
      }
    };

    const tick = (ms: number) => {
      raf = 0;
      if (disposed) return;
      if (onScreen && holder?.getAttribute("data-uxm-ground") === "on") draw(ms);
      if (!still) raf = window.requestAnimationFrame(tick);
    };

    resize();
    draw(performance.now());
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
    });
    io.observe(canvas);
    if (!still) raf = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      ro.disconnect();
      io.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="uxm-ground__canvas" aria-hidden="true" />;
}
