/**
 * The DOM → corridor-canvas hand-off for the character stage (ADR-082).
 *
 * Two consumers read this ref every frame:
 *   1. `CharacterStageActor` (inside `DepthGatewayScene`) — mounts the
 *      current era's mesh when `eraId` is non-null and the reader is
 *      inside the stage runway;
 *   2. The (future) camera rig — advances a slow turntable rotation
 *      while a mesh is resident.
 *
 * ⚠ ZERO IMPORTS. `sceneGeom.ts` imports THREE, so this bus (like the
 * ADR-081 travel bus `vwTravelRef`) may not import anything that pulls
 * WebGL into the landing's First Load JS.
 */

import type { CharacterEraId } from "./characterEras";

export interface CharacterStageState {
  /** Which era is currently centred, or `null` if the stage is not the
   *  active surface (flag off, mobile, PRM, no-WebGL, or between-runway). */
  eraId: CharacterEraId | null;
  /** The stage viewport rect in CSS pixels — where the mesh must
   *  project. `null` when there is no live viewport. */
  rect: { left: number; top: number; width: number; height: number } | null;
  /** Bumped on any era swap. The R3F consumer diffs this against its
   *  last-read value to trigger a materialisation animation. */
  epoch: number;
}

const state: CharacterStageState = { eraId: null, rect: null, epoch: 0 };

/** Read a snapshot (a copy — do not mutate the returned object). */
export function getCharacterStageState(): CharacterStageState {
  return { eraId: state.eraId, rect: state.rect, epoch: state.epoch };
}

export function setCharacterStageEra(id: CharacterEraId | null): void {
  if (state.eraId === id) return;
  state.eraId = id;
  state.epoch += 1;
}

export function setCharacterStageRect(
  rect: { left: number; top: number; width: number; height: number } | null
): void {
  if (
    rect === state.rect ||
    (rect &&
      state.rect &&
      rect.left === state.rect.left &&
      rect.top === state.rect.top &&
      rect.width === state.rect.width &&
      rect.height === state.rect.height)
  ) {
    return;
  }
  state.rect = rect;
}

/** Test-only reset. */
export function __resetCharacterStageForTests(): void {
  state.eraId = null;
  state.rect = null;
  state.epoch = 0;
}
