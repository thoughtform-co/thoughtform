/**
 * Isometric projection, pure. World axes: +x runs down-right on screen, +y
 * runs down-left, +z is up. One unit of world is one unit of SVG at scale 1.
 */

export const COS30 = Math.cos(Math.PI / 6);
export const SIN30 = 0.5;

export type Vec3 = readonly [number, number, number];
export type Pt = readonly [number, number];

export interface IsoFrame {
  /** Screen position of world (0,0,0). */
  ox: number;
  oy: number;
  /** Uniform scale. */
  k?: number;
}

export function iso(f: IsoFrame, [x, y, z]: Vec3): Pt {
  const k = f.k ?? 1;
  return [f.ox + (x - y) * COS30 * k, f.oy + ((x + y) * SIN30 - z) * k];
}

/** An SVG path through world points, closed when asked. */
export function path(f: IsoFrame, pts: readonly Vec3[], close = true): string {
  const d = pts.map((p, i) => {
    const [sx, sy] = iso(f, p);
    return `${i === 0 ? "M" : "L"}${round(sx)} ${round(sy)}`;
  });
  return d.join(" ") + (close ? " Z" : "");
}

/** A straight segment between two world points. */
export function seg(f: IsoFrame, a: Vec3, b: Vec3): string {
  const [ax, ay] = iso(f, a);
  const [bx, by] = iso(f, b);
  return `M${round(ax)} ${round(ay)} L${round(bx)} ${round(by)}`;
}

/** The floor diamond of an axis-aligned rectangle at height z. */
export function rect(f: IsoFrame, x: number, y: number, w: number, d: number, z = 0): string {
  return path(f, [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ]);
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}
