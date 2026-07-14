/**
 * arcCasesStore — UI state for the Arc Cases Card (ADR-036).
 *
 * LOW-FREQUENCY state only (button clicks): `armed` + the front `slot`.
 * Per-frame scalars (the damped arm level) cross the render-tree seam
 * through `lib/arc-cases/arcCasesLevelRef.ts` instead — zustand subscriber
 * churn is wrong for once-per-frame values (the `ringProgressRef`
 * precedent).
 *
 * Writers: `ArcCasesSigil` (toggle + auto-disarm watcher — ADR-041; it took
 * both over from the retired `ArcCasesTerminalCta` chip), `ArcCasesStepper`
 * (step/select, CLOSE, Escape disarm). Readers: `ArcCasesCard`'s useFrame
 * (armed + slot, via getState — no subscription), the sigil's `aria-expanded`
 * + `data-armed`, the DOM stepper's chips + `data-open`.
 *
 * `arm()` is UI-unused (toggle covers the sigil) — kept for the lab and
 * API symmetry with `disarm()`.
 */

import { create } from "zustand";
import { stepSlot } from "@/lib/arc-cases/arcCasesMath";

interface ArcCasesState {
  /** True while the visitor has the tools card open at the Build park
   *  (ADR-036 — the terrace this originally armed was retired). */
  armed: boolean;
  /** Front case slot 0..3 — plain, wrapping (the cumulative-index +
   *  shortest-delta machinery died with the physical ring). */
  slot: number;
  arm: () => void;
  disarm: () => void;
  toggle: () => void;
  /** Wrapping prev (−1) / next (+1). */
  step: (dir: 1 | -1) => void;
  /** Jump straight to a slot (numbered chips). */
  select: (slot: number) => void;
}

export const useArcCasesStore = create<ArcCasesState>((set) => ({
  armed: false,
  slot: 0,
  arm: () => set({ armed: true }),
  disarm: () => set({ armed: false }),
  toggle: () => set((s) => ({ armed: !s.armed })),
  step: (dir) => set((s) => ({ slot: stepSlot(s.slot, dir) })),
  select: (slot) => set({ slot }),
}));
