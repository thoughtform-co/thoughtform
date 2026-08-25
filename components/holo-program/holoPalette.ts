/**
 * holoPalette — the artifact's colour spine, per theme (ADR-058, Phase 2).
 *
 * THREE-FREE on purpose (landing-performance doctrine): plain hex numbers,
 * so `components/arcs` and the scene can both import it. Painters do
 * `new THREE.Color(palette.structure)` on their own side.
 *
 * ⚠ LIGHT MODE IS NOT A TOKEN SWAP HERE, AND THAT IS THE WHOLE FILE.
 * This object is built almost entirely out of light-on-dark line work with
 * ADDITIVE accents and a bloom pass. Every one of those inverts badly:
 *
 *   1. ADDITIVE BLENDING CAN ONLY LIGHTEN. Over parchment it has nowhere to
 *      go — an additive gold arc on #ece3d6 is invisible. ADR-058 records
 *      exactly this about the corridor's ~25 additive materials, and its
 *      answer there was to FADE the layers out rather than recolour them.
 *      This artifact cannot fade out — it IS the beat — so it swaps to
 *      normal blending and dark ink instead.
 *   2. DAWN ON PARCHMENT IS INVISIBLE. `#ebe3d6` structure lines against a
 *      `#ece3d6` ground differ by one step. The structure has to become INK.
 *   3. BLOOM HAS NOTHING TO DO ON A LIGHT GROUND — it only washes the page.
 *      It drops to a trace.
 *   4. RAW GOLD IS ~1.2:1 ON PARCHMENT. ADR-063 U2's ramp exists for this:
 *      `--gold-line` (#8a6b20, 3.6:1) for strokes, `--gold-ink` (#6e5216,
 *      4.9:1) where it has to carry like text. ⚠ NEVER re-darken `--gold`
 *      itself — ADR-058 measured that and it breaks every gold FILL.
 *
 * So the two columns below are genuinely different drawings of one object:
 * dark is a hologram, light is a technical drawing on paper.
 */

import { readThemeMode, type ThemeMode } from "@/lib/theme/themeModeRef";

export interface HoloPalette {
  /** The plate the object is drawn on. */
  ground: number;
  /** The record's rings, ticks, reticles, axis — the structural line work. */
  structure: number;
  /** The seeded shells and the dust: the machine around the record. */
  machine: number;
  /** The seat, the mark's ring, the plated collar. */
  gold: number;
  /** The bright accent arcs — the brightest thing in the object. */
  accent: number;
  /** The adoption ladder. Green is the human on this estate, in both themes. */
  green: number;
  /** The floor graticule. */
  grid: number;
  /** The brandmark's own particles. */
  mark: number;
  /**
   * ⚠ ADDITIVE ONLY ON DARK. On parchment it can only lighten, so the
   * accents would vanish; the scene reads this rather than hard-coding
   * `THREE.AdditiveBlending`.
   */
  additive: boolean;
  /** Bloom multiplier — a trace on light, where there is nothing to lift. */
  bloomScale: number;
  /**
   * ⚠ A VIGNETTE ON PAPER IS A STAIN. On void, darkened corners read as the
   * edge of a lit volume; on parchment the identical pass reads as a smudge
   * or a bad scan, because there is no light source for it to fall off from.
   */
  vignetteScale: number;
  /** Grain reads as atmosphere on void and as DIRT on paper. */
  grainScale: number;
  /** The brandmark needs more weight as dark-on-light than as glow-on-dark:
   *  normal blending gives it none of additive's accumulation. */
  markOpacity: number;
  /** Opacity multiplier for the dust, which needs far less alpha to read as
   *  dark motes on paper than as glowing ones on void. */
  dustScale: number;
}

export const HOLO_DARK: HoloPalette = {
  ground: 0x0d0c0a,
  structure: 0xebe3d6, // Semantic Dawn
  machine: 0xdcc176, // Tensor accent — the alpha-compensated dot-field gold
  gold: 0xcaa554, // `--gold`, luminous in both themes by ADR-058
  accent: 0xdcc176,
  green: 0x5b7a4e, // Atreides
  grid: 0xebe3d6,
  mark: 0xcaa554,
  additive: true,
  bloomScale: 1,
  vignetteScale: 1,
  grainScale: 1,
  markOpacity: 0.92,
  dustScale: 1,
};

export const HOLO_LIGHT: HoloPalette = {
  /** Semantic Dawn — the page's own ground, so the artifact sits flush on
   *  the paper instead of as a panel pasted onto it. */
  ground: 0xece3d6,
  /** Latent Night. The structure inverts to ink: this is a technical
   *  drawing on paper, not a hologram with the lights turned up. */
  structure: 0x14110c,
  /** The machine layer stays a warm mid-tone so it recedes from the record
   *  the way it does on dark — dimmer than the structure, never a second
   *  black. */
  machine: 0x6b6152,
  gold: 0x8a6b20, // `--gold-line`, 3.6:1 — strokes, not text
  accent: 0x6e5216, // `--gold-ink`, 4.9:1 — the brightest object still reads
  green: 0x3f5a2e, // the PDA's own light green-mark value
  grid: 0x14110c,
  mark: 0x8a6b20,
  /** ⚠ FALSE. See the file header: additive over parchment is invisible. */
  additive: false,
  /** A trace. Bloom on a light ground washes the page and lifts nothing. */
  bloomScale: 0.12,
  /** Dark motes on paper carry at a fraction of the alpha glowing ones need. */
  dustScale: 0.45,
  vignetteScale: 0.22,
  grainScale: 0.35,
  markOpacity: 1,
};

export function resolveHoloPalette(mode: ThemeMode = readThemeMode()): HoloPalette {
  return mode === "light" ? HOLO_LIGHT : HOLO_DARK;
}

/** `#rrggbb` for the DOM side (the canvas wrapper's own background, which
 *  has to exist before the first frame and after a context loss). */
export function holoGroundCss(mode: ThemeMode = readThemeMode()): string {
  return `#${resolveHoloPalette(mode).ground.toString(16).padStart(6, "0")}`;
}
