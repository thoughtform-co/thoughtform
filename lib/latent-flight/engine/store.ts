/**
 * lib/latent-flight/engine/store — the engine's LOW-FREQUENCY public state.
 *
 * React reads this through `useSyncExternalStore`; the engine writes it on
 * state transitions, on readiness, and on the capture stamp — never per
 * frame. Anything a frame changes (position, telemetry, the pulse) lives in
 * refs and DOM writes, not here, so a render can never be scheduled by the
 * loop.
 *
 * A module singleton: one page, one engine, one store. Strict-mode double
 * mounting re-seeds it through `resetLfStore()` in the engine's dispose.
 */

import type { LfState } from "./gameState";

export type LfMode = "pending" | "flight" | "chart";

export interface LfPublicState {
  /** Which renderer the page settled on. `pending` before the probe. */
  mode: LfMode;
  /** The FSM state. */
  fsm: LfState;
  /** True once the engine has rendered its first frame. */
  ready: boolean;
  /** `scene|state|theme` — the identity the capture script waits on. */
  stamp: string;
  /** The last discrete status sentence for the live region. */
  status: string;
}

const INITIAL: LfPublicState = {
  mode: "pending",
  fsm: "BOOT",
  ready: false,
  stamp: "",
  status: "",
};

let state: LfPublicState = INITIAL;
const listeners = new Set<() => void>();

export function getLfState(): LfPublicState {
  return state;
}

/** Server snapshot — identical object every call, so React never sees a
 *  hydration mismatch from the store side. */
export function getLfServerState(): LfPublicState {
  return INITIAL;
}

export function setLfState(patch: Partial<LfPublicState>): void {
  let changed = false;
  for (const key of Object.keys(patch) as (keyof LfPublicState)[]) {
    if (state[key] !== patch[key]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  for (const fn of Array.from(listeners)) fn();
}

export function subscribeLfState(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function resetLfStore(): void {
  state = INITIAL;
  for (const fn of Array.from(listeners)) fn();
}
