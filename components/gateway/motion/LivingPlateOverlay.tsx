"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { GatewayVisualEntry } from "@/lib/gateway-motion/manifest";
import { coverUv } from "./shaders";

export interface LivingConfig extends Record<string, number> {
  /** 0 disables star twinkle (use when composed over a moving treatment —
   *  twinkles are position-registered to the plate's own stars). */
  twinkle: number;
  twinkleCount: number;
  twinkleSpeed: number;
  motes: number;
  moteCount: number;
  moteSpeed: number;
}

export const LIVING_DEFAULTS: LivingConfig = {
  twinkle: 1,
  twinkleCount: 140,
  twinkleSpeed: 0.55,
  motes: 1,
  moteCount: 36,
  moteSpeed: 1,
};

const FOCUS_X = 0.68;
const FOCUS_Y = 0.45;
const DAWN = "236, 227, 214";
const GOLD = "202, 165, 84";

interface Star {
  u: number; // image-space uv (y-down)
  v: number;
  size: number;
  phase: number;
  rate: number;
  gold: boolean;
}

interface Mote {
  x: number; // stage fractions
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
}

/**
 * Procedural life over a (still) plate: star twinkle sampled from the
 * prep pipeline's star mask, plus slow-drifting dust motes. Runs on a 2D
 * canvas with `mix-blend-mode: screen` so it only ever brightens the
 * plate underneath. Film grain is NOT here — GatewayStage's `.gwm-grain`
 * CSS layer covers it for every treatment.
 */
export function LivingPlateOverlay({
  entry,
  active,
  config = LIVING_DEFAULTS,
}: {
  entry: GatewayVisualEntry;
  active: boolean;
  config?: LivingConfig;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const motesRef = useRef<Mote[]>([]);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Sample star positions from the mask once per visual.
  useEffect(() => {
    starsRef.current = [];
    const src = entry.masks.stars;
    if (!src || !config.twinkle) return;
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const w = 512;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      const candidates: Array<[number, number]> = [];
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          if (data[(y * w + x) * 4] > 140) candidates.push([x, y]);
        }
      }
      // Deterministic-ish shuffle so density stays uniform.
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      starsRef.current = candidates.slice(0, config.twinkleCount).map(([x, y]) => ({
        u: x / w,
        v: y / h,
        size: 0.8 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        rate: 0.5 + Math.random(),
        gold: Math.random() < 0.12,
      }));
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [entry, config.twinkle, config.twinkleCount]);

  // Init motes once per count change.
  useEffect(() => {
    motesRef.current = Array.from({ length: config.moteCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.6,
      vx: (-0.6 - Math.random() * 0.8) / 100, // fractions per second — leftward drift
      vy: (-0.15 + Math.random() * 0.5) / 100,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [config.moteCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);

      // Star twinkle — mask image space → stage space through the same
      // cover crop the plate uses (image coords are y-down; no flip here).
      if (config.twinkle && starsRef.current.length) {
        const [fx, fy, ox, oy] = coverUv(
          W,
          H,
          entry.source.width,
          entry.source.height,
          FOCUS_X,
          FOCUS_Y
        );
        for (const s of starsRef.current) {
          const sx = ((s.u - ox) / fx) * W;
          const sy = ((s.v - oy) / fy) * H;
          if (sx < -8 || sx > W + 8 || sy < -8 || sy > H + 8) continue;
          const tw = 0.5 + 0.5 * Math.sin(s.phase + t * config.twinkleSpeed * s.rate * Math.PI * 2);
          const a = 0.05 + tw * tw * 0.5;
          const r = s.size * (0.8 + tw * 0.7);
          const color = s.gold ? GOLD : DAWN;
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
          grad.addColorStop(0, `rgba(${color}, ${a})`);
          grad.addColorStop(1, `rgba(${color}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Dust motes — free-floating, safe over any treatment.
      if (config.motes) {
        for (const m of motesRef.current) {
          m.x += m.vx * config.moteSpeed * dt * 60 * 0.016;
          m.y += m.vy * config.moteSpeed * dt * 60 * 0.016;
          if (m.x < -0.02) m.x = 1.02;
          if (m.x > 1.02) m.x = -0.02;
          if (m.y < -0.02) m.y = 1.02;
          if (m.y > 1.02) m.y = -0.02;
          const wob = Math.sin(m.phase + t * 0.4);
          const a = 0.08 + 0.1 * (0.5 + 0.5 * wob);
          ctx.fillStyle = `rgba(${DAWN}, ${a})`;
          ctx.beginPath();
          ctx.arc(m.x * W, m.y * H + wob * 4, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, config, entry, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
}
