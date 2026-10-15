import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import { StackFigure } from "./stack/StackFigure";

/**
 * ArcStack — the `stack` kind (ADR-156 U2): the section head, then the
 * proposal system's isometric stack under it at the band's width. The
 * drawing is `StackFigure` as the leverage and the handoff draw it; this
 * kind only gives it a beat of its own, with no console and no uses grid.
 *
 * ⚠ SERVER, NO STATE. The figure is a SIZE container, so its host
 * (`.arc-stackbeat__fig`) carries a definite height (`arcs.css`).
 */
export function ArcStack({
  section,
  index,
  motion = "reveal",
}: {
  section: ArcSectionOf<"stack">;
  index: number;
  motion?: ArcMotion;
}) {
  const f = section.figure;
  return (
    <ArcBeat
      id={section.id}
      kind="stack"
      className="arc-section arc-sec arc-sec--stack"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="stack"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-stackbeat__fig arc-reveal" {...rung(motion, 0.14)}>
          <StackFigure
            id={`${section.id}-stack`}
            tiers={f.tiers}
            lit={f.lit}
            callouts={f.callouts}
            tiles={f.tiles}
            courses={f.courses}
            sides={f.sides}
            alt={f.alt}
          />
        </div>
      </div>
    </ArcBeat>
  );
}
