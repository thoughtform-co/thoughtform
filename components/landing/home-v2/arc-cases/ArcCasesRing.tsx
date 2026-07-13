"use client";

/**
 * ArcCasesRing — the four production cases (Mímir / Vesper / Babylon /
 * Heimdall) as transparent DEVICE SLABS orbiting the Build-park accretion
 * sphere (ADR-033). A copy-adjusted SIBLING of `ServicesCardRing` (ADR-029)
 * — same device anatomy, bake grammar, hover behavior, and depth contracts;
 * deliberately NOT a generalization of that 3-day-old production component
 * (a shared device-slab primitive is a recorded follow-up in ADR-033).
 *
 * What differs from the services ring — the ownership model:
 *   - CLICK-owned, not scroll-owned. `arcCasesStore` holds `armed` + a
 *     cumulative `caseIndex`; a damped ARM LEVEL (the orbit's only clock)
 *     plays one reversible entrance envelope in and out, and the rotation
 *     targets `rotationForCaseIndex` through the shipped ring spring.
 *     There is no runway staircase and no exit table.
 *   - Scroll GATES rather than drives: `bandGetter` (production: the
 *     Build-band × epilogue-kill × dissipate-guard product assembled at the
 *     mount) multiplies everything, so walking out of the Build park
 *     collapses the orbit no matter what the store says.
 *   - Bake is DEFERRED: faces bake when the Build band first opens (or on
 *     first arm), so visitors who never reach the park never fetch the
 *     case screenshots. Labs pass `preload` for immediate faces.
 *
 * Motion contract (ADR-021): rotation moves only on user input (case
 * stepping) through the hard-bounded underdamped spring; the decaying
 * settle is the only idle motion. No wall-clock term anywhere.
 *
 * DEVICE ANATOMY, renderOrder, depth-write hysteresis, opaque-void
 * chamfers, NormalBlending: identical to ServicesCardRing — see that
 * module's header for the full rationale. Everything stays below the
 * mark's point pass (renderOrder 1); only the near-front card's CONTENT
 * plane writes depth.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { buildCardTrackOrbits } from "../services/hologram/cardTrackOrbits";
import { HologramOrbits } from "../services/hologram/HologramOrbits";

import {
  PROJECT_CASES,
  type ProjectCase,
  type TitleSegment,
} from "@/components/landing/v7/tools-cards/toolCardData";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { useHologramConnectors, type ArcRingCardAnchor } from "@/lib/stores/hologramConnectorStore";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import {
  ARC_ARM_RATE,
  ARC_CARD_HEIGHT,
  ARC_ENTRANCE_RADIUS_FROM,
  ARC_RING_COUNT,
  ARC_RING_Y_OFFSET,
  armEnvelope,
  dampLevel,
  rotationForCaseIndex,
} from "@/lib/arc-cases/orbitMath";
import {
  RING_CARD_ASPECT,
  RING_CONTENT_LIFT,
  RING_EDGE_GLINT_OPACITY,
  RING_FACING_BLEND,
  RING_GLASS_EDGE_OPACITY,
  RING_GLASS_OPACITY,
  RING_GLOW_OPACITY,
  RING_OPACITY_RANGE,
  RING_OPACITY_WINDOW,
  RING_ORBIT_BASE_RADIUS,
  RING_ORBIT_RADIUS_SPREAD,
  RING_ORBIT_TILT_AMP,
  RING_SCALE_RANGE,
  RING_SLAB_BEZEL,
  RING_SLAB_CHAMFER_FRAC,
  RING_SLAB_DEPTH,
  RING_SPRING_OMEGA,
  RING_SPRING_ZETA,
  RING_SWAY_CAP_RAD,
  buildCardOrbitGeometries,
  cardFacingYaw,
  depthOpacity,
  depthScale,
  depthWriteGate,
  frontCardIndex,
  frontPoseBias,
  placeCardOnOrbit,
  smootherstep,
  stepRingSpring,
  type RingSpringState,
} from "@/lib/services-ring/ringMath";

/** Publish hit rects / enable hover only once the orbit is essentially
 *  fully armed — the ServicesCardRing ANCHOR_PUBLISH threshold, re-based
 *  onto the effective level. */
const ANCHOR_PUBLISH_LEVEL = 0.85;

/** Wall-clock gap treated as an idle resume (see ServicesCardRing —
 *  ADR-029 Update 5: conditional snap, never on ordinary frame hitches). */
const RESUME_IDLE_GAP_MS = 500;

/* ── Card-face bake (the services plate grammar, case-shaped) ──────────── */

const BAKE_W = 840;
const BAKE_H = 1360;
/** Chamfer cut — the plate's 26px at 2×. Top-right + bottom-left. */
const BAKE_CH = 52;
/** Opaque void — identical to the page ground behind the canvas. */
const VOID = "#050403";
const DAWN = "236, 227, 214";

/** The screenshot window: the case PNGs are LANDSCAPE UI shots (~16:9),
 *  letterboxed (contain-fit) into a framed full-width band under the chip
 *  row — never portrait-cropped (cropping a UI screenshot destroys the
 *  read; the services photos are portrait so they cover-fit instead). */
const SHOT_Y0 = 170;
const SHOT_H = 470;

/* Dot-matrix hologram veil (the plate feed read) — same alpha math as
 * ServicesCardRing.buildVeilCanvas, with the vertical profile re-fit to
 * the screenshot band: crisp chip row above, clear copy stack below. */
const PHOTO_DOT_PITCH = 8;
const PHOTO_DOT_RADIUS = 2.15;
const PHOTO_DOTS_ALPHA = 0.62;
const PHOTO_SOFT_ALPHA = 0.3;
const VEIL_TOP_START = SHOT_Y0 - 20;
const VEIL_TOP_END = SHOT_Y0 + 60;
const VEIL_FADE_START = SHOT_Y0 + SHOT_H - 80;
const VEIL_FADE_END = SHOT_Y0 + SHOT_H;

/** Hover-resolved veil residue + damp rate (ServicesCardRing values). */
const RING_VEIL_HOVER_LEVEL = 0.18;
const VEIL_DAMP_RATE = 7;

/** Hover tilt amplitudes (rad) — pointer-driven, damped, bounded. */
const RING_HOVER_TILT_PITCH = 0.11;
const RING_HOVER_TILT_YAW = 0.2;

function buildVeilCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_DOT_PITCH;
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
  ctx.fillRect(0, 0, PHOTO_DOT_PITCH, BAKE_H);
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = `rgba(0, 0, 0, ${PHOTO_DOTS_ALPHA / (1 - PHOTO_SOFT_ALPHA)})`;
  for (let y = 0; y < BAKE_H; y += PHOTO_DOT_PITCH) {
    ctx.beginPath();
    ctx.arc(PHOTO_DOT_PITCH / 2, y + PHOTO_DOT_PITCH / 2, PHOTO_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`ArcCasesRing: failed to load ${src}`));
    img.src = src;
  });
}

async function waitForCardFonts(): Promise<void> {
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

const CARD_FONT = '"PT Mono", "IBM Plex Mono", ui-monospace, monospace';
const CARD_SANS = '"PP Neue Montreal", "Helvetica Neue", Arial, sans-serif';

const PAD_X = 52;

type InkRun = { text: string; gold: boolean };
type InkSeg = { text: string; gold?: boolean };

/** Greedy word-wrap over styled runs — emphasis (upright gold, never
 *  italics) survives wrapping. */
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
 * Bake one case card face — the ServicesCardRing plate grammar with the
 * case layout: codename chip + index/status (top), framed letterboxed
 * screenshot window, then the bottom-anchored copy stack (mode + tagline
 * caption row with the headline metric, title segments, subline lede,
 * stack chips). NO CTA box — the repos are private; the front card is a
 * showcase, not a link (`RING_CARD_CTA_BOX` is deliberately not
 * replicated).
 */
function bakeCaseCardFace(
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
  // full-width band, gold-toned via the LUT. The letterbox bars stay void
  // (they read as the device frame).
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
    // Schematic dot-grid stand-in — the ring never shows a raw void card.
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

  // Hairline frame around the screenshot window (the "framed" read).
  ctx.strokeStyle = "rgba(202, 165, 84, 0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, SHOT_Y0, BAKE_W - 2, SHOT_H);

  // Scrims — chip row leads at the top; solid ground under the copy stack.
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

  // Chamfer corners — OPAQUE void (never transparent; see ServicesCardRing).
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

  /* ── Copy stack — bottom-anchored (no CTA box; the stack row sits
     lowest, the caption row highest — the services plate order minus the
     link). ── */
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

  // Lede — the subline sentence, sans, `em`-free (dim dawn).
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

  // Title — the case title segments, mono bold uppercase, `em` → gold.
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

  return canvas;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export interface ArcCasesRingProps {
  /** Instrument scale — the armillary scale, so ring radii live in the
   *  same orbit-config space as the accretion shell (corridor: 0.62). */
  scale?: number;
  /** Scroll-owned visibility gate 0..1 (Build band × epilogue kill ×
   *  dissipate guard), assembled at the mount. Default 1 (labs). */
  bandGetter?: () => number;
  /** Bake the card faces immediately (labs). Production defers the bake
   *  until the band first opens or the store first arms. */
  preload?: boolean;
  /** Drive the arm level directly (lab slider). Null = the real path:
   *  damped toward the store's `armed`. */
  levelOverride?: number | null;
  /** Publish per-card screen rects to
   *  `hologramConnectorStore.arcRingAnchors` (production hit-areas). */
  publishAnchors?: boolean;
  facingBlend?: number;
  masterOpacity?: number;
  /* Look-dev tunables — defaults are the ringMath/orbitMath constants. */
  armRate?: number;
  entranceRadiusFrom?: number;
  cardHeight?: number;
  yOffset?: number;
  springOmega?: number;
  springZeta?: number;
  swayCap?: number;
  opacityRange?: readonly [number, number];
  scaleRange?: readonly [number, number];
  opacityWindow?: readonly [number, number];
  orbitBase?: number;
  orbitSpread?: number;
  orbitTiltAmp?: number;
  trackOpacityMul?: number;
  slabDepth?: number;
  bezelMargin?: number;
  glassOpacity?: number;
  glassEdgeOpacity?: number;
  glintOpacity?: number;
  glowOpacity?: number;
}

export function ArcCasesRing({
  scale = 1,
  bandGetter,
  preload = false,
  levelOverride = null,
  publishAnchors = false,
  facingBlend = RING_FACING_BLEND,
  masterOpacity = 1,
  armRate = ARC_ARM_RATE,
  entranceRadiusFrom = ARC_ENTRANCE_RADIUS_FROM,
  cardHeight = ARC_CARD_HEIGHT,
  yOffset = ARC_RING_Y_OFFSET,
  springOmega = RING_SPRING_OMEGA,
  springZeta = RING_SPRING_ZETA,
  swayCap = RING_SWAY_CAP_RAD,
  opacityRange = RING_OPACITY_RANGE,
  scaleRange = RING_SCALE_RANGE,
  opacityWindow = RING_OPACITY_WINDOW,
  orbitBase = RING_ORBIT_BASE_RADIUS,
  orbitSpread = RING_ORBIT_RADIUS_SPREAD,
  orbitTiltAmp = RING_ORBIT_TILT_AMP,
  trackOpacityMul = 1,
  slabDepth = RING_SLAB_DEPTH,
  bezelMargin = RING_SLAB_BEZEL,
  glassOpacity = RING_GLASS_OPACITY,
  glassEdgeOpacity = RING_GLASS_EDGE_OPACITY,
  glintOpacity = RING_EDGE_GLINT_OPACITY,
  glowOpacity = RING_GLOW_OPACITY,
}: ArcCasesRingProps) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const setArcRingAnchors = useHologramConnectors((s) => s.setArcRingAnchors);

  const [bakeRequested, setBakeRequested] = useState(preload);
  const [textures, setTextures] = useState<THREE.CanvasTexture[] | null>(null);
  const cardGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]);
  const matRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const depthWriteRef = useRef<boolean[]>(new Array(ARC_RING_COUNT).fill(false));
  const springRef = useRef<RingSpringState>({ pos: 0, vel: 0 });
  const armLevelRef = useRef(0);
  const effLevelRef = useRef(0);
  const lastWallRef = useRef(-1);
  const anchorsClearedRef = useRef(true);
  const cornerLocal = useRef(new THREE.Vector3());
  const cornerWorld = useRef(new THREE.Vector3());

  const cardW = cardHeight * RING_CARD_ASPECT;
  const slabW = cardW + bezelMargin * 2;
  const slabH = cardHeight + bezelMargin * 2;

  /* ── Per-card orbital tracks (the ADR-029 Update-1 armillary read) ── */
  const cardOrbitGeoms = useMemo(
    () => buildCardOrbitGeometries(orbitBase, orbitSpread, orbitTiltAmp),
    [orbitBase, orbitSpread, orbitTiltAmp]
  );
  const cardTracks = useMemo(
    () => buildCardTrackOrbits(cardOrbitGeoms, { opacityMul: trackOpacityMul }),
    [cardOrbitGeoms, trackOpacityMul]
  );

  /* ── Shared device geometry ── */
  const slabGeometry = useMemo(() => {
    const ch = slabW * RING_SLAB_CHAMFER_FRAC;
    const hw = slabW / 2;
    const hh = slabH / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, hh);
    shape.lineTo(hw - ch, hh);
    shape.lineTo(hw, hh - ch);
    shape.lineTo(hw, -hh);
    shape.lineTo(-hw + ch, -hh);
    shape.lineTo(-hw, -hh + ch);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: slabDepth,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -slabDepth / 2);
    return geometry;
  }, [slabW, slabH, slabDepth]);
  const glintGeometry = useMemo(() => new THREE.EdgesGeometry(slabGeometry), [slabGeometry]);
  useEffect(() => {
    return () => {
      slabGeometry.dispose();
      glintGeometry.dispose();
    };
  }, [slabGeometry, glintGeometry]);

  const veilTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(buildVeilCanvas());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(BAKE_W / PHOTO_DOT_PITCH, 1);
    return texture;
  }, []);
  useEffect(() => {
    return () => veilTexture.dispose();
  }, [veilTexture]);

  const glowTexture = useMemo(() => {
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
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => {
    return () => glowTexture.dispose();
  }, [glowTexture]);

  /* ── Per-card device materials ── */
  const slabMaterials = useMemo(
    () =>
      PROJECT_CASES.map(() => {
        const shared = {
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true,
          blending: THREE.NormalBlending,
          toneMapped: false,
          side: THREE.FrontSide,
        } as const;
        return [
          new THREE.MeshBasicMaterial({ ...shared, color: new THREE.Color("#14110c") }),
          new THREE.MeshBasicMaterial({ ...shared, color: new THREE.Color(SERVICES_GOLD) }),
        ] as [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial];
      }),
    []
  );
  const glintMaterials = useMemo(
    () =>
      PROJECT_CASES.map(
        () =>
          new THREE.LineBasicMaterial({
            color: new THREE.Color(SERVICES_GOLD),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          })
      ),
    []
  );
  const glowMaterials = useMemo(
    () =>
      PROJECT_CASES.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: glowTexture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending,
            toneMapped: false,
          })
      ),
    [glowTexture]
  );
  const veilMaterials = useMemo(
    () =>
      PROJECT_CASES.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: veilTexture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            depthTest: true,
            blending: THREE.NormalBlending,
            toneMapped: false,
          })
      ),
    [veilTexture]
  );
  useEffect(() => {
    return () => {
      for (const [caps, walls] of slabMaterials) {
        caps.dispose();
        walls.dispose();
      }
      for (const material of glintMaterials) material.dispose();
      for (const material of glowMaterials) material.dispose();
      for (const material of veilMaterials) material.dispose();
    };
  }, [slabMaterials, glintMaterials, glowMaterials, veilMaterials]);

  // Hover-resolve + hover tilt (window-level pointer; the canvas stays
  // pointer-events: none — the ServicesCardRing pattern verbatim).
  const pointerPxRef = useRef({ x: -1, y: -1 });
  const hoverRectsRef = useRef<
    Array<{ x: number; y: number; w: number; h: number; nz: number } | null>
  >(new Array(ARC_RING_COUNT).fill(null));
  const veilLevelRef = useRef<number[]>(new Array(ARC_RING_COUNT).fill(1));
  const hoverTiltRef = useRef<Array<{ pitch: number; yaw: number }>>(
    Array.from({ length: ARC_RING_COUNT }, () => ({ pitch: 0, yaw: 0 }))
  );
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointerPxRef.current.x = event.clientX;
      pointerPxRef.current.y = event.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Deferred bake trigger — arm from the store even before the band opens
  // (first click can precede the band getter's rise on teleport jumps).
  useEffect(() => {
    if (bakeRequested) return;
    if (useArcCasesStore.getState().armed) {
      setBakeRequested(true);
      return;
    }
    return useArcCasesStore.subscribe((s) => {
      if (s.armed) setBakeRequested(true);
    });
  }, [bakeRequested]);

  // Bake the four case faces once requested (fonts + screenshots awaited;
  // a glEpoch canvas remount re-runs this effect and re-bakes).
  useEffect(() => {
    if (!bakeRequested) return;
    let disposed = false;
    (async () => {
      await waitForCardFonts();
      const baked = await Promise.all(
        PROJECT_CASES.map(async (projectCase) => {
          let img: HTMLImageElement | null = null;
          try {
            img = await loadImage(projectCase.image.src);
          } catch {
            img = null; // schematic fallback keeps the ring whole
          }
          return bakeCaseCardFace(projectCase, img);
        })
      );
      if (disposed) return;
      const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 1;
      setTextures(
        baked.map((canvas) => {
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(8, maxAniso);
          texture.needsUpdate = true;
          return texture;
        })
      );
    })();
    return () => {
      disposed = true;
    };
  }, [gl, bakeRequested]);

  useEffect(() => {
    if (!textures) return;
    return () => {
      for (const texture of textures) texture.dispose();
    };
  }, [textures]);

  // Clear published rects (and the DOM level) when the ring unmounts.
  useEffect(() => {
    return () => {
      if (publishAnchors && !anchorsClearedRef.current) setArcRingAnchors([]);
      arcCasesLevelRef.current.level = 0;
    };
  }, [publishAnchors, setArcRingAnchors]);

  useFrame((_, delta) => {
    const now = performance.now();
    const gap = lastWallRef.current < 0 ? Infinity : now - lastWallRef.current;
    lastWallRef.current = now;
    const resumed = gap > RESUME_IDLE_GAP_MS;

    const { armed, caseIndex } = useArcCasesStore.getState();

    // The arm level — the orbit's one clock. Damped toward the store (or
    // driven directly by the lab override); an idle resume snaps it (a
    // half-played envelope after a frameloop sleep reads as self-motion).
    if (levelOverride !== null) {
      armLevelRef.current = Math.max(0, Math.min(1, levelOverride));
    } else {
      const target = armed ? 1 : 0;
      armLevelRef.current = resumed
        ? target
        : dampLevel(armLevelRef.current, target, delta, armRate);
      if (armLevelRef.current < 0.001 && !armed) armLevelRef.current = 0;
      if (armLevelRef.current > 0.999 && armed) armLevelRef.current = 1;
    }

    // Scroll-owned gate — collapses the orbit off-band regardless of the
    // store (belt-and-suspenders under the CTA's auto-disarm watcher).
    const band = bandGetter ? bandGetter() : 1;
    const eff = armLevelRef.current * band;
    effLevelRef.current = eff;
    arcCasesLevelRef.current.level = eff;

    // Deferred bake: kick the face bake as soon as the Build band opens,
    // so the textures are ready before the visitor can click the CTA.
    if (!bakeRequested && band > 0.01) setBakeRequested(true);

    // Click-owned rotation through the bounded spring (conditional snap on
    // idle resume — the ADR-029 Update-5 teleport lesson).
    const target = rotationForCaseIndex(caseIndex);
    const snap = resumed && Math.abs(target - springRef.current.pos) > swayCap;
    if (resumed && !snap) springRef.current.vel = 0;
    const spring = stepRingSpring(springRef.current, target, delta, {
      omega: springOmega,
      zeta: springZeta,
      cap: swayCap,
      snap,
    });
    const front = frontCardIndex(spring.pos);

    const engaged = eff >= ANCHOR_PUBLISH_LEVEL;
    const anchors: ArcRingCardAnchor[] = [];

    // Hovered card from LAST frame's projected rects.
    let hovered = -1;
    if (engaged) {
      const pointer = pointerPxRef.current;
      let bestNz = -Infinity;
      for (let i = 0; i < ARC_RING_COUNT; i++) {
        const rect = hoverRectsRef.current[i];
        if (!rect) continue;
        if (
          pointer.x >= rect.x &&
          pointer.x <= rect.x + rect.w &&
          pointer.y >= rect.y &&
          pointer.y <= rect.y + rect.h &&
          rect.nz > bestNz
        ) {
          bestNz = rect.nz;
          hovered = i;
        }
      }
    }

    for (let i = 0; i < ARC_RING_COUNT; i++) {
      const cardGroup = cardGroupRefs.current[i];
      const mesh = meshRefs.current[i];
      const material = matRefs.current[i];
      if (!cardGroup || !mesh || !material) continue;

      // ONE reversible clock: the arm envelope plays the staggered fly-in
      // off the damped level, and plays itself backwards on disarm. The
      // band multiplies opacity only (a scroll-out mid-arm fades in place
      // rather than re-flying).
      const env = armEnvelope(armLevelRef.current, i, entranceRadiusFrom);
      const placed = placeCardOnOrbit(i, spring.pos, cardOrbitGeoms[i], {
        yOffset,
        radiusMul: env.radiusMul,
      });

      const tilt = hoverTiltRef.current[i];
      let tiltTargetPitch = 0;
      let tiltTargetYaw = 0;
      const hoverRect = hoverRectsRef.current[i];
      if (i === hovered && hoverRect) {
        const pointer = pointerPxRef.current;
        const nx = Math.max(
          -1,
          Math.min(1, (pointer.x - (hoverRect.x + hoverRect.w / 2)) / (hoverRect.w / 2))
        );
        const ny = Math.max(
          -1,
          Math.min(1, (pointer.y - (hoverRect.y + hoverRect.h / 2)) / (hoverRect.h / 2))
        );
        tiltTargetYaw = nx * RING_HOVER_TILT_YAW;
        tiltTargetPitch = -ny * RING_HOVER_TILT_PITCH;
      }
      const tiltK = Math.min(1, delta * VEIL_DAMP_RATE);
      tilt.pitch += (tiltTargetPitch - tilt.pitch) * tiltK;
      tilt.yaw += (tiltTargetYaw - tilt.yaw) * tiltK;

      const bias = frontPoseBias(placed.nz);
      cardGroup.position.set(placed.x, placed.y, placed.z);
      cardGroup.rotation.set(
        tilt.pitch + bias.pitch,
        cardFacingYaw(placed.rotY, facingBlend) + tilt.yaw + bias.yaw,
        0
      );
      cardGroup.scale.setScalar(depthScale(placed.nz, scaleRange));

      const depthO = depthOpacity(placed.nz, opacityRange, opacityWindow);
      const master = env.opacity * band * masterOpacity;
      const opacity = depthO * master;
      material.opacity = opacity;
      slabMaterials[i][0].opacity = glassOpacity * depthO * master;
      slabMaterials[i][1].opacity = glassEdgeOpacity * depthO * master;
      glintMaterials[i].opacity = glintOpacity * depthO * master;
      glowMaterials[i].opacity = glowOpacity * smootherstep(0.35, 0.95, placed.nz) * master;
      const veilTarget = i === hovered ? RING_VEIL_HOVER_LEVEL : 1;
      veilLevelRef.current[i] +=
        (veilTarget - veilLevelRef.current[i]) * Math.min(1, delta * VEIL_DAMP_RATE);
      veilMaterials[i].opacity = veilLevelRef.current[i] * depthO * master;
      cardGroup.visible = opacity > 0.004;

      const write = depthWriteGate(depthWriteRef.current[i], placed.nz) && opacity > 0.55;
      if (write !== material.depthWrite) material.depthWrite = write;
      depthWriteRef.current[i] = write;

      if (engaged && cardGroup.visible) {
        mesh.updateWorldMatrix(true, false);
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let centreDepth = 0;
        let clipped = false;
        for (let cx = -1; cx <= 1; cx += 2) {
          for (let cy = -1; cy <= 1; cy += 2) {
            cornerLocal.current.set((cx * cardW) / 2, (cy * cardHeight) / 2, 0);
            cornerWorld.current
              .copy(cornerLocal.current)
              .applyMatrix4(mesh.matrixWorld)
              .project(camera);
            if (cornerWorld.current.z >= 1 || cornerWorld.current.z <= -1) clipped = true;
            const sx = (cornerWorld.current.x * 0.5 + 0.5) * size.width;
            const sy = (-cornerWorld.current.y * 0.5 + 0.5) * size.height;
            minX = Math.min(minX, sx);
            minY = Math.min(minY, sy);
            maxX = Math.max(maxX, sx);
            maxY = Math.max(maxY, sy);
            centreDepth += cornerWorld.current.z / 4;
          }
        }
        // The card opposite the front one projects INSIDE the front card's
        // face — it must steal neither clicks nor hover (ADR-029 lesson).
        const occludedByFront = i === (front + 2) % ARC_RING_COUNT;
        hoverRectsRef.current[i] =
          !clipped && !occludedByFront && opacity > 0.1
            ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY, nz: placed.nz }
            : null;
        if (publishAnchors) {
          anchors.push({
            caseId: PROJECT_CASES[i].id,
            slot: i,
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
            depth: centreDepth,
            visible: !clipped && !occludedByFront && opacity > 0.1,
            front: i === front,
          });
        }
      } else {
        hoverRectsRef.current[i] = null;
      }
    }

    if (publishAnchors) {
      if (engaged && anchors.length) {
        setArcRingAnchors(anchors);
        anchorsClearedRef.current = false;
      } else if (!anchorsClearedRef.current) {
        setArcRingAnchors([]);
        anchorsClearedRef.current = true;
      }
    }
  });

  if (!textures) return null;

  return (
    <group scale={scale}>
      {/* Per-card orbital tracks — drawn lines ride the same level as the
          cards (invisible while disarmed; the tracks ARE the armed state's
          armillary read). */}
      <group position={[0, yOffset, 0]}>
        <HologramOrbits
          orbits={cardTracks}
          entrance="off"
          scale={1}
          masterOpacityGetter={() => effLevelRef.current}
        />
      </group>
      {PROJECT_CASES.map((projectCase, i) => (
        <group
          key={projectCase.id}
          ref={(el) => {
            cardGroupRefs.current[i] = el;
          }}
          visible={false}
        >
          <mesh
            renderOrder={-0.1}
            position={[0, 0, -(slabDepth / 2 + 0.01)]}
            material={glowMaterials[i]}
            frustumCulled={false}
          >
            <planeGeometry args={[slabW * 1.7, slabH * 1.35]} />
          </mesh>
          <mesh
            renderOrder={0}
            geometry={slabGeometry}
            material={slabMaterials[i]}
            frustumCulled={false}
          />
          <lineSegments
            renderOrder={0.05}
            geometry={glintGeometry}
            material={glintMaterials[i]}
            frustumCulled={false}
          />
          <mesh
            renderOrder={0.1}
            position={[0, 0, slabDepth / 2 + RING_CONTENT_LIFT]}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            frustumCulled={false}
          >
            <planeGeometry args={[cardW, cardHeight]} />
            <meshBasicMaterial
              ref={(el) => {
                matRefs.current[i] = el;
              }}
              map={textures[i]}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              depthTest
              blending={THREE.NormalBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh
            renderOrder={0.12}
            position={[0, 0, slabDepth / 2 + RING_CONTENT_LIFT + 0.002]}
            material={veilMaterials[i]}
            frustumCulled={false}
          >
            <planeGeometry args={[cardW, cardHeight]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
