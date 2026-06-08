"use client";

import { useEffect, useRef } from "react";
import { stationById } from "@/lib/home-v2/corridorMap";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * CorridorStationHeaders — flat 2D screen-space layer for the three
 * Linear-style corridor headers (Navigate / Encode / Build).
 *
 * Desktop-only. The headers live in the viewport (`position: absolute`
 * inside the sticky stage), NOT in the world projection, so they don't
 * skew with the camera, don't smear off-screen at close camera ranges,
 * and read consistently across aspect ratios. Mobile keeps the
 * world-anchored straddle inside `CopyAnchors` so the centred portrait
 * composition still ties to the reticle.
 *
 * Each header has its own opacity, driven per frame by
 * `useDepthGatewayStore.transform.paintProgress`:
 *
 *   - Navigate fades in with the substrate accretion (~0.345) and out
 *     as the orbits start (~0.54) so the Encode title can take over.
 *   - Encode fades in with the orbits (~0.54) and out as the stack
 *     accretion starts (~0.84).
 *   - Build fades in with the stack accretion (~0.84) and holds
 *     through corridor end.
 *
 * Opacity windows mirror `CORRIDOR_TIMELINE.accretion` so each header
 * arrives WITH its visual layer (sphere / orbits / stack) and yields
 * to the next one cleanly.
 */

// Per-station fade windows. The fade-OUT of station N completes
// BEFORE the fade-IN of station N+1 begins, so the headers never
// stack on top of each other during transit. Beat reference:
//   - pass-01a   [0.109, 0.355]
//   - navigate   [0.355, 0.445]
//   - pass-01b   [0.445, 0.573]
//   - diagnostic [0.573, 0.7]    (Encode park ~0.636)
//   - passthr-02 [0.7,   0.845]
//   - intellig.  [0.845, 1.0]    (Build park ~0.92)
//
// Tied to `CORRIDOR_TIMELINE.accretion`:
//   - substrate.start 0.345 → Navigate text fades in WITH the gimbal
//   - orbits.start    0.54  → Encode text fades in WITH the orbits
//   - stack.start     0.84  → Build text fades in WITH the funnel
const NAVIGATE_FADE_IN: [number, number] = [0.345, 0.41];
const NAVIGATE_FADE_OUT: [number, number] = [0.47, 0.54];
const ENCODE_FADE_IN: [number, number] = [0.54, 0.62];
const ENCODE_FADE_OUT: [number, number] = [0.76, 0.83];
const BUILD_FADE_IN: [number, number] = [0.84, 0.91];

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function bandOpacity(p: number, fadeIn: [number, number], fadeOut?: [number, number]): number {
  const inOp = smoothstep(fadeIn[0], fadeIn[1], p);
  const outOp = fadeOut ? smoothstep(fadeOut[0], fadeOut[1], p) : 0;
  return Math.max(0, inOp - outOp);
}

export function CorridorStationHeaders() {
  const nav = stationById("navigate")?.content;
  const enc = stationById("diagnostic")?.content;
  const bld = stationById("intelligence")?.content;

  const navRef = useRef<HTMLDivElement>(null);
  const encRef = useRef<HTMLDivElement>(null);
  const bldRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<{ nav: number; enc: number; bld: number } | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const painting = t.active || t.armed;
      const p = painting ? t.paintProgress : 0;

      const navOp = bandOpacity(p, NAVIGATE_FADE_IN, NAVIGATE_FADE_OUT);
      const encOp = bandOpacity(p, ENCODE_FADE_IN, ENCODE_FADE_OUT);
      const bldOp = bandOpacity(p, BUILD_FADE_IN);

      const last = lastRef.current;
      const changed =
        !last ||
        Math.abs(last.nav - navOp) > 0.002 ||
        Math.abs(last.enc - encOp) > 0.002 ||
        Math.abs(last.bld - bldOp) > 0.002;
      if (!changed) return;
      lastRef.current = { nav: navOp, enc: encOp, bld: bldOp };

      const navEl = navRef.current;
      const encEl = encRef.current;
      const bldEl = bldRef.current;
      if (navEl) navEl.style.opacity = navOp.toFixed(3);
      if (encEl) encEl.style.opacity = encOp.toFixed(3);
      if (bldEl) bldEl.style.opacity = bldOp.toFixed(3);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="home-v2-station-headers" aria-hidden="false">
      {nav && (
        <div ref={navRef} className="home-v2-station-header" style={{ opacity: 0 }}>
          <h2
            className="home-v2-station-header__title"
            dangerouslySetInnerHTML={{ __html: nav.titleHtml }}
          />
          {nav.supportHtml && (
            <p
              className="home-v2-station-header__support"
              dangerouslySetInnerHTML={{ __html: nav.supportHtml }}
            />
          )}
        </div>
      )}
      {enc && (
        <div ref={encRef} className="home-v2-station-header" style={{ opacity: 0 }}>
          <h2
            className="home-v2-station-header__title"
            dangerouslySetInnerHTML={{ __html: enc.titleHtml }}
          />
          {enc.supportHtml && (
            <p
              className="home-v2-station-header__support"
              dangerouslySetInnerHTML={{ __html: enc.supportHtml }}
            />
          )}
        </div>
      )}
      {bld && (
        <div ref={bldRef} className="home-v2-station-header" style={{ opacity: 0 }}>
          <h2
            className="home-v2-station-header__title"
            dangerouslySetInnerHTML={{ __html: bld.titleHtml }}
          />
          {bld.supportHtml && (
            <p
              className="home-v2-station-header__support"
              dangerouslySetInnerHTML={{ __html: bld.supportHtml }}
            />
          )}
        </div>
      )}
    </div>
  );
}
