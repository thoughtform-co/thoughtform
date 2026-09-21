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
 * Left, five of twelve: a `<nav>` of REAL LINKS — the kind filter as a head
 * strip level with the dossier's band, then ONE BLOCK PER ENGAGEMENT (U1): a
 * bordered box, the client and the bracketed date on a mono line over the
 * title, one filled. Right, seven of twelve, a gutter away: the dossier, one
 * housing, sticky at the rails' top. Every dossier is rendered and all but the
 * chosen one are `hidden`, so the page reads whole without script and the
 * controller only moves attributes.
 *
 * ⚠ THE LIST WAS AN OUTLINE AND IS BLOCKS NOW (ADR-118 U1, owner: "a
 * glorified word document"). The client heads went — five of six headed one
 * row — and the client is each block's own first line; the chips went — each
 * restated its title, and their four widths made the title column ragged
 * (`chip` stays in the record, lettered nowhere). The blocks DIVIDE the
 * device's height between them (`--log-block-h`, from `--log-n` written
 * here), so the list ends on the dossier's floor.
 *
 * ⚠ THE CHOSEN ROW IS CHOSEN HERE, ON THE SERVER — `aria-current`, the fill,
 * the lit mark on the monitor and the visible dossier all agree before a line
 * of script runs. The controller takes over from that state; it never
 * computes it. ⚠ Five readers find a block by its strings — `.sh-log__row`,
 * `.is-on`, `data-id`, `data-status`, `aria-current`, and `data-sh-filter` on
 * the `<li>` (the controller, the station row, the capture's second pick, the
 * preview capture, the kit's fills fake) — and none of them fails loudly.
 */
export function SheetLog({ section }: { section: Log }) {
  const { filter, groups, dossiers, selected } = section;
  const blocks = groups.flatMap((g) => g.rows.map((row) => ({ row, client: g.name })));
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
          style={{ "--ap-i": 0, "--log-n": blocks.length } as CSSProperties}
        >
          <div className="sh-log__filter">
            <SheetStationRow {...filter} />
          </div>
          <ul className="sh-log__rows">
            {blocks.map(({ row: r, client }) => {
              const on = r.id === selected;
              return (
                <li
                  key={r.id}
                  className="sh-log__item"
                  data-sh-filter={filter.attr}
                  {...{ [`data-${filter.attr}s`]: r.kind }}
                >
                  {/* DOM order is client, title, date — what a screen reader
                      says; the grid seats the date on the first line. */}
                  <a
                    href={r.href}
                    className={`sh-log__row${on ? " is-on" : ""}`}
                    data-id={r.id}
                    data-status={r.standing}
                    aria-current={on ? "true" : undefined}
                    aria-controls={`dos-${r.id}`}
                  >
                    <span className="sh-log__mark" data-standing={r.standing} aria-hidden="true" />
                    <span className="sh-log__client">{client}</span>
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
