import { finiteNumber } from "@/lib/api/numbers";

/**
 * lib/survey/cropRect — percent bounds to a pixel rect inside an image, or
 * nothing. Pure; the crop route is the only caller and `sharp.extract` takes
 * the result as is.
 *
 * ⚠ WHY IT IS A FUNCTION AND NOT FOUR LINES IN THE ROUTE. The route's own
 * clamp let a `NaN` through — `NaN < 1` is false — and `sharp` threw a 500
 * for what was a bad request; and the bounds it clamped came from two places
 * (the body, or the stored annotation, which `PATCH /api/survey/items` writes
 * unchecked), so the same sieve has to sit in front of both.
 *
 * The rules: every field a finite NUMBER; `x`/`y` inside the image (0–100);
 * `width`/`height` positive. The right and bottom edges are pinned to the
 * image independently of the left and top, so a box that runs past the edge
 * is SHRUNK to it rather than kept whole and shifted. Under a pixel → `null`.
 */
export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export function cropRect(bounds: unknown, image: ImageSize): CropRect | null {
  if (typeof bounds !== "object" || bounds === null) return null;
  const b = bounds as Record<string, unknown>;
  const x = finiteNumber(b.x);
  const y = finiteNumber(b.y);
  const w = finiteNumber(b.width);
  const h = finiteNumber(b.height);
  if (x === null || y === null || w === null || h === null) return null;
  if (x < 0 || x > 100 || y < 0 || y > 100 || w <= 0 || h <= 0) return null;
  if (!(image.width >= 1) || !(image.height >= 1)) return null;

  const px = (pct: number, span: number) => Math.round((pct / 100) * span);
  const left = Math.min(px(x, image.width), image.width - 1);
  const top = Math.min(px(y, image.height), image.height - 1);
  const right = Math.min(px(x + w, image.width), image.width);
  const bottom = Math.min(px(y + h, image.height), image.height);
  const width = right - left;
  const height = bottom - top;
  if (width < 1 || height < 1) return null;
  return { left, top, width, height };
}
