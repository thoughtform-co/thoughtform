/**
 * depthGatewayStore — single transform channel for the home-v2
 * depth-corridor scene (ADR-018).
 *
 * Mirrors the pattern of `brandmarkJourneyStore`: a single Zustand
 * store holds the current depth-scroll state, the rAF scroll hook
 * writes it once per frame, and the R3F painters read it
 * imperatively inside their own `useFrame` loops so the per-frame
 * cost stays at uniform writes only (no React re-renders).
 *
 * The store models a depth CORRIDOR (ADR-018): a 3D camera path
 * that visits five narrative beats along -Z. Each beat owns its own
 * progress window; the camera dollies continuously while the world
 * geometry (compass / orbits / interstitial / sphere) sits at
 * pre-baked Z stations and is approached, parked at, and passed.
 *
 * Scope is local to `/test/home-v2` — the production landing page
 * does not import this store.
 */

import { create } from "zustand";

import type { Beat } from "@/lib/home-v2/corridorMap";

// The corridor topology (beats, windows, park centres), `resolveBeat`,
// and the shared math helpers are now DERIVED from the declarative
// `corridorMap`. They are re-exported here so the many
// `@/lib/stores/depthGatewayStore` importers keep working unchanged.
// New code should prefer importing from `@/lib/home-v2/corridorMap`.
export {
  BEAT_PARK_CENTRES,
  BEAT_WINDOWS,
  clamp01,
  lerp,
  resolveBeat,
  smoothstep,
} from "@/lib/home-v2/corridorMap";
export type { Beat } from "@/lib/home-v2/corridorMap";

export interface DepthGatewayTransform {
  /** Global 0..1 progress across the sticky stage. */
  progress: number;
  /** Current narrative beat (ADR-018). */
  beat: Beat;
  /** Local 0..1 progress through the current beat. `0` at the
   *  beat's start, `1` at its end. Painters that need to drive
   *  beat-local animations (e.g. brandmark settle, orbits draw-in)
   *  should read this. */
  gateProgress: number;
  /** True while the sticky stage is engaged with the viewport. */
  active: boolean;
  /** True only while the stage is approaching its pinned position
   *  AFTER the hero has fully scrolled off-screen but BEFORE the
   *  sticky cell has reached the top of the viewport. While armed,
   *  painters pre-position elements at the parked Thoughtform
   *  layout (`paintProgress = 0`) AND paint at full opacity, so the
   *  second section reads as composed on arrival — copy + compass
   *  + brandmark are already visible as the stage rises into view,
   *  rather than appearing only after the sticky cell has reached
   *  the top of the viewport. */
  armed: boolean;
  /** Progress value PAINTERS should drive world positions + camera
   *  sync from. Equal to `progress` when `active`. Forced to 0 while
   *  `armed` so the parked Thoughtform layout is what's visible as
   *  the stage rises into view. While neither active nor armed,
   *  equals `progress` but painters bail out early so the value is
   *  moot.
   *
   *  Note: `paintProgress` (and `progress`/`gateProgress`/`beat`) are
   *  CLAMPED to the corridor span. Scroll past the corridor's last
   *  beat is exposed separately as `epilogueProgress` so the
   *  hand-calibrated corridor windows are never re-tiled. */
  paintProgress: number;
  /** Epilogue scrub — 0..1 progress through the post-corridor scroll
   *  channel. Equals 0 while the user is anywhere inside the corridor
   *  (paintProgress 0..1 owns that range); ramps 0 -> 1 across the
   *  extra scroll length added at the end of the sticky stage.
   *
   *  Drives: the parked gimbal sphere sliding right, fading out the
   *  Build header + ShellStack (sources/interfaces), and the new
   *  "billions on the same layer" title + orbiting news cards.
   *
   *  By design this is an INDEPENDENT channel from the corridor
   *  progress — the corridor saturates at 1 (sphere parked, camera at
   *  CAMERA_END, Build header at full opacity) and epilogueProgress
   *  then takes over for the post-park choreography. */
  epilogueProgress: number;
  /** Signed per-frame scroll velocity in "progress units per second".
   *  Positive when scrolling forward through the stage, negative on
   *  upward scroll, zero when idle. Used by `ScrollStreaks` to
   *  amplify near-camera streak flow only when the user is
   *  actively moving. */
  velocity: number;
}

export const INITIAL_TRANSFORM: DepthGatewayTransform = {
  progress: 0,
  beat: "thoughtform",
  gateProgress: 0,
  active: false,
  armed: false,
  paintProgress: 0,
  epilogueProgress: 0,
  velocity: 0,
};

interface DepthGatewayState {
  transform: DepthGatewayTransform;
  setTransform: (next: DepthGatewayTransform) => void;
}

export const useDepthGatewayStore = create<DepthGatewayState>((set) => ({
  transform: INITIAL_TRANSFORM,
  setTransform: (next) =>
    set((state) => (transformEquals(state.transform, next) ? state : { transform: next })),
}));

function transformEquals(a: DepthGatewayTransform, b: DepthGatewayTransform): boolean {
  return (
    a.progress === b.progress &&
    a.beat === b.beat &&
    a.gateProgress === b.gateProgress &&
    a.active === b.active &&
    a.armed === b.armed &&
    a.paintProgress === b.paintProgress &&
    a.epilogueProgress === b.epilogueProgress &&
    a.velocity === b.velocity
  );
}

/** Resolve corridor engagement state from the stage rect and the
 *  current global progress. Returns:
 *
 *   - `active`: stage is pinned (rect.top <= 0) and still in view.
 *     Painters paint at the live progress with their normal
 *     visibility envelopes.
 *   - `armed`: stage is rising into the pinned position but hasn't
 *     pinned yet (0 < rect.top < vh). Painters paint at FULL opacity
 *     against the parked Thoughtform layout (`paintProgress = 0`)
 *     so the second section is composed and visible the moment its
 *     sticky cell starts entering the viewport.
 *   - `paintProgress`: equal to `progress` while active; forced to 0
 *     while armed (or otherwise) so painters draw the parked beat.
 *
 *  Stage / hero layering: the stage canvas lives inside
 *  `.home-v2-stage__sticky` (z-index 2) which scrolls up over the
 *  sticky hero (z-index 1) as the user scrolls past the hero. The
 *  stage canvas only covers the stage area of the viewport, so
 *  painting at full opacity while armed doesn't overlap the hero. */
export function getCorridorEngagement(
  stageRect: DOMRect,
  vh: number,
  progress: number
): { active: boolean; armed: boolean; paintProgress: number } {
  const pinned = stageRect.top <= 0;
  const stageInView = stageRect.bottom > 0 && stageRect.top < vh;
  const active = pinned && stageRect.bottom > 0;
  const armed = stageInView && !pinned;
  const paintProgress = active ? progress : 0;
  return { active, armed, paintProgress };
}

// Beat layout (windows, park centres), `resolveBeat`, and the shared
// math helpers now live in `@/lib/home-v2/corridorMap` and are
// re-exported from the top of this file for back-compat.
