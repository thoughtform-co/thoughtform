/**
 * corridorReveals — pure kernel for the Arc's per-stage reveal consoles
 * (ADR-032). No DOM, no React: just the band math the `CorridorRevealLayer`
 * rAF loop reads, so it is unit-testable in isolation.
 *
 * The reveal chip for each Arc stage (Navigate / Encode / Build) rides the
 * EXACT SAME opacity bands as that stage's station header, so the chip
 * arrives and leaves in lockstep with the copy. Those fade bands are
 * defined HERE and imported back by `CorridorStationHeaders` (single source
 * of truth) — do not fork the values.
 *
 * Everything is a pure read of `paintProgress` + `epilogueProgress`; there
 * are no scroll writers here (corridor canon — the reveal layer never
 * drives scroll).
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

/** Whether an open panel should be force-closed this frame. Fires when the
 *  corridor disengages, the epilogue begins, or the open stage's band has
 *  dropped below the re-arm floor (the user has scrolled out of the
 *  stage). This IS the scroll-away dismissal — there is no scroll lock. */
export function shouldForceClose(
  openStage: RevealStageKey | null,
  paintProgress: number,
  epilogueProgress: number,
  engaged: boolean
): boolean {
  if (!openStage) return false;
  if (!engaged) return true;
  if (epilogueProgress > 0.001) return true;
  return stageBandOpacity(openStage, paintProgress, epilogueProgress) < REVEAL_REARM;
}
