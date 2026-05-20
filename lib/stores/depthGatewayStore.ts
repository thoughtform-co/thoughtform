/**
 * depthGatewayStore — single transform channel for the home-v2
 * depth-gateway scene.
 *
 * Mirrors the pattern of `brandmarkJourneyStore`: a single Zustand
 * store holds the current depth-scroll state, the rAF scroll hook
 * writes it once per frame, and the R3F painters read it
 * imperatively inside their own `useFrame` loops so the per-frame
 * cost stays at uniform writes only (no React re-renders).
 *
 * One global progress value drives three chambers laid out along
 * `-Z` in scene space (Definition / Diagnostic / Intelligence).
 * Per-chamber progress is derived from the global value so painters
 * can branch their own envelopes without rewriting the source of
 * truth.
 *
 * Scope is local to `/test/home-v2` — the production landing page
 * does not import this store.
 */

import { create } from "zustand";

export type ChamberId = "definition" | "diagnostic" | "intelligence";

export interface DepthGatewayTransform {
  /** Global 0..1 progress across all three chambers. */
  progress: number;
  /** Current dominant chamber for HUD / label gating. */
  chamberId: ChamberId;
  /** Per-chamber local progress in 0..1, clamped. */
  chamberA: number;
  chamberB: number;
  chamberC: number;
  /** True while the sticky stage is engaged with the viewport. Used
   *  to pause work when the scene is offscreen. */
  active: boolean;
}

export const INITIAL_TRANSFORM: DepthGatewayTransform = {
  progress: 0,
  chamberId: "definition",
  chamberA: 0,
  chamberB: 0,
  chamberC: 0,
  active: false,
};

interface DepthGatewayState {
  transform: DepthGatewayTransform;
  setTransform: (next: DepthGatewayTransform) => void;
  reset: () => void;
}

export const useDepthGatewayStore = create<DepthGatewayState>((set) => ({
  transform: INITIAL_TRANSFORM,
  setTransform: (next) =>
    set((state) => (transformEquals(state.transform, next) ? state : { transform: next })),
  reset: () =>
    set((state) =>
      transformEquals(state.transform, INITIAL_TRANSFORM) ? state : { transform: INITIAL_TRANSFORM }
    ),
}));

function transformEquals(a: DepthGatewayTransform, b: DepthGatewayTransform): boolean {
  return (
    a.progress === b.progress &&
    a.chamberId === b.chamberId &&
    a.chamberA === b.chamberA &&
    a.chamberB === b.chamberB &&
    a.chamberC === b.chamberC &&
    a.active === b.active
  );
}

/**
 * Derive per-chamber local progress from the global 0..1 value.
 * Three equal bands at [0, 1/3], [1/3, 2/3], [2/3, 1]. Each result
 * is clamped to [0, 1].
 */
export function deriveChambers(progress: number): {
  chamberA: number;
  chamberB: number;
  chamberC: number;
  chamberId: ChamberId;
} {
  const a = clamp01((progress - 0) / (1 / 3));
  const b = clamp01((progress - 1 / 3) / (1 / 3));
  const c = clamp01((progress - 2 / 3) / (1 / 3));
  let chamberId: ChamberId = "definition";
  if (progress >= 2 / 3) chamberId = "intelligence";
  else if (progress >= 1 / 3) chamberId = "diagnostic";
  return { chamberA: a, chamberB: b, chamberC: c, chamberId };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
