/**
 * flowClock — the workshop's opening flow on /arcs/thoughtform/workshop-v1, as
 * pure arithmetic (ADR-138).
 *
 * Owner, 2026-09-30: "we start with an introduction about myself. I do think
 * we need the era section after the About section. That way, I showcase who I
 * am, then what I've done before, and then we can dive into the arc."
 *
 *   About ──(the homepage's handoff)──▶ the eras ──(the seam)──▶ the Arc
 *
 * THE RUNWAYS.
 *   · `#about` is `100svh + DWELL + RUN` tall on the capable rung and its
 *     stage is sticky, so it pins for DWELL + RUN of scroll (unchanged since
 *     ADR-137 U2; the dwell is his "short read first").
 *   · The era stage's own hook welds it `ERA_OVERLAP_SVH` up over the About
 *     (`voidwalker.css`, `-120svh`), as on `/`, so the two pin together for a
 *     short stretch and the era pins at `ABOUT_ERA_PIN_U` of the About's run.
 *   · The corridor mount is welded ONE VIEWPORT up under the era
 *     (`ERA_WELD_SVH`), so the corridor pins on the frame the era unpins,
 *     whatever the era's runway is.
 *
 * ⚠ THE CSS DECLARES THE LENGTHS TOO (`--tw-about-dwell`, `--tw-about-run`,
 * `--tw-era-weld` in thoughtform-workshop.css) and the CSS is the one that
 * must exist before hydration; the lockstep test pins them equal.
 *
 * Every channel below is a pure function of a rect or of the era's own
 * published progress, so scrolling back unwinds the flow exactly.
 */

import {
  SCRAMBLE_LEAD_S,
  SCRAMBLE_STAGGER_S,
  scrambleDuration,
  scrambleFrame,
} from "@/lib/home-v2/captionScramble";
import { LINE_STAGGER_S } from "@/lib/home-v2/scrubbedDecode";

/** Pinned scroll spent reading the bio before anything moves, in svh. */
export const ABOUT_DWELL_SVH = 50;
/** Pinned scroll the About's handoff into the eras takes, in svh. */
export const ABOUT_RUN_SVH = 100;
/** How far the era stage overlaps the About (its own hook's weld on `/`,
 *  `voidwalker.css`'s `margin-top: -120svh`), in svh. */
export const ERA_OVERLAP_SVH = 120;
/** How far the corridor mount is pulled up under the era, in svh: exactly one
 *  viewport, so the corridor's sticky stage reaches the top on the frame the
 *  era's releases. */
export const ERA_WELD_SVH = 100;

/** A window `[start, end]` of a clock. */
export type FlowWindow = readonly [number, number];

/* ── About → the eras, on the About's run `u` ─────────────────────────── */

/** The bio un-types; the name's line is carried by its glide instead. */
export const A_OUT: FlowWindow = [0, 0.3];
/** The fact row and the links close on the centre-out aperture. */
export const A_BOX_OUT: FlowWindow = [0.05, 0.3];
/** The orbit's corner readouts scramble out. */
export const LABELS_OUT: FlowWindow = [0.08, 0.28];
/** The orbit's rings and particle halo close in onto the card. */
export const RINGS_CLOSE: FlowWindow = [0.15, 0.45];
/** The deck squares up: its three slabs fold back onto the card. */
export const DECK_SQUARE: FlowWindow = [0.3, 0.5];
/** The card flies to the era figure's seat. */
export const CARD_FLIGHT: FlowWindow = [0.45, 0.8];
/** The name glides onto the era title's seat and scrambles into it. */
export const NAME_GLIDE: FlowWindow = [0.45, 0.8];

/**
 * The About's `u` at which the era stage pins: the About's top is then
 * `−(station − overlap)`, i.e. `(100 + RUN − OVERLAP) / RUN` of the run.
 * Both landings above END here, so the card and the name are on their seats
 * on the frame the era is.
 */
export const ABOUT_ERA_PIN_U = (100 + ABOUT_RUN_SVH - ERA_OVERLAP_SVH) / ABOUT_RUN_SVH;

/** From here the era has acquired (its own morph window, `[0, 0.08]` of the
 *  era, is over) and the About's stand-ins hand over. */
export const ABOUT_HANDOFF_U = 0.94;

/* ── The eras → the Arc, on the era's progress `p` ───────────────────── */

/** The parked mark leaves the park for the thesis anchor, ink lifting. */
export const TRAVEL: FlowWindow = [0.74, 0.88];
/** The wireframe folds back onto the glyph's own pixels. */
export const FOLD: FlowWindow = [0.8, 0.92];
/** The square opens from the glyph's centre onto the thesis frame. */
export const OPEN: FlowWindow = [0.9, 1];

/* ── The era title becomes the thesis title, on the era's `p` ──────────
   v3 only (ADR-143 U5; `useWorkshopFlow({ titleMorph: true })`). */

/**
 * The era title's leaf leaves its seat as the exit begins (the panels clear
 * on [0.74, 0.96]) and lands on the thesis title's seat while the square is
 * still opening over the copy, so the frame opens round a title that is
 * already there. From the end of the glide to `p` 1 the leaf holds the seat;
 * the real title takes over when the flow is done.
 */
export const TITLE_GLIDE: FlowWindow = [0.74, 0.96];
/** Its characters resolve a little before it lands, so the last stretch is
 *  the settled line travelling home rather than noise arriving. */
export const TITLE_DECODE: FlowWindow = [0.74, 0.93];

export type AboutState = "hold" | "run" | "done";
export type FlowState = "about" | "era" | "seam" | "done";

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

/** ADR-097 U12's curve: exactly half-way at the midpoint, readable end to end. */
export function easeInOutCubic(x: number): number {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Linear progress through a window, clamped. */
export function windowOf(v: number, [a, b]: FlowWindow): number {
  if (!(b > a)) return v >= b ? 1 : 0;
  return clamp01((v - a) / (b - a));
}

/** Eased progress through a window. */
export function easedWindow(v: number, w: FlowWindow): number {
  return easeInOutCubic(windowOf(v, w));
}

/**
 * The About's run from its viewport top. `vh` is the layout viewport. Not
 * clamped, so the state can tell the dwell from the run.
 */
export function aboutU(aboutTop: number, vh: number): number {
  if (!(vh > 0)) return 0;
  const pinned = -aboutTop;
  const dwell = (ABOUT_DWELL_SVH / 100) * vh;
  const run = (ABOUT_RUN_SVH / 100) * vh;
  return (pinned - dwell) / run;
}

export function aboutState(u: number): AboutState {
  if (!(u > 0)) return "hold";
  return u >= ABOUT_HANDOFF_U ? "done" : "run";
}

/** Where the flow is, from the era's progress (0 until it pins). */
export function flowState(p: number): FlowState {
  if (p >= 1) return "done";
  if (p >= TRAVEL[0]) return "seam";
  if (p > 0) return "era";
  return "about";
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Linear interpolation between two rects. */
export function lerpRect(a: Rect, b: Rect, e: number): Rect {
  const t = clamp01(e);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    w: a.w + (b.w - a.w) * t,
    h: a.h + (b.h - a.h) * t,
  };
}

/**
 * The card's flight as a translate + uniform scale about its own centre: the
 * seat has the card's own aspect (420 / 680 both), so one scale lands it.
 */
export function cardFlight(
  card: Rect,
  seat: Rect,
  e: number
): { dx: number; dy: number; s: number } {
  const t = easeInOutCubic(e);
  const cx0 = card.x + card.w / 2;
  const cy0 = card.y + card.h / 2;
  const cx1 = seat.x + seat.w / 2;
  const cy1 = seat.y + seat.h / 2;
  const s1 = card.w > 0 ? seat.w / card.w : 1;
  return { dx: (cx1 - cx0) * t, dy: (cy1 - cy0) * t, s: 1 + (s1 - 1) * t };
}

/**
 * The half-size a square aperture centred on `(cx, cy)` needs to clear a
 * `w × h` frame — its Chebyshev distance to the farthest corner, plus the
 * soft edge (so the corners are fully open at 1, not still in the ramp), plus
 * a margin so the edge is off-frame at 1, never on it.
 */
export function apertureHalfMax(
  cx: number,
  cy: number,
  w: number,
  h: number,
  feather = 0,
  margin = 8
): number {
  return Math.max(cx, w - cx, cy, h - cy) + Math.max(0, feather) + margin;
}

/** The aperture's half-size at era progress `p`. */
export function apertureHalf(p: number, max: number): number {
  return max * easedWindow(p, OPEN);
}

/** A centre-out aperture's open fraction → the `inset()` side, in percent
 *  (50 = shut to a centre slit, 0 = open). */
export function apertureInset(open: number): number {
  return 50 * (1 - clamp01(open));
}

/**
 * The width of the opening's SOFT EDGE, CSS px, as a share of the frame's
 * height (the owner, 2026-09-30: the square read as "a frame going over the
 * brand mark … make it a bit more subtle"). Across it the particle mark fades
 * out as the frame fades in, so the opening draws no line of its own. 8 % of
 * the height is ~40 % of the glyph's width at every shape, because the glyph
 * is sized off the height too.
 */
export const APERTURE_FEATHER_VH = 8;

export function apertureFeather(vh: number): number {
  return (APERTURE_FEATHER_VH / 100) * Math.max(0, vh);
}

/**
 * The soft square as the four stops of a CSS mask on each axis, px in the
 * coordinates of an element whose box starts at `(ox, oy)`: transparent up to
 * the square's edge, opaque from `feather` inside it. The feather never
 * exceeds the half-size, so a small square peaks at its centre rather than
 * folding its ramps over each other, and a closed one (`half` 0) is
 * transparent everywhere.
 */
export interface FeatherStops {
  x: [number, number, number, number];
  y: [number, number, number, number];
}

export function featherStops(
  ox: number,
  oy: number,
  cx: number,
  cy: number,
  half: number,
  feather: number
): FeatherStops {
  const h = Math.max(0, half);
  const f = Math.min(Math.max(0, feather), h);
  const x0 = cx - h - ox;
  const x3 = cx + h - ox;
  const y0 = cy - h - oy;
  const y3 = cy + h - oy;
  return { x: [x0, x0 + f, x3 - f, x3], y: [y0, y0 + f, y3 - f, y3] };
}

/* ── The title morph's arithmetic (TITLE_GLIDE / TITLE_DECODE) ───────── */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** One line of the morph: what it says leaving, what it says arriving. */
export interface MorphPair {
  from: string;
  to: string;
}

/**
 * The decode's wall for a set of lines: the longest line's scramble plus one
 * stagger per line after the first, so the block resolves as a cascade and
 * every line is whole at decode progress 1.
 */
export function morphWall(pairs: readonly MorphPair[]): number {
  const longest = pairs.reduce((m, p) => Math.max(m, scrambleDuration(p.from, p.to)), 0);
  return longest + LINE_STAGGER_S * Math.max(0, pairs.length - 1);
}

/** Line `i`'s own time on the wall at decode progress `s`. */
export function morphLineT(s: number, i: number, wall: number): number {
  return clamp01(s) * wall - i * LINE_STAGGER_S;
}

/**
 * Line text at its own time `t` (seconds on the house kernel's clock): the
 * outgoing text until its first window opens, then the kernel's shuffle,
 * then the incoming text once every character has resolved. Pure in `t`,
 * so a scroll-derived `t` runs it backwards for free (ADR-115).
 */
export function morphLineText(
  from: string,
  to: string,
  t: number,
  random: () => number = Math.random
): string {
  if (!(t > 0)) return from;
  return scrambleFrame({ from, to }, t, random) ?? to;
}

/**
 * Split a line's display string at its segments' END offsets (the incoming
 * text's). Whatever runs past the last end, an outgoing line longer than
 * the incoming one, rides the last segment, so nothing is dropped.
 */
export function splitSegments(text: string, ends: readonly number[]): string[] {
  const out: string[] = [];
  let a = 0;
  ends.forEach((end, k) => {
    const b = k === ends.length - 1 ? text.length : Math.max(a, Math.min(end, text.length));
    out.push(text.slice(a, b));
    a = b;
  });
  return out;
}

/**
 * How much of segment `[start, end)` of the incoming text has RESOLVED at its
 * line's time `t`, from its first character's resolve moment (0) to its last
 * one's (1). The marker's wash rides it, so a word lights as it is spelled.
 */
export function segmentResolved(t: number, start: number, end: number): number {
  const a = SCRAMBLE_LEAD_S + start * SCRAMBLE_STAGGER_S;
  const span = Math.max(1, end - 1 - start) * SCRAMBLE_STAGGER_S;
  return clamp01((t - a) / span);
}

/** An sRGB colour as `[r, g, b, alpha]`. */
export type Rgba = [number, number, number, number];

/** A computed `rgb()` / `rgba()` colour, either syntax; `null` for anything
 *  else (a caller then switches the colour at the midpoint instead). */
export function parseRgba(s: string): Rgba | null {
  const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/.exec(
    s.trim()
  );
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : Number(m[4]) / (m[5] === "%" ? 100 : 1);
  return [Number(m[1]), Number(m[2]), Number(m[3]), alpha];
}

export function mixRgba(a: Rgba, b: Rgba, t: number): string {
  const e = clamp01(t);
  const c = (i: number) => Math.round(lerp(a[i]!, b[i]!, e));
  return `rgba(${c(0)}, ${c(1)}, ${c(2)}, ${lerp(a[3], b[3], e).toFixed(4)})`;
}

/** The first shadow of a computed `text-shadow`; `null` for `none`. */
export interface Shadow {
  color: Rgba;
  x: number;
  y: number;
  blur: number;
}

export function parseShadow(s: string): Shadow | null {
  const m = /^(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+([\d.]+)px)?/.exec(s.trim());
  if (!m) return null;
  const color = parseRgba(m[1]!);
  if (!color) return null;
  return { color, x: Number(m[2]), y: Number(m[3]), blur: m[4] ? Number(m[4]) : 0 };
}

/** A shadow between two ends; an absent end is the other's geometry at zero
 *  alpha, so a glow fades out where it is not wanted rather than snapping. */
export function mixShadow(a: Shadow | null, b: Shadow | null, t: number): string {
  if (!a && !b) return "none";
  const from = a ?? { ...b!, color: [b!.color[0], b!.color[1], b!.color[2], 0] as Rgba };
  const to = b ?? { ...a!, color: [a!.color[0], a!.color[1], a!.color[2], 0] as Rgba };
  const e = clamp01(t);
  return `${lerp(from.x, to.x, e).toFixed(2)}px ${lerp(from.y, to.y, e).toFixed(2)}px ${lerp(
    from.blur,
    to.blur,
    e
  ).toFixed(2)}px ${mixRgba(from.color, to.color, e)}`;
}
