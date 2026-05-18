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
 * Drift is gated by the sigil -> miss morph scalar. Until the orbit
 * system is essentially fully formed (`--orbit-morph >= 0.99`) the
 * labels + anchors are pinned to their SSR-rendered positions so the
 * morph can resolve them in (opacity / blur / anchor scale) without
 * the drift simultaneously sliding them off-anchor. Once the gate is
 * crossed the drift accumulates phase only while it remains crossed,
 * so scrolling back up to #definition pauses the celestial motion
 * cleanly and a return visit picks it up again.
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
// Threshold on `--orbit-morph` (set inline by useBrandmarkJourney)
// past which the drift loop is allowed to advance phase. Below this
// the morph is still resolving in the orbits / anchors / labels via
// CSS scalars; running drift in that window would slide pills off
// their emerging anchors and read as two competing motions.
const DRIFT_GATE = 0.99;

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

    // Capture the SSR-rendered positions BEFORE any rAF tick can
    // overwrite them so the gate-down restore path can reliably pin
    // labels / anchors back to their starting frame.
    const ssrLabelStyle = labels.map((l) =>
      l
        ? {
            x: l.style.getPropertyValue("--x-pct").trim(),
            y: l.style.getPropertyValue("--y-pct").trim(),
          }
        : null
    );
    const ssrAnchorAttr = anchors.map((a) =>
      a
        ? {
            cx: a.getAttribute("cx") ?? "0",
            cy: a.getAttribute("cy") ?? "0",
          }
        : null
    );

    // Locate the LandingPage root (where useBrandmarkJourney writes
    // `--orbit-morph` inline). Reading from `.style.getPropertyValue`
    // is materially cheaper than `getComputedStyle` per frame.
    const rootEl: HTMLElement =
      labels.find((l): l is HTMLElement => l != null)?.closest<HTMLElement>("[data-theme]") ??
      document.documentElement;
    const readOrbitMorph = (): number => {
      const v = rootEl.style.getPropertyValue("--orbit-morph").trim();
      if (!v) return 0;
      const n = Number.parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    const restoreSsr = () => {
      for (let i = 0; i < ORBITS.length; i += 1) {
        const label = labels[i];
        const ssr = ssrLabelStyle[i];
        if (label && ssr) {
          if (ssr.x) label.style.setProperty("--x-pct", ssr.x);
          if (ssr.y) label.style.setProperty("--y-pct", ssr.y);
        }
        const anchor = anchors[i];
        const ssrA = ssrAnchorAttr[i];
        if (anchor && ssrA) {
          anchor.setAttribute("cx", ssrA.cx);
          anchor.setAttribute("cy", ssrA.cy);
        }
      }
    };

    let raf = 0;
    let driftActive = false;
    let driftPhaseSec = 0;
    let lastTickMs = 0;

    const tick = (now: number) => {
      const morph = readOrbitMorph();
      if (morph < DRIFT_GATE) {
        if (driftActive) {
          restoreSsr();
          driftActive = false;
        }
        lastTickMs = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      // Drift active. Accumulate phase only when the gate stays
      // crossed so visitors who scroll back up don't lose their
      // celestial-time progress on next entry.
      if (!driftActive) {
        driftActive = true;
        lastTickMs = now;
      }
      driftPhaseSec += (now - lastTickMs) / 1000;
      lastTickMs = now;

      for (let i = 0; i < ORBITS.length; i += 1) {
        const O = ORBITS[i];
        const cycleDeg = (driftPhaseSec / O.periodSec) * 360 * (O.reverse ? -1 : 1);
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
