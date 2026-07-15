// caseCardBake — the portrait case-card FACE bake (ADR-036; capability band
// ADR-041; face restructured in the ADR-041 addendum). A standalone module
// producing an 840×1360 portrait canvas with the ServicesCardRing plate
// grammar — opaque void ground, a contain-fit gold-LUT screenshot band with a
// hairline frame, top + ground scrims, the chamfered shell stroke + two bright
// ticks. Face content, top → bottom: the tool NAME (title segments em→gold)
// top-left + a ✕ close top-right; the screenshot band; then a top-down copy
// flow — Challenge (heading + paragraph), Workflow Shift (heading + mode verb
// badge + paragraph), a gold divider, the Stack chip row; then the four
// CAPABILITY rows (gold `CAP 0N` index + title + wrapped desc, a measured-fit
// flex zone); and a baked pager (01 02 03 04, active gold + underlined) at the
// bottom. The ✕ and pager are baked visuals only — their transparent DOM hit
// buttons weld over them via `CASE_CARD_HIT_REGIONS` (ArcCasesHitLayer). The
// codename chip, `NN/04 · STATUS`, tagline, subline and caption row were
// dropped in the restructure. NO CTA box — the repos are private; the card is
// a showcase, not a link.
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
// Shortened 470 → 350 in the ADR-041-addendum restructure: the face now
// carries the Challenge + Workflow-Shift body copy above the CAP band, so
// the screenshot band gives up height to make room. Every case still lands
// four FULL CAP rows (measured — Heimdall, the longest, is the tight one).
const SHOT_H = 350;

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
/** Air above the pager row before the CAP band bottom. */
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

/* ── Top-down copy flow (ADR-041 addendum) ──
 * The face inverted from a bottom-anchored copy stack to a top-down flow:
 * tool-name header → image → Challenge → Workflow Shift → divider → Stack →
 * CAP band (flex) → baked pager. Body copy is sans; section headings +
 * badges + pager are mono. */
const BODY_FONT_PX = 23;
const BODY_LH = 31;
const HEADING_FONT_PX = 16;
const SECTION_GAP = 26; // air between one block and the next heading
const HEADING_GAP = 12; // air between a heading and its paragraph
const IMAGE_TO_BODY_GAP = 30; // air below the screenshot frame

/** Baked pager row (case switcher) — four ordinals centred at the bottom,
 *  the active one gold + underlined. */
const PAGER_BASELINE_Y = 1300;
const PAGER_CENTERS_X = [297, 381, 465, 549] as const;
const PAGER_TOP = PAGER_BASELINE_Y - 30; // reserve above the ordinals
/** ✕ close glyph — top-right, where the removed index/status sat, left of
 *  the top-right chamfer. */
const CLOSE_CENTER_X = BAKE_W - BAKE_CH - 26; // 762
const CLOSE_CENTER_Y = 92;

/** Shared hit-region map (fractions of the 840×1360 face) — the SINGLE
 *  source of truth for both the baked glyph positions here and the
 *  transparent DOM hit buttons welded over the card's projection
 *  (`ArcCasesHitLayer`). Keeping them in one place stops the visual and the
 *  hit target from drifting. */
const PAGER_HIT_HALF_W = 42;
const PAGER_HIT_HALF_H = 52;
const CLOSE_HIT_HALF = 42;
export const CASE_CARD_HIT_REGIONS = {
  pager: PAGER_CENTERS_X.map((cx) => ({
    x: (cx - PAGER_HIT_HALF_W) / BAKE_W,
    y: (PAGER_BASELINE_Y - 14 - PAGER_HIT_HALF_H) / BAKE_H,
    w: (PAGER_HIT_HALF_W * 2) / BAKE_W,
    h: (PAGER_HIT_HALF_H * 2) / BAKE_H,
  })),
  close: {
    x: (CLOSE_CENTER_X - CLOSE_HIT_HALF) / BAKE_W,
    y: (CLOSE_CENTER_Y - CLOSE_HIT_HALF) / BAKE_H,
    w: (CLOSE_HIT_HALF * 2) / BAKE_W,
    h: (CLOSE_HIT_HALF * 2) / BAKE_H,
  },
} as const;

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
        document.fonts.load('700 36px "PT Mono"'),
        document.fonts.load('700 16px "PT Mono"'),
        document.fonts.load('400 16px "PT Mono"'),
        document.fonts.load('400 23px "PP Neue Montreal"'),
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
 * Bake one case card face — the ServicesCardRing plate grammar in the
 * restructured case layout (ADR-041 addendum): tool-name header (em→gold) +
 * ✕ close, framed letterboxed screenshot, then the top-down flow — Challenge,
 * Workflow Shift (+ mode verb badge), divider, Stack — the measured-fit CAP
 * rows, and the baked pager. NO CTA box.
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

  // Header — tool NAME top-left (title segments, em→gold). No codename chip,
  // no index/status, no tagline/subline (ADR-041 addendum).
  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const maxW = BAKE_W - PAD_X * 2;
  ctx.textBaseline = "alphabetic";
  label.letterSpacing = "3px";
  ctx.font = `700 36px ${CARD_FONT}`;
  const headerLines = wrapRuns(ctx, titleSegsToInk(projectCase.title), maxW);
  const HEADER_LH = 46;
  headerLines.forEach((line, i) => {
    drawRunLine(ctx, line, PAD_X, 98 + i * HEADER_LH, `rgb(${DAWN})`);
  });
  label.letterSpacing = "0px";

  // ✕ close (drawn strokes → font-independent). The DOM hit button in
  // ArcCasesHitLayer is welded over this via CASE_CARD_HIT_REGIONS.close.
  const clR = 11;
  ctx.strokeStyle = `rgba(${DAWN}, 0.66)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CLOSE_CENTER_X - clR, CLOSE_CENTER_Y - clR);
  ctx.lineTo(CLOSE_CENTER_X + clR, CLOSE_CENTER_Y + clR);
  ctx.moveTo(CLOSE_CENTER_X + clR, CLOSE_CENTER_Y - clR);
  ctx.lineTo(CLOSE_CENTER_X - clR, CLOSE_CENTER_Y + clR);
  ctx.stroke();

  /* ── Top-down copy flow (ADR-041 addendum): Challenge → Workflow Shift →
     divider → Stack, flowing down from below the screenshot. A single
     cursor `y` tracks the baseline. ── */
  let y = SHOT_Y0 + SHOT_H + IMAGE_TO_BODY_GAP;

  // Section heading helper (gold mono, letter-spaced).
  const drawHeading = (text: string): void => {
    label.letterSpacing = "3.5px";
    ctx.font = `700 ${HEADING_FONT_PX}px ${CARD_FONT}`;
    ctx.fillStyle = SERVICES_GOLD;
    ctx.fillText(text, PAD_X, y + HEADING_FONT_PX);
    label.letterSpacing = "0px";
    y += HEADING_FONT_PX + HEADING_GAP;
  };

  // Body-paragraph helper (sans, dim dawn); advances `y` past the wrapped
  // block. Returns nothing — `y` is the running cursor.
  const drawBody = (text: string): void => {
    ctx.font = `400 ${BODY_FONT_PX}px ${CARD_SANS}`;
    const lines = wrapRuns(ctx, [{ text }], maxW);
    lines.forEach((line, i) => {
      drawRunLine(ctx, line, PAD_X, y + BODY_FONT_PX + i * BODY_LH, `rgba(${DAWN}, 0.72)`);
    });
    y += lines.length * BODY_LH;
  };

  // 1. Challenge.
  drawHeading("CHALLENGE");
  drawBody(projectCase.challenge);
  y += SECTION_GAP;

  // 2. Workflow Shift — heading (left) + verb badge (right) on one row, then
  //    the shift paragraph. The badge reuses the codename-chip fill recipe.
  label.letterSpacing = "3.5px";
  ctx.font = `700 ${HEADING_FONT_PX}px ${CARD_FONT}`;
  ctx.fillStyle = SERVICES_GOLD;
  ctx.textBaseline = "middle";
  const wsRowMid = y + 15;
  ctx.fillText("WORKFLOW SHIFT", PAD_X, wsRowMid);
  // Verb badge (mode) — filled gold chip, void ink, right-aligned.
  label.letterSpacing = "3px";
  ctx.font = `700 15px ${CARD_FONT}`;
  const badgeText = projectCase.mode.toUpperCase();
  const badgeTextW = ctx.measureText(badgeText).width;
  const badgePadX = 16;
  const badgeW = badgeTextW + badgePadX * 2;
  const badgeH = 30;
  const badgeX = PAD_X + maxW - badgeW;
  ctx.fillStyle = SERVICES_GOLD;
  ctx.fillRect(badgeX, wsRowMid - badgeH / 2, badgeW, badgeH);
  ctx.fillStyle = "#110f09"; // --latent-night
  ctx.textAlign = "center";
  ctx.fillText(badgeText, badgeX + badgeW / 2, wsRowMid + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  label.letterSpacing = "0px";
  y += 30 + HEADING_GAP;
  drawBody(projectCase.shift);
  y += SECTION_GAP;

  // 3. Divider — a gold hairline rule.
  ctx.fillStyle = "rgba(202, 165, 84, 0.28)";
  ctx.fillRect(PAD_X, y, maxW, 2);
  y += 2 + 24;

  // 4. Stack — mono chips with gold separators (first 6 entries).
  label.letterSpacing = "3px";
  ctx.font = `400 16px ${CARD_FONT}`;
  const stackSegments: InkSeg[] = [];
  projectCase.stack.slice(0, 6).forEach((item, i) => {
    if (i > 0) stackSegments.push({ text: "·", gold: true });
    stackSegments.push({ text: item.toUpperCase() });
  });
  const stackLines = wrapRuns(ctx, stackSegments, maxW);
  const STACK_LH = 28;
  stackLines.forEach((line, i) => {
    drawRunLine(ctx, line, PAD_X, y + 16 + i * STACK_LH, `rgba(${DAWN}, 0.5)`);
  });
  label.letterSpacing = "0px";
  y += stackLines.length * STACK_LH;

  /* ── Capability rows (ADR-041) — the flex zone between the stack and the
     baked pager. MEASURED fit: full rows if the band affords them, title-
     only if tight, skipped if there's no room — never overflowing the
     pager. ── */
  const capBandTop = y + 30;
  const capBandBottom = PAGER_TOP - CAP_BAND_BOTTOM_GAP;
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

  /* ── Pager (ADR-041 addendum) — the case switcher baked into the face; the
     ordinal equal to this case's index is gold + underlined, the rest dim.
     The DOM hit buttons in ArcCasesHitLayer weld over these via
     CASE_CARD_HIT_REGIONS.pager. ── */
  label.letterSpacing = "4px";
  ctx.font = `700 20px ${CARD_FONT}`;
  ctx.textAlign = "center";
  const activeSlot = Number(projectCase.index) - 1;
  PAGER_CENTERS_X.forEach((cx, i) => {
    const active = i === activeSlot;
    ctx.fillStyle = active ? SERVICES_GOLD : `rgba(${DAWN}, 0.45)`;
    const ordinal = `0${i + 1}`;
    ctx.fillText(ordinal, cx, PAGER_BASELINE_Y);
    if (active) {
      ctx.fillRect(cx - 16, PAGER_BASELINE_Y + 12, 32, 2);
    }
  });
  ctx.textAlign = "left";
  label.letterSpacing = "0px";

  return canvas;
}
