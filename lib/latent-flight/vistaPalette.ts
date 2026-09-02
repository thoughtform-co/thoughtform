/**
 * lib/latent-flight/vistaPalette — the vista's colours, as DARK literals.
 *
 * ⚠ LITERALS ON PURPOSE. The scene is light emitters over void (additive,
 * bloomed), and every emitter must keep its value whatever the document's
 * theme says: under `html[data-theme="light"]` a runtime read of `--dawn`
 * returns INK (#110f09), and a kept-dark cosmos that read its tokens live
 * would paint ink stars on a black sky. So the DARK column is written here
 * and PINNED to `app/styles/variables.css` by a unit test — the values are
 * the tokens', the binding is at test time rather than at paint time.
 *
 * The colour law, applied: the dawn family is structure and stars; gold
 * appears only at the pulse and on the current rail tick; green is absent
 * in scene 1 (nothing here is "you made this"). Hue is pinned to the
 * 30–50° band — warmth is lightness, never a shift toward blue.
 */

export const VISTA = {
  /** `--void` — the compositing ground. A constant, never `--void` live. */
  ground: 0x0a0908,
  /** `--dawn` — stars, hairlines, the star's disc and field lines. */
  dawn: 0xebe3d6,
  /** The wormhole walls' soft dawn — the faint stars. */
  dawnSoft: 0xd6cdb5,
  /** The scroll streaks' warm white — the brightest stars, the disc's heat. */
  dawnHot: 0xf0e6cf,
  /** `--gold` — the pulse and the current tick. A MARK, never text. */
  gold: 0xcaa554,
  /** `--gold-ink-lit` — the beam's tint while it crosses the camera. */
  goldLit: 0xf0c86a,
} as const;

/** Which entries are pinned to which token (the unit test walks this). */
export const VISTA_TOKEN_PINS: Readonly<Record<string, keyof typeof VISTA>> = {
  "--void": "ground",
  "--dawn": "dawn",
  "--gold": "gold",
  "--gold-ink-lit": "goldLit",
};

export function hexToRgb01(hex: number): [number, number, number] {
  return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
}

/** Hue in degrees, 0–360. Achromatic returns 0. */
export function hueDeg(hex: number): number {
  const [r, g, b] = hexToRgb01(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** The warm band every vista colour must sit in. */
export const VISTA_HUE_BAND: readonly [number, number] = [30, 50];
