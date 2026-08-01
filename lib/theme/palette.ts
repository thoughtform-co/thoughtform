/**
 * palette — the scene's colour spine, per theme (ADR-058, Phase 2).
 *
 * The CSS side of light mode flips ~455 declarations through the token
 * ramps and the RGB triples. Nothing inside the WebGL canvas sees any of
 * that: painters hold their colours as module constants and shader
 * uniforms, so every one of them needs a value per mode. This module is
 * where those pairs live.
 *
 * THREE-FREE on purpose (landing-performance doctrine): these are plain
 * hex numbers, so DOM components and the corridor chunk can both import
 * it without dragging `three` into the landing's First Load JS. Painters
 * do `new THREE.Color(palette.ground)` on their own side.
 *
 * ⚠ THE DARK COLUMN IS THE EXISTING CONSTANTS, VERBATIM. Dark output has
 * to stay byte-identical (the flag's OFF contract), so every dark value
 * here must equal the literal the painter used before it was wired up —
 * `tests/lib/theme-palette.test.ts` pins the ones already in play.
 *
 * Growth plan: this starts with the values a surface actually needs and
 * grows one entry per painter as Phases 2–3 land, rather than declaring
 * forty slots that nothing reads yet.
 */

import { readThemeMode, type ThemeMode } from "./themeModeRef";

export interface ScenePalette {
  /**
   * The colour the corridor composites *toward* — i.e. the page ground
   * behind the transparent canvas.
   *
   * This is NOT decoration. `ShellSubstrateGyro`'s occluder core is a
   * normal-blended Beer–Lambert sphere painted this colour, and its whole
   * job is to be invisible against the page while absorbing whatever is
   * behind the planet. Leave it dark on a parchment page and the sphere
   * stops being smoked glass and becomes a grey disc.
   *
   * Dark is `--void` (#0a0908), not the canon #050403: the live page
   * ground is what the occluder has to disappear against, and
   * `app/styles/variables.css` is what actually paints it.
   */
  ground: number;
}

export const DARK_SCENE: ScenePalette = {
  ground: 0x0a0908,
};

export const LIGHT_SCENE: ScenePalette = {
  // Semantic Dawn — the same `--void` the light token block sets, so the
  // occluder matches the page behind the canvas exactly.
  ground: 0xece3d6,
};

/** Resolve the scene palette for a mode (defaults to the live theme). */
export function resolveScenePalette(mode: ThemeMode = readThemeMode()): ScenePalette {
  return mode === "light" ? LIGHT_SCENE : DARK_SCENE;
}
