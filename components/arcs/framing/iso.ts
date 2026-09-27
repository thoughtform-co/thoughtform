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
 * ⚠ THE BASIS IS A CABINET OBLIQUE, NOT THE MAP'S 2:1 ISOMETRIC, and the
 * reason is arithmetic rather than taste. Under 2:1 a depth of `d` costs
 * `0.5·d` of HEIGHT, and every beat here is capped in `svh` so the section
 * stays one viewport at 1280x720 (`data-arc-tall` off): a time axis 750 units
 * wide would spend 375 units of a 360-unit crop on depth alone. Cabinet
 * foreshortens depth to 0.5 at 30 degrees, so the same depth costs a quarter
 * of it. `ISO_BASIS_2TO1` is kept, byte-equal to `mapProjection.iso()`, for a
 * compact object that can pay for it — and pinned equal in the unit test, so
 * the copy cannot drift from the original.
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

/**
 * CABINET OBLIQUE: `a` straight to the right, `b` back at 30 degrees
 * foreshortened to 0.5 (cos30/2, sin30/2), `z` straight up. A true vertical
 * for the work axis and a true horizontal for time are what let a years or
 * minutes scale stay a readable baseline on the near edge.
 */
export const ISO_BASIS_CABINET: IsoBasis = {
  A: [1, 0],
  B: [0.433, -0.25],
  Z: [0, -1],
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
 * Sort ASCENDING and draw in that order: the last thing drawn is in front.
 *
 * ⚠ UNDER CABINET ONLY `b` MOVES AN OBJECT AWAY (`a` is purely horizontal), so
 * the `a` term is a tie-break that happens to run left to right — which is
 * also the reading order. Under a true 2:1 the sum is the depth outright.
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
   * The three it hides — all meeting the FAR-BOTTOM vertex (a, b+d, z), which
   * is the one corner whose every adjoining face points away. Dashed, so the
   * box reads as a machine rather than as a flat hexagon.
   */
  hidden: string;
  /** The top face, for a wash. */
  top: string;
  /** Paint order (larger is nearer). */
  depth: number;
  /** The top face's nearest-to-the-reader top corner — where a tag hangs. */
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
  // The visible nine: the top face (4), the near and right bottom edges (2),
  // and the three verticals that are not the far-bottom one (3).
  const visible = [
    isoPath([t00, t10, t11, t01], true),
    isoPath([b00, b10]),
    isoPath([b10, b11]),
    isoPath([b00, t00]),
    isoPath([b10, t10]),
    isoPath([b11, t11]),
  ].join(" ");
  const hidden = [isoPath([b01, b11]), isoPath([b01, b00]), isoPath([b01, t01])].join(" ");
  return {
    visible,
    hidden,
    top: isoPath([t00, t10, t11, t01], true),
    depth: isoDepth(a + w / 2, b + d / 2),
    apex: t01,
    topCentre: p(a + w / 2, b + d / 2, z1),
  };
}

export interface IsoPlatePaths {
  /** The chamfered top face. */
  top: string;
  /** The slab's visible thickness: the near chain dropped, with its risers. */
  sides: string;
  /** The far-bottom edges, dashed. */
  hidden: string;
  /** The corner the label's leader leaves from — the top face's screen right. */
  right: Pt;
  depth: number;
}

/**
 * A thin plate — a layer in an exploded stack — with the corner law's cut on
 * its own top face.
 *
 * ⚠ THE LAWFUL DIAGONAL IS THE SCREEN'S, NOT THE WORLD'S (ADR-065: the
 * diagonal is TR + BL). Under this basis screen x rises with both `a` and `b`
 * while screen y falls with `b`, so the top face's screen top-right corner is
 * (a+w, b+d) and its screen bottom-left is (a, b) — the pair a reader sees on
 * the lawful diagonal. Cutting the world's (+a,-b) / (-a,+b) pair instead puts
 * the chamfers on the drawing's left and right extremes, which is the
 * unlawful diagonal wearing world coordinates.
 */
export function isoPlate(box: IsoBox, cut: number, f: IsoFrame): IsoPlatePaths {
  const { a, b, w, d, z, h } = box;
  const p = (aa: number, bb: number, zz: number) => isoProject(aa, bb, zz, f);
  const a1 = a + w;
  const b1 = b + d;
  const z1 = z + h;
  const c = Math.min(cut, w / 2, d / 2);
  // Top face, chamfered at screen-BL (a, b) and screen-TR (a+w, b+d).
  const face: Pt[] = [
    p(a + c, b, z1),
    p(a1, b, z1),
    p(a1, b1 - c, z1),
    p(a1 - c, b1, z1),
    p(a, b1, z1),
    p(a, b + c, z1),
  ];
  // The near silhouette: from the near chamfer's foot, along the near and
  // right top edges, to the far chamfer — dropped by the plate's thickness.
  const chain: Pt[] = [face[0], face[1], face[2], face[3]];
  const lower = chain.map((q) => ({ x: q.x, y: q.y + f.k * h }));
  const sides = [
    isoPath(lower),
    ...chain.map((q, i) => isoPath([q, lower[i]])),
  ].join(" ");
  const hidden = [
    isoPath([p(a, b1, z), p(a1 - c, b1, z)]),
    isoPath([p(a, b1, z), p(a, b + c, z)]),
    isoPath([p(a, b1, z), p(a, b1, z1)]),
  ].join(" ");
  return {
    top: isoPath(face, true),
    sides,
    hidden,
    right: face[2],
    depth: isoDepth(a + w / 2, b + d / 2),
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

export interface IsoStepPaths {
  /** The near crest — the staircase, and the drawing's draw-on run. */
  crest: string;
  /** The same profile at the far edge: what makes it a relief, not a line. */
  far: string;
  /** One tie per profile vertex, joining near to far. */
  ties: readonly string[];
  footVisible: string;
  footHidden: string;
  /** The crest's last point: where NOW is seated. */
  end: Pt;
}

/**
 * A stepped relief from a profile of (a, z) corners. The profile is read as a
 * staircase: horizontal to the next `a`, then vertical to its `z` — never
 * interpolated, because a doubling every seven months is a ladder and a smooth
 * curve would claim a measurement per release the record does not publish
 * (ADR-078 U1's own ruling, one drawing over).
 */
export function isoSteps(
  profile: readonly { a: number; z: number }[],
  aEnd: number,
  b: number,
  d: number,
  f: IsoFrame
): IsoStepPaths {
  const corners: { a: number; z: number }[] = [];
  profile.forEach((step, i) => {
    if (i === 0) {
      corners.push({ a: step.a, z: step.z });
      return;
    }
    corners.push({ a: step.a, z: profile[i - 1].z });
    corners.push({ a: step.a, z: step.z });
  });
  const lastZ = profile[profile.length - 1]?.z ?? 0;
  corners.push({ a: aEnd, z: lastZ });
  const near = corners.map((c) => isoProject(c.a, b, c.z, f));
  const away = corners.map((c) => isoProject(c.a, b + d, c.z, f));
  const a0 = profile[0]?.a ?? 0;
  return {
    crest: isoPath(near),
    far: isoPath(away),
    ties: corners.map((_, i) => isoPath([near[i], away[i]])),
    footVisible: [
      isoPath([isoProject(a0, b, 0, f), isoProject(aEnd, b, 0, f)]),
      isoPath([isoProject(aEnd, b, 0, f), isoProject(aEnd, b + d, 0, f)]),
    ].join(" "),
    footHidden: [
      isoPath([isoProject(a0, b + d, 0, f), isoProject(aEnd, b + d, 0, f)]),
      isoPath([isoProject(a0, b + d, 0, f), isoProject(a0, b, 0, f)]),
    ].join(" "),
    end: near[near.length - 1],
  };
}

/** A run along `a` at one depth and height. */
export function isoRail(a0: number, a1: number, b: number, z: number, f: IsoFrame): string {
  return isoPath([isoProject(a0, b, z, f), isoProject(a1, b, z, f)]);
}

/**
 * A gate the run passes through: an open frame standing in the b-z plane, with
 * dashed drops to the datum so it reads as standing on the floor rather than
 * floating over it.
 */
export function isoGate(
  a: number,
  b: number,
  z: number,
  w: number,
  h: number,
  f: IsoFrame
): { frame: string; drop: string; head: Pt } {
  const frame = isoPath(
    [
      isoProject(a, b, z, f),
      isoProject(a, b + w, z, f),
      isoProject(a, b + w, z + h, f),
      isoProject(a, b, z + h, f),
    ],
    true
  );
  const drop = [
    isoPath([isoProject(a, b, z, f), isoProject(a, b, 0, f)]),
    isoPath([isoProject(a, b + w, z, f), isoProject(a, b + w, 0, f)]),
  ].join(" ");
  return { frame, drop, head: isoProject(a, b + w / 2, z + h, f) };
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
}

/** PT Mono's advance plus the label rung's tracking (`mapProjection`'s own). */
export const ISO_MONO_ADVANCE = 0.68;

export interface LabelBox {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
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
    const x0 = l.anchor === "start" ? x : l.anchor === "middle" ? x - w / 2 : x - w;
    const y0 = l.vAlign === "top" ? y : l.vAlign === "bottom" ? y - h : y - h / 2;
    return { id: l.id, x0, y0, x1: x0 + w, y1: y0 + h };
  });
}

/** Every pair of labels whose boxes overlap. Empty is the contract. */
export function labelCollisions(boxes: readonly LabelBox[]): readonly [string, string][] {
  const out: [string, string][] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const p = boxes[i];
      const q = boxes[j];
      if (p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1) out.push([p.id, q.id]);
    }
  }
  return out;
}
