import type { CSSProperties } from "react";

import type { SheetAxisWindow, SheetSection, SheetSpan } from "@/lib/sheet/types";

import { SheetReadout } from "./SheetParts";

type Monitor = Extract<SheetSection, { kind: "monitor" }>;

/** The two windows, in the order the knob names them. */
const WINDOWS = ["active", "full"] as const;

/** Both positions of one thing on the axis, for `.sh-t` to pick from. */
function tStyle(at: SheetSpan<number>, extra: Record<string, string | number> = {}) {
  return { "--t-active": at.active, "--t-full": at.full, ...extra } as CSSProperties;
}

/** The standing's glyph — the key and every mark draw the same one. */
function Glyph({ standing }: { standing: string }) {
  return <span className="sh-mon__glyph" data-standing={standing} aria-hidden="true" />;
}

/**
 * SheetMonitor — the instrument's first frame (ADR-118).
 *
 * ONE chamfered housing, exactly as tall as the rails, so every horizontal
 * inside it terminates on its own edge: a datum strip it hangs from, four
 * unequal readout cells, a plot on a DOM graticule, and a terminus strip it
 * sits on. Every string is the section's data; the only chrome lettered here
 * is the key's two words and the scale's two labels.
 *
 * ⚠ THE GRATICULE IS DOM, NEVER AN SVG `viewBox`. A crop fits by `meet` and
 * letterboxes whichever axis is slack — at 1920 × 1247 the plot is 1040 × 749,
 * no aspect a drawing could hold at both ends of the desktop range. Division
 * lines, lanes and marks are boxes placed by fraction, so the plot fills
 * whatever the housing gives it.
 *
 * ⚠ BOTH WINDOWS ARE RENDERED. `span` is a knob, and a knob is an attribute
 * the client may flip after mount (`?k=SG`), so every positioned thing carries
 * `--t-active` and `--t-full` and `.sh-t` picks one; the ticks and the scale
 * carry `data-window` and CSS shows one set.
 */
export function SheetMonitor({ section }: { section: Monitor }) {
  const { datum, identity, cells, plot, terminus, lit } = section;
  const hasRunning = plot.marks.some((m) => m.standing === "running");
  return (
    <section
      id={section.id}
      className="sh-sec sh-sec--monitor"
      data-sh-arrangement="monitor"
      aria-label={section.ariaLabel ?? section.menuLabel ?? undefined}
    >
      <div className="sh-mon sh-ap-root">
        <div className="sh-mon__in">
          <header className="sh-mon__datum sh-ap" style={{ "--ap-i": 0 } as CSSProperties}>
            <p className="sh-mon__name">{datum.name}</p>
            <Readings rows={datum.readings} />
          </header>

          <div className="sh-mon__cells">
            <div
              className="sh-mon__cell sh-mon__cell--id sh-ap"
              style={{ "--ap-i": 1 } as CSSProperties}
            >
              <h1 className="sh-mon__title">{identity.name}</h1>
              <p className="sh-mon__lede">{identity.lede}</p>
            </div>
            {cells.map((cell, i) => (
              <div
                key={cell.id}
                className="sh-mon__cell sh-ap"
                data-cell={cell.id}
                style={{ "--ap-i": i + 2 } as CSSProperties}
              >
                <p className="sh-mon__cell-label">{cell.label}</p>
                <SheetReadout rows={cell.rows} className="sh-mon__readout" />
              </div>
            ))}
          </div>

          <div
            className="sh-mon__plot sh-ap"
            style={{ "--ap-i": cells.length + 2, "--lanes": plot.lanes.length } as CSSProperties}
          >
            <div className="sh-mon__title-row">
              <ul className="sh-mon__key" aria-label="Key">
                <li>
                  <Glyph standing="proposed" />
                  Proposal out
                </li>
                {hasRunning ? (
                  <li>
                    <Glyph standing="running" />
                    <span className="sh-mon__tail" aria-hidden="true" />
                    In progress
                  </li>
                ) : null}
                <li>
                  <Glyph standing="shipped" />
                  Delivered
                </li>
              </ul>
              <p className="sh-mon__scale">
                {WINDOWS.map((w) => (
                  <span key={w} data-window={w}>
                    <span className="sh-mon__scale-k">Division</span>{" "}
                    {plot.windows[w].divisionLabel}
                    <span className="sh-mon__scale-sep" aria-hidden="true" />
                    <span className="sh-mon__scale-k">Range</span> {plot.windows[w].rangeLabel}
                  </span>
                ))}
              </p>
            </div>

            <div className="sh-mon__field">
              <div className="sh-mon__grid" aria-hidden="true">
                {WINDOWS.map((w) => (
                  <Divisions key={w} window={plot.windows[w]} which={w} />
                ))}
                <span className="sh-mon__now sh-t" style={tStyle(plot.now.at)} />
              </div>

              <ol className="sh-mon__lanes">
                {plot.lanes.map((lane) => {
                  const marks = plot.marks.filter((m) => m.lane === lane.id);
                  return (
                    <li key={lane.id} className="sh-mon__lane" data-lane={lane.id}>
                      <span className="sh-mon__lane-name">{lane.name}</span>
                      <div className="sh-mon__track">
                        {lane.since && marks[0] ? (
                          <>
                            <span className="sh-mon__since">Since {lane.since}</span>
                            <span
                              className="sh-mon__run sh-mon__run--since sh-t"
                              style={tStyle(marks[0].at)}
                              aria-hidden="true"
                            />
                          </>
                        ) : null}
                        {marks.map((m) =>
                          m.standing === "running" ? (
                            <span
                              key={`${m.id}-run`}
                              className="sh-mon__run sh-mon__run--open sh-t"
                              style={tStyle(m.at, {
                                "--now-active": plot.now.at.active,
                                "--now-full": plot.now.at.full,
                              })}
                              aria-hidden="true"
                            />
                          ) : null
                        )}
                        {marks.map((m) =>
                          m.sections ? (
                            <span
                              key={`${m.id}-dots`}
                              // A twin stepped below the rule keeps its dots below it too.
                              className={`sh-mon__dots sh-t${(m.slot ?? 0) > 0 ? " is-below" : ""}`}
                              style={tStyle(m.at, { "--slot": m.slot ?? 0 })}
                              aria-hidden="true"
                            >
                              {Array.from({ length: m.sections }, (_, i) => (
                                <i key={i} />
                              ))}
                            </span>
                          ) : null
                        )}
                        {marks.map((m) => (
                          <a
                            key={m.id}
                            href={m.href}
                            className={`sh-mon__mark sh-t${m.id === lit ? " is-lit" : ""}`}
                            data-id={m.id}
                            data-standing={m.standing}
                            aria-label={m.label}
                            style={tStyle(m.at, { "--slot": m.slot ?? 0 })}
                          />
                        ))}
                      </div>
                      <span className="sh-mon__lane-reading">{lane.reading}</span>
                    </li>
                  );
                })}
              </ol>

              <div className="sh-mon__ticks" aria-hidden="true">
                {WINDOWS.map((w) =>
                  plot.windows[w].ticks
                    .filter((t) => t.label)
                    .map((t) => (
                      <span
                        key={`${w}-${t.at}`}
                        className="sh-mon__tick"
                        data-window={w}
                        style={{ "--at": t.at } as CSSProperties}
                      >
                        {t.label}
                      </span>
                    ))
                )}
                <span className="sh-mon__now-label sh-t" style={tStyle(plot.now.at)}>
                  {plot.now.label}
                </span>
              </div>
            </div>
          </div>

          <footer
            className="sh-mon__terminus sh-ap"
            style={{ "--ap-i": cells.length + 3 } as CSSProperties}
          >
            <Readings rows={terminus} />
          </footer>
        </div>
      </div>
    </section>
  );
}

/** A strip's readings: label dim, value lit, on one line. */
function Readings({ rows }: { rows: readonly { label: string; value: string }[] }) {
  return (
    <dl className="sh-mon__readings">
      {rows.map((r) => (
        <div key={r.label} className="sh-mon__reading">
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One window's division lines, dotted: every boundary but the first (the
 * plot's own wall) and the last — the division that holds today gives NOW its
 * line as it gives NOW its label (`lib/sheet/axis.ts`), or a dotted line sits a
 * few pixels from the cursor and reads as a doubled one.
 */
function Divisions({ window, which }: { window: SheetAxisWindow; which: "active" | "full" }) {
  return (
    <>
      {window.ticks.slice(1, -1).map((t) => (
        <span
          key={t.at}
          className="sh-mon__div"
          data-window={which}
          style={{ "--at": t.at } as CSSProperties}
        />
      ))}
    </>
  );
}
