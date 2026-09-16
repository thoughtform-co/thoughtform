/**
 * ringType — the type rungs for text BAKED into WebGL textures (ADR-092 §4,
 * stage 2 — seeded by ADR-110's back face).
 *
 * `app/styles/variables.css` declares four tracking rungs and a weight ceiling
 * for every production sheet; a `<canvas>` bake cannot read a custom property,
 * so the same rungs live here as numbers and `tests/lib/ring-type.test.ts`
 * asserts them equal to the sheet. A bake that sets its type through
 * `setBakeType` obeys the ramp by construction; the three older bakes
 * (`ServicesCardRing`'s faces and drawer, `caseCardBake`, `LatentFieldTunnel`)
 * still carry literals and their ratchet pins, until their own pass.
 *
 * Three-free on purpose: `ringCtaBox.ts`'s own discipline — a DOM-side test
 * and the hit layer read this module, and one heavy import here would drag
 * the WebGL stack into First Load JS.
 */

/** Sans prose. */
export const TRACK_COPY = 0;
/** Sans display, sentence case. */
export const TRACK_DISPLAY = -0.02;
/** The base rung: every mono chrome label. */
export const TRACK_LABEL = 0.08;
/** Eyebrows, bracketed designations, kickers, counts. */
export const TRACK_EYEBROW = 0.15;
/** Rest weight. */
export const WEIGHT_TEXT = 400;
/** The ceiling. ⚠ PT Mono has no 500: on mono it renders 400. */
export const WEIGHT_LIT = 500;

/** The two faces the bakes draw with — the sheet's own stacks. */
export const BAKE_MONO = '"PT Mono", "IBM Plex Mono", ui-monospace, monospace';
export const BAKE_SANS = '"PP Neue Montreal", "Helvetica Neue", Arial, sans-serif';

export interface BakeType {
  family: "mono" | "sans";
  /** Size in the bake's own px (the 840×1360 space; `ctx.scale` carries it). */
  px: number;
  weight?: number;
  /** A tracking rung in em, one of the four above (or 0). */
  track?: number;
}

export function bakeFont(t: BakeType): string {
  return `${t.weight ?? WEIGHT_TEXT} ${t.px}px ${t.family === "mono" ? BAKE_MONO : BAKE_SANS}`;
}

/** The rung as a canvas tracking value, in the bake's px, to a tenth. */
export function bakeTrackPx(t: BakeType): number {
  return Math.round(t.px * (t.track ?? 0) * 10) / 10;
}

/** Set a bake context's font AND tracking in one call — the one place a
 *  bake that reads this module writes either. */
export function setBakeType(ctx: CanvasRenderingContext2D, t: BakeType): void {
  ctx.font = bakeFont(t);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
    `${bakeTrackPx(t)}px`;
}
