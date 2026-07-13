/**
 * caseScreenBake — the 2D bake for the Arc Cases Terrace screen (ADR-034).
 *
 * Extracted from the retired ArcCasesRing (ADR-033) — same plate grammar
 * as ServicesCardRing (gold-tone LUT, chamfered shell, filled codename
 * chip, dot-matrix veil), re-composed LANDSCAPE: the case PNGs are
 * landscape UI shots (~16:9), so the terrace screen is a 16:10 face where
 * the screenshot is the dominant element (contain-fit, frame hugging the
 * drawn image) with one header chip row above and one tight copy block
 * below. The portrait card's long subline lede is deliberately dropped.
 *
 * NO CTA box — the repos are private; the screen is a showcase, not a
 * link (the ServicesCardRing `RING_CARD_CTA_BOX` is not replicated).
 *
 * Pure canvas-2D + DOM (no three, no React) so labs can render the baked
 * faces directly into the page for layout iteration.
 */

import {
  type ProjectCase,
  type TitleSegment,
} from "@/components/landing/v7/tools-cards/toolCardData";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";

/* ── Canvas geometry ────────────────────────────────────────────────────── */

/** 16:10 — near the screenshots' native ~1.56:1, landscape-dominant. */
export const TERRACE_BAKE_W = 1600;
export const TERRACE_BAKE_H = 1000;
/** Chamfer cut — the plate's 26px at 2×. Top-right + bottom-left. */
export const TERRACE_BAKE_CH = 52;
/** Opaque void — identical to the page ground behind the canvas. */
const VOID = "#050403";
const DAWN = "236, 227, 214";

const PAD_X = 44;

/** Screenshot max box — contain-fit inside; the hairline frame hugs the
 *  DRAWN image rect (per-case aspect), not this box, so no dead letterbox
 *  bars read as part of the device. */
const SHOT_X0 = PAD_X;
const SHOT_X1 = TERRACE_BAKE_W - PAD_X;
const SHOT_Y0 = 140;
const SHOT_Y1 = 800;

/* Dot-matrix hologram veil (the plate feed read) — same alpha math as the
 * ring's buildVeilCanvas, vertical profile re-fit to the landscape shot
 * band: crisp chip row above, clear copy block below. */
export const TERRACE_DOT_PITCH = 8;
const PHOTO_DOT_RADIUS = 2.15;
const PHOTO_DOTS_ALPHA = 0.62;
const PHOTO_SOFT_ALPHA = 0.3;
const VEIL_TOP_START = SHOT_Y0 - 20;
const VEIL_TOP_END = SHOT_Y0 + 60;
const VEIL_FADE_START = SHOT_Y1 - 60;
const VEIL_FADE_END = SHOT_Y1;

export const CARD_FONT = '"PT Mono", "IBM Plex Mono", ui-monospace, monospace';
export const CARD_SANS = '"PP Neue Montreal", "Helvetica Neue", Arial, sans-serif';

/* ── Shared helpers (verbatim from the retired ring bake) ───────────────── */

/** Vertical dot-matrix veil column — tiled horizontally by the texture's
 *  repeat (TERRACE_BAKE_W / TERRACE_DOT_PITCH). */
export function buildTerraceVeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TERRACE_DOT_PITCH;
  canvas.height = TERRACE_BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const between = 1 - PHOTO_SOFT_ALPHA;
  const gradient = ctx.createLinearGradient(0, 0, 0, TERRACE_BAKE_H);
  gradient.addColorStop(0, "rgba(5, 4, 3, 0)");
  gradient.addColorStop(VEIL_TOP_START / TERRACE_BAKE_H, "rgba(5, 4, 3, 0)");
  gradient.addColorStop(VEIL_TOP_END / TERRACE_BAKE_H, `rgba(5, 4, 3, ${between})`);
  gradient.addColorStop(VEIL_FADE_START / TERRACE_BAKE_H, `rgba(5, 4, 3, ${between})`);
  gradient.addColorStop(VEIL_FADE_END / TERRACE_BAKE_H, "rgba(5, 4, 3, 0)");
  gradient.addColorStop(1, "rgba(5, 4, 3, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TERRACE_DOT_PITCH, TERRACE_BAKE_H);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0, 0, 0, ${PHOTO_DOTS_ALPHA / (1 - PHOTO_SOFT_ALPHA)})`;
  for (let y = 0; y < TERRACE_BAKE_H; y += TERRACE_DOT_PITCH) {
    ctx.beginPath();
    ctx.arc(TERRACE_DOT_PITCH / 2, y + TERRACE_DOT_PITCH / 2, PHOTO_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

/** Gold-tone LUT — the plate photo treatment (see ServicesCardRing). */
export function buildGoldToneLut(): {
  r: Uint8ClampedArray;
  g: Uint8ClampedArray;
  b: Uint8ClampedArray;
} {
  const r = new Uint8ClampedArray(256);
  const g = new Uint8ClampedArray(256);
  const b = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let cr = v * (0.5 + 0.5 * 1.351);
    let cg = v * (0.5 + 0.5 * 1.203);
    let cb = v * (0.5 + 0.5 * 0.937);
    const lum = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
    cr = lum + (cr - lum) * 1.35;
    cg = lum + (cg - lum) * 1.35;
    cb = lum + (cb - lum) * 1.35;
    cr = (cr * 0.84 - 127.5) * 1.08 + 127.5;
    cg = (cg * 0.84 - 127.5) * 1.08 + 127.5;
    cb = (cb * 0.84 - 127.5) * 1.08 + 127.5;
    r[v] = cr;
    g[v] = cg;
    b[v] = cb;
  }
  return { r, g, b };
}

/** Chamfered outline (top-right + bottom-left cuts) for an arbitrary
 *  canvas — the ring's traceChamferPath, parametrized. */
export function traceChamferPath(
  ctx: CanvasRenderingContext2D,
  inset: number,
  w: number = TERRACE_BAKE_W,
  h: number = TERRACE_BAKE_H,
  ch: number = TERRACE_BAKE_CH
): void {
  const x = inset;
  const y = inset;
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + iw - ch, y);
  ctx.lineTo(x + iw, y + ch);
  ctx.lineTo(x + iw, y + ih);
  ctx.lineTo(x + ch, y + ih);
  ctx.lineTo(x, y + ih - ch);
  ctx.closePath();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`caseScreenBake: failed to load ${src}`));
    img.src = src;
  });
}

export async function waitForCardFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1500));
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 26px "PT Mono"'),
        document.fonts.load('400 20px "PT Mono"'),
        document.fonts.load('400 27px "PP Neue Montreal"'),
      ]).then(() => undefined),
      timeout,
    ]);
  } catch {
    /* fall through to the fallback faces */
  }
}

/** 128×128 radial gold glow — the device slab's under-glow sprite. */
export function buildGlowCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(202, 165, 84, 0.9)");
    gradient.addColorStop(0.35, "rgba(202, 165, 84, 0.32)");
    gradient.addColorStop(1, "rgba(202, 165, 84, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return canvas;
}

type InkRun = { text: string; gold: boolean };
type InkSeg = { text: string; gold?: boolean };

/** Greedy word-wrap over styled runs — emphasis (upright gold, never
 *  italics) survives wrapping. */
export function wrapRuns(
  ctx: CanvasRenderingContext2D,
  segments: readonly InkSeg[],
  maxWidth: number
): InkRun[][] {
  const words: InkRun[] = [];
  for (const seg of segments) {
    for (const word of seg.text.split(/\s+/)) {
      if (word) words.push({ text: word, gold: Boolean(seg.gold) });
    }
  }
  const spaceW = ctx.measureText(" ").width;
  const lines: InkRun[][] = [];
  let line: InkRun[] = [];
  let lineW = 0;
  for (const word of words) {
    const w = ctx.measureText(word.text).width;
    const needed = line.length ? spaceW + w : w;
    if (line.length && lineW + needed > maxWidth) {
      lines.push(line);
      line = [];
      lineW = 0;
    }
    lineW += line.length ? spaceW + w : w;
    line.push(word);
  }
  if (line.length) lines.push(line);
  return lines;
}

export function drawRunLine(
  ctx: CanvasRenderingContext2D,
  line: InkRun[],
  x: number,
  y: number,
  baseInk: string
): void {
  const spaceW = ctx.measureText(" ").width;
  let cx = x;
  line.forEach((run, i) => {
    if (i > 0) cx += spaceW;
    ctx.fillStyle = run.gold ? SERVICES_GOLD : baseInk;
    ctx.fillText(run.text, cx, y);
    cx += ctx.measureText(run.text).width;
  });
}

export function titleSegsToInk(segments: readonly TitleSegment[]): InkSeg[] {
  return segments.map((seg) => ({ text: seg.text.toUpperCase(), gold: seg.em }));
}

/* ── The landscape face ─────────────────────────────────────────────────── */

/**
 * Bake one terrace screen face: header chip row (filled gold codename
 * chip + `NN / 04 · STATUS` right), the dominant gold-toned screenshot
 * (contain-fit, hairline frame hugging the drawn rect), then one tight
 * footer block — caption row (mode + tagline left, headline metric right
 * gold), title runs (`em` → upright gold), stack chips (first 6).
 */
export function bakeCaseScreenFace(
  projectCase: ProjectCase,
  img: HTMLImageElement | null
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TERRACE_BAKE_W;
  canvas.height = TERRACE_BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Ground — opaque void everywhere; the screenshot never covers the face.
  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, TERRACE_BAKE_W, TERRACE_BAKE_H);

  // Screenshot — contain-fit into the max box, gold-toned via the LUT.
  const boxW = SHOT_X1 - SHOT_X0;
  const boxH = SHOT_Y1 - SHOT_Y0;
  let frame = { x: SHOT_X0, y: SHOT_Y0, w: boxW, h: boxH };
  if (img) {
    const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = SHOT_X0 + (boxW - dw) / 2;
    const dy = SHOT_Y0 + (boxH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    const lut = buildGoldToneLut();
    const clampedX = Math.max(0, Math.floor(dx));
    const clampedY = Math.max(0, Math.floor(dy));
    const data = ctx.getImageData(
      clampedX,
      clampedY,
      Math.min(TERRACE_BAKE_W - clampedX, Math.ceil(dw)),
      Math.min(TERRACE_BAKE_H - clampedY, Math.ceil(dh))
    );
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
    ctx.putImageData(data, clampedX, clampedY);
    frame = { x: dx, y: dy, w: dw, h: dh };
  } else {
    // Schematic dot-grid stand-in — the screen never shows a raw void face.
    const tile = document.createElement("canvas");
    tile.width = 8;
    tile.height = 8;
    const tctx = tile.getContext("2d");
    if (tctx) {
      tctx.fillStyle = "rgba(202, 165, 84, 0.24)";
      tctx.beginPath();
      tctx.arc(2, 2, 1.7, 0, Math.PI * 2);
      tctx.fill();
      const pattern = ctx.createPattern(tile, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(SHOT_X0, SHOT_Y0, boxW, boxH);
      }
    }
  }

  // Hairline frame hugging the drawn image (the "framed" read).
  ctx.strokeStyle = "rgba(202, 165, 84, 0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(frame.x - 1, frame.y - 1, frame.w + 2, frame.h + 2);

  // Scrims — chip row leads at the top; solid ground under the copy block.
  const top = ctx.createLinearGradient(0, 0, 0, 160);
  top.addColorStop(0, "rgba(5, 4, 3, 0.78)");
  top.addColorStop(1, "rgba(5, 4, 3, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, TERRACE_BAKE_W, 160);
  const ground = ctx.createLinearGradient(0, SHOT_Y1 - 50, 0, TERRACE_BAKE_H);
  ground.addColorStop(0, "rgba(5, 4, 3, 0)");
  ground.addColorStop(0.2, "rgba(5, 4, 3, 0.58)");
  ground.addColorStop(0.45, "rgba(5, 4, 3, 0.92)");
  ground.addColorStop(1, "rgba(5, 4, 3, 0.97)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, SHOT_Y1 - 50, TERRACE_BAKE_W, TERRACE_BAKE_H - (SHOT_Y1 - 50));

  // Chamfer corners — OPAQUE void (never transparent; see ServicesCardRing).
  ctx.fillStyle = VOID;
  ctx.beginPath();
  ctx.moveTo(TERRACE_BAKE_W - TERRACE_BAKE_CH, 0);
  ctx.lineTo(TERRACE_BAKE_W, 0);
  ctx.lineTo(TERRACE_BAKE_W, TERRACE_BAKE_CH);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, TERRACE_BAKE_H - TERRACE_BAKE_CH);
  ctx.lineTo(TERRACE_BAKE_CH, TERRACE_BAKE_H);
  ctx.lineTo(0, TERRACE_BAKE_H);
  ctx.closePath();
  ctx.fill();

  // Chamfered shell stroke + the two bright chamfer ticks.
  const shell = ctx.createLinearGradient(0, 0, TERRACE_BAKE_W * 0.25, TERRACE_BAKE_H);
  shell.addColorStop(0, "rgba(202, 165, 84, 0.52)");
  shell.addColorStop(0.38, `rgba(${DAWN}, 0.14)`);
  shell.addColorStop(0.66, "rgba(202, 165, 84, 0.16)");
  shell.addColorStop(1, "rgba(202, 165, 84, 0.48)");
  ctx.strokeStyle = shell;
  ctx.lineWidth = 2.5;
  traceChamferPath(ctx, 1.5);
  ctx.stroke();
  ctx.strokeStyle = "rgba(202, 165, 84, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(TERRACE_BAKE_W - TERRACE_BAKE_CH, 1.5);
  ctx.lineTo(TERRACE_BAKE_W - 1.5, TERRACE_BAKE_CH);
  ctx.moveTo(1.5, TERRACE_BAKE_H - TERRACE_BAKE_CH);
  ctx.lineTo(TERRACE_BAKE_CH, TERRACE_BAKE_H - 1.5);
  ctx.stroke();

  // Chip row — FILLED gold codename chip + index/status right.
  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.textBaseline = "middle";
  label.letterSpacing = "4.8px";
  ctx.font = `700 24px ${CARD_FONT}`;
  const chipText = projectCase.codename.toUpperCase();
  const chipTextW = ctx.measureText(chipText).width;
  const chipH = 54;
  const chipY = 70 - chipH / 2;
  const chipW = 30 + 10 + 18 + chipTextW + 30;
  ctx.fillStyle = SERVICES_GOLD;
  ctx.fillRect(PAD_X, chipY, chipW, chipH);
  ctx.fillStyle = "#110f09"; // --latent-night
  ctx.save();
  ctx.translate(PAD_X + 30 + 5, 70);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.fillText(chipText, PAD_X + 30 + 10 + 18, 72);
  label.letterSpacing = "3px";
  ctx.font = `400 22px ${CARD_FONT}`;
  ctx.fillStyle = `rgba(${DAWN}, 0.62)`;
  ctx.textAlign = "right";
  ctx.fillText(
    `${projectCase.index} / 04 · ${projectCase.status.toUpperCase()}`,
    TERRACE_BAKE_W - TERRACE_BAKE_CH - 18,
    70
  );
  ctx.textAlign = "left";

  /* ── Footer copy block (top-down; one tight block, no lede) ── */
  const maxW = TERRACE_BAKE_W - PAD_X * 2;
  ctx.textBaseline = "alphabetic";

  // Caption row — mode + tagline left (dim), headline metric right (gold).
  label.letterSpacing = "3.5px";
  ctx.font = `400 16px ${CARD_FONT}`;
  ctx.fillStyle = `rgba(${DAWN}, 0.4)`;
  const capY = 850;
  ctx.fillText(`${projectCase.mode} · ${projectCase.tagline.toUpperCase()}`, PAD_X, capY);
  if (projectCase.metric) {
    ctx.fillStyle = "rgba(202, 165, 84, 0.85)";
    ctx.textAlign = "right";
    ctx.fillText(
      `${projectCase.metric.value} ${projectCase.metric.label.toUpperCase()}`,
      PAD_X + maxW,
      capY
    );
    ctx.textAlign = "left";
  }

  // Title — the case title segments, mono bold uppercase, `em` → gold.
  label.letterSpacing = "3px";
  ctx.font = `700 38px ${CARD_FONT}`;
  const titleLines = wrapRuns(ctx, titleSegsToInk(projectCase.title), maxW);
  const TITLE_LH = 48;
  titleLines.forEach((line, i) => {
    drawRunLine(ctx, line, PAD_X, 906 + i * TITLE_LH, `rgb(${DAWN})`);
  });

  // Stack row — mono chips with gold separators (first 6 entries).
  label.letterSpacing = "3px";
  ctx.font = `400 18px ${CARD_FONT}`;
  const stackSegments: InkSeg[] = [];
  projectCase.stack.slice(0, 6).forEach((item, i) => {
    if (i > 0) stackSegments.push({ text: "·", gold: true });
    stackSegments.push({ text: item.toUpperCase() });
  });
  const stackLines = wrapRuns(ctx, stackSegments, maxW);
  stackLines.forEach((line, i) => {
    drawRunLine(ctx, line, PAD_X, 958 + i * 30, `rgba(${DAWN}, 0.5)`);
  });
  label.letterSpacing = "0px";

  return canvas;
}
