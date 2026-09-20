import Link from "next/link";
import type { CSSProperties } from "react";

import type { SheetSection } from "@/lib/sheet/types";

import { SheetFigureFrame } from "./SheetParts";

type Figure = Extract<SheetSection, { kind: "figure" }>;

/**
 * Framed figures (ADR-114): one, or a two-up split by ONE vertical dashed
 * divider (stripe.dev's related two-up), each with its kicker, title and
 * lede under the frame. An item with an `href` is one link.
 */
export function SheetFigure({ section }: { section: Figure }) {
  return (
    <div className="sh-figs" data-n={section.items.length}>
      {section.items.map((it, i) => {
        const inner = (
          <>
            <SheetFigureFrame figure={it.figure} n={i + 1} />
            {it.kicker ? <p className="sh-figs__kicker">{it.kicker}</p> : null}
            {it.title ? <h3 className="sh-figs__title">{it.title}</h3> : null}
            {it.lede ? <p className="sh-figs__lede">{it.lede}</p> : null}
          </>
        );
        const style = { "--i": i } as CSSProperties;
        return it.href ? (
          <Link key={it.id} href={it.href} className="sh-figs__item sh-reveal" style={style}>
            {inner}
          </Link>
        ) : (
          <div key={it.id} className="sh-figs__item sh-reveal" style={style}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
