import Link from "next/link";
import type { CSSProperties } from "react";

import type { SheetSection } from "@/lib/sheet/types";

import { pad2 } from "./chrome";
import { SheetFigureFrame } from "./SheetParts";

type Row = Extract<SheetSection, { kind: "row" }>;

/**
 * Ruled rows (ADR-114): ordinal · title · mono tags · paragraph · figure
 * across one hairline row, the fields aligned down the column (Graphic
 * Hunters). A row with an `href` is one link.
 */
export function SheetRow({ section }: { section: Row }) {
  return (
    <div className="sh-rows">
      {section.items.map((item, i) => {
        const inner = (
          <>
            <span className="sh-row__ord" aria-hidden="true">
              {item.ordinal ?? pad2(i + 1)}
            </span>
            <h3 className="sh-row__title">{item.title}</h3>
            <ul className="sh-tags">
              {item.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="sh-row__body">{item.body}</p>
            <div className="sh-row__fig">
              {item.figure ? <SheetFigureFrame figure={item.figure} n={i + 1} portrait /> : null}
            </div>
          </>
        );
        const style = { "--i": i } as CSSProperties;
        return item.href ? (
          <Link key={item.id} href={item.href} className="sh-row sh-reveal" style={style}>
            {inner}
          </Link>
        ) : (
          <div key={item.id} className="sh-row sh-reveal" style={style}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
