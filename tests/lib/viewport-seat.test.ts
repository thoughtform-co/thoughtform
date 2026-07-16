import { describe, expect, it } from "vitest";

import { seatNdcFromRect, seatWorldHeight } from "@/lib/services-ring/viewportSeat";

const FALLBACK: readonly [number, number] = [0.5, -0.5];

describe("seatNdcFromRect", () => {
  it("maps viewport corners and centre", () => {
    expect(seatNdcFromRect(960, 540, 1920, 1080, FALLBACK)).toEqual([0, -0]);
    const [x, y] = seatNdcFromRect(1920, 1080, 1920, 1080, FALLBACK);
    expect(x).toBe(1);
    expect(y).toBe(-1);
  });

  it("returns the caller's fallback when the viewport is unmeasurable", () => {
    expect(seatNdcFromRect(10, 10, 0, 0, FALLBACK)).toBe(FALLBACK);
    expect(seatNdcFromRect(10, 10, -5, 100, FALLBACK)).toBe(FALLBACK);
  });
});

describe("seatWorldHeight", () => {
  it("round-trips a projected slot height", () => {
    const halfFovTan = Math.tan((40 * Math.PI) / 360);
    const d = 3.2;
    const vh = 1080;
    const slotH = 437;
    const world = seatWorldHeight(slotH, vh, d, halfFovTan);
    // Reproject: world height at depth d covers world / (2·d·tan(fov/2))
    // of the viewport.
    const reprojected = (world / (2 * d * halfFovTan)) * vh;
    expect(reprojected).toBeCloseTo(slotH, 9);
    expect(seatWorldHeight(slotH, 0, d, halfFovTan)).toBe(0);
  });
});
