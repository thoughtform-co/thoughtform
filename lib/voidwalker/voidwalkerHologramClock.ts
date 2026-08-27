import { clamp01, smootherstep } from "@/lib/math";

/**
 * Scroll windows for the pinned Voidwalker hologram stage.
 *
 * The stage powers on as soon as it pins, holds long enough to read, then
 * clears horizontally before sticky release. The exit window deliberately
 * matches About's [0.74, 0.96] window: adjacent stages finish their visible
 * movement while pinned, so native document flow never carries a live actor.
 */
export const VOIDWALKER_HOLOGRAM_ENTER_WINDOW: readonly [number, number] = [0, 0.22];
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

export interface VoidwalkerHologramProgress {
  progress: number;
  enter: number;
  exit: number;
  engaged: boolean;
}

/**
 * Component-local bridge between the single scroll writer and the masthead
 * decoder. It is intentionally not a store: one production stage writes it,
 * one DOM effect reads it, and no render should subscribe to every scroll
 * frame.
 */
export const voidwalkerHologramProgressRef: { current: VoidwalkerHologramProgress } = {
  current: { progress: 0, enter: 1, exit: 0, engaged: false },
};
