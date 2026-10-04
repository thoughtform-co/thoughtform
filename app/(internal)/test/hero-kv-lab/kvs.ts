/**
 * The key visuals `/test/hero-kv-lab` swaps under the live hero copy: the
 * shipped plate (MF-04 since ADR-144, 2026-10-04) and the gateway it replaced
 * for comparison, then the owner's Thought + Form keepers
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
  /** Midjourney job id, `live` for the shipped plate, `gateway` for the one it replaced. */
  job: string;
  /** Subject centre (head + ring) as fractions of the source image, before any mirror. */
  fx: number;
  fy: number;
  mirror?: boolean;
  /** The owner's favourites and the approved frame lead the strip. */
  tag?: string;
  note?: string;
  /** ADR-145: the plate shown in the LIGHT theme (production's own rule paints it). */
  theme?: "light";
  /** ADR-145: a cinemagraph over the plate (the world ship's wave 07), AV1 + H.264,
   *  with the phone loop for the <=640 rung. Gitignored previews, never shipped. */
  video?: { av1: string; h264: string; phoneAv1: string; phoneH264: string };
  /** A light-theme CANDIDATE painted over production's light plate (wave 06 round 4),
   *  landscape and phone portrait; gitignored previews, never shipped from here. */
  light?: { hero: string; phone: string };
  /** The plate on the <=640 rung (ADR-145's portrait). The shipped one for LIVE, a candidate
   *  for a phone option; without it the lab paints the landscape plate on a phone, which is
   *  not what ships. */
  portrait?: string;
};

export const HERO_KVS: readonly HeroKv[] = [
  {
    id: "live",
    label: "LIVE",
    job: "live",
    fx: 0.76,
    fy: 0.4,
    note: "ThoughtForm_v1 (MF-04), the shipped plate since ADR-144",
    portrait: "/images/ThoughtForm_v1-portrait.webp",
  },
  // Phone framing options (2026-10-04, owner: the head at the bottom is "a bit too small ...
  // increase the size and move it a bit upwards"). Judged at 390x664 under the real copy.
  ...(
    [
      "crop12",
      "crop13",
      "crop13-lift",
      "fill-1",
      "fill-2",
      "half-1",
      "half-2",
      "fill-2-seated",
    ] as const
  ).map((k) => ({
    id: `phone-${k}`,
    label: `PHONE · ${k.toUpperCase()}`,
    job: "live",
    fx: 0.76,
    fy: 0.4,
    tag: "phone option",
    note:
      k === "fill-2-seated"
        ? "FILL 2 cropped to 9:16 with its bottom tenth off, so the group seats under the pronunciation line at 664"
        : k.startsWith("crop")
          ? `the shipped portrait cropped ${k.slice(4, 6).split("").join(".")}x about the floor${k.endsWith("lift") ? ", lifted 4 %" : ""}`
          : k.startsWith("fill")
            ? "wave 06 phone2: the group fills the lower two fifths, the ring to the frame's edge"
            : "wave 06 phone2: the group fills the lower half",
    portrait: `/_previews/hero-kv/phone/${k}.webp`,
  })),
  {
    id: "motion",
    label: "MOTION",
    job: "live",
    fx: 0.76,
    fy: 0.4,
    tag: "cinemagraph",
    note: "wave 07: Veo 3.1 Fast, anchored loop, composited on the plate's own pixels",
    video: {
      av1: "/_previews/hero-kv/motion/hero.av1.mp4",
      h264: "/_previews/hero-kv/motion/hero.h264.mp4",
      phoneAv1: "/_previews/hero-kv/motion/phone.av1.mp4",
      phoneH264: "/_previews/hero-kv/motion/phone.h264.mp4",
    },
  },
  {
    id: "light",
    label: "LIGHT",
    job: "light",
    fx: 0.76,
    fy: 0.4,
    theme: "light",
    tag: "obsidian",
    note: "MF-04 in obsidian on parchment, the light plate since ADR-145",
  },
  {
    id: "light-haze",
    label: "LIGHT · HAZE",
    job: "light",
    fx: 0.76,
    fy: 0.4,
    theme: "light",
    tag: "direction",
    note: "round 4: deep sepia sky overhead, lifted sand haze behind the copy, glassy obsidian",
    light: {
      hero: "/_previews/hero-kv/light/haze-hero.webp",
      phone: "/_previews/hero-kv/light/haze-phone.webp",
    },
  },
  {
    id: "light-veils",
    label: "LIGHT · VEILS",
    job: "light",
    fx: 0.76,
    fy: 0.4,
    theme: "light",
    tag: "direction",
    note: "round 4: bright sky, dust clouds rolling in low, glassy obsidian",
    light: {
      hero: "/_previews/hero-kv/light/veils-hero.webp",
      phone: "/_previews/hero-kv/light/veils-phone.webp",
    },
  },
  {
    id: "gateway",
    label: "GATEWAY",
    job: "gateway",
    fx: 0.72,
    fy: 0.45,
    note: "Gateway_v1b, the plate MF-04 replaced",
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
  if (kv.job === "live") return "/images/ThoughtForm_v1.webp";
  if (kv.job === "light") return "/images/ThoughtForm_v1-light.webp";
  if (kv.job === "gateway") return "/images/Gateway_v1b.webp";
  return `/_previews/hero-kv/${kv.job}${kv.mirror ? "-m" : ""}${thumb ? "-thumb" : ""}.webp`;
}
