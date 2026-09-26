"use client";

import type { CaseMapStream } from "@/lib/cases/types";

import {
  PDA_PHONE_VIEW,
  type PdaView,
  type PdaWork,
  type pdaTotals,
  phoneConfiguration,
} from "./pdaRecord";

/**
 * PdaPhoneReadings — the map's readings as LISTS, for the rung that hides the
 * console (≤980px and reduced motion; ADR-107 U2).
 *
 * The console draws WORK · CONFIGURATION as two instruments, and on a phone
 * neither letters above the type floor, so `pda.css` hides the console and
 * shows a fallback instead. That fallback was ONE list — the stream index —
 * whatever the rail said: the rail is portalled into the proof card's head, a
 * tap changed `view`, and nothing visible followed (the owner, 2026-09-25:
 * "click on the tabs, it doesn't show the individual contents"). A fallback
 * that ignores the control it sits under is a control nobody can press. Two
 * lists now (three until ADR-126 took the layer off the rail), keyed on the
 * same `view` the rail selects:
 *
 *   01 THE WORK          — the marketing estate by workstream, each row's
 *                          run mode where the desktop letters a group head.
 *   02 THE CONFIGURATION — one row per stream: what runs it, what it can
 *                          reach, where it runs — the R4 board's own answers
 *                          (`pdaRecord.phoneConfiguration`); person-led
 *                          streams say so in one line.
 *
 * ⚠ NO ORDINALS (ADR-066): `footCopy`'s `01 ·` titles never print. PT Mono
 * chrome at the list's own rungs.
 *
 * ⚠ THE FALLBACK CARRIES NO RAIL OF ITS OWN. The first cut rendered a second
 * `ConsoleRail` here for the hosts that portal nothing out (the arcs, the
 * casefile under reduced motion) — and `ConsoleFrame` renders its fallback
 * in the DOM on every rung, so the desktop arcs carried SIX `.fl-con__stn`
 * behind a `display: none` list and `arc-portfolio-smoke`'s "the three
 * readings" went red (a hidden duplicate tablist is also two sets of tabs
 * to a screen reader). On the proof card the rail is the portalled one
 * (`railHost`), which is the surface this fixes; the arcs' ≤980 fallback has
 * no rail, exactly as before — recorded open at ADR-107 U2.
 */

interface Props {
  view: PdaView;
  shown: readonly PdaWork[];
  /** The record's triple — the WORK list groups by it, in its order. */
  streams: readonly CaseMapStream[];
  totals: ReturnType<typeof pdaTotals>;
  foot: { title: string; body: string };
}

export function PdaPhoneReadings({ view, shown, streams, totals, foot }: Props) {
  return (
    <div className="fl-pda__list" data-pda-phone-view={PDA_PHONE_VIEW[view]}>
      {view === 1 ? (
        <>
          <div className="fl-pda__list-head">
            <span>The work · by workstream</span>
            <span>{`${shown.length} / ${totals.modules}`}</span>
          </div>
          {streams.map((s) => {
            const rows = shown.filter((w) => w.stream === s.key);
            if (!rows.length) return null;
            return (
              <section className="fl-pda__list-group" key={s.key}>
                <h4>{s.name}</h4>
                {rows.map((w) => (
                  <div
                    className="fl-pda__list-row"
                    key={w.id}
                    data-person={w.configured ? undefined : ""}
                  >
                    <i aria-hidden="true">{w.configured ? "◆" : "○"}</i>
                    <span>{w.title}</span>
                    {/* The desktop's group head, per row: how far it runs
                        without a person. */}
                    <em>{w.runLabel}</em>
                  </div>
                ))}
              </section>
            );
          })}
        </>
      ) : null}
      {view === 2 ? (
        <>
          <div className="fl-pda__list-head">
            <span>Configured streams</span>
            <span>{`${shown.filter((w) => w.configured).length} / ${shown.length}`}</span>
          </div>
          {phoneConfiguration(shown).map((r) => (
            <div
              className="fl-pda__cfg"
              key={r.id}
              data-pda-row=""
              data-person={r.configured ? undefined : ""}
            >
              <div className="fl-pda__cfg-head">
                <i aria-hidden="true">{r.configured ? "◆" : "○"}</i>
                <span>{r.title}</span>
                <em>{r.teamName}</em>
              </div>
              {r.configured ? (
                <dl className="fl-pda__cfg-keys">
                  <div>
                    <dt>Runs</dt>
                    <dd>{r.runs}</dd>
                  </div>
                  <div>
                    <dt>Reach</dt>
                    <dd>{r.reach}</dd>
                  </div>
                  <div>
                    <dt>Where</dt>
                    <dd>{r.where}</dd>
                  </div>
                </dl>
              ) : (
                <p className="fl-pda__cfg-led">{r.runs}</p>
              )}
            </div>
          ))}
        </>
      ) : null}
      <p className="fl-pda__list-foot">{foot.body}</p>
    </div>
  );
}
