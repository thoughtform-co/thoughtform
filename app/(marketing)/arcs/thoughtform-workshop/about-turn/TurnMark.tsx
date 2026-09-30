"use client";

import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { TENSOR_GOLD } from "@/lib/home-v2/goldPalette";

/**
 * TurnMark — the brandmark on the back of the About portrait (ADR-137 U2).
 *
 * THE SAME COMPONENT, FILL AND STRUCTURE AS THE LIVE MARK
 * (`ProjectedBrandmarkActor`): a shell that carries the perspective and the
 * gold glow (the slot this renders into — the writer poses it), and an inner
 * layer that carries the Y tilt, with `BrandmarkGlyph` at 100 % inside it.
 * The turn lands this on the live mark's rect and tilt and hands over on that
 * frame, so the two must be the same drawing, not two drawings that look
 * alike.
 *
 * Rendered into `[data-tw-turn-mark]` by its own nested root — never a child
 * of `LandingPage`, whose re-render would orphan it.
 */
export default function TurnMark() {
  return (
    <div className="tw-turn-mark__inner">
      <BrandmarkGlyph outline={false} decorative fill={TENSOR_GOLD} />
    </div>
  );
}
