"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { SERVICE_SHAPES, type ServiceShapeKey } from "@/lib/services/serviceShapes";

interface ServiceSigilFieldProps {
  shapeKey: ServiceShapeKey;
  /** True for the visually emphasised "lead" card — particles paint
   *  in `--gold` instead of `--dawn-70`. */
  accent?: boolean;
}

/**
 * Card-scoped 2D particle painter for the Services terminal cards.
 *
 * Samples a service-specific silhouette via
 * `lib/brandmark/sampleShape.ts` (the same proven stratified sampler
 * the brandmark painters use, ADR-011) into a dense home-position
 * Float32Array. Per frame, paints each particle as a 1.5-2px square
 * dot at a slow sinusoidal jitter around its home position, so the
 * cloud reads as "instrument-grade" — alive but not noisy.
 *
 * Painter scope: it is NOT part of the global brandmark painter cap
 * (`BrandmarkParticleCanvas`); it is its own scoped 2D canvas, sized
 * to its container box. Each card mounts its own field. Pattern
 * mirrors `CorridorSeamPixelField` but bounded to a card-sized rect
 * instead of the viewport.
 *
 * Idle policy:
 *   - rAF runs only while the canvas is in the viewport
 *     (IntersectionObserver gate).
 *   - When `prefers-reduced-motion: reduce`, the painter renders a
 *     single static frame and returns.
 *   - Pre-hydration / SSR: the inline fallback SVG (from
 *     `SERVICE_SHAPES[key].fallbackSvg`) is visible until the
 *     canvas takes over.
 */
export function ServiceSigilField({ shapeKey, accent = false }: ServiceSigilFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const spec = SERVICE_SHAPES[shapeKey];

  // Pre-resolve sample on the client only — `sampleShape` no-ops
  // during SSR. Memoised by (shapeKey, count) so multiple cards of
  // the same shape share the same cloud.
  const sample = useMemo(() => {
    if (typeof document === "undefined") return null;
    return sampleShape({
      shapeKey: spec.key,
      paths: spec.paths,
      viewBox: spec.viewBox,
      count: spec.count,
    });
  }, [spec]);

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
      // Use the smaller dimension as the visual square; the cloud is
      // 200×200 in viewBox space and we want it to fit the card's
      // visual area without spilling out of the corner-bracket frame.
      const sizeCss = Math.max(1, Math.min(rect.width, rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      half = (sizeCss * 0.82) / 2; // 82% of the smaller dim — leaves padding
      cx = (rect.width * dpr) / 2;
      cy = (rect.height * dpr) / 2;
    };

    const draw = (timeMs: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = timeMs * 0.001;
      // Soft instrument colour — gold for lead cards, dawn for the
      // others. Each dot is painted as a 1.5-2px square at DPR so the
      // cloud reads as crisp pixels on retina.
      const color = accent ? "rgba(202, 165, 84, 0.92)" : "rgba(236, 227, 214, 0.78)";
      const dot = Math.max(1.5, 1.7 * dpr);
      const halfDot = dot * 0.5;
      const home = sample.home;
      const seed = sample.seed;
      const count = sample.count;
      const halfPx = half * dpr;
      const jitter = 0.012; // ≈ 1.2% of the half-rect — barely perceptible

      ctx.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const hx = home[i * 2];
        const hy = home[i * 2 + 1];
        const sx = seed[i * 2];
        const sy = seed[i * 2 + 1];
        // Per-particle slow drift, deterministic per seed.
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
    // Initial static frame so the cloud is visible even before the
    // first rAF lands (and is the only frame for reduced motion).
    draw(performance.now ? performance.now() : 0);

    const onResize = () => {
      resize();
      draw(performance.now ? performance.now() : 0);
    };

    // ResizeObserver re-measures when the card actually lays out. The
    // #services section uses `content-visibility: auto`, so the cards
    // are layout-skipped until scrolled near — `resize()` on mount can
    // capture a stale/collapsed box. The observer fires once on observe
    // (current size) and again whenever the box changes (content-
    // visibility flip, font load, scroll-near, viewport resize), so the
    // canvas always matches the rendered sigil square.
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    if (reducedMotion) {
      // One static frame; no animation loop. The ResizeObserver above
      // still keeps the single frame correctly sized.
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
  }, [sample, reducedMotion, accent]);

  return (
    <div
      ref={wrapRef}
      className="svc-card__sigil"
      data-shape={shapeKey}
      data-accent={accent ? "true" : "false"}
    >
      {/* Static SVG fallback — visible pre-hydration and as a layer
          behind the canvas (the canvas is mostly transparent so the
          SVG silhouette gives a soft underpaint to the particles). */}
      <div
        className="svc-card__sigil__fallback"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: spec.fallbackSvg }}
        style={{ opacity: hydrated ? 0 : 0.18 }}
      />
      <canvas ref={canvasRef} className="svc-card__sigil__canvas" aria-hidden="true" />
    </div>
  );
}
