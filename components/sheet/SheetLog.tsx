import type { CSSProperties } from "react";

import { letterDateDotted } from "@/lib/sheet/dates";
import type { SheetDossier, SheetSection } from "@/lib/sheet/types";

import { pad2 } from "./chrome";
import { SheetInstrumentController } from "./SheetInstrumentController";
import { SheetCta, SheetReadout } from "./SheetParts";
import { SheetStationRow } from "./SheetStationRow";

type Log = Extract<SheetSection, { kind: "log" }>;

/**
 * SheetLog — the instrument's second frame (ADR-118).
 *
 * Left, five of twelve: a `<nav>` of REAL LINKS — the kind filter, then one
 * group head per client over one-line rows, one row filled. Right, seven of
 * twelve and no gutter: the dossier, one housing, sticky at the rails' top.
 * Every dossier is rendered and all but the chosen one are `hidden`, so the
 * page reads whole without script and the controller only moves attributes.
 *
 * ⚠ THE CHOSEN ROW IS CHOSEN HERE, ON THE SERVER — `aria-current`, the fill,
 * the lit mark on the monitor and the visible dossier all agree before a line
 * of script runs. The controller takes over from that state; it never
 * computes it.
 */
export function SheetLog({ section }: { section: Log }) {
  const { filter, groups, dossiers, selected } = section;
  return (
    <section
      id={section.id}
      className="sh-sec sh-sec--log"
      data-sh-arrangement="log"
      aria-label={section.ariaLabel ?? section.menuLabel ?? undefined}
    >
      <div className="sh-log sh-ap-root">
        <nav
          className="sh-log__list sh-ap"
          aria-label="Engagements"
          style={{ "--ap-i": 0 } as CSSProperties}
        >
          <div className="sh-log__filter">
            <SheetStationRow {...filter} />
          </div>
          {groups.map((g) => {
            const kinds = Array.from(new Set(g.rows.map((r) => r.kind))).join(" ");
            return (
              <section
                key={g.id}
                className="sh-log__group"
                data-sh-filter={filter.attr}
                {...{ [`data-${filter.attr}s`]: kinds }}
                aria-labelledby={`log-head-${g.id}`}
              >
                <h2 className="sh-log__head" id={`log-head-${g.id}`}>
                  <span className="sh-log__head-name">{g.name}</span>
                  <span className="sh-log__count">{pad2(g.rows.length)}</span>
                </h2>
                <ul className="sh-log__rows">
                  {g.rows.map((r) => {
                    const on = r.id === selected;
                    return (
                      <li
                        key={r.id}
                        className="sh-log__item"
                        data-sh-filter={filter.attr}
                        {...{ [`data-${filter.attr}s`]: r.kind }}
                      >
                        <a
                          href={r.href}
                          className={`sh-log__row${on ? " is-on" : ""}`}
                          data-id={r.id}
                          data-status={r.standing}
                          aria-current={on ? "true" : undefined}
                          aria-controls={`dos-${r.id}`}
                        >
                          <span
                            className="sh-log__mark"
                            data-standing={r.standing}
                            aria-hidden="true"
                          />
                          <span className="sh-log__chip">{r.chip}</span>
                          <span className="sh-log__title">{r.title}</span>
                          <span className="sh-log__date">
                            <span aria-hidden="true">[</span>
                            {letterDateDotted(r.date)}
                            <span aria-hidden="true">]</span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>

        <div className="sh-log__dossiers sh-ap" style={{ "--ap-i": 1 } as CSSProperties}>
          {dossiers.map((d) => (
            <Dossier key={d.id} dossier={d} hidden={d.id !== selected} />
          ))}
          <p className="sh-sr" role="status" aria-live="polite" data-sh-log-status="" />
        </div>
      </div>
      <SheetInstrumentController />
    </section>
  );
}

function Dossier({ dossier: d, hidden }: { dossier: SheetDossier; hidden: boolean }) {
  return (
    <article
      className="sh-dos"
      id={`dos-${d.id}`}
      data-id={d.id}
      hidden={hidden}
      aria-labelledby={`dos-title-${d.id}`}
    >
      {/* ⚠ TWO BOXES, BECAUSE ONE ELEMENT HOLDS ONE `clip-path`: the article
          is the swap's aperture, `__in` is the housing's chamfer (or, under
          `dossier=pair`, the column the two plate housings stand in). */}
      <div className="sh-dos__in">
        <div className="sh-dos__plate sh-dos__plate--head">
          <header className="sh-dos__band">
            {d.designation.href ? (
              <a className="sh-dos__desig" href={d.designation.href}>
                {"// "}
                {d.designation.name}
              </a>
            ) : (
              <span className="sh-dos__desig">
                {"// "}
                {d.designation.name}
              </span>
            )}
            <span className="sh-dos__kind">{d.kind}</span>
          </header>
          <div className="sh-dos__img">
            {/* ⚠ EAGER, AT LOW PRIORITY, AND NEVER `lazy`. A hidden dossier's
                lazy picture only starts to load when a swap unhides it, so it
                streamed in top-down AFTER the 180ms aperture had opened — the
                swap "settled" on a half-painted plate, and seventeen of wave
                03's twenty second-pick stills were shot that way. The monitor
                holds no image, so nothing on the first screen waits for these. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- a duotoned still at a declared size, the sheet's own figure recipe */}
            <img
              src={d.image.src}
              alt={d.image.alt}
              width={d.image.width}
              height={d.image.height}
              fetchPriority="low"
              decoding="async"
            />
          </div>
        </div>
        <div className="sh-dos__plate sh-dos__plate--text">
          <div className="sh-dos__body">
            <h2 className="sh-dos__title" id={`dos-title-${d.id}`}>
              {d.title}
            </h2>
            <p className="sh-dos__lede">{d.lede}</p>
            <div className="sh-dos__cols">
              <SheetReadout rows={d.readout} className="sh-dos__readout" />
              {d.chapters.length > 0 ? (
                <ol className="sh-dos__chapters" aria-label="Chapters">
                  {d.chapters.map((c, i) => (
                    <li key={c.id}>
                      <a href={c.href}>
                        <span className="sh-dos__ch-n">{pad2(i + 1)}</span>
                        {c.label}
                      </a>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </div>
          <footer className="sh-dos__foot">
            <SheetCta href={d.cta.href} label={d.cta.label} />
            <p className="sh-dos__keys" aria-hidden="true">
              <kbd>Up</kbd>
              <kbd>Down</kbd>
              <span>Select</span>
              <kbd>Enter</kbd>
              <span>Open</span>
            </p>
          </footer>
        </div>
      </div>
    </article>
  );
}
