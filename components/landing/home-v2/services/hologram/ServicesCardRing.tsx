"use client";

/**
 * ServicesCardRing — the four service cards as transparent DEVICE SLABS
 * riding their own orbital tracks around the brandmark instrument (ADR-029
 * + Update 1). Canvas-agnostic: mounts inside the corridor canvas
 * (production, via `CorridorArmillary`) or a standalone lab canvas
 * (`/test/services-orbit`), always as a child of the instrument rig so it
 * inherits the mark's billboard, pointer-look, and scale.
 *
 * Motion contract (ADR-021 addendum — no time-clock rotation behind readable
 * services copy): the ring's rotation target is derived ONLY from the runway
 * scroll progress (`servicesRingProgressRef`, written by
 * useServicesStageScroll). A hard-bounded underdamped spring follows that
 * target — its decaying settle is the only idle motion, and the cap keeps the
 * ring within ~7° of the scroll-owned pose at all times. (The instrument's
 * own Lissajous drift is GATED OFF under the flag — Update 1: cards move
 * only from pointer-look and scroll.)
 *
 * DEVICE ANATOMY (Update 1 — the Atlas constellation-tablet read): each card
 * is a per-card group carrying, in EXPLICIT renderOrder,
 *   glow  (−0.1)  soft gold halo plane behind the slab, front-card weighted;
 *   slab  ( 0  )  extruded chamfered glass body — dark smoked caps + gold
 *                 side walls (the lip), clear bezel margin around the content;
 *   glint (0.05)  hairline EdgesGeometry wireframe on the slab silhouette;
 *   content(0.1)  the baked plate face, floated above the front cap;
 *   veil  (0.12)  the dot-matrix feed read over the photo zone — fades on
 *                 hover so the photo RESOLVES (Update 3, the plate's
 *                 `:hover` behavior; shared tiled strip texture).
 * Everything stays BELOW the mark's point pass (renderOrder 1) so the
 * "cards draw before points, front card writes depth" contract holds; the
 * glass/glint/glow NEVER write depth (a translucent veil writing depth
 * would punch particle holes — the §5 trap). Explicit intra-card order
 * exists because distance-sorting near-coplanar transparents flickers.
 *
 * Card faces are baked ONCE into CanvasTextures as the COMPLETE open C3
 * plate — photo with the plate's gold-tone treatment, chamfered gold shell,
 * filled gold chip, feed caption, title, lede, includes, and the outlined
 * CTA (2026-07-10 Vince red-alert: one plate, never a photo plane plus a
 * separate text console; the DOM only overlays hit targets). Chamfer
 * corners stay OPAQUE VOID — on the glass slab they read as the device's
 * dark display corners, and a translucent texel would multiply with
 * `material.opacity` and re-open the alphaTest-vs-fade trap.
 *
 * Anchors project the CONTENT plane's corners (not the slab), so the DOM
 * hit rects and `RING_CARD_CTA_BOX` mapping are unchanged by the bezel.
 * Blending is NORMAL everywhere (ADR-023: additive saturates into a blob).
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { buildCardTrackOrbits } from "./cardTrackOrbits";
import { HologramOrbits } from "./HologramOrbits";
import { BAKE_W, BAKE_H, PAD_X, CTA_H, CTA_Y0 } from "./ringCtaBox";

import { SERVICE_PLATES, type LedeSegment, type ServicePlate } from "../servicePlateData";
import { SERVICES } from "../serviceData";
import { SERVICES_CARTRIDGE_DOCK } from "../../unifiedServicesInstrument";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { useHologramConnectors, type RingCardAnchor } from "@/lib/stores/hologramConnectorStore";
import {
  DOCK_ANCHORS_OFF_EXIT,
  DOCK_DEPTH_WRITE_OFF_EXIT,
  DOCK_FALLBACK_NDC,
  DOCK_FALLBACK_SLOT_H_PX,
  dockFlatYaw,
  dockTravelEnvelope,
  seatWorldHeight,
} from "@/lib/services-ring/dockMath";
import { dockSeatRectsRef } from "@/lib/services-ring/dockSeatRef";
import {
  servicesRingProgressRef,
  type ServicesRingProgress,
} from "@/lib/services-ring/ringProgressRef";
import {
  RING_CARD_ASPECT,
  RING_CARD_HEIGHT,
  RING_CONTENT_LIFT,
  RING_COUNT,
  exitEnvelope,
  exitProgressForRunway,
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
  RING_TRAVEL_FRAC,
  RING_Y_OFFSET,
  buildCardOrbitGeometries,
  cardFacingYaw,
  depthOpacity,
  depthScale,
  depthWriteGate,
  entranceEnvelope,
  frontCardIndex,
  frontPoseBias,
  lerp,
  placeCardOnOrbit,
  ringRotationForProgress,
  smootherstep,
  stepRingSpring,
  type RingSpringState,
} from "@/lib/services-ring/ringMath";

/** Publish card rects only once the instrument is essentially parked — same
 *  threshold + clear-once semantics as `CorridorArmillary`'s scan anchors. */
const ANCHOR_PUBLISH_DISSIPATE = 0.88;

/** Wall-clock gap treated as an idle resume (frameloop was paused). Raised
 *  200 → 500 ms in ADR-029 Update 5: at 200 ms an ordinary frame hitch
 *  (GC, texture upload, dev-mode overhead) mid-quarter-turn tripped the
 *  gate and the ring visibly TELEPORTED. The snap itself is also now
 *  conditional — see the useFrame comment. */
const RESUME_IDLE_GAP_MS = 500;

/* ── Card-face bake ─────────────────────────────────────────────────────── */

/** Bake at the asset's native 2× card size (420 × 680 CSS). */
/** Chamfer cut — the open plate's 26px at 2×. Top-right + bottom-left, the
 *  `.svc-plate__sh` polygon. */
const BAKE_CH = 52;
/** Opaque void — visually identical to the page ground behind the canvas. */
const VOID = "#050403";
const DAWN = "236, 227, 214";

/* The plate's hologram photo layering (`.svc-plate__pbg--dots` + `--soft`),
 * restored in Update 2 and made HOVER-RESOLVABLE in Update 3: the face is
 * baked CLEAN and the dot-matrix lives on a separate VEIL plane whose
 * occlusion is the exact composite equivalent — between dots the photo
 * shows at PHOTO_SOFT_ALPHA, inside dots at SOFT+DOTS — so fading the veil
 * resolves the feed precisely like the plate's `:hover` (rest .34/.08 →
 * resolved .16/.48). Pitch/radius are the plate's 4px / 1.05px mask at the
 * 2× bake scale. */
const PHOTO_DOT_PITCH = 8;
const PHOTO_DOT_RADIUS = 2.15;
const PHOTO_DOTS_ALPHA = 0.62;
const PHOTO_SOFT_ALPHA = 0.3;

/** Veil vertical profile (bake px): clear over the CHIP ROW (the DOM plate
 *  drew chip/status above the dot mask — they must stay crisp at rest),
 *  full over the photo-led zone, faded out above the copy stack — the
 *  ground scrim owns the read down there, and the copy must never sit
 *  under the veil. */
const VEIL_TOP_START = 150;
const VEIL_TOP_END = 230;
const VEIL_FADE_START = 640;
const VEIL_FADE_END = 820;

/** Hover-resolved veil level — the plate kept a whisper of dots on hover
 *  (dots .34 → .16), so the veil dims to a residue rather than to zero. */
const RING_VEIL_HOVER_LEVEL = 0.18;

/** Damp rate (per second) for the hover resolve/restore transition. */
const VEIL_DAMP_RATE = 7;

/** Hover tilt amplitudes (rad) — the hovered card leans with the pointer
 *  (yaw toward the pointer's side, pitch away from its height) so the
 *  slab's extruded edges and gold lip catch the eye: the "see the 3D
 *  shape" affordance. Bounded well clear of edge-on; pointer-driven and
 *  damped to zero off-hover, so ADR-021 stays intact. Raised 0.09/0.16 →
 *  0.11/0.20 with the parked front-pose bias (ADR-029 addendum) so the
 *  pointer response reads over the held 3/4 angle. */
const RING_HOVER_TILT_PITCH = 0.11;
const RING_HOVER_TILT_YAW = 0.2;

/**
 * The shared veil strip: an 8px-wide, card-height column of void tint with
 * the dot matrix punched out, tiled horizontally across the card. Alpha
 * math (see PHOTO_* doc): between dots occlusion = 1 − SOFT; inside dots
 * the punch removes DOTS/(1 − SOFT) of it, leaving 1 − SOFT − DOTS.
 */
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

/**
 * Gold-tone LUT reproducing the plate photo treatment
 * (`.svc-plate__pbg` filter: grayscale(1) sepia(0.5) hue-rotate(-9deg)
 * saturate(1.35) brightness(0.84) contrast(1.08)) without relying on
 * `ctx.filter` support. Input is collapsed to luminance first, so a single
 * 256-entry table per channel suffices.
 */
function buildGoldToneLut(): { r: Uint8ClampedArray; g: Uint8ClampedArray; b: Uint8ClampedArray } {
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

/** await img.decode() with a defensive fallback to onload for older engines. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`ServicesCardRing: failed to load ${src}`));
    img.src = src;
  });
}

/** Wait for the faces used on the card copy, but never hang the bake —
 *  outside the landing page (labs) the v7 faces may not be declared and the
 *  stacks fall through to IBM Plex Mono / system sans. */
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

/* Copy-stack geometry (bake px — 2× the 420×680 CSS plate; text sizes are
 * 2× the open plate's CSS values in services.css). The CTA box is FIXED so
 * the DOM hit layer can overlay a real link on the front card. */

/** The normalized CTA rect (RING_CARD_CTA_BOX) lives in `./ringCtaBox.ts`
 *  — three-free so `ServicesRingHitAreas` can import it without pulling
 *  this file's WebGL stack into the initial bundle (2026-07-14). */

type InkRun = { text: string; gold: boolean };

/** Greedy word-wrap for a single-font run of styled segments. Returns lines
 *  of runs so lede emphasis (`{ em }` → upright gold) survives wrapping. */
function wrapRuns(
  ctx: CanvasRenderingContext2D,
  segments: readonly LedeSegment[],
  maxWidth: number
): InkRun[][] {
  const words: InkRun[] = [];
  for (const seg of segments) {
    const gold = typeof seg !== "string";
    const text = typeof seg === "string" ? seg : seg.em;
    for (const word of text.split(/\s+/)) {
      if (word) words.push({ text: word, gold });
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

function bakeCardFace(plate: ServicePlate, img: HTMLImageElement | null): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = BAKE_W;
  canvas.height = BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Ground — everything outside/under the photo is opaque void.
  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);

  if (img) {
    // Photo, cover-fit (assets are exactly BAKE_W × BAKE_H, so this is
    // 1:1), baked CLEAN — the plate's dot-matrix hologram effect lives on
    // the animatable VEIL plane above this face (Update 3), so hovering a
    // card can resolve the feed exactly like the DOM plate's
    // `[data-state="open"]:hover` did. See buildVeilTexture.
    const scale = Math.max(BAKE_W / img.naturalWidth, BAKE_H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (BAKE_W - dw) / 2, (BAKE_H - dh) / 2, dw, dh);

    // Plate gold-tone treatment (LUT pass — see buildGoldToneLut).
    const lut = buildGoldToneLut();
    const data = ctx.getImageData(0, 0, BAKE_W, BAKE_H);
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
    // Schematic dot-grid stand-in (the `.svc-plate__pbg--schematic` read) for
    // any future photo-less service — the ring never shows a raw void card.
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
        ctx.fillRect(0, 0, BAKE_W, BAKE_H);
      }
    }
  }

  // Scrims — chip row leads at the top; the C3 pgrade below (photo leads at
  // the top of the plate, darkens to solid ground for the copy stack).
  const top = ctx.createLinearGradient(0, 0, 0, 190);
  top.addColorStop(0, "rgba(5, 4, 3, 0.78)");
  top.addColorStop(1, "rgba(5, 4, 3, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, BAKE_W, 190);
  const ground = ctx.createLinearGradient(0, 700, 0, BAKE_H);
  ground.addColorStop(0, "rgba(5, 4, 3, 0)");
  ground.addColorStop(0.34, "rgba(5, 4, 3, 0.58)");
  ground.addColorStop(0.62, "rgba(5, 4, 3, 0.9)");
  ground.addColorStop(1, "rgba(5, 4, 3, 0.96)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, 700, BAKE_W, BAKE_H - 700);

  // Chamfer corners — OPAQUE void (see module doc; never transparent).
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

  // Chamfered shell stroke — the open plate's 168° gold gradient (1px CSS).
  const shell = ctx.createLinearGradient(0, 0, BAKE_W * 0.25, BAKE_H);
  shell.addColorStop(0, "rgba(202, 165, 84, 0.52)");
  shell.addColorStop(0.38, `rgba(${DAWN}, 0.14)`);
  shell.addColorStop(0.66, "rgba(202, 165, 84, 0.16)");
  shell.addColorStop(1, "rgba(202, 165, 84, 0.48)");
  ctx.strokeStyle = shell;
  ctx.lineWidth = 2.5;
  traceChamferPath(ctx, 1.5);
  ctx.stroke();

  // Brighter ticks along the two chamfer cuts (the connector plug-in edges).
  ctx.strokeStyle = "rgba(202, 165, 84, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(BAKE_W - BAKE_CH, 1.5);
  ctx.lineTo(BAKE_W - 1.5, BAKE_CH);
  ctx.moveTo(1.5, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H - 1.5);
  ctx.stroke();

  // Chip row — the OPEN plate's FILLED gold chip (on-gold ink is
  // latent-night, the shared CTA/chip treatment) + status code right.
  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.textBaseline = "middle";
  label.letterSpacing = "4.8px";
  ctx.font = `700 24px ${CARD_FONT}`;
  const chipText = plate.chip.toUpperCase();
  const chipTextW = ctx.measureText(chipText).width;
  const chipH = 54; // 27px CSS
  const chipY = 74 - chipH / 2;
  const chipW = 30 + 10 + 18 + chipTextW + 30; // pad · diamond · gap · text · pad
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
  ctx.fillText(`${plate.statusCode} · OPEN`, BAKE_W - BAKE_CH - 18, 74);
  ctx.textAlign = "left";

  /* ── Copy stack — the open C3 plate's text, bottom-anchored above the
     fixed CTA box (sizes = 2× the services.css open-plate values). ── */
  const maxW = BAKE_W - PAD_X * 2;
  ctx.textBaseline = "alphabetic";

  // CTA — outlined gold box, label left, arrow right (rest state).
  label.letterSpacing = "4px";
  ctx.strokeStyle = SERVICES_GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(PAD_X, CTA_Y0, maxW, CTA_H);
  ctx.font = `700 21px ${CARD_FONT}`;
  ctx.fillStyle = SERVICES_GOLD;
  const ctaMidY = CTA_Y0 + CTA_H / 2 + 8;
  ctx.fillText(plate.ctaLabel.toUpperCase(), PAD_X + 28, ctaMidY);
  label.letterSpacing = "0px";
  ctx.font = `400 30px ${CARD_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("→", PAD_X + maxW - 28, ctaMidY + 2);
  ctx.textAlign = "left";

  // Includes row — mono chips with gold separators, above the CTA.
  label.letterSpacing = "3px";
  ctx.font = `400 18px ${CARD_FONT}`;
  const incSegments: LedeSegment[] = [];
  plate.includes.forEach((item, i) => {
    if (i > 0) incSegments.push({ em: "·" });
    incSegments.push(item.toUpperCase());
  });
  const incLines = wrapRuns(ctx, incSegments, maxW);
  const INC_LH = 30;
  const incBottom = CTA_Y0 - 30;
  incLines.forEach((line, i) => {
    drawRunLine(
      ctx,
      line,
      PAD_X,
      incBottom - (incLines.length - 1 - i) * INC_LH,
      `rgba(${DAWN}, 0.5)`
    );
  });
  const incTop = incBottom - (incLines.length - 1) * INC_LH - 22;

  // Lede — sans body, `{ em }` spans upright gold (no-italics rule).
  label.letterSpacing = "0px";
  ctx.font = `400 27px ${CARD_SANS}`;
  const ledeLines = wrapRuns(ctx, plate.lede, maxW);
  const LEDE_LH = 40;
  const ledeBottom = incTop - 26;
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

  // Title — mono bold uppercase (the plate headline).
  label.letterSpacing = "3px";
  ctx.font = `700 34px ${CARD_FONT}`;
  const titleLines = wrapRuns(ctx, [plate.title.toUpperCase()], maxW);
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

  // Feed caption — label left, status right in gold (the C3 pcap row).
  label.letterSpacing = "3.5px";
  ctx.font = `400 16px ${CARD_FONT}`;
  ctx.fillStyle = `rgba(${DAWN}, 0.4)`;
  const capY = titleTop - 24;
  ctx.fillText(plate.feedLabel.toUpperCase(), PAD_X, capY);
  ctx.fillStyle = "rgba(202, 165, 84, 0.85)";
  ctx.textAlign = "right";
  ctx.fillText(plate.feedStatus.toUpperCase(), PAD_X + maxW, capY);
  ctx.textAlign = "left";
  label.letterSpacing = "0px";

  return canvas;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export interface ServicesCardRingProps {
  /** Instrument scale — pass the armillary scale so ring radii live in the
   *  same orbit-config space as `HologramOrbits` (corridor: 0.62). */
  scale?: number;
  /** Runway progress source. Defaults to the module bridge ref written by
   *  useServicesStageScroll; labs pass their own simulate-scroll ref. */
  progressRef?: { current: ServicesRingProgress };
  /** Dissipate clock for the dock entrance. Corridor passes
   *  `getSmoothedDissipate`; default reads `--corridor-dissipate` (damped),
   *  the `HologramOrbits` pattern. Ignored when `entrance="off"`. */
  dissipateGetter?: () => number;
  /** "scroll" = staggered fly-in off the dissipate clock; "off" = parked. */
  entrance?: "scroll" | "off";
  /** Publish per-card screen rects to `hologramConnectorStore.ringAnchors`
   *  (production hit-areas). Off in labs. */
  publishAnchors?: boolean;
  /** 0 = tidally locked outward (side cards edge-on), 1 = always facing the
   *  rig's forward axis. Partial blends keep the orbit read while photos
   *  stay visible in transit. Default RING_FACING_BLEND. */
  facingBlend?: number;
  masterOpacity?: number;
  /* Look-dev tunables — defaults are the ringMath constants. */
  cardHeight?: number;
  yOffset?: number;
  travelFrac?: number;
  springOmega?: number;
  springZeta?: number;
  swayCap?: number;
  opacityRange?: readonly [number, number];
  scaleRange?: readonly [number, number];
  opacityWindow?: readonly [number, number];
  /* Per-card orbits (Update 1). */
  orbitBase?: number;
  orbitSpread?: number;
  orbitTiltAmp?: number;
  /** Track line opacity multiplier (0 hides the orbit lines). */
  trackOpacityMul?: number;
  /* Device slab (Update 1). */
  slabDepth?: number;
  bezelMargin?: number;
  glassOpacity?: number;
  glassEdgeOpacity?: number;
  glintOpacity?: number;
  glowOpacity?: number;
}

export function ServicesCardRing({
  scale = 1,
  progressRef = servicesRingProgressRef,
  dissipateGetter,
  entrance = "scroll",
  publishAnchors = false,
  facingBlend = RING_FACING_BLEND,
  masterOpacity = 1,
  cardHeight = RING_CARD_HEIGHT,
  yOffset = RING_Y_OFFSET,
  travelFrac = RING_TRAVEL_FRAC,
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
}: ServicesCardRingProps) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const setRingAnchors = useHologramConnectors((s) => s.setRingAnchors);

  const [textures, setTextures] = useState<THREE.CanvasTexture[] | null>(null);
  const cardGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]); // content planes (anchor projection)
  const matRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]); // content materials
  const depthWriteRef = useRef<boolean[]>(new Array(RING_COUNT).fill(false));
  const springRef = useRef<RingSpringState>({ pos: 0, vel: 0 });
  const lastWallRef = useRef(-1);
  // Damped CSS-var dissipate (fallback path); −1 sentinel = snap on first read.
  const dissipateRef = useRef(-1);
  const anchorsClearedRef = useRef(true);
  const cornerLocal = useRef(new THREE.Vector3());
  const cornerWorld = useRef(new THREE.Vector3());

  /* ── Cartridge dock (ADR-046) — scratch objects for the per-frame seat
     targeting. The seat is derived VIEWPORT-FIRST every frame (slot rect →
     NDC → camera space at the card's live depth → world → ring-local via
     one shared inverse parent matrix), so the brandmark recede,
     pointer-look residue, resize, and DPR steps are all compensated
     automatically — never a fixed world offset (BEST-PRACTICES; the
     ADR-034 terrace precedent). No per-frame allocation. */
  const ringGroupRef = useRef<THREE.Group>(null);
  const dockParentInv = useRef(new THREE.Matrix4());
  const dockParentCol = useRef(new THREE.Vector3());
  const dockWorldScratch = useRef(new THREE.Vector3());
  const dockCamScratch = useRef(new THREE.Vector3());
  const dockSeatScratch = useRef(new THREE.Vector3());
  const dockFlatYaws = useMemo(
    () => SERVICE_PLATES.map((_, i) => dockFlatYaw(i, facingBlend)),
    [facingBlend]
  );

  const cardW = cardHeight * RING_CARD_ASPECT;
  const slabW = cardW + bezelMargin * 2;
  const slabH = cardHeight + bezelMargin * 2;

  /* ── Per-card orbital tracks (Update 1) ── */
  const cardOrbitGeoms = useMemo(
    () => buildCardOrbitGeometries(orbitBase, orbitSpread, orbitTiltAmp),
    [orbitBase, orbitSpread, orbitTiltAmp]
  );
  const cardTracks = useMemo(
    () => buildCardTrackOrbits(cardOrbitGeoms, { opacityMul: trackOpacityMul }),
    [cardOrbitGeoms, trackOpacityMul]
  );

  /* ── Shared device geometry (one of each across the four cards) ── */
  const slabGeometry = useMemo(() => {
    const ch = slabW * RING_SLAB_CHAMFER_FRAC;
    const hw = slabW / 2;
    const hh = slabH / 2;
    // Chamfers at top-right (+x,+y) and bottom-left (−x,−y) — the bake's
    // `.svc-plate__sh` polygon (CanvasTexture top row = plane +y).
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

  // The hologram veil — one tiny tiled strip shared by all four cards
  // (see buildVeilCanvas); per-card materials fade it on hover.
  const veilTexture = useMemo(() => {
    // SSR guard: this memo runs during render. R3F children never render
    // on the server today, but the document access must not assume it.
    if (typeof document === "undefined") return null;
    const texture = new THREE.CanvasTexture(buildVeilCanvas());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(BAKE_W / PHOTO_DOT_PITCH, 1);
    return texture;
  }, []);
  useEffect(() => {
    return () => veilTexture?.dispose();
  }, [veilTexture]);

  // Soft gold halo — the Atlas two-layer radial glow collapsed into one
  // gradient texture, shared by all four glow planes.
  const glowTexture = useMemo(() => {
    // SSR guard — same contract as veilTexture above.
    if (typeof document === "undefined") return null;
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
    return () => glowTexture?.dispose();
  }, [glowTexture]);

  /* ── Per-card device materials (opacities driven per frame) ── */
  const slabMaterials = useMemo(
    () =>
      SERVICE_PLATES.map(() => {
        const shared = {
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true,
          blending: THREE.NormalBlending,
          toneMapped: false,
          side: THREE.FrontSide,
        } as const;
        // ExtrudeGeometry groups: material 0 = front/back caps (the smoked
        // glass body), material 1 = the side walls (the gold lip).
        return [
          new THREE.MeshBasicMaterial({ ...shared, color: new THREE.Color("#14110c") }),
          new THREE.MeshBasicMaterial({ ...shared, color: new THREE.Color(SERVICES_GOLD) }),
        ] as [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial];
      }),
    []
  );
  const glintMaterials = useMemo(
    () =>
      SERVICE_PLATES.map(
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
      SERVICE_PLATES.map(
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
      SERVICE_PLATES.map(
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

  // Hover-resolve (Update 3): track the pointer window-level (the canvas is
  // pointer-events:none — the pointer-look precedent) and test it against
  // the card rects projected in the frame loop; the hovered card's veil
  // damps toward its resolved level.
  const pointerPxRef = useRef({ x: -1, y: -1 });
  const hoverRectsRef = useRef<
    Array<{ x: number; y: number; w: number; h: number; nz: number } | null>
  >(new Array(RING_COUNT).fill(null));
  const veilLevelRef = useRef<number[]>(new Array(RING_COUNT).fill(1));
  const hoverTiltRef = useRef<Array<{ pitch: number; yaw: number }>>(
    Array.from({ length: RING_COUNT }, () => ({ pitch: 0, yaw: 0 }))
  );
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointerPxRef.current.x = event.clientX;
      pointerPxRef.current.y = event.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Bake the four card faces once (fonts + photos are awaited; a glEpoch
  // canvas remount re-runs this effect and re-bakes).
  useEffect(() => {
    let disposed = false;
    (async () => {
      await waitForCardFonts();
      const baked = await Promise.all(
        SERVICE_PLATES.map(async (plate) => {
          let img: HTMLImageElement | null = null;
          if (plate.photo) {
            try {
              img = await loadImage(plate.photo.jpg);
            } catch {
              img = null; // schematic fallback keeps the ring whole
            }
          }
          return bakeCardFace(plate, img);
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
  }, [gl]);

  // Dispose bakes on replacement/unmount (materials/geometries are
  // declarative — R3F disposes those).
  useEffect(() => {
    if (!textures) return;
    return () => {
      for (const texture of textures) texture.dispose();
    };
  }, [textures]);

  // Clear published rects when the ring unmounts mid-park.
  useEffect(() => {
    return () => {
      if (publishAnchors && !anchorsClearedRef.current) setRingAnchors([]);
    };
  }, [publishAnchors, setRingAnchors]);

  useFrame((_, delta) => {
    // Idle-resume detection on the WALL clock — `delta` is already clamped by
    // the spring, but a long frameloop pause must not integrate a stale glide.
    const now = performance.now();
    const gap = lastWallRef.current < 0 ? Infinity : now - lastWallRef.current;
    lastWallRef.current = now;
    const resumed = gap > RESUME_IDLE_GAP_MS;

    // Dissipate clock for the entrance envelope.
    let dissipate = 1;
    if (entrance === "scroll") {
      if (dissipateGetter) {
        dissipate = dissipateGetter();
      } else {
        const raw = parseFloat(
          document.documentElement.style.getPropertyValue("--corridor-dissipate")
        );
        const target = Number.isFinite(raw) ? raw : 1;
        if (dissipateRef.current < 0) dissipateRef.current = target;
        else dissipateRef.current += (target - dissipateRef.current) * Math.min(1, delta * 8);
        dissipate = dissipateRef.current;
      }
    }

    // Scroll-owned rotation through the bounded spring. On an idle resume,
    // hard-snap ONLY when the pose is genuinely stale (the user scrolled
    // more than the sway cap while the frameloop slept — springing in from
    // there would read as the ring settling on its own); a resume with the
    // target still nearby just zeroes the stale velocity and glides in.
    // Unconditional snapping made every >gap frame hitch a visible
    // teleport mid-turn (ADR-029 Update 5).
    const target = ringRotationForProgress(progressRef.current.progress, undefined, travelFrac);
    const snap = resumed && Math.abs(target - springRef.current.pos) > swayCap;
    if (resumed && !snap) springRef.current.vel = 0;
    const spring = stepRingSpring(springRef.current, target, delta, {
      omega: springOmega,
      zeta: springZeta,
      cap: swayCap,
      snap,
    });
    const front = frontCardIndex(spring.pos);

    // Decommission clock (ADR-030 Update 1) — 0 through every reading
    // beat, 0..1 across the runway's final beat. Identity below keeps all
    // pre-exit frames byte-identical; entrance "off" (labs) never exits.
    const exitP = entrance === "scroll" ? exitProgressForRunway(progressRef.current.progress) : 0;

    // Cartridge dock (ADR-046): with the flag on, the exit beat's cards
    // travel to the bottom-right DOM console instead of the ADR-030 radial
    // fade-out. The dock branch only runs while exitP > 0, so every
    // pre-exit frame takes the exact shipped code path (byte-identical
    // guardrail), and reverse scroll re-enters it seamlessly (the envelope
    // is identity at exit 0). Per-frame shared seat geometry: one inverse
    // parent matrix + camera terms for all four cards, scratch objects only.
    const dockEngaged = SERVICES_CARTRIDGE_DOCK && entrance === "scroll" && exitP > 0;
    const dockAnchorsLive =
      !(SERVICES_CARTRIDGE_DOCK && entrance === "scroll") || exitP < DOCK_ANCHORS_OFF_EXIT;
    let dockHalfFovTan = 0;
    let dockAspect = 1;
    let dockParentScale = 1;
    if (dockEngaged && ringGroupRef.current) {
      const ring = ringGroupRef.current;
      ring.updateWorldMatrix(true, false);
      dockParentInv.current.copy(ring.matrixWorld).invert();
      dockParentScale =
        dockParentCol.current.setFromMatrixColumn(ring.matrixWorld, 0).length() || 1;
      const persp = camera as THREE.PerspectiveCamera;
      dockHalfFovTan = Math.tan(((persp.fov ?? 40) * Math.PI) / 360);
      dockAspect = persp.aspect || size.width / Math.max(1, size.height);
    }

    const parked = dissipate >= ANCHOR_PUBLISH_DISSIPATE;
    const anchors: RingCardAnchor[] = [];

    // Hovered card from LAST frame's projected rects (one frame of lag is
    // imperceptible at the veil's damp rate). Front-most containing rect
    // wins; nothing hovers until parked — and never during the dock travel
    // (the veil re-engages as the feed "powers down" in transit).
    let hovered = -1;
    if (parked && !dockEngaged) {
      const pointer = pointerPxRef.current;
      let bestNz = -Infinity;
      for (let i = 0; i < RING_COUNT; i++) {
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

    for (let i = 0; i < RING_COUNT; i++) {
      const cardGroup = cardGroupRefs.current[i];
      const mesh = meshRefs.current[i];
      const material = matRefs.current[i];
      if (!cardGroup || !mesh || !material) continue;

      const env = entrance === "scroll" ? entranceEnvelope(dissipate, i) : null;
      // Exit composes onto the entrance: identity while exitP = 0. Flag
      // OFF: the ADR-030 radial decommission (fly OUT + fade). Flag ON
      // (ADR-046): the dock travel replaces it — the card ejects
      // (radiusMul bump), flattens, and flies to the DOM console seat.
      const exit = exitEnvelope(exitP, i);
      const dockEnv = dockEngaged ? dockTravelEnvelope(exitP, i) : null;
      const placed = placeCardOnOrbit(i, spring.pos, cardOrbitGeoms[i], {
        yOffset,
        radiusMul: (env ? env.radiusMul : 1) * (dockEnv ? dockEnv.radiusMul : exit.radiusMul),
      });

      // Hover tilt — the hovered card leans with the pointer so its slab
      // edges show (damped, zero off-hover). Pointer offset is measured
      // inside last frame's projected rect.
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

      // The GROUP carries the ring transform — glow, slab, glint, and
      // content ride together as one device. The parked front card holds
      // a small residual 3/4 pose (frontPoseBias — ADR-029 addendum) so
      // the slab's depth reads while it is THE in-view card; the bias is
      // a constant term after cardFacingYaw, scroll-owned via nz.
      const bias = frontPoseBias(placed.nz);
      // Directional entrance slide (ADR-029 follow-up, 2026-07-15): the card
      // flies IN from off-frame into its orbit slot (env.offsetX/Y), so it
      // ENTERS the viewport instead of fading in place. Zero once settled and
      // in the "off" (lab) path, so the parked pose is unchanged.
      const entX = env ? env.offsetX : 0;
      const entY = env ? env.offsetY : 0;
      const ringX = placed.x + entX;
      const ringY = placed.y + entY;
      const ringZ = placed.z;
      const ringPitch = tilt.pitch + bias.pitch;
      const ringYaw = cardFacingYaw(placed.rotY, facingBlend) + tilt.yaw + bias.yaw;
      const ringScale = depthScale(placed.nz, scaleRange);

      if (dockEnv && ringGroupRef.current) {
        // ── ADR-046 dock travel: ring pose → seat pose, viewport-first.
        // Seat NDC from the live DOM slot rect (fallback anchor until the
        // dock has measured — the crossfade at seat absorbs the residue).
        const seats = dockSeatRectsRef.current;
        const slot = seats.valid && seats.slots.length > i ? seats.slots[i] : null;
        const ndcX = slot ? (slot.cx / Math.max(1, size.width)) * 2 - 1 : DOCK_FALLBACK_NDC[0];
        const ndcY = slot ? -((slot.cy / Math.max(1, size.height)) * 2 - 1) : DOCK_FALLBACK_NDC[1];
        const slotH = slot ? slot.h : DOCK_FALLBACK_SLOT_H_PX;

        // Camera-space depth of the card's RING pose — the seat is placed
        // at the SAME depth, so the travel is screen-lateral and the
        // projected card lands exactly on the slot regardless of the
        // brandmark recede or pointer-look residue (both recomputed here
        // every frame through the live matrices).
        dockWorldScratch.current
          .set(ringX, ringY, ringZ)
          .applyMatrix4(ringGroupRef.current.matrixWorld);
        dockCamScratch.current
          .copy(dockWorldScratch.current)
          .applyMatrix4(camera.matrixWorldInverse);
        const camDepth = Math.max(0.1, -dockCamScratch.current.z);

        // Seat point: NDC at that depth → world → ring-local.
        dockSeatScratch.current
          .set(
            ndcX * dockHalfFovTan * dockAspect * camDepth,
            ndcY * dockHalfFovTan * camDepth,
            -camDepth
          )
          .applyMatrix4(camera.matrixWorld)
          .applyMatrix4(dockParentInv.current);

        // Bowed path: perpendicular of the local travel direction (XY),
        // flipped upward — the card lifts off the straight line, then
        // drops into the socket ("ejected, then inserted").
        const dx = dockSeatScratch.current.x - ringX;
        const dy = dockSeatScratch.current.y - ringY;
        const len = Math.hypot(dx, dy);
        let bendX = 0;
        let bendY = 0;
        if (len > 1e-5) {
          bendX = -dy / len;
          bendY = dx / len;
          if (bendY < 0) {
            bendX = -bendX;
            bendY = -bendY;
          }
        }
        const posT = dockEnv.positionT;
        cardGroup.position.set(
          lerp(ringX, dockSeatScratch.current.x, posT) + bendX * dockEnv.bend,
          lerp(ringY, dockSeatScratch.current.y, posT) + bendY * dockEnv.bend,
          lerp(ringZ, dockSeatScratch.current.z, posT)
        );
        // Flatten: pitch/hover ease out; yaw unwinds to the settled pose's
        // nearest full turn (dockFlatYaw — deterministic, computed from the
        // settled exit pose so the unwind direction can never flip on
        // spring wobble mid-flight).
        cardGroup.rotation.set(
          ringPitch * (1 - dockEnv.flattenT),
          lerp(ringYaw, dockFlatYaws[i], dockEnv.flattenT),
          0
        );
        // Scale: ring depth-scale → absolute seat scale (projected card
        // height == the DOM slot height — also equalizes the four
        // cartridges in flight, erasing the per-depth scale spread).
        const seatScale =
          seatWorldHeight(slotH, Math.max(1, size.height), camDepth, dockHalfFovTan) /
          Math.max(1e-6, cardHeight * dockParentScale);
        cardGroup.scale.setScalar(lerp(ringScale, seatScale, posT));
      } else {
        cardGroup.position.set(ringX, ringY, ringZ);
        cardGroup.rotation.set(ringPitch, ringYaw, 0);
        cardGroup.scale.setScalar(ringScale);
      }

      // Depth-based opacity lifts to UNIFORM during the dock travel (the
      // back card must not fly at its 0.16 floor); the WebGL card then
      // hands off to the DOM cartridge across the seat swap
      // (dockEnv.webglOpacity 1 → 0) instead of the radial exit fade.
      const depthOBase = depthOpacity(placed.nz, opacityRange, opacityWindow);
      const depthO = dockEnv ? lerp(depthOBase, opacityRange[1], dockEnv.flattenT) : depthOBase;
      const master =
        (env ? env.opacity : 1) * (dockEnv ? dockEnv.webglOpacity : exit.opacity) * masterOpacity;
      const opacity = depthO * master;
      // The content ink dims toward the cartridge read in transit (faceDim);
      // the slab body / gold lip / glint stay solid until the seat swap.
      material.opacity = opacity * (dockEnv ? dockEnv.faceDim : 1);
      slabMaterials[i][0].opacity = glassOpacity * depthO * master;
      slabMaterials[i][1].opacity = glassEdgeOpacity * depthO * master;
      glintMaterials[i].opacity = glintOpacity * depthO * master;
      // Halo is front-weighted: swells as the card parks, gone on the sides
      // — and dies over the dock eject beat (the feed powers down).
      glowMaterials[i].opacity =
        glowOpacity *
        smootherstep(0.35, 0.95, placed.nz) *
        master *
        (dockEnv ? dockEnv.glowMul : 1);
      // Hover-resolve: the hovered card's veil damps toward its resolved
      // residue; everyone else restores to the full feed read.
      const veilTarget = i === hovered ? RING_VEIL_HOVER_LEVEL : 1;
      veilLevelRef.current[i] +=
        (veilTarget - veilLevelRef.current[i]) * Math.min(1, delta * VEIL_DAMP_RATE);
      veilMaterials[i].opacity = veilLevelRef.current[i] * depthO * master;
      cardGroup.visible = opacity > 0.004;

      // depthWrite hysteresis — only the near-front card's CONTENT writes
      // depth (the glass never does). Force-OFF just past the dock's exit
      // start: a solid card travelling across the mark must never punch
      // holes in the depthWrite:false particle pass (ADR-046).
      const write =
        dockEngaged && exitP > DOCK_DEPTH_WRITE_OFF_EXIT
          ? false
          : depthWriteGate(depthWriteRef.current[i], placed.nz) && opacity > 0.55;
      if (write !== material.depthWrite) material.depthWrite = write;
      depthWriteRef.current[i] = write;

      // Project the content plane's corners whenever parked — the store
      // publish is gated on `publishAnchors`, but the HOVER-resolve needs
      // the rects everywhere (lab included).
      if (parked && cardGroup.visible) {
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
        // The card directly OPPOSITE the front one projects a rect that sits
        // entirely inside the front card's face — a click there must never
        // surprise-rotate to the hidden card (found when the Update-1 opacity
        // floor 0.16 stopped the old `> 0.1` gate from filtering it). The
        // same shadowed rect must not steal HOVER either.
        const occludedByFront = i === (front + 2) % RING_COUNT;
        // `dockAnchorsLive` retires the rects at the dock's exit start
        // (ADR-046): the dock travel keeps cards OPAQUE (no fade), so the
        // old `opacity > 0.1` gate alone would leave a live CTA link riding
        // the flight to the corner.
        hoverRectsRef.current[i] =
          !clipped && !occludedByFront && opacity > 0.1 && dockAnchorsLive
            ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY, nz: placed.nz }
            : null;
        if (publishAnchors) {
          anchors.push({
            serviceId: SERVICES[i].id,
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
            depth: centreDepth,
            visible: !clipped && !occludedByFront && opacity > 0.1 && dockAnchorsLive,
            front: i === front,
          });
        }
      } else {
        hoverRectsRef.current[i] = null;
      }
    }

    if (publishAnchors) {
      if (parked && anchors.length) {
        setRingAnchors(anchors);
        anchorsClearedRef.current = false;
      } else if (!anchorsClearedRef.current) {
        setRingAnchors([]);
        anchorsClearedRef.current = true;
      }
    }
  });

  if (!textures) return null;

  // Decommission dim for the drawn card tracks — same clock and magnitude
  // as the structural armillary (CorridorArmillary), derived from THIS
  // ring's progress source so labs with a simulate-scroll ref exit too.
  const trackExitGetter =
    entrance === "scroll"
      ? () => 1 - 0.85 * exitProgressForRunway(progressRef.current.progress)
      : undefined;

  return (
    <group ref={ringGroupRef} scale={scale}>
      {/* Each card's own orbital track — drawn from the SAME ellipse
          parametrization the card rides (cardTrackOrbits.ts), offset to
          the ring plane like the cards themselves. */}
      <group position={[0, yOffset, 0]}>
        <HologramOrbits
          orbits={cardTracks}
          entrance={entrance}
          scale={1}
          masterOpacityGetter={trackExitGetter}
        />
      </group>
      {SERVICE_PLATES.map((plate, i) => (
        <group
          key={plate.id}
          ref={(el) => {
            cardGroupRefs.current[i] = el;
          }}
          visible={false}
        >
          {/* Halo behind the slab — front-card weighted. */}
          <mesh
            renderOrder={-0.1}
            position={[0, 0, -(slabDepth / 2 + 0.01)]}
            material={glowMaterials[i]}
            frustumCulled={false}
          >
            <planeGeometry args={[slabW * 1.7, slabH * 1.35]} />
          </mesh>
          {/* Glass slab — smoked caps + gold-lipped side walls. */}
          <mesh
            renderOrder={0}
            geometry={slabGeometry}
            material={slabMaterials[i]}
            frustumCulled={false}
          />
          {/* Hairline edge glint on the slab silhouette. */}
          <lineSegments
            renderOrder={0.05}
            geometry={glintGeometry}
            material={glintMaterials[i]}
            frustumCulled={false}
          />
          {/* The baked plate face, floated above the front cap. */}
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
          {/* Hologram veil — the plate's dot-matrix feed read over the
              photo zone; fades on hover so the photo resolves (the
              `.svc-plate:hover` behavior, Update 3). */}
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
