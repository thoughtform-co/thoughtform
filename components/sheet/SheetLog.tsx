import type { CSSProperties } from "react";

import { letterDateDotted } from "@/lib/sheet/dates";
import type { SheetDossier, SheetSection } from "@/lib/sheet/types";

import { pad2 } from "./chrome";
import { SheetConfiguration } from "./config/SheetConfiguration";
import { SheetGlyph } from "./SheetGlyph";
import { SheetInstrumentController } from "./SheetInstrumentController";
import { SheetCta } from "./SheetParts";

type Log = Extract<SheetSection, { kind: "log" }>;

/**
 * SheetLog — the instrument's second frame (ADR-118).
 *
 * Left, five of twelve: a `<nav>` of REAL LINKS, DIVIDED BY KIND (U2 — the
 * owner, on U1's filter tabs: they "should actually divide the list on the
 * left, like we have in the third screenshot", the Ripperdoc's OWNED /
 * STORE). Each section is a mono head (the kind, its count) on a seam, then
 * one block per engagement: the kind-of-page ICON left of the plate (the red
 * codex list's arrangement), and a plate NOTCHED bottom-left carrying the
 * client as its title over one mono line — what the engagement is, bracketed,
 * and when it was filed. One is filled.
 *
 * Right, seven of twelve, a gutter away: the dossier, one housing, sticky at
 * the rails' top — its band, the one-line brief and a status strip, the
 * client's CONFIGURATION drawn where the key visual was (owner: "that key
 * visual with the text: what the fuck is that?"), and the way in. An
 * engagement with no configuration (the portfolio, the house formats) shows
 * no board and no picture: the housing is as tall as what it says.
 *
 * ⚠ THE LIST MAY RUN PAST THE SCREEN (owner: "I don't mind that it extends
 * beyond the viewport section"). The blocks still divide the device's height
 * while that leaves each one its floor (`--log-block-h`, from `--log-n` and
 * `--log-heads`, both written here); below it the list grows and the dossier
 * stays pinned beside it.
 *
 * ⚠ THE CHOSEN ROW IS CHOSEN HERE, ON THE SERVER — `aria-current`, the fill,
 * the lit mark on the monitor and the visible dossier all agree before a line
 * of script runs. ⚠ Four readers find a block by its strings — `.sh-log__row`,
 * `.is-on`, `data-id`, `data-status`, `aria-current` (the controller, the
 * capture's second pick, the kit's fills fake, the smokes) — and none of them
 * fails loudly.
 */
export function SheetLog({ section }: { section: Log }) {
  const { groups, dossiers, selected } = section;
  const n = groups.reduce((sum, g) => sum + g.rows.length, 0);
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
          style={{ "--ap-i": 0, "--log-n": n, "--log-heads": groups.length } as CSSProperties}
        >
          {groups.map((g) => (
            <div
              key={g.id}
              className="sh-log__sec"
              role="group"
              aria-labelledby={`log-sec-${g.id}`}
              data-kind={g.id}
            >
              <p className="sh-log__head" id={`log-sec-${g.id}`}>
                <span className="sh-log__head-name">{g.name}</span>
                <span className="sh-log__head-n">{pad2(g.rows.length)}</span>
              </p>
              <ul className="sh-log__rows">
                {g.rows.map((r) => {
                  const on = r.id === selected;
                  return (
                    <li key={r.id} className="sh-log__item">
                      <a
                        href={r.href}
                        className={`sh-log__row${on ? " is-on" : ""}`}
                        data-id={r.id}
                        data-status={r.standing}
                        aria-current={on ? "true" : undefined}
                        aria-controls={`dos-${r.id}`}
                      >
                        <SheetGlyph name={r.chip} />
                        <span className="sh-log__plate">
                          <span className="sh-log__name">{r.name}</span>
                          <span className="sh-log__line">
                            <span className="sh-log__eng">
                              <span aria-hidden="true">[ </span>
                              {r.engagement}
                              <span aria-hidden="true"> ]</span>
                            </span>
                            <span className="sh-log__date">{letterDateDotted(r.date)}</span>
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
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
      data-board={d.configuration ? "" : undefined}
      hidden={hidden}
      aria-label={d.title}
    >
      {/* ⚠ TWO BOXES, BECAUSE ONE ELEMENT HOLDS ONE `clip-path`: the article
          is the swap's aperture, `__in` is the housing's chamfer. */}
      <div className="sh-dos__in">
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
        <div className="sh-dos__brief">
          {/* The dossier's NAME is the card's title, carried as the article's
              `aria-label` and lettered nowhere: the band names the client and
              the brief is what a sighted reader takes (U2 — "said twice" is
              this surface's defect, and hidden text is a box that clips by
              design in every band walk). */}
          <p className="sh-dos__lede">{d.lede}</p>
          <dl className="sh-dos__status">
            {d.status.map((s) => (
              <div className="sh-dos__reading" key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {d.configuration ? (
          <div className="sh-dos__board">
            <SheetConfiguration config={d.configuration} client={d.designation.name} />
          </div>
        ) : null}
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
    </article>
  );
}
