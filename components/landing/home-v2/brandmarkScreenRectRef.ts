/**
 * brandmarkScreenRectRef — shared mutable ref carrying the DOM SVG
 * brandmark's CURRENT screen-space rect, in CSS pixels.
 *
 * Writer: `ProjectedBrandmarkActor` writes its computed rect every paint
 * frame (the corridor tracker callback already computes left/top/width/
 * height, so it's a free write).
 *
 * Reader: `BrandmarkPhysicsCoreActor` reads this at the matched-pixel
 * swap frame to rasterise the SVG into world positions that reproject
 * back to exactly these pixels. The two actors run in the same R3F /
 * DOM frame loop (one tracker-driven, one R3F useFrame), so the write
 * happens just before the read in normal forward scroll.
 *
 * Kept as a vanilla module ref (not Zustand) because it's mutated every
 * frame and never needs to trigger a React re-render — there are no
 * subscribers, only one polling reader. ADR-023 2026-06-25 hybrid.
 */

export interface BrandmarkScreenRect {
  /** Most recent left / top / width / height in CSS pixels. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Frame timestamp (performance.now milliseconds) at the write. The
   *  reader can guard against stale rects — if the writer hasn't ticked
   *  in the last N ms, the rasterise should be deferred until it does. */
  stampedAt: number;
  /** True once the writer has ticked at least once with a non-zero rect. */
  valid: boolean;
}

export const brandmarkScreenRectRef: { current: BrandmarkScreenRect } = {
  current: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    stampedAt: 0,
    valid: false,
  },
};

export function writeBrandmarkScreenRect(
  left: number,
  top: number,
  width: number,
  height: number,
  now: number
): void {
  const r = brandmarkScreenRectRef.current;
  r.left = left;
  r.top = top;
  r.width = width;
  r.height = height;
  r.stampedAt = now;
  r.valid = width > 1 && height > 1;
}
