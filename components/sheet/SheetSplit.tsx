import type { SheetSection } from "@/lib/sheet/types";

import { coordStamp, surveyDesig } from "./chrome";
import { SheetReadout } from "./SheetParts";
import { SheetStationRow } from "./SheetStationRow";

type Split = Extract<SheetSection, { kind: "split" }>;

/**
 * The page head (ADR-114): a name kicker and the display title on the left
 * five columns, the paragraphs opposite, with an optional readout and a
 * station row under them. Never centred, never a hero image — the Hermeus
 * second section, which the owner named. `head=stack` re-seats the same
 * three pieces (kicker left, title and copy stacked right) in CSS alone.
 *
 * ⚠ WITH `survey` IT IS THE HOMEPAGE MASTHEAD'S HEAD (ADR-129), COPIED: a
 * designation hung over each block (`MUS / TITLE · 01`, `MUS / BRIEF · 02`) on
 * ONE shared line, the gold state chip at the brief's head-right, the gold
 * origin cross at the title's top-left and the dawn close cross at the brief's
 * bottom-right (one diagonal), a coord stamp under each block, a dot-grid lift
 * under each. The name kicker is NOT drawn — the designation is the eyebrow.
 * Every chrome string is `aria-hidden`, so the H1 stays the accessible name.
 * The title ladder stays the sheet's own; only the chrome is the masthead's.
 */
export function SheetSplit({ section }: { section: Split }) {
  const { title, survey } = section;
  return (
    <div className="sh-grid sh-split" {...(survey ? { "data-sh-survey": "" } : null)}>
      <div className="sh-split__lead">
        {survey ? (
          <>
            <i className="sh-split__grid" aria-hidden="true" />
            <i className="sh-split__mark sh-split__mark--origin" aria-hidden="true" />
            <span className="sh-split__desig" aria-hidden="true">
              {surveyDesig(survey.code, 1)}
            </span>
          </>
        ) : (
          <p className="sh-split__name sh-reveal">{section.name}</p>
        )}
        <h1 className="sh-split__title sh-reveal">
          {title.pre ? <>{title.pre} </> : null}
          {title.em ? <em className="sh-split__em">{title.em}</em> : null}
          {title.post ? <> {title.post}</> : null}
        </h1>
        {survey ? (
          <span className="sh-split__coord" aria-hidden="true">
            {coordStamp(section.id, 1)}
          </span>
        ) : null}
      </div>
      <div className="sh-split__copy sh-reveal">
        {survey ? (
          <>
            <i className="sh-split__grid" aria-hidden="true" />
            <span className="sh-split__desig" aria-hidden="true">
              {surveyDesig(survey.code, 2)}
            </span>
            <span className="sh-split__state" aria-hidden="true">
              {survey.state}
            </span>
          </>
        ) : null}
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
        {survey ? (
          <>
            <span className="sh-split__coord sh-split__coord--r" aria-hidden="true">
              {coordStamp(section.id, 2)}
            </span>
            <i className="sh-split__mark sh-split__mark--close" aria-hidden="true" />
          </>
        ) : null}
      </div>
    </div>
  );
}
