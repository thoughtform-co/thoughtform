import { Instrument, type InstrumentKnobs } from "@/components/instrument/Instrument";
import { SURI_INSTRUMENT } from "@/lib/instrument/records/suri";
import type { InsKnobs } from "@/lib/instrument/variants";

import { BoardHead } from "./BoardHead";

/**
 * The four surfaces the instrument serves, each as it would mount:
 * a proposal beat (static, one lit thing), the configuration page (the
 * picker), a setup guide (the organisation, static), an explainer (the
 * plugin, the picker). The jury scores this board.
 */
export function SurfacesBoard({ knobs }: { knobs: InsKnobs }) {
  const k = knobs as unknown as Partial<InstrumentKnobs>;
  return (
    <section className="ins-board" data-ins-board-name="surfaces">
      <BoardHead
        kicker="03 · Surfaces"
        title="Four pages, one instrument."
        line="A proposal beat, the configuration page, a setup guide, an explainer: the same record, mounted the way each page would."
      />
      <div className="ins-board__cell">
        <p className="ins-board__caption">
          A proposal beat · the organisation, one lit thing, no picker
        </p>
        <Instrument
          record={SURI_INSTRUMENT}
          altitude="org"
          focus="context"
          id="ins-s-proposal"
          knobs={k}
        />
      </div>
      <div className="ins-board__cell">
        <p className="ins-board__caption">The configuration page · the work, with the picker</p>
        <Instrument
          record={SURI_INSTRUMENT}
          altitude="work"
          picker={["plugin", "work", "run", "check"]}
          id="ins-s-config"
          knobs={k}
        />
      </div>
      <div className="ins-board__cell">
        <p className="ins-board__caption">A setup guide · the plugin, static</p>
        <Instrument record={SURI_INSTRUMENT} altitude="plugin" id="ins-s-guide" knobs={k} />
      </div>
      <div className="ins-board__cell">
        <p className="ins-board__caption">An explainer · the run, opening into its checks</p>
        <Instrument
          record={SURI_INSTRUMENT}
          altitude="run"
          picker={["run", "check"]}
          id="ins-s-explainer"
          knobs={k}
        />
      </div>
    </section>
  );
}
