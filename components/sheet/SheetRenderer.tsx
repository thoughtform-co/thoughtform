import type { ReactNode } from "react";

import { ordinalOf } from "@/lib/sheet/composition";
import type { SheetSection } from "@/lib/sheet/types";

import { SheetCells } from "./SheetCells";
import { SheetClose } from "./SheetClose";
import { SheetConsole } from "./SheetConsole";
import { SheetFigure } from "./SheetFigure";
import { SheetLog } from "./SheetLog";
import { SheetMonitor } from "./SheetMonitor";
import { SheetHead } from "./SheetParts";
import { SheetProse } from "./SheetProse";
import { SheetRow } from "./SheetRow";
import { SheetSplit } from "./SheetSplit";
import { SheetSteps } from "./SheetSteps";
import { SheetTable } from "./SheetTable";
import { SheetTimeline } from "./SheetTimeline";

/**
 * SheetRenderer — a page's ladder, section by section (ADR-114).
 *
 * Every section is a `<section class="sh-sec sh-sec--<kind>"
 * data-sh-arrangement="<kind>">` on the band, and every section but the
 * split and the close opens on the head band (ordinal · kicker · hairline).
 * The `switch` is exhaustive at compile time: a kind added to the union
 * without a renderer is a type error, not a blank on the page.
 *
 * `slots` carries the one thing a record cannot: compiled MDX for a
 * `prose` section, keyed by the section's id.
 *
 * THE HEAD, THE BODY AND THE CLOSE ARE SIBLINGS (ADR-127, ADR-129). The split
 * renders first, then every other section inside `.sh-body`, then the close —
 * so the landing's ending can be drawn on a flowing document: with `rise`, the
 * body carries `data-sh-rise` and sheet.css §14b welds the close up over its
 * last viewport while the body drifts under it on a view timeline. Without
 * `rise` the wrapper is a layout no-op and the footer follows in flow.
 * ⚠ THE HEAD IS OUTSIDE THE BODY ON EVERY SHEET (ADR-129), because a stuck
 * element inside a drifting body slides down 0.75× for the whole rise
 * (ADR-127 §4's own finding) and a split with `pin` sticks under the header.
 * DOM order is unchanged — split · the body's sections · close — so the
 * composition law and both DOM readers hold. The split is SKIPPED in the
 * body's map, never filtered out of `sections`: `ordinalOf` walks the full
 * array. ⚠ The one selector that keys on the wrapper is the seam the body's
 * first section draws (sheet.css §1): with the head outside, that section has
 * no `.sh-sec` sibling before it.
 * ⚠ `rise` IS OPT-IN, NOT DERIVED: the client pages end on the sticky console
 * and a stuck element inside a drifting body slides for the whole rise, so
 * they and the kit do not pass it; the three flowing pages do. The wrapper is
 * invisible to every other reader — the capture, the smoke and the law all
 * query `.sh-sec[data-sh-arrangement]` as descendants, and no selector in
 * this folder is a child or `:scope` combinator.
 */
export function SheetRenderer({
  sections,
  slots,
  rise = false,
}: {
  sections: readonly SheetSection[];
  slots?: Record<string, ReactNode>;
  /** The footer rises over the body (sheet.css §14b). Flowing pages only. */
  rise?: boolean;
}) {
  const split = sections.find((section) => section.kind === "split");
  const close = sections.find((section) => section.kind === "close");
  const draw = (section: SheetSection, index: number) => {
    const ordinal = ordinalOf(sections, index);
    const kicker = section.kicker ?? section.menuLabel ?? section.kind;
    return (
      <section
        key={section.id}
        id={section.id}
        className={`sh-sec sh-sec--${section.kind}`}
        data-sh-arrangement={section.kind}
        aria-label={section.ariaLabel ?? section.menuLabel ?? undefined}
        {...(section.kind === "split" && section.pin ? { "data-sh-pin": "" } : null)}
      >
        <div className="sh-band">
          {section.kind === "split" ? null : <SheetHead ordinal={ordinal} kicker={kicker} />}
          <SectionBody section={section} slot={slots?.[section.id]} />
        </div>
      </section>
    );
  };
  return (
    <>
      {split ? draw(split, sections.indexOf(split)) : null}
      <div className="sh-body" {...(rise && close ? { "data-sh-rise": "" } : null)}>
        {sections.map((section, index) => {
          // The head is drawn before the body and the close after it, as its
          // siblings (above and below) — skipped here, never filtered.
          if (section.kind === "split" || section.kind === "close") return null;
          // The instrument's two frames draw their own section: no band, no head,
          // no ordinal (ADR-118).
          if (section.kind === "monitor")
            return <SheetMonitor key={section.id} section={section} />;
          if (section.kind === "log") return <SheetLog key={section.id} section={section} />;
          return draw(section, index);
        })}
      </div>
      {close ? <SheetClose id={close.id} /> : null}
    </>
  );
}

function SectionBody({ section, slot }: { section: SheetSection; slot?: ReactNode }) {
  switch (section.kind) {
    case "split":
      return <SheetSplit section={section} />;
    case "row":
      return <SheetRow section={section} />;
    case "cells":
      return <SheetCells section={section} />;
    case "console":
      return <SheetConsole section={section} />;
    case "timeline":
      return <SheetTimeline section={section} />;
    case "steps":
      return <SheetSteps section={section} />;
    case "table":
      return <SheetTable section={section} />;
    case "figure":
      return <SheetFigure section={section} />;
    case "prose":
      return <SheetProse section={section}>{slot}</SheetProse>;
    case "close":
    case "monitor":
    case "log":
      // Drawn above, outside the band; never reached here.
      return null;
    default: {
      const never: never = section;
      return never;
    }
  }
}
