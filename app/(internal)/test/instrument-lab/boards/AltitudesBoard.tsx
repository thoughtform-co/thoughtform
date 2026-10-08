import { Instrument, type InstrumentKnobs } from "@/components/instrument/Instrument";
import { SURI_INSTRUMENT } from "@/lib/instrument/records/suri";
import { ALTITUDES, altitudesOf } from "@/lib/instrument/types";
import type { InsKnobs } from "@/lib/instrument/variants";

import { BoardHead } from "./BoardHead";

/** The one record at every altitude it carries, top to bottom, so the eye
 *  can check that each is the same object opened. */
export function AltitudesBoard({ knobs }: { knobs: InsKnobs }) {
  const offered = altitudesOf(SURI_INSTRUMENT);
  return (
    <section className="ins-board" data-ins-board-name="altitudes">
      <BoardHead
        kicker="01 · Altitudes"
        title="One record, every altitude."
        line="Suri's studio configuration, drawn five times. What is the housing at one altitude is the chip at the next."
      />
      {ALTITUDES.filter((a) => offered.includes(a)).map((a) => (
        <div key={a} className="ins-board__cell">
          <Instrument
            record={SURI_INSTRUMENT}
            altitude={a}
            id={`ins-suri-${a}`}
            knobs={knobs as unknown as Partial<InstrumentKnobs>}
          />
        </div>
      ))}
    </section>
  );
}
