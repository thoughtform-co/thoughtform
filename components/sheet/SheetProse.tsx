import type { ReactNode } from "react";

import type { SheetSection } from "@/lib/sheet/types";

import { SheetReadout } from "./SheetParts";

type Prose = Extract<SheetSection, { kind: "prose" }>;

/**
 * The post body (ADR-114): a sticky metadata column on the left three
 * columns (date, author, reading time, tags — stripe.dev's `/ METADATA`)
 * beside the compiled body at the copy measure.
 */
export function SheetProse({ section, children }: { section: Prose; children?: ReactNode }) {
  return (
    <div className="sh-prose">
      <aside className="sh-prose__meta sh-reveal" aria-label="Metadata">
        <SheetReadout rows={section.meta} />
      </aside>
      <div className="sh-prose__body sh-reveal">{children}</div>
    </div>
  );
}
