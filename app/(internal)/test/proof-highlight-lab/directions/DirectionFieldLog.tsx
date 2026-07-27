import type { ReactNode } from "react";

import { LAB_CASE, LAB_HIGHLIGHT_EXTRAS as X } from "../proofHighlightLabData";

/**
 * A — FIELD LOG. The owner's mockup, productionized.
 *
 * One landscape slab in the services-plate family (chamfered gradient shell,
 * scanline body, gold chip) carrying the whole case as a filed document:
 * identity + testimony + meta on the left, the captured artefact + its impact
 * numbers on the right, bracketed by a header and a contents rail.
 *
 * Family, not clone: it borrows the plate's shell and mono voice, but the
 * services card is a PORTRAIT photo plate with a baked lede and an OPEN chit —
 * this is landscape, photoless, and reads as a record rather than an offer.
 */
export function DirectionFieldLog({ capture }: { capture: ReactNode }) {
  const meta = LAB_CASE.report.meta.filter((m) => m.label !== "Client");
  const rows = [...meta.slice(0, 2), { label: "Mandate", value: X.mandate }, ...meta.slice(2)];

  return (
    <article className="phl-shell phl-fl">
      <div className="phl-shell__bd">
        {/* Header rail — the filing identity. */}
        <div className="phl-rail phl-rail--head">
          <span className="phl-rail__mark">{X.logmark}</span>
          <span className="phl-rail__mid">{X.expedition}</span>
          <span className="phl-rail__idx">
            01<i aria-hidden="true">◄</i>
          </span>
        </div>

        <div className="phl-fl__body">
          {/* ── Left: who, in their own words ─────────────────────────── */}
          <div className="phl-fl__doc">
            <h3 className="phl-fl__client">
              {LAB_CASE.client}
              <i aria-hidden="true">.</i>
            </h3>
            <p className="phl-fl__domain">{X.domain}</p>
            <p className="phl-fl__operator">
              {X.logCode} · {X.operator}
            </p>

            <blockquote className="phl-fl__quote">{X.quote.text}</blockquote>
            <p className="phl-fl__summary">{X.summary}</p>

            <dl className="phl-fl__meta">
              {rows.map((row) => (
                <div className="phl-metarow" key={row.label}>
                  <dt>{row.label}</dt>
                  <i className="phl-metarow__lead" aria-hidden="true" />
                  <dd>
                    {row.label === "Status" ? (
                      <>
                        <i className="phl-dia" aria-hidden="true" />
                        In service
                      </>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="phl-cta">
              {X.cta} <i aria-hidden="true">→</i>
            </p>
          </div>

          {/* ── Right: the captured artefact + what it produced ────────── */}
          <div className="phl-fl__capture">
            <figure className="phl-capture">
              <figcaption className="phl-capture__cap">
                <span>CAPTURE — THE ARC · RUN AT LOOP</span>
                <i className="phl-capture__pips" aria-hidden="true" />
              </figcaption>
              <div className="phl-capture__frame">
                <span className="phl-capture__ref">{X.captureRef}</span>
                {capture}
                <span className="phl-capture__tag">{X.captureTag}</span>
                <i className="phl-bracket phl-bracket--tl" aria-hidden="true" />
                <i className="phl-bracket phl-bracket--tr" aria-hidden="true" />
                <i className="phl-bracket phl-bracket--bl" aria-hidden="true" />
                <i className="phl-bracket phl-bracket--br" aria-hidden="true" />
              </div>
            </figure>

            <ul className="phl-fl__stats">
              {X.impactStats.map((s) => (
                <li key={s.label}>
                  <span className="phl-fl__stat-v">{s.value}</span>
                  <span className="phl-fl__stat-l">{s.label}</span>
                  {s.detail ? <span className="phl-fl__stat-d">{s.detail}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contents rail — what the case continues into (the three beats). */}
        <div className="phl-rail phl-rail--foot">
          <span className="phl-rail__mark">
            <i className="phl-dia" aria-hidden="true" />
            {X.logCode} · ON RECORD
          </span>
          <span className="phl-rail__idx">{X.contents}</span>
        </div>
      </div>
    </article>
  );
}
