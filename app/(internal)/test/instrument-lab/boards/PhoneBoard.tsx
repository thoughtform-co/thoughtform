import { Instrument, type InstrumentKnobs } from "@/components/instrument/Instrument";
import { SURI_INSTRUMENT } from "@/lib/instrument/records/suri";
import { ALTITUDES, altitudesOf } from "@/lib/instrument/types";
import type { InsKnobs } from "@/lib/instrument/variants";

import { BoardHead } from "./BoardHead";

/** Every altitude in a 375px column: the phone's reading order, no wires. */
export function PhoneBoard({ knobs }: { knobs: InsKnobs }) {
  const offered = altitudesOf(SURI_INSTRUMENT);
  return (
    <section className="ins-board" data-ins-board-name="phone">
      <BoardHead
        kicker="04 · Phone"
        title="Standing up."
        line="Each altitude in a phone's column: the chip first, the lit parts, the owner, the rest."
      />
      <div className="ins-board__phones">
        {ALTITUDES.filter((a) => offered.includes(a)).map((a) => (
          <div key={a} className="ins-board__phone">
            <Instrument
              record={SURI_INSTRUMENT}
              altitude={a}
              id={`ins-phone-${a}`}
              knobs={knobs as unknown as Partial<InstrumentKnobs>}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
