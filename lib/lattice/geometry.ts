/**
 * The lattice's chamfer geometry (ADR-149, on ADR-065's corner law).
 *
 * ONE source for the numbers every housing on the site cuts with, and for the
 * polygon text the frame recipe paints. `tests/lib/lattice-tokens.test.ts`
 * pins `app/styles/lattice.css`'s ladder to `CHAMFER` and (from Phase 1)
 * `components/lattice/lattice.css`'s polygons to `cutPolygon` / `ringPolygon`,
 * so the CSS cannot drift from the arithmetic.
 *
 * THE INNER LEG. A clip-path CUTS a border and never strokes one (ADR-089), so
 * a chamfered edge is a two-contour `evenodd` ring: the outer outline, then the
 * same outline 1px inside. Insetting a 45° cut by d does NOT shorten its leg by
 * d: the diagonal moves by d·√2 along each axis, so the inner leg is
 * `ch − d(2 − √2)` ≈ `ch − 0.586px` at d = 1. The site wrote this constant
 * three ways (0.6 / 0.586 / 0.414) before this module; it is written once here.
 *
 * Zero imports. Pure strings; the CSS carries them verbatim.
 */

/** The depth ladder, in px. `chrome` is 0 by law: a chrome-rung object is square. */
export const CHAMFER = {
  chrome: 0,
  seed: 16,
  plate: 26,
} as const;

/** The two LIVE responsive rungs, named honestly rather than re-solved. */
export const CHAMFER_FLUID = {
  /** = --sh-card-ch = --pf-card-ch, the sheet consoles and the proof card */
  card: "clamp(14px, 1.3vw, 22px)",
  /** = --arc-plate-ch / --dos-ch / --pg-ch, the arcs' plates */
  plateFluid: "clamp(16px, 1.8vw, 26px)",
} as const;

/** d(2 − √2) at d = 1px — the inner ring's leg correction. */
export const LEG = 2 - Math.SQRT2;
/** The constant as the CSS spells it (three decimals, the house's own). */
export const LEG_PX = "0.586px";

export type Cut = "tr-bl" | "tr" | "bl" | "none";
export const CUTS: readonly Cut[] = ["tr-bl", "tr", "bl", "none"];

const CH = "var(--lat-ch)";
const IN = "var(--lat-ch-in)";

/** The outer outline, clockwise from the top-left, as the clip the HOST takes. */
export function cutPolygon(cut: Cut): string {
  const tr = cut === "tr-bl" || cut === "tr";
  const bl = cut === "tr-bl" || cut === "bl";
  const pts: string[] = ["0 0"];
  if (tr) pts.push(`calc(100% - ${CH}) 0`, `100% ${CH}`);
  else pts.push("100% 0");
  pts.push("100% 100%");
  if (bl) pts.push(`${CH} 100%`, `0 calc(100% - ${CH})`);
  else pts.push("0 100%");
  return `polygon(${pts.join(", ")})`;
}

/**
 * The ring: the outer outline clockwise, closed back on its first point, then
 * the inner outline 1px inside, closed back on ITS first point. Both contours
 * close (ADR-148 U2: an open ring's connecting edges cross along the left side
 * and fade the 1px edge toward mid-height). `evenodd` makes the middle a hole.
 */
export function ringPolygon(cut: Cut): string {
  const tr = cut === "tr-bl" || cut === "tr";
  const bl = cut === "tr-bl" || cut === "bl";
  const outer: string[] = ["0 0"];
  if (tr) outer.push(`calc(100% - ${CH}) 0`, `100% ${CH}`);
  else outer.push("100% 0");
  outer.push("100% 100%");
  if (bl) outer.push(`${CH} 100%`, `0 calc(100% - ${CH})`);
  else outer.push("0 100%");
  outer.push("0 0");
  const inner: string[] = ["1px 1px"];
  if (tr) inner.push(`calc(100% - 1px - ${IN}) 1px`, `calc(100% - 1px) calc(1px + ${IN})`);
  else inner.push("calc(100% - 1px) 1px");
  inner.push("calc(100% - 1px) calc(100% - 1px)");
  if (bl) inner.push(`calc(1px + ${IN}) calc(100% - 1px)`, `1px calc(100% - 1px - ${IN})`);
  else inner.push("1px calc(100% - 1px)");
  inner.push("1px 1px");
  return `polygon(evenodd, ${[...outer, ...inner].join(", ")})`;
}

/** Collapse whitespace so a CSS block can be compared to the builder's text. */
export const normalisePolygon = (s: string): string => s.replace(/\s+/g, " ").trim();
