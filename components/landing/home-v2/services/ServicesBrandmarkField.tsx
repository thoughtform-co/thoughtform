"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";

/** Source viewBox of `public/logos/Thoughtform_Brandmark.svg` (see
 *  `lib/brandmark/shapes.ts`). Nearly square — the ~1% vertical squash
 *  from drawing into a square canvas is imperceptible. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Substrate-tier density so the mark reads as a solid filled glyph
 *  (matches the global silhouette painter's order of magnitude). */
const COUNT_DESKTOP = 1800;
const COUNT_MOBILE = 800;

/**
 * Centered, constant particle render of the full Thoughtform brandmark —
 * the visual anchor of the redesigned Services stage (the "particle
 * version of our brand mark" that flanks the left service list and the
 * right explanation).
 *
 * This is the SAME proven 2D-canvas painter as the retired
 * `ServiceSigilField` (ADR-011 stratified sampler → slow per-particle
 * sinusoidal breathing around fixed home positions), but it samples the
 * canonical `BRANDMARK_FULL_PATHS` instead of a per-card service
 * silhouette, and it does NOT change with scroll — one constant mark
 * across all three services (per the brief).
 *
 * Painter scope: its own container-sized 2D canvas. It is NOT part of
 * the global `BrandmarkParticleCanvas` painter cap — it composites in
 * front of the ambient interior-sphere particles that the corridor-exit
 * hold keeps alive behind `#services` (the "inside the sphere" backdrop).
 *
 * Idle / fallback policy (mirrors `ServiceSigilField`):
 *   - rAF runs only while the canvas is in the viewport (IO gate).
 *   - `prefers-reduced-motion: reduce` → a single static frame.
 *   - Pre-hydration / SSR → the inline fallback SVG is visible until the
 *     canvas takes over.
 */
export function ServicesBrandmarkField() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Sample once on the client (no-ops during SSR). Memoised by the
  // stable shape key inside `sampleShape`, so re-mounts reuse the cloud.
  const sample = useMemo(() => {
    if (typeof document === "undefined") return null;
    const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
    return sampleShape({
      shapeKey: BRANDMARK_SHAPE_KEYS.full,
      paths: BRANDMARK_FULL_PATHS,
      viewBox: BRANDMARK_VIEWBOX,
      count: mobile ? COUNT_MOBILE : COUNT_DESKTOP,
    });
  }, []);

  useEffect(() => {
    setHydrated(true);
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
    let half = 0;
    let cx = 0;
    let cy = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const sizeCss = Math.max(1, Math.min(rect.width, rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      // 82% of the smaller dim leaves padding so the outer C-arc never
      // clips against the container edge.
      half = (sizeCss * 0.82) / 2;
      cx = (rect.width * dpr) / 2;
      cy = (rect.height * dpr) / 2;
    };

    const draw = (timeMs: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = timeMs * 0.001;
      // Unified gold mark (176,139,66 == TENSOR_GOLD #b08b42) — the unified
      // corridor + #services darker-orange, so this mobile / reduced-motion
      // fallback matches the desktop WebGL centerpiece.
      ctx.fillStyle = "rgba(176, 139, 66, 0.82)";
      const dot = Math.max(1.5, 1.7 * dpr);
      const halfDot = dot * 0.5;
      const home = sample.home;
      const seed = sample.seed;
      const count = sample.count;
      const halfPx = half * dpr;
      // Calm centerpiece — a touch less wander than the card sigils so
      // it reads as steady, not noisy.
      const jitter = 0.01;

      for (let i = 0; i < count; i++) {
        const hx = home[i * 2];
        const hy = home[i * 2 + 1];
        const sx = seed[i * 2];
        const sy = seed[i * 2 + 1];
        const px = hx + jitter * Math.sin(t * 0.5 + sx);
        const py = hy + jitter * Math.cos(t * 0.4 + sy);
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
    draw(performance.now ? performance.now() : 0);

    const onResize = () => {
      resize();
      draw(performance.now ? performance.now() : 0);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    if (reducedMotion) {
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
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

    window.addEventListener("resize", onResize);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [sample, reducedMotion]);

  return (
    <div ref={wrapRef} className="services-stage__brandmark" aria-hidden="true">
      {/* Static SVG fallback — visible pre-hydration and as a faint
          underpaint behind the (mostly transparent) particle canvas. */}
      <svg
        className="services-stage__brandmark__fallback"
        viewBox={`0 0 ${BRANDMARK_VIEWBOX.width} ${BRANDMARK_VIEWBOX.height}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: hydrated ? 0 : 0.16 }}
      >
        {BRANDMARK_FULL_PATHS.map((d, i) => (
          <path key={i} d={d} fill="currentColor" />
        ))}
      </svg>
      <canvas ref={canvasRef} className="services-stage__brandmark__canvas" />
    </div>
  );
}
