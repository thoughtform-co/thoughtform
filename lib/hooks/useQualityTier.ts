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
 * The DOWN ladder is: DPR ceiling 1.75 → 1.25 → 1.0, THEN particle
 * multiplier 1.0 → 0.6 → 0.35. DPR steps are free (R3F reactive `dpr`);
 * the two count steps rebuild geometry once each and are gated behind
 * exhausting the DPR steps first, so they only ever fire on a device
 * genuinely struggling after the cheap levers are spent.
 *
 * RECOVERY (ADR-038 rev 2): the governor also climbs back UP one rung
 * when the smoothed frame time stays comfortably fast (below `FAST_MS`, a
 * wide deadband under `SLOW_MS`) for `RECOVER_SUSTAIN_MS`. So a capable
 * device that only tripped the governor on the heavy scroll-dive regains
 * full crispness once it settles into the calm parked state, instead of
 * staying degraded (and rendering the flagship wireframe at half
 * resolution) for the rest of the session. Recovery reverses the ladder
 * (counts back first, then DPR) and never exceeds the opening budget
 * (`maxDprCeiling` / `maxCountMultiplier`, seeded by the probe).
 * Anti-oscillation: recovery only fires from the wide fast deadband, on a
 * long streak, behind its own cooldown — and if a step-up proves
 * unsustainable (a degrade fires within `LOCK_WINDOW_MS` of it), that rung
 * is LOCKED (the recovery ceiling drops to the degraded value) so the
 * governor never retries it. At most one up→down flip per rung per
 * session; no perpetual thrash.
 *
 * Per-frame stats (EMA, slow/fast streaks, cooldown) live in module
 * scope, NOT store state: only an actual rung change calls `set()`, so
 * sampling is allocation- and re-render-free.
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

// ── Recovery constants (ADR-038 rev 2) ───────────────────────────
/** Smoothed frame time (ms) below which the corridor is "comfortably
 *  fast" — a WIDE deadband under SLOW_MS so a one-rung step-up (which can
 *  nearly double pixel work) can't immediately re-cross SLOW_MS. */
const FAST_MS = 14;
/** How long the smoothed frame time must stay fast before a step-up. */
const RECOVER_SUSTAIN_MS = 3000;
/** Quiet window after a step-up so its own resolution jump settles before
 *  the sampler judges the new rung. */
const RECOVER_COOLDOWN_MS = 2000;
/** A degrade within this window of a step-up is treated as caused by that
 *  step-up: the rung is locked so recovery never retries it. */
const LOCK_WINDOW_MS = 4000;

// ── Store ────────────────────────────────────────────────────────

export interface QualityState {
  /** Absolute drawing-buffer DPR ceiling. Consumers still clamp to their
   *  own tier max (mobile caps at 1.4). */
  dprCeiling: number;
  /** Multiplier applied to per-tier particle/point counts. */
  countMultiplier: number;
  /** Recovery ceilings — the governor never climbs above these. Seeded to
   *  the opening budget the probe granted, and lowered when a step-up is
   *  locked out (anti-oscillation). */
  maxDprCeiling: number;
  maxCountMultiplier: number;
  /** True once the one-shot renderer probe has run. */
  probed: boolean;
}

interface QualityStore extends QualityState {
  /** Advance one rung DOWN the ladder. No-op at the bottom. When
   *  `causedByRecovery`, the reached rung is locked as the new recovery
   *  ceiling so it is never climbed back to. */
  degrade: (causedByRecovery?: boolean) => void;
  /** Climb one rung UP the ladder (reverse order, clamped to the opening
   *  budget). Returns whether anything changed. */
  recover: () => boolean;
  /** Seed from the GPU-capability probe. Idempotent. */
  probe: () => void;
}

export const useQualityStore = create<QualityStore>((set, get) => ({
  dprCeiling: DPR_BASE_DESKTOP,
  countMultiplier: 1,
  maxDprCeiling: DPR_BASE_DESKTOP,
  maxCountMultiplier: 1,
  probed: false,
  degrade: (causedByRecovery = false) => {
    const { dprCeiling, countMultiplier } = get();
    const patch: Partial<QualityState> = {};
    if (dprCeiling > DPR_STEP_LOW) {
      patch.dprCeiling = dprCeiling > DPR_STEP_MID ? DPR_STEP_MID : DPR_STEP_LOW;
    } else if (countMultiplier > COUNT_STEP_MID) {
      patch.countMultiplier = COUNT_STEP_MID;
    } else if (countMultiplier > COUNT_STEP_LOW) {
      patch.countMultiplier = COUNT_STEP_LOW;
    } else {
      return; // at the bottom
    }
    // A degrade caused by a just-applied step-up means that rung is
    // unsustainable on this device: lock the recovery ceiling at the
    // degraded value so the governor never climbs back to it.
    if (causedByRecovery) {
      if (patch.dprCeiling !== undefined) patch.maxDprCeiling = patch.dprCeiling;
      if (patch.countMultiplier !== undefined) patch.maxCountMultiplier = patch.countMultiplier;
    }
    set(patch);
  },
  recover: () => {
    const { dprCeiling, countMultiplier, maxDprCeiling, maxCountMultiplier } = get();
    // Reverse of degrade (which lowers DPR first, then counts): recover
    // COUNTS first (0.35 → 0.6 → 1.0), THEN DPR (1.0 → 1.25 → 1.75), each
    // clamped to the opening budget the probe granted.
    if (countMultiplier < maxCountMultiplier) {
      const next = countMultiplier < COUNT_STEP_MID ? COUNT_STEP_MID : 1;
      set({ countMultiplier: Math.min(next, maxCountMultiplier) });
      return true;
    }
    if (dprCeiling < maxDprCeiling) {
      const next = dprCeiling < DPR_STEP_MID ? DPR_STEP_MID : DPR_BASE_DESKTOP;
      set({ dprCeiling: Math.min(next, maxDprCeiling) });
      return true;
    }
    return false;
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
      // 3D, open — and pin — at the floor (max == current → no recovery).
      set({
        probed: true,
        dprCeiling: DPR_STEP_LOW,
        countMultiplier: COUNT_STEP_LOW,
        maxDprCeiling: DPR_STEP_LOW,
        maxCountMultiplier: COUNT_STEP_LOW,
      });
    } else if (cls === "low") {
      // Open a couple rungs down; recovery may return here but no higher.
      set({
        probed: true,
        dprCeiling: DPR_STEP_MID,
        countMultiplier: COUNT_STEP_MID,
        maxDprCeiling: DPR_STEP_MID,
        maxCountMultiplier: COUNT_STEP_MID,
      });
    } else {
      set({ probed: true });
    }
  },
}));

// ── Per-frame sampler state (module scope, no re-render) ─────────

let ema = 0;
let slowSinceMs = 0;
let fastSinceMs = 0;
let cooldownUntilMs = 0;
// -Infinity = "no step-up yet", so `now - lastRecoverAtMs` is never inside
// LOCK_WINDOW_MS until a recovery actually happens (a 0 sentinel would
// wrongly flag the first degrade when the clock is still near zero).
let lastRecoverAtMs = -Infinity;

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** Arm the cooldown + clear streaks (called on engage and after each
 *  step-down). */
export function resetFrameSampler(): void {
  ema = 0;
  slowSinceMs = 0;
  fastSinceMs = 0;
  lastRecoverAtMs = -Infinity;
  cooldownUntilMs = nowMs() + COOLDOWN_MS;
}

/**
 * Feed one engaged frame's delta (seconds, from R3F `useFrame`). Cheap:
 * updates a module-scope EMA and only touches the store on an actual rung
 * change (down OR up).
 */
export function reportFrameSample(deltaSeconds: number): void {
  if (isAutomated()) return;
  const now = nowMs();
  const dtMs = deltaSeconds * 1000;
  // Ignore absurd deltas (tab was backgrounded / debugger paused).
  if (dtMs <= 0 || dtMs > 200) return;
  ema = ema === 0 ? dtMs : ema * (1 - EMA_ALPHA) + dtMs * EMA_ALPHA;
  if (now < cooldownUntilMs) return;

  if (ema > SLOW_MS) {
    // Sustained slow → step DOWN. If this follows a recent step-up, that
    // rung is unsustainable: degrade() locks it out of future recovery.
    fastSinceMs = 0;
    if (slowSinceMs === 0) slowSinceMs = now;
    else if (now - slowSinceMs >= SUSTAIN_MS) {
      useQualityStore.getState().degrade(now - lastRecoverAtMs < LOCK_WINDOW_MS);
      resetFrameSampler();
    }
  } else if (ema < FAST_MS) {
    // Sustained comfortably-fast → step UP one rung (if there is headroom
    // left under the opening budget).
    slowSinceMs = 0;
    if (fastSinceMs === 0) fastSinceMs = now;
    else if (now - fastSinceMs >= RECOVER_SUSTAIN_MS) {
      if (useQualityStore.getState().recover()) {
        lastRecoverAtMs = now;
        ema = 0;
        slowSinceMs = 0;
        fastSinceMs = 0;
        cooldownUntilMs = now + RECOVER_COOLDOWN_MS;
      } else {
        fastSinceMs = 0; // already at the opening budget — stop counting
      }
    }
  } else {
    // Deadband [FAST_MS, SLOW_MS]: hold the current rung.
    slowSinceMs = 0;
    fastSinceMs = 0;
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

/** Reactive governor snapshot (consumer-facing fields; the recovery
 *  ceilings are internal bookkeeping and deliberately not exposed). */
export function useQualityTier(): Pick<
  QualityState,
  "dprCeiling" | "countMultiplier" | "probed"
> {
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
