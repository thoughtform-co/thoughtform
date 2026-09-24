import { describe, expect, it } from "vitest";

import { cropRect } from "@/lib/survey/cropRect";

/**
 * Percent bounds → a pixel rect inside the image, or null (2026-09-24 review):
 * the crop route's inline clamp let a `NaN` through its `< 1` guard into
 * `sharp`, which threw a 500 for a bad request.
 */
const IMG = { width: 1000, height: 500 };

describe("cropRect", () => {
  it("round-trips a normal box", () => {
    expect(cropRect({ x: 10, y: 20, width: 30, height: 40 }, IMG)).toEqual({
      left: 100,
      top: 100,
      width: 300,
      height: 200,
    });
  });

  it("refuses anything that is not four finite numbers", () => {
    expect(cropRect({ x: "10", y: null, width: 20, height: 20 }, IMG)).toBeNull();
    expect(cropRect({ x: Number.NaN, y: 0, width: 20, height: 20 }, IMG)).toBeNull();
    expect(cropRect({ x: 0, y: 0, width: 20 }, IMG)).toBeNull();
    expect(cropRect(null, IMG)).toBeNull();
    expect(cropRect("10,10,20,20", IMG)).toBeNull();
    expect(cropRect(undefined, IMG)).toBeNull();
  });

  it("refuses an origin outside the image and a non-positive size", () => {
    expect(cropRect({ x: -50, y: 0, width: 60, height: 60 }, IMG)).toBeNull();
    expect(cropRect({ x: 0, y: 101, width: 10, height: 10 }, IMG)).toBeNull();
    expect(cropRect({ x: 0, y: 0, width: 0, height: 10 }, IMG)).toBeNull();
    expect(cropRect({ x: 0, y: 0, width: 10, height: -1 }, IMG)).toBeNull();
  });

  it("SHRINKS a box that runs past the edge instead of shifting it", () => {
    // 80 % + 60 % wide: the right edge is pinned to the image, the left stays.
    expect(cropRect({ x: 80, y: 90, width: 60, height: 60 }, IMG)).toEqual({
      left: 800,
      top: 450,
      width: 200,
      height: 50,
    });
  });

  it("returns null under a pixel, and for an image with no size", () => {
    expect(cropRect({ x: 50, y: 50, width: 0.01, height: 0.01 }, IMG)).toBeNull();
    expect(cropRect({ x: 0, y: 0, width: 50, height: 50 }, { width: 0, height: 0 })).toBeNull();
    expect(
      cropRect({ x: 0, y: 0, width: 50, height: 50 }, { width: Number.NaN, height: 10 })
    ).toBeNull();
  });
});
