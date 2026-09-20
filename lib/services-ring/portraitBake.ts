/**
 * portraitBake — the deck's PORTRAIT BACK face and the card-face palette it
 * is drawn in, lifted out of `ServicesCardRing.tsx` (ADR-114) so a DOM tree
 * can bake the same canvas the WebGL deck shows.
 *
 * THREE-FREE ON PURPOSE. On the phone the deck flips to this portrait inside
 * the corridor canvas and then HANDS OVER to a DOM `<img>` in the about
 * band's seat before the band unpins (ADR-114 §4) — and the two may not
 * differ by a pixel, because the frame they cross on is the one the reader
 * is looking at. So the DOM side does not imitate the bake with a CSS filter
 * chain; it runs THIS function and shows the blob. That is only possible if
 * the function lives where the landing's First Load JS may reach it:
 * `landing-import-doctrine` walks the static graph, and a bake that imports
 * three drags the whole corridor stack into the about band's chunk.
 *
 * Everything below is byte-identical to what the ring drew before the lift
 * (the ring imports it back); the one addition is the `scale` argument — the
 * phone's bake ratio, drawn in bake px under `ctx.scale`, the same contract
 * `BAKE_SCALE_MOBILE` states for the faces.
 */

import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import {
  BAKE_H,
  BAKE_W,
  bakeSize,
} from "@/components/landing/home-v2/services/hologram/ringCtaBox";

/** Chamfer cut — the open plate's 26px at 2×. Top-right + bottom-left, the
 *  `.svc-plate__sh` polygon. */
export const BAKE_CH = 52;
/** Opaque void — visually identical to the page ground behind the canvas. */
export const VOID = "#050403";
export const DAWN = "236, 227, 214";

export interface ToneLut {
  r: Uint8ClampedArray;
  g: Uint8ClampedArray;
  b: Uint8ClampedArray;
}

/**
 * Gold-tone LUT reproducing the plate photo treatment
 * (`.svc-plate__pbg` filter: grayscale(1) sepia(0.5) hue-rotate(-9deg)
 * saturate(1.35) brightness(0.84) contrast(1.08)) without relying on
 * `ctx.filter` support. Input is collapsed to luminance first, so a single
 * 256-entry table per channel suffices.
 */
export function buildGoldToneLut(): ToneLut {
  const r = new Uint8ClampedArray(256);
  const g = new Uint8ClampedArray(256);
  const b = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    // sepia(0.5) on a grey pixel (standard sepia matrix, half-blended).
    let cr = v * (0.5 + 0.5 * 1.351);
    let cg = v * (0.5 + 0.5 * 1.203);
    let cb = v * (0.5 + 0.5 * 0.937);
    // saturate(1.35) around luminance.
    const lum = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
    cr = lum + (cr - lum) * 1.35;
    cg = lum + (cg - lum) * 1.35;
    cb = lum + (cb - lum) * 1.35;
    // brightness(0.84) then contrast(1.08).
    cr = (cr * 0.84 - 127.5) * 1.08 + 127.5;
    cg = (cg * 0.84 - 127.5) * 1.08 + 127.5;
    cb = (cb * 0.84 - 127.5) * 1.08 + 127.5;
    r[v] = cr;
    g[v] = cg;
    b[v] = cb;
  }
  return { r, g, b };
}

/**
 * The LIGHT photo treatment (owner, 2026-08-02: "shouldn't we also have a
 * light mode filter for our pictures?") — the parchment PRINT to the gold
 * LUT's phosphor plate. Same expression grammar so the DOM twin can mirror
 * it as a CSS chain: sepia(0.55) saturate(0.88) brightness(1.1)
 * contrast(0.9), then levels mapped into [30, 246] — the floor is what
 * lifts print blacks to warm ink instead of void (a photo ON paper never
 * reaches #000), the ceiling keeps highlights off the page white.
 */
export function buildParchmentToneLut(): ToneLut {
  const r = new Uint8ClampedArray(256);
  const g = new Uint8ClampedArray(256);
  const b = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    // sepia(0.55) on a grey pixel.
    let cr = v * (0.45 + 0.55 * 1.351);
    let cg = v * (0.45 + 0.55 * 1.203);
    let cb = v * (0.45 + 0.55 * 0.937);
    // saturate(0.88) around luminance — print, not phosphor.
    const lum = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
    cr = lum + (cr - lum) * 0.88;
    cg = lum + (cg - lum) * 0.88;
    cb = lum + (cb - lum) * 0.88;
    // brightness(1.1) then contrast(0.9).
    cr = (cr * 1.1 - 127.5) * 0.9 + 127.5;
    cg = (cg * 1.1 - 127.5) * 0.9 + 127.5;
    cb = (cb * 1.1 - 127.5) * 0.9 + 127.5;
    // Levels into [30, 246].
    r[v] = 30 + (Math.max(0, Math.min(255, cr)) * (246 - 30)) / 255;
    g[v] = 30 + (Math.max(0, Math.min(255, cg)) * (246 - 30)) / 255;
    b[v] = 30 + (Math.max(0, Math.min(255, cb)) * (246 - 30)) / 255;
  }
  return { r, g, b };
}

/**
 * The card FACE's per-theme palette (the DrawerPalette pattern, one surface
 * up). DARK is the shipped literals verbatim — the dark bake stays
 * byte-identical. LIGHT turns the whole face into the paper card the dawn
 * tray already implied: parchment-print photo, parchment scrims, Latent
 * Night copy, light-role gold chrome, and the chip kept as a gold stamp
 * (its ink flips to parchment — Latent Night on the darker light gold
 * measured ~2.4:1).
 */
export interface FacePalette {
  /** Canvas ground + the chamfer corner fill (must match the page). */
  ground: string;
  /** Scrim/veil fog family, as an "r, g, b" triple. */
  scrimRgb: string;
  /** The photo LUT for this theme. */
  lut: () => ToneLut;
  /** Chrome gold with alpha. */
  goldA: (a: number) => string;
  /** The shell gradient's second family (dawn on dark, ink on light). */
  washA: (a: number) => string;
  /** Reading ink (title/lede/full-variant copy). */
  ink: (a: number) => string;
  /** Solid gold — `{ em }` runs, the full face's CTA. */
  gold: string;
  chipFill: string;
  chipInk: string;
  /** A PRINT letters ink where the photograph is DARK; a plate lights where
   *  it is bright. The portrait raster (round four) inverts on this — the
   *  first light still lettered a negative, the figure a void in a lettered
   *  background, because the parchment LUT lifts the paper to the brightest
   *  value on the face. */
  print: boolean;
}

export const FACE_DARK: FacePalette = {
  ground: VOID,
  scrimRgb: "5, 4, 3",
  lut: buildGoldToneLut,
  print: false,
  goldA: (a) => `rgba(202, 165, 84, ${a})`,
  washA: (a) => `rgba(${DAWN}, ${a})`,
  ink: (a) => `rgba(${DAWN}, ${a})`,
  gold: SERVICES_GOLD,
  chipFill: SERVICES_GOLD,
  chipInk: "#110f09", // --latent-night
};
export const FACE_LIGHT: FacePalette = {
  ground: "#ece3d6",
  scrimRgb: "236, 227, 214",
  lut: buildParchmentToneLut,
  print: true,
  goldA: (a) => `rgba(202, 165, 84, ${a})`,
  washA: (a) => `rgba(17, 15, 9, ${a})`,
  ink: (a) => `rgba(17, 15, 9, ${a})`,
  gold: "#caa554",
  chipFill: "#caa554",
  chipInk: "#ece3d6",
};

/** The palette for a theme — the ring's own `facePal` selection. */
export function facePaletteFor(theme: "dark" | "light"): FacePalette {
  return theme === "light" ? FACE_LIGHT : FACE_DARK;
}

/** await img.decode() with a defensive fallback to onload for older engines. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`ServicesCardRing: failed to load ${src}`));
    img.src = src;
  });
}

/** `cutTopLeft` — the mirrored twin of `traceChamferPath`'s `cutTopRight`:
 *  the flip maps the physical TOP-RIGHT cut to screen TOP-LEFT, so when the
 *  tight silhouette drops the physical TR chamfer the back face must drop
 *  its TL chrome to stay aligned with the slab it is baked onto. The BR cut
 *  (physical BL) survives in both variants. */
export function traceChamferPathMirrored(
  ctx: CanvasRenderingContext2D,
  inset: number,
  cutTopLeft = true
): void {
  const x = inset;
  const y = inset;
  const w = BAKE_W - inset * 2;
  const h = BAKE_H - inset * 2;
  const ch = BAKE_CH;
  ctx.beginPath();
  if (cutTopLeft) {
    ctx.moveTo(x + ch, y);
  } else {
    ctx.moveTo(x, y);
  }
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - ch);
  ctx.lineTo(x + w - ch, y + h);
  ctx.lineTo(x, y + h);
  if (cutTopLeft) {
    ctx.lineTo(x, y + ch);
  }
  ctx.closePath();
}

/** Portrait source for the deck's back face — produced by
 *  scripts/services-photos/prepare.mjs (the `vince` entry), same 840×1360
 *  card crop as the service photos. */
export const PORTRAIT_BACK_SRC = "/images/services/vince.jpg";

/**
 * The deck's PORTRAIT BACK face (ADR-047): Vince's portrait under the same
 * gold-tone card treatment as the four service faces — it reads as the
 * fifth face of the same deck. Minimal chrome only (no chip row, no copy
 * stack, no CTA — and no fonts, so this bake never waits on
 * `waitForCardFonts`). Drawn UPRIGHT: the back plane carries
 * `rotation.y = π`, and the deck's own Ry(π) flip composes with it to
 * identity, so the canvas reads exactly like an unrotated front plane at
 * full flip (see the back-plane JSX note).
 *
 * `cutTopLeft` is `faceVariant === "full"` on the ring: the `tight` slab has
 * no physical TR chamfer, so its back drops the mirrored TL chrome.
 * `scale` (ADR-114) draws the same 840×1360 drawing into a canvas of
 * `bakeSize(scale)` — the phone's ratio, every coordinate still in bake px.
 */
export function bakePortraitBack(
  img: HTMLImageElement | null,
  cutTopLeft = true,
  pal: FacePalette = FACE_DARK,
  scale = 1
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const size = bakeSize(scale);
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  if (scale !== 1) ctx.scale(scale, scale);

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);

  if (img) {
    // Portrait, cover-fit + the shared gold-tone LUT pass (identical to the
    // service faces — buildGoldToneLut).
    const fit = Math.max(BAKE_W / img.naturalWidth, BAKE_H / img.naturalHeight);
    const dw = img.naturalWidth * fit;
    const dh = img.naturalHeight * fit;
    ctx.drawImage(img, (BAKE_W - dw) / 2, (BAKE_H - dh) / 2, dw, dh);
    const lut = pal.lut();
    // Device pixels: `getImageData` ignores the transform, so the pass covers
    // the whole (scaled) canvas whatever `scale` is.
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const lum = Math.min(
        255,
        Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2])
      );
      px[i] = lut.r[lum];
      px[i + 1] = lut.g[lum];
      px[i + 2] = lut.b[lum];
    }
    ctx.putImageData(data, 0, 0);
  } else {
    // Schematic dot-grid stand-in — the deck never flips to a raw void back.
    const tile = document.createElement("canvas");
    tile.width = 8;
    tile.height = 8;
    const tctx = tile.getContext("2d");
    if (tctx) {
      tctx.fillStyle = pal.goldA(0.24);
      tctx.beginPath();
      tctx.arc(2, 2, 1.7, 0, Math.PI * 2);
      tctx.fill();
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, BAKE_W, BAKE_H);
      }
    }
  }

  // Gentle top + ground scrims — the portrait carries no copy, so these
  // only seat the face into the slab (no deep copy-ground needed).
  const top = ctx.createLinearGradient(0, 0, 0, 150);
  top.addColorStop(0, `rgba(${pal.scrimRgb}, 0.55)`);
  top.addColorStop(1, `rgba(${pal.scrimRgb}, 0)`);
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, BAKE_W, 150);
  const ground = ctx.createLinearGradient(0, BAKE_H - 320, 0, BAKE_H);
  ground.addColorStop(0, `rgba(${pal.scrimRgb}, 0)`);
  ground.addColorStop(1, `rgba(${pal.scrimRgb}, 0.72)`);
  ctx.fillStyle = ground;
  ctx.fillRect(0, BAKE_H - 320, BAKE_W, 320);

  // MIRRORED chamfer corners (see traceChamferPathMirrored) — opaque void,
  // same contract as the front faces. `tight` drops the TL cut (the flipped
  // image of the physical TR chamfer the tight slab no longer has).
  const cutTL = cutTopLeft;
  ctx.fillStyle = pal.ground;
  if (cutTL) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(BAKE_CH, 0);
    ctx.lineTo(0, BAKE_CH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(BAKE_W, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_W, BAKE_H);
  ctx.lineTo(BAKE_W - BAKE_CH, BAKE_H);
  ctx.closePath();
  ctx.fill();

  // Mirrored shell stroke + bright chamfer ticks.
  const shell = ctx.createLinearGradient(BAKE_W, 0, BAKE_W * 0.75, BAKE_H);
  shell.addColorStop(0, pal.goldA(0.52));
  shell.addColorStop(0.38, pal.washA(0.14));
  shell.addColorStop(0.66, pal.goldA(0.16));
  shell.addColorStop(1, pal.goldA(0.48));
  ctx.strokeStyle = shell;
  ctx.lineWidth = 2.5;
  traceChamferPathMirrored(ctx, 1.5, cutTL);
  ctx.stroke();
  ctx.strokeStyle = pal.goldA(0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (cutTL) {
    ctx.moveTo(BAKE_CH, 1.5);
    ctx.lineTo(1.5, BAKE_CH);
  }
  ctx.moveTo(BAKE_W - 1.5, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_W - BAKE_CH, BAKE_H - 1.5);
  ctx.stroke();

  return canvas;
}

/* ── One bake, two readers (ADR-114) ─────────────────────────────────────
 * On the phone the ring's back planes and the about band's DOM `<img>` show
 * the SAME canvas — the handover between them is pixel-identical only if
 * neither re-draws it. So the bake is memoised here per theme and scale, as
 * a promise both callers await; the photo is fetched once. Nothing is baked
 * until the first ask, so a page that never reaches the band pays nothing. */
const portraitBakes = new Map<string, Promise<HTMLCanvasElement>>();

/** The portrait back for `theme` at `scale`, baked once. A fetch failure
 *  bakes the schematic stand-in rather than rejecting — the deck never
 *  flips to a raw void back, and a missing photo is not a missing beat. */
export function portraitBakeFor(
  theme: "dark" | "light",
  scale = 1,
  cutTopLeft = true
): Promise<HTMLCanvasElement> {
  const key = `${theme}:${scale}:${cutTopLeft ? 1 : 0}`;
  let bake = portraitBakes.get(key);
  if (!bake) {
    bake = loadImage(PORTRAIT_BACK_SRC)
      .catch(() => null)
      .then((img) => bakePortraitBack(img, cutTopLeft, facePaletteFor(theme), scale));
    portraitBakes.set(key, bake);
  }
  return bake;
}
