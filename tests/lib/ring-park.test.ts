import { describe, expect, it } from "vitest";

import {
  RING_ARRIVAL_FRAC,
  RING_COUNT,
  RING_EXIT_START,
  activeServiceForProgress,
  ringIndexForProgress,
  ringParkProgress,
} from "@/lib/services-ring/ringMath";

/**
 * A park is a progress at which the ring has ARRIVED — the index is an
 * integer, not a value `activeServiceForProgress` happens to round to. The
 * card-face lab's own park math never satisfied this (2026-09-19), and every
 * still it shot was a card still turning.
 */
describe("ringParkProgress", () => {
  it("parks every card front AND settled, inside the reading beats", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const p = ringParkProgress(i);
      expect(p).toBeGreaterThanOrEqual(RING_ARRIVAL_FRAC);
      expect(p).toBeLessThan(RING_EXIT_START);
      expect(ringIndexForProgress(p)).toBe(i);
      expect(activeServiceForProgress(p)).toBe(i);
    }
  });

  it("is monotonic in the index and clamps outside the ring", () => {
    for (let i = 1; i < RING_COUNT; i++) {
      expect(ringParkProgress(i)).toBeGreaterThan(ringParkProgress(i - 1));
    }
    expect(ringParkProgress(-3)).toBe(ringParkProgress(0));
    expect(ringParkProgress(99)).toBe(ringParkProgress(RING_COUNT - 1));
  });

  it("holds through a nudge either side — the dwell has width", () => {
    for (let i = 1; i < RING_COUNT; i++) {
      const p = ringParkProgress(i);
      expect(ringIndexForProgress(p - 0.006)).toBe(i);
      expect(ringIndexForProgress(p + 0.006)).toBe(i);
    }
  });
});
