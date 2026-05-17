"use client";

/**
 * BrandmarkRingGlyph — the canonical brandmark rendered as the
 * outer C-arc only (no cross, no horizontal bar, no flourishes).
 *
 * This is the second of two SVG topologies the brandmark can paint:
 *
 *   - `BrandmarkGlyph`         → BRANDMARK_FULL_PATHS (the canonical mark)
 *   - `BrandmarkRingGlyph`     → BRANDMARK_RING_PATHS (the outer arc only)
 *
 * Both render from the same canonical path table in
 * `lib/brandmark/shapes.ts`. The `BrandmarkVectorActor` stacks the two
 * absolutely and crossfades them via the journey transform's
 * `shapeBlend` channel — at the substrate keyframe the full mark
 * dissolves into the bare ring, and the ring acts as the centre
 * orbital body of the intelligence-layer triad.
 *
 * Why a separate glyph instead of a `<g opacity>` toggle on the
 * full glyph: the two shapes use distinct path subsets and the
 * crossfade is cleanest as two parallel SVG trees. Both inherit
 * `--gold` via `fill="var(--gold, #caa554)"`, and parents can
 * override fill via CSS for tier modulation.
 */

import { BRANDMARK_RING_PATHS } from "@/lib/brandmark/shapes";
import { BRANDMARK_VIEWBOX } from "@/components/landing/v7/BrandmarkGlyph";

export interface BrandmarkRingGlyphProps {
  className?: string;
  ariaLabel?: string;
  decorative?: boolean;
}

export function BrandmarkRingGlyph({
  className,
  ariaLabel,
  decorative = true,
}: BrandmarkRingGlyphProps) {
  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : ariaLabel
      ? { role: "img", "aria-label": ariaLabel }
      : { "aria-hidden": true as const };

  return (
    <svg
      className={className}
      viewBox={BRANDMARK_VIEWBOX}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      {...ariaProps}
    >
      <g>
        {BRANDMARK_RING_PATHS.map((d, i) => (
          <path key={i} d={d} fill="var(--gold, #caa554)" />
        ))}
      </g>
    </svg>
  );
}
