/**
 * lib/latent-flight/engine/gameState — the flight's state machine, as data.
 *
 *   BOOT → VISTA → FLIGHT ⇄ APPROACH → DOCK
 *
 * BOOT is the power-on sequence (skippable). VISTA is the vessel holding at
 * HOME with the instruments lit. FLIGHT is an engaged leg; APPROACH is the
 * last stretch before a station; DOCK is the station's dossier open. MAP is
 * not a state — it is an overlay flag, because a map can be open in any of
 * them.
 *
 * `transition` is total: an event that has no row for the current state is a
 * no-op that returns the same state, never a throw. The engine logs those in
 * development so a mis-wired system is heard rather than felt.
 */

export type LfState = "BOOT" | "VISTA" | "FLIGHT" | "APPROACH" | "DOCK";

export type LfEvent =
  | "boot-done"
  | "skip"
  | "engage"
  | "release"
  | "approach-enter"
  | "approach-leave"
  | "dock"
  | "undock";

export const LF_STATES: readonly LfState[] = ["BOOT", "VISTA", "FLIGHT", "APPROACH", "DOCK"];

export const TRANSITIONS: Readonly<Record<LfState, Partial<Record<LfEvent, LfState>>>> = {
  BOOT: { "boot-done": "VISTA", skip: "VISTA" },
  VISTA: { engage: "FLIGHT" },
  FLIGHT: { "approach-enter": "APPROACH", release: "VISTA" },
  APPROACH: { "approach-leave": "FLIGHT", dock: "DOCK", release: "VISTA" },
  DOCK: { undock: "APPROACH" },
};

export function transition(state: LfState, event: LfEvent): LfState {
  return TRANSITIONS[state][event] ?? state;
}

/** The word the instruments print for a state. `CHART` is the no-WebGL
 *  fallback and is not an FSM state — the shell prints it directly. */
export const STATE_WORD: Readonly<Record<LfState, string>> = {
  BOOT: "POWER ON",
  VISTA: "VISTA",
  FLIGHT: "FLIGHT",
  APPROACH: "APPROACH",
  DOCK: "DOCKED",
};
