"use client";

import type { CaseMapDistrict, CaseMapShape, CaseSkillEntry } from "@/lib/cases/types";

import {
  PDA_PHONE_VIEW,
  type PdaView,
  type PdaWork,
  type pdaTotals,
  phoneConfiguration,
  phoneLayer,
} from "./pdaRecord";

/**
 * PdaPhoneReadings — the map's three readings as LISTS, for the rung that
 * hides the console (≤980px and reduced motion; ADR-107 U2).
 *
 * The console draws WORK · CONFIGURATION · LAYER as three instruments, and on
 * a phone none of them letters above the type floor, so `pda.css` hides the
 * console and shows a fallback instead. That fallback was ONE list — the
 * stream index — whatever the rail said: the rail is portalled into the proof
 * card's head, a tap changed `view`, and nothing visible followed (the owner,
 * 2026-09-25: "click on the tabs, it doesn't show the individual contents").
 * A fallback that ignores the control it sits under is a control nobody can
 * press. Three lists now, keyed on the same `view` the rail selects:
 *
 *   01 THE WORK          — the stream index by team (as before).
 *   02 THE CONFIGURATION — one row per stream: what runs it, what it can
 *                          reach, where it runs — the R4 board's own answers
 *                          (`pdaRecord.phoneConfiguration`); person-led
 *                          streams say so in one line.
 *   03 THE LAYER         — the five shapes, each with its sentence
 *                          (`meaning`, the map's only prose) and the Skills
 *                          encoded on it as a run of the roster's own short
 *                          labels, the first encode leading.
 *
 * ⚠ NO SKILL COUNT PER SHAPE. The hub ruling (ADR-070 U28 / U36) is not
 * geometric: a run of labels is countable, and a numeral beside it is the
 * surface saying the same thing twice. The record's total stays on the foot.
 * ⚠ NO ORDINALS (ADR-066): `footCopy`'s `01 ·` titles never print. PT Mono
 * chrome at the list's own rungs; the sentence in PP Neue Montreal.
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
  districts: readonly CaseMapDistrict[];
  shapes: readonly CaseMapShape[];
  skills: readonly CaseSkillEntry[];
  totals: ReturnType<typeof pdaTotals>;
  foot: { title: string; body: string };
}

export function PdaPhoneReadings({ view, shown, districts, shapes, skills, totals, foot }: Props) {
  return (
    <div className="fl-pda__list" data-pda-phone-view={PDA_PHONE_VIEW[view]}>
      {view === 1 ? (
        <>
          <div className="fl-pda__list-head">
            <span>Index · streams by team</span>
            <span>{`${shown.length} / ${totals.modules}`}</span>
          </div>
          {districts.map((d) => {
            const rows = shown.filter((w) => w.team === d.id);
            if (!rows.length) return null;
            return (
              <section className="fl-pda__list-group" key={d.id}>
                <h4>{d.name}</h4>
                {rows.map((w) => (
                  <div
                    className="fl-pda__list-row"
                    key={w.id}
                    data-person={w.configured ? undefined : ""}
                  >
                    <i aria-hidden="true">{w.configured ? "◆" : "○"}</i>
                    <span>{w.title}</span>
                    <em>{w.lane}</em>
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
      {view === 3 ? (
        <>
          <div className="fl-pda__list-head">
            <span>The layer</span>
            <span>{`${totals.skills} Skills`}</span>
          </div>
          {phoneLayer(shapes, skills).map((s) => (
            <section className="fl-pda__shape" key={s.key} data-pda-shape={s.key}>
              <h4>{s.name}</h4>
              <p className="fl-pda__shape-meaning">{s.meaning}</p>
              <ul className="fl-pda__shape-skills">
                {s.skills.map((k) => (
                  <li
                    className="fl-pda__shape-skill"
                    key={k.id}
                    data-flagship={k.flagship ? "" : undefined}
                  >
                    {k.short}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : null}
      <p className="fl-pda__list-foot">{foot.body}</p>
    </div>
  );
}
