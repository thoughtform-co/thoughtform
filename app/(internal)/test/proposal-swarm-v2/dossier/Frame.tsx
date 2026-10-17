import type { ReactNode } from "react";

import type { Framed } from "./types";

/**
 * The house frame for one figure (brand-language 2026-10 §2, ADR-149):
 * straight corners with the TR + BL notch pair, the edge a closed evenodd
 * ring on `::before` (a clip cuts a border and never strokes one), a second
 * hairline 4px inside it, the heading inside the frame, the datum stated,
 * and the `FIG.` caption it closes on at the bottom left. Its one gold: a
 * cross on each of the two square corners (brand-language §2, "gold crosses
 * on a visual's corners"; owner, 2026-10-17: "they can use a golden accent").
 *
 * Server; the geometry is CSS (`dossier.css`, `.csd-frame`), the polygons
 * written out there from the lattice's arithmetic rather than imported.
 */
export function Frame({
  n,
  framed,
  children,
}: {
  /** The figure number: its step's place in the cut shown (01 = the piece). */
  n: number;
  framed: Framed;
  children: ReactNode;
}) {
  return (
    <figure className="csd-fig" data-kind={framed.figure.kind}>
      <div className="csd-frame">
        <div className="csd-frame__head">
          <span className="csd-frame__k">{framed.head}</span>
          {framed.datum ? <span className="csd-frame__datum">{framed.datum}</span> : null}
        </div>
        <div className="csd-frame__body">{children}</div>
        <i className="csd-x" data-corner="tl" aria-hidden="true" />
        <i className="csd-x" data-corner="br" aria-hidden="true" />
      </div>
      <figcaption className="csd-cap">
        <span className="csd-cap__n">FIG. {String(n).padStart(2, "0")}</span>
        <span className="csd-cap__t">{framed.caption}</span>
      </figcaption>
    </figure>
  );
}
