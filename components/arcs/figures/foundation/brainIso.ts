/**
 * The machine brain as a machined object (owner, 2026-10-15: "the machine
 * head STILL LOOKS FLAT … did you actually use … the anatomy skill"; "the
 * head should be aligned with the perspective of the stacked cards"; "remove
 * the googly eyes").
 *
 * Built with the anatomy kit (`isoKit.ts`) in the stack's own camera: the
 * kit at azimuth 45° and elevation 35.264° is exactly `scene.ts`'s true
 * isometric, so the brain stands in the same space as the cards it plugs
 * into. Solids, not wireframes: every part is filled and shaded in the kit's
 * four tones and painted back to front, bottom to top.
 *
 *   hemispheres  each milled from stacked contour plates (the terraces are
 *                its folds), its crown cut off to a flat deck
 *   deck         on each crown, the machine: a board on stand-offs, chip
 *                packages, the core die under a finned heatsink, traces
 *                and screws; the core is the one lit part
 *   stem         a corrugated column under the fissure
 *   block        the connector block the stem lands in
 *   manifold     under the block, seven ports: every cable leaves one
 *
 * Brain axes: L across the screen (+ right), F toward the viewer, z up.
 * World units are screen px at scale 1; the act scales the picture by the
 * beat's `Place.s` and seats its centre on `Place.x/y`.
 *
 * ⚠ PURE: strings and numbers. The act rasterises the SVG once per pose and
 * theme and paints it through its canvas, so the rings, tentacles and cords
 * keep their order round it.
 */

import { cylinder, dotsSvg, extrude, iso, lineSvg, onTop, pathOf, type Flat, type Plane, type Point3, type Projection, solidSvg, depthOf, ISO_CSS } from "./isoKit";

const UNIT = Math.sqrt(1.6);
/** Screen px per world unit at scale 1. */
const K = 1.45;
const P: Projection = { origin: [0, 0], scale: K / UNIT, azimuth: 45, elevation: 35.264 };

const R2 = Math.SQRT1_2;
/** A point in brain axes to the kit's world. The brain is squared to the
    stack's own axes (its cards run along x and y), so it is seen corner on,
    as they are: L (left to right) is −y, F (back to front) is +x. */
const W = (l: number, f: number, z: number): Point3 => [f, -l, z];
const WP = (l: number, f: number): Plane => [f, -l];
void R2;

/** The hemisphere's true numbers. */
const HEMI = { a: 104, b: 142, up: 150, down: 58, gap: 8, medial: 0.36, n: 2.4 } as const;
/** Where the crown is cut, as a share of the dome. */
const DECK_AT = 0.7;
const LC = HEMI.gap / 2 + HEMI.medial * HEMI.a;

const sgnPow = (v: number, p: number) => Math.sign(v) * Math.abs(v) ** p;

/** One hemisphere's contour at scale `s`, as brain-axis points. The lobes
    are a slow ripple on the radius whose phase drifts with height, so the
    terraces fold the way gyri do; the medial wall stays flat. */
function contour(side: -1 | 1, s: number, steps = 96, z = 0): [number, number][] {
  const out: [number, number][] = [];
  const ph = z * 0.045;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    let u = HEMI.a * sgnPow(Math.cos(t), 2 / HEMI.n);
    let v = HEMI.b * sgnPow(Math.sin(t), 2 / HEMI.n);
    const lateral = Math.max(0, Math.cos(t));
    const lobe = 1 + lateral * (0.045 * Math.sin(5 * t + ph) + 0.03 * Math.sin(9 * t - ph * 1.7)) + 0.025 * Math.sin(3 * t + 0.6);
    if (u < 0) u *= HEMI.medial;
    u *= (1 - 0.12 * (v / HEMI.b)) * lobe;
    v *= lobe;
    out.push([side * (LC + u * s), v * s]);
  }
  return side > 0 ? out : out.reverse();
}

/** The dome's scale at height z (above the equator, then below it). */
const upScale = (z: number) => Math.max(0, 1 - (z / HEMI.up) ** 2.3) ** 0.5;
const downScale = (z: number) => Math.max(0.5, Math.sqrt(Math.max(0, 1 - (z / HEMI.down) ** 2)));

interface Item {
  depth: number;
  svg: string;
}

/** A box aligned to the brain axes. */
function box(l: number, f: number, wl: number, df: number): Plane[] {
  return [WP(l - wl / 2, f - df / 2), WP(l + wl / 2, f - df / 2), WP(l + wl / 2, f + df / 2), WP(l - wl / 2, f + df / 2)];
}

const Z = {
  deck: HEMI.up * DECK_AT,
  stemTop: -HEMI.down + 14,
  blockTop: -HEMI.down - 96,
  blockBottom: -HEMI.down - 128,
  manifoldBottom: -HEMI.down - 142,
  portBottom: -HEMI.down - 156,
} as const;
const STEM_F = 6;
const PORTS = 7;
const portL = (i: number) => -54 + (108 * i) / (PORTS - 1);

/** The seven port mouths, in screen px at scale 1. */
export const BRAIN_ISO_PORTS: Flat[] = Array.from({ length: PORTS }, (_, i) => iso(W(portL(i), STEM_F + 8, Z.portBottom), P));

/** Points on the flanks, high, level and low, in screen px at scale 1. */
export function brainIsoFlank(side: -1 | 1, j: number): Flat {
  const z = [Z.deck * 0.72, Z.deck * 0.36, 0][j] ?? 0;
  const pts = contour(side, upScale(z)).map(([l, f]) => iso(W(l, f, z), P));
  return pts.reduce((a, b) => (side * b[0] > side * a[0] ? b : a));
}

/** The brain's drawn bounds at scale 1, padded. */
export const BRAIN_ISO_BOX = (() => {
  const pts: Flat[] = [];
  for (const side of [-1, 1] as const) {
    for (const [l, f] of contour(side, 1)) {
      pts.push(iso(W(l, f, 0), P), iso(W(l, f, -HEMI.down), P));
    }
    for (const [l, f] of contour(side, upScale(Z.deck))) pts.push(iso(W(l, f, Z.deck + 30), P));
  }
  pts.push(...BRAIN_ISO_PORTS.map(([x, y]) => [x, y + 6] as Flat));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 14;
  return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad };
})();

/** A deterministic jitter, so the loose half is the same picture every time. */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
}

/** The deck's machine on one crown: its parts in depth order. */
function deck(side: -1 | 1, items: Item[]) {
  const zb = Z.deck;
  const sd = upScale(zb);
  // The board on four stand-offs, inset from the crown's edge.
  const board = contour(side, sd * 0.8, 72, zb).map(([l, f]) => WP(l * 0.97 + side * 2, f));
  for (const [l, f] of [[0.55, -0.45], [0.55, 0.45], [0.95, -0.2], [0.95, 0.2]] as const) {
    const L = side * (LC + HEMI.a * sd * 0.62 * l);
    const F = HEMI.b * sd * 0.62 * f;
    const [x, y] = WP(L, F);
    items.push({ depth: depthOf([x, y, zb], P) - 0.5, svg: solidSvg(cylinder(x, y, 3, zb, 3, P, 16), { tone: "mid" }) });
  }
  items.push({ depth: -1e3 + zb, svg: solidSvg(extrude(board, zb + 3, 2.4, P, { convex: false, bevel: 0.6 }), { tone: "mid", crease: "lo" }) });
  const top = zb + 5.4;
  const at = (l: number, f: number): [number, number] => [side * (LC + HEMI.a * sd * l), HEMI.b * sd * f];
  // Chip packages, with their pins, and the core die under its heatsink.
  const chips: { l: number; f: number; w: number; d: number; h: number; core?: boolean }[] = [
    { l: 0.42, f: -0.38, w: 30, d: 34, h: 5 },
    { l: 0.78, f: -0.12, w: 22, d: 26, h: 4 },
    { l: 0.38, f: 0.32, w: 26, d: 22, h: 4 },
    { l: 0.74, f: 0.42, w: 18, d: 18, h: 3.5 },
    { l: 0.18, f: -0.02, w: 34, d: 40, h: 6, core: true },
  ];
  const traceTo = (a: [number, number], b: [number, number]) => {
    const mid: [number, number] = [a[0], b[1]];
    return lineSvg(onTop([WP(...a), WP(...mid), WP(...b)], top, P), { tone: "lo", className: "fa-gold-line" });
  };
  const core = at(0.18, -0.02);
  const traces = chips.filter((c) => !c.core).map((c) => traceTo(at(c.l, c.f), core));
  items.push({ depth: -1e3 + top, svg: traces.join("") });
  for (const c of chips) {
    const [l, f] = at(c.l, c.f);
    const ring = box(l, f, c.w, c.d);
    const [x, y] = WP(l, f);
    const d = depthOf([x, y, top], P);
    let svg = solidSvg(extrude(ring, top, c.h, P, { bevel: 0.5 }), { tone: c.core ? "hi" : "mid", lit: !!c.core, className: c.core ? "fa-gold fa-core" : "fa-gold" });
    // Pins along the two long sides, as a row of short legs on the board.
    const pins: string[] = [];
    const count = Math.max(4, Math.round(c.d / 5));
    for (let i = 0; i < count; i++) {
      const ff = f - c.d / 2 + ((i + 0.5) * c.d) / count;
      for (const sgn of [-1, 1]) {
        const l0 = l + (sgn * c.w) / 2;
        pins.push(pathOf([iso(W(l0, ff, top + 1), P), iso(W(l0 + sgn * 3.2, ff, top), P)]));
      }
    }
    svg = lineSvg(pins.join(""), { tone: "lo", className: "fa-gold-line" }) + svg;
    if (c.core) {
      // The heatsink: fins standing across the die.
      const fins = 7;
      for (let i = 0; i < fins; i++) {
        const ff = f - c.d / 2 + 4 + ((c.d - 8) * i) / (fins - 1);
        svg += solidSvg(extrude(box(l, ff, c.w - 6, 1.6), top + c.h, 11, P), { tone: "hi", crease: "lo" });
      }
    }
    items.push({ depth: d, svg });
  }
  // Screws at the board's four outer corners.
  const screws: Flat[] = [
    at(0.92, -0.5),
    at(0.92, 0.5),
    at(0.06, -0.62),
    at(0.06, 0.62),
  ].map(([l, f]) => iso(W(l, f, top), P));
  items.push({ depth: 1e3, svg: dotsSvg(screws, { size: 0.55, tone: "mid" }) });
}

/** The loose half (the middle beat): the same hemisphere as particles. */
function looseHalf(side: -1 | 1): string {
  const r = rng(11);
  const pts: [number, number, number][] = [];
  const levels = 16;
  for (let i = 0; i <= levels; i++) {
    const z = -HEMI.down + ((Z.deck + HEMI.down) * i) / levels;
    const s = z >= 0 ? upScale(z) : downScale(z);
    const ring = contour(side, s, 90);
    for (const [l, f] of ring) {
      if (r() < 0.15) continue;
      const [x, y] = iso(W(l + r() * 3, f + r() * 3, z + r() * 3), P);
      pts.push([x, y, 0.35 + 0.65 * Math.abs(r())]);
    }
  }
  return `<g class="fa-loose">${dotsSvg(pts, { size: 1.15, tone: "hi" })}</g>`;
}

/** The mask (the shoggoth beat): a machined faceplate held in the brain's
    front plane, in the same camera. Its plane is spanned by L and z at
    `MASK.f`; the plate has real thickness back toward the brain, the face's
    features are slots cut through it, rivets ring its rim, and two straps
    run back from its sides onto the hemispheres. */
const MASK = { f: 156, w: 58, rx: 76, ry: 86, thick: 8 } as const;
function maskMarkup(): string {
  const at = (u: number, w: number, df = 0) => iso(W(u, MASK.f + df, MASK.w + w), P);
  const oval = (rx: number, ry: number, n = 72, df = 0, cx = 0, cy = 0): Flat[] =>
    Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      // a face: a touch narrower at the chin
      const narrow = 1 - 0.14 * Math.max(0, -Math.sin(t));
      return at(cx + rx * narrow * sgnPow(Math.cos(t), 0.9), cy + ry * sgnPow(Math.sin(t), 0.9), df);
    });
  const front = oval(MASK.rx, MASK.ry);
  const back = oval(MASK.rx, MASK.ry, 72, -MASK.thick);
  const hull = (pts: Flat[]): Flat[] => {
    const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo: Flat[] = [];
    for (const p of q) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    const up: Flat[] = [];
    for (const p of q.reverse()) {
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
      up.push(p);
    }
    return [...lo.slice(0, -1), ...up.slice(0, -1)];
  };
  const out: string[] = [];
  // The straps first: from each side of the plate back onto the brain.
  for (const sgn of [-1, 1]) {
    const from = at(sgn * MASK.rx * 0.98, 6, -MASK.thick / 2);
    const mid = iso(W(sgn * (LC + HEMI.a * 0.7), MASK.f - 40, MASK.w + 14), P);
    const end = iso(W(sgn * (LC + HEMI.a * 0.98), MASK.f - 96, MASK.w + 18), P);
    for (const off of [-4, 4]) {
      out.push(lineSvg(`M${from[0]} ${from[1] + off}Q${mid[0]} ${mid[1] + off} ${end[0]} ${end[1] + off}`, { tone: "mid" }));
    }
    out.push(dotsSvg([end], { size: 2.2, tone: "hi" }));
  }
  // The plate: its side band (the hull of both faces), the back rim, the face.
  out.push(`<path class="fa-mask-side" d="${pathOf(hull([...front, ...back]), true)}"/>`);
  out.push(`<path class="fa-mask-face" d="${pathOf(front, true)}"/>`);
  out.push(`<path class="fa-mask-edge" d="${pathOf(front, true)}"/>`);
  // An inset groove a little inside the rim.
  out.push(lineSvg(pathOf(oval(MASK.rx - 9, MASK.ry - 9, 72, 0.4), true), { tone: "lo" }));
  // The face, cut through the plate: two closed, smiling eyes and a smile.
  const slot = (cx: number, cy: number, r: number, a0: number, a1: number, w: number) => {
    const outer: Flat[] = [];
    const inner: Flat[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = a0 + ((a1 - a0) * i) / 24;
      outer.push(at(cx + (r + w / 2) * Math.cos(t), cy + (r + w / 2) * Math.sin(t), 0.4));
      inner.push(at(cx + (r - w / 2) * Math.cos(t), cy + (r - w / 2) * Math.sin(t), 0.4));
    }
    return `<path class="fa-mask-slot" d="${pathOf([...outer, ...inner.reverse()], true)}"/>`;
  };
  out.push(slot(-28, 22, 12, Math.PI * 0.15, Math.PI * 0.85, 4.5));
  out.push(slot(28, 22, 12, Math.PI * 0.15, Math.PI * 0.85, 4.5));
  out.push(slot(0, -2, 38, Math.PI * 1.18, Math.PI * 1.82, 5.5));
  // Rivets round the rim.
  out.push(dotsSvg(Array.from({ length: 10 }, (_, i) => {
    const t = (i / 10) * Math.PI * 2 + 0.3;
    const narrow = 1 - 0.14 * Math.max(0, -Math.sin(t));
    return at((MASK.rx - 4.5) * narrow * Math.cos(t), (MASK.ry - 4.5) * Math.sin(t), 0.4);
  }), { size: 0.9, tone: "hi" }));
  return `<g class="fa-mask">${out.join("")}</g>`;
}

/** The brain at scale 1, as SVG markup (no `<svg>` wrapper). */
export function brainIsoMarkup({ split = false, mask = false }: { split?: boolean; mask?: boolean } = {}): string {
  const out: string[] = [];

  // 1. The ports, under the manifold, back row first.
  const ports = Array.from({ length: PORTS }, (_, i) => {
    const [x, y] = WP(portL(i), STEM_F + 8);
    return { d: depthOf([x, y, 0], P), svg: solidSvg(cylinder(x, y, 4, Z.portBottom, Z.manifoldBottom - Z.portBottom, P, 20, 0.4), { tone: "hi", crease: "lo" }) };
  }).sort((a, b) => a.d - b.d);
  out.push(...ports.map((p) => p.svg));
  // 2. The manifold and the block, with the block's seam and screws.
  out.push(solidSvg(extrude(box(0, STEM_F, 132, 44), Z.manifoldBottom, Z.blockBottom - Z.manifoldBottom, P, { bevel: 0.8 }), { tone: "mid", crease: "lo" }));
  const blockRing = box(0, STEM_F, 64, 40);
  out.push(solidSvg(extrude(blockRing, Z.blockBottom, Z.blockTop - Z.blockBottom, P, { bevel: 1 }), { tone: "mid", crease: "lo" }));
  out.push(
    dotsSvg(
      [
        [-24, -12],
        [24, -12],
        [-24, 24],
        [24, 24],
      ].map(([l, f]) => iso(W(l, STEM_F + f, Z.blockTop), P)),
      { size: 0.55, tone: "mid" }
    )
  );
  out.push(
    dotsSvg(
      [-58, -30, 30, 58].map((l) => iso(W(l, STEM_F + 18, Z.blockBottom), P)),
      { size: 0.5, tone: "lo" }
    )
  );
  // 3. The stem: a corrugated column, collar to collar, up into the fissure.
  const [sx, sy] = WP(0, STEM_F);
  const rings = 14;
  const span = (Z.stemTop - Z.blockTop) / rings;
  const stem: string[] = [];
  for (let i = 0; i < rings; i++) {
    const z = Z.blockTop + i * span;
    stem.push(solidSvg(cylinder(sx, sy, i % 2 ? 9 : 11, z, span, P, 28), { tone: i % 2 ? "mid" : "hi", crease: "lo" }));
  }
  // 4. The hemispheres, each whole (under the equator, the terraces, the
  //    machine on its crown): the far one, then the stem between them, then
  //    the near one, which overlaps both on screen.
  const hemisphere = (side: -1 | 1): string => {
    if (split && side > 0) return looseHalf(side);
    const h: string[] = [];
    const lower = 5;
    for (let i = 0; i < lower; i++) {
      const z0 = -HEMI.down + (HEMI.down * i) / lower;
      const s = downScale(z0 + HEMI.down / lower / 2);
      const ring = contour(side, s, 96, z0).map(([l, f]) => WP(l, f));
      h.push(solidSvg(extrude(ring, z0, HEMI.down / lower, P, { convex: false }), { tone: "mid", crease: "faint" }));
    }
    const upper = 14;
    for (let i = 0; i < upper; i++) {
      const z0 = (Z.deck * i) / upper;
      const s = upScale(z0 + Z.deck / upper);
      const ring = contour(side, s, 96, z0).map(([l, f]) => WP(l, f));
      h.push(solidSvg(extrude(ring, z0, Z.deck / upper, P, { convex: false, bevel: i === upper - 1 ? 1.2 : 0.6 }), { tone: i === upper - 1 ? "hi" : "mid", crease: "lo" }));
    }
    const items: Item[] = [];
    deck(side, items);
    h.push(...items.sort((a, b) => a.depth - b.depth).map((i) => i.svg));
    return h.join("");
  };
  const sides = ([-1, 1] as const).slice().sort((a, b) => depthOf(W(a * LC, 0, 0), P) - depthOf(W(b * LC, 0, 0), P));
  out.push(hemisphere(sides[0]), ...stem, hemisphere(sides[1]));
  if (mask) out.push(maskMarkup());
  return out.join("");
}

/** The tokens the picture is painted with, per theme: the kit's own sheet
    with the site's void, ink and gold, so the rasterised image is whole. */
export function brainIsoStyle(t: { light: boolean; ink: string; gold: string; lit: string; green: string }): string {
  const tokens = t.light
    ? `--anatomy-paper:#efe9dc;--anatomy-face:#f6f1e6;--anatomy-top:#f8f4ea;--anatomy-shade-0:#cfc7b6;--anatomy-shade-1:#d9d2c2;--anatomy-shade-2:#e2dccd;--anatomy-shade-3:#ebe6d9;--anatomy-lit-top:#f3e2b8;--anatomy-lit-shade:#e6d3a3;--anatomy-hi:#2a2214;--anatomy-mid:#6e6658;--anatomy-lo:#a39b8a;--anatomy-faint:#cbc3b2;--anatomy-lit:${t.gold};--anatomy-dot:#2a2214;--anatomy-halo:#8a8070;--anatomy-halo-opacity:.3;`
    : `--anatomy-paper:#0d0c0a;--anatomy-face:#1d1a15;--anatomy-top:#2b261d;--anatomy-shade-0:#0e0d0a;--anatomy-shade-1:#17140f;--anatomy-shade-2:#221e17;--anatomy-shade-3:#302a20;--anatomy-lit-top:#4a3c1c;--anatomy-lit-shade:#382d15;--anatomy-hi:${t.ink};--anatomy-mid:#8a8274;--anatomy-lo:#575146;--anatomy-faint:#34302a;--anatomy-lit:${t.lit};--anatomy-dot:${t.ink};--anatomy-halo:#000;--anatomy-halo-opacity:.8;`;
  const gold = t.light
    ? `.fa-gold>.iso-top{fill:#e4cf98}.fa-gold>.iso-shade{fill:#cdb47a}`
    : `.fa-gold>.iso-top{fill:#3d3218}.fa-gold>.iso-shade{fill:#2b2311}`;
  return `${ISO_CSS}.iso{${tokens}}${gold}.fa-gold>.iso-edge{stroke:${t.gold}}.fa-gold-line{stroke:${t.gold}!important;opacity:.85}.fa-core>.iso-top{fill:${t.light ? "#d9b65c" : "#6a5424"}}.fa-loose .iso-dots circle{fill:${t.green};opacity:1}.fa-mask-side{fill:${t.light ? "#d6c79f" : "#2a2312"};stroke:${t.gold};stroke-width:.6;stroke-opacity:.6}.fa-mask-face{fill:${t.light ? "#f3ead2" : "#1c180f"}}.fa-mask-edge{fill:none;stroke:${t.gold};stroke-width:1.4}.fa-mask-slot{fill:${t.light ? "#2a2214" : "#050504"};stroke:${t.lit};stroke-width:.8}`;
}

/** A whole standalone SVG document of the brain, for rasterising. */
export function brainIsoSvg(opts: { split?: boolean; mask?: boolean; light: boolean; ink: string; gold: string; lit: string; green: string }): string {
  const B = BRAIN_ISO_BOX;
  const w = B.x1 - B.x0;
  const h = B.y1 - B.y0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${B.x0} ${B.y0} ${w} ${h}" width="${w}" height="${h}"><style>${brainIsoStyle(opts)}</style><g class="iso iso-svg">${brainIsoMarkup(opts)}</g></svg>`;
}
