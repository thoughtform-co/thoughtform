/**
 * corridorReveals — pure kernel for the Arc's diegetic detail overlays
 * (ADR-032 + Update 1). No DOM, no React: just the band math the rail
 * toggle rAF (`CorridorProgressRail`) reads, so it is unit-testable.
 *
 * The stage fade bands ride the EXACT SAME windows as each stage's station
 * header — defined HERE and imported back by `CorridorStationHeaders`
 * (single source of truth) — do not fork the values. The overlay toggle
 * arrives/leaves in lockstep via `overlayToggleOpacity`; the armed
 * overlays auto-collapse via `resolveOverlayAuto`.
 *
 * Everything is a pure read of `paintProgress` + `epilogueProgress`; there
 * are no scroll writers here (corridor canon — overlays never drive scroll).
 */

import { epilogueBand } from "./epilogueTimeline";

export type RevealStageKey = "navigate" | "encode" | "build";

// ── Scroll-scrubbed opacity bands ─────────────────────────────────────
// Single source of truth for BOTH the station headers and the reveal
// chips. Tied to `CORRIDOR_TIMELINE.accretion` (substrate/orbits/stack
// starts). Beat reference: navigate park ~0.40, diagnostic/Encode park
// ~0.636, intelligence/Build park ~0.923.
export const NAVIGATE_FADE_IN: [number, number] = [0.3, 0.42];
export const NAVIGATE_FADE_OUT: [number, number] = [0.47, 0.54];
export const ENCODE_FADE_IN: [number, number] = [0.54, 0.62];
export const ENCODE_FADE_OUT: [number, number] = [0.76, 0.83];
export const BUILD_FADE_IN: [number, number] = [0.84, 0.91];

/** Band opacity below which the reveal panel force-closes and the chip
 *  slot goes inert. Mirrors `TYPER_REARM_OPACITY` in
 *  `CorridorStationHeaders` so panel and copy re-arm on the same
 *  hysteresis and band-edge jitter never flaps the panel open/closed. */
export const REVEAL_REARM = 0.04;

/** Below this the chip is treated as fully gone (slot → null / inert). A
 *  hair above 0 so the chip fades to nothing before the slot detaches. */
const DISPLAY_EPSILON = 1e-3;

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

/** Opacity of a single stage's chip at the given progress. Build is
 *  additionally multiplied by `1 - BUILD_OUT` so the chip leaves with the
 *  Build chapter as the epilogue's "billions" title claims the frame —
 *  identical to how the Build station header + caption exit. */
export function stageBandOpacity(
  stage: RevealStageKey,
  paintProgress: number,
  epilogueProgress: number
): number {
  switch (stage) {
    case "navigate":
      return bandOpacity(paintProgress, NAVIGATE_FADE_IN, NAVIGATE_FADE_OUT);
    case "encode":
      return bandOpacity(paintProgress, ENCODE_FADE_IN, ENCODE_FADE_OUT);
    case "build": {
      const buildOut = epilogueBand(epilogueProgress, "BUILD_OUT");
      return bandOpacity(paintProgress, BUILD_FADE_IN) * Math.max(0, 1 - buildOut);
    }
  }
}

export interface RevealResolution {
  /** The dominant stage (highest band opacity), or null when nothing is
   *  shown (not engaged, or all bands ~0 in a travel leg / epilogue). */
  stage: RevealStageKey | null;
  /** The dominant stage's chip opacity (0 when `stage` is null). */
  opacity: number;
}

const STAGE_ORDER: readonly RevealStageKey[] = ["navigate", "encode", "build"];

/** Resolve which stage's chip is shown and at what opacity. Argmax over
 *  the three bands so the chip hands off cleanly from one stage to the
 *  next; null while disengaged or between stages. */
export function resolveRevealStage(
  paintProgress: number,
  epilogueProgress: number,
  engaged: boolean
): RevealResolution {
  if (!engaged) return { stage: null, opacity: 0 };
  let stage: RevealStageKey | null = null;
  let opacity = 0;
  for (const key of STAGE_ORDER) {
    const op = stageBandOpacity(key, paintProgress, epilogueProgress);
    if (op > opacity) {
      opacity = op;
      stage = key;
    }
  }
  if (opacity <= DISPLAY_EPSILON) return { stage: null, opacity: 0 };
  return { stage, opacity };
}

/** Opacity of the rail "DETAIL" toggle. Visible continuously from the
 *  Encode band's arrival through the Build chapter (Encode fade-in ×
 *  (1 − BUILD_OUT)) — no blink in the Encode→Build travel gap the argmax
 *  chip would dip through — and hidden through Navigate (parked stage). */
export function overlayToggleOpacity(
  paintProgress: number,
  epilogueProgress: number,
  engaged: boolean
): number {
  if (!engaged) return 0;
  const inOp = smoothstep(ENCODE_FADE_IN[0], ENCODE_FADE_IN[1], paintProgress);
  const buildOut = epilogueBand(epilogueProgress, "BUILD_OUT");
  return inOp * Math.max(0, 1 - buildOut);
}

export interface OverlayAutoAction {
  collapseCardinal: boolean;
  collapseSurface: boolean;
  reset: boolean;
}

/** Auto-collapse decision for the armed overlays, evaluated each frame.
 *  An expanded Encode cluster collapses once the Encode band drops below
 *  the re-arm floor (scrolled out of the stage); the Build cascade
 *  collapses once the Build band drops; both collapse (and everything
 *  resets) on epilogue start or corridor disengage. Same hysteresis the
 *  v1 `shouldForceClose` used — the semantics live on here. */
export function resolveOverlayAuto(
  hasCardinal: boolean,
  hasSurface: boolean,
  paintProgress: number,
  epilogueProgress: number,
  engaged: boolean
): OverlayAutoAction {
  if (!engaged) {
    return { collapseCardinal: hasCardinal, collapseSurface: hasSurface, reset: true };
  }
  const epi = epilogueProgress > 0.001;
  return {
    collapseCardinal:
      hasCardinal &&
      (epi || stageBandOpacity("encode", paintProgress, epilogueProgress) < REVEAL_REARM),
    collapseSurface:
      hasSurface &&
      (epi || stageBandOpacity("build", paintProgress, epilogueProgress) < REVEAL_REARM),
    reset: false,
  };
}
