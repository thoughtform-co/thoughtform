"use client";

import { useRef } from "react";

import { IntelligenceMapPlate } from "@/components/landing/home-v2/services/casefile/IntelligenceMapPlate";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";
import { LOOP_INTELLIGENCE_MAP } from "@/lib/cases/content/loop-earplugs";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcIntelligenceProps {
  section: ArcSectionOf<"intelligence">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcIntelligence — the intelligence architecture at page scale (ADR-076).
 *
 * The landing casefile's own instrument, out of its panel: three readings
 * (THE WORK · THE CONFIGURATION · THE SUBSTRATE) on the shared
 * `ConsoleRail`, the selection flying between them. On the casefile it is
 * one of four plates sharing a ~850px column; here it is the section, so
 * it gets the band's full instrument width and the height a viewport
 * affords — which is the whole point of the beat: the same drawing, read
 * at a size a reader can actually read it at.
 *
 * ONE RECORD, SHARED BY REFERENCE. `LOOP_INTELLIGENCE_MAP` is the arrays
 * the casefile row already carries — 47 Skills, five shapes, 27 streams,
 * eight districts. The content module contributes a masthead and nothing
 * else, exactly as the `dossier` kind contributes a `toolId`: a page that
 * re-typed the roster would be publishing a second portfolio, and the two
 * would drift the first time either was edited.
 *
 * ⚠ THE WHEEL CANNOT TRAP THIS PAGE, and that is structural rather than
 * lucky. `PdaConsole`'s native wheel listener is gated on BOTH
 * `SERVICES_SCROLL_OWNED_MEDIA` and `closest("[data-proof-settled]")` —
 * the casefile's own arrival attribute, which nothing on an arc writes.
 * So off the casefile the listener returns before it can `preventDefault`
 * and the reading changes by rail click, by `1` `2` `3`, or by `Escape`.
 * Do NOT declare `data-proof-settled` on this host to "make it feel like
 * the landing": that would arm a scroll trap in the middle of a flowing
 * page (the smoke asserts the page still scrolls over the console).
 *
 * The console's own arrival gate IS declared, in arcs.css — `.fl-con__console`
 * opens at rest, because an arc has no casefile ladder to wait on. The
 * beat's reveal is what brings it in.
 */
export function ArcIntelligence({ section, index, motion = "reveal" }: ArcIntelligenceProps) {
  // The dossier's lightbox needs this ref for its fold-close; the console
  // has no dialog of its own, so the ref is only the host handle.
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <ArcBeat
      id={section.id}
      kind="intelligence"
      className="arc-section arc-sec arc-sec--intel"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        <ArcSectionHead
          head={section.head}
          kind="intelligence"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        {/* The console is an APERTURE, like the dossier's (ADR-072): it
            unfolds in place with NO travel, so the wrapper never becomes a
            containing block for the drawing's absolutely-positioned SVG. */}
        <div className="arc-intel arc-reveal" ref={rootRef} {...rung(motion, 0.12, 0)}>
          <IntelligenceMapPlate {...LOOP_INTELLIGENCE_MAP} />
        </div>
      </div>
    </ArcBeat>
  );
}
