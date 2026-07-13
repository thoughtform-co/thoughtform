/**
 * arcCasesStore — UI state for the Arc Cases Orbit (ADR-033).
 *
 * LOW-FREQUENCY state only (button clicks): `armed` + the cumulative
 * `caseIndex`. Per-frame scalars (the damped arm level) cross the R3F/DOM
 * seam through `lib/arc-cases/arcCasesLevelRef.ts` instead — zustand
 * subscriber churn is wrong for once-per-WebGL-frame values (the
 * `ringProgressRef` precedent).
 *
 * Writers: `ArcCasesCta` (toggle + auto-disarm watcher) and
 * `ArcCasesHitAreas` (stepToCase). Readers: `ArcCasesRing` (inside
 * useFrame via getState — no subscription), the CTA label, the hit layer.
 */

import { create } from "zustand";
import { caseSlot, shortestCaseDelta } from "@/lib/arc-cases/orbitMath";

interface ArcCasesState {
  /** True while the visitor has the orbit open at the Build park. */
  armed: boolean;
  /** CUMULATIVE ring index — never wrapped; front slot = mod 4
   *  (`caseSlot`). Stepping adds the shortest signed delta so the ring
   *  always takes the short way round. */
  caseIndex: number;
  arm: () => void;
  disarm: () => void;
  toggle: () => void;
  /** Rotate the ring so `slot` (0..3) faces the camera. */
  stepToCase: (slot: number) => void;
}

export const useArcCasesStore = create<ArcCasesState>((set) => ({
  armed: false,
  caseIndex: 0,
  arm: () => set({ armed: true }),
  disarm: () => set({ armed: false }),
  toggle: () => set((s) => ({ armed: !s.armed })),
  stepToCase: (slot) =>
    set((s) => ({
      caseIndex: s.caseIndex + shortestCaseDelta(caseSlot(s.caseIndex), slot),
    })),
}));
