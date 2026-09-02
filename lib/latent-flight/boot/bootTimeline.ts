/**
 * lib/latent-flight/boot/bootTimeline — the power-on, as data.
 *
 * A cue table the capture can name (`?hold=<cue>` freezes the clock at a
 * cue's `at`) and the boot system scrubs. Each cue is a moment (`at`) or a
 * ramp (`at` + `dur`); `bootStateAt(t)` answers 0…1 for every cue at once,
 * and `instantBoot()` is the same table at its end — the reduced-motion
 * page starts there and never plays it.
 *
 * The comms lines run on their own schedule and outlive the boot: the
 * FSM leaves BOOT at `BOOT_DONE_AT` while the log is still reading out.
 *
 * ⚠ THE PULSAR'S FIRST CROSSING IS A BOOT CUE TOO. The star's clock starts
 * `PULSAR_BOOT_DELAY_S` after the engine's so that the first pulse lands
 * at 1.6 s (0.4 + 0.75 × the 1.6 s period), after the beacon tag has
 * resolved — the instrument acquires the beacon, then the beacon speaks.
 */

export type BootCueId =
  | "canvas-ready"
  | "stars-up"
  | "rails-uncover"
  | "pulsar-up"
  | "tape-light"
  | "hud-power"
  | "course-mark"
  | "reticle-arm"
  | "meters-selftest"
  | "beacon-tag"
  | "first-pulse"
  | "waypoints"
  | "key-row"
  | "boot-done";

export interface BootCue {
  id: BootCueId;
  /** Seconds after the engine starts. */
  at: number;
  /** Ramp length, seconds. Absent = a moment (0 before `at`, 1 from it). */
  dur?: number;
}

export const BOOT_CUES: readonly BootCue[] = [
  { id: "canvas-ready", at: 0 },
  { id: "stars-up", at: 0, dur: 0.6 },
  { id: "rails-uncover", at: 0.1, dur: 0.4 },
  { id: "pulsar-up", at: 0.3, dur: 0.9 },
  { id: "tape-light", at: 0.6, dur: 0.3 },
  { id: "hud-power", at: 0.9 },
  { id: "course-mark", at: 1.1, dur: 0.08 },
  { id: "reticle-arm", at: 1.2, dur: 0.15 },
  { id: "meters-selftest", at: 1.3, dur: 0.4 },
  { id: "beacon-tag", at: 1.5 },
  { id: "first-pulse", at: 1.6 },
  { id: "waypoints", at: 1.7, dur: 0.42 },
  { id: "key-row", at: 2.3 },
  { id: "boot-done", at: 2.4 },
];

export const BOOT_DONE_AT = 2.4;
export const PULSAR_BOOT_DELAY_S = 0.4;

export type BootState = Record<BootCueId, number>;

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function bootStateAt(t: number): BootState {
  const out = {} as BootState;
  for (const cue of BOOT_CUES) {
    out[cue.id] = cue.dur ? clamp01((t - cue.at) / cue.dur) : t >= cue.at ? 1 : 0;
  }
  return out;
}

export function instantBoot(): BootState {
  return bootStateAt(Number.POSITIVE_INFINITY);
}

export function bootCue(id: string): BootCue | undefined {
  return BOOT_CUES.find((c) => c.id === id);
}

/** The log's read-out during and after the boot. */
export interface CommsLine {
  at: number;
  text: string;
}

export const BOOT_COMMS: readonly CommsLine[] = [
  { at: 1.8, text: "POWER · INSTRUMENTS ON" },
  { at: 2.3, text: "FRAME · 13 RUNGS · BOTH RAILS" },
  { at: 2.8, text: "BEACON ACQUIRED · LS-01 · PERIOD 1.600 S" },
  { at: 3.3, text: "ROUTE CHARTED · 7 WAYPOINTS" },
];

/** What the instruments say. Present tense for state, imperative for actions,
 *  ` · ` the house separator, no exclamation marks, no "you". */
export const STRINGS = {
  idle: "HOLDING · SELECT A WAYPOINT",
  driveOffline: "DRIVE OFFLINE · HOLDING",
  released: "RELEASED · HOLDING",
  signalLost: "SIGNAL LOST · RENDERER",
  chart: "RENDERER UNAVAILABLE · CHART MODE",
  beacon: { key1: "BEACON", value1: "LS-01", key2: "PERIOD", value2: "1.600 S" },
  keys: {
    bearing: "BEARING",
    sector: "SECTOR",
    local: "LOCAL",
    thr: "THR",
    sig: "SIG",
    target: "TARGET",
    range: "RANGE",
  },
  lock: (name: string, range: string) => `LOCK · ${name} · RANGE ${range}`,
} as const;
