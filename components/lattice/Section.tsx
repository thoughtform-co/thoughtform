import type { ReactNode } from "react";

/**
 * The lattice's section (ADR-149 §3): `.lat-sec > .lat-band > (.lat-head |
 * .lat-body | .lat-foot)`. The sheet's structural rules generalised — a seat,
 * a band tier, Evangelion's numbered head strip, one of six arrangements,
 * Cyberpunk's status row. A server component that emits classes and knob
 * attributes and paints nothing; an undefined prop emits no attribute, since
 * the absence is the house default (flow, the text band, head-field).
 *
 * The head renders only when a title or a kicker is given. An ordinal takes
 * the strip's first column as a tab; without one the strip closes that
 * column (the recipe's own `:has()` rule) so the title is not indented.
 */
export type SectionSeat = "flow" | "centre" | "datum";
export type SectionBand = "band" | "instrument" | "bleed";
export type SectionHead = "strip" | "bare";
export type SectionArrangement = "head-field" | "split" | "bay" | "cells" | "instrument" | "ledger";
export type SectionRatio = "1-1" | "5-7" | "7-5";
export type SectionN = 2 | 3 | 4;

export type SectionProps = {
  id: string;
  seat?: SectionSeat;
  band?: SectionBand;
  head?: SectionHead;
  ordinal?: string;
  kicker?: string;
  title?: ReactNode;
  sub?: ReactNode;
  arrangement?: SectionArrangement;
  ratio?: SectionRatio;
  n?: SectionN;
  foot?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Section({
  id,
  seat,
  band,
  head,
  ordinal,
  kicker,
  title,
  sub,
  arrangement,
  ratio,
  n,
  foot,
  className,
  children,
}: SectionProps) {
  const hasHead = (title !== undefined && title !== null) || kicker !== undefined;
  return (
    <section
      id={id}
      className={`lat-sec${className ? ` ${className}` : ""}`}
      data-seat={seat}
      data-head={head}
    >
      <div className="lat-band" data-band={band}>
        {hasHead ? (
          <header className="lat-head">
            {ordinal !== undefined ? (
              <span className="lat-head__ord" aria-hidden="true">
                {ordinal}
              </span>
            ) : null}
            {kicker !== undefined ? <span className="lat-head__kicker">{kicker}</span> : null}
            {title !== undefined && title !== null ? (
              <h2 className="lat-head__title">{title}</h2>
            ) : null}
            {sub !== undefined && sub !== null ? <p className="lat-head__sub">{sub}</p> : null}
          </header>
        ) : null}
        <div
          className="lat-body lat-grid"
          data-arrangement={arrangement}
          data-ratio={ratio}
          data-n={n}
        >
          {children}
        </div>
        {foot !== undefined && foot !== null ? <footer className="lat-foot">{foot}</footer> : null}
      </div>
    </section>
  );
}
