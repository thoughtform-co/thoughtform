"use client";

// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC LAB — the particle inscription. A self-contained 2D-canvas
// painter adapted from `ServicesBrandmarkField` (its own canvas — NOT a
// fourth global painter mesh): sample once, breathe per-particle
// sinusoids, IO rAF gate, PRM → static frames redrawn on change only.
//
// The draw threshold IS the ritual: particles appear in rank order,
// and rank is inscription order — contain → structure → bind → name →
// orient. No swirl, no pulse (the motion law); the only ambient motion
// is the house breathing jitter.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState } from "react";

import { sampleBind } from "@/lib/daemoniac/bindPaths";
import type { BindComposition } from "@/lib/daemoniac/types";

const COUNT_DESKTOP = 2200;
const COUNT_MOBILE = 1000;

/** Resolve the plate ink to an "r, g, b" triple — the painter follows
 *  the same `--gold-line` role as the SVG plate, so the inscription
 *  deepens on parchment exactly like the drawn bind. */
function resolveInk(el: HTMLElement): string {
  const raw = getComputedStyle(el).getPropertyValue("--gold-line").trim();
  if (raw.startsWith("#") && (raw.length === 7 || raw.length === 4)) {
    const hex = raw.length === 4 ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}` : raw;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
  if (/^\d+\s*,/.test(raw)) return raw;
  return "202, 165, 84";
}

export interface BindParticleFieldProps {
  composition: BindComposition;
  /** Inscription progress 0..1 — the scrubber's clock. */
  progress: number;
  /** Re-resolve ink when the lab theme flips. */
  theme: string;
}

export function BindParticleField({ composition, progress, theme }: BindParticleFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const sample = useMemo(() => {
    if (typeof document === "undefined") return null;
    const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
    return sampleBind(composition, mobile ? COUNT_MOBILE : COUNT_DESKTOP, composition.record.id);
  }, [composition]);

  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql?.matches ?? false);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql?.addEventListener("change", onChange);
    return () => mql?.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !sample || sample.count === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let disposed = false;
    let inViewport = true;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let halfPx = 0;
    let cx = 0;
    let cy = 0;
    const ink = resolveInk(wrap);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      // home is normalized over the PLATE canvas, so full box = register
      // with the SVG plate in overlay.
      halfPx = (Math.min(rect.width, rect.height) * dpr) / 2;
      cx = width / 2;
      cy = height / 2;
    };

    const draw = (timeMs: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = timeMs * 0.001;
      ctx.fillStyle = `rgba(${ink}, 0.82)`;
      const dot = Math.max(1.4, 1.6 * dpr);
      const halfDot = dot * 0.5;
      const { home, seed, count } = sample;
      // rank is the identity by construction (inscription order).
      const visible = Math.min(count, Math.floor(progressRef.current * count));
      const jitter = 0.0035;
      for (let i = 0; i < visible; i++) {
        const px = home[i * 2] + jitter * Math.sin(t * 0.5 + seed[i * 2]);
        const py = home[i * 2 + 1] + jitter * Math.cos(t * 0.4 + seed[i * 2 + 1]);
        const x = cx + px * 2 * halfPx;
        const y = cy + py * 2 * halfPx;
        ctx.fillRect(x - halfDot, y - halfDot, dot, dot);
      }
    };

    const tick = (time: number) => {
      rafId = 0;
      if (disposed || !inViewport) return;
      draw(time);
      rafId = window.requestAnimationFrame(tick);
    };

    resize();
    draw(0);

    const onResize = () => {
      resize();
      draw(0);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    if (reducedMotion) {
      return () => {
        disposed = true;
        ro.disconnect();
      };
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inViewport = entry.isIntersecting;
          if (inViewport && !rafId && !disposed) {
            rafId = window.requestAnimationFrame(tick);
          } else if (!inViewport && rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = 0;
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(wrap);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [sample, reducedMotion, theme]);

  /* Under PRM there is no rAF loop — redraw the static frame when the
     scrubber (or theme) moves. */
  useEffect(() => {
    if (!reducedMotion) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !sample || sample.count === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ink = resolveInk(wrap);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(${ink}, 0.82)`;
    const halfPx = (Math.min(canvas.width, canvas.height) / dpr) * (dpr / 2);
    const dot = Math.max(1.4, 1.6 * dpr);
    const visible = Math.min(sample.count, Math.floor(progress * sample.count));
    for (let i = 0; i < visible; i++) {
      const x = canvas.width / 2 + sample.home[i * 2] * 2 * halfPx;
      const y = canvas.height / 2 + sample.home[i * 2 + 1] * 2 * halfPx;
      ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }
  }, [reducedMotion, sample, progress, theme]);

  return (
    <div ref={wrapRef} className="dae-field" aria-hidden="true">
      <canvas ref={canvasRef} className="dae-field__canvas" />
    </div>
  );
}
