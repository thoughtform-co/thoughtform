import type { ReactNode } from "react";

import type { FigureKind, Framed } from "./types";

/** The figures that are a picture of the whole thing fill the window. */
const BLEED: ReadonlySet<FigureKind> = new Set([
  "screen",
  "cloud",
  "sprawl",
  "plates",
  "exchange",
  "sheet",
]);

const two = (n: number) => String(n).padStart(2, "0");

/**
 * The window round one figure (owner, 2026-10-19, frame H of the case
 * explorations: "this looks beautiful … because we have a full-bleed
 * visual"): one hairline with the top-right and bottom-left notch pair, no
 * gold on it (owner, 2026-10-19); words only in the top-left corner (the
 * figure's path: the client, then what it is) and the bottom-right (its
 * datum). The words of the step stay in the held
 * column, so the window carries only labels, never a sentence.
 *
 * Server; the geometry is CSS (`dossier.css`, `.csd-frame`).
 */
export function Frame({
  n,
  client,
  framed,
  children,
}: {
  /** The figure's place in the cut shown (01 = the result). */
  n: number;
  client: string;
  framed: Framed;
  children: ReactNode;
}) {
  const kind = framed.figure.kind;
  return (
    <figure className="csd-fig" data-kind={kind} data-bleed={BLEED.has(kind) ? "" : undefined}>
      <div className="csd-frame">
        <div className="csd-frame__head">
          <span className="csd-frame__caret" aria-hidden="true">
            ▸
          </span>
          <span>{client}</span>
          <span className="csd-frame__sep" aria-hidden="true">
            /
          </span>
          <span className="csd-frame__k">{framed.head}</span>
        </div>
        <div className="csd-frame__body">{children}</div>
        <div className="csd-frame__foot" data-fig={two(n)}>
          {framed.datum ? <span className="csd-frame__datum">{framed.datum}</span> : null}
        </div>
      </div>
    </figure>
  );
}
