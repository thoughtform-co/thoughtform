/**
 * brandmarkParticleStore — per-station snapshot bus for the v7
 * landing-page brandmark particle artifact.
 *
 * The store is the seam between two systems that need to stay
 * decoupled:
 *
 *   - `useSigilChoreography` (the scroll-driven journey state machine)
 *     writes a per-frame snapshot for each station that should be
 *     painting via particles.
 *   - `BrandmarkParticleCanvas` / `BrandmarkParticleStation` reads
 *     those snapshots inside `useFrame` and projects them into the
 *     shared R3F canvas.
 *
 * Why a store and not direct props: the canvas mounts once for the
 * whole page and the choreography hook fires every scroll frame; if we
 * threaded snapshots through React state on every frame the entire
 * subtree would re-render. A Zustand store with imperative
 * `getState()` reads in `useFrame` keeps the per-frame update cost at
 * a few uniform writes.
 *
 * The `mode` flag is the global switch:
 *   - `"particle"` — the canvas mounts, choreography writes snapshots,
 *     CSS hides the SVG actor at any station painting via particles.
 *   - `"svg"` — the canvas does not mount, choreography skips store
 *     writes, the existing SVG actor + portal'd glyphs paint
 *     unchanged. Used when `prefers-reduced-motion: reduce` is set or
 *     when WebGL context creation fails.
 *
 * Phase A (the current implementation) only ever writes to the
 * `backdrop` station. The store is built for all five stations so
 * Phases B and C can add them without a schema change.
 *
 * See ADR-011 for the full architecture.
 */

import { create } from "zustand";

export type StationKind = "sigil" | "miss" | "backdrop" | "rail" | "orbit";

export const ALL_STATION_KINDS: readonly StationKind[] = [
  "sigil",
  "miss",
  "backdrop",
  "rail",
  "orbit",
];

export interface StationSnapshot {
  /** Target rect in viewport (client) pixel coords. */
  rect: { left: number; top: number; width: number; height: number };
  /** Per-station opacity envelope `[0, 1]`. Multiplies per-particle alpha. */
  opacity: number;
  /** Density factor `[0, 1]`. `1` = paint all particles (full mark);
   *  `~0.2` = sparse diagnostic backdrop. */
  density: number;
  /** Wander strength `[0, 1]`. `0` = particles snap to home positions
   *  (tight mark); `~0.5` = organic drift outside the outline. */
  dispersion: number;
  /** RGB colour, each channel `[0, 1]`. Defaults to Thoughtform gold. */
  tint: [number, number, number];
}

interface BrandmarkParticleState {
  mode: "particle" | "svg";
  stations: Partial<Record<StationKind, StationSnapshot>>;
  setMode: (m: "particle" | "svg") => void;
  setStation: (kind: StationKind, snap: StationSnapshot | null) => void;
  clearStations: () => void;
}

export const useBrandmarkParticleStore = create<BrandmarkParticleState>((set) => ({
  mode: "svg",
  stations: {},
  setMode: (m) => set({ mode: m }),
  setStation: (kind, snap) =>
    set((state) => {
      const next = { ...state.stations };
      if (snap == null) {
        if (!(kind in next)) return state;
        delete next[kind];
      } else {
        next[kind] = snap;
      }
      return { stations: next };
    }),
  clearStations: () =>
    set((state) => (Object.keys(state.stations).length === 0 ? state : { stations: {} })),
}));

/** Default tint: Thoughtform gold (`--gold` = #CAA554). */
export const DEFAULT_TINT: [number, number, number] = [202 / 255, 165 / 255, 84 / 255];

/** Default tint: dawn (`--dawn` = #ECE3D6) — for the orbit pin during
 *  the practice quote-cover state. */
export const DAWN_TINT: [number, number, number] = [236 / 255, 227 / 255, 214 / 255];
