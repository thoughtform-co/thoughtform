import type { SessionsPageModel } from "@/lib/sessions/page";

import { SessionsHead } from "./SessionsHead";
import { TablePlan } from "./TablePlan";

/**
 * 03 · The table (ADR-150): the photograph of the table mid-session in a
 * notched frame, lettered at its four corners (Blunarova's ledger), beside
 * the table drawn from above and the practical readout — each row a filled
 * key framed beside its value (the travel-data readout, ADR-118 U3).
 *
 * ⚠ A plain `<img>`: no public route uses `next/image` and the file is
 * 40 kB; its size is the file's own (840×1360, read off the asset).
 */
export function SessionsTable({ table }: { table: SessionsPageModel["table"] }) {
  const [tl, tr, bl, br] = table.corners;
  return (
    <section
      className="hs-sec hs-table"
      id="the-table"
      aria-labelledby="hs-table-title"
      data-hs-section="the-table"
    >
      <div className="hs-band">
        <SessionsHead ord="03" kicker={table.kicker} title={table.title} id="hs-table-title" />
        <div className="hs-table__body">
          <div
            className="lat-frame hs-photo hs-reveal"
            data-cut="tr"
            data-ch="card"
            data-line="seam"
          >
            <picture>
              <source srcSet={table.photo.src} type="image/webp" />
              <img
                className="hs-photo__img"
                src={table.photo.fallback}
                alt={table.photo.alt}
                width={table.photo.width}
                height={table.photo.height}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className="hs-photo__corner" data-corner="tl">
              {tl}
            </span>
            <span className="hs-photo__corner" data-corner="tr">
              {tr}
            </span>
            <span className="hs-photo__corner" data-corner="bl">
              {bl}
            </span>
            <span className="hs-photo__corner" data-corner="br">
              {br}
            </span>
          </div>
          <div className="hs-table__side hs-reveal">
            <TablePlan caption={table.fig} />
            <dl className="hs-readout">
              {table.readout.map((row) => (
                <div key={row.key} className="hs-readout__row">
                  <dt className="hs-readout__key">{row.key}</dt>
                  <dd className="hs-readout__value">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
