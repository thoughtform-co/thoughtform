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
 * filled gold chip, feed caption, includes, title, lede, and the outlined
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

import { resolveScenePalette } from "@/lib/theme/palette";

import { buildCardTrackOrbits } from "./cardTrackOrbits";
import { HologramOrbits } from "./HologramOrbits";
import {
  BAKE_W,
  BAKE_H,
  PAD_X,
  CTA_H,
  CTA_Y0,
  DRAWER_CLOSE_BOX,
  DRAWER_CLOSE_INSET,
  DRAWER_CLOSE_SIZE,
} from "./ringCtaBox";

import { SERVICE_PLATES, type LedeSegment, type ServicePlate } from "../servicePlateData";
import { SERVICES } from "../serviceData";
import { ABOUT_DECK_STAGE } from "../../unifiedServicesInstrument";
import { rigPointerPitchRef, rigPointerYawRef } from "../../rigPointerYawRef";
import { readThemeMode, type ThemeMode } from "@/lib/theme/themeModeRef";
import { useThemeStore } from "@/lib/stores/themeStore";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { readCorridorDissipate } from "@/lib/home-v2/corridorDissipateRef";
import { useHologramConnectors, type RingCardAnchor } from "@/lib/stores/hologramConnectorStore";
import {
  ABOUT_FALLBACK_NDC,
  ABOUT_FALLBACK_SLOT_H_PX,
  DECK_ANCHORS_OFF_EXIT,
  DECK_CARD_SCALE,
  DECK_DEPTH_WRITE_OFF_EXIT,
  DECK_OFFSETS,
  DECK_PHI_TARGETS,
  DECK_PIVOT_LOCAL,
  DECK_FLIP_DAMP_CAP,
  DECK_FLIP_DAMP_RATE,
  DECK_FLIP_SNAP_EPS,
  DECK_RENDER_PITCH,
  DECK_RENDER_REBASE_EXIT,
  DECK_SETTLED_ROTATION,
  aboutDeckFadeT,
  aboutFlipLinearT,
  aboutFlipT,
  deckFlipFromT,
  deckOrder,
  deckStackEnvelope,
  flipRamp,
} from "@/lib/services-ring/aboutDeckMath";
import {
  aboutStageProgressRef,
  type AboutStageProgress,
} from "@/lib/services-ring/aboutStageProgressRef";
import { aboutSlotRef, type AboutSlot } from "@/lib/services-ring/aboutSlotRef";
import { openPlateRef } from "@/lib/services-ring/openPlateRef";
import {
  servicesRingProgressRef,
  type ServicesRingProgress,
} from "@/lib/services-ring/ringProgressRef";
import { seatNdcFromRect, seatWorldHeight } from "@/lib/services-ring/viewportSeat";
import {
  DRAWER_DAMP_RATE,
  DRAWER_HOUSED_DEPTH,
  DRAWER_RENDER_ORDERS,
  DRAWER_REVEAL_FRAC,
  DRAWER_SEAM,
  RING_CARD_RENDER_ORDERS,
  drawerContentDepth,
  openPairPitch,
  openPairYaw,
  drawerOpenBoost,
  drawerRecenterX,
  drawerSlideX,
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
  frontScaleBoost,
  frontWindowWeight,
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

/** Sub-pixel epsilon for the anchor publish delta-gate. 0.75px is below
 *  anything the hit shims or designation callouts can express (they snap
 *  to whole CSS pixels), and above the bounded pointer spring's parked
 *  jitter — so an idle ring publishes nothing. */
const ANCHOR_PUBLISH_EPS_PX = 0.75;

/** Do two anchor sets differ by less than the publish epsilon everywhere?
 *  Exact on identity fields (id / front / visible / drawer presence),
 *  epsilon on every rect channel — same shape as `CorridorArmillary`'s
 *  `featureAnchors` gate. */
function ringAnchorsWithinEpsilon(next: RingCardAnchor[], prev: RingCardAnchor[] | null): boolean {
  if (!prev || prev.length !== next.length) return false;
  for (let i = 0; i < next.length; i++) {
    const a = next[i];
    const b = prev[i];
    if (a.serviceId !== b.serviceId || a.front !== b.front || a.visible !== b.visible) {
      return false;
    }
    if (
      Math.abs(a.x - b.x) > ANCHOR_PUBLISH_EPS_PX ||
      Math.abs(a.y - b.y) > ANCHOR_PUBLISH_EPS_PX ||
      Math.abs(a.w - b.w) > ANCHOR_PUBLISH_EPS_PX ||
      Math.abs(a.h - b.h) > ANCHOR_PUBLISH_EPS_PX ||
      Math.abs(a.depth - b.depth) > 0.002
    ) {
      return false;
    }
    if (!!a.drawer !== !!b.drawer) return false;
    if (a.drawer && b.drawer) {
      if (
        Math.abs(a.drawer.x - b.drawer.x) > ANCHOR_PUBLISH_EPS_PX ||
        Math.abs(a.drawer.y - b.drawer.y) > ANCHOR_PUBLISH_EPS_PX ||
        Math.abs(a.drawer.w - b.drawer.w) > ANCHOR_PUBLISH_EPS_PX ||
        Math.abs(a.drawer.h - b.drawer.h) > ANCHOR_PUBLISH_EPS_PX
      ) {
        return false;
      }
    }
  }
  return true;
}

/** Wall-clock gap treated as an idle resume (frameloop was paused). Raised
 *  200 → 500 ms in ADR-029 Update 5: at 200 ms an ordinary frame hitch
 *  (GC, texture upload, dev-mode overhead) mid-quarter-turn tripped the
 *  gate and the ring visibly TELEPORTED. The snap itself is also now
 *  conditional — see the useFrame comment. */
const RESUME_IDLE_GAP_MS = 500;

/**
 * Intra-card renderOrder offsets in the per-card group's CHILDREN order —
 * `[glow, slab, glint, content, back, veil, drawerSlab, drawerContent,
 * drawerGlint]`. These are the JSX constants, and also the offsets the deck's
 * per-slot rebase adds to its base (glow is dead by the time the rebase
 * engages, so its −0.1 never straddles a slot boundary; the live span
 * 0..0.12 < DECK_RENDER_PITCH 0.16).
 *
 * ⚠ POSITIONAL over `cardGroup.children`, and BOTH rebase loops are bounded
 * by this array's length — a child appended in the JSX without an entry here
 * keeps its JSX renderOrder while its siblings jump to `base + offset`, which
 * breaks deck sorting ONLY during the #about flip (invisible in any lab that
 * parks `aboutProgressRef` at 0). Keep the two in lockstep.
 *
 * ⚠ The back plane at index 4 is CONDITIONAL on `ABOUT_DECK_STAGE`; with the
 * flag off the positional map shifts by one from there on. Harmless today
 * because the rebase only ever runs deck-engaged, which requires that same
 * flag — but it is a landmine if either gate ever changes. The drawer entries
 * are last because appending keeps indices 0–5 stable.
 */
const DECK_INTRA_ORDERS = [
  RING_CARD_RENDER_ORDERS.glow,
  RING_CARD_RENDER_ORDERS.slab,
  RING_CARD_RENDER_ORDERS.glint,
  RING_CARD_RENDER_ORDERS.content,
  RING_CARD_RENDER_ORDERS.back,
  RING_CARD_RENDER_ORDERS.veil,
  DRAWER_RENDER_ORDERS.slab,
  DRAWER_RENDER_ORDERS.content,
  DRAWER_RENDER_ORDERS.glint,
] as const;

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

/* ADR-050 rev 2: the card-hide while its DOM spec plate is open is a SNAP
 * (0 | 1), not a damped fade — see the plate-handoff comment in the frame
 * loop. The rev-1 damp constant (PLATE_HIDE_DAMP_RATE 9) was the crossfade
 * the owner rejected; do not reintroduce a rate here. */

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

/** `cutTopRight` — the TIGHT face drops the TOP-RIGHT chamfer (owner,
 *  2026-07-26): the drawer tray emerges along that edge, and a notched
 *  corner next to the tray's straight top edge read as a misalignment. The
 *  BOTTOM-LEFT chamfer stays — it is the corner the tray never touches, and
 *  it keeps the device's asymmetric identity. `full` keeps both (the
 *  ADR-029 byte-identical restore). */
function traceChamferPath(ctx: CanvasRenderingContext2D, inset: number, cutTopRight = true): void {
  const x = inset;
  const y = inset;
  const w = BAKE_W - inset * 2;
  const h = BAKE_H - inset * 2;
  const ch = BAKE_CH;
  ctx.beginPath();
  ctx.moveTo(x, y);
  if (cutTopRight) {
    ctx.lineTo(x + w - ch, y);
    ctx.lineTo(x + w, y + ch);
  } else {
    ctx.lineTo(x + w, y);
  }
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

/* Tight-face geometry (ADR-050).
 *
 * The face keeps THREE things — chip, title, lede — and drops the two that
 * made the shipped card hard to parse: the dense includes/meta row, and the
 * full-width outlined CTA. The lede stays because it is where "what is this
 * service" actually lands (owner, 2026-07-25); only the logistics move to the
 * open plate.
 *
 * The hierarchy is the real fix. Shipped, the lede (35px) was BIGGER than the
 * title (34px) — two lines at near-equal weight, which is why neither read
 * first. Here the title clearly leads and the lede supports.
 *
 * NOT part of the bake/DOM parity contract: the DOM open plate carries the
 * rest of the stack, so these have no CSS twin to be 2× of. */
const TIGHT_TITLE_PX = 40;
const TIGHT_TITLE_LH = 52;
/** 35px — the size the owner already signed off for the FULL face's lede
 *  (2026-07-17, "this line is where 'what is this service' actually lands").
 *  Rev 3 dropped it to 30 to fix the inverted hierarchy, but that overshot:
 *  on a MacBook-Air-class viewport (~900px tall) the parked card renders
 *  small enough that 30px baked ≈ 13px on screen — unreadable (owner,
 *  2026-07-26). At 35 vs the 40px bold-mono-uppercase title the hierarchy
 *  still reads title-first; the weight/case/typeface differences compound
 *  the 5px, where rev 2's 35-vs-34 had none of them. */
const TIGHT_LEDE_PX = 35;
const TIGHT_LEDE_LH = 50;
/* The EXPAND affordance (owner, 2026-07-26 — replaces the bottom-left
   `OPEN →` chit). A small square chit in the card's TOP-RIGHT carrying the
   universal open-in-full glyph.

   Sized and inset from the DRAWER's close chit deliberately, not by
   coincidence: the control that opens the card and the control that closes it
   then occupy the same corner at the same scale, so the pair reads as one
   family across the open handoff rather than as two unrelated marks. Derived
   rather than duplicated so re-tuning one moves both.

   It also balances the header band — the filled gold chip sits top-LEFT at the
   same optical height, so the two bracket the card's head instead of the
   affordance floating alone above the bottom edge.

   Visual only: the WHOLE card is the hit target (`onOpenFront`), so unlike
   `RING_CARD_CTA_BOX` this needs no normalized box for the DOM to shim. */
const TIGHT_EXPAND_SIZE = DRAWER_CLOSE_SIZE;
const TIGHT_EXPAND_INSET = DRAWER_CLOSE_INSET;
/** Baseline of the LAST lede line. With the chit gone from the bottom the copy
 *  stack drops into the space it vacated; this keeps a bottom margin in the
 *  same rhythm as the full face's CTA (whose box bottoms out at BAKE_H − 44). */
const TIGHT_COPY_BOTTOM = BAKE_H - 72;

type InkRun = { text: string; gold: boolean };

/**
 * Which copy stack the card face bakes (ADR-050).
 *
 *  · `full`  — the historical ADR-029 stack: includes row + title + lede +
 *    outlined CTA over the photo. FIVE content elements, which is the read
 *    the owner called overwhelming on 2026-07-25 (two headline-weight labels
 *    competing, poster and spec sheet mashed into one object).
 *  · `tight` — chip + title + lede + a subtle EXPAND chit in the top-right.
 *    The includes/meta row and the full-width CTA slab are gone; the
 *    breakdown and the spec grid move to the drawer, which slides out of
 *    this card's own right edge. The lede STAYS — it is the line that says
 *    what the service is (owner, 2026-07-25) — but it now sits below a
 *    dominant title instead of competing with it at near-equal size.
 *
 * Kept as a parameter rather than a rewrite so the two can be judged side by
 * side in `/test/services-card-face-lab` and so flipping production is a
 * one-word default change.
 */
export type CardFaceVariant = "full" | "tight";

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

function bakeCardFace(
  plate: ServicePlate,
  img: HTMLImageElement | null,
  variant: CardFaceVariant = "full"
): HTMLCanvasElement {
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
  // The TIGHT face keeps only the BOTTOM-LEFT cut (owner, 2026-07-26): the
  // drawer tray docks along the right edge, so the top-right corner must be
  // square for the pair to align — see traceChamferPath.
  const cutTR = variant === "full";
  ctx.fillStyle = VOID;
  if (cutTR) {
    ctx.beginPath();
    ctx.moveTo(BAKE_W - BAKE_CH, 0);
    ctx.lineTo(BAKE_W, 0);
    ctx.lineTo(BAKE_W, BAKE_CH);
    ctx.closePath();
    ctx.fill();
  }
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
  if (variant === "tight") {
    /* The tight face's shell is OPEN on the right (owner, 2026-07-26): a
       baked right-edge stroke paints at the face's renderOrder — OVER the
       emerged tray — so it read as a vertical rule splitting the open pair.
       Not stroking it costs the CLOSED card nothing: the slab GLINT already
       draws the right silhouette just outboard of the face, and that glint
       renders UNDER the tray's content (0.05 < 0.07), so the seam cleans
       itself the moment the tray emerges. One ink, two states, no swap. */
    ctx.beginPath();
    ctx.moveTo(BAKE_W - 1.5, 1.5);
    ctx.lineTo(1.5, 1.5);
    ctx.lineTo(1.5, BAKE_H - BAKE_CH);
    ctx.lineTo(BAKE_CH, BAKE_H - 1.5);
    ctx.lineTo(BAKE_W - 1.5, BAKE_H - 1.5);
    ctx.stroke();
  } else {
    traceChamferPath(ctx, 1.5, cutTR);
    ctx.stroke();
  }

  // Brighter ticks along the chamfer cuts (the connector plug-in edges).
  ctx.strokeStyle = "rgba(202, 165, 84, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (cutTR) {
    ctx.moveTo(BAKE_W - BAKE_CH, 1.5);
    ctx.lineTo(BAKE_W - 1.5, BAKE_CH);
  }
  ctx.moveTo(1.5, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H - 1.5);
  ctx.stroke();

  // Chip row — the OPEN plate's FILLED gold chip (on-gold ink is
  // latent-night, the shared CTA/chip treatment) + status code right.
  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  ctx.textBaseline = "middle";
  // Service label chip — enlarged (owner 2026-07-17: the top-left service
  // name is the "what is this service" read and wasn't big enough). Font
  // 24 → 30, chip height 54 → 66. The right-side "<CODE> · OPEN" status
  // code was REMOVED in the same pass — decorative HUD filler that crowded
  // the label; `statusCode` stays in servicePlateData for the mobile plate.
  label.letterSpacing = "5px";
  ctx.font = `700 30px ${CARD_FONT}`;
  const chipText = plate.chip.toUpperCase();
  const chipTextW = ctx.measureText(chipText).width;
  const chipH = 66;
  const chipCY = 80;
  const chipY = chipCY - chipH / 2;
  const chipPadL = 34; // chip-left → diamond centre
  const chipGap = 24; // diamond centre → text
  const chipW = chipPadL + chipGap + chipTextW + 34;
  ctx.fillStyle = SERVICES_GOLD;
  ctx.fillRect(44, chipY, chipW, chipH);
  ctx.fillStyle = "#110f09"; // --latent-night
  ctx.save();
  ctx.translate(44 + chipPadL, chipCY);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-5.5, -5.5, 11, 11);
  ctx.restore();
  ctx.fillText(chipText, 44 + chipPadL + chipGap, chipCY + 2);

  /* ── Copy stack — the open C3 plate's text, bottom-anchored above the
     fixed CTA box (sizes = 2× the services.css open-plate values). ── */
  const maxW = BAKE_W - PAD_X * 2;
  ctx.textBaseline = "alphabetic";

  if (variant === "tight") {
    /* ── TIGHT face (ADR-050) — chip · title · lede · a top-right EXPAND chit ──
       Drops the includes/meta row and the full-width CTA slab; keeps the
       lede, which is the line that says what the service actually is.

       Built BOTTOM-UP from the card's bottom margin so a longer title or a
       three-line lede grows upward into the photo. The affordance no longer
       constrains that growth — it moved to the header band (owner,
       2026-07-26), which is also why the copy can now run to the bottom edge. */

    /* The EXPAND affordance — the universal open-in-full glyph in a hairline
       chit, top-right. Without SOMETHING here the tight card reads as a poster
       and nobody discovers that it opens; an icon carries that at a fraction
       of the ink the old `OPEN →` chit spent, and it stops competing with the
       title for the bottom-left reading position.

       Two diagonal arrows striking opposite corners. Drawn rather than typed:
       there is no glyph for this in the card's mono face, and a text arrow
       would sit on the font's baseline metrics instead of the chit's centre. */
    {
      const ex0 = BAKE_W - TIGHT_EXPAND_INSET - TIGHT_EXPAND_SIZE;
      const ey0 = TIGHT_EXPAND_INSET;
      ctx.strokeStyle = "rgba(202, 165, 84, 0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ex0, ey0, TIGHT_EXPAND_SIZE, TIGHT_EXPAND_SIZE);

      // Glyph inset inside the chit; `arm` is the arrowhead leg length.
      const gp = 16;
      const arm = 10;
      const gx0 = ex0 + gp;
      const gy0 = ey0 + gp;
      const gx1 = ex0 + TIGHT_EXPAND_SIZE - gp;
      const gy1 = ey0 + TIGHT_EXPAND_SIZE - gp;
      // Brighter than its box: the chit should recede, the mark should read.
      ctx.strokeStyle = "rgba(202, 165, 84, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "square";
      ctx.beginPath();
      ctx.moveTo(gx0, gy1);
      ctx.lineTo(gx1, gy0);
      // Arrowhead into the top-right corner.
      ctx.moveTo(gx1 - arm, gy0);
      ctx.lineTo(gx1, gy0);
      ctx.lineTo(gx1, gy0 + arm);
      // Arrowhead into the bottom-left corner.
      ctx.moveTo(gx0 + arm, gy1);
      ctx.lineTo(gx0, gy1);
      ctx.lineTo(gx0, gy1 - arm);
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    // Lede — sans body, `{ em }` spans upright gold (no-italics rule). Now
    // SMALLER than the title so the hierarchy reads title-first.
    label.letterSpacing = "0px";
    ctx.font = `400 ${TIGHT_LEDE_PX}px ${CARD_SANS}`;
    const ledeLines = wrapRuns(ctx, plate.lede, maxW);
    const ledeBottom = TIGHT_COPY_BOTTOM;
    ledeLines.forEach((line, i) => {
      drawRunLine(
        ctx,
        line,
        PAD_X,
        ledeBottom - (ledeLines.length - 1 - i) * TIGHT_LEDE_LH,
        `rgba(${DAWN}, 0.82)`
      );
    });
    const ledeTop = ledeBottom - (ledeLines.length - 1) * TIGHT_LEDE_LH - 24;

    // Title — mono bold uppercase, the dominant line.
    label.letterSpacing = "3px";
    ctx.font = `700 ${TIGHT_TITLE_PX}px ${CARD_FONT}`;
    const titleLines = wrapRuns(ctx, [plate.title.toUpperCase()], maxW);
    const titleBottom = ledeTop - 30;
    titleLines.forEach((line, i) => {
      drawRunLine(
        ctx,
        line,
        PAD_X,
        titleBottom - (titleLines.length - 1 - i) * TIGHT_TITLE_LH,
        `rgb(${DAWN})`
      );
    });

    label.letterSpacing = "0px";
    return canvas;
  }

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

  // Lede — sans body, `{ em }` spans upright gold (no-italics rule).
  // 35px + dawn 0.92 (owner 2026-07-17: bigger + less gray — this line is
  // where "what is this service" actually lands, so it must read first).
  // Keep = 2× the .svc-plate__lede CSS value (17.5px) — the bake/DOM
  // parity contract. Seated directly above the CTA now that the includes
  // row moved to the TOP of the copy stack (above the title, owner
  // 2026-07-17).
  label.letterSpacing = "0px";
  ctx.font = `400 35px ${CARD_SANS}`;
  const ledeLines = wrapRuns(ctx, plate.lede, maxW);
  const LEDE_LH = 51;
  // Gap above the CTA — 60 (owner 2026-07-17): with the includes row moved
  // to the top of the stack, the LEDE (body copy) now sits directly over
  // the button, and body text crowds a CTA more than the old meta line did.
  // Enlarged 34 → 60 so the button reads as deliberately separated from the
  // paragraph (well above the ~26 inter-block gaps). = 2× the DOM plate's
  // .svc-plate__cta margin-top (30px) — the bake/DOM parity contract.
  const ledeBottom = CTA_Y0 - 60;
  ledeLines.forEach((line, i) => {
    drawRunLine(
      ctx,
      line,
      PAD_X,
      ledeBottom - (ledeLines.length - 1 - i) * LEDE_LH,
      `rgba(${DAWN}, 0.92)`
    );
  });
  const ledeTop = ledeBottom - (ledeLines.length - 1) * LEDE_LH - 28;

  // Title — mono bold uppercase (the plate headline), above the lede.
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
  const titleTop = titleBottom - (titleLines.length - 1) * TITLE_LH - 30;

  // Includes row — the meta line (cadence · memos · … · NL/EN) now LEADS
  // the copy stack, ABOVE the title (owner 2026-07-17). Mono chips with
  // gold `·` separators. The old feed caption that used to sit above the
  // title stays REMOVED — this row takes that slot; feedLabel/feedStatus
  // remain in servicePlateData for the mobile plate.
  label.letterSpacing = "3px";
  ctx.font = `400 18px ${CARD_FONT}`;
  const incSegments: LedeSegment[] = [];
  plate.includes.forEach((item, i) => {
    if (i > 0) incSegments.push({ em: "·" });
    incSegments.push(item.toUpperCase());
  });
  const incLines = wrapRuns(ctx, incSegments, maxW);
  const INC_LH = 30;
  // Gap below the includes, above the title = 24 = 2× the DOM plate's
  // .svc-plate__title margin-top (12px) — the bake/DOM parity contract.
  const incBottom = titleTop - 24;
  incLines.forEach((line, i) => {
    drawRunLine(
      ctx,
      line,
      PAD_X,
      incBottom - (incLines.length - 1 - i) * INC_LH,
      `rgba(${DAWN}, 0.5)`
    );
  });

  return canvas;
}

/**
 * The DRAWER face (ADR-050 rev 3) — the open state's content, baked at the
 * card's own dimensions so it shares the plane geometry and the bake/DOM
 * parity arithmetic.
 *
 * This is the whole reason the open state moved into the canvas: three
 * earlier revisions put it in the DOM and every one read as "switching to
 * another component", because a flat DOM rect cannot be a
 * perspective-projected, pointer-tilted, bloomed slab. Baked here, the
 * drawer IS a slab in the same group as the card.
 *
 * Content is the owner's proposal grammar minus `03 / WHO` (that is #about):
 *   01 / WHAT — the concrete breakdown
 *   02 / HOW  — the qualification grid (no price; see ServiceSpec)
 * plus the CTA at `DRAWER_CTA_BOX` and the close chit at `DRAWER_CLOSE_BOX`,
 * whose normalized rects are the contract with the DOM hit shims.
 *
 * Ground is OPAQUE void, like the card face — the drawer is the "screen"
 * half of the device's material law, and a translucent ground would let the
 * card behind it show through as the slabs overlap at the seam.
 */
/**
 * The drawer's per-theme palette (owner, 2026-08-02: "the opened services
 * cards semantic dawn with tensor gold and latent night accents").
 *
 * DARK is the shipped ADR-050 literals, verbatim — the dark bake must stay
 * byte-identical (theme-parity law). LIGHT re-papers the spec sheet:
 * Semantic Dawn ground (`--dawn` #ece3d6), Latent Night ink (#110f09) for
 * everything that is READ, and the light-role gold (#9a7a2e — the light
 * `--gold` token; wayfinding gold runs at full strength on parchment) for
 * everything that POINTS. The CARD half of the open pair keeps its
 * photo-dark treatment in both themes — kept-dark imagery is a Lane-0
 * decision (ADR-058), and the tray reading as a paper pull-out against the
 * dark device is the contrast that sells "spec sheet".
 */
interface DrawerPalette {
  /** Plate ground. */
  ground: string;
  /** Body-copy ink at full read strength. */
  ink: (a: number) => string;
  /** The pointing color — desigs, bullets, CTA, shell, spec highlights. */
  gold: string;
  /** Gold with alpha, for the shell gradient stops. */
  goldA: (a: number) => string;
  /** The wash's second family (dawn on dark, ink on light). */
  washA: (a: number) => string;
  /** Seam shadow color (the card's overhang). */
  seamA: (a: number) => string;
}

const DRAWER_DARK: DrawerPalette = {
  ground: VOID,
  ink: (a) => `rgba(${DAWN}, ${a})`,
  gold: SERVICES_GOLD,
  goldA: (a) => `rgba(202, 165, 84, ${a})`,
  washA: (a) => `rgba(${DAWN}, ${a})`,
  seamA: (a) => `rgba(5, 4, 3, ${a})`,
};
const DRAWER_LIGHT: DrawerPalette = {
  ground: "#ece3d6",
  ink: (a) => `rgba(17, 15, 9, ${a})`,
  gold: "#9a7a2e",
  goldA: (a) => `rgba(154, 122, 46, ${a})`,
  washA: (a) => `rgba(17, 15, 9, ${a})`,
  seamA: (a) => `rgba(17, 15, 9, ${a * 0.45})`,
};

function bakeDrawerFace(plate: ServicePlate, pal: DrawerPalette): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = BAKE_W;
  canvas.height = BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const label = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  const maxW = BAKE_W - PAD_X * 2;

  // Ground — opaque, with a whisper of the glass gradient so the drawer
  // is not a flat rectangle next to the photo-lit card.
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);
  const wash = ctx.createLinearGradient(0, 0, BAKE_W * 0.4, BAKE_H);
  wash.addColorStop(0, pal.washA(0.05));
  wash.addColorStop(0.5, pal.washA(0.012));
  wash.addColorStop(1, pal.goldA(0.03));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);

  /* ── Tray chrome (owner, 2026-07-26 — replaces the card's chamfer chrome
     verbatim). Rev 3 gave the drawer the card's full silhouette — chamfer
     notches, closed shell, cut ticks — and the owner read the result as a
     SECOND CARD parked next to the first, not as the first card unfolding.
     He was right about the grammar: the chamfer IS this device's identity
     mark, so repeating it declares "another device".

     The tray is therefore deliberately SUBORDINATE: a plain rectangle whose
     border runs top → right → bottom and never closes the LEFT edge — the
     seam side stays open so the panel reads as continuous with the card it
     slides out of. The matching 3D change (rectangular slab + open glint) is
     in the drawer geometry memos. */
  const shell = ctx.createLinearGradient(0, 0, BAKE_W * 0.25, BAKE_H);
  shell.addColorStop(0, "rgba(202, 165, 84, 0.52)");
  shell.addColorStop(0.38, `rgba(${DAWN}, 0.14)`);
  shell.addColorStop(0.66, "rgba(202, 165, 84, 0.16)");
  shell.addColorStop(1, "rgba(202, 165, 84, 0.48)");
  ctx.strokeStyle = shell;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 1.5);
  ctx.lineTo(BAKE_W - 1.5, 1.5);
  ctx.lineTo(BAKE_W - 1.5, BAKE_H - 1.5);
  ctx.lineTo(0, BAKE_H - 1.5);
  ctx.stroke();

  // Seam shadow — the card overhangs the tray it houses, so the tray darkens
  // toward the joint. This is the depth cue that sells "slides out from
  // under", and it replaces every stroke the left edge no longer gets.
  const seam = ctx.createLinearGradient(0, 0, 130, 0);
  seam.addColorStop(0, pal.seamA(0.6));
  seam.addColorStop(1, pal.seamA(0));
  ctx.fillStyle = seam;
  ctx.fillRect(0, 0, 130, BAKE_H);

  /* ── Close chit — a bare ✕ in a hairline box at DRAWER_CLOSE_BOX ─────── */
  const closeX = DRAWER_CLOSE_BOX.x * BAKE_W;
  const closeY = DRAWER_CLOSE_BOX.y * BAKE_H;
  const closeW = DRAWER_CLOSE_BOX.w * BAKE_W;
  const closeH = DRAWER_CLOSE_BOX.h * BAKE_H;
  ctx.strokeStyle = pal.ink(0.22);
  ctx.lineWidth = 2;
  ctx.strokeRect(closeX, closeY, closeW, closeH);
  ctx.strokeStyle = pal.ink(0.6);
  ctx.lineWidth = 2.5;
  const cInset = closeW * 0.34;
  ctx.beginPath();
  ctx.moveTo(closeX + cInset, closeY + cInset);
  ctx.lineTo(closeX + closeW - cInset, closeY + closeH - cInset);
  ctx.moveTo(closeX + closeW - cInset, closeY + cInset);
  ctx.lineTo(closeX + cInset, closeY + closeH - cInset);
  ctx.stroke();

  /* ── 01 / WHAT ──────────────────────────────────────────────────────────
     Body sizes raised 27 → 31 and ink lifted to 0.9 (owner, 2026-07-26):
     on a MacBook-Air-class viewport the parked pair renders small enough
     that the rev-3 sizes fell under comfortable reading size, and the ADR
     had already flagged the drawer ink as "slightly dimmer, untuned". The
     drawer has the vertical room — its column ends well above the CTA. */
  ctx.textBaseline = "alphabetic";
  let y = 150;

  const drawDesig = (text: string, atY: number): number => {
    label.letterSpacing = "4px";
    ctx.font = `400 20px ${CARD_FONT}`;
    ctx.fillStyle = pal.goldA(0.75);
    ctx.fillText(text.toUpperCase(), PAD_X, atY);
    label.letterSpacing = "0px";
    return atY + 50;
  };

  y = drawDesig("01 / What", y);

  // Breakdown bullets — gold diamonds, never dots (shape law).
  label.letterSpacing = "0px";
  ctx.font = `400 31px ${CARD_SANS}`;
  const BULLET_LH = 44;
  const BULLET_GAP = 24;
  const bulletIndent = 38;
  for (const item of plate.breakdown) {
    const lines = wrapRuns(ctx, [item], maxW - bulletIndent);
    ctx.fillStyle = pal.goldA(0.6);
    ctx.save();
    ctx.translate(PAD_X + 7, y - 10);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5.5, -5.5, 11, 11);
    ctx.restore();
    lines.forEach((line, i) => {
      drawRunLine(ctx, line, PAD_X + bulletIndent, y + i * BULLET_LH, pal.ink(0.9));
    });
    y += lines.length * BULLET_LH + BULLET_GAP;
  }

  /* ── 02 / HOW — the qualification grid ──────────────────────────────── */
  y += 34;
  ctx.strokeStyle = pal.ink(0.1);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD_X, y - 42);
  ctx.lineTo(PAD_X + maxW, y - 42);
  ctx.stroke();
  y = drawDesig("02 / How", y);

  const colW = maxW / 2;
  const drawSpecCell = (dt: string, dd: string, cx: number, cy: number, wide: boolean): number => {
    label.letterSpacing = "3px";
    ctx.font = `400 19px ${CARD_FONT}`;
    ctx.fillStyle = pal.ink(0.45);
    ctx.fillText(dt.toUpperCase(), cx, cy);
    label.letterSpacing = "0px";
    ctx.font = `400 31px ${CARD_SANS}`;
    const lines = wrapRuns(ctx, [dd], (wide ? maxW : colW) - 24);
    lines.forEach((line, i) => {
      drawRunLine(ctx, line, cx, cy + 40 + i * 38, wide ? pal.gold : pal.ink(0.9));
    });
    return 40 + lines.length * 38;
  };

  const rowA = Math.max(
    drawSpecCell("Duration", plate.spec.duration, PAD_X, y, false),
    drawSpecCell("Participants", plate.spec.participants, PAD_X + colW, y, false)
  );
  y += rowA + 34;
  const rowB = Math.max(
    drawSpecCell("Format", plate.spec.format, PAD_X, y, false),
    drawSpecCell("Language", plate.spec.language, PAD_X + colW, y, false)
  );
  y += rowB + 34;
  drawSpecCell("Leaves with", plate.spec.leavesWith, PAD_X, y, true);

  /* ── CTA — the card's own treatment, at the shared box ──────────────── */
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

  return canvas;
}

/** Mirrored chamfer trace (TL/BR cuts) for the PORTRAIT BACK bake: the
 *  slab itself carries only the deck's Ry(π) at full flip, so its physical
 *  TR/BL chamfers land at screen TL/BR — the back face must frame the
 *  OTHER two corners for its chrome to align with the flipped silhouette.
 *  (Same TL/BR cut set as the retired Rx(π) flip — a π flip about either
 *  in-plane axis maps the TR/BL diagonal onto the TL/BR one.) */
/** `cutTopLeft` — the mirrored twin of `traceChamferPath`'s `cutTopRight`:
 *  the flip maps the physical TOP-RIGHT cut to screen TOP-LEFT, so when the
 *  tight silhouette drops the physical TR chamfer the back face must drop
 *  its TL chrome to stay aligned with the slab it is baked onto. The BR cut
 *  (physical BL) survives in both variants. */
function traceChamferPathMirrored(
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

/**
 * The deck's PORTRAIT BACK face (ADR-047): Vince's portrait under the same
 * gold-tone card treatment as the four service faces — it reads as the
 * fifth face of the same deck. Minimal chrome only (no chip row, no copy
 * stack, no CTA — and no fonts, so this bake never waits on
 * `waitForCardFonts`). Drawn UPRIGHT: the back plane carries
 * `rotation.y = π`, and the deck's own Ry(π) flip composes with it to
 * identity, so the canvas reads exactly like an unrotated front plane at
 * full flip (see the back-plane JSX note).
 */
function bakePortraitBack(
  img: HTMLImageElement | null,
  variant: CardFaceVariant = "full"
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = BAKE_W;
  canvas.height = BAKE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = VOID;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);

  if (img) {
    // Portrait, cover-fit + the shared gold-tone LUT pass (identical to the
    // service faces — buildGoldToneLut).
    const scale = Math.max(BAKE_W / img.naturalWidth, BAKE_H / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, (BAKE_W - dw) / 2, (BAKE_H - dh) / 2, dw, dh);
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
    // Schematic dot-grid stand-in — the deck never flips to a raw void back.
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

  // Gentle top + ground scrims — the portrait carries no copy, so these
  // only seat the face into the slab (no deep copy-ground needed).
  const top = ctx.createLinearGradient(0, 0, 0, 150);
  top.addColorStop(0, "rgba(5, 4, 3, 0.55)");
  top.addColorStop(1, "rgba(5, 4, 3, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, BAKE_W, 150);
  const ground = ctx.createLinearGradient(0, BAKE_H - 320, 0, BAKE_H);
  ground.addColorStop(0, "rgba(5, 4, 3, 0)");
  ground.addColorStop(1, "rgba(5, 4, 3, 0.72)");
  ctx.fillStyle = ground;
  ctx.fillRect(0, BAKE_H - 320, BAKE_W, 320);

  // MIRRORED chamfer corners (see traceChamferPathMirrored) — opaque void,
  // same contract as the front faces. `tight` drops the TL cut (the flipped
  // image of the physical TR chamfer the tight slab no longer has).
  const cutTL = variant === "full";
  ctx.fillStyle = VOID;
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
  shell.addColorStop(0, "rgba(202, 165, 84, 0.52)");
  shell.addColorStop(0.38, `rgba(${DAWN}, 0.14)`);
  shell.addColorStop(0.66, "rgba(202, 165, 84, 0.16)");
  shell.addColorStop(1, "rgba(202, 165, 84, 0.48)");
  ctx.strokeStyle = shell;
  ctx.lineWidth = 2.5;
  traceChamferPathMirrored(ctx, 1.5, cutTL);
  ctx.stroke();
  ctx.strokeStyle = "rgba(202, 165, 84, 0.85)";
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

/** Portrait source for the deck's back face — produced by
 *  scripts/services-photos/prepare.mjs (the `vince` entry), same 840×1360
 *  card crop as the service photos. */
const PORTRAIT_BACK_SRC = "/images/services/vince.jpg";

/* ── Component ──────────────────────────────────────────────────────────── */

export interface ServicesCardRingProps {
  /** Instrument scale — pass the armillary scale so ring radii live in the
   *  same orbit-config space as `HologramOrbits` (corridor: 0.62). */
  scale?: number;
  /** Runway progress source. Defaults to the module bridge ref written by
   *  useServicesStageScroll; labs pass their own simulate-scroll ref. */
  progressRef?: { current: ServicesRingProgress };
  /** About stage progress source (ADR-047 deck flip). Defaults to the
   *  module bridge ref written by useAboutStageScroll; labs pass their own
   *  simulated ref. */
  aboutProgressRef?: { current: AboutStageProgress };
  /** About portrait-slot rect source (the deck's seat). Defaults to the
   *  module ref written by useAboutStageScroll. */
  aboutSlotSource?: { current: AboutSlot };
  /** Dissipate clock for the dock entrance. Corridor passes
   *  `getSmoothedDissipate`; default reads `--corridor-dissipate` (damped),
   *  the `HologramOrbits` pattern. Ignored when `entrance="off"`. */
  dissipateGetter?: () => number;
  /** "scroll" = staggered fly-in off the dissipate clock; "off" = parked. */
  entrance?: "scroll" | "off";
  /** Publish per-card screen rects to `hologramConnectorStore.ringAnchors`
   *  (production hit-areas). Off in labs. */
  publishAnchors?: boolean;
  /** Which copy stack the faces bake (ADR-050). Defaults to `full` — the
   *  historical ADR-029 stack — so production and every existing lab stay
   *  byte-identical until the default is deliberately flipped. Changing it
   *  re-runs the bake effect. */
  faceVariant?: CardFaceVariant;
  /**
   * Mount the ADR-050 rev-3 in-canvas DRAWER (the open state): a second
   * card-sized slab per card that slides out from behind the card when that
   * service's plate is opened via `openPlateRef`.
   *
   * Off by default, so production stays byte-identical — no drawer bake is
   * fetched, no extra children exist, and the frame loop's drawer work is
   * skipped entirely. Lab-only until promotion.
   */
  openDrawer?: boolean;
  /** 0 = tidally locked outward (side cards edge-on), 1 = always facing the
   *  rig's forward axis. Partial blends keep the orbit read while photos
   *  stay visible in transit. Default RING_FACING_BLEND. */
  facingBlend?: number;
  masterOpacity?: number;
  /**
   * Per-frame master opacity, multiplied on top of `masterOpacity`. Mirrors
   * `HologramOrbits`' prop of the same name — a GETTER, so a scroll-frame
   * scalar can drive it without re-rendering this tree. Lands in `master`,
   * and the hit-anchor publish gate reads the resulting `opacity`, so 0 here
   * also unpublishes the click targets.
   *
   * NOTE (ADR-056 rev): production does NOT use this for the proof casefile
   * any more — a master fade made the cards CROSSFADE in after the dwell.
   * The release now gates the ENTRANCE CLOCK instead (`ringEntranceClock` in
   * `CorridorArmillary`), so the cards replay their directional fly-in. This
   * prop stays as the generic per-frame dimmer it always was.
   */
  masterOpacityGetter?: () => number;
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
  aboutProgressRef = aboutStageProgressRef,
  aboutSlotSource = aboutSlotRef,
  dissipateGetter,
  entrance = "scroll",
  publishAnchors = false,
  faceVariant = "full",
  openDrawer = false,
  facingBlend = RING_FACING_BLEND,
  masterOpacity = 1,
  masterOpacityGetter,
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
  // The deck's shared portrait back (ADR-047): ONE texture + ONE material +
  // ONE geometry across all four back planes — the backs are only ever
  // seen converged (the flip), so identical faces are correct and cheap.
  const [backTexture, setBackTexture] = useState<THREE.CanvasTexture | null>(null);
  // ADR-050 rev 3: per-card DRAWER faces. Unlike the deck's shared back,
  // each drawer carries its OWN service's spec, so this is a per-card array
  // like `textures`. Null until baked (and forever when `openDrawer` is off).
  const [drawerTextures, setDrawerTextures] = useState<THREE.CanvasTexture[] | null>(null);
  /** Lazy-bake latch (ADR-050 promotion): flipped once by the frame loop the
   *  first time a service is opened, then never cleared for this mount. The
   *  ref is the re-entry guard — the frame loop runs at 60 Hz and would
   *  otherwise call `setDrawerRequested` every frame until the state landed. */
  const [drawerRequested, setDrawerRequested] = useState(false);
  const drawerRequestedRef = useRef(false);
  /* The DRAWER's theme (ADR-050 + ADR-058, 2026-08-02). The spec sheet is a
     baked texture, so the CSS flip cannot reach it — the mode travels as
     React state and the bake/material memos key on it. Dark values are the
     shipped literals (byte-identical); light re-papers the tray in Semantic
     Dawn / Latent Night / light-role gold. Card faces deliberately do NOT
     re-bake — kept-dark imagery, ADR-058 Lane 0. */
  const [drawerTheme, setDrawerTheme] = useState<ThemeMode>(readThemeMode);
  useEffect(() => {
    const sync = () => setDrawerTheme(readThemeMode());
    sync();
    return useThemeStore.subscribe(sync);
  }, []);
  const cardGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]); // content planes (anchor projection)
  const matRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]); // content materials
  /* ── Drawer refs (ADR-050 rev 3) ─────────────────────────────────────── */
  const drawerGroupRefs = useRef<Array<THREE.Group | null>>([]);
  const drawerMeshRefs = useRef<Array<THREE.Mesh | null>>([]); // for anchor projection
  const drawerMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  /** Per-card damped open level, 0 = shut. The `veilLevelRef` pattern. */
  const drawerLevelRef = useRef<number[]>(new Array(RING_COUNT).fill(0));
  const depthWriteRef = useRef<boolean[]>(new Array(RING_COUNT).fill(false));
  const springRef = useRef<RingSpringState>({ pos: 0, vel: 0 });
  const lastWallRef = useRef(-1);
  // Damped CSS-var dissipate (fallback path); −1 sentinel = snap on first read.
  const dissipateRef = useRef(-1);
  const anchorsClearedRef = useRef(true);
  /** Last-published anchor set for the epsilon delta-gate below —
   *  `CorridorArmillary`'s scan-anchor precedent (2026-07-16 perf pass),
   *  which this publisher missed: a fresh array every parked frame
   *  re-rendered BOTH subscribers (`ServicesRingHitAreas`,
   *  `ServicesDesignationLayer`) per frame even with the ring at rest. */
  const publishedAnchorsRef = useRef<RingCardAnchor[] | null>(null);
  const cornerLocal = useRef(new THREE.Vector3());
  const cornerWorld = useRef(new THREE.Vector3());

  /* ── About deck (ADR-047) — scratch objects for the per-frame seat
     targeting. The deck pivot's seat is derived VIEWPORT-FIRST every frame
     (DOM slot rect → NDC → camera space at the pivot's live depth → world
     → ring-local via one shared inverse parent matrix), so the brandmark
     recede, pointer-look residue, resize, and DPR steps are all
     compensated automatically — never a fixed world offset
     (BEST-PRACTICES; the ADR-034 terrace precedent). No per-frame
     allocation. */
  const ringGroupRef = useRef<THREE.Group>(null);
  const deckParentInv = useRef(new THREE.Matrix4());
  const deckParentCol = useRef(new THREE.Vector3());
  const deckWorldScratch = useRef(new THREE.Vector3());
  const deckCamScratch = useRef(new THREE.Vector3());
  const deckSeatScratch = useRef(new THREE.Vector3());
  /** True while the deck's explicit per-slot renderOrder rebase is applied
   *  (restored to the JSX constants exactly once on disengage). */
  const deckOrderAppliedRef = useRef(false);
  /** Damped flip clock (ADR-047 Update 4): `t` follows the ramped scroll
   *  target through DECK_FLIP_DAMP_RATE; `live` gates snap-on-engage. */
  const deckFlipDampRef = useRef({ t: 0, live: false });

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
    // Chamfers — the bake's `.svc-plate__sh` polygon (CanvasTexture top row
    // = plane +y). `full`: top-right (+x,+y) AND bottom-left (−x,−y), the
    // historical ADR-029 silhouette. `tight`: BOTTOM-LEFT ONLY (owner,
    // 2026-07-26) — the drawer tray docks along +x, so the top-right corner
    // must be square for the open pair's top edges to align. The bake's
    // chrome and the portrait back's mirrored chrome follow the same rule.
    const shape = new THREE.Shape();
    shape.moveTo(-hw, hh);
    if (faceVariant === "full") {
      shape.lineTo(hw - ch, hh);
      shape.lineTo(hw, hh - ch);
    } else {
      shape.lineTo(hw, hh);
    }
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
  }, [slabW, slabH, slabDepth, faceVariant]);
  const glintGeometry = useMemo(() => new THREE.EdgesGeometry(slabGeometry), [slabGeometry]);
  useEffect(() => {
    return () => {
      slabGeometry.dispose();
      glintGeometry.dispose();
    };
  }, [slabGeometry, glintGeometry]);

  /* ── Drawer TRAY geometry (owner, 2026-07-26) ──────────────────────────────
     Rev 3 reused the card's `slabGeometry`/`glintGeometry` for the drawer —
     "two slabs of one device" — and the owner read the chamfered twin as a
     SECOND CARD, not the first one unfolding. The chamfer is the device's
     identity mark; only the CARD gets it. The drawer is a subordinate tray:

     · a plain rectangular slab (same Extrude recipe, so the [caps, walls]
       material-group pairing is preserved);
     · a glint that traces top / right / bottom ONLY — the LEFT (seam) edge
       stays unlit, because a gold line at the joint would re-assert exactly
       the separation the tray exists to dissolve. The bake mirrors this
       (open border + seam shadow in `bakeDrawerFace`).

     Built only under `openDrawer`, like the drawer materials. */
  const drawerSlabGeometry = useMemo(() => {
    if (!openDrawer) return null;
    const hw = slabW / 2;
    const hh = slabH / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, hh);
    shape.lineTo(hw, hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(-hw, -hh);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: slabDepth,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -slabDepth / 2);
    return geometry;
  }, [openDrawer, slabW, slabH, slabDepth]);
  const drawerGlintGeometry = useMemo(() => {
    if (!openDrawer) return null;
    const hw = slabW / 2;
    const hh = slabH / 2;
    const hd = slabDepth / 2;
    const pts: number[] = [];
    const seg = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) =>
      pts.push(ax, ay, az, bx, by, bz);
    // FRONT face outline only, minus the seam (left) edge. The original
    // also traced the BACK face's U — and because the seam edge is
    // deliberately unlit, the back U had no left edge either, so under any
    // tilt the eye saw two disconnected U-shapes joined only at the leading
    // corner: a textbook impossible object (owner, 2026-08-02,
    // "Escher-esque"). A closed solid can afford both silhouettes; an open
    // bracket cannot. The two leading depth edges stay — they are what
    // keeps the tray's open end reading as a slab with thickness.
    seg(-hw, hh, hd, hw, hh, hd); // top
    seg(hw, hh, hd, hw, -hh, hd); // leading (right) edge
    seg(hw, -hh, hd, -hw, -hh, hd); // bottom
    seg(hw, hh, hd, hw, hh, -hd);
    seg(hw, -hh, hd, hw, -hh, -hd);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geometry;
  }, [openDrawer, slabW, slabH, slabDepth]);
  useEffect(() => {
    return () => {
      drawerSlabGeometry?.dispose();
      drawerGlintGeometry?.dispose();
    };
  }, [drawerSlabGeometry, drawerGlintGeometry]);

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
  /* ── Drawer materials (ADR-050 rev 3) ────────────────────────────────────
     Same material RECIPE as the card's slab/glint, but its own instances,
     because the drawer's opacity rides the open clock while the card's rides
     card presence. (The GEOMETRY is no longer shared — see the tray memos
     above: the drawer is a plain rectangle with an open glint, owner
     2026-07-26.) Built only under `openDrawer` so the flag-off path
     allocates nothing. */
  const drawerSlabMaterials = useMemo(
    () =>
      !openDrawer
        ? null
        : SERVICE_PLATES.map(() => {
            const shared = {
              transparent: true,
              opacity: 0,
              depthWrite: false,
              depthTest: true,
              blending: THREE.NormalBlending,
              toneMapped: false,
              side: THREE.FrontSide,
            } as const;
            /* Caps sit visible only as the bezel ring around the content
               plane; light gives them a dawn glass one step deeper than the
               bake's ground so the ring still reads. Walls/glint take the
               light-role gold — same pigment the bake's chrome uses. */
            const caps = drawerTheme === "light" ? "#ded2c0" : "#14110c";
            const walls = drawerTheme === "light" ? "#9a7a2e" : SERVICES_GOLD;
            return [
              new THREE.MeshBasicMaterial({ ...shared, color: new THREE.Color(caps) }),
              new THREE.MeshBasicMaterial({ ...shared, color: new THREE.Color(walls) }),
            ] as [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial];
          }),
    [openDrawer, drawerTheme]
  );
  const drawerGlintMaterials = useMemo(
    () =>
      !openDrawer
        ? null
        : SERVICE_PLATES.map(
            () =>
              new THREE.LineBasicMaterial({
                color: new THREE.Color(drawerTheme === "light" ? "#9a7a2e" : SERVICES_GOLD),
                transparent: true,
                opacity: 0,
                depthWrite: false,
                toneMapped: false,
              })
          ),
    [openDrawer, drawerTheme]
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
  useEffect(() => {
    return () => {
      if (drawerSlabMaterials) {
        for (const [caps, walls] of drawerSlabMaterials) {
          caps.dispose();
          walls.dispose();
        }
      }
      if (drawerGlintMaterials) {
        for (const material of drawerGlintMaterials) material.dispose();
      }
    };
  }, [drawerSlabMaterials, drawerGlintMaterials]);

  // Hover-resolve (Update 3): track the pointer window-level (the canvas is
  // pointer-events:none — the pointer-look precedent) and test it against
  // the card rects projected in the frame loop; the hovered card's veil
  // damps toward its resolved level.
  const pointerPxRef = useRef({ x: -1, y: -1 });
  const hoverRectsRef = useRef<
    Array<{ x: number; y: number; w: number; h: number; nz: number } | null>
  >(new Array(RING_COUNT).fill(null));
  const veilLevelRef = useRef<number[]>(new Array(RING_COUNT).fill(1));
  /* ADR-050 rev 3 removed the rev-2 `plateHideRef` channel entirely: the card
     no longer hides when its open state appears, because the open state IS
     this card now (the in-canvas drawer below). Nothing should ever hide the
     card again — that hide was the crossfade the owner rejected. */
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
          return bakeCardFace(plate, img, faceVariant);
        })
      );
      if (disposed) return;
      const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 1;
      const toTexture = (canvas: HTMLCanvasElement) => {
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, maxAniso);
        texture.needsUpdate = true;
        return texture;
      };
      setTextures(baked.map(toTexture));
      // The portrait back bakes independently (no fonts, one photo) and
      // only under the deck flag — flag-off never fetches the asset.
      if (ABOUT_DECK_STAGE) {
        let portrait: HTMLImageElement | null = null;
        try {
          portrait = await loadImage(PORTRAIT_BACK_SRC);
        } catch {
          portrait = null; // schematic fallback keeps the flip whole
        }
        if (disposed) return;
        setBackTexture(toTexture(bakePortraitBack(portrait, faceVariant)));
      }
    })();
    return () => {
      disposed = true;
    };
  }, [gl, faceVariant]);

  /* ── The DRAWER bake is LAZY (ADR-050 promotion, owner 2026-07-26) ────────
     Four drawer faces cost ~18 MB of texture, and most visitors scroll the
     ring without ever opening a card — so the bake waits for the first open
     REQUEST rather than running at mount. `drawerRequested` is latched once
     by the frame loop (which is the only reader of `openPlateRef`) and never
     falls back to false, so all four bake together on that first open and
     every subsequent open is instant.

     Its own effect, not the face bake's: folding it in would re-bake the four
     card faces and the portrait back every time the latch flips.

     A `glEpoch` context-loss REMOUNT resets the latch to false along with the
     rest of this component's state — correct, and self-healing: if a drawer
     was open when the context dropped, `openPlateRef` still holds its id, so
     the frame loop re-requests on the very next frame.

     ⚠ `wantOpen` in the frame loop is gated on `drawerTextures` landing, so
     the drawer cannot slide out blank during this await. */
  useEffect(() => {
    if (!openDrawer || !drawerRequested) return;
    let disposed = false;
    (async () => {
      await waitForCardFonts();
      if (disposed) return;
      const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 1;
      setDrawerTextures(
        SERVICE_PLATES.map((plate) => {
          const texture = new THREE.CanvasTexture(
            bakeDrawerFace(plate, drawerTheme === "light" ? DRAWER_LIGHT : DRAWER_DARK)
          );
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
    // `drawerTheme` re-runs the bake on a flip; the old set disposes via the
    // `[drawerTextures]` cleanup effect below, exactly like a glEpoch rebake.
  }, [gl, openDrawer, drawerRequested, drawerTheme]);

  // GPU warm-up (2026-07-29 perf pass). The baked CanvasTextures carry
  // `needsUpdate` and upload LAZILY — on the first frame `cardGroup`
  // turns visible, which under ADR-056 is ~60px after the dissipate
  // saturates, mid-gesture: four 840×1360 uploads (+mips, anisotropy 8)
  // plus the first program link landed in ONE frame, a ~100ms-class p95
  // spike at the ring's entrance. Drain ONE `gl.initTexture` per rAF
  // during the calm corridor instead, then warm the programs once with
  // `compileAsync` (compile traverses invisible nodes, so nothing is
  // shown — the ADR-056 off-stage contract holds; `ringEntranceClock` is
  // untouched). Keyed on the texture sets, so a glEpoch remount (fresh
  // textures) re-warms, and the lazily-baked drawer set warms the same
  // way when its latch lands.
  const warmedTexturesRef = useRef<WeakSet<THREE.Texture>>(new WeakSet());
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const queue: THREE.Texture[] = [];
    for (const texture of [...(textures ?? []), backTexture, ...(drawerTextures ?? [])]) {
      if (texture && !warmedTexturesRef.current.has(texture)) queue.push(texture);
    }
    if (!queue.length) return;
    let raf = 0;
    const drain = () => {
      raf = 0;
      const texture = queue.shift();
      if (texture) {
        try {
          gl.initTexture(texture);
        } catch {
          // A lost context mid-warm is fine — the glEpoch remount re-runs.
        }
        warmedTexturesRef.current.add(texture);
      }
      if (queue.length) {
        raf = requestAnimationFrame(drain);
      } else {
        // Textures resident — link the programs off the hot path too.
        gl.compileAsync(scene, camera).catch(() => {});
      }
    };
    raf = requestAnimationFrame(drain);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [gl, scene, camera, textures, backTexture, drawerTextures]);

  // Dispose bakes on replacement/unmount (materials/geometries are
  // declarative — R3F disposes those; the shared back material/geometry
  // are memoized and disposed below).
  useEffect(() => {
    if (!textures) return;
    return () => {
      for (const texture of textures) texture.dispose();
    };
  }, [textures]);
  useEffect(() => {
    if (!backTexture) return;
    return () => backTexture.dispose();
  }, [backTexture]);
  useEffect(() => {
    if (!drawerTextures) return;
    return () => {
      for (const texture of drawerTextures) texture.dispose();
    };
  }, [drawerTextures]);

  // ONE geometry + ONE material shared by the four back planes.
  const backGeometry = useMemo(
    () => new THREE.PlaneGeometry(cardW, cardHeight),
    [cardW, cardHeight]
  );
  const backMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: backTexture,
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
    [backTexture]
  );
  useEffect(() => {
    return () => {
      backGeometry.dispose();
    };
  }, [backGeometry]);
  useEffect(() => {
    return () => {
      backMaterial.dispose();
    };
  }, [backMaterial]);

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

    // Master opacity for this frame (ADR-056). The static prop is the
    // look-dev knob; the getter carries the proof casefile's release ramp,
    // which is the only ring channel keyed to runway travel. Absent ⇒ 1, so
    // every existing mount is byte-identical.
    const master0 = masterOpacity * (masterOpacityGetter ? masterOpacityGetter() : 1);

    // Dissipate clock for the entrance envelope.
    let dissipate = 1;
    if (entrance === "scroll") {
      if (dissipateGetter) {
        dissipate = dissipateGetter();
      } else {
        const target = readCorridorDissipate(1);
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
    const target = ringRotationForProgress(progressRef.current.progress, travelFrac);
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

    // About deck (ADR-047): with the flag on, the exit beat's cards STACK
    // into a deck (azimuth sweep, replacing the ADR-030 radial fade-out)
    // and the pinned #about stage then FLIPS the deck π onto the DOM
    // portrait slot. The deck branch only runs while exitP > 0 or the
    // about clock is live, so every pre-exit frame takes the exact shipped
    // code path (byte-identical guardrail), and reverse scroll re-enters
    // it seamlessly (both envelopes are identity at their zeros).
    const aboutP =
      ABOUT_DECK_STAGE && entrance === "scroll" ? aboutProgressRef.current.progress : 0;
    const deckEngaged = ABOUT_DECK_STAGE && entrance === "scroll" && (exitP > 0 || aboutP > 0);
    const deckAnchorsLive =
      !(ABOUT_DECK_STAGE && entrance === "scroll") ||
      (exitP < DECK_ANCHORS_OFF_EXIT && aboutP <= 0);
    // The about tail is a slide-out now (ADR-047 rev): the DOM cluster
    // rides the deck's slot off the RIGHT frustum edge on --about-exit, so
    // the deck is already off-canvas well before this fires. deckBgKill is
    // a WebGL-only TERMINAL safety fade (ABOUT_DECK_FADE_WINDOW [0.92, 1])
    // that guarantees the back material is exactly 0 (and its depth-write
    // released) in the byte-stable hold below the runway — not the thing
    // the eye sees leave.
    const deckBgKill = deckEngaged ? 1 - aboutDeckFadeT(aboutP) : 1;

    // Flip-phase shared geometry (one inverse parent matrix + camera terms
    // + the pivot's seat for all four cards — scratch objects only).
    //
    // Damped flip clock (ADR-047 Update 4 — the speed ramp): the target t
    // is the S-curve `flipRamp` over the LINEAR window fraction (gentle
    // spin-up → constant-velocity cruise → gentle settle; the raw
    // smootherstep's 1.875× mid-window peak read as a whip), and a fast
    // exponential follower rounds wheel-tick scroll steps into that ramp.
    // Discipline mirrors the ring spring: hard deviation cap (an ultra-
    // fast flick never drags the pose > ~63° behind scroll truth), snap
    // epsilon (byte-exact 0/1 endpoints at rest — identity at the stack
    // seam, welded 1 through the shift), snap-on-engage (idle resumes and
    // deep links pose exactly, no greeting animation), and the delta
    // clamp covers hidden-tab resumes.
    //
    // The Update 3 sweep gate is preserved by construction: the clocks
    // overlap (the about runway pins while the stack settles), but the
    // ramp target is 0 until ABOUT_FLIP_WINDOW opens, so the flip branch
    // (damped t > 0) never seizes the pose from the settling STACK branch
    // — the two poses meet byte-identically at the boundary (settle end =
    // the DECK_PLACEMENTS constants = the flip's identity at θ = 0).
    const flipDamp = deckFlipDampRef.current;
    const flipTargetT = deckEngaged ? flipRamp(aboutFlipLinearT(aboutP)) : 0;
    if (!deckEngaged) {
      flipDamp.live = false;
      flipDamp.t = 0;
    } else if (!flipDamp.live) {
      flipDamp.live = true;
      flipDamp.t = flipTargetT;
    } else {
      flipDamp.t += (flipTargetT - flipDamp.t) * Math.min(1, delta * DECK_FLIP_DAMP_RATE);
      if (Math.abs(flipTargetT - flipDamp.t) < DECK_FLIP_SNAP_EPS) flipDamp.t = flipTargetT;
      else if (flipTargetT - flipDamp.t > DECK_FLIP_DAMP_CAP)
        flipDamp.t = flipTargetT - DECK_FLIP_DAMP_CAP;
      else if (flipDamp.t - flipTargetT > DECK_FLIP_DAMP_CAP)
        flipDamp.t = flipTargetT + DECK_FLIP_DAMP_CAP;
    }
    const flip = deckEngaged && flipDamp.t > 0 ? deckFlipFromT(flipDamp.t) : null;
    let flipSin = 0;
    let flipCos = 1;
    let flipPivotX = 0;
    let flipPivotY = 0;
    let flipPivotZ = 0;
    let flipRigidScale = 1;
    let flipCardScale = DECK_CARD_SCALE;
    if (flip && ringGroupRef.current) {
      const ring = ringGroupRef.current;
      ring.updateWorldMatrix(true, false);
      deckParentInv.current.copy(ring.matrixWorld).invert();
      const parentScale =
        deckParentCol.current.setFromMatrixColumn(ring.matrixWorld, 0).length() || 1;
      const persp = camera as THREE.PerspectiveCamera;
      const halfFovTan = Math.tan(((persp.fov ?? 40) * Math.PI) / 360);
      const aspect = persp.aspect || size.width / Math.max(1, size.height);

      // Camera-space depth of the UNBLENDED deck pivot — the seat is
      // constructed at the same depth, so the glide is screen-lateral and
      // the projected deck lands exactly on the slot regardless of the
      // brandmark recede or pointer-look residue (both recomputed through
      // the live matrices every frame).
      deckWorldScratch.current
        .set(DECK_PIVOT_LOCAL.x, DECK_PIVOT_LOCAL.y + yOffset, DECK_PIVOT_LOCAL.z)
        .applyMatrix4(ring.matrixWorld);
      deckCamScratch.current.copy(deckWorldScratch.current).applyMatrix4(camera.matrixWorldInverse);
      const camDepth = Math.max(0.1, -deckCamScratch.current.z);

      // The DOM portrait slot → NDC → world → ring-local (viewport-first;
      // the fallback anchor covers the pre-measure frames).
      const slot = aboutSlotSource.current;
      const [ndcX, ndcY] = slot.valid
        ? seatNdcFromRect(
            slot.rect.cx,
            slot.rect.cy,
            Math.max(1, size.width),
            Math.max(1, size.height),
            ABOUT_FALLBACK_NDC
          )
        : ABOUT_FALLBACK_NDC;
      const slotH = slot.valid ? slot.rect.h : ABOUT_FALLBACK_SLOT_H_PX;
      deckSeatScratch.current
        .set(ndcX * halfFovTan * aspect * camDepth, ndcY * halfFovTan * camDepth, -camDepth)
        .applyMatrix4(camera.matrixWorld)
        .applyMatrix4(deckParentInv.current);

      const seatScale =
        seatWorldHeight(slotH, Math.max(1, size.height), camDepth, halfFovTan) /
        Math.max(1e-6, cardHeight * parentScale);
      const posBlend = flip.posBlend;
      flipPivotX = lerp(DECK_PIVOT_LOCAL.x, deckSeatScratch.current.x, posBlend);
      flipPivotY = lerp(DECK_PIVOT_LOCAL.y + yOffset, deckSeatScratch.current.y, posBlend);
      flipPivotZ = lerp(DECK_PIVOT_LOCAL.z, deckSeatScratch.current.z, posBlend);
      flipCardScale = lerp(DECK_CARD_SCALE, seatScale, posBlend);
      flipRigidScale = flipCardScale / DECK_CARD_SCALE;
      flipSin = Math.sin(flip.theta);
      flipCos = Math.cos(flip.theta);
    }

    // The shared portrait back only exists during the flip phase (the
    // FrontSide culling of the flat deck gives the gate half a beat of
    // slack either way). All four backs share one material — correct
    // because the backs are only ever seen converged.
    backMaterial.opacity = flip !== null ? opacityRange[1] * master0 * deckBgKill : 0;
    // The portrait back is the deck's depth writer once the flip passes
    // edge-on (pre-midpoint every back is FrontSide-culled — no fragments,
    // so the early enable is inert): the four backs draw in the rebased
    // back-to-front order, the nearest (deck-rear card 0's) wins the
    // buffer, and the renderOrder-1 brandmark point pass depth-tests
    // behind the portrait instead of painting over it (ADR-047 rev 2).
    // The opacity floor releases the writer as the about tail's terminal
    // deckBgKill fades the deck out (by which point it has already slid off
    // the right frustum edge with the cluster).
    const backWrite = flip !== null && backMaterial.opacity > 0.55;
    if (backWrite !== backMaterial.depthWrite) backMaterial.depthWrite = backWrite;

    const parked = dissipate >= ANCHOR_PUBLISH_DISSIPATE;
    const anchors: RingCardAnchor[] = [];

    // Hovered card from LAST frame's projected rects (one frame of lag is
    // imperceptible at the veil's damp rate). Front-most containing rect
    // wins; nothing hovers until parked — and never during the deck life
    // (the veil restores to the full feed read as the cards converge).
    let hovered = -1;
    if (parked && !deckEngaged) {
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
      /* An OPEN card counts as hovered regardless of where the pointer is
         (ADR-050 rev 3). Its drawer extends well outside the card's own rect,
         so without this the veil re-fogs AND the hover tilt slumps the moment
         the pointer moves onto the drawer — exactly while the user is
         reaching for the drawer's CTA. Forcing it here fixes both channels at
         once, since both read `hovered`. */
      if (openDrawer && openPlateRef.current.serviceId) {
        const openIdx = SERVICES.findIndex((s) => s.id === openPlateRef.current.serviceId);
        if (openIdx >= 0) hovered = openIdx;
      }
    }

    /* Latch the LAZY drawer bake on the first open request (ADR-050
       promotion). The frame loop is the only reader of `openPlateRef`, so
       this is where the DOM's open intent becomes visible to React. The ref
       guard makes it fire exactly once per mount — without it this would
       queue a setState every frame until the state landed. Deliberately
       OUTSIDE the pointer-pick block above, which only runs when the ring is
       parked and pickable. */
    if (openDrawer && !drawerRequestedRef.current && openPlateRef.current.serviceId) {
      drawerRequestedRef.current = true;
      setDrawerRequested(true);
    }

    for (let i = 0; i < RING_COUNT; i++) {
      const cardGroup = cardGroupRefs.current[i];
      const mesh = meshRefs.current[i];
      const material = matRefs.current[i];
      if (!cardGroup || !mesh || !material) continue;

      const env = entrance === "scroll" ? entranceEnvelope(dissipate, i) : null;
      // Exit composes onto the entrance: identity while exitP = 0. Flag
      // OFF: the ADR-030 radial decommission (fly OUT + fade). Flag ON
      // (ADR-047): the deck STACK replaces it — the azimuth sweep + deck
      // radius correction feed placeCardOnOrbit directly, and the spring
      // residual is absorbed over the settle window so the exitP = 1 pose
      // is a pure constant (byte-stable across the services→about hold).
      const exit = exitEnvelope(exitP, i);
      const stack = deckEngaged ? deckStackEnvelope(exitP, i) : null;
      const rotationInput = stack
        ? DECK_SETTLED_ROTATION +
          (spring.pos - DECK_SETTLED_ROTATION) * (1 - stack.settle) +
          stack.phiDelta
        : spring.pos;
      const placed = placeCardOnOrbit(i, rotationInput, cardOrbitGeoms[i], {
        yOffset,
        radiusMul: (env ? env.radiusMul : 1) * (stack ? stack.radiusMul : exit.radiusMul),
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
      const ringY = placed.y + entY;
      const ringZ = placed.z;

      /* ── The DRAWER clock (ADR-050 rev 3) ────────────────────────────────
         Damped open level per card, the `veilLevelRef` pattern. SNAPPED to 0
         the moment the deck engages rather than left to decay: the recenter
         term below lives only in the normal branch, so a fast scroll that
         reaches the stack branch with a still-damping level would hand off
         between a shifted and an unshifted pose — a positional snap. (The
         `flipDamp` engage-snap precedent.) Computed here because the pose
         below reads it. */
      let drawerT = 0;
      if (openDrawer) {
        /* Gated on the LAZY bake landing (ADR-050 promotion): until the four
           drawer faces exist the level stays pinned at 0, so an open request
           never slides a blank slab out from behind the card. The request
           itself is latched above; `drawerTextures` arriving re-renders this
           callback, and the damped level then eases open from rest. */
        const wantOpen =
          !deckEngaged &&
          drawerTextures !== null &&
          openPlateRef.current.serviceId === SERVICES[i].id;
        if (deckEngaged) drawerLevelRef.current[i] = 0;
        else {
          drawerLevelRef.current[i] +=
            ((wantOpen ? 1 : 0) - drawerLevelRef.current[i]) *
            Math.min(1, delta * DRAWER_DAMP_RATE);
        }
        drawerT = smootherstep(0, 1, drawerLevelRef.current[i]);
      }

      /* The held 3/4 pose FLATTENS as the drawer opens (ADR-050 rev 3). The
         drawer extends along card-local +x, which under the parked front
         bias is the RECEDING axis — at full bias its face foreshortens hard
         and the spec grid stops reading. Easing the bias out as the pair
         opens is the device turning to face you, and it keeps the two slabs
         rigid (one object) rather than hinging them apart.

         The FLATTEN IS TOTAL ON YAW (owner, 2026-07-27), not just the bias:
         ANY residual yaw — the facing term, the pointer's — rotates the pair
         about the card's centre, which swings the drawer (offset along local
         +x) deeper and projects it SMALLER than the card. Measured at a
         neutral cursor with only the bias flattened: the tray came out at
         94.6% of the card's height, so its top edge sat ~20px low and its
         bottom ~28px high — read as two misaligned panels, not one device.
         The misalignment is proportional to sin(yaw) × the drawer's offset,
         so there is no partial setting that keeps the edges flush; the open
         pair has to be square to the camera.

         PITCH survives untouched, and that is what keeps pointer-look alive
         (ADR-021 intact): the drawer is offset along x ONLY, so a rotation
         about the x-axis moves both slabs identically and cannot break the
         seam — the pair leans with the cursor without ever stepping apart.
         Identity at drawerT = 0, and `bias.yaw × biasKeep` is unchanged.

         …and the RIG's yaw is CANCELLED here too, on the same clock. The
         `pointerLookRef` group above this ring carries its own pointer yaw,
         so zeroing only the card's local term still left the pair rotating
         with the instrument — measured at a far-corner cursor, the tray came
         out ~4% TALLER than the card. Subtracting the published rig yaw
         (`rigPointerYawRef`) makes the open pair's WORLD yaw zero: local
         term and rig term both vanish at drawerT = 1, so card-local +x is
         parallel to the image plane and the tray sits at exactly the card's
         depth.

         Doing it HERE rather than stilling the rig is the point (owner,
         2026-07-27): the first fix damped the rig's yaw whenever a drawer was
         open, which held the seam but froze the mark and the orbits with it —
         the whole instrument went dead at the moment of most attention. The
         rig now leans exactly as it always did; only the open pair is held
         square, so it reads as a gimballed screen staying face-on while the
         instrument moves behind it. Cards without a drawer are untouched
         (drawerT = 0 ⇒ the subtraction is exactly 0). */
      const biasKeep = 1 - drawerT;
      /* PITCH is DAMPED on the open clock, not zeroed (2026-08-02 — the
         owner's "Escher-esque" report). It has no seam to protect, so the
         2026-07-27 ruling left it fully alive — but the rig's pointer
         pitch plus this card's hover pitch reach ~0.3 rad at a corner,
         and at that lean the extruded frames (glass walls, chamfer cut,
         double silhouettes) stop agreeing with the flat bakes. KEEP 0.22
         holds ~4° of life; `openPairPitch` mirrors the yaw's rig
         cancellation so the WORLD pitch is what gets damped. */
      const ringPitch = openPairPitch(
        tilt.pitch + bias.pitch * biasKeep,
        rigPointerPitchRef.current,
        drawerT
      );
      const ringYaw = openPairYaw(
        cardFacingYaw(placed.rotY, facingBlend) + tilt.yaw + bias.yaw,
        rigPointerYawRef.current,
        drawerT
      );
      const ringScale = depthScale(placed.nz, scaleRange);
      // Front-card emphasis (owner 2026-07-17): the in-view card reads
      // BIGGER than its neighbours, more so on narrow viewports. A separate
      // multiplier on top of the depth-scale — side cards (frontWindow ≈ 0)
      // are untouched, and RING_SCALE_RANGE / the deck seam stay exactly as
      // tuned. During the stack it fades out via (1 − flattenT) so the deck
      // assembles at its original scale, continuous with the reading pose at
      // the exit boundary. The flip owns its own seat-matched scale, so the
      // boost is applied only in the two non-flip branches below.
      const frontBoost = frontScaleBoost(placed.nz, size.width, stack ? 1 - stack.flattenT : 1);
      /* The open pair GROWS as the drawer extends (owner, 2026-07-26): the
         spec sheet is the point of opening, so the pair steps toward the
         viewer — over the section masthead, which the canvas genuinely
         out-stacks (host z:3 > station z:2) and which dims in CSS via
         `data-plate-open`. Rides drawerT, so it eases with the slide,
         reverses on close, and is identity for the deck (drawerT snaps 0). */
      const openBoost = drawerOpenBoost(drawerT);

      /* Recenter: as the drawer extends right, the CARD eases left by half
         the drawer's visible extent so the open pair stays centred on the
         brandmark (owner's composition call). The drawer's extent is
         card-LOCAL (it inherits cardGroup.scale), while this offset is in
         ring-group space — hence the full card-scale term, `ringScale ×
         frontBoost × openBoost`. The ring group's own scale cancels: it
         multiplies positions and extents alike. Identity at drawerT = 0, so
         the closed ring is byte-identical. */
      const ringX =
        placed.x +
        entX -
        drawerRecenterX(drawerT, cardW, DRAWER_SEAM, ringScale * frontBoost * openBoost);

      if (flip) {
        // ── ADR-047 flip (rev 2: Y axis): the deck rotates about its
        // pivot's Y axis as ONE rigid slab (position = pivot + Ry(θ)·offset)
        // while the pivot glides onto — then tracks — the DOM portrait
        // slot. Past the flip window posBlend = 1, so the DOM cluster's
        // beat-1 translate carries the deck with zero extra code (one
        // motion owner). Y, not X: the owner's "flip on the x-axis" brief
        // named the left↔right travel DIRECTION — the literal Rx shipped
        // first and read as a top-over-bottom tumble.
        const off = DECK_OFFSETS[i];
        const offX = off.x * flipRigidScale;
        const offY = off.y * flipRigidScale;
        const offZ = off.z * flipRigidScale;
        cardGroup.position.set(
          flipPivotX + offX * flipCos + offZ * flipSin,
          flipPivotY + offY,
          flipPivotZ - offX * flipSin + offZ * flipCos
        );
        // The yaw slot composes φ (a full turn — identity) with θ, so this
        // is exactly Ry(θ) — and the back plane's own rotation.y = π
        // composes with it to identity at full flip (upright, unmirrored
        // portrait).
        cardGroup.rotation.set(0, DECK_PHI_TARGETS[i] + flip.theta, 0);
        cardGroup.scale.setScalar(flipCardScale);
      } else if (stack) {
        // ── ADR-047 stack: the azimuth sweep already carried position and
        // scale through placeCardOnOrbit (nz → 1 lifts depth-scale to the
        // deck scale); only the pose residue (front bias + hover tilt)
        // flattens here — cardFacingYaw converges to the flat full-turn on
        // its own as φ → 2πk.
        cardGroup.position.set(ringX, ringY, ringZ);
        cardGroup.rotation.set(
          (tilt.pitch + bias.pitch) * (1 - stack.flattenT),
          cardFacingYaw(placed.rotY, facingBlend) + (tilt.yaw + bias.yaw) * (1 - stack.flattenT),
          0
        );
        cardGroup.scale.setScalar(ringScale * frontBoost);
      } else {
        cardGroup.position.set(ringX, ringY, ringZ);
        cardGroup.rotation.set(ringPitch, ringYaw, 0);
        cardGroup.scale.setScalar(ringScale * frontBoost * openBoost);
      }

      // Depth-based opacity lifts to uniform ON ITS OWN during the stack
      // (the sweep drives nz → 1). The deck never fades on exit — it lives
      // through the pinned #about and dies only with the stage's
      // fail-opaque shield (deckBgKill, the about tail).
      const depthO = depthOpacity(placed.nz, opacityRange, opacityWindow);
      const master = (env ? env.opacity : 1) * (stack ? deckBgKill : exit.opacity) * master0;
      const opacity = depthO * master;
      /* ADR-050 rev 3 — ANTI-GHOST GUARD 2 of 2. The card's face never
         reaches alpha 1 (RING_OPACITY_RANGE tops out at 0.9), so a drawer
         housed behind it would bleed ~10% of its own text through. As the
         drawer opens, the face firms 0.9 → 1.0: the same entity solidifying
         as it activates, nothing appearing or disappearing. Identity at
         drawerT = 0, so the shipped closed ring is byte-identical.
         ⚠ Do NOT "clean this up" as a stray fade — deleting it reintroduces
         the ghost (see ADR-050 rev 3). */
      const faceO = lerp(depthO, 1, drawerT) * master;
      material.opacity = faceO;
      slabMaterials[i][0].opacity = glassOpacity * depthO * master;
      slabMaterials[i][1].opacity = glassEdgeOpacity * depthO * master;
      glintMaterials[i].opacity = glintOpacity * depthO * master;
      // Halo is front-weighted: swells as the card parks, gone on the sides
      // — and dies early in the stack (four converged halos would bloom).
      glowMaterials[i].opacity =
        glowOpacity * frontWindowWeight(placed.nz) * master * (stack ? stack.glowMul : 1);
      // Hover-resolve: the hovered card's veil damps toward its resolved
      // residue; everyone else restores to the full feed read. An open card
      // is force-marked hovered at the pick site above, so it holds the
      // resolved read (and its tilt) while the pointer is on its drawer.
      const veilTarget = i === hovered ? RING_VEIL_HOVER_LEVEL : 1;
      veilLevelRef.current[i] +=
        (veilTarget - veilLevelRef.current[i]) * Math.min(1, delta * VEIL_DAMP_RATE);
      veilMaterials[i].opacity = veilLevelRef.current[i] * depthO * master;
      cardGroup.visible = opacity > 0.004;

      /* ── The drawer's transform + ANTI-GHOST GUARD 1 of 2 ────────────────
         The slide is pure geometry in card-local space. The opacity ramp is
         NOT a crossfade: it completes by DRAWER_REVEAL_FRAC of the open
         level, while the drawer is still entirely behind the card face, so
         nothing is ever seen fading — it only stops the housed drawer from
         ghosting through. The `visible` gate keeps a shut drawer out of the
         render list entirely (and stops its glint from double-brightening
         the card's coincident edges). */
      const drawerGroup = drawerGroupRefs.current[i];
      if (drawerGroup) {
        const live = drawerT > 0.001 && opacity > 0.004;
        drawerGroup.visible = live;
        if (live) {
          drawerGroup.position.x = drawerSlideX(drawerT, cardW, DRAWER_SEAM);
          /* …and the content plane rises to MEET the card's as it clears it
             (owner, 2026-07-27). Housed, it sits `DRAWER_HOUSED_DEPTH` behind
             the face so the slide reads as sliding out from under it; at full
             open that depth is a pure perspective mismatch, projecting the
             tray's baked border ~0.7% short of the card's. See
             `drawerContentDepth` for why closing the gap cannot z-fight. */
          const drawerMesh = drawerMeshRefs.current[i];
          if (drawerMesh) {
            drawerMesh.position.z = slabDepth / 2 + RING_CONTENT_LIFT - drawerContentDepth(drawerT);
          }
          const reveal = Math.min(1, drawerT / DRAWER_REVEAL_FRAC);
          const drawerO = opacity * reveal;
          const drawerMat = drawerMatRefs.current[i];
          if (drawerMat) drawerMat.opacity = drawerO;
          const drawerSlab = drawerSlabMaterials?.[i];
          if (drawerSlab) {
            drawerSlab[0].opacity = glassOpacity * depthO * master * reveal;
            drawerSlab[1].opacity = glassEdgeOpacity * depthO * master * reveal;
          }
          const drawerGlint = drawerGlintMaterials?.[i];
          if (drawerGlint) drawerGlint.opacity = glintOpacity * depthO * master * reveal;
        }
      }

      // depthWrite discipline — only the near-front card's CONTENT writes
      // depth (the glass never does); that single writer is what occludes
      // the renderOrder-1 brandmark point pass behind the card. During the
      // deck life the plain nz gate would switch four near-coplanar
      // stacked writers ON (sorting carnage + holes in the depthWrite:false
      // particle pass), so the writer is picked EXPLICITLY instead: the
      // nearest deck slot (deckOrder top — the same θ = π/2 swap the
      // renderOrder rebase uses). Rev 2 of ADR-047: the original force-OFF
      // left NO writer, so the mark's points painted OVER the deck (user
      // report, 2026-07-16). Post-midpoint the top slot's FrontSide
      // content plane culls away and the shared portrait back material
      // takes over as the writer (set beside its opacity above).
      const write =
        deckEngaged && (exitP > DECK_DEPTH_WRITE_OFF_EXIT || aboutP > 0)
          ? deckOrder(i, flip ? flip.flipped : false) === RING_COUNT - 1 && opacity > 0.55
          : depthWriteGate(depthWriteRef.current[i], placed.nz) && opacity > 0.55;
      if (write !== material.depthWrite) material.depthWrite = write;
      depthWriteRef.current[i] = write;
      /* The drawer shares the card's ELECTED write boolean rather than
         computing its own gate (ADR-050 rev 3): two independent gates could
         both elect on one card, and an un-elected near-opaque drawer writing
         depth would occlude the renderOrder-1 particle pass as an invisible
         rectangle. The drawer draws first (0.07 < 0.1) and is farther in z,
         so the face still passes LEQUAL behind it. */
      const drawerMatForDepth = drawerMatRefs.current[i];
      if (drawerMatForDepth) {
        const drawerWrite = write && drawerT > 0.001;
        if (drawerWrite !== drawerMatForDepth.depthWrite) {
          drawerMatForDepth.depthWrite = drawerWrite;
        }
      }

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
        // `deckAnchorsLive` retires the rects at the deck's exit start
        // (ADR-047): the stack keeps cards OPAQUE (no fade), so the old
        // `opacity > 0.1` gate alone would leave a live CTA link riding
        // the sweep — and the flipped portrait must never expose one.
        hoverRectsRef.current[i] =
          !clipped && !occludedByFront && opacity > 0.1 && deckAnchorsLive
            ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY, nz: placed.nz }
            : null;
        if (publishAnchors) {
          /* The DRAWER's own rect (ADR-050 rev 3) — projected from its own
             mesh, not derived from the card's, because the drawer carries a
             different yaw and foreshortening, so its projection is not a
             linear extension of the card's. Only while actually out. */
          let drawerRect: { x: number; y: number; w: number; h: number } | undefined;
          const drawerMesh = drawerMeshRefs.current[i];
          if (drawerT > 0.02 && drawerMesh && drawerGroupRefs.current[i]?.visible) {
            drawerMesh.updateWorldMatrix(true, false);
            let dMinX = Infinity;
            let dMinY = Infinity;
            let dMaxX = -Infinity;
            let dMaxY = -Infinity;
            let dClipped = false;
            for (let cx = -1; cx <= 1; cx += 2) {
              for (let cy = -1; cy <= 1; cy += 2) {
                cornerLocal.current.set((cx * cardW) / 2, (cy * cardHeight) / 2, 0);
                cornerWorld.current
                  .copy(cornerLocal.current)
                  .applyMatrix4(drawerMesh.matrixWorld)
                  .project(camera);
                if (cornerWorld.current.z >= 1 || cornerWorld.current.z <= -1) dClipped = true;
                const sx = (cornerWorld.current.x * 0.5 + 0.5) * size.width;
                const sy = (-cornerWorld.current.y * 0.5 + 0.5) * size.height;
                dMinX = Math.min(dMinX, sx);
                dMinY = Math.min(dMinY, sy);
                dMaxX = Math.max(dMaxX, sx);
                dMaxY = Math.max(dMaxY, sy);
              }
            }
            if (!dClipped) {
              drawerRect = { x: dMinX, y: dMinY, w: dMaxX - dMinX, h: dMaxY - dMinY };
            }
          }
          anchors.push({
            serviceId: SERVICES[i].id,
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
            depth: centreDepth,
            visible: !clipped && !occludedByFront && opacity > 0.1 && deckAnchorsLive,
            front: i === front,
            drawer: drawerRect,
          });
        }
      } else {
        hoverRectsRef.current[i] = null;
      }

      // Explicit per-deck-slot renderOrder once the deck has assembled —
      // same-order depth sorting would jitter between near-coplanar
      // slabs; before assembly the cards are angularly spread and the
      // depth sort is the correct (original) behavior. `flipped` swaps
      // the order at θ = π/2, where the deck is edge-on (imperceptible).
      if (deckEngaged && (exitP >= DECK_RENDER_REBASE_EXIT || aboutP > 0)) {
        const base = DECK_RENDER_PITCH * deckOrder(i, flip ? flip.flipped : false);
        const kids = cardGroup.children;
        for (let k = 0; k < kids.length && k < DECK_INTRA_ORDERS.length; k++) {
          kids[k].renderOrder = base + DECK_INTRA_ORDERS[k];
        }
        deckOrderAppliedRef.current = true;
      }
    }

    // Restore the JSX renderOrder constants exactly once when the deck
    // disengages (reverse scroll back into the reading beats) — pre-exit
    // frames never see per-frame renderOrder writes.
    if (
      deckOrderAppliedRef.current &&
      !(deckEngaged && (exitP >= DECK_RENDER_REBASE_EXIT || aboutP > 0))
    ) {
      for (let i = 0; i < RING_COUNT; i++) {
        const kids = cardGroupRefs.current[i]?.children;
        if (!kids) continue;
        for (let k = 0; k < kids.length && k < DECK_INTRA_ORDERS.length; k++) {
          kids[k].renderOrder = DECK_INTRA_ORDERS[k];
        }
      }
      deckOrderAppliedRef.current = false;
    }

    if (publishAnchors) {
      if (parked && anchors.length) {
        // Epsilon delta-gate (2026-07-29 perf pass): only a meaningful
        // move reaches the store — an idle parked ring stops re-rendering
        // the hit-shim and designation overlays every frame. The pointer
        // spring settles below the epsilon at rest, so this converges.
        if (!ringAnchorsWithinEpsilon(anchors, publishedAnchorsRef.current)) {
          setRingAnchors(anchors);
          publishedAnchorsRef.current = anchors;
        }
        anchorsClearedRef.current = false;
      } else if (!anchorsClearedRef.current) {
        setRingAnchors([]);
        publishedAnchorsRef.current = null;
        anchorsClearedRef.current = true;
      }
    }
  });

  if (!textures) return null;

  // Decommission dim for the drawn card tracks — same clock and magnitude
  // as the structural armillary (CorridorArmillary), derived from THIS
  // ring's progress source so labs with a simulate-scroll ref exit too.
  // Under ADR-047 the residue then clears FULLY across the about flip
  // window (the portrait gets a clean stage).
  const trackExitGetter =
    entrance === "scroll"
      ? () =>
          (1 - 0.85 * exitProgressForRunway(progressRef.current.progress)) *
          (ABOUT_DECK_STAGE ? 1 - aboutFlipT(aboutProgressRef.current.progress) : 1) *
          // ADR-058: the casefile dim. These tracks were the ONE layer over
          // the casefile with no proof term — the structural rings hold via
          // `orbitReleaseLead`, the mark / haze / surface bed via their
          // `proofDim`s, but the four drawn tracks stayed at their full
          // ~0.3-0.38 for the entire dwell. Unremarkable against the void;
          // on parchment they are four continuous gold ellipses through the
          // readouts, and they are what made the evidence plate look like it
          // needed a fill and a frame. `proofDim.orbits` is 0 in dark, so
          // this term is ×1 there and the beat is byte-identical.
          Math.max(0, 1 - resolveScenePalette().proofDim.orbits * progressRef.current.proofPresence)
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
          {/* The baked plate face, floated above the front cap. FrontSide
              since ADR-047: the only pose that ever showed this bake's
              reverse was the hidden occluded back card (a mirrored text
              ghost at the 0.16 opacity floor) — and the deck's portrait
              back plane must own the rear view. */}
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
              side={THREE.FrontSide}
              depthWrite={false}
              depthTest
              blending={THREE.NormalBlending}
              toneMapped={false}
            />
          </mesh>
          {/* The deck's PORTRAIT BACK (ADR-047, rev 2) — floated behind the
              back cap, rotation.y = π so the deck's rigid Ry(π) flip
              composes with it to IDENTITY: at full flip it reads exactly
              like an unrotated front plane (upright, unmirrored; an x = π
              plane would land the portrait upside-down under the Y flip).
              Shares ONE texture + material across all four cards; opacity
              gated to the flip phase (FrontSide culling covers the
              flat-deck frames). No back veil (the portrait carries its own
              scrims) and no glow twin (the +z glow FrontSide-culls after
              the flip AND is already dead via the stack's glowMul). */}
          {ABOUT_DECK_STAGE && (
            <mesh
              renderOrder={0.11}
              position={[0, 0, -(slabDepth / 2 + RING_CONTENT_LIFT)]}
              rotation={[0, Math.PI, 0]}
              geometry={backGeometry}
              material={backMaterial}
              frustumCulled={false}
            />
          )}
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
          {/* ── The DRAWER (ADR-050 rev 3) — the open state, IN CANVAS ──────
              A second slab of this same device, APPENDED after the veil so
              the existing children keep indices 0–5 (the deck's positional
              renderOrder rebase walks `cardGroup.children`).

              It lives in CARD-LOCAL space, which is the entire point: it
              inherits the rig, the facing yaw, the pointer-look and the
              bounded sway for free, so card + drawer are one entity by
              construction rather than by synchronisation. Three DOM
              revisions of this open state each read as "another component"
              because a flat DOM rect cannot be a projected, tilted, bloomed
              slab.

              renderOrder 0.06/0.07/0.08 sits between the card's glint (0.05)
              and its face (0.1) — POSITIVE on purpose: the orbit tracks
              render at 0, so negative slots would let gold track dashes
              paint over the drawer's text. Under the face means the card
              covers the drawer while it is housed. Z is behind the card's
              face so it slides out from *under* it. */}
          {/* Mounted as soon as the flag is on — NOT gated on `drawerTextures`.
              The lazy bake lands mid-session, and `DECK_INTRA_ORDERS` is
              positional over `cardGroup.children`, so letting the bake add a
              child would renumber the deck's slots underneath a running
              rebase. The map stays null until the bake lands; the group is
              `visible={false}` while shut and its open level is gated on the
              same texture, so an unmapped drawer is never on screen. */}
          {openDrawer &&
            drawerSlabGeometry &&
            drawerGlintGeometry &&
            drawerSlabMaterials &&
            drawerGlintMaterials && (
              <group
                ref={(el) => {
                  drawerGroupRefs.current[i] = el;
                }}
                visible={false}
              >
                {/* Tray geometry, not the card's: a plain rectangle (no chamfer)
                  with a glint that leaves the seam edge unlit — the drawer is
                  the card UNFOLDING, so only the card carries the device's
                  chamfered identity silhouette. */}
                <mesh
                  renderOrder={DRAWER_RENDER_ORDERS.slab}
                  geometry={drawerSlabGeometry}
                  material={drawerSlabMaterials[i]}
                  frustumCulled={false}
                />
                <mesh
                  renderOrder={DRAWER_RENDER_ORDERS.content}
                  /* Housed depth — the frame loop eases this to 0 as the tray
                   clears the face (drawerContentDepth). */
                  position={[0, 0, slabDepth / 2 + RING_CONTENT_LIFT - DRAWER_HOUSED_DEPTH]}
                  ref={(el) => {
                    drawerMeshRefs.current[i] = el;
                  }}
                  frustumCulled={false}
                >
                  <planeGeometry args={[cardW, cardHeight]} />
                  <meshBasicMaterial
                    ref={(el) => {
                      drawerMatRefs.current[i] = el;
                    }}
                    map={drawerTextures?.[i] ?? null}
                    transparent
                    opacity={0}
                    side={THREE.FrontSide}
                    depthWrite={false}
                    depthTest
                    blending={THREE.NormalBlending}
                    toneMapped={false}
                  />
                </mesh>
                <lineSegments
                  renderOrder={DRAWER_RENDER_ORDERS.glint}
                  geometry={drawerGlintGeometry}
                  material={drawerGlintMaterials[i]}
                  frustumCulled={false}
                />
              </group>
            )}
        </group>
      ))}
    </group>
  );
}
