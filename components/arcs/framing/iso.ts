/**
 * iso — the workshop framing's ONE axonometric projection (ADR-130 U1).
 *
 * The owner read the flat register live and asked for the brandworld's own
 * retro-futuristic instruments instead: isometric wireframe machines on a grid
 * plane, drawn the way a 1980s vector display drew them. This module is the
 * arithmetic all four framing drawings share, so there is exactly one
 * projection on the page — mixing two is what broke the Intelligence Map
 * prototype (ADR-062), and a drawing whose basis differs from its neighbour's
 * reads as a rendering fault rather than as a second point of view.
 *
 * ⚠ THE BASIS IS A SYMMETRIC PARALLEL VIEW FROM THE FLOOR'S FRONT CORNER
 * (ADR-130 U4, owner 2026-09-28). U1's cabinet oblique and U2's perspective
 * camera both put the drawing's depth off to one side — "the vanishing point
 * is on the right side … super confusing" — where the Moira workshop he held
 * them against draws every figure in a parallel projection with NO vanishing
 * point: both floor edges leave the front corner at 22 degrees, `a` up to the
 * right and `b` up to the left, so the floor is a rhombus centred on the
 * stage. That is an orthographic camera at azimuth 45 degrees and elevation
 * asin(tan 22°) = 23.83°, scaled so a floor edge reads (cos 22°, −sin 22°);
 * the WebGL stage uses exactly that camera, so the fallback and the hologram
 * are one picture, not two close ones. `ISO_BASIS_2TO1` is kept, byte-equal
 * to `mapProjection.iso()` and pinned equal in the unit test.
 *
 * ⚠ THE PROJECTION IS COPIED, NEVER IMPORTED (ADR-106's law, and the map's
 * `iso()` is two lines): `@/components/landing/home-v2/...` would drag the
 * casefile's own module graph onto an arc route.
 *
 * ⚠ NO FUNCTION HERE EVER EMITS A `transform`. Every point comes back in
 * ABSOLUTE viewBox units, because every overlap walk on this surface compares
 * `getBBox`, which is blind to an element's own transform.
 *
 * ⚠ AND NO LABEL EVER SITS ON AN AXONOMETRIC FACE. `.claude/rules/proof.md`
 * records what that costs: the map city's district plaques printed through
 * their own plates 10-13 times per sheet, at every viewport, in both themes,
 * with every containment guard green — a label on a 30-degree face has no
 * baseline, its seat depends on the whole scene, and depth eats the width it
 * needs. So the SVG letters nothing: `IsoLabel` carries a seat as a fraction
 * of the crop, the renderer puts a DOM span there, a leader joins it to the
 * thing it names, and `labelCollisions` fails the build on a pair that
 * overlaps.
 */

export interface Pt {
  x: number;
  y: number;
}

/** The three axes' screen directions, per unit. `a` runs along, `b` back, `z` up. */
export interface IsoBasis {
  A: readonly [number, number];
  B: readonly [number, number];
  Z: readonly [number, number];
}

/** The floor edges' angle to the horizontal, in degrees (Moira's own). */
export const ISO_ANGLE = 22;
const RAD = Math.PI / 180;
/** The camera's elevation that puts both floor edges at `ISO_ANGLE`. */
export const ISO_ELEVATION = Math.asin(Math.tan(ISO_ANGLE * RAD));
/** How much the drawing is scaled against a true orthographic projection, so
 *  a unit along a floor edge is a unit on screen. */
export const ISO_SCALE = Math.cos(ISO_ANGLE * RAD) / Math.cos(45 * RAD);

/**
 * THE STAGE: `a` up and to the right at 22°, `b` up and to the left at 22°,
 * `z` straight up (foreshortened by the camera's elevation). (0, 0, 0) is the
 * floor's FRONT corner — the lowest point on the screen — and the viewer looks
 * from it toward the back.
 */
export const ISO_BASIS_STAGE: IsoBasis = {
  A: [Math.cos(ISO_ANGLE * RAD), -Math.sin(ISO_ANGLE * RAD)],
  B: [-Math.cos(ISO_ANGLE * RAD), -Math.sin(ISO_ANGLE * RAD)],
  Z: [0, -ISO_SCALE * Math.cos(ISO_ELEVATION)],
};

/** The map's own 2:1, copied from `mapProjection.iso()`: `[a - b, (a + b)/2]`. */
export const ISO_BASIS_2TO1: IsoBasis = {
  A: [1, 0.5],
  B: [-1, 0.5],
  Z: [0, -1],
};

/** A drawing's crop, its origin in it, and how many units a screen unit is. */
export interface IsoFrame {
  /** The crop, in viewBox units. */
  w: number;
  h: number;
  /** Where (0, 0, 0) lands in the crop. */
  ox: number;
  oy: number;
  /** Viewbox units per world unit. */
  k: number;
  basis: IsoBasis;
}

/** World (a, b, z) to absolute viewBox units. */
export function isoProject(a: number, b: number, z: number, f: IsoFrame): Pt {
  const { A, B, Z } = f.basis;
  return {
    x: f.ox + f.k * (a * A[0] + b * B[0] + z * Z[0]),
    y: f.oy + f.k * (a * A[1] + b * B[1] + z * Z[1]),
  };
}

/**
 * Paint order. SVG has no z-buffer, so a near object drawn first is a near
 * object with the far one's edges printed through it — the map's own finding.
 *
 * ⚠ UNDER THE STAGE BASIS A LARGER `a + b` IS FARTHER AWAY (both axes run up
 * the screen, away from the front corner). Sort DESCENDING — farthest first —
 * and the last thing drawn is in front.
 */
export const isoDepth = (a: number, b: number) => a + b;

/** A point as fractions of the crop — what a DOM label is seated by. */
export function isoFraction(p: Pt, f: IsoFrame): { ax: number; at: number } {
  return { ax: p.x / f.w, at: p.y / f.h };
}

const n = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "");

/** A polyline (or polygon) as a path, in absolute units. */
export function isoPath(pts: readonly Pt[], close = false): string {
  if (pts.length === 0) return "";
  const [first, ...rest] = pts;
  return `M${n(first.x)} ${n(first.y)}${rest.map((p) => ` L${n(p.x)} ${n(p.y)}`).join("")}${close ? " Z" : ""}`;
}

/** A box on the plane: footprint `w` x `d` at (a, b), `h` tall from `z`. */
export interface IsoBox {
  a: number;
  b: number;
  w: number;
  d: number;
  z: number;
  h: number;
}

export interface IsoBoxPaths {
  /** The nine edges a solid box shows. */
  visible: string;
  /**
   * The three it hides — all meeting the FAR-BACK-BOTTOM vertex (a+w, b+d, z),
   * the one corner whose every adjoining face points away from a viewer at the
   * front corner. Dashed, so the box reads as a machine rather than a hexagon.
   */
  hidden: string;
  /** The top face. With `right` and `left`, the three faces the viewer sees,
   *  for an opaque fill in paint order. */
  top: string;
  /** The face at `b`, running along `a`: the front-RIGHT face. */
  right: string;
  /** The face at `a`, running along `b`: the front-LEFT face. */
  left: string;
  /** Paint order (larger is FARTHER). */
  depth: number;
  /** The right-hand vertical edge's midpoint — where Moira seats a name. */
  side: Pt;
  /** The top face's right-hand corner. */
  apex: Pt;
  /** The top face's centre. */
  topCentre: Pt;
}

export function isoBox(box: IsoBox, f: IsoFrame): IsoBoxPaths {
  const { a, b, w, d, z, h } = box;
  const p = (aa: number, bb: number, zz: number) => isoProject(aa, bb, zz, f);
  const a1 = a + w;
  const b1 = b + d;
  const z1 = z + h;
  // Bottom, counter-clockwise from the near-left corner; top the same.
  const b00 = p(a, b, z);
  const b10 = p(a1, b, z);
  const b11 = p(a1, b1, z);
  const b01 = p(a, b1, z);
  const t00 = p(a, b, z1);
  const t10 = p(a1, b, z1);
  const t11 = p(a1, b1, z1);
  const t01 = p(a, b1, z1);
  // The visible nine: the top face (4), the two front bottom edges (2), and
  // the three verticals that are not the far-back one (3).
  const visible = [
    isoPath([t00, t10, t11, t01], true),
    isoPath([b00, b10]),
    isoPath([b00, b01]),
    isoPath([b00, t00]),
    isoPath([b10, t10]),
    isoPath([b01, t01]),
  ].join(" ");
  const hidden = [isoPath([b11, b10]), isoPath([b11, b01]), isoPath([b11, t11])].join(" ");
  return {
    visible,
    hidden,
    top: isoPath([t00, t10, t11, t01], true),
    right: isoPath([b00, b10, t10, t00], true),
    left: isoPath([b00, b01, t01, t00], true),
    depth: isoDepth(a + w / 2, b + d / 2),
    side: p(a1, b, z + h / 2),
    apex: t10,
    topCentre: p(a + w / 2, b + d / 2, z1),
  };
}

/** A rectangle lying on the plane (or at height `z`). */
export function isoPlane(
  a: number,
  b: number,
  w: number,
  d: number,
  z: number,
  f: IsoFrame
): string {
  return isoPath(
    [
      isoProject(a, b, z, f),
      isoProject(a + w, b, z, f),
      isoProject(a + w, b + d, z, f),
      isoProject(a, b + d, z, f),
    ],
    true
  );
}

/**
 * The datum: a ruled plane. `along` runs with `a`, `across` with `b` — two
 * families, so a sheet can weight the time direction differently from depth.
 */
export function isoGrid(
  a: number,
  b: number,
  w: number,
  d: number,
  z: number,
  pitch: number,
  f: IsoFrame
): { along: readonly string[]; across: readonly string[] } {
  const along: string[] = [];
  const across: string[] = [];
  for (let bb = b; bb <= b + d + 1e-6; bb += pitch) {
    along.push(isoPath([isoProject(a, bb, z, f), isoProject(a + w, bb, z, f)]));
  }
  for (let aa = a; aa <= a + w + 1e-6; aa += pitch) {
    across.push(isoPath([isoProject(aa, b, z, f), isoProject(aa, b + d, z, f)]));
  }
  return { along, across };
}

/** A run along `a` at one depth and height. */
export function isoRail(a0: number, a1: number, b: number, z: number, f: IsoFrame): string {
  return isoPath([isoProject(a0, b, z, f), isoProject(a1, b, z, f)]);
}

/**
 * A leader with ONE elbow, never a curve: the dial's own idiom (ADR-106). The
 * elbow is at the label's x on the anchor's y, so a label seated level with
 * what it names gets a single straight run.
 */
export function isoLeader(from: Pt, to: Pt, elbowX?: number): string {
  const ex = elbowX ?? to.x;
  return isoPath([from, { x: ex, y: from.y }, to]);
}

/** Deterministic PRNG, copied from `holoProgramGeom` (ADR-080's own seed law). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The framing's seed. One integer decides every mote on all four drawings. */
export const ISO_SEED = 368;

/**
 * Motes over the plane: the particle system's atmosphere at drawing scale.
 * Seeded, so the figure is byte-identical on the server and in the handout.
 */
export function isoDust(
  seed: number,
  count: number,
  a: number,
  b: number,
  w: number,
  d: number,
  z: number,
  f: IsoFrame
): readonly Pt[] {
  const rand = mulberry32(seed);
  const out: Pt[] = [];
  for (let i = 0; i < count; i += 1) {
    const aa = a + rand() * w;
    const bb = b + rand() * d;
    const zz = z * rand();
    out.push(isoProject(aa, bb, zz, f));
  }
  return out;
}

/** A string the DRAWING names but does not letter: the DOM span's own seat. */
export interface IsoLabel {
  id: string;
  text: string;
  ax: number;
  at: number;
  /** How the span is seated horizontally about `ax`. */
  anchor: "start" | "middle" | "end";
  /** How it is seated vertically about `at`. Default: centred. */
  vAlign?: "top" | "middle" | "bottom";
  /** Wrapped lines, when the span is prose rather than a chrome label. */
  lines?: number;
  /** An explicit measure in viewBox units, for a span that is not mono caps. */
  measure?: number;
  /**
   * Degrees, for a word that runs ALONG a floor edge (Moira's axis words:
   * −22 on the `a` edge, +22 on the `b` edge). The seat is the span's centre.
   * ⚠ The collision walk tests the ROTATED rectangle, not its bounding box —
   * two parallel rows of rotated words have overlapping bounding boxes and
   * clear rectangles, and an AABB walk would fail a drawing that is clean.
   */
  rot?: number;
}

/** PT Mono's advance plus the label rung's tracking (`mapProjection`'s own). */
export const ISO_MONO_ADVANCE = 0.68;

export interface LabelBox {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Rotation about the box's centre, degrees. */
  rot?: number;
}

/**
 * Every label's box in viewBox units, from its seat, its anchor and its text.
 *
 * ⚠ `type` IS AN HONEST ESTIMATE OF THE RENDERED SIZE, NOT A DECLARATION. The
 * spans are DOM and their font-size is a `clamp()`, so this arithmetic exists
 * to catch a SEATING collision — two labels placed on top of each other —
 * which is the defect the map city shipped 13 times a sheet. The pixel walk
 * on the live page is the other half, and neither is sufficient alone.
 */
export function labelBoxes(
  labels: readonly IsoLabel[],
  type: number,
  f: IsoFrame,
  lineHeight = 1.35
): readonly LabelBox[] {
  return labels.map((l) => {
    const w = l.measure ?? l.text.length * type * ISO_MONO_ADVANCE;
    const h = (l.lines ?? 1) * type * lineHeight;
    // ⚠ A SEAT IS A FRACTION OF THE CROP and a measure is in viewBox units;
    // comparing the two directly is how a collision walk comes back empty on
    // a drawing where every label sits inside its neighbour.
    const x = l.ax * f.w;
    const y = l.at * f.h;
    if (l.rot) {
      return { id: l.id, x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2, rot: l.rot };
    }
    const x0 = l.anchor === "start" ? x : l.anchor === "middle" ? x - w / 2 : x - w;
    const y0 = l.vAlign === "top" ? y : l.vAlign === "bottom" ? y - h : y - h / 2;
    return { id: l.id, x0, y0, x1: x0 + w, y1: y0 + h };
  });
}

/** A box's four corners, rotated about its centre. */
export function labelCorners(b: LabelBox): Pt[] {
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  const r = ((b.rot ?? 0) * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [
    [b.x0, b.y0],
    [b.x1, b.y0],
    [b.x1, b.y1],
    [b.x0, b.y1],
  ].map(([x, y]) => ({ x: cx + (x - cx) * c - (y - cy) * s, y: cy + (x - cx) * s + (y - cy) * c }));
}

/** Separating-axis test on two (possibly rotated) rectangles. */
function overlaps(p: LabelBox, q: LabelBox): boolean {
  if (!p.rot && !q.rot) return p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1;
  const P = labelCorners(p);
  const Q = labelCorners(q);
  for (const poly of [P, Q]) {
    for (let i = 0; i < 2; i += 1) {
      const nx = -(poly[i + 1].y - poly[i].y);
      const ny = poly[i + 1].x - poly[i].x;
      const pp = P.map((t) => t.x * nx + t.y * ny);
      const qq = Q.map((t) => t.x * nx + t.y * ny);
      if (Math.max(...pp) <= Math.min(...qq) || Math.max(...qq) <= Math.min(...pp)) return false;
    }
  }
  return true;
}

/** Every pair of labels whose boxes overlap. Empty is the contract. */
export function labelCollisions(boxes: readonly LabelBox[]): readonly [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (overlaps(boxes[i], boxes[j])) out.push([boxes[i].id, boxes[j].id]);
    }
  }
  return out;
}
