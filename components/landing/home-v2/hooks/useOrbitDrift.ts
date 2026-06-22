"use client";

import { useEffect, type RefObject } from "react";
import { pointOnEllipse } from "@/lib/celestial/orbits";
import type { ServiceOrbit } from "../services/celestialData";

/**
 * useOrbitDrift — slow, continuous drift of the celestial-map nodes.
 *
 * One shared `requestAnimationFrame` loop advances every service node
 * along its tilted ellipse and writes a `transform` on the matching
 * `.svc-orbit__node-rot[data-i]` group. Transform-only: no React
 * re-render, no geometry re-creation per frame; the orbit ellipses are
 * static (drawn once by `ServicesOrbitMap`).
 *
 * Why a hook instead of CSS `@keyframes` (as `OrbitalMarker` uses): a CSS
 * rotation only follows a *circle*, not a tilted ellipse — we need the
 * parametric point each frame, so we recompute via `pointOnEllipse`.
 *
 * Time is read from a single `performance.now()` base, so the angle is a
 * pure function of wall-clock — pausing off-screen and resuming never
 * jumps backward.
 *
 * Idle / fallback policy (mirrors `ServicesBrandmarkField`):
 *   - rAF runs only while the stage is in the viewport (IntersectionObserver).
 *   - `prefers-reduced-motion: reduce` OR `max-width: 960px` (the inert
 *     layouts where there is no corridor sun) → nodes parked at their
 *     resting angle, no rAF. Live media changes re-evaluate.
 *
 * @param stageRef ref to the sticky `.services-stage` element (the IO
 *   target and the query root for the node groups).
 * @param orbits the canonical `SERVICE_ORBITS` table.
 */
export function useOrbitDrift(
  stageRef: RefObject<HTMLElement | null>,
  orbits: readonly ServiceOrbit[]
): void {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const nodes = orbits
      .map((o) => ({
        o,
        el: stage.querySelector<SVGGElement>(`.svc-orbit__node-rot[data-i="${o.i}"]`),
      }))
      .filter((n): n is { o: ServiceOrbit; el: SVGGElement } => n.el != null);
    if (nodes.length === 0) return;

    let rafId = 0;
    let disposed = false;
    let inViewport = true;
    const t0 = typeof performance !== "undefined" && performance.now ? performance.now() : 0;

    const placeAt = (tSec: number) => {
      for (const { o, el } of nodes) {
        const psi = o.psi0Deg + o.driftDir * o.omegaDegPerSec * tSec;
        const p = pointOnEllipse(o.orbit.rx, o.orbit.ry, o.orbit.rotateDeg, psi);
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
    };

    const mqlRM = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    const mqlMob = window.matchMedia?.("(max-width: 960px)") ?? null;
    const inert = () => (mqlRM?.matches ?? false) || (mqlMob?.matches ?? false);

    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (disposed || !inViewport || inert()) return;
      placeAt((now - t0) / 1000);
      rafId = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!rafId && !disposed && inViewport && !inert()) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    // Park nodes at their resting angle first (covers the inert path and
    // avoids a flash before the first animated frame).
    placeAt(0);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inViewport = entry.isIntersecting;
          if (inViewport) start();
          else stop();
        }
      },
      { threshold: 0 }
    );
    io.observe(stage);

    const onMedia = () => {
      stop();
      if (inert()) placeAt(0);
      else start();
    };
    mqlRM?.addEventListener("change", onMedia);
    mqlMob?.addEventListener("change", onMedia);

    start();

    return () => {
      disposed = true;
      io.disconnect();
      stop();
      mqlRM?.removeEventListener("change", onMedia);
      mqlMob?.removeEventListener("change", onMedia);
    };
  }, [stageRef, orbits]);
}
