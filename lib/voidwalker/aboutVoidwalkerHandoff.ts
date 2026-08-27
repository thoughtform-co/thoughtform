/**
 * About → Voidwalker shared-actor handoff (ADR-082 U3).
 *
 * This module is deliberately DOM- and Three-free. The DOM scroll writer
 * publishes future viewport seats here; the existing R3F services ring reads
 * the portrait seat and remains the portrait card's only transform owner.
 * Keeping the bridge as scalar data also makes forward, reverse and interrupted
 * scrolls reconstruct from the same inputs without a direction latch.
 */

import { clamp01, lerp, smootherstep } from "@/lib/math";

/** About runway: the real portrait leaves its authored seat and lands on the
 * future hologram seat. */
export const ABOUT_HANDOFF_FLIGHT_WINDOW: readonly [number, number] = [0.74, 0.88];

/** About runway: copy and orbit chrome de-resolve into the destination
 * dossier footprint. */
export const ABOUT_HANDOFF_RESOLVE_WINDOW: readonly [number, number] = [0.74, 0.96];

/** Voidwalker runway: complementary WebGL portrait → DOM hologram takeover. */
export const VOIDWALKER_HOLOGRAM_MORPH_WINDOW: readonly [number, number] = [0, 0.08];

/** Receiver measurement changes are sparse (mount/resize/era), so a DOM
 * writer can use this event name to wake sibling scroll roots immediately.
 * The data module stays DOM-free; it never dispatches the event itself. */
export const ABOUT_VOIDWALKER_HANDOFF_CHANGE_EVENT = "about-voidwalker-handoff-change";

/** The baked services-ring portrait is 420 × 680 CSS/source units. */
export const ABOUT_PORTRAIT_ASPECT = 420 / 680;

export interface ViewportRect {
  /** Rect centre in viewport CSS pixels. */
  cx: number;
  cy: number;
  /** Rect dimensions in viewport CSS pixels. */
  w: number;
  h: number;
}

export interface HandoffRendererOpacities {
  /** Existing R3F portrait-card renderer. */
  webglPortrait: number;
  /** DOM hologram renderer. */
  domHologram: number;
}

/** Complementary DOM title ownership during the shared acquisition. */
export interface HandoffTitleOpacities {
  /** The About-stage `VINCE BUYSSENS` source actor. */
  aboutTitle: number;
  /** The Voidwalker era-title destination actor. */
  voidwalkerTitle: number;
}

/** Transform channels that map one viewport rect onto another from a
 * top-left transform origin. Title handoff may use independent axes because
 * the one-line About name resolves into a fixed two-line era-title seat. */
export interface ViewportRectTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

export interface AboutVoidwalkerHandoffState {
  /** Bottom-aligned, portrait-aspect seat inside the future hologram column. */
  portraitSeat: ViewportRect;
  /** First left dossier panel, used by About copy condensation. */
  firstDossierRect: ViewportRect;
  /** Stable identity-title seat, used by the independent About name actor. */
  eraTitleRect: ViewportRect;
  /** Shared renderer-takeover scalar, always clamped to [0, 1]. */
  morph: number;
  /** All destination measurements are finite and non-zero. */
  valid: boolean;
  /** The complete desktop/corridor capability gate currently passes. */
  capable: boolean;
  /** `performance.now()` of the last target-measurement write. */
  stampedAt: number;
}

const EMPTY_RECT: ViewportRect = { cx: 0, cy: 0, w: 0, h: 0 };

function copyRect(rect: ViewportRect): ViewportRect {
  return { cx: rect.cx, cy: rect.cy, w: rect.w, h: rect.h };
}

function finiteUnit(value: number): number {
  return Number.isFinite(value) ? clamp01(value) : 0;
}

export function aboutHandoffFlightT(aboutProgress: number): number {
  return smootherstep(
    ABOUT_HANDOFF_FLIGHT_WINDOW[0],
    ABOUT_HANDOFF_FLIGHT_WINDOW[1],
    finiteUnit(aboutProgress)
  );
}

export function aboutHandoffResolveT(aboutProgress: number): number {
  return smootherstep(
    ABOUT_HANDOFF_RESOLVE_WINDOW[0],
    ABOUT_HANDOFF_RESOLVE_WINDOW[1],
    finiteUnit(aboutProgress)
  );
}

export function voidwalkerHologramMorphT(voidwalkerProgress: number): number {
  return smootherstep(
    VOIDWALKER_HOLOGRAM_MORPH_WINDOW[0],
    VOIDWALKER_HOLOGRAM_MORPH_WINDOW[1],
    finiteUnit(voidwalkerProgress)
  );
}

/** A viewport-first rect flight. `t` is clamped so both endpoints are exact. */
export function interpolateViewportRect(
  from: ViewportRect,
  to: ViewportRect,
  t: number
): ViewportRect {
  const progress = finiteUnit(t);
  return {
    cx: lerp(from.cx, to.cx, progress),
    cy: lerp(from.cy, to.cy, progress),
    w: lerp(from.w, to.w, progress),
    h: lerp(from.h, to.h, progress),
  };
}

/**
 * Resolve the exact transform from one viewport rect to another.
 *
 * Both source and destination must be authored, transform-independent border
 * boxes. Returning `null` for invalid geometry keeps the overlap fail-static
 * rather than letting `NaN` leak into a CSS transform.
 */
export function resolveViewportRectTransform(
  from: ViewportRect,
  to: ViewportRect
): ViewportRectTransform | null {
  if (!isValidViewportRect(from) || !isValidViewportRect(to)) return null;

  return {
    x: to.cx - to.w / 2 - (from.cx - from.w / 2),
    y: to.cy - to.h / 2 - (from.cy - from.h / 2),
    scaleX: to.w / from.w,
    scaleY: to.h / from.h,
  };
}

/**
 * Derive the portrait card's future seat from the hologram column.
 *
 * Width is owned by the destination column. Height follows the portrait's
 * authored 420/680 aspect, and the bottoms align so the hologram can later
 * reveal upward beyond the former card without stretching the portrait.
 * Invalid measurements return a zero rect, keeping capability gates fail-safe.
 */
export function resolveBottomAlignedPortraitSeat(
  hologramSlot: ViewportRect,
  aspect = ABOUT_PORTRAIT_ASPECT
): ViewportRect {
  if (!isValidViewportRect(hologramSlot) || !Number.isFinite(aspect) || aspect <= 0) {
    return copyRect(EMPTY_RECT);
  }

  const h = hologramSlot.w / aspect;
  const bottom = hologramSlot.cy + hologramSlot.h / 2;
  return {
    cx: hologramSlot.cx,
    cy: bottom - h / 2,
    w: hologramSlot.w,
    h,
  };
}

/** Exact complementary ownership: the two renderers always sum to one. */
export function handoffRendererOpacities(morph: number): HandoffRendererOpacities {
  const acquired = finiteUnit(morph);
  return {
    webglPortrait: 1 - acquired,
    domHologram: acquired,
  };
}

/** The text switch shares the exact takeover scalar with the renderer pair. */
export function handoffTitleOpacities(morph: number): HandoffTitleOpacities {
  const acquired = finiteUnit(morph);
  return {
    aboutTitle: 1 - acquired,
    voidwalkerTitle: acquired,
  };
}

export function isValidViewportRect(rect: ViewportRect | null | undefined): rect is ViewportRect {
  return Boolean(
    rect &&
    Number.isFinite(rect.cx) &&
    Number.isFinite(rect.cy) &&
    Number.isFinite(rect.w) &&
    Number.isFinite(rect.h) &&
    rect.w > 1 &&
    rect.h > 1
  );
}

export function isAboutVoidwalkerHandoffReady(state: AboutVoidwalkerHandoffState): boolean {
  return state.capable && state.valid;
}

/** Cross-root bridge. One DOM writer, R3F/DOM readers; never a render store. */
export const aboutVoidwalkerHandoffRef: { current: AboutVoidwalkerHandoffState } = {
  current: {
    portraitSeat: copyRect(EMPTY_RECT),
    firstDossierRect: copyRect(EMPTY_RECT),
    eraTitleRect: copyRect(EMPTY_RECT),
    morph: 0,
    valid: false,
    capable: false,
    stampedAt: 0,
  },
};

export interface AboutVoidwalkerHandoffTargetsWrite {
  portraitSeat: ViewportRect;
  firstDossierRect: ViewportRect;
  eraTitleRect: ViewportRect;
  capable: boolean;
  now: number;
}

/** Publish all measured targets atomically. Geometry validity is kept
 * independent from capability so the common gate can diagnose either cause. */
export function writeAboutVoidwalkerHandoffTargets({
  portraitSeat,
  firstDossierRect,
  eraTitleRect,
  capable,
  now,
}: AboutVoidwalkerHandoffTargetsWrite): void {
  const state = aboutVoidwalkerHandoffRef.current;
  state.portraitSeat = copyRect(portraitSeat);
  state.firstDossierRect = copyRect(firstDossierRect);
  state.eraTitleRect = copyRect(eraTitleRect);
  state.valid =
    isValidViewportRect(portraitSeat) &&
    isValidViewportRect(firstDossierRect) &&
    isValidViewportRect(eraTitleRect);
  state.capable = capable;
  state.stampedAt = Number.isFinite(now) ? now : 0;
}

/** Morph is a scroll scalar, not a target measurement, so it deliberately
 * does not refresh `stampedAt`. */
export function writeAboutVoidwalkerHandoffMorph(morph: number): void {
  aboutVoidwalkerHandoffRef.current.morph = finiteUnit(morph);
}

/** Drop the common gate on disengage/unmount so no consumer can use stale
 * future-seat geometry after resize, fallback activation or flag changes. */
export function invalidateAboutVoidwalkerHandoff(capable = false): void {
  const state = aboutVoidwalkerHandoffRef.current;
  state.morph = 0;
  state.valid = false;
  state.capable = capable;
}
