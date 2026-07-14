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
export { BEAT_PARK_CENTRES, BEAT_WINDOWS, resolveBeat } from "@/lib/home-v2/corridorMap";
export type { Beat } from "@/lib/home-v2/corridorMap";
// The scalar math helpers (Phase-5 consolidation, 2026-07-14) come
// straight from `@/lib/math`. Re-exported here so the many corridor
// painters that import `{ clamp01, lerp, smoothstep }` from this store
// keep working unchanged.
export { clamp01, lerp, smoothstep } from "@/lib/math";

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
  /** True while the post-corridor exit hook keeps the live R3F
   *  instrument docked as a fixed backdrop behind the destination
   *  section. Written by the exit hook (`useCorridorExitScroll` per
   *  ADR-021; previously `useEmbeddedServicesScroll`), NOT by the
   *  corridor stage's own scroll hook. Single-writer rule — see
   *  `sentinel/BEST-PRACTICES.md` "Cross-writer scroll state needs an
   *  owner and a release guard". */
  docked: boolean;
  /** 0..1 scrub through the docked destination section. Kept separate
   *  from `epilogueProgress` so the corridor's calibrated stage can
   *  finish normally, then the later DOM section can keep the sphere
   *  parked and subtly alive while its copy scrolls over it.
   *  Reinterpreted by the painters as the DISSIPATE clock under
   *  ADR-021: the substrate sphere reads it for shell scatter +
   *  particle fade, the camera reads it via
   *  `getCorridorExitCameraPose(dissipate)` to fly INTO the sphere,
   *  and the BILLIONS signal block reads it via
   *  `dissipateBand(dockProgress, "SIGNAL_OUT")` for the title fade. */
  dockProgress: number;
  /** 0..1 dispersal of the centred brandmark into a "pixelated"
   *  particle field (ADR-021 follow-up Phase 2, capable path only).
   *
   *  - 0 = brandmark fully assembled (just re-centred / "shown").
   *  - 1 = pixels fully scattered + faded; `#continuum` has taken
   *    over the viewport.
   *
   *  Written by `useCorridorExitScroll` ONLY on the capable path
   *  (not reduced-motion / mobile / WebGL fallback). OPENS the
   *  instant the welded brandmark has re-centred and shown itself —
   *  during the dock TAIL (`dissipate >= MARK_CENTRED_DOCK_PROGRESS`),
   *  not only after the dock releases — and ramps across a long
   *  runway driven by `#continuum`'s approach. Stays 0 before the
   *  recentre and on the fallback path (where the legacy
   *  `--services-brandmark` opacity fade drives the SVG glyph
   *  instead). Read by `CorridorSeamPixelField` to paint the
   *  gold/dawn pixel cloud. */
  seamMorph: number;
  /** True while the post-dock Services hold beat keeps an interior
   *  ambient haze painting behind the centred brandmark
   *  (ADR-021 addendum, "inside the sphere" hold).
   *
   *  Engages when the welded recentre has resolved and the brandmark
   *  is held centred in `#services` (i.e. `data-services-brandmark`
   *  is `"hold"` or `"fade"`) AND the capable path is in use. While
   *  engaged the R3F canvas stays fixed and `ShellSubstrateGyro`'s
   *  interior particle volume keeps painting at a muted floor — the
   *  surface (dotted shell, globe grid, equator, atmosphere) is
   *  fully scattered/faded by the dissipate, so what remains reads
   *  as "background stars inside the sphere" rather than a sphere.
   *
   *  Released when the gate clears (continuum has fully taken the
   *  viewport) or when reverse-scroll lifts the user back out of
   *  the services hold band (mirrored release guard in
   *  `useDepthScroll`). Painters that opt in (`ShellSubstrateGyro`,
   *  `FlyingCameraRig`, `StaticStarfield`, `BrandmarkPhysicsCoreActor`,
   *  the frame invalidator, the motion follower) read `servicesAmbient`
   *  the same way they read `docked`. Other corridor painters bail
   *  out as usual. */
  servicesAmbient: boolean;
  /** 0..1 ambient-haze opacity envelope for the services hold beat.
   *  Equal to 1 across the hold band, ramps 1 -> 0 across the
   *  continuum-approach fade window (mirrors `--services-brandmark`
   *  so the haze and the brandmark fade together). 0 when
   *  `servicesAmbient` is false. */
  servicesAmbientLevel: number;
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
  docked: false,
  dockProgress: 0,
  seamMorph: 0,
  servicesAmbient: false,
  servicesAmbientLevel: 0,
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
    a.velocity === b.velocity &&
    a.docked === b.docked &&
    a.dockProgress === b.dockProgress &&
    a.seamMorph === b.seamMorph &&
    a.servicesAmbient === b.servicesAmbient &&
    a.servicesAmbientLevel === b.servicesAmbientLevel
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
