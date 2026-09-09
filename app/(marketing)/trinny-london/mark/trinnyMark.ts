/**
 * trinnyMark — the client's logo as NUMBERS (ADR-095).
 *
 * Trinny London's mark is a ring and a blocky "TL" monogram, flat colour.
 * Nothing in this repo traces a raster (there is no potrace; `sharp` only),
 * and nothing needs to: the source PNG (1271×1271, RGBA, the mark on a
 * transparent ground) was MEASURED — the ring's two radii off the centre
 * row and column, each glyph's rectangles off its connected component — so
 * the vector is exact to the pixel rather than a tracer's approximation.
 * Ink sampled at (455, 800): rgb(86, 86, 90).
 *
 * THREE copies derive from these numbers and a test pins them together:
 *   1. `public/trinny-london/trinny-london-mark.svg` — the deliverable asset,
 *      `trinnyMarkSvg()` verbatim;
 *   2. the INLINE `<svg class="tl-turn__mark">` in the forked prototype — the
 *      fallback mark the reader sees when the WebGL morph cannot run
 *      (mobile, reduced motion, a GPU the governor refused), `currentColor`;
 *   3. the 3D target `buildTrinnyTarget.ts` extrudes from the same polygons.
 *
 * ⚠ Each glyph is ONE outline, never two overlapping rectangles: the 3D
 * builder edge-samples the extrusion, and a rectangle pair puts a sampled
 * seam straight through the T's and the L's junction.
 *
 * THREE-FREE: the route's portal imports this statically for the colour and
 * the paths; `three` reaches this page only through a dynamic edge.
 */

export const TRINNY_MARK_VIEWBOX = 1271;
export const TRINNY_MARK_CENTER = 635.5;
export const TRINNY_MARK_RING = { outer: 635.5, inner: 564.5 } as const;
/** The mark's own ink, off the source file. The route letters the fallback
 *  copy in its coral (`--tl-brand-rgb`); the asset keeps the brand grey. */
export const TRINNY_MARK_INK = "#56565A";

export type MarkPoint = readonly [number, number];
export type MarkPolygon = readonly MarkPoint[];

/** The T (a Γ): bar (412,459)–(677,554), stem (412,554)–(503,1051). */
const GLYPH_T: MarkPolygon = [
  [412, 459],
  [677, 459],
  [677, 554],
  [503, 554],
  [503, 1051],
  [412, 1051],
];
/** The L (mirrored): stem (740,228)–(831,725), foot (566,725)–(831,820). */
const GLYPH_L: MarkPolygon = [
  [740, 228],
  [831, 228],
  [831, 820],
  [566, 820],
  [566, 725],
  [740, 725],
];
/** The two squares — the T's dot, the L's dot. */
const GLYPH_SQUARE_LEFT: MarkPolygon = [
  [239, 459],
  [359, 459],
  [359, 554],
  [239, 554],
];
const GLYPH_SQUARE_RIGHT: MarkPolygon = [
  [884, 725],
  [1004, 725],
  [1004, 820],
  [884, 820],
];

export const TRINNY_MARK_GLYPHS: readonly MarkPolygon[] = [
  GLYPH_T,
  GLYPH_L,
  GLYPH_SQUARE_LEFT,
  GLYPH_SQUARE_RIGHT,
];

const num = (v: number) => (Number.isInteger(v) ? String(v) : String(v));

/** An axis-aligned polygon as a path: `M` then `H`/`V` runs, closed. */
export function polygonPath(poly: MarkPolygon): string {
  if (poly.length === 0) return "";
  const [x0, y0] = poly[0];
  let d = `M${num(x0)} ${num(y0)}`;
  for (let i = 1; i < poly.length; i++) {
    const [px, py] = poly[i - 1];
    const [x, y] = poly[i];
    if (x === px) d += `V${num(y)}`;
    else if (y === py) d += `H${num(x)}`;
    else d += `L${num(x)} ${num(y)}`;
  }
  return d + "Z";
}

/** The ring: two full circles, the inner one a hole under `evenodd`. */
export function ringPath(): string {
  const c = TRINNY_MARK_CENTER;
  const circle = (r: number) =>
    `M${num(c)} ${num(c - r)}` +
    `a${num(r)} ${num(r)} 0 1 0 0 ${num(2 * r)}` +
    `a${num(r)} ${num(r)} 0 1 0 0 ${num(-2 * r)}z`;
  return circle(TRINNY_MARK_RING.outer) + circle(TRINNY_MARK_RING.inner);
}

/** Every `d` the mark letters: the ring first, then the four glyphs. */
export function trinnyMarkPaths(): string[] {
  return [ringPath(), ...TRINNY_MARK_GLYPHS.map(polygonPath)];
}

/** The `<path>` elements, one per `d`; the ring carries its fill rule. */
export function trinnyMarkPathMarkup(indent = ""): string {
  const [ring, ...glyphs] = trinnyMarkPaths();
  return [
    `${indent}<path fill-rule="evenodd" d="${ring}"/>`,
    ...glyphs.map((d) => `${indent}<path d="${d}"/>`),
  ].join("\n");
}

/** The standalone asset — the exact bytes of `trinny-london-mark.svg`. */
export function trinnyMarkSvg(fill: string = TRINNY_MARK_INK): string {
  const vb = TRINNY_MARK_VIEWBOX;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" width="${vb}" height="${vb}">\n` +
    `  <title>Trinny London</title>\n` +
    `  <g fill="${fill}">\n` +
    trinnyMarkPathMarkup("    ") +
    `\n  </g>\n</svg>\n`
  );
}
