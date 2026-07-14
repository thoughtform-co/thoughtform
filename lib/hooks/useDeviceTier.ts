"use client";

import { useSyncExternalStore } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { classifyRenderer } from "@/lib/webgl/rendererClass";

/**
 * lib/hooks/useDeviceTier — single source of truth for the home-v2
 * depth-corridor device tiering + capability gate (ADR-018 mobile
 * revision).
 *
 * Two concerns live here so the corridor agrees with itself:
 *
 *   1. `getDeviceTier(width)` / `useDeviceTier()` — the `mobile /
 *      tablet / desktop` split used for per-frame budgets (dpr,
 *      antialias, particle counts). Encodes the `<760 / <1280`
 *      thresholds ONCE.
 *
 *   2. `corridorCapable()` — replaces the old blanket `window.innerWidth
 *      < 760` block in `HomeCorridor`. Capable phones run the real 3D
 *      corridor; only genuinely incapable devices (no WebGL, or very
 *      low-end) fall back to the static text corridor.
 *
 * `isMobileComposition()` is a cheap, cached read for the per-frame
 * world-anchor resolvers in `sceneGeom.ts` — those run every rAF and
 * MUST NOT touch layout, so a single resize listener caches the flag.
 */

export type DeviceTier = "mobile" | "tablet" | "desktop";

/** Below this width is the `mobile` tier. Matches the per-layer
 *  `pickCount` thresholds already in the `DepthGatewayScene/` layers. */
export const MOBILE_MAX_WIDTH = 760;
/** Below this width (and >= mobile) is the `tablet` tier. */
export const TABLET_MAX_WIDTH = 1280;

/** Pure width → tier. Safe on the server (callers pass a width). */
export function getDeviceTier(width: number): DeviceTier {
  if (width < MOBILE_MAX_WIDTH) return "mobile";
  if (width < TABLET_MAX_WIDTH) return "tablet";
  return "desktop";
}

// ── Cached mobile-composition flag (per-frame safe) ──────────────

let _viewportListenerInstalled = false;
let _isMobileComposition = false;

function readMobileComposition(): boolean {
  if (typeof window === "undefined") return false;
  return getDeviceTier(window.innerWidth) === "mobile";
}

/** Whether the corridor should use its stacked, centred "mobile"
 *  composition (copy above the mark) rather than the desktop two-
 *  column layout. Cached behind a single resize/orientation listener
 *  so the per-frame `COPY_ANCHORS` resolvers can read it for free. */
export function isMobileComposition(): boolean {
  if (typeof window === "undefined") return false;
  if (!_viewportListenerInstalled) {
    _viewportListenerInstalled = true;
    _isMobileComposition = readMobileComposition();
    const sync = () => {
      _isMobileComposition = readMobileComposition();
    };
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
  }
  return _isMobileComposition;
}

// ── Capability gate ──────────────────────────────────────────────

interface NavigatorWithCaps extends Navigator {
  /** Approximate device RAM in GiB (Chromium only). */
  deviceMemory?: number;
}

/** Whether this device should run the full 3D corridor. Replaces the
 *  blanket `<760px` phone block: capable unless WebGL is unavailable
 *  or the device is genuinely low-end (≤2 cores AND ≤2 GiB RAM, or a
 *  touch device narrower than 360px). Conservative — unknown values
 *  are treated as capable so we don't strand mid-range phones. */
export function corridorCapable(): boolean {
  if (typeof window === "undefined") return false;
  if (!probeWebGL()) return false;
  // Software rasterizer (SwiftShader / llvmpipe / Microsoft Basic Render):
  // a 2-canvas 3D corridor on the CPU is guaranteed jank — route to the
  // static text fallback. (Phase 4 GPU-capability probe, ADR-038.)
  // EXCEPT under automation: headless test browsers render WebGL via
  // SwiftShader, and the corridor smokes must still exercise the real 3D
  // corridor rather than the fallback. `navigator.webdriver` is never set
  // for a real visitor, so this carve-out cannot affect production.
  const automated = (navigator as Navigator).webdriver === true;
  if (!automated && classifyRenderer() === "software") return false;
  const nav = navigator as NavigatorWithCaps;
  const cores = nav.hardwareConcurrency ?? 8;
  const mem = nav.deviceMemory ?? 8;
  if (cores <= 2 && mem <= 2) return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (coarse && window.innerWidth < 360) return false;
  return true;
}

// ── React hook ───────────────────────────────────────────────────

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  window.addEventListener("orientationchange", callback);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("orientationchange", callback);
  };
}

function getSnapshot(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  return getDeviceTier(window.innerWidth);
}

function getServerSnapshot(): DeviceTier {
  return "desktop";
}

/** Reactive device tier. SSR-safe via `useSyncExternalStore` (same
 *  pattern as `useMediaQuery`). */
export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
