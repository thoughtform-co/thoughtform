// caseCardBake — the portrait case-card FACE bake (ADR-036, capability band
// added ADR-041). Restored from the ADR-033 orbit ring's inline
// `bakeCaseCardFace` (`ArcCasesRing.tsx` @ 55afc8a, lines ~104–531) into a
// standalone module: an 840×1360 portrait canvas with the ServicesCardRing
// plate grammar — opaque void ground, a contain-fit gold-LUT screenshot band
// with a hairline frame, top + ground scrims, the chamfered shell stroke +
// two bright ticks, a FILLED gold codename chip + `NN/04 · STATUS` top row,
// the four CAPABILITY rows (gold `CAP 0N` index + title + wrapped desc,
// transposed from the retired horizontal console card to fill the mid-band),
// and a bottom-anchored copy stack (stack chips → subline lede → title runs
// em→gold → caption row mode·tagline / metric gold). NO CTA box — the repos
// are private; the card is a showcase, not a link.
//
// The bake produces a `CanvasTexture` source the in-canvas card slab floats
// as its content plane (deferred until the Build band first opens or the
// store first arms; a glEpoch canvas remount re-bakes). Kept as a module so
// the card component + its lab can share one bake path.

import type { ProjectCase, TitleSegment } from "@/components/landing/v7/tools-cards/toolCardData";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";

/* ── Bake canvas constants ── */
export const BAKE_W = 840;
export const BAKE_H = 1360;
/** Chamfer cut — the plate's 26px at 2×. Top-right + bottom-left. */
export const BAKE_CH = 52;
/** Opaque void — identical to the page ground behind the canvas. */
const VOID = "#050403";
const DAWN = "236, 227, 214";

/** The screenshot window: the case PNGs are LANDSCAPE UI shots (~16:9),
 *  letterboxed (contain-fit) into a framed full-width band under the chip
 *  row — never portrait-cropped (cropping a UI screenshot destroys the
 *  read). */
const SHOT_Y0 = 170;
const SHOT_H = 470;

/* Dot-matrix hologram veil (the plate feed read). */
export const DOT_PITCH = 8;
const PHOTO_DOT_RADIUS = 2.15;
const PHOTO_DOTS_ALPHA = 0.62;
const PHOTO_SOFT_ALPHA = 0.3;
const VEIL_TOP_START = SHOT_Y0 - 20;
const VEIL_TOP_END = SHOT_Y0 + 60;
const VEIL_FADE_START = SHOT_Y0 + SHOT_H - 80;
const VEIL_FADE_END = SHOT_Y0 + SHOT_H;

const CARD_FONT = '"PT Mono", "IBM Plex Mono", ui-monospace, monospace';
const CARD_SANS = '"PP Neue Montreal", "Helvetica Neue", Arial, sans-serif';
const PAD_X = 52;

/* ── Capability band (ADR-041) ──
 * The four `capabilities` fill the gap between the screenshot window and
 * the bottom copy stack — the information the retired horizontal console
 * card (`ToolCardConsole`, ADR-030) painted as CAP rows, transposed into
 * this portrait bake. The band is a MEASURED fit: the copy stack is
 * bottom-anchored and wraps differently per case (Heimdall's title/subline
 * run longest), so the available height varies. Rows degrade full → title-
 * only → skipped and never overflow into the copy stack. */
/** Left gutter reserved for the gold `CAP 0N` index; the title + desc hang
 *  to its right. */
const CAP_GUTTER = 104;
/** Air below the screenshot frame before the first cap row. */
const CAP_BAND_TOP_GAP = 34;
/** Air above the caption row (which sits ~16px tall on the `capY` baseline). */
const CAP_BAND_BOTTOM_GAP = 28;
/** Title line box height + baseline ascent within it. */
const CAP_TITLE_LH = 30;
const CAP_TITLE_ASCENT = 21;
/** Desc line height; desc wraps to at most this many lines. */
const CAP_DESC_LH = 24;
const CAP_DESC_MAX_LINES = 2;
/** Gap between one cap's box and the next. */
const CAP_ROW_GAP = 15;
/** Row height when only the title is drawn (degraded tier). */
const CAP_TITLE_ONLY_LH = 34;

/** Dot-matrix veil tile (one column, repeated horizontally by the texture). */
export function buildVeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = DOT_PITCH;
  canvas.height = BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const between = 1 - PHOTO_SOFT_ALPHA;
  const gradient = ctx.createLinearGradient(0, 0, 0, BAKE_H);
  gradient.addColorStop(0, "rgba(5, 4, 3, 0)");
  gradient.addColorStop(VEIL_TOP_START / BAKE_H, "rgba(5, 4, 3, 0)");
  gradient.addColorStop(VEIL_TOP_END / BAKE_H, `rgba(5, 4, 3, ${between})`);
  gradient.addColorStop(VEIL_FADE_START / BAKE_H, `rgba(5, 4, 3, ${between})`);
  gradient.addColorStop(VEIL_FADE_END / BAKE_H, "rgba(5, 4, 3, 0)");
  gradient.addColorStop(1, "rgba(5, 4, 3, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, DOT_PITCH, BAKE_H);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0, 0, 0, ${PHOTO_DOTS_ALPHA / (1 - PHOTO_SOFT_ALPHA)})`;
  for (let y = 0; y < BAKE_H; y += DOT_PITCH) {
    ctx.beginPath();
    ctx.arc(DOT_PITCH / 2, y + DOT_PITCH / 2, PHOTO_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

/** Soft radial gold sprite for the behind-card glow. */
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

/** Gold-tone LUT — the plate photo treatment (see ServicesCardRing). */
function buildGoldToneLut(): { r: Uint8ClampedArray; g: Uint8ClampedArray; b: Uint8ClampedArray } {
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

function traceChamferPath(ctx: CanvasRenderingContext2D, inset: number): void {
  const x = inset;
  const y = inset;
  const w = BAKE_W - inset * 2;
  const h = BAKE_H - inset * 2;
  const ch = BAKE_CH;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - ch, y);
  ctx.lineTo(x + w, y + ch);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + ch, y + h);
  ctx.lineTo(x, y + h - ch);
  ctx.closePath();
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`caseCardBake: failed to load ${src}`));
    img.src = src;
  });
}

let caseImagesPrefetched = false;

/** Warm the HTTP cache for the four case screenshots (~130 kB webp total)
 *  as soon as the corridor mounts, so the deferred Build-park bake isn't a
 *  cold four-image burst the first time the cases arm. Idempotent; errors
 *  are ignored (the bake has its own dot-grid stand-in). */
export function prefetchCaseCardImages(cases: ReadonlyArray<{ image: { src: string } }>): void {
  if (caseImagesPrefetched || typeof document === "undefined") return;
  caseImagesPrefetched = true;
  for (const projectCase of cases) {
    const img = new Image();
    img.decoding = "async";
    img.src = projectCase.image.src;
  }
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

type InkRun = { text: string; gold: boolean };
type InkSeg = { text: string; gold?: boolean };

/** Greedy word-wrap over styled runs — emphasis (upright gold) survives. */
function wrapRuns(
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

function drawRunLine(
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

function titleSegsToInk(segments: readonly TitleSegment[]): InkSeg[] {
  return segments.map((seg) => ({ text: seg.text.toUpperCase(), gold: seg.em }));
}

/**
 * Bake one case card face — the ServicesCardRing plate grammar in the case
 * layout: codename chip + index/status (top), framed letterboxed screenshot
 * window, then the bottom-anchored copy stack (stack chips, subline lede,
 * title segments em→gold, caption row mode·tagline / headline metric gold).
 * NO CTA box.
 */
export function bakeCaseCardFace(
  projectCase: ProjectCase,
  img: HTMLImageElement | null
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = BAKE_W;
  canvas.height = BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Ground — opaque void everywhere; the screenshot never covers the card.
  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);

  // Screenshot window — letterbox (contain) the landscape UI shot into the
  // full-width band, gold-toned via the LUT.
  if (img) {
    const scale = Math.min(BAKE_W / img.naturalWidth, SHOT_H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (BAKE_W - dw) / 2;
    const dy = SHOT_Y0 + (SHOT_H - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    const lut = buildGoldToneLut();
    const clampedX = Math.max(0, Math.floor(dx));
    const clampedY = Math.max(0, Math.floor(dy));
    const data = ctx.getImageData(
      clampedX,
      clampedY,
      Math.min(BAKE_W - clampedX, Math.ceil(dw)),
      Math.min(BAKE_H - clampedY, Math.ceil(dh))
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
  } else {
    // Schematic dot-grid stand-in — never a raw void card.
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
        ctx.fillRect(0, SHOT_Y0, BAKE_W, SHOT_H);
      }
    }
  }

  // Hairline frame around the screenshot window.
  ctx.strokeStyle = "rgba(202, 165, 84, 0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, SHOT_Y0, BAKE_W - 2, SHOT_H);

  // Scrims — chip row leads at top; solid ground under the copy stack.
  const top = ctx.createLinearGradient(0, 0, 0, 190);
  top.addColorStop(0, "rgba(5, 4, 3, 0.78)");
  top.addColorStop(1, "rgba(5, 4, 3, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, BAKE_W, 190);
  const ground = ctx.createLinearGradient(0, SHOT_Y0 + SHOT_H - 60, 0, BAKE_H);
  ground.addColorStop(0, "rgba(5, 4, 3, 0)");
  ground.addColorStop(0.2, "rgba(5, 4, 3, 0.58)");
  ground.addColorStop(0.45, "rgba(5, 4, 3, 0.92)");
  ground.addColorStop(1, "rgba(5, 4, 3, 0.97)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, SHOT_Y0 + SHOT_H - 60, BAKE_W, BAKE_H - (SHOT_Y0 + SHOT_H - 60));

  // Chamfer corners — OPAQUE void (never transparent).
  ctx.fillStyle = VOID;
  ctx.beginPath();
  ctx.moveTo(BAKE_W - BAKE_CH, 0);
  ctx.lineTo(BAKE_W, 0);
  ctx.lineTo(BAKE_W, BAKE_CH);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H);
  ctx.lineTo(0, BAKE_H);
  ctx.closePath();
  ctx.fill();

  // Chamfered shell stroke + the two bright chamfer ticks.
  const shell = ctx.createLinearGradient(0, 0, BAKE_W * 0.25, BAKE_H);
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
  ctx.moveTo(BAKE_W - BAKE_CH, 1.5);
  ctx.lineTo(BAKE_W - 1.5, BAKE_CH);
  ctx.moveTo(1.5, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H - 1.5);
  ctx.stroke();

  // Chip row — FILLED gold codename chip + index/status right.
  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.textBaseline = "middle";
  label.letterSpacing = "4.8px";
  ctx.font = `700 24px ${CARD_FONT}`;
  const chipText = projectCase.codename.toUpperCase();
  const chipTextW = ctx.measureText(chipText).width;
  const chipH = 54;
  const chipY = 74 - chipH / 2;
  const chipW = 30 + 10 + 18 + chipTextW + 30;
  ctx.fillStyle = SERVICES_GOLD;
  ctx.fillRect(44, chipY, chipW, chipH);
  ctx.fillStyle = "#110f09"; // --latent-night
  ctx.save();
  ctx.translate(44 + 30 + 5, 74);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.fillText(chipText, 44 + 30 + 10 + 18, 76);
  label.letterSpacing = "3px";
  ctx.font = `400 22px ${CARD_FONT}`;
  ctx.fillStyle = `rgba(${DAWN}, 0.62)`;
  ctx.textAlign = "right";
  ctx.fillText(
    `${projectCase.index}/04 · ${projectCase.status.toUpperCase()}`,
    BAKE_W - BAKE_CH - 18,
    74
  );
  ctx.textAlign = "left";

  /* ── Copy stack — bottom-anchored (no CTA box). ── */
  const maxW = BAKE_W - PAD_X * 2;
  ctx.textBaseline = "alphabetic";

  // Stack row — mono chips with gold separators (first 6 entries).
  label.letterSpacing = "3px";
  ctx.font = `400 18px ${CARD_FONT}`;
  const stackSegments: InkSeg[] = [];
  projectCase.stack.slice(0, 6).forEach((item, i) => {
    if (i > 0) stackSegments.push({ text: "·", gold: true });
    stackSegments.push({ text: item.toUpperCase() });
  });
  const stackLines = wrapRuns(ctx, stackSegments, maxW);
  const STACK_LH = 30;
  const stackBottom = BAKE_H - 56;
  stackLines.forEach((line, i) => {
    drawRunLine(
      ctx,
      line,
      PAD_X,
      stackBottom - (stackLines.length - 1 - i) * STACK_LH,
      `rgba(${DAWN}, 0.5)`
    );
  });
  const stackTop = stackBottom - (stackLines.length - 1) * STACK_LH - 22;

  // Lede — the subline sentence, sans, em-free (dim dawn).
  label.letterSpacing = "0px";
  ctx.font = `400 27px ${CARD_SANS}`;
  const ledeLines = wrapRuns(ctx, [{ text: projectCase.subline }], maxW);
  const LEDE_LH = 40;
  const ledeBottom = stackTop - 26;
  ledeLines.forEach((line, i) => {
    drawRunLine(
      ctx,
      line,
      PAD_X,
      ledeBottom - (ledeLines.length - 1 - i) * LEDE_LH,
      `rgba(${DAWN}, 0.7)`
    );
  });
  const ledeTop = ledeBottom - (ledeLines.length - 1) * LEDE_LH - 28;

  // Title — the case title segments, mono bold uppercase, em → gold.
  label.letterSpacing = "3px";
  ctx.font = `700 34px ${CARD_FONT}`;
  const titleLines = wrapRuns(ctx, titleSegsToInk(projectCase.title), maxW);
  const TITLE_LH = 46;
  const titleBottom = ledeTop - 26;
  titleLines.forEach((line, i) => {
    drawRunLine(
      ctx,
      line,
      PAD_X,
      titleBottom - (titleLines.length - 1 - i) * TITLE_LH,
      `rgb(${DAWN})`
    );
  });
  const titleTop = titleBottom - (titleLines.length - 1) * TITLE_LH - 34;

  // Caption row — mode + tagline left (dim), headline metric right (gold).
  label.letterSpacing = "3.5px";
  ctx.font = `400 16px ${CARD_FONT}`;
  ctx.fillStyle = `rgba(${DAWN}, 0.4)`;
  const capY = titleTop - 24;
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
  label.letterSpacing = "0px";

  /* ── Capability rows (ADR-041) — fill the band between the screenshot and
     the copy stack with the four capabilities (from the retired console
     card). MEASURED fit: full rows if the band affords them, title-only if
     tight, skipped if there's no room — never overflowing the copy stack. ── */
  const capBandTop = SHOT_Y0 + SHOT_H + CAP_BAND_TOP_GAP;
  const capBandBottom = capY - 16 - CAP_BAND_BOTTOM_GAP;
  const capBandH = capBandBottom - capBandTop;
  const capBodyX = PAD_X + CAP_GUTTER;
  const capBodyW = maxW - CAP_GUTTER;

  // Wrap each capability's desc at the body width (desc font), capped.
  ctx.font = `400 16px ${CARD_SANS}`;
  const capDescLines = projectCase.capabilities.map((cap) =>
    wrapRuns(ctx, [{ text: cap.desc }], capBodyW).slice(0, CAP_DESC_MAX_LINES)
  );
  const fullTotal =
    capDescLines.reduce((sum, lines) => sum + CAP_TITLE_LH + lines.length * CAP_DESC_LH, 0) +
    (projectCase.capabilities.length - 1) * CAP_ROW_GAP;
  const titleOnlyTotal = projectCase.capabilities.length * CAP_TITLE_ONLY_LH;
  const capTier: "full" | "title" | "none" =
    fullTotal <= capBandH ? "full" : titleOnlyTotal <= capBandH ? "title" : "none";

  if (capTier !== "none" && capBandH > 0) {
    let boxTop = capBandTop;
    projectCase.capabilities.forEach((cap, i) => {
      const baseline = boxTop + CAP_TITLE_ASCENT;
      // Index — gold mono.
      label.letterSpacing = "2px";
      ctx.font = `700 15px ${CARD_FONT}`;
      ctx.fillStyle = SERVICES_GOLD;
      ctx.fillText(`CAP 0${i + 1}`, PAD_X, baseline);
      // Title — mono bold, bright dawn.
      label.letterSpacing = "0.5px";
      ctx.font = `700 18px ${CARD_FONT}`;
      ctx.fillStyle = `rgb(${DAWN})`;
      ctx.fillText(cap.title, capBodyX, baseline);
      if (capTier === "full") {
        label.letterSpacing = "0px";
        ctx.font = `400 16px ${CARD_SANS}`;
        capDescLines[i].forEach((line, k) => {
          drawRunLine(ctx, line, capBodyX, baseline + (k + 1) * CAP_DESC_LH, `rgba(${DAWN}, 0.5)`);
        });
        boxTop += CAP_TITLE_LH + capDescLines[i].length * CAP_DESC_LH + CAP_ROW_GAP;
      } else {
        boxTop += CAP_TITLE_ONLY_LH;
      }
    });
    label.letterSpacing = "0px";
  }

  return canvas;
}
