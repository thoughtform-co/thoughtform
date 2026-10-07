import type { CSSProperties } from "react";

import type { SessionsPageModel } from "@/lib/sessions/page";

import { SessionsHead } from "./SessionsHead";

const at = (x: number) => ({ "--x": x }) as CSSProperties;

/**
 * 02 · The dates (ADR-150) — the page's instrument. One notched housing on
 * the instrument band (the lattice's frame recipe: the TR + BL pair, the
 * gold lip, a washed head band), a dated axis with the next morning lit and
 * a NOW cursor, then the mornings as TALL TILES — the Valorant store's
 * grammar: a corner label, the day as the big figure, a chip row, and the
 * way in at the foot. Every tile is one link to its own mailto; a held
 * morning is not a link.
 *
 * ⚠ Gold is spent here on three things: the housing's lip and band, the lit
 * tile, and its one filled button. Every other line is dawn.
 */
export function SessionsDates({ dates }: { dates: SessionsPageModel["dates"] }) {
  return (
    <section
      className="hs-sec hs-dates"
      id="dates"
      aria-labelledby="hs-dates-title"
      data-hs-section="dates"
    >
      <div className="hs-band">
        <SessionsHead
          ord="02"
          kicker={dates.kicker}
          title={dates.title}
          sub={dates.sub}
          id="hs-dates-title"
        />
      </div>
      <div className="hs-band hs-band--wide">
        <div className="lat-frame hs-housing hs-reveal" data-ch="plate-fluid">
          <div className="lat-frame__head hs-housing__head" data-head="wash">
            <span>{dates.housing}</span>
            <span className="hs-housing__meta">{dates.count}</span>
          </div>
          <div className="hs-axis" aria-hidden="true">
            <div className="hs-axis__track" />
            {dates.axis.ticks.map((t) => (
              <span key={t.id} className="hs-axis__tick" style={at(t.x)}>
                <span className="hs-axis__month">{t.label}</span>
              </span>
            ))}
            {dates.axis.marks.map((m) => (
              <span
                key={m.id}
                className="hs-axis__mark"
                data-lit={m.lit ? "" : undefined}
                data-held={m.held ? "" : undefined}
                style={at(m.x)}
              />
            ))}
            {dates.axis.now !== null ? (
              <span className="hs-axis__now" style={at(dates.axis.now)}>
                <span className="hs-axis__now-label">Now</span>
              </span>
            ) : null}
          </div>
          <ol className="hs-tiles">
            {dates.tiles.map((t) => {
              const inner = (
                <>
                  <span className="hs-tile__top">
                    <span className="hs-tile__ord">{t.ordinal}</span>
                    <span className="hs-tile__status">{t.status}</span>
                  </span>
                  <span className="hs-tile__date">
                    <span className="hs-tile__day">{t.day}</span>
                    <span className="hs-tile__when">
                      <span>{t.weekday}</span>
                      <span>
                        {t.month} {t.year}
                      </span>
                    </span>
                  </span>
                  <span className="hs-tile__chips">
                    {t.chips.map((c) => (
                      <span key={c} className="hs-chip">
                        {c}
                      </span>
                    ))}
                  </span>
                  <span className="hs-tile__cta">
                    {t.cta}
                    {t.href ? (
                      <span className="hs-tile__arrow" aria-hidden="true">
                        →
                      </span>
                    ) : null}
                  </span>
                </>
              );
              return (
                <li key={t.id} className="hs-tiles__item" data-state={t.state} data-id={t.id}>
                  {t.href ? (
                    <a
                      className="lat-frame hs-tile"
                      data-cut="tr"
                      data-ch="card"
                      data-line={t.state === "next" ? "lip-lit" : "seam"}
                      href={t.href}
                      aria-label={`${t.cta}: ${t.title}, ${t.weekday} ${t.day} ${t.month} ${t.year}`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      className="lat-frame hs-tile"
                      data-cut="tr"
                      data-ch="card"
                      data-line="rule"
                    >
                      {inner}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="lat-frame__foot hs-housing__foot">
            <span>{dates.foot}</span>
            <a className="hs-housing__cta" href={dates.reserve.href}>
              {dates.reserve.label} →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
