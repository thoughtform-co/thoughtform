import type { IsoFrame } from "./iso";

/**
 * Fit a drawing whose GEOMETRY scales but whose TYPE does not. Each item's
 * screen box is [ox + k·ax + x0, ox + k·ax + x1] × [oy + k·ay + y0, oy + k·ay + y1]:
 * `ax/ay` is a projected anchor at k = 1, the offsets are fixed pixels (a
 * label's run, a chip's half-size). The largest k whose union fits the box
 * wins, and the union is centred.
 */
export interface FitItem {
  ax: number;
  ay: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

function span(items: readonly FitItem[], k: number) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const it of items) {
    minX = Math.min(minX, k * it.ax + it.x0);
    maxX = Math.max(maxX, k * it.ax + it.x1);
    minY = Math.min(minY, k * it.ay + it.y0);
    maxY = Math.max(maxY, k * it.ay + it.y1);
  }
  return { minX, maxX, minY, maxY };
}

export function fitItems(
  items: readonly FitItem[],
  w: number,
  h: number,
  { pad = 0, kMax = 1.5, biasY = 0.5 }: { pad?: number; kMax?: number; biasY?: number } = {}
): IsoFrame {
  const W = w - pad * 2;
  const Hh = h - pad * 2;
  let lo = 0.05,
    hi = kMax;
  for (let i = 0; i < 40; i++) {
    const k = (lo + hi) / 2;
    const s = span(items, k);
    if (s.maxX - s.minX <= W && s.maxY - s.minY <= Hh) lo = k;
    else hi = k;
  }
  const k = lo;
  const s = span(items, k);
  const ox = pad + (W - (s.maxX - s.minX)) / 2 - s.minX;
  const oy = pad + (Hh - (s.maxY - s.minY)) * biasY - s.minY;
  return { ox, oy, k };
}
