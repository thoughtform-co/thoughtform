import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ArcBoardRow } from "./board/ArcBoardRow";
import { arcTitleText } from "./chrome";

interface ArcBoardProps {
  section: ArcSectionOf<"board">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcBoard — the client's configuration as a circuit board in two states
 * (ADR-100): as it runs today, dormant and compact, beside the same studio
 * with a configuration seated, lit and expanded. The proof's own R4
 * instrument (ADR-070 U11) at page scale, and the answer to the owner's
 * read of the panel it replaces — "a lot of things to look at", framed,
 * where every other beat on the page is framed too.
 *
 * ⚠ NOT IN A FRAME. The row has no plate, no border and no ground: the
 * modules are the objects, and between them the page's own ground shows —
 * on the Trinny page, the turn's coral wash. The head strip and foot row of
 * each board are its datum and terminus (the references' one constant), so
 * the drawing is bounded by chrome that belongs to the device, not by a box.
 *
 * ⚠ TWO BANDS, DELIBERATELY. The head stays on the TEXT band so it seats on
 * the same x as every other proposal head (ADR-099's datum guard measures
 * `seatOf("configuration")` against the phases and the fee — a head on the
 * wide band would sit 120px left of them at 1920). The drawing takes the
 * INSTRUMENT band for its width. `:has(> .arc-band > .arc-head)` still
 * matches the first band, so the datum rule and the beat's id are untouched.
 *
 * ⚠ SERVER, NO STATE. The one client island is `ArcBoardRow`, which owns the
 * row's measurement (the elastic crop) and nothing else; the arrival is CSS
 * on `.is-in`, and no-JS, reduced motion and terminal all render LIT.
 */
export function ArcBoard({ section, index, motion = "reveal" }: ArcBoardProps) {
  return (
    <ArcBeat
      id={section.id}
      kind="board"
      className="arc-section arc-sec arc-sec--board"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="board"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
      </div>
      <div className="arc-band arc-band--instrument">
        <ArcBoardRow section={section} motion={motion} />
      </div>
    </ArcBeat>
  );
}
