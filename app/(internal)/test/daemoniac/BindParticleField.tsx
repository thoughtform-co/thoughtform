"use client";

// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC LAB — the particle inscription, as a STIPPLE (owner,
// 2026-08-10: the gaussian spray read as sloppy/low-res). Points sit
// exactly on the stroke at an even pitch, snapped to the house pixel
// grid (GRID = 3 device px — the ThoughtformSigil signature), with
// stroke weight expressed as ink TONE, never scatter.
//
// The ONLY motion is the inscription reveal itself (rank < progress ·
// count), so there is no rAF loop and no IO gate — the canvas redraws
// on state change alone. PRM needs no special path: a static drawing
// is already still; the shell's replay button is what PRM skips.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef } from "react";

import { sampleBind } from "@/lib/daemoniac/bindPaths";
import type { BindComposition } from "@/lib/daemoniac/types";

const BUDGET_DESKTOP = 2600;
const BUDGET_MOBILE = 1200;

/** The house pixel grid, in device px. */
const GRID = 3;
const DOT = 2;

/** Resolve the plate ink to an "r, g, b" triple — the stipple follows
 *  the same `--gold-line` role as the SVG plate, so it deepens on
 *  parchment exactly like the drawn bind. */
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

  const sample = useMemo(() => {
    if (typeof document === "undefined") return null;
    const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
    return sampleBind(composition, mobile ? BUDGET_MOBILE : BUDGET_DESKTOP);
  }, [composition]);

  /* Tone tiers batched once per sample — ≤4 fillStyle changes a frame. */
  const tiers = useMemo(() => {
    if (!sample) return [];
    const map = new Map<number, number[]>();
    for (let i = 0; i < sample.count; i++) {
      const t = sample.tone[i];
      const arr = map.get(t);
      if (arr) arr.push(i);
      else map.set(t, [i]);
    }
    return [...map.entries()];
  }, [sample]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !sample || sample.count === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
      ctx.clearRect(0, 0, width, height);
      const ink = resolveInk(wrap);
      const halfPx = Math.min(width, height) / 2;
      const cx = width / 2;
      const cy = height / 2;
      const visible = Math.min(sample.count, Math.floor(progress * sample.count));
      for (const [tone, indices] of tiers) {
        ctx.fillStyle = `rgba(${ink}, ${tone})`;
        for (const i of indices) {
          if (i >= visible) continue;
          const x = Math.round((cx + sample.home[i * 2] * 2 * halfPx) / GRID) * GRID;
          const y = Math.round((cy + sample.home[i * 2 + 1] * 2 * halfPx) / GRID) * GRID;
          ctx.fillRect(x, y, DOT, DOT);
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [sample, tiers, progress, theme]);

  return (
    <div ref={wrapRef} className="dae-field" aria-hidden="true">
      <canvas ref={canvasRef} className="dae-field__canvas" />
    </div>
  );
}
