"use client";

import { useRef } from "react";

import { SheetsPlate } from "@/components/landing/home-v2/services/casefile/SheetsPlate";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";
import { LOOP_STUDIO_SHEETS } from "@/lib/cases/content/loop-earplugs";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcStudioSheetsProps {
  section: ArcSectionOf<"sheets">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcStudioSheets — the studio's three sheets at page scale (ADR-078).
 *
 * THE ADS · THE LINE · THE RED LINE, on the casefile's own plate: what the
 * studio shipped, the rule it drew for when AI may make an image, and the
 * limit it refuses to cross. On the landing these three share a ~850px
 * column with everything else the row has to say; here the sheets ARE the
 * section, so the comparison's two columns and the four red-line claims
 * letter at a size a stranger can read.
 *
 * IT REPLACED THREE AD CARDS, and the swap is the beat's argument. The cards
 * showed only the output — three stills with their ratios — while half the
 * engagement was the policy underneath, which is the half a reader who was
 * not in the building actually has to trust. The 97 % masthead still opens
 * it; the console now answers "how do you decide?" rather than repeating
 * "look what we made".
 *
 * ONE RECORD, SHARED BY REFERENCE (`LOOP_STUDIO_SHEETS`) — the same array
 * the casefile row carries, so the studio's own red line cannot be edited on
 * one surface alone. The content module contributes a masthead and nothing
 * else, exactly as `dossier` contributes a `toolId`.
 *
 * ⚠ `stillSizes` IS THE ONE THING THE TWO SURFACES DO NOT SHARE. A `sizes`
 * hint is a statement about the BOX; the casefile's tiles are panel-fitted
 * at 200px and this one's are half again as wide, so inheriting the default
 * would serve an upscaled candidate at page scale. Everything else about the
 * plate is byte-identical, and any OTHER change to it is a two-surface
 * change (`services-ring-smoke` AND `arc-portfolio-smoke`).
 *
 * The console's arrival gate is declared in arcs.css (`.fl-con__console`
 * opens at rest) — an arc writes no casefile ladder for it to wait on — and
 * ⚠ `data-proof-settled` is NEVER declared on this host: it is half of the
 * map console's wheel gate, and arming it anywhere on a flowing page is how
 * a scroll trap gets in.
 */
export function ArcStudioSheets({ section, index, motion = "reveal" }: ArcStudioSheetsProps) {
  // The plate has no dialog of its own; the ref is the host handle, kept
  // for parity with the dossier and the map beats.
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <ArcBeat
      id={section.id}
      kind="sheets"
      className="arc-section arc-sec arc-sec--sheets"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        <ArcSectionHead
          head={section.head}
          kind="sheets"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        {/* An APERTURE, like the dossier's and the map's (ADR-072): it
            unfolds in place with NO travel, so the wrapper never becomes a
            containing block for anything the plate positions. */}
        <div className="arc-sheets arc-reveal" ref={rootRef} {...rung(motion, 0.12, 0)}>
          <SheetsPlate sheets={LOOP_STUDIO_SHEETS} stillSizes="320px" />
        </div>
      </div>
    </ArcBeat>
  );
}
