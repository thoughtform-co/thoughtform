"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { classifyRenderer } from "@/lib/webgl/rendererClass";
import { getDeviceTier, type DeviceTier } from "@/lib/hooks/useDeviceTier";

/**
 * lib/hooks/useQualityTier — the corridor's runtime quality governor
 * (Phase 4 device-hardening; see ADR-038).
 *
 * The width tier (`useDeviceTier`) sets the STARTING budget; this layer
 * adapts it to the device's ACTUAL capability and live frame rate. It
 * never touches the mount gate (`corridorCapable()` still decides 3D vs
 * static) — it only tunes the budget of a corridor that is already
 * running.
 *
 * Two inputs, one monotonic ladder:
 *
 *   1. GPU-capability probe (once): `classifyRenderer()` reads the
 *      unmasked renderer. Software rasterizers are already routed to the
 *      static fallback by `corridorCapable()`; a weak-but-real GPU
 *      ("low") opens the governor a couple of rungs down so it doesn't
 *      have to discover its limits through dropped frames.
 *
 *   2. Rolling frame time (while engaged): a single early `useFrame`
 *      sampler (`<QualityGovernor/>`) feeds `reportFrameSample()`. When
 *      the smoothed frame time stays above `SLOW_MS` for `SUSTAIN_MS`,
 *      the governor steps DOWN one rung and arms a cooldown so the
 *      rebuild/DPR-change spike doesn't cascade.
 *
 * The ladder is: DPR ceiling 1.75 → 1.25 → 1.0, THEN particle multiplier
 * 1.0 → 0.6 → 0.35. It is MONOTONIC — the governor never steps up
 * mid-session (no oscillation, no thrash). DPR steps are free (R3F
 * reactive `dpr`); the two count steps rebuild geometry once each and are
 * gated behind exhausting the DPR steps first, so they only ever fire on
 * a device that is genuinely struggling after the cheap levers are spent.
 *
 * Per-frame stats (EMA, slow-streak, cooldown) live in module scope, NOT
 * store state: only an actual rung change calls `set()`, so sampling is
 * allocation- and re-render-free.
 */

// ── Ladder constants ─────────────────────────────────────────────

/** Smoothed frame time (ms) above which the corridor is "slow". 24ms ≈
 *  below ~42fps sustained. */
const SLOW_MS = 24;
/** How long the smoothed frame time must stay slow before a step-down. */
const SUSTAIN_MS = 1200;
/** Quiet window after a step-down (and after engage) so the change's own
 *  frame spike + warm-up don't trigger a cascade. */
const COOLDOWN_MS = 1500;
/** EMA smoothing factor for frame time (higher = more responsive). */
const EMA_ALPHA = 0.1;

/** Headless/automated browsers render WebGL via SwiftShader, so their
 *  frame times are software-slow and their renderer classifies as
 *  "software". Under automation the governor is a NO-OP (full budget, no
 *  sampling) so the corridor smokes exercise the real 3D corridor
 *  deterministically. `navigator.webdriver` is never set for a real
 *  visitor, so this never affects production. */
function isAutomated(): boolean {
  return typeof navigator !== "undefined" && (navigator as Navigator).webdriver === true;
}

const DPR_BASE_DESKTOP = 1.75;
const DPR_STEP_MID = 1.25;
const DPR_STEP_LOW = 1.0;
const COUNT_STEP_MID = 0.6;
const COUNT_STEP_LOW = 0.35;

// ── Store ────────────────────────────────────────────────────────

export interface QualityState {
  /** Absolute drawing-buffer DPR ceiling. Consumers still clamp to their
   *  own tier max (mobile caps at 1.4). */
  dprCeiling: number;
  /** Multiplier applied to per-tier particle/point counts. */
  countMultiplier: number;
  /** True once the one-shot renderer probe has run. */
  probed: boolean;
}

interface QualityStore extends QualityState {
  /** Advance one rung down the degradation ladder. No-op at the bottom. */
  degrade: () => void;
  /** Seed from the GPU-capability probe. Idempotent. */
  probe: () => void;
}

export const useQualityStore = create<QualityStore>((set, get) => ({
  dprCeiling: DPR_BASE_DESKTOP,
  countMultiplier: 1,
  probed: false,
  degrade: () => {
    const { dprCeiling, countMultiplier } = get();
    if (dprCeiling > DPR_STEP_LOW) {
      set({ dprCeiling: dprCeiling > DPR_STEP_MID ? DPR_STEP_MID : DPR_STEP_LOW });
    } else if (countMultiplier > COUNT_STEP_MID) {
      set({ countMultiplier: COUNT_STEP_MID });
    } else if (countMultiplier > COUNT_STEP_LOW) {
      set({ countMultiplier: COUNT_STEP_LOW });
    }
  },
  probe: () => {
    if (get().probed) return;
    if (isAutomated()) {
      set({ probed: true });
      return;
    }
    const cls = classifyRenderer();
    if (cls === "software") {
      // Should already be on the static fallback, but if it ever runs
      // 3D, open at the floor.
      set({ probed: true, dprCeiling: DPR_STEP_LOW, countMultiplier: COUNT_STEP_LOW });
    } else if (cls === "low") {
      set({ probed: true, dprCeiling: DPR_STEP_MID, countMultiplier: COUNT_STEP_MID });
    } else {
      set({ probed: true });
    }
  },
}));

// ── Per-frame sampler state (module scope, no re-render) ─────────

let ema = 0;
let slowSinceMs = 0;
let cooldownUntilMs = 0;

/** Arm the cooldown (called on engage and after each step-down). */
export function resetFrameSampler(): void {
  ema = 0;
  slowSinceMs = 0;
  cooldownUntilMs =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) + COOLDOWN_MS;
}

/**
 * Feed one engaged frame's delta (seconds, from R3F `useFrame`). Cheap:
 * updates a module-scope EMA and only touches the store on an actual
 * step-down.
 */
export function reportFrameSample(deltaSeconds: number): void {
  if (isAutomated()) return;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const dtMs = deltaSeconds * 1000;
  // Ignore absurd deltas (tab was backgrounded / debugger paused).
  if (dtMs <= 0 || dtMs > 200) return;
  ema = ema === 0 ? dtMs : ema * (1 - EMA_ALPHA) + dtMs * EMA_ALPHA;
  if (now < cooldownUntilMs) return;
  if (ema > SLOW_MS) {
    if (slowSinceMs === 0) slowSinceMs = now;
    else if (now - slowSinceMs >= SUSTAIN_MS) {
      useQualityStore.getState().degrade();
      resetFrameSampler();
    }
  } else {
    slowSinceMs = 0;
  }
}

// ── Non-reactive getters (per-frame / build-time safe) ───────────

export function getCountMultiplier(): number {
  return useQualityStore.getState().countMultiplier;
}

/** Effective DPR ceiling for a tier (mobile caps at 1.4 regardless). */
export function effectiveDprCeiling(tier: DeviceTier, dprCeiling: number): number {
  return tier === "mobile" ? Math.min(1.4, dprCeiling) : dprCeiling;
}

// ── React hooks ──────────────────────────────────────────────────

/** Reactive governor snapshot. */
export function useQualityTier(): QualityState {
  return useQualityStore((s) => ({
    dprCeiling: s.dprCeiling,
    countMultiplier: s.countMultiplier,
    probed: s.probed,
  }));
}

/** Reactive DPR ceiling only (for the Canvas `dpr` prop). */
export function useDprCeiling(): number {
  return useQualityStore((s) => s.dprCeiling);
}

/**
 * Corridor particle/point count for the live tier and quality multiplier.
 * Drop-in for the per-painter `pickCount(desktop, tablet, mobile)`
 * pattern: at full quality (`countMultiplier === 1`) it returns the exact
 * per-tier value, so desktop is byte-identical. Re-renders (and rebuilds
 * the consuming geometry `useMemo`) only when the multiplier steps.
 */
export function useCorridorCount(desktop: number, tablet: number, mobile: number): number {
  const multiplier = useQualityStore((s) => s.countMultiplier);
  const tier = useSyncExternalStore(subscribeWidth, getWidthTier, getServerTier);
  const base = tier === "mobile" ? mobile : tier === "tablet" ? tablet : desktop;
  return Math.max(1, Math.round(base * multiplier));
}

// Local width-tier subscription (mirrors useDeviceTier without importing
// its hook, so this module stays usable outside a component that already
// calls useDeviceTier).
function subscribeWidth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  window.addEventListener("orientationchange", callback);
  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("orientationchange", callback);
  };
}
function getWidthTier(): DeviceTier {
  if (typeof window === "undefined") return "desktop";
  return getDeviceTier(window.innerWidth);
}
function getServerTier(): DeviceTier {
  return "desktop";
}
