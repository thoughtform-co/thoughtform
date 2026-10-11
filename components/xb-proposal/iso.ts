/* One isometric projection for every drawing in the proposal, so the flat
   glyphs, the boards and the layer all sit in the same space.

   +x runs down-right, +y runs down-left, +z runs up. One unit is `u` px. */

export const C30 = Math.cos(Math.PI / 6);

export type Pt = readonly [number, number];

export interface Iso {
  u: number;
  p: (x: number, y: number, z: number) => Pt;
  /** SVG matrix that lays a flat drawing (1 drawing px = `k` units) on the
      horizontal plane at height z, its origin at (x, y). */
  plane: (x: number, y: number, z: number, k: number) => string;
}

export function makeIso(u: number, ox: number, oy: number): Iso {
  const p = (x: number, y: number, z: number): Pt => [
    ox + (x - y) * C30 * u,
    oy + (x + y) * 0.5 * u - z * u,
  ];
  const plane = (x: number, y: number, z: number, k: number) => {
    const [e, f] = p(x, y, z);
    const a = C30 * u * k;
    const b = 0.5 * u * k;
    return `matrix(${a} ${b} ${-a} ${b} ${e} ${f})`;
  };
  return { u, p, plane };
}

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

const pts = (list: Pt[]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

/** The three faces a viewer above and in front sees, back to front. */
export function boxFaces(iso: Iso, b: Box) {
  const { p } = iso;
  return {
    top: pts([p(b.x0, b.y0, b.z1), p(b.x1, b.y0, b.z1), p(b.x1, b.y1, b.z1), p(b.x0, b.y1, b.z1)]),
    left: pts([p(b.x0, b.y1, b.z1), p(b.x1, b.y1, b.z1), p(b.x1, b.y1, b.z0), p(b.x0, b.y1, b.z0)]),
    right: pts([
      p(b.x1, b.y0, b.z1),
      p(b.x1, b.y1, b.z1),
      p(b.x1, b.y1, b.z0),
      p(b.x1, b.y0, b.z0),
    ]),
    /** The full silhouette, for a ghost outline. */
    outline: pts([
      p(b.x0, b.y0, b.z1),
      p(b.x1, b.y0, b.z1),
      p(b.x1, b.y0, b.z0),
      p(b.x1, b.y1, b.z0),
      p(b.x0, b.y1, b.z0),
      p(b.x0, b.y1, b.z1),
    ]),
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const ease = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** Mix a hex colour over the ground, so a face can be opaque and still read
    as a tint (an opaque face is what hides the lines behind it). */
export function over(hex: string, alpha: number, ground = "#0a0908") {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(n(hex, i) * alpha + n(ground, i) * (1 - alpha)));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
