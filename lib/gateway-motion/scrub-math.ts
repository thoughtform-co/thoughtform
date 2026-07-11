// Gateway Motion — pure math for the scroll-scrub sequence player.
// Kept free of DOM/canvas so it stays unit-testable (tests/lib/scrub-math.test.ts).

/** Map scroll progress [0,1] to a frame index [0, frameCount-1]. */
export function progressToFrame(progress: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(frameCount - 1, Math.floor(p * frameCount));
}

/** Frame URL from a SequenceMeta urlPattern ("{index4}" → zero-padded 1-based). */
export function frameUrl(urlPattern: string, index: number): string {
  return urlPattern.replace("{index4}", String(index + 1).padStart(4, "0"));
}

export interface CoverRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * object-fit: cover geometry — destination rect for drawing a srcW×srcH
 * image into a dstW×dstH canvas, centered, cropping the overflow axis.
 */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number): CoverRect {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) {
    return { dx: 0, dy: 0, dw: dstW, dh: dstH };
  }
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh };
}

/**
 * Preload order for N frames: first + last + center-out sweep, so a
 * partially loaded sequence scrubs coherently at any scroll position
 * (nearest loaded frame is never far away).
 */
export function preloadOrder(frameCount: number): number[] {
  if (frameCount <= 0) return [];
  if (frameCount === 1) return [0];
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (i >= 0 && i < frameCount && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  push(frameCount - 1);
  // Breadth-first bisection: midpoints of ever-smaller intervals.
  let intervals: Array<[number, number]> = [[0, frameCount - 1]];
  while (intervals.length) {
    const next: Array<[number, number]> = [];
    for (const [a, b] of intervals) {
      if (b - a < 2) continue;
      const mid = (a + b) >> 1;
      push(mid);
      next.push([a, mid], [mid, b]);
    }
    intervals = next;
  }
  return order;
}

/** Nearest loaded frame to `target` (for drawing while preloading). */
export function nearestLoaded(target: number, loaded: ReadonlySet<number>): number | null {
  if (loaded.has(target)) return target;
  if (!loaded.size) return null;
  let best: number | null = null;
  let bestDist = Infinity;
  for (const i of loaded) {
    const d = Math.abs(i - target);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
