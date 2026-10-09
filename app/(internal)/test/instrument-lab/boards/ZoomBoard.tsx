import { Instrument, type InstrumentKnobs } from "@/components/instrument/Instrument";
import { SURI_INSTRUMENT } from "@/lib/instrument/records/suri";
import { altitudesOf } from "@/lib/instrument/types";
import type { InsKnobs } from "@/lib/instrument/variants";

import { BoardHead } from "./BoardHead";

/** One housing with the picker: the altitude transition on the engine the
 *  `zoom` knob names (css · flip · anime). */
export function ZoomBoard({ knobs }: { knobs: InsKnobs }) {
  return (
    <section className="ins-board" data-ins-board-name="zoom">
      <BoardHead
        kicker="02 · Zoom"
        title="The same nodes, between their seats."
        line={`Pick an altitude on the breadcrumb. Engine: ${knobs.zoom}. A transition plays once per pick; the drawing is then still.`}
      />
      <div className="ins-board__cell">
        <Instrument
          record={SURI_INSTRUMENT}
          altitude="work"
          id="ins-suri-zoom"
          picker={altitudesOf(SURI_INSTRUMENT)}
          knobs={knobs as unknown as Partial<InstrumentKnobs>}
        />
      </div>
    </section>
  );
}
