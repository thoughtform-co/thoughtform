/**
 * The key visuals `/test/hero-kv-lab` swaps under the live hero copy: the
 * live gateway plate for comparison, then the owner's Thought + Form keepers
 * (Midjourney, 2026-10-03/04; pixels prepared by
 * `scripts/hero-kv-lab/prepare.mjs` into the gitignored `public/_previews/`).
 *
 * ⚠ THE COMPOSITION RULE IS THE SITE'S, NOT THE PLATE'S. The hero's text
 * column runs from the left content inset to ~45 % of the width, so the head
 * and its ring must sit right of it. Each plate carries where its SUBJECT is
 * (`fx`, `fy`: the centre of the head-and-ring group, as fractions of the
 * image, read off the contact sheet) and the lab solves the rest:
 *   - a plate whose subject is on the LEFT is shown MIRRORED (`mirror`), so the
 *     head faces into the open sky where the title sits;
 *   - a plate whose subject is left of `TARGET_X` is ZOOMED about its left edge
 *     until the subject lands there, capped at `ZOOM_MAX` so the plate never
 *     softens past what an upscale can hold.
 * On a phone the zoom is off and the plate is positioned on the subject.
 *
 * Left out on purpose: MF-09 (`c2ee3dde`). Its ring is central and large;
 * mirrored and zoomed onto the target it still ran behind the headline.
 */

export const TARGET_X = 0.7;
export const ZOOM_MAX = 1.3;

export type HeroKv = {
  id: string;
  label: string;
  /** Midjourney job id, or `live` for the shipped plate. */
  job: string;
  /** Subject centre (head + ring) as fractions of the source image, before any mirror. */
  fx: number;
  fy: number;
  mirror?: boolean;
  /** The owner's favourites and the approved frame lead the strip. */
  tag?: string;
  note?: string;
};

export const HERO_KVS: readonly HeroKv[] = [
  {
    id: "live",
    label: "LIVE",
    job: "live",
    fx: 0.72,
    fy: 0.45,
    note: "Gateway_v1b, the shipped plate",
  },
  { id: "c8f094c8", label: "MF-10", job: "c8f094c8", fx: 0.8, fy: 0.42, tag: "his favourite" },
  { id: "63c6e199", label: "MF-04", job: "63c6e199", fx: 0.76, fy: 0.4, tag: "his favourite" },
  {
    id: "6f2a7b44",
    label: "MF-01",
    job: "6f2a7b44",
    fx: 0.58,
    fy: 0.42,
    tag: "the approved frame",
  },
  { id: "b8fa7cb3", label: "MF-08", job: "b8fa7cb3", fx: 0.22, fy: 0.42, mirror: true },
  { id: "fd132401", label: "MF-15", job: "fd132401", fx: 0.27, fy: 0.45, mirror: true },
  { id: "b588be28", label: "MF-06", job: "b588be28", fx: 0.74, fy: 0.42 },
  { id: "85aa1e89", label: "MF-02", job: "85aa1e89", fx: 0.75, fy: 0.45 },
  { id: "53515470", label: "MF-03", job: "53515470", fx: 0.75, fy: 0.45 },
  { id: "b5f6a04b", label: "MF-07", job: "b5f6a04b", fx: 0.63, fy: 0.55 },
  { id: "c9700098", label: "MF-11", job: "c9700098", fx: 0.63, fy: 0.55 },
  { id: "e0f85b3f", label: "MF-13", job: "e0f85b3f", fx: 0.6, fy: 0.55 },
  {
    id: "81d8a4f0",
    label: "MF-05",
    job: "81d8a4f0",
    fx: 0.68,
    fy: 0.45,
    note: "the halftone code, 4275287316",
  },
  {
    id: "eade4d1a",
    label: "MF-14",
    job: "eade4d1a",
    fx: 0.66,
    fy: 0.42,
    note: "the halftone code, 4275287316",
  },
  {
    id: "d45adc94",
    label: "MF-12",
    job: "d45adc94",
    fx: 0.78,
    fy: 0.45,
    note: "daylight, no style images",
  },
];

/** The subject's x once mirrored, and the zoom that lands it on TARGET_X. */
export function framing(kv: HeroKv): { fx: number; zoom: number } {
  const fx = kv.mirror ? 1 - kv.fx : kv.fx;
  const zoom = Math.min(ZOOM_MAX, Math.max(1, TARGET_X / fx));
  return { fx, zoom };
}

export function plateSrc(kv: HeroKv, thumb = false): string {
  if (kv.job === "live") return "/images/Gateway_v1b.webp";
  return `/_previews/hero-kv/${kv.job}${kv.mirror ? "-m" : ""}${thumb ? "-thumb" : ""}.webp`;
}
