import type { SheetSection } from "@/lib/sheet/types";

import { SheetReadout } from "./SheetParts";
import { SheetStationRow } from "./SheetStationRow";

type Split = Extract<SheetSection, { kind: "split" }>;

/**
 * The page head (ADR-114): a name kicker and the display title on the left
 * five columns, the paragraphs opposite, with an optional readout and a
 * station row under them. Never centred, never a hero image — the Hermeus
 * second section, which the owner named. `head=stack` re-seats the same
 * three pieces (kicker left, title and copy stacked right) in CSS alone.
 */
export function SheetSplit({ section }: { section: Split }) {
  const { title } = section;
  return (
    <div className="sh-grid sh-split">
      <div className="sh-split__lead">
        <p className="sh-split__name sh-reveal">{section.name}</p>
        <h1 className="sh-split__title sh-reveal">
          {title.pre ? <>{title.pre} </> : null}
          {title.em ? <em className="sh-split__em">{title.em}</em> : null}
          {title.post ? <> {title.post}</> : null}
        </h1>
      </div>
      <div className="sh-split__copy sh-reveal">
        {section.paragraphs.map((p, i) => (
          <p className="sh-split__p" key={i}>
            {p}
          </p>
        ))}
        {section.readout ? (
          <SheetReadout rows={section.readout} className="sh-split__readout" />
        ) : null}
        {section.stations ? (
          <div className="sh-split__stations">
            <SheetStationRow {...section.stations} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
