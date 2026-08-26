/**
 * The About-exit → character-stage PORTAL bus (ADR-082 entry
 * transition).
 *
 * The About runway's exit clock has two possible readings, decided by
 * `VOIDWALKER_CHARACTER_STAGE`:
 *
 *   - flag off: the ADR-047 slide-out — copy left, portrait cluster
 *     off-screen right. `--about-exit` on the stage.
 *   - flag on: the ADR-082 PORTAL — the portrait cluster moves to
 *     viewport centre and scales up as the reader flies through it into
 *     the character stage below. `--about-portal` on the stage AND
 *     this ref carries the same 0..1 clock across the two roots (the
 *     about stage is one React tree, the character stage is another).
 *
 * ⚠ ZERO IMPORTS — see `characterStageRef.ts` for the same rule.
 * ⚠ Never mutate `state` outside these setters; consumers snapshot it
 *   inside `useFrame`.
 */

export interface CharacterStagePortalState {
  /** 0 while the About runway holds; ramps 0 → 1 across the portal
   *  window (0.74 → 0.96 of the About clock); 1 while below the runway. */
  progress: number;
  /** True whenever the About runway is engaged AND the character stage
   *  is the flag-on surface. When false, the receiver renders inert.
   */
  active: boolean;
}

const state: CharacterStagePortalState = { progress: 0, active: false };

export function getCharacterStagePortalState(): CharacterStagePortalState {
  return { progress: state.progress, active: state.active };
}

export function setCharacterStagePortalProgress(p: number): void {
  const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
  if (state.progress === clamped) return;
  state.progress = clamped;
}

export function setCharacterStagePortalActive(active: boolean): void {
  if (state.active === active) return;
  state.active = active;
  if (!active) state.progress = 0;
}

export function __resetCharacterStagePortalForTests(): void {
  state.progress = 0;
  state.active = false;
}
