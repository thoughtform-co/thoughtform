"use client";

import { Suspense, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import { CHARACTER_ERAS, type CharacterEra } from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, vwPlain } from "@/lib/voidwalker/voidwalkerData";

import { EraModelViewer } from "./EraModelViewer";

/**
 * The lab's shell: one column, six era cards, a preflight strip at the
 * top. Each card mirrors the production stage viewport's chrome
 * (`.ch-viewport`) so what the lab shows is what the site will show.
 *
 * The mesh viewer inside each card is the ONE piece of WebGL on this
 * route (deliberately — the lab is about the CHARACTER STAGE, not the
 * corridor around it).
 */
export function CharacterStageLab() {
  const [selected, setSelected] = useState<string>(CHARACTER_ERAS[0]!.id);

  return (
    <main className="avatar-lab">
      <header className="avatar-lab__head">
        <h1>Voidwalker avatar lab</h1>
        <p>
          Six eras of Vince as the ADR-082 character stage will render them. Stills come from{" "}
          <code>public/images/voidwalker/</code>; models from <code>public/models/voidwalker/</code>
          . Missing model = the still is the surface (the production fallback).
        </p>
      </header>

      <Preflight />

      <ol className="avatar-lab__eras">
        {CHARACTER_ERAS.map((era) => {
          const beat = VOIDWALKER_BEATS.find((b) => b.id === era.beatId);
          const active = selected === era.id;
          return (
            <li key={era.id} className="avatar-lab__card" data-active={active || undefined}>
              <button
                type="button"
                className="avatar-lab__card-header"
                onClick={() => setSelected(era.id)}
                aria-expanded={active}
              >
                <span className="avatar-lab__ord">
                  {String(CHARACTER_ERAS.findIndex((e) => e.id === era.id) + 1).padStart(2, "0")}
                </span>
                <span className="avatar-lab__year">{era.year}</span>
                <span className="avatar-lab__title">{era.wardrobe}</span>
                <span className="avatar-lab__motto">{era.motto}</span>
              </button>

              {active ? <ActiveCard era={era} beat={beat} /> : null}
            </li>
          );
        })}
      </ol>
    </main>
  );
}

function ActiveCard({
  era,
  beat,
}: {
  era: CharacterEra;
  beat: ReturnType<typeof VOIDWALKER_BEATS.find>;
}) {
  return (
    <div className="avatar-lab__card-body">
      <div className="avatar-lab__stage">
        <div className="ch-viewport" data-lab-viewport>
          <div className="ch-viewport__frame" aria-hidden="true">
            <span className="ch-viewport__bracket ch-viewport__bracket--tl" />
            <span className="ch-viewport__bracket ch-viewport__bracket--tr" />
            <span className="ch-viewport__bracket ch-viewport__bracket--bl" />
            <span className="ch-viewport__bracket ch-viewport__bracket--br" />
          </div>
          {/* Still layer — always present. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="ch-viewport__still"
            src={era.stillPath}
            alt={`${era.wardrobe} · ${era.year}`}
            loading="lazy"
            draggable={false}
          />
          {/* Model layer — only if a GLB is registered. */}
          {era.modelPath ? (
            <Suspense fallback={null}>
              <EraModelViewer modelPath={era.modelPath} />
            </Suspense>
          ) : null}
          <div className="ch-viewport__hud" aria-hidden="true">
            <span className="ch-viewport__hud-tag">CHARACTER · {era.short.toUpperCase()}</span>
            <span className="ch-viewport__hud-year">{era.year}</span>
          </div>
        </div>
      </div>

      <div className="avatar-lab__copy">
        <dl>
          <dt>Wardrobe</dt>
          <dd>{era.wardrobe}</dd>
          <dt>Loadout</dt>
          <dd>{era.loadout}</dd>
          <dt>Beat</dt>
          <dd>{beat ? plainTitle(beat.title) : era.beatId}</dd>
          <dt>Still</dt>
          <dd>
            <code>{era.stillPath}</code>
          </dd>
          <dt>Model</dt>
          <dd>
            {era.modelPath ? <code>{era.modelPath}</code> : <em>none — still is the surface</em>}
          </dd>
        </dl>
        {beat ? (
          <p className="avatar-lab__prose" style={{ marginTop: "16px" } as CSSProperties}>
            {vwPlain(beat.body)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Preflight() {
  const rows = useMemo(
    () =>
      CHARACTER_ERAS.map((e) => ({
        id: e.id,
        year: e.year,
        still: e.stillPath,
        model: e.modelPath,
      })),
    []
  );
  return (
    <section className="avatar-lab__preflight" aria-label="Preflight">
      <table>
        <thead>
          <tr>
            <th>era</th>
            <th>year</th>
            <th>still</th>
            <th>model</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <code>{r.id}</code>
              </td>
              <td>{r.year}</td>
              <td>
                <code>{r.still}</code>
              </td>
              <td>{r.model ? <code>{r.model}</code> : <span aria-label="missing">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function plainTitle(segments: readonly (string | { em: string } | { mark: string })[]): string {
  return segments.map((s) => (typeof s === "string" ? s : "em" in s ? s.em : s.mark)).join("");
}
