// Pins for the Arc Cases Card placement geometry (ADR-036). The card is a
// portrait tools-card slab mounted between the two Build-park stack columns
// in shared shell-local space; these pin the load-bearing invariants the
// R3F card + the ShellStack fold lean on — exact/symmetric slab edges, the
// "fits clearly inside the columns" property across the aspect clamp
// extremes, the portrait aspect, the lane-spread height clamp, and the
// in-front-of-the-sphere Z.

import { describe, expect, it } from "vitest";
import { CARD_CENTER_X, CARD_MAX_HALF_HEIGHT, getCardGeometry } from "@/lib/arc-cases/cardLayout";
import { RING_CARD_ASPECT, RING_SLAB_BEZEL } from "@/lib/services-ring/ringMath";

// The two extremes `getStackColumnLocalX` clamps to (sceneGeom
// STACK_COLUMN_X_CAP 1.92, floor 1.4) — the card must fit inside the
// columns at BOTH.
const COL_X_EXTREMES = [1.4, 1.92] as const;

describe("getCardGeometry — fits within the node columns", () => {
  it("keeps the slab side walls clearly inside the pip columns at both clamp extremes", () => {
    for (const colX of COL_X_EXTREMES) {
      const g = getCardGeometry(colX);
      // The slab half-width (edge to centre) must be strictly less than the
      // column half-span, so there is a visible run for the folded streams.
      expect(g.slabWidth / 2).toBeLessThan(colX);
      // Comfortably inside, not just barely (the "less wide, compact" read).
      expect(g.slabWidth / 2).toBeLessThan(colX * 0.75);
    }
  });

  it("lands the slab edges exactly and symmetrically about the centre", () => {
    const g = getCardGeometry(1.6);
    expect(g.leftEdgeX).toBeCloseTo(CARD_CENTER_X - g.slabWidth / 2, 12);
    expect(g.rightEdgeX).toBeCloseTo(CARD_CENTER_X + g.slabWidth / 2, 12);
    expect(g.leftEdgeX + g.rightEdgeX).toBeCloseTo(2 * CARD_CENTER_X, 12);
    // Slab = content + a bezel each side.
    expect(g.slabWidth).toBeCloseTo(g.contentWidth + RING_SLAB_BEZEL * 2, 12);
    expect(g.slabHeight).toBeCloseTo(g.contentHeight + RING_SLAB_BEZEL * 2, 12);
  });
});

describe("getCardGeometry — portrait, contained, in front of the sphere", () => {
  it("keeps the portrait aspect (width / height === RING_CARD_ASPECT)", () => {
    for (const colX of [1.4, 1.6, 1.92]) {
      const g = getCardGeometry(colX);
      expect(g.contentWidth / g.contentHeight).toBeCloseTo(RING_CARD_ASPECT, 6);
      expect(g.contentHeight).toBeGreaterThan(g.contentWidth); // portrait
    }
  });

  it("clamps the height within the lane spread so the card never towers over the sphere", () => {
    for (const colX of [1.4, 1.6, 1.92]) {
      const g = getCardGeometry(colX);
      expect(g.halfHeight).toBeLessThanOrEqual(CARD_MAX_HALF_HEIGHT + 1e-9);
    }
    // The dotted-shell + surface fan reach ~1.05 shell-local — the clamp
    // must sit at or below that so both fans clear the card top/bottom.
    expect(CARD_MAX_HALF_HEIGHT).toBeLessThanOrEqual(1.05);
  });

  it("floats the card face in FRONT of the sphere shell (~0.95 local) and clear of the gimbal", () => {
    const g = getCardGeometry(1.6);
    expect(g.z).toBeGreaterThan(1.05);
  });

  it("is stable across the desktop clamp band (height clamp dominates → fixed card)", () => {
    const a = getCardGeometry(1.4);
    const b = getCardGeometry(1.92);
    expect(a.contentWidth).toBeCloseTo(b.contentWidth, 9);
    expect(a.contentHeight).toBeCloseTo(b.contentHeight, 9);
  });
});
