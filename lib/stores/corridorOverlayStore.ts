/**
 * corridorOverlayStore — armed state for the Arc's diegetic detail
 * overlays (ADR-032 Update 1).
 *
 * Mirrors the `gyroLabStore` pattern: a tiny Zustand store read
 * imperatively inside the world-DOM tracker's onPaint hooks + position
 * resolvers (sceneGeom.ts), and via React selectors in `CopyAnchors`
 * (drives `aria-expanded` / `.is-armed`) and `CorridorProgressRail` (the
 * rail toggle). The rail "DETAIL" toggle ARMS overlay mode; while armed,
 * the Encode cardinals and the Build "Web app" surface chip become
 * clickable and bloom their detail (skills / tools). One Encode cluster
 * is expanded at a time.
 *
 * Nothing here writes scroll state — the depth store is never touched.
 * Auto-collapse (stage-band exit / epilogue / disengage) is decided by
 * `resolveOverlayAuto` in `lib/home-v2/corridorReveals.ts` and applied
 * from `CorridorProgressRail`'s existing rAF.
 *
 * Import ONLY via the `@/lib/stores/corridorOverlayStore` alias
 * everywhere (never a relative path from one consumer and the alias from
 * another) so the module stays a single instance — the turbopack-dev
 * store-split discipline noted in ADR-032.
 */

import { create } from "zustand";

import type { SkillCardinal } from "@/components/landing/home-v2/reveals/revealData";

interface CorridorOverlayState {
  /** Overlay mode armed (the rail toggle). Persists across Encode↔Build
   *  while the corridor is engaged. */
  armed: boolean;
  /** Which Encode cardinal's skill cluster is open (one at a time). */
  expandedCardinal: SkillCardinal | null;
  /** Whether the Build tool cascade (off the Web app chip) is open. */
  expandedSurface: boolean;
  /** Toggle overlay mode. Disarming also collapses everything. */
  toggleArmed: () => void;
  /** Expand a cardinal's cluster (same → close, other → switch).
   *  No-op while unarmed. */
  toggleCardinal: (cardinal: SkillCardinal) => void;
  /** Toggle the Build tool cascade. No-op while unarmed. */
  toggleSurface: () => void;
  /** Collapse the currently-expanded detail (stage-band exit). Leaves
   *  `armed` intact. */
  collapseExpanded: () => void;
  /** Full reset — corridor disengaged / epilogue. */
  reset: () => void;
}

export const useCorridorOverlayStore = create<CorridorOverlayState>((set) => ({
  armed: false,
  expandedCardinal: null,
  expandedSurface: false,
  toggleArmed: () =>
    set((s) =>
      s.armed ? { armed: false, expandedCardinal: null, expandedSurface: false } : { armed: true }
    ),
  toggleCardinal: (cardinal) =>
    set((s) =>
      !s.armed
        ? s
        : {
            expandedCardinal: s.expandedCardinal === cardinal ? null : cardinal,
            expandedSurface: false,
          }
    ),
  toggleSurface: () =>
    set((s) => (!s.armed ? s : { expandedSurface: !s.expandedSurface, expandedCardinal: null })),
  collapseExpanded: () => set({ expandedCardinal: null, expandedSurface: false }),
  reset: () => set({ armed: false, expandedCardinal: null, expandedSurface: false }),
}));
