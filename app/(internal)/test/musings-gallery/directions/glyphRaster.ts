/**
 * The GLYPH RASTER on a drawn cover — ADR-112's treatment (the services
 * cards' portrait, "the photograph itself as glyphs at rest, resolving into
 * the photograph on hover") ported to a DOM canvas for the gallery lab
 * (round six, owner 2026-09-24: the card's visual "should be the thumbnail,
 * of course, but with the dither glitch effects we have for our other
 * pictures as well").
 *
 * ⚠ COPIED FROM `cardViz.applyGlyphRaster` (cardViz.ts:1474–1538), NEVER
 * IMPORTED. That function's quiet bands are solved against the card's
 * 840 × 1360 bake (a thumbnail would come out three-quarters quiet), it takes
 * the ring's palette type, and `cardViz` drags the brandmark's sampling
 * modules into whatever imports it. What is copied: the shaded ramp, the
 * 5th–98th percentile normalisation, the skip floor, the `0.3 + 0.7·lum`
 * alpha and the every-third-row scan. What differs, and why:
 *
 *   · THE SIGNAL IS COVERAGE, NOT LUMINANCE. The services face rasters a
 *     toned PHOTOGRAPH on an opaque ground; this rasters a LINE DRAWING on a
 *     transparent canvas, so a cell's ink is its mean ALPHA. That is also
 *     what makes it theme-free: no print inversion is needed on parchment.
 *   · EACH GLYPH TAKES ITS CELL'S OWN COLOUR (alpha-weighted mean), so the
 *     gold track letters in gold and the dawn rings in dawn — the drawing's
 *     own hierarchy survives the raster.
 *
 * The REVEAL's ramps and damp rate are IMPORTED from
 * `lib/services-ring/reveal.ts` (pure, three-free): the lab resolves on the
 * production numbers, so the two cannot drift.
 *
 * Everything above the canvas section is PURE — no DOM, no clock — and
 * `tests/lib/musings-gallery.test.ts` walks it.
 */

import { RASTER_SKIP_LUM, revealGrid, revealPop } from "@/lib/services-ring/reveal";

/** The shaded ramp, sparse → dense. Copied from `cardViz.VOL_RAMP`. */
export const GLYPH_RAMP = ["·", ":", "-", "=", "+", "*", "#", "%", "@"] as const;
/** Every third row loses light — the raster's scan (`VOL_SCAN_*`). */
export const GLYPH_SCAN_EVERY = 3;
export const GLYPH_SCAN_KEEP = 0.55;
/** A cell's height in CSS px. The card's 18 bake px land at ~7–8 css px on a
 *  ring card at 1920; a cover this size wants the same density. */
export const GLYPH_CELL_CSS = 8;
/** The glyphs read the drawing with every stroke this many times thicker: a
 *  photograph fills every cell, a line drawing is mostly air, and a 1px ring
 *  sampled as-is letters as a scatter of dots rather than a band of glyphs. */
export const GLYPH_STROKE_BOOST = 3;
/** The PT Mono advance — a cell is this fraction of its height wide. */
export const GLYPH_ADVANCE = 0.6;
/** A POP cell's side in CSS px — the ring's 20 bake px square, re-solved for a
 *  cover a few hundred px across (about 24 cells a side). */
export const POP_CELL_CSS = 11;
/** The coarsest mosaic, in cells across — where the refinement starts. */
export const MOSAIC_MIN = 18;

export interface CellStats {
  cols: number;
  rows: number;
  /** Mean alpha per cell, [0, 1]. */
  cover: Float32Array;
  /** Alpha-weighted mean colour per cell, 0–255, three per cell. */
  rgb: Float32Array;
}

/**
 * Every cell's mean alpha and alpha-weighted colour, sampling every other
 * pixel (the services raster's own stride). `data` is RGBA, `w × h` px.
 */
export function cellStats(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  cols: number,
  rows: number
): CellStats {
  const cover = new Float32Array(cols * rows);
  const rgb = new Float32Array(cols * rows * 3);
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    const y0 = Math.floor(r * ch);
    const y1 = Math.min(h, Math.ceil((r + 1) * ch));
    for (let c = 0; c < cols; c++) {
      const x0 = Math.floor(c * cw);
      const x1 = Math.min(w, Math.ceil((c + 1) * cw));
      let a = 0;
      let n = 0;
      let sr = 0;
      let sg = 0;
      let sb = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * w + x) * 4;
          const al = data[i + 3] / 255;
          a += al;
          sr += data[i] * al;
          sg += data[i + 1] * al;
          sb += data[i + 2] * al;
          n++;
        }
      }
      const k = r * cols + c;
      cover[k] = n ? a / n : 0;
      rgb[k * 3] = a ? sr / a : 0;
      rgb[k * 3 + 1] = a ? sg / a : 0;
      rgb[k * 3 + 2] = a ? sb / a : 0;
    }
  }
  return { cols, rows, cover, rgb };
}

/**
 * Coverage normalised to the 5th–98th percentile of the NON-EMPTY cells —
 * the services raster's normalisation, with the empty field left out (a line
 * drawing is mostly air, and the air would put the 5th percentile at zero).
 * Empty cells stay 0.
 */
export function normaliseCover(cover: Float32Array): Float32Array {
  const lit = [...cover].filter((v) => v > 0).sort((a, b) => a - b);
  const out = new Float32Array(cover.length);
  if (!lit.length) return out;
  const lo = lit[Math.floor(lit.length * 0.05)];
  const hi = Math.max(lo + 1e-3, lit[Math.min(lit.length - 1, Math.floor(lit.length * 0.98))]);
  for (let i = 0; i < cover.length; i++) {
    out[i] = cover[i] > 0 ? Math.min(1, Math.max(0, (cover[i] - lo) / (hi - lo))) : 0;
  }
  return out;
}

/** The ramp index for a normalised level — `pow(lum, 0.8)`, as the card. */
export function glyphIndex(lum: number): number {
  const l = Math.min(1, Math.max(0, lum));
  return Math.min(GLYPH_RAMP.length - 1, Math.floor(Math.pow(l, 0.8) * GLYPH_RAMP.length));
}

/** A cell's glyph alpha, or 0 when it letters nothing. */
export function glyphAlpha(lum: number, row: number): number {
  if (lum < RASTER_SKIP_LUM) return 0;
  const a = 0.3 + 0.7 * lum;
  return row % GLYPH_SCAN_EVERY === GLYPH_SCAN_EVERY - 1 ? a * GLYPH_SCAN_KEEP : a;
}

/** `cardReveal.ts`'s GLSL hash, verbatim — `fract(sin(dot(p, (12.9898,
 *  78.233)) + seed·7.31) · 43758.5453)`. */
export function popHash(col: number, row: number, seed: number): number {
  const v = Math.sin(col * 12.9898 + row * 78.233 + seed * 7.31) * 43758.5453;
  return v - Math.floor(v);
}

/** Which pop cells show the clean drawing at reveal level `r`. */
export function poppedCells(cols: number, rows: number, seed: number, r: number): boolean[] {
  const share = revealPop(r);
  const out: boolean[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) out.push(popHash(x, y, seed) < share);
  return out;
}

/** The mosaic's cells across at level `r`: coarse through the first 0.15,
 *  full resolution (`fullCols`, the canvas's own pixels) at 1. */
export function mosaicCols(fullCols: number, r: number): number {
  const g = revealGrid(r);
  return Math.max(1, Math.round(MOSAIC_MIN + (fullCols - MOSAIC_MIN) * g));
}

/* ── The canvas half ────────────────────────────────────────────────────
   Browser-only; the capture drives it. */

/** Letter `stats` onto a cleared canvas in `font` (a full CSS font string). */
export function drawGlyphs(
  ctx: CanvasRenderingContext2D,
  stats: CellStats,
  w: number,
  h: number,
  font: string
): void {
  const lums = normaliseCover(stats.cover);
  const cw = w / stats.cols;
  const ch = h / stats.rows;
  ctx.clearRect(0, 0, w, h);
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let r = 0; r < stats.rows; r++) {
    const py = (r + 0.5) * ch;
    for (let c = 0; c < stats.cols; c++) {
      const k = r * stats.cols + c;
      const a = glyphAlpha(lums[k], r);
      if (a <= 0) continue;
      const R = Math.round(stats.rgb[k * 3]);
      const G = Math.round(stats.rgb[k * 3 + 1]);
      const B = Math.round(stats.rgb[k * 3 + 2]);
      ctx.fillStyle = `rgba(${R}, ${G}, ${B}, ${a.toFixed(3)})`;
      ctx.fillText(GLYPH_RAMP[glyphIndex(lums[k])], (c + 0.5) * cw, py);
    }
  }
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

/**
 * One frame of the reveal: the glyphs, and over every POPPED cell the clean
 * drawing as a mosaic refining toward full resolution — the veil plane's
 * shader, on a 2D canvas. A popped cell CLEARS its glyphs first: the services
 * face lays an opaque photograph over them, and a line drawing is not opaque.
 */
export function revealFrame(
  ctx: CanvasRenderingContext2D,
  glyphs: CanvasImageSource,
  clean: HTMLCanvasElement,
  scratch: HTMLCanvasElement,
  r: number,
  seed: number,
  popSide: number
): void {
  const w = clean.width;
  const h = clean.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(glyphs, 0, 0);
  if (revealPop(r) <= 0) return;

  const pc = Math.max(1, Math.round(w / popSide));
  const pr = Math.max(1, Math.round(h / popSide));
  const popped = poppedCells(pc, pr, seed, r);
  const cellW = w / pc;
  const cellH = h / pr;
  ctx.save();
  ctx.beginPath();
  let any = false;
  for (let y = 0; y < pr; y++)
    for (let x = 0; x < pc; x++)
      if (popped[y * pc + x]) {
        ctx.rect(Math.floor(x * cellW), Math.floor(y * cellH), Math.ceil(cellW), Math.ceil(cellH));
        any = true;
      }
  if (any) {
    ctx.clip();
    ctx.clearRect(0, 0, w, h);
    const mc = mosaicCols(w, r);
    if (mc >= w) {
      ctx.drawImage(clean, 0, 0);
    } else {
      const mr = Math.max(1, Math.round((mc * h) / w));
      scratch.width = mc;
      scratch.height = mr;
      const s = scratch.getContext("2d");
      if (s) {
        s.imageSmoothingEnabled = true;
        s.clearRect(0, 0, mc, mr);
        s.drawImage(clean, 0, 0, mc, mr);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(scratch, 0, 0, mc, mr, 0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
      }
    }
  }
  ctx.restore();
}

/** Mean alpha-weighted luminance of an RGBA buffer, [0, 1] — the capture's
 *  flash check (rest against resolved must stay one transition, ADR-097 U12). */
export function meanInk(data: Uint8ClampedArray): number {
  let s = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3] / 255;
    s += ((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255) * a;
    n++;
  }
  return n ? s / n : 0;
}
