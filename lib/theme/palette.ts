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

  /**
   * How far the three corridor layers recede behind the proof casefile,
   * as `1 − dim × proofPresence` (ADR-056 dims the MARK, the interior
   * HAZE and the dotted-shell SURFACE bed — deepen them together).
   *
   * Light mode fades them almost to nothing, and that is a design
   * decision, not a contrast patch (owner, 2026-08-02). On near-black
   * the wireframe is a dim gold ambient that sits UNDER the copy; on
   * parchment the same lines are mid-tone strokes that cross it, and the
   * casefile then needs a filled, framed plate to stay readable — which
   * reads as a white box pasted over the instrument. Fading the bed
   * instead buys the same legibility with NO fill and NO frame, so the
   * evidence stays type on paper.
   *
   * Not zero: ADR-056's iris exists to REVEAL this bed, so a trace of it
   * has to survive or the departure animates nothing.
   */
  proofDim: { mark: number; interior: number; surface: number; orbits: number };
}

export const DARK_SCENE: ScenePalette = {
  ground: 0x0a0908,
  // The shipped ADR-056 values, verbatim — dark must stay byte-identical.
  // `orbits` is 0, i.e. NO extra dim: dark leaves the structural rings on
  // `orbitReleaseLead` alone, exactly as ADR-056 tuned them.
  proofDim: { mark: 0.62, interior: 0.7, surface: 0.55, orbits: 0 },
};

export const LIGHT_SCENE: ScenePalette = {
  // Semantic Dawn — the same `--void` the light token block sets, so the
  // occluder matches the page behind the canvas exactly.
  ground: 0xece3d6,
  // Deeper than they look, and measured rather than guessed. `proofPresence`
  // peaks near 0.94 at the dwell's head, so a dim of 0.97 leaves ~9 % — a
  // residue that is invisible as gold-on-black and a legible texture as
  // gold-on-parchment, because these are dense dot fields and dot fields
  // aggregate. Parity by number is not parity by eye.
  //
  // `orbits` is the FOURTH layer, and the one that actually crossed the
  // copy: the structural waist + meridian rings are not part of ADR-056's
  // three, they ride `orbitReleaseLead` alone, and at the dwell's release
  // (~0.09) that still leaves them near 4 % — a thin continuous gold line
  // straight through the readouts, where the dot fields only stipple.
  //
  // ⚠ These exceed 1 on purpose, and the use sites clamp at 0. Measured:
  // `proofPresence` PEAKS around 0.94 at the dwell's head, so a dim of
  // exactly 1 still leaves ~6 % — enough for the dot shell, seen edge-on,
  // to draw a visible band straight through the directory. Going past 1
  // is what lets the bed actually reach zero while the casefile holds,
  // and it fades proportionally faster on the way in rather than
  // clipping. The MARK keeps a whisper (1.0 ⇒ ~6 %): ADR-056's iris has
  // to have something left to reveal on the way out.
  proofDim: { mark: 1.0, interior: 1.05, surface: 1.06, orbits: 1.06 },
};

/** Resolve the scene palette for a mode (defaults to the live theme). */
export function resolveScenePalette(mode: ThemeMode = readThemeMode()): ScenePalette {
  return mode === "light" ? LIGHT_SCENE : DARK_SCENE;
}
