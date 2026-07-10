"use client";

/**
 * ServicesCardRing — the four service cards as textured planes ORBITING the
 * brandmark instrument (ADR-029). Canvas-agnostic: mounts inside the corridor
 * canvas (production, via `CorridorArmillary`) or a standalone lab canvas
 * (`/test/services-orbit`), always as a child of the instrument rig so it
 * inherits the mark's billboard, pointer-look, and scale.
 *
 * Motion contract (ADR-021 addendum — no time-clock rotation behind readable
 * services copy): the ring's rotation target is derived ONLY from the runway
 * scroll progress (`servicesRingProgressRef`, written by
 * useServicesStageScroll). A hard-bounded underdamped spring follows that
 * target — its decaying settle is the only idle motion, and the cap keeps the
 * ring within ~7° of the scroll-owned pose at all times.
 *
 * Card faces are baked ONCE into CanvasTextures as the COMPLETE open C3
 * plate — photo with the plate's gold-tone treatment, chamfered gold shell,
 * filled gold chip, feed caption, title, lede, includes, and the outlined
 * CTA (2026-07-10 Vince red-alert: one plate, never a photo plane plus a
 * separate text console; the DOM only overlays hit targets). Chamfer
 * corners are painted OPAQUE VOID, not transparent: a translucent texel
 * would multiply with `material.opacity` and re-open the alphaTest-vs-fade
 * trap.
 *
 * Depth strategy vs the GPGPU mark (points: depthWrite=false, renderOrder=1;
 * orbit lines: depthWrite=false, renderOrder=0): cards stay at renderOrder 0
 * and only the near-front card WRITES depth (hysteresis gate) — so the mark's
 * point pass is genuinely occluded behind the front card, while translucent
 * side/back cards never punch card-shaped holes into the particle ink.
 * Blending is NORMAL everywhere (ADR-023: additive saturates into a blob).
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { SERVICE_PLATES, type LedeSegment, type ServicePlate } from "../servicePlateData";
import { SERVICES } from "../serviceData";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { useHologramConnectors, type RingCardAnchor } from "@/lib/stores/hologramConnectorStore";
import {
  servicesRingProgressRef,
  type ServicesRingProgress,
} from "@/lib/services-ring/ringProgressRef";
import {
  RING_CARD_ASPECT,
  RING_CARD_HEIGHT,
  RING_COUNT,
  RING_FACING_BLEND,
  RING_OPACITY_RANGE,
  RING_RADIUS,
  RING_SCALE_RANGE,
  RING_SPRING_OMEGA,
  RING_SPRING_ZETA,
  RING_SWAY_CAP_RAD,
  RING_TRAVEL_FRAC,
  RING_Y_OFFSET,
  cardFacingYaw,
  depthOpacity,
  depthScale,
  depthWriteGate,
  entranceEnvelope,
  frontCardIndex,
  placeCard,
  ringRotationForProgress,
  stepRingSpring,
  type RingSpringState,
} from "@/lib/services-ring/ringMath";

/** Publish card rects only once the instrument is essentially parked — same
 *  threshold + clear-once semantics as `CorridorArmillary`'s scan anchors. */
const ANCHOR_PUBLISH_DISSIPATE = 0.88;

/** Wall-clock gap treated as an idle resume (frameloop was paused) — snap the
 *  spring instead of integrating a stale glide (mirrors motionFollower). */
const RESUME_IDLE_GAP_MS = 200;

/* ── Card-face bake ─────────────────────────────────────────────────────── */

/** Bake at the asset's native 2× card size (420 × 680 CSS). */
const BAKE_W = 840;
const BAKE_H = 1360;
/** Chamfer cut — the open plate's 26px at 2×. Top-right + bottom-left, the
 *  `.svc-plate__sh` polygon. */
const BAKE_CH = 52;
/** Opaque void — visually identical to the page ground behind the canvas. */
const VOID = "#050403";
const DAWN = "236, 227, 214";

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
const PAD_X = 52;
const CTA_H = 84; // 42px CSS
const CTA_Y0 = BAKE_H - 44 - CTA_H;

/** Normalized CTA rect within the card face — `ServicesRingHitAreas` maps
 *  this onto the front card's published screen rect to place a real <a>. */
export const RING_CARD_CTA_BOX = {
  x: PAD_X / BAKE_W,
  y: CTA_Y0 / BAKE_H,
  w: (BAKE_W - PAD_X * 2) / BAKE_W,
  h: CTA_H / BAKE_H,
} as const;

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
    // Photo, cover-fit (assets are exactly BAKE_W × BAKE_H, so this is 1:1).
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

  // Hologram dot pitch — a whisper of the plate's 4px dot mask so the photo
  // reads as instrument feed, not a print. Dark dots, low alpha.
  const dotTile = document.createElement("canvas");
  dotTile.width = 8;
  dotTile.height = 8;
  const dctx = dotTile.getContext("2d");
  if (dctx) {
    dctx.fillStyle = "rgba(5, 4, 3, 0.16)";
    dctx.beginPath();
    dctx.arc(2, 2, 1.4, 0, Math.PI * 2);
    dctx.fill();
    const pattern = ctx.createPattern(dotTile, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, BAKE_W, BAKE_H);
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
  radius?: number;
  cardHeight?: number;
  yOffset?: number;
  travelFrac?: number;
  springOmega?: number;
  springZeta?: number;
  swayCap?: number;
  opacityRange?: readonly [number, number];
  scaleRange?: readonly [number, number];
}

export function ServicesCardRing({
  scale = 1,
  progressRef = servicesRingProgressRef,
  dissipateGetter,
  entrance = "scroll",
  publishAnchors = false,
  facingBlend = RING_FACING_BLEND,
  masterOpacity = 1,
  radius = RING_RADIUS,
  cardHeight = RING_CARD_HEIGHT,
  yOffset = RING_Y_OFFSET,
  travelFrac = RING_TRAVEL_FRAC,
  springOmega = RING_SPRING_OMEGA,
  springZeta = RING_SPRING_ZETA,
  swayCap = RING_SWAY_CAP_RAD,
  opacityRange = RING_OPACITY_RANGE,
  scaleRange = RING_SCALE_RANGE,
}: ServicesCardRingProps) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const setRingAnchors = useHologramConnectors((s) => s.setRingAnchors);

  const [textures, setTextures] = useState<THREE.CanvasTexture[] | null>(null);
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]);
  const matRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const depthWriteRef = useRef<boolean[]>(new Array(RING_COUNT).fill(false));
  const springRef = useRef<RingSpringState>({ pos: 0, vel: 0 });
  const lastWallRef = useRef(-1);
  // Damped CSS-var dissipate (fallback path); −1 sentinel = snap on first read.
  const dissipateRef = useRef(-1);
  const anchorsClearedRef = useRef(true);
  const cornerLocal = useRef(new THREE.Vector3());
  const cornerWorld = useRef(new THREE.Vector3());

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
    // the spring, but a long frameloop pause must snap, not glide.
    const now = performance.now();
    const gap = lastWallRef.current < 0 ? Infinity : now - lastWallRef.current;
    lastWallRef.current = now;
    const snap = gap > RESUME_IDLE_GAP_MS;

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

    // Scroll-owned rotation through the bounded spring.
    const target = ringRotationForProgress(progressRef.current.progress, undefined, travelFrac);
    const spring = stepRingSpring(springRef.current, target, delta, {
      omega: springOmega,
      zeta: springZeta,
      cap: swayCap,
      snap,
    });
    const front = frontCardIndex(spring.pos);

    const parked = dissipate >= ANCHOR_PUBLISH_DISSIPATE;
    const anchors: RingCardAnchor[] = [];
    const cardW = cardHeight * RING_CARD_ASPECT;

    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = meshRefs.current[i];
      const material = matRefs.current[i];
      if (!mesh || !material) continue;

      const env = entrance === "scroll" ? entranceEnvelope(dissipate, i) : null;
      const placed = placeCard(i, spring.pos, {
        radius,
        yOffset,
        radiusMul: env ? env.radiusMul : 1,
      });

      mesh.position.set(placed.x, placed.y, placed.z);
      mesh.rotation.set(0, cardFacingYaw(placed.rotY, facingBlend), 0);
      const s = depthScale(placed.nz, scaleRange);
      mesh.scale.setScalar(s);

      const opacity =
        depthOpacity(placed.nz, opacityRange) * (env ? env.opacity : 1) * masterOpacity;
      material.opacity = opacity;
      mesh.visible = opacity > 0.004;

      // depthWrite hysteresis — only the near-front card writes depth.
      const write = depthWriteGate(depthWriteRef.current[i], placed.nz) && opacity > 0.55;
      if (write !== material.depthWrite) material.depthWrite = write;
      depthWriteRef.current[i] = write;

      if (publishAnchors && parked && mesh.visible) {
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
        anchors.push({
          serviceId: SERVICES[i].id,
          x: minX,
          y: minY,
          w: maxX - minX,
          h: maxY - minY,
          depth: centreDepth,
          visible: !clipped && opacity > 0.1,
          front: i === front,
        });
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

  const cardW = cardHeight * RING_CARD_ASPECT;
  return (
    <group scale={scale}>
      {SERVICE_PLATES.map((plate, i) => (
        <mesh
          key={plate.id}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          frustumCulled={false}
          visible={false}
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
      ))}
    </group>
  );
}
