"use client";

/**
 * BrandmarkGlyph — single canonical pure-code source for the Thoughtform
 * brandmark on the v7 landing page.
 *
 * Renders the brandmark as inline SVG (filled gold paths + optional
 * outline overlay), with no `<img>` and no raster asset reference. All
 * landing-page dock sites — five portal docks (`.sigil__mark`,
 * `.miss__brand-slot`, `.ilayer__brandmark-anchor`, `.crail__brand`,
 * `.approach__orbit__mark`) plus the fixed `.tf-brandmark-actor` —
 * consume this same primitive so the brandmark everywhere on the
 * page is the same vector geometry from the same code source — no
 * parallel raster copies, no asset drift between sections.
 *
 * Geometry is exported from `public/logos/Thoughtform_Brandmark.svg`
 * (viewBox 0 0 430.99 436); the outline overlay is loaded from
 * `Thoughtform_Brandmark_Outline.svg` because it is a dawn-toned glyph
 * pre-baked at 0.33 opacity that we crossfade in for the Practice /
 * Quote states. Both files live in `public/logos/`.
 *
 * Why a component (not just an `<img>`):
 *   1. **One artifact:** every dock on the page renders the same React
 *      component, so changes to the geometry / fill / outline propagate
 *      everywhere at once.
 *   2. **Theme tokens:** the filled paths inherit from `--gold` via
 *      `fill="var(--gold, #caa554)"`. Anywhere the brandmark renders, a
 *      parent CSS variable change shifts the brand colour with it
 *      (used during practice / cover states).
 *   3. **No paint cost from a raster:** `<img>` decoding takes a
 *      paint pass on first visibility; the inline SVG paints on the
 *      same pass as everything else.
 *
 * Required-permissions: this component renders **only** vector
 * primitives. It does not fetch any network resource at runtime beyond
 * the static outline SVG which is bundled with the site.
 */

import { BRANDMARK_FULL_PATHS } from "@/lib/brandmark/shapes";

/** Path geometry for the canonical brandmark. Re-exported from
 *  `lib/brandmark/shapes.ts` so the inline SVG render path and the
 *  particle painter share one source of truth (ADR-014). The legacy
 *  name `BRANDMARK_FILLED_PATHS` is kept for backwards compatibility
 *  with existing dock consumers and skill references. */
export const BRANDMARK_FILLED_PATHS = BRANDMARK_FULL_PATHS;

export const BRANDMARK_VIEWBOX = "0 0 430.99 436";
export const BRANDMARK_OUTLINE_SRC = "/logos/Thoughtform_Brandmark_Outline.svg";

export type BrandmarkGlyphProps = {
  /** Optional className on the root `<svg>`. Defaults to none, so the
   *  caller controls layout (size, position, clipping). */
  className?: string;
  /** Whether to overlay the dawn-toned outline glyph. Defaults to
   *  `true`. Consumers that crossfade between filled and outline (the
   *  fixed actor) include the outline; consumers that always paint
   *  filled-only (the source-owned dock copies) can omit it to save
   *  one network request and a paint pass. */
  outline?: boolean;
  /** Optional `aria-label` for assistive tech. Defaults to empty
   *  (decorative). The page already names the brand in the wordmark
   *  lockup; the brandmark glyph itself is rarely a primary
   *  identifier. */
  ariaLabel?: string;
  /** Whether to mark the SVG as decorative (`aria-hidden="true"`).
   *  Defaults to `true` because most v7 instances are scroll-driven
   *  ornaments. Pass `false` only when this is the primary
   *  identifying glyph (e.g. in a logo lockup). */
  decorative?: boolean;
  /** Optional class applied to the filled `<g>` so a parent can
   *  crossfade it independently of the outline (used by the fixed
   *  travel actor for the practice / cover outline morph). */
  filledClassName?: string;
  /** Optional class applied to the outline `<image>` so a parent can
   *  crossfade it independently of the filled paths. */
  outlineClassName?: string;
};

/** Inline SVG brandmark. Paints `--gold` for the filled paths and
 *  loads the dawn-toned outline file as a child `<image>` so consumers
 *  can crossfade the two via parent CSS without re-fetching either
 *  asset. */
export function BrandmarkGlyph({
  className,
  outline = true,
  ariaLabel,
  decorative = true,
  filledClassName,
  outlineClassName,
}: BrandmarkGlyphProps) {
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
      <g className={filledClassName}>
        {BRANDMARK_FILLED_PATHS.map((d, i) => (
          <path key={i} d={d} fill="var(--gold, #caa554)" />
        ))}
      </g>
      {outline ? (
        <image
          className={outlineClassName}
          href={BRANDMARK_OUTLINE_SRC}
          x="0"
          y="0"
          width="430.99"
          height="436"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
    </svg>
  );
}
