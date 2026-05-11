"use client";

/**
 * BrandmarkGlyph — single canonical pure-code source for the Thoughtform
 * brandmark on the v7 landing page.
 *
 * Renders the brandmark as inline SVG (filled gold paths + optional
 * outline overlay), with no `<img>` and no raster asset reference. All
 * landing-page dock sites (`.sigil__mark`, `.miss__brand-slot`,
 * `.crail__brand`, `.approach__orbit__mark`, the fixed
 * `.tf-brandmark-actor`) consume this same primitive so the brandmark
 * everywhere on the page is the same vector geometry from the same
 * code source — no parallel raster copies, no asset drift between
 * sections.
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

/** Path geometry exported from `public/logos/Thoughtform_Brandmark.svg`.
 * viewBox is "0 0 430.99 436". Do not edit by hand — re-export from the
 * source SVG if the brandmark geometry changes. */
export const BRANDMARK_FILLED_PATHS: readonly string[] = [
  "M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z",
  "M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z",
  "M29.12,218.81l132.09-.05v.05H29.12h0Z",
  "M163.32,250.35l12.58.05h-12.58v-.05Z",
  "M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z",
  "M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z",
  "M254.35,0l-33.01,182.26h-.6L254.35,0h0Z",
];

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
