/**
 * The era figure's transition (ADR-082 U42) — the arithmetic under
 * `HoloFigure`'s glitch canvas, pure, so the part that can be wrong on paper is
 * tested on paper.
 *
 * Owner, 2026-09-24: "when you scroll between eras I want a glitch effect to
 * happen on the avatar so there's a clean transition between the avatars".
 * The era change was a bare `src` swap on one `<video>` — a hard cut on
 * scroll, and on a click a tear-in on the NEW figure with a brightness-step
 * settle (a luminance pulse) and no exit for the old one. It is the hero's own
 * theme-swap grammar now (ADR-060, `lib/key-visual/themeGlitch.ts`): a canvas
 * laid over the video holds the OUTGOING frame and tears it away in bands
 * while the incoming plate resolves from a coarse mosaic to native, and the
 * canvas leaves on the kernel's identity frame. Pure spatial tearing — no
 * opacity curve on the figure and no brightness pulse — which is what keeps it
 * inside the no-flashing law (ADR-097 U12). One transition for scroll AND
 * click, by his choice.
 *
 * What this module decides:
 *   · the PLAN for a pair of eras — the kernel's, seeded so a→b and b→a tear
 *     differently and a pair always tears the same way;
 *   · where a plate PAINTS inside the canvas — `object-fit: contain;
 *     object-position: bottom center` at that era's own `--holo-fit`, in a box
 *     that is the union of every era's box (fit 1), so the two eras' pictures
 *     land exactly where their `<video>`s do;
 *   · the scanline mask's PHASE — the canvas's box is taller than the incoming
 *     video's by `(1 − fit) × height`, so its `mask-position` is offset by that
 *     modulo the pitch, or the lines jump a pixel or two at the hand-over;
 *   · the INTERRUPT policy — a run in flight restarts with the previous
 *     target's plate as the outgoing one, never a snapshot of the canvas
 *     (mosaic on mosaic);
 *   · which eras to WARM — the neighbours, because a reader at the station
 *     steps one slice at a time.
 *
 * Imports only the kernel and the registry's own placement helper.
 */

import { containedHologramPlacement, type CharacterEraHologram } from "./characterEras";
import {
  createGlitchPlan,
  GLITCH_DURATION_MS,
  type GlitchPlan,
} from "@/lib/key-visual/themeGlitch";

/** The run's length, the hero's own. On a figure ~845px tall at 1920×1247
 *  against the hero's full-bleed plate this reads at the same pace; the dial
 *  is here if it ever reads fast. */
export const HOLO_GLITCH_MS = GLITCH_DURATION_MS;

/** A deterministic seed for a pair of era ids: order-sensitive, so the
 *  reverse of a pair is a different tear. FNV-1a over `from → to`. */
export function holoGlitchSeed(fromId: string, toId: string): number {
  let h = 0x811c9dc5;
  for (const ch of `${fromId}→${toId}`) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The kernel's plan for a pair, at the figure's duration (× `slow`, the
 *  capture's dev hook — 1 in production). */
export function holoGlitchPlan(fromId: string, toId: string, slow = 1): GlitchPlan {
  const k = Number.isFinite(slow) && slow > 0 ? slow : 1;
  return createGlitchPlan(holoGlitchSeed(fromId, toId), {
    durationMs: Math.round(HOLO_GLITCH_MS * k),
  });
}

export interface HoloPlateRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where an era's 720×1280 plate paints inside the canvas box.
 *
 * The canvas is the media's box at fit 1 (`100% × overscan` of the wrap,
 * bottom-centred); an era's own `<video>` is that box scaled by its `fit`,
 * still bottom-centred, with the picture `contain`ed and seated on the
 * bottom. So the picture is `contain` inside a `fit`-scaled box, then that
 * box is bottom-centred in the canvas — two seats, both from the registry's
 * own placement helper.
 */
export function holoPlateRect(
  boxW: number,
  boxH: number,
  fit: number,
  hologram: Pick<CharacterEraHologram, "frame" | "footY">
): HoloPlateRect | null {
  if (!Number.isFinite(fit) || fit <= 0) return null;
  const innerW = boxW * fit;
  const innerH = boxH * fit;
  const p = containedHologramPlacement(innerW, innerH, hologram);
  if (!p) return null;
  return {
    x: (boxW - innerW) / 2 + p.left,
    y: boxH - innerH + p.top,
    w: p.width,
    h: p.height,
  };
}

/**
 * The scanline mask's vertical offset for the canvas, so its 1px lines sit on
 * the same rows as the incoming video's. The video's box top is
 * `(1 − fit) × boxH` below the canvas's; a repeating gradient only cares about
 * that modulo its pitch.
 */
export function holoScanPhase(boxH: number, fit: number, pitch: number): number {
  if (!Number.isFinite(boxH) || !Number.isFinite(fit) || !Number.isFinite(pitch) || pitch <= 0) {
    return 0;
  }
  const d = (1 - Math.min(1, Math.max(0, fit))) * boxH;
  const phase = d % pitch;
  return phase < 0 ? phase + pitch : phase;
}

export interface HoloGlitchRun<P> {
  /** The era the run is leaving. */
  fromId: string;
  /** The era the run is arriving at. */
  toId: string;
  /** The outgoing drawable. */
  from: P;
  /** The incoming drawable. */
  to: P;
  fromFit: number;
  toFit: number;
}

/**
 * A run interrupted by another era change: it restarts, and the OUTGOING
 * plate is the plate it was arriving at — its poster, whole — never what the
 * canvas happened to be showing. The hero stops on a mid-run re-toggle
 * (compounding mosaic on mosaic is worse than the cut); a reader scrolling
 * through five eras would get five cuts that way, so the figure restarts from
 * the last clean plate instead.
 */
export function holoGlitchInterrupt<P>(
  current: HoloGlitchRun<P>,
  next: { toId: string; to: P; toFit: number }
): HoloGlitchRun<P> {
  return {
    fromId: current.toId,
    toId: next.toId,
    from: current.to,
    to: next.to,
    fromFit: current.toFit,
    toFit: next.toFit,
  };
}

/** The roster indices to warm for the era at `index`: its neighbours, inside
 *  the roster. The reader steps one slice at a time; warming all five costs
 *  every visitor ~440 kB for the eras they may never scroll to. */
export function neighbourEras(index: number, count: number): number[] {
  if (!Number.isInteger(index) || !Number.isInteger(count) || count <= 0) return [];
  if (index < 0 || index >= count) return [];
  const out: number[] = [];
  if (index - 1 >= 0) out.push(index - 1);
  if (index + 1 < count) out.push(index + 1);
  return out;
}
