/**
 * THE ELASTIC CROP — one mechanism, three readings (ADR-070 U12/U14,
 * generalised 2026-08-12).
 *
 * ⚠ **A STATIC CROP CANNOT SERVE THIS PANEL, AND THAT IS ARITHMETIC.** The
 * console's field is capped at 850px wide but grows with the viewport's
 * height, so its aspect runs 1.22 on a laptop (603 × 493) to 0.76 on a tall
 * monitor (850 × 1120). `preserveAspectRatio="… meet"` fits by the SMALLER
 * ratio, so a crop drawn for one end of that range letterboxes at the other —
 * and the letterbox is dead panel no element move can reach.
 *
 * Measured before this helper existed, with every guard green:
 *
 *   reading   1280×720          1920×1080        845×950 (the owner's)
 *   01        117px horizontal  102px horiz      92px below
 *   03        4px               71px below       265px below — 27.9 %
 *
 * ⚠ **THAT WAS A GUARD DEFECT, NOT A DRAWING DEFECT.** Nothing measured a
 * drawing against the PANEL — only against its own crop — so reading 02 shipped
 * the same fault three updates running (U4 portrait, U10 landscape, U11
 * portrait again) before U12 named it.
 *
 * ## The trick, and why growing a crop is free
 *
 * `meet` is `min(field.w / crop.w, field.h / crop.h)`. Make the crop's aspect
 * EQUAL the field's and the two ratios are equal, so:
 *
 *   - the drawing fills the panel on both axes, and
 *   - `meet` is unchanged from the bound-axis ratio it already had, so **not
 *     one rendered type size moves.**
 *
 * Growing the crop on its unbound axis is therefore free. Which axis that is
 * flips with the field: a crop is width-bound while the field is TALLER than
 * it (grow the height) and height-bound while the field is WIDER (grow the
 * width). `fitExt` picks; only one of the two extensions is ever non-zero.
 *
 * ⚠ **ELASTICITY BUYS ZERO TYPE.** It removes dead panel and nothing else. If
 * a reading needs bigger letters the lever is its crop's bound dimension or
 * its own density — never this.
 *
 * ## Where the extension goes, and where it does not
 *
 * A crop that grows while its content does not is just a bigger margin, so
 * each reading spends the extension in its own currency (reading 02: the
 * cables and the cells — a taller board is a longer run; reading 01: the
 * grid's gutters; reading 03: the row and column pitch). Two laws:
 *
 *   - **The spend is SPLIT, never pooled.** Air under the last module is a
 *     hole; air distributed through the chain is spacing.
 *   - **The margin is the REMAINDER, halved** (U14). Whatever the content does
 *     not claim is split evenly, so every drawing is centred by construction
 *     rather than by a share that has to be tuned. `cropAround` is that rule,
 *     and it is the same rule on both axes — reading 02's "fixed 26-unit side
 *     inset" is exactly what the split produces when the crop is the content
 *     plus two insets.
 *
 * ⚠ **THE CLAMP IS AN HONEST FAILURE, NOT A CEILING TO RAISE.** Past its max
 * a reading letterboxes on purpose, because the alternative is a run of cable
 * long enough to read as a gap with wires in it. `pda-viewbox` asserts the
 * clamp is only reached by shapes no desktop produces.
 */

export interface FitSpec {
  /** The crop at rest, in the reading's own authoring units. */
  cropW: number;
  cropH: number;
  /** How far each axis may grow before the drawing letterboxes on purpose. */
  maxW: number;
  maxH: number;
}

export interface FitExt {
  /** Extra authoring units of width. Zero unless the field is wider than the crop. */
  extW: number;
  /** Extra authoring units of height. Zero unless the field is taller. */
  extH: number;
}

/**
 * The extension a field of this aspect can hold, free. `fieldAspect` is
 * `height / width` — the SVG's own box, which `pda.css` pins to the field.
 *
 * ⚠ Only the ASPECT may enter this arithmetic. A translate is invisible to it
 * and a uniform ancestor scale cancels, which is what makes one
 * `ResizeObserver` read safe on a subtree the casefile animates as it arrives.
 */
export function fitExt(spec: FitSpec, fieldAspect: number): FitExt {
  if (!(fieldAspect > 0)) return { extW: 0, extH: 0 };
  const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));
  return {
    extW: clamp(spec.cropH / fieldAspect - spec.cropW, spec.maxW),
    extH: clamp(spec.cropW * fieldAspect - spec.cropH, spec.maxH),
  };
}

export interface FitCrop {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  /** Air to the left of the block, and the same again to its right. */
  marginX: number;
  /** Air above the block, and the same again below it. */
  marginY: number;
  /** The `viewBox` attribute. */
  crop: string;
}

/**
 * ⚠ ROUNDED, because these numbers land in the DOM and in the flight's
 * arithmetic. The shares are fractions of a fraction, so an unrounded value
 * serialises as `1015.9999999999999`; two places is a thousandth of a device
 * pixel and keeps both readable.
 */
export const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Centre a crop of the given size on the block the reading actually draws.
 * The margin is what is left, halved — U14's rule, on both axes.
 */
export function cropAround(
  block: { x: number; y: number; w: number; h: number },
  cropW: number,
  cropH: number
): FitCrop {
  const marginX = (cropW - block.w) / 2;
  const marginY = (cropH - block.h) / 2;
  const cropX = block.x - marginX;
  const cropY = block.y - marginY;
  return {
    cropX,
    cropY,
    cropW,
    cropH,
    marginX,
    marginY,
    crop: `${r2(cropX)} ${r2(cropY)} ${r2(cropW)} ${r2(cropH)}`,
  };
}
