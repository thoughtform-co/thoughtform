import type { CSSProperties } from "react";

import type { SheetFigureDef, SheetReadoutRow } from "@/lib/sheet/types";

import { figLabel } from "./chrome";

/** The section head band: an ordinal (per the knob), the kicker, one hairline. */
export function SheetHead({ ordinal, kicker }: { ordinal: string | null; kicker: string }) {
  return (
    <div className="sh-head sh-reveal">
      {ordinal ? (
        <span className="sh-head__ord" aria-hidden="true">
          {ordinal} /
        </span>
      ) : null}
      <span className="sh-head__kicker">{kicker}</span>
    </div>
  );
}

/** A readout column: the label dim, the value lit. */
export function SheetReadout({
  rows,
  className,
}: {
  rows: readonly SheetReadoutRow[];
  className?: string;
}) {
  return (
    <dl className={`sh-readout${className ? ` ${className}` : ""}`}>
      {rows.map((r) => (
        <div className="sh-readout__row" key={r.label}>
          <dt className="sh-readout__k">{r.label}</dt>
          <dd className="sh-readout__v">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A framed figure: the bracketed FIG bar, the body, the mono caption. */
export function SheetFigureFrame({
  figure,
  n,
  portrait = false,
}: {
  figure: SheetFigureDef;
  n: number;
  portrait?: boolean;
}) {
  return (
    <figure className="sh-fig" style={{ margin: 0 }}>
      <div className="sh-fig__bar" aria-hidden="true">
        <span>{figLabel(n)}</span>
        <span>
          {figure.kind === "image" ? (figure.treatment === "plain" ? "still" : "duotone") : "mark"}
        </span>
      </div>
      <div className={`sh-fig__body${portrait ? " sh-fig__body--portrait" : ""}`}>
        {figure.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={`sh-fig__img${figure.treatment === "plain" ? "" : " sh-fig--duotone"}`}
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span
            className="sh-fig__mark"
            aria-hidden="true"
            style={{ "--seed": figure.seed ?? 0 } as CSSProperties}
          />
        )}
      </div>
      <figcaption className="sh-fig__caption">{figure.caption}</figcaption>
    </figure>
  );
}

/** The one outlined call to action. */
export function SheetCta({ href, label }: { href: string; label: string }) {
  return (
    <a className="sh-cta" href={href}>
      {label}
      <span className="sh-cta__arrow" aria-hidden="true" />
    </a>
  );
}
