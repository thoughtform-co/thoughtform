"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface LatentScrollState {
  /** 0..1 progress through the tall scroll track */
  trackProgress: number;
  /** 0..1 reveal of editorial “surface” peeling back */
  surfaceReveal: number;
  /** 0..1 — drives ThreeGateway scrollProgress (full wormhole travel 0→1) */
  tunnelScroll: number;
  /** 1..~1.12 — subtle CSS scale (camera does primary travel) */
  gatewayScale: number;
  /** 0..1 opacity for gateway wrapper (fades after tunnel exit) */
  gatewayOpacity: number;
  /** 0..6px blur applied during passthrough (reserved) */
  gatewayBlur: number;
  /** 0..1 — visibility of the latent topology layer */
  latentEmerge: number;
  /** 0..1 — latent exit / docking plane graphic */
  exitPlane: number;
  /** 0..1 — case cards approach from exit plane toward camera */
  caseEntry: number;
  /** 0..1 — side cards fan from plane into orbit (after centre docks) */
  orbitFanOut: number;
  /** 0..1 — orbit drift / cycle */
  orbitCycle: number;
  /** Active card index based on orbit cycle */
  activeCaseIndex: number;
  reduceMotion: boolean;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function smooth(n: number): number {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function computeTrackProgress(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const denom = Math.max(1, el.offsetHeight);
  const raw = (vh - rect.top) / denom;
  return clamp01(raw);
}

const CASE_COUNT = 4;

export function useLatentCaseScroll(trackRef: RefObject<HTMLElement | null>): LatentScrollState {
  const [state, setState] = useState<LatentScrollState>({
    trackProgress: 0,
    surfaceReveal: 0,
    tunnelScroll: 0,
    gatewayScale: 1,
    gatewayOpacity: 1,
    gatewayBlur: 0,
    latentEmerge: 0,
    exitPlane: 0,
    caseEntry: 0,
    orbitFanOut: 0,
    orbitCycle: 0,
    activeCaseIndex: 0,
    reduceMotion: false,
  });
  const raf = useRef<number | null>(null);

  const tick = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const trackProgress = computeTrackProgress(el);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Phase boundaries (trackProgress):
    //   0.18..0.28  surface peel
    //   0.22..0.70  tunnelScroll 0→1 (WebGL camera + frontal wormhole)
    //   0.32..0.58  latent topology + exit plane build
    //   0.54..0.72  case dock from exit plane
    //   0.66..0.86  orbit fan-out then drift
    //   0.78..0.95  case orbit cycle index
    const surfaceReveal = smooth((trackProgress - 0.18) / 0.1);

    const tunnelScroll = clamp01((trackProgress - 0.22) / 0.48);

    const gatewayScale = lerp(1, 1.12, smooth(clamp01((trackProgress - 0.2) / 0.28)));
    const gatewayOpacity = lerp(1, 0, smooth((trackProgress - 0.64) / 0.12));
    const gatewayBlur = 0;

    const latentEmerge = smooth((trackProgress - 0.32) / 0.26);
    const exitPlane = smooth((trackProgress - 0.42) / 0.22);

    const caseEntry = smooth((trackProgress - 0.54) / 0.18);
    const orbitFanOut = smooth((trackProgress - 0.66) / 0.2);

    const orbitRange = 0.95 - 0.78;
    const rawOrbit = clamp01((trackProgress - 0.78) / orbitRange);
    const orbitCycle = reduceMotion ? rawOrbit * 0.25 : rawOrbit;
    const activeCaseIndex = reduceMotion
      ? Math.min(CASE_COUNT - 1, Math.floor(rawOrbit * CASE_COUNT))
      : Math.round(rawOrbit * (CASE_COUNT - 1)) % CASE_COUNT;

    setState({
      trackProgress,
      surfaceReveal,
      tunnelScroll,
      gatewayScale,
      gatewayOpacity,
      gatewayBlur,
      latentEmerge,
      exitPlane,
      caseEntry,
      orbitFanOut,
      orbitCycle,
      activeCaseIndex,
      reduceMotion,
    });
  }, [trackRef]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => tick();
    mq.addEventListener("change", onMq);

    const onScroll = () => {
      if (raf.current != null) return;
      raf.current = window.requestAnimationFrame(() => {
        raf.current = null;
        tick();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    tick();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onMq);
      if (raf.current != null) window.cancelAnimationFrame(raf.current);
    };
  }, [tick]);

  return state;
}
