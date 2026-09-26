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
 * THE BODY AND THE CLOSE ARE SIBLINGS (ADR-127). Every section but the close
 * renders inside `.sh-body`, and the close follows it — so the landing's
 * ending can be drawn on a flowing document: with `rise`, the body carries
 * `data-sh-rise` and sheet.css §14b welds the close up over its last viewport
 * while the body drifts under it on a view timeline. Without `rise` the
 * wrapper is a layout no-op and the footer follows the content in flow.
 * ⚠ `rise` IS OPT-IN, NOT DERIVED: the client pages end on the sticky console
 * and a stuck element inside a drifting body slides for the whole rise, so
 * they and the kit do not pass it; the three flowing pages do. The wrapper is
 * invisible to every reader — the capture, the smoke and the law all query
 * `.sh-sec[data-sh-arrangement]` as descendants, and no selector in this
 * folder is a child or `:scope` combinator.
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
  const close = sections.find((section) => section.kind === "close");
  return (
    <>
      <div className="sh-body" {...(rise && close ? { "data-sh-rise": "" } : null)}>
        {sections.map((section, index) => {
          // Drawn after the body, as its sibling (below).
          if (section.kind === "close") return null;
          // The instrument's two frames draw their own section: no band, no head,
          // no ordinal (ADR-118).
          if (section.kind === "monitor")
            return <SheetMonitor key={section.id} section={section} />;
          if (section.kind === "log") return <SheetLog key={section.id} section={section} />;
          const ordinal = ordinalOf(sections, index);
          const kicker = section.kicker ?? section.menuLabel ?? section.kind;
          return (
            <section
              key={section.id}
              id={section.id}
              className={`sh-sec sh-sec--${section.kind}`}
              data-sh-arrangement={section.kind}
              aria-label={section.ariaLabel ?? section.menuLabel ?? undefined}
            >
              <div className="sh-band">
                {section.kind === "split" ? null : <SheetHead ordinal={ordinal} kicker={kicker} />}
                <SectionBody section={section} slot={slots?.[section.id]} />
              </div>
            </section>
          );
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
