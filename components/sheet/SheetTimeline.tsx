import type { CSSProperties } from "react";

import { axisPosition, letterDate, letterMonth, monthSpan } from "@/lib/sheet/dates";
import type { SheetSection } from "@/lib/sheet/types";

type Timeline = Extract<SheetSection, { kind: "timeline" }>;

/**
 * The timeline (ADR-114): items seated on a dated axis at their dates,
 * alternating above and below, one lit (a gold outline and a filled
 * diamond), the ones before it dimmed — the Hermeus roadmap. One markup;
 * `timeline=rail` and the phone re-seat it as a vertical date rail in CSS.
 *
 * ⚠ IT PLOTS A RECORD. The positions are arithmetic on the dates and the
 * month ticks are the axis's own; nothing is placed by eye.
 */
export function SheetTimeline({ section }: { section: Timeline }) {
  const { from, to } = section.axis;
  const months = monthSpan(from, to);
  const lit = section.items.find((it) => it.id === section.lit);
  return (
    <div className="sh-tl sh-reveal" role="list" aria-label="On the calendar">
      <div className="sh-tl__axis" aria-hidden="true" />
      {months.map((ym, i) => {
        const x = `${(i / months.length) * 100}%`;
        return (
          <span key={ym} aria-hidden="true">
            <span className="sh-tl__tick" style={{ left: x }} />
            <span className="sh-tl__tick-label" style={{ left: x }}>
              {letterMonth(ym)}
            </span>
          </span>
        );
      })}
      {section.items.map((it, i) => {
        const isLit = it.id === section.lit;
        const isPast = lit ? it.date < lit.date : false;
        const x = `${axisPosition(it.date, from, to) * 100}%`;
        return (
          <div
            key={it.id}
            role="listitem"
            className={`sh-tl__item${isLit ? " is-lit" : ""}${isPast ? " is-past" : ""}`}
            data-lane={i % 2 === 0 ? "above" : "below"}
            data-id={it.id}
            style={{ "--x": x } as CSSProperties}
          >
            <span className="sh-tl__mark" aria-hidden="true" />
            <span className="sh-tl__stem" aria-hidden="true" />
            <div className="sh-tl__box">
              <p className="sh-tl__title">{it.title}</p>
              <p className="sh-tl__date">{letterDate(it.date)}</p>
              {it.sub ? <p className="sh-tl__sub">{it.sub}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
