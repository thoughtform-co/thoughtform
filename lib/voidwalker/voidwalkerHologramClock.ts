import { clamp01, smootherstep } from "@/lib/math";

/**
 * Scroll windows for the pinned Voidwalker hologram stage.
 *
 * The stage powers on as soon as it pins, holds long enough to read, then
 * clears horizontally before sticky release. The exit window deliberately
 * matches About's [0.74, 0.96] window: adjacent stages finish their visible
 * movement while pinned, so native document flow never carries a live actor.
 */
export const VOIDWALKER_HOLOGRAM_ENTER_WINDOW: readonly [number, number] = [0, 0.14];
export const VOIDWALKER_HOLOGRAM_EXIT_WINDOW: readonly [number, number] = [0.74, 0.96];

export function voidwalkerHologramEnterT(progress: number): number {
  return smootherstep(
    VOIDWALKER_HOLOGRAM_ENTER_WINDOW[0],
    VOIDWALKER_HOLOGRAM_ENTER_WINDOW[1],
    clamp01(progress)
  );
}

export function voidwalkerHologramExitT(progress: number): number {
  return smootherstep(
    VOIDWALKER_HOLOGRAM_EXIT_WINDOW[0],
    VOIDWALKER_HOLOGRAM_EXIT_WINDOW[1],
    clamp01(progress)
  );
}

/**
 * The ERA BAND — the stretch of the pinned runway where scroll IS the era
 * selector (owner, 2026-08-27: "when you're in the Voidwalker section, you
 * should scroll through the eras before scrolling to the next section").
 *
 * ⚠ IT SITS INSIDE THE HOLD, CLEAR OF BOTH CLOCKS. The entry finishes at
 * 0.14 and the exit begins at 0.74, so a band of [0.16, 0.72] can never
 * advance an era while the stage is still assembling or already clearing —
 * which is what stops the reader watching the sheet retune itself during a
 * transition they did not ask for.
 *
 * This is the casefile's browse band one surface over (ADR-056 U13): scroll
 * selects, one slice per stop, and a CLICK PINS THE SCROLL to that slice's
 * centre. Both halves are required — without the pin, the spy overrides the
 * click on the very next frame.
 */
export const VOIDWALKER_ERA_BAND: readonly [number, number] = [0.16, 0.72];

/** Hysteresis, as a fraction of one slice. Below this the index cannot flip
 *  back and forth on a sub-pixel scroll jitter at a slice boundary. */
export const VOIDWALKER_ERA_HYSTERESIS = 0.22;

/**
 * Which era the runway is showing at `progress`, given how many there are.
 *
 * ⚠ `current` IS AN INPUT, NOT A HINT. The band is divided into equal
 * slices, but a boundary crossing only counts once the reader is
 * `VOIDWALKER_ERA_HYSTERESIS` of a slice PAST it — so a stop held exactly on
 * an edge stays put instead of flickering between two eras.
 */
export function voidwalkerEraFromProgress(
  progress: number,
  count: number,
  current: number
): number {
  if (count <= 1) return 0;
  const [lo, hi] = VOIDWALKER_ERA_BAND;
  const span = hi - lo;
  if (span <= 0) return current;
  const t = clamp01((clamp01(progress) - lo) / span);
  const raw = t * count;
  const next = Math.min(count - 1, Math.floor(raw));
  if (next === current) return current;
  // distance past the boundary we would be crossing, in slice fractions
  const boundary = next > current ? next : next + 1;
  const overshoot = Math.abs(raw - boundary);
  return overshoot >= VOIDWALKER_ERA_HYSTERESIS ? next : current;
}

/**
 * The inverse: the runway progress that seats `index` at its slice's CENTRE.
 * Used by a deliberate click, so the pointer and the scroll agree about which
 * era is showing.
 */
export function voidwalkerProgressForEra(index: number, count: number): number {
  if (count <= 1) return VOIDWALKER_ERA_BAND[0];
  const [lo, hi] = VOIDWALKER_ERA_BAND;
  const slice = (hi - lo) / count;
  return lo + slice * (Math.min(Math.max(index, 0), count - 1) + 0.5);
}

export interface VoidwalkerHologramProgress {
  progress: number;
  enter: number;
  exit: number;
  /** Complementary WebGL portrait → DOM hologram ownership scalar. */
  morph: number;
  engaged: boolean;
}

/**
 * Component-local bridge between the single scroll writer and the masthead
 * decoder. It is intentionally not a store: one production stage writes it,
 * one DOM effect reads it, and no render should subscribe to every scroll
 * frame.
 */
export const voidwalkerHologramProgressRef: { current: VoidwalkerHologramProgress } = {
  current: { progress: 0, enter: 1, exit: 0, morph: 1, engaged: false },
};

/**
 * The scroll writer's one way to tell the sheet which era the runway is on.
 *
 * ⚠ A SLOT, NOT A STORE, for the same reason `voidwalkerHologramProgressRef`
 * is: exactly one production stage writes it and exactly one component reads
 * it, and no render may subscribe to a scroll frame. The component registers
 * its setter on mount and clears it on unmount; the writer calls it ONLY when
 * the derived index actually changes, so a held scroll costs nothing.
 */
export const voidwalkerEraScrubRef: { current: ((index: number) => void) | null } = {
  current: null,
};
