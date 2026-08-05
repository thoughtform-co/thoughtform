import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/intelligence-map-lab — look-dev for the work-to-intelligence map's
 * DRAWING, beside the one that ships.
 *
 * The shipped map (ADR-062) draws three sheets — board · unit · below grade
 * — in ONE isometric. Update 1 fitted it arithmetically and the owner's read
 * is still that it is too chaotic to carry the practice's most important
 * offering. The complaint is density and legibility, not a fit bug.
 *
 * The isometric is the cost centre, and the reasons are arithmetic:
 *
 *   1. NO LABEL HAS A BASELINE. Every plate edge runs at ±30°, so a label
 *      either floats free — colliding with whatever is behind it — or skews.
 *   2. POSITION DEPENDS ON THE WHOLE SCENE. Back-row objects are occluded by
 *      front-row ones, which is why the district plaques had to hang ABOVE
 *      their plates rather than below them.
 *   3. DEPTH EATS WIDTH. A plate of face-width W occupies W + depth, in a
 *      console that is 611px wide.
 *
 * ADR-062 chose one isometric because a plan/section/services set "broke
 * projection consistency". This lab tests the other half of that trade: the
 * CHROME carries the unity — one bezel, one type ladder, one mark vocabulary,
 * one colour law — and the sheets are free to be genuinely different diagram
 * types, told apart by the OPERATION they perform rather than by their
 * vocabulary: 01 locates and crosses, 02 dissects, 03 tabulates.
 *
 * ⚠ THIS IS A MEASURING INSTRUMENT, NOT A PICTURE. Every defect this surface
 * has ever shipped was invisible at 1920 and present at 1280×720, so the
 * frame is pinned to the REAL measured console boxes and the readout walks
 * the SVG's glyph boxes live. Author at the first preset. Read the numbers.
 *
 * ⚠ Glyph boxes are compared in SVG USER UNITS via `getBBox()`, never
 * `box.width / viewBox.width` — `preserveAspectRatio="xMidYMid meet"` scales
 * by the MINIMUM of the two ratios, and the ratio method over-reported the
 * city's board sheet by 16 %.
 *
 * No production file is modified by this route; the live map keeps rendering
 * `MapSurface` in the casefile. The `city` variant here mounts that same
 * component, so the comparison is against the real thing rather than a copy.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Intelligence Map Lab — the BOARD archetype (Internal)",
  description:
    "Look-dev for an orthographic alternative to the work-to-intelligence map's isometric city, at the real casefile console size.",
  robots: { index: false, follow: false },
};

export default function IntelligenceMapLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
