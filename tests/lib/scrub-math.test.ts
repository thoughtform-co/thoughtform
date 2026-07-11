import { describe, expect, it } from "vitest";

import {
  coverRect,
  frameUrl,
  nearestLoaded,
  preloadOrder,
  progressToFrame,
} from "@/lib/gateway-motion/scrub-math";

/**
 * Pure math for the scroll-scrub sequence player (Gateway Motion Lab).
 * Pins the contract the canvas component relies on: monotonic frame
 * mapping with clamped ends, cover-fit geometry, and a preload order
 * that keeps the nearest loaded frame close at every scroll position.
 */

describe("progressToFrame", () => {
  it("clamps progress into the frame range", () => {
    expect(progressToFrame(-0.5, 100)).toBe(0);
    expect(progressToFrame(0, 100)).toBe(0);
    expect(progressToFrame(1, 100)).toBe(99);
    expect(progressToFrame(1.5, 100)).toBe(99);
  });

  it("is monotonic and hits every frame across [0,1]", () => {
    const count = 24;
    let prev = -1;
    const hit = new Set<number>();
    for (let i = 0; i <= 1000; i++) {
      const f = progressToFrame(i / 1000, count);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
      hit.add(f);
    }
    expect(hit.size).toBe(count);
  });

  it("handles degenerate frame counts", () => {
    expect(progressToFrame(0.5, 0)).toBe(0);
    expect(progressToFrame(0.5, 1)).toBe(0);
  });
});

describe("frameUrl", () => {
  it("substitutes 1-based zero-padded indices", () => {
    const pattern = "/gateway-motion/gateway-v1/frames/f_{index4}.webp";
    expect(frameUrl(pattern, 0)).toBe("/gateway-motion/gateway-v1/frames/f_0001.webp");
    expect(frameUrl(pattern, 191)).toBe("/gateway-motion/gateway-v1/frames/f_0192.webp");
  });
});

describe("coverRect", () => {
  it("crops horizontally when the destination is taller than the source aspect", () => {
    // 16:9 source into a square: height fits, width overflows.
    const r = coverRect(1600, 900, 900, 900);
    expect(r.dh).toBeCloseTo(900);
    expect(r.dw).toBeCloseTo(1600);
    expect(r.dx).toBeCloseTo((900 - 1600) / 2);
    expect(r.dy).toBeCloseTo(0);
  });

  it("covers exactly when aspects match", () => {
    const r = coverRect(1280, 720, 640, 360);
    expect(r).toEqual({ dx: 0, dy: 0, dw: 640, dh: 360 });
  });

  it("survives degenerate dimensions", () => {
    expect(coverRect(0, 0, 800, 600)).toEqual({ dx: 0, dy: 0, dw: 800, dh: 600 });
  });
});

describe("preloadOrder", () => {
  it("starts with the endpoints and covers every frame exactly once", () => {
    const order = preloadOrder(192);
    expect(order[0]).toBe(0);
    expect(order[1]).toBe(191);
    expect(new Set(order).size).toBe(192);
    expect(order).toHaveLength(192);
  });

  it("keeps worst-case distance to a loaded frame halving as it progresses", () => {
    const count = 128;
    const order = preloadOrder(count);
    const loaded = new Set<number>(order.slice(0, 9)); // endpoints + first 7 midpoints
    let worst = 0;
    for (let f = 0; f < count; f++) {
      const nearest = nearestLoaded(f, loaded);
      expect(nearest).not.toBeNull();
      worst = Math.max(worst, Math.abs(f - (nearest as number)));
    }
    // 9 loaded frames over 128 → gaps of ~16, so nearest is within ~8-9.
    expect(worst).toBeLessThanOrEqual(Math.ceil(count / 8));
  });

  it("handles tiny sequences", () => {
    expect(preloadOrder(0)).toEqual([]);
    expect(preloadOrder(1)).toEqual([0]);
    expect(preloadOrder(2)).toEqual([0, 1]);
    expect(preloadOrder(3)).toEqual([0, 2, 1]);
  });
});

describe("nearestLoaded", () => {
  it("returns the target itself when loaded", () => {
    expect(nearestLoaded(5, new Set([1, 5, 9]))).toBe(5);
  });
  it("returns the closest loaded frame otherwise", () => {
    expect(nearestLoaded(6, new Set([0, 10]))).toBe(10);
    expect(nearestLoaded(4, new Set([0, 10]))).toBe(0);
  });
  it("returns null for an empty set", () => {
    expect(nearestLoaded(3, new Set())).toBeNull();
  });
});
