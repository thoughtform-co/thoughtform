"use client";

import { useEffect, useMemo, useRef } from "react";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS } from "@/lib/brandmark/shapes";
import {
  SEAM_BRANDMARK_ASPECT,
  SEAM_PIXEL_GRID,
  dispersePixel,
  getServicesTargetHalfPx,
} from "@/lib/home-v2/seamPixelize";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * CorridorSeamPixelField — fixed full-viewport 2D-canvas overlay
 * that paints the centred Services brandmark as a "pixelated"
 * gold/dawn particle field, then disperses it as `#continuum`
 * approaches the viewport top (ADR-021 follow-up).
 *
 * Mounts inside `HomeCorridor` on the capable path only (no
 * reduced-motion / no mobile fallback / WebGL OK). The actual
 * visibility gate is the `data-services-pixelate` attribute
 * written by `useCorridorExitScroll`:
 *
 *   - (no attribute) — canvas is `display: none` via CSS, the rAF
 *     bails out on the gate read with a single `clearRect`.
 *   - `"true"` — canvas is visible. The attribute opens the instant
 *     the welded brandmark has re-centred into the viewport (during
 *     the dock tail) and stays set through the post-dock continuum
 *     approach. `seamMorph` (read from the store each frame) ramps
 *     0 → 1 across that long runway: at 0 every particle sits at its
 *     home silhouette position (the pixel field PAINTS the brandmark
 *     while the SVG glyph is hidden by CSS); as it climbs the
 *     particles drift outward + lift upward and fade out. By full
 *     dispersal the canvas is functionally blank.
 *
 * Why a 2D canvas (not R3F):
 *   - The corridor's R3F canvas owns the planet/dissipate beat
 *     immediately preceding this seam; we don't want to share its
 *     frameloop or inject a new mesh into a context that's busy
 *     idling toward post-dissipate quiescence.
 *   - The visual contract is exactly the `/test/gateway` pixel
 *     grid (`fillRect`, `GRID = 3`); a 2D canvas paints that
 *     natively with one `fillRect` per particle and zero shader
 *     plumbing.
 *   - Decoupled lifecycle — the canvas mounts/unmounts cleanly
 *     with React state without provoking R3F context loss
 *     warnings.
 *
 * The brandmark sample (`sampleShape({ paths: BRANDMARK_FULL_PATHS,
 * ... })`) is the SAME source-of-truth `BrandmarkSilhouettePoints`
 * uses (ADR-014, ADR-019), so the silhouette read is identical to
 * the SVG glyph the field replaces.
 *
 * ADR-015 retired the square-pixel aesthetic for the brandmark
 * particle painters proper. This component is a SEAM artifact,
 * not one of the capped brandmark painters — the square pixels
 * are an intentional borrow from the gateway hero and documented
 * as such in `sentinel/decisions/021-...`.
 */

/** Viewbox of the canonical brandmark — matches `BrandmarkGlyph`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 };

/** Particle counts. Mirrors `BrandmarkSilhouettePoints`'s
 *  substrate-tier density so the seam field reads as a solid
 *  mark at `seamMorph = 0`. */
const SEAM_PARTICLE_COUNT_DESKTOP = 1900;
const SEAM_PARTICLE_COUNT_MOBILE = 700;

/** Mobile threshold mirrors the existing depth-corridor mobile
 *  gate so density tiers stay in lockstep. */
const SEAM_MOBILE_MAX_WIDTH = 768;

/** Theme RGB triples. Most particles paint the unified gold
 *  (176,139,66 == TENSOR_GOLD #b08b42) so this brandmark dissolve matches the
 *  corridor mark + #services centerpiece; a small fraction paint dawn for
 *  cool-side accents. */
const GOLD_RGB = "176, 139, 66";
const DAWN_RGB = "236, 227, 214";

/** Particles whose `colorMix` exceeds this threshold render in
 *  dawn instead of gold. ~15% dawn / 85% gold reads as a brand
 *  field with subtle cool flecks. */
const DAWN_COLOR_THRESHOLD = 0.85;

/** Minimum alpha worth painting. Below this the squared falloff
 *  is sub-perceptible and we save a `fillRect`. */
const MIN_PAINT_ALPHA = 0.01;

export function CorridorSeamPixelField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sample the brandmark once on mount. The cache inside
  // `sampleShape` keeps subsequent mounts (HMR / Fast Refresh)
  // free; this `useMemo` just stops React from re-deriving the
  // count + key on every render.
  const sample = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < SEAM_MOBILE_MAX_WIDTH;
    const count = isMobile ? SEAM_PARTICLE_COUNT_MOBILE : SEAM_PARTICLE_COUNT_DESKTOP;
    return sampleShape({
      shapeKey: `seam-pixel-field-${isMobile ? "mobile" : "desktop"}`,
      paths: BRANDMARK_FULL_PATHS,
      viewBox: BRANDMARK_VIEWBOX,
      count,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let disposed = false;
    // Cap DPR at 2 (matches ServicesBrandmarkField) — above 2x the gain is
    // imperceptible for this brief 2D seam effect but the fill cost scales
    // with the square of DPR (a DPR-3 phone would allocate 2.25x the pixels).
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let vw = window.innerWidth;
    let vh = window.innerHeight;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.floor(vw * dpr);
      canvas.height = Math.floor(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
      // After resize the transform resets; re-apply the DPR scale
      // so subsequent draw ops are in CSS pixels.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Reusable particle input record so the hot loop allocates
    // nothing per-particle. `dispersePixel` returns a fresh
    // object literal — that's fine: ~1900 short-lived allocations
    // per frame is well inside the GC budget for the brief seam
    // window, and the math module stays pure for tests.
    const inRow = {
      homeX: 0,
      homeY: 0,
      seedX: 0,
      seedY: 0,
      rank: 0,
      count: sample.count,
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (disposed) return;

      // `data-services-pixelate` opens the instant the welded
      // brandmark has re-centred (during the dock tail) and stays set
      // through the post-dock continuum approach — see
      // `useCorridorExitScroll`. Outside that window, blank the
      // canvas once and skip the per-particle loop entirely so the
      // rAF stays idle while the rest of the page scrolls.
      const active = document.documentElement.getAttribute("data-services-pixelate") === "true";
      if (!active) {
        ctx.clearRect(0, 0, vw, vh);
        return;
      }

      const seamMorph = useDepthGatewayStore.getState().transform.seamMorph;

      ctx.clearRect(0, 0, vw, vh);

      // Layout — anchor on viewport centre, sized to match the
      // `data-services-brandmark="hold"` CSS clamp. Computed once
      // per frame so resize / orientation flips track instantly.
      const halfPx = getServicesTargetHalfPx(vw);
      const layout = {
        centerX: vw * 0.5,
        centerY: vh * 0.5,
        halfPx,
        aspect: SEAM_BRANDMARK_ASPECT,
        gridSize: SEAM_PIXEL_GRID,
        seamMorph,
      };

      const grid = SEAM_PIXEL_GRID;
      // Draw size matches `ImageParticleGateway` (`GRID - 1`) so
      // there is a 1px gutter between cells and the field reads
      // as discrete pixels rather than a solid fill.
      const drawSize = grid - 1;
      const minX = -grid;
      const maxX = vw + grid;
      const minY = -grid;
      const maxY = vh + grid;

      const home = sample.home;
      const seed = sample.seed;
      const rank = sample.rank;
      const count = sample.count;

      for (let i = 0; i < count; i++) {
        const i2 = i * 2;
        inRow.homeX = home[i2];
        inRow.homeY = home[i2 + 1];
        inRow.seedX = seed[i2];
        inRow.seedY = seed[i2 + 1];
        inRow.rank = rank[i];

        const out = dispersePixel(inRow, layout);
        if (out.alpha < MIN_PAINT_ALPHA) continue;
        if (out.x < minX || out.x > maxX || out.y < minY || out.y > maxY) continue;

        const triple = out.colorMix > DAWN_COLOR_THRESHOLD ? DAWN_RGB : GOLD_RGB;
        ctx.fillStyle = `rgba(${triple}, ${out.alpha.toFixed(3)})`;
        ctx.fillRect(out.x, out.y, drawSize, drawSize);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [sample]);

  return <canvas ref={canvasRef} className="home-v2-seam-pixels" aria-hidden="true" />;
}
