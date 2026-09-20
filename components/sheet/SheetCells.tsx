import Link from "next/link";
import type { CSSProperties } from "react";

import type { SheetSection } from "@/lib/sheet/types";

import { SheetReadout } from "./SheetParts";

type Cells = Extract<SheetSection, { kind: "cells" }>;

/** `data: { kinds: "keynote", "sh-filter": "kind" }` → `data-kinds`, `data-sh-filter`. */
export function dataAttrs(data?: Record<string, string>): Record<string, string> {
  if (!data) return {};
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v]));
}

/**
 * Cells sharing edges (ADR-114): two, three or four regions of one surface,
 * each with a kicker at the top and a caption at the bottom — chrome at the
 * extremes, the body in the middle. Four is a two-by-two. A cell with an
 * `href` is one link.
 */
export function SheetCells({ section }: { section: Cells }) {
  return (
    <div className="sh-cells" data-n={section.n}>
      {section.cells.map((cell, i) => {
        const inner = (
          <>
            <p className="sh-cell__kicker">{cell.kicker}</p>
            <div className="sh-cell__body">
              {cell.body.map((p, j) => (
                <p className="sh-cell__p" key={j}>
                  {p}
                </p>
              ))}
              {cell.readout ? (
                <SheetReadout rows={cell.readout} className="sh-cell__readout" />
              ) : null}
              {cell.steps ? (
                <ol className="sh-cell__steps">
                  {cell.steps.map((s) => (
                    <li key={s.when + s.what}>
                      <span className="sh-cell__when">{s.when}</span>
                      <span className="sh-cell__what">{s.what}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
            {cell.caption ? <p className="sh-cell__caption">{cell.caption}</p> : null}
          </>
        );
        const style = { "--i": i } as CSSProperties;
        const attrs = dataAttrs(cell.data);
        return cell.href ? (
          <Link
            key={cell.id}
            href={cell.href}
            className="sh-cell sh-reveal"
            style={style}
            {...attrs}
          >
            {inner}
          </Link>
        ) : (
          <div key={cell.id} className="sh-cell sh-reveal" style={style} {...attrs}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
