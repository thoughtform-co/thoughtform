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
 */
export function SheetRenderer({
  sections,
  slots,
}: {
  sections: readonly SheetSection[];
  slots?: Record<string, ReactNode>;
}) {
  return (
    <>
      {sections.map((section, index) => {
        if (section.kind === "close") return <SheetClose key={section.id} id={section.id} />;
        // The instrument's two frames draw their own section: no band, no head,
        // no ordinal (ADR-118).
        if (section.kind === "monitor") return <SheetMonitor key={section.id} section={section} />;
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
