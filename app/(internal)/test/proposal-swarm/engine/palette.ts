/* The swarm's paint. PURE.

   S4·E mixes each style once, over its own near-black ground. On the
   proposal the ground and the three tones are the page's tokens, and a plate
   can be lit or dimmed by the scroll, so the mix is done here from four
   colours handed in: a style is its tone at a share of itself over the
   ground, and a dimmed plate is that share again at `DIM`. */

import { STYLE, STYLE_PAINT } from "../../stack-forms/swarm/dots";

export type Rgb = readonly [number, number, number];

export interface Tones {
  ground: Rgb;
  bone: Rgb;
  gold: Rgb;
  green: Rgb;
}

/** The lab's own four, for a page that names none (`model/draw.ts`, `HEX`). */
export const DARK: Tones = {
  ground: [10, 9, 8],
  bone: [235, 227, 214],
  gold: [202, 165, 84],
  green: [122, 158, 106],
};

/** A plate out of turn: the proposal draws it at 30 % (`.es-plate`). A dot
    is smaller than a hairline's reach, so it keeps a little more. */
export const DIM = 0.36;

/** Whose a style is: 0 the team's, 1 the layer's, 2 the agents', -1 no plate's. */
export function plateOf(style: number): number {
  if (style >= STYLE.teamDim && style <= STYLE.teamLit) return 0;
  if (style >= STYLE.layerDim && style <= STYLE.layerHot) return 1;
  if (style >= STYLE.agentsDim && style <= STYLE.agentsHot) return 2;
  return -1;
}

/** One style as one opaque colour, its plate lit `level` of the way. */
export function colourOf(style: number, level: number, tones: Tones): string {
  const [tone, share] = STYLE_PAINT[style];
  const a = share * (DIM + (1 - DIM) * Math.min(1, Math.max(0, level)));
  const c = tones[tone];
  const g = tones.ground;
  const mix = (n: number) => Math.round(g[n] + (c[n] - g[n]) * a);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}

/** Every style's colour for three plates' levels, team first. */
export function paletteOf(level: readonly number[], tones: Tones): string[] {
  return STYLE_PAINT.map((_, style) => {
    const plate = plateOf(style);
    return colourOf(style, plate < 0 ? 1 : level[plate], tones);
  });
}

/** `rgb(r, g, b)`, `rgb(r g b)`, `r, g, b` or `#rrggbb`, as three numbers. */
export function parseRgb(text: string, fallback: Rgb): Rgb {
  const s = text.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const v = parseInt(hex[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const nums = s.match(/\d+(\.\d+)?/g);
  if (!nums || nums.length < 3) return fallback;
  return [Number(nums[0]), Number(nums[1]), Number(nums[2])];
}
