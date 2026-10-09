import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { Glyph } from "./ArcLeverage";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcTermsProps {
  section: ArcSectionOf<"terms">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcTerms — the fee and what it is measured against (ADR-153), in the
 * leverage's own console: the same plate, head strip, split and readout
 * foot, so the page opens and closes on one instrument.
 *
 *   left   the day rate as the one large readout, a line under it, then the
 *          shape of the engagement as mono rows.
 *   right  what we measure as the leverage's 2×2: index, glyph, title, line.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. No total is lettered (ADR-133 U5).
 */
export function ArcTerms({ section, index, motion = "reveal" }: ArcTermsProps) {
  const { console: con, rate, shape, measures, readout } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="terms"
      className="arc-section arc-sec arc-sec--terms"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="terms"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-lev arc-terms arc-plate arc-reveal" {...rung(motion, 0.14)}>
          <div className="arc-lev__bar">
            <p className="arc-lev__sys">
              <span className="arc-lev__sys-key">SYS</span>
              {con.name}
            </p>
            <p className="arc-lev__status">
              <span className="arc-lev__pulse" aria-hidden="true" />
              {con.status}
            </p>
          </div>
          <div className="arc-lev__split">
            <div className="arc-lev__idea arc-terms__rate">
              <div>
                <p className="arc-lev__label arc-terms__rate-label">{rate.label}</p>
                <p className="arc-terms__value">
                  {rate.value}
                  <span className="arc-terms__unit">{rate.unit}</span>
                </p>
                <p className="arc-lev__line">{rate.line}</p>
              </div>
              <dl className="arc-terms__shape">
                {shape.map((r) => (
                  <div key={r.label} className="arc-terms__row">
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="arc-lev__uses">
              <p className="arc-lev__uses-label">{measures.label}</p>
              <ul className="arc-lev__grid">
                {measures.items.map((u, i) => (
                  <li key={u.id} className="arc-lev__cell">
                    <p className="arc-lev__index">{String(i + 1).padStart(2, "0")}</p>
                    <Glyph kind={u.glyph} />
                    <p className="arc-lev__title">{u.label}</p>
                    <p className="arc-lev__line">{u.line}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <dl className="arc-lev__readout">
            {readout.map((r) => (
              <div key={r.label} className="arc-lev__read">
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ArcBeat>
  );
}
