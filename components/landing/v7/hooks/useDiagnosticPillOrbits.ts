"use client";

import { useEffect } from "react";

/**
 * useDiagnosticPillOrbits — slow orbital motion for the four pill
 * labels in the diagnostic section (#missing-layer).
 *
 * Each pill label sits on its own elliptical orbit (see
 * `lib/celestial/orbits.ts`). The orbit ellipses themselves are
 * rendered as static SVG (with their tilt baked into `transform`),
 * but the LABELS and their ANCHOR PIPS need to traverse the orbital
 * path. CSS `offset-path` cannot match the rendered SVG path cleanly
 * across viewport sizes (the SVG scales via `preserveAspectRatio`
 * while CSS pixel paths do not), so a tiny rAF loop here computes
 * each pill's parametric position every frame and writes the result
 * to:
 *
 *   - the label element's inline `--x-pct` / `--y-pct` CSS variables
 *     (overriding the static SSR values; the label is positioned via
 *     `left: calc(50% + var(--x-pct) * 1%)` etc.)
 *   - the SVG anchor pip's `cx` / `cy` attributes (the anchor lives
 *     OUTSIDE the orbit's rotation group, so it accepts raw SVG
 *     coordinates directly).
 *
 * Periods are deliberately slow (10-13 minutes per revolution) so the
 * motion reads as celestial drift, not animation noise. Two orbits go
 * clockwise (01 + 03), two counter-clockwise (02 + 04) — direction is
 * a property of the orbit, not a global animation parameter.
 *
 * Respects `prefers-reduced-motion`: the hook simply does not start
 * the rAF loop, so labels + anchors stay at their SSR-rendered
 * starting positions for visitors who opted out of motion.
 */

interface PillOrbit {
  id: "01" | "02" | "03" | "04";
  rx: number;
  ry: number;
  rotateDeg: number;
  startPsiDeg: number;
  periodSec: number;
  reverse?: boolean;
}

const ORBITS: readonly PillOrbit[] = [
  { id: "01", rx: 370, ry: 225, rotateDeg: 16, startPsiDeg: 205, periodSec: 720 },
  { id: "02", rx: 465, ry: 140, rotateDeg: -8, startPsiDeg: -35, periodSec: 660, reverse: true },
  { id: "03", rx: 395, ry: 175, rotateDeg: -28, startPsiDeg: 155, periodSec: 780 },
  { id: "04", rx: 305, ry: 185, rotateDeg: 32, startPsiDeg: 10, periodSec: 600, reverse: true },
];

const VIEWBOX_W = 1100;
const VIEWBOX_H = 650;

export function useDiagnosticPillOrbits(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Query elements once; if not yet mounted, the hook is a no-op
    // and the next mount cycle will pick them up.
    const labels: (HTMLElement | null)[] = ORBITS.map(
      (O) => document.querySelector<HTMLElement>(`.miss__label--${O.id}`) ?? null
    );
    const anchors: (SVGCircleElement | null)[] = ORBITS.map(
      (O) => document.querySelector<SVGCircleElement>(`.miss__anchor--${O.id}`) ?? null
    );
    if (labels.every((l) => l == null) || anchors.every((a) => a == null)) return;

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      for (let i = 0; i < ORBITS.length; i += 1) {
        const O = ORBITS[i];
        const cycleDeg = (elapsed / O.periodSec) * 360 * (O.reverse ? -1 : 1);
        const psi = ((O.startPsiDeg + cycleDeg) * Math.PI) / 180;
        const rot = (O.rotateDeg * Math.PI) / 180;
        const lx = O.rx * Math.cos(psi);
        const ly = O.ry * Math.sin(psi);
        const x = lx * Math.cos(rot) - ly * Math.sin(rot);
        const y = lx * Math.sin(rot) + ly * Math.cos(rot);
        const xPct = (x / VIEWBOX_W) * 100;
        const yPct = (y / VIEWBOX_H) * 100;

        const label = labels[i];
        if (label) {
          label.style.setProperty("--x-pct", xPct.toFixed(3));
          label.style.setProperty("--y-pct", yPct.toFixed(3));
        }
        const anchor = anchors[i];
        if (anchor) {
          anchor.setAttribute("cx", x.toFixed(1));
          anchor.setAttribute("cy", y.toFixed(1));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);
}
