/**
 * brandmarkJourneyStore — single transform channel for the v7
 * brandmark journey.
 *
 * One `BrandmarkTransform` lives in the store at any moment. The
 * journey hook (`useBrandmarkJourney`) writes it every rAF scroll
 * frame; the global painter (`BrandmarkParticleStation`) and the
 * R3F orbit field (`OrbitField`) both read it imperatively
 * via `getState()` inside their own `useFrame` loops.
 *
 * Why a store and not direct props: the painter mounts once at the
 * v7 root, the R3F scene mounts inside the intelligence-layer
 * portal, and the journey hook fires every scroll frame. Threading
 * the transform through React state on every frame would re-render
 * the entire subtree. A Zustand store with imperative `getState()`
 * reads keeps the per-frame cost at uniform writes only.
 *
 * Replaces the older `brandmarkParticleStore` per-station snapshot
 * map. The single-transform model is the contract: no per-station
 * snapshots, no HARD SWAPs, no painter handoffs (ADR-013).
 *
 * The `mode` flag is retained as the global switch:
 *
 *   - `"particle"` — the global canvas mounts; journey hook writes
 *     transforms; CSS hides the SVG actor + portal'd dock glyphs.
 *   - `"svg"` — the global canvas does not mount; journey hook
 *     writes nothing; the existing SVG actor + portal'd glyphs paint
 *     unchanged via the legacy choreography path (used when WebGL is
 *     unavailable or `prefers-reduced-motion: reduce` is set).
 */

import { create } from "zustand";
import { HIDDEN_TRANSFORM, type BrandmarkTransform } from "@/lib/brandmark/journey";

export type BrandmarkRenderMode = "particle" | "svg";

interface BrandmarkJourneyState {
  /** Render mode, set once at journey hook init. */
  mode: BrandmarkRenderMode;
  /** Current transform. Always defined (starts at HIDDEN_TRANSFORM). */
  transform: BrandmarkTransform;
  setMode: (mode: BrandmarkRenderMode) => void;
  setTransform: (transform: BrandmarkTransform) => void;
  /** Reset to hidden (used on hook cleanup / HMR). */
  reset: () => void;
}

export const useBrandmarkJourneyStore = create<BrandmarkJourneyState>((set) => ({
  mode: "svg",
  transform: HIDDEN_TRANSFORM,
  setMode: (mode) => set((state) => (state.mode === mode ? state : { mode })),
  setTransform: (transform) =>
    set((state) => (state.transform === transform ? state : { transform })),
  reset: () =>
    set((state) =>
      state.transform === HIDDEN_TRANSFORM ? state : { transform: HIDDEN_TRANSFORM }
    ),
}));

/** Thoughtform gold (`--gold` = #CAA554) — the brandmark cloud's
 *  default tint, applied at the painter's shader uniform. Re-exported
 *  here so painters don't need to import from the (eventually
 *  retired) particle store. */
export const DEFAULT_TINT: [number, number, number] = [202 / 255, 165 / 255, 84 / 255];
