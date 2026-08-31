"use client";

import { useEffect, useMemo, useState } from "react";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import { HoloFigure } from "@/components/landing/home-v2/voidwalker/hologram/HoloFigure";
import { eraPositionLabel } from "@/components/landing/home-v2/voidwalker/hologram/HoloEraPanels";
import {
  CHARACTER_ERAS,
  eraPressBeatIds,
  resolveCharacterEraHologram,
  type CharacterEra,
  type CharacterEraHologram,
} from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, vwPlain, type VwPress } from "@/lib/voidwalker/voidwalkerData";

/**
 * DatumLabShell — look-dev for the era stage's D2 "DATUM RAILS" direction
 * (the wave-2 mockup the owner picked, 2026-08-31).
 *
 * ⚠ THE WHOLE IDEA IS THAT NOTHING IS DRAWN TO THE FIGURE. Wave 1's A4 tied
 * each panel to the figure with a leader line landing on a shoulder or a
 * knee, and the owner's read was that the line CLAIMS a relationship the
 * record does not have — "it implies scope is linked to my shoulder, and
 * that's not really the case". So the connection here is made by SHARED
 * STRUCTURE instead: two construction rails run the full width behind the
 * figure and every panel head sits ON one of them, plus a ground datum
 * extending from the projector disc. Alignment carries what a leader line
 * was claiming, and it claims nothing false.
 *
 * ⚠ THE HEADS AND BODIES ARE SEPARATE GRID ITEMS, and that is what makes the
 * rails exact. If a panel were one item spanning both rows, its head's
 * underline would land wherever its own box put it and the rail behind it
 * would be a few pixels off — the kind of near-miss this surface has shipped
 * before. Head in the head row, body in the body row, rail spanning 1/-1 in
 * the head row with `align-self: end`: the three share a boundary by
 * construction rather than by tuning.
 *
 * ⚠ THIS IS A LAB. The projector base is a DOM mock (in production the site's
 * own brandmark flattens and descends into that position), era switching is a
 * click rather than the scroll clock, and the knob bar never ships. The
 * PANELS, the rails and the chip band are what is meant to graduate.
 *
 * ⚠ THE ERA BUSTS ARE A STAND-IN. Only `azeroth` has an authored hologram
 * today; every other era resolves to `CANONICAL_CHARACTER_ERA_HOLOGRAM`, so
 * four of the five chips are crops of the same poster. Per-era portraits are
 * the voidwalker-avatar pipeline's job and the band is built to take them
 * without a layout change.
 */

/** The one number a chip needs from its era: where that asset's head starts.
 *
 *  The crop is solved in CSS (see `.vdl__chip__bust`) from the chip size, the
 *  span and this anchor, so the only thing that varies per era is the anchor
 *  itself — Azeroth's 0.2352 against the canonical 0.122 is a 130px
 *  difference on the source frame, and cropping both the same way puts one
 *  era's chin where another's eyes are. */
function bustHeadAnchor(hologram: CharacterEraHologram): number {
  return hologram.headY;
}

function PressItem({ press }: { press: VwPress }) {
  const year = press.date ? press.date.slice(0, 4) : null;
  const body = (
    <>
      <span className="vdl__press__meta">
        <span className="vdl__press__outlet">{press.outlet}</span>
        {year ? <span className="vdl__press__year">{year}</span> : null}
      </span>
      <span className="vdl__press__headline">{press.headline}</span>
    </>
  );
  if (!press.href) return <div className="vdl__press">{body}</div>;
  return (
    <a className="vdl__press" href={press.href} target="_blank" rel="noreferrer noopener">
      {body}
    </a>
  );
}

export function DatumLabShell() {
  /* Azeroth: the only era with its own authored hologram, and the subject of
     every mockup in the pass — so the lab opens where the review left off. */
  const [eraIdx, setEraIdx] = useState(2);
  const [epoch, setEpoch] = useState(0);
  const [chip, setChip] = useState(64);
  const [rail, setRail] = useState(0.12);
  const [bust, setBust] = useState(0.34);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const era: CharacterEra = CHARACTER_ERAS[eraIdx] ?? CHARACTER_ERAS[0];
  const hologram = resolveCharacterEraHologram(era);
  const beat = VOIDWALKER_BEATS.find((b) => b.id === era.beatId);
  const facts = era.facts ?? [];

  /* Every press card this era speaks for — its own beat by default, plus the
     2016–18 beats with no era of their own (the production accessor). */
  const press = useMemo(() => {
    const byId = new Map(VOIDWALKER_BEATS.map((b) => [b.id, b]));
    return eraPressBeatIds(era)
      .map((id) => byId.get(id)?.press)
      .filter((p): p is VwPress => Boolean(p));
  }, [era]);

  const { watching, open, close } = useWalkthrough();

  const pick = (i: number) => {
    setEraIdx(i);
    setEpoch((e) => e + 1);
  };

  return (
    <main
      className="vdl"
      style={
        {
          "--vdl-chip": `${chip}px`,
          "--vdl-rail": rail,
          "--vdl-bust-span": bust,
        } as React.CSSProperties
      }
    >
      <div className="vdl__bar">
        <div className="vdl__grp">
          <span className="vdl__lbl">Era</span>
          {CHARACTER_ERAS.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className="vdl__btn"
              data-on={i === eraIdx}
              onClick={() => pick(i)}
            >
              {e.short}
            </button>
          ))}
        </div>

        <label className="vdl__slider">
          <span className="vdl__lbl">chip {chip}px</span>
          <input
            type="range"
            min={44}
            max={120}
            step={2}
            value={chip}
            onChange={(ev) => setChip(+ev.target.value)}
          />
        </label>

        <label className="vdl__slider">
          <span className="vdl__lbl">bust {bust.toFixed(2)}</span>
          <input
            type="range"
            min={0.16}
            max={0.9}
            step={0.02}
            value={bust}
            onChange={(ev) => setBust(+ev.target.value)}
          />
        </label>

        <label className="vdl__slider">
          <span className="vdl__lbl">rail {rail.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.01}
            value={rail}
            onChange={(ev) => setRail(+ev.target.value)}
          />
        </label>

        <button
          type="button"
          className="vdl__btn vdl__btn--go"
          onClick={() => setEpoch((e) => e + 1)}
        >
          Materialize
        </button>
      </div>

      <section className="vdl__sheet" data-vdl-era={era.id}>
        <header className="vdl__mast">
          <p className="vdl__mast__kicker">
            <span>{eraPositionLabel(eraIdx)}</span>
            <span>{era.year}</span>
          </p>
          <h1 className="vdl__mast__title">{era.wardrobe}</h1>
        </header>

        <div className="vdl__stage">
          {/* THE TWO CONSTRUCTION RAILS. Full width, edge to edge, passing
              behind the figure — the shared structure that replaces wave 1's
              leader lines. Each sits on the bottom edge of a head row, which
              is where every head's own rule already is. */}
          <div className="vdl__rail" data-rail="upper" aria-hidden="true" />
          <div className="vdl__rail" data-rail="lower" aria-hidden="true" />

          {/* ── UPPER LEFT · SCOPE ─────────────────────────────────── */}
          <p className="vdl__head" data-cell="ul">
            <span className="vdl__head__kicker">Scope</span>
          </p>
          <div className="vdl__body" data-cell="ul">
            <p className="vdl__motto">{era.motto}</p>
            <p className="vdl__prose">{beat ? vwPlain(beat.body) : era.motto}</p>
          </div>

          {/* ── UPPER RIGHT · FACTS ────────────────────────────────── */}
          <p className="vdl__head" data-cell="ur">
            <span className="vdl__head__kicker">Facts</span>
            <span className="vdl__head__tag">{era.short}</span>
          </p>
          <div className="vdl__body" data-cell="ur">
            <dl className="vdl__facts">
              {facts.map((f) => (
                <div className="vdl__facts__row" key={f.k}>
                  <dt className="vdl__facts__k">{f.k}</dt>
                  <dd className="vdl__facts__v">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── LOWER LEFT · TRANSMISSION ──────────────────────────── */}
          <p className="vdl__head" data-cell="ll">
            <span className="vdl__head__kicker">Transmission</span>
            {era.film?.duration ? (
              <span className="vdl__head__tag">{era.film.duration}</span>
            ) : null}
          </p>
          <div className="vdl__body" data-cell="ll">
            {era.film ? (
              <button
                type="button"
                className="vdl__film"
                onClick={(e) => open(e.currentTarget)}
                aria-haspopup="dialog"
                aria-label={`Play: ${era.film.title}`}
              >
                <span className="vdl__film__frame">
                  <img
                    className="vdl__film__poster"
                    src={era.film.poster}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="vdl__film__play" aria-hidden="true" />
                </span>
                <span className="vdl__film__title">{era.film.title}</span>
              </button>
            ) : (
              /* An absent film is a real reading, not an empty slot: the
                 placeholder says so in the record's own register. */
              <div className="vdl__film-empty">
                <span className="vdl__film-empty__frame" aria-hidden="true" />
                <span className="vdl__film-empty__note">No film on record</span>
              </div>
            )}
          </div>

          {/* ── LOWER RIGHT · ON RECORD ────────────────────────────── */}
          <p className="vdl__head" data-cell="lr">
            <span className="vdl__head__kicker">On record</span>
            {press.length > 0 ? (
              <span className="vdl__head__tag">
                {String(press.length).padStart(2, "0")} {press.length === 1 ? "item" : "items"}
              </span>
            ) : null}
          </p>
          <div className="vdl__body" data-cell="lr">
            <div className="vdl__press-stack">
              {press.map((p) => (
                <PressItem key={`${p.outlet}-${p.headline.slice(0, 24)}`} press={p} />
              ))}
            </div>
          </div>

          {/* ── THE FIGURE ─────────────────────────────────────────────
              `.vwh` carries the token block and `.vwh__slot`'s masked floor;
              the lab sheet flattens its grid so `.vwh__column` simply fills
              this cell. ⚠ NEVER `data-vwh-ready` here — the slot would take
              `opacity: var(--vwh-morph, 0)` and vanish. */}
          <div className="vdl__figure">
            <div className="vwh vdl__vwh" data-vwh-era={era.id}>
              <div className="vwh__column" data-vwh-region="figure">
                <HoloFigure
                  hologram={hologram}
                  epoch={epoch}
                  form="emissive"
                  blend="plus-lighter"
                  alpha={0.92}
                  scanPitch={3}
                  glow={1}
                  reduced={reduced}
                />
                {/* ⚠ MOCK. In production the brandmark itself descends into
                    this position — the base is not a graphic we draw. */}
                <div className="vwh__base" data-vwh-region="platform" aria-hidden="true">
                  <span className="vwh__base__disc" />
                  <span className="vwh__base__ring" />
                  <span className="vwh__base__glow" />
                </div>
              </div>
            </div>
          </div>

          {/* THE GROUND DATUM — the projector's own plane, extended edge to
              edge. The figure column ends on this line, so the disc sits on
              it rather than floating above a drawn rule. */}
          <div className="vdl__ground" aria-hidden="true" />
        </div>

        {/* ── THE ERA BAND ─────────────────────────────────────────────
            Five hairline-framed chips, the year lettered inside the top-left
            corner and the name beneath the bust. The active chip takes gold
            on its frame, its name and a filled diamond; its siblings keep
            cream frames and desaturated busts. Selection is elaboration and
            colour together here because the chip is the control, not a card
            in a set. */}
        <nav className="vdl__band" aria-label="Era">
          {CHARACTER_ERAS.map((item, i) => {
            const active = i === eraIdx;
            const bust = resolveCharacterEraHologram(item);
            return (
              <button
                key={item.id}
                type="button"
                className="vdl__chip"
                data-on={active}
                aria-current={active ? "true" : undefined}
                aria-label={`${item.year} — ${item.wardrobe}`}
                onClick={() => pick(i)}
              >
                <span className="vdl__chip__frame">
                  <img
                    className="vdl__chip__bust"
                    src={bust.posterPath}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ "--bust-head": bustHeadAnchor(bust) } as React.CSSProperties}
                  />
                  <span className="vdl__chip__year">{item.year}</span>
                </span>
                <span className="vdl__chip__name">{item.short}</span>
                <span className="vdl__chip__mark" aria-hidden="true" />
              </button>
            );
          })}
        </nav>
      </section>

      {watching && era.film ? (
        <MediaLightbox
          embed={{
            src: `https://www.youtube-nocookie.com/embed/${era.film.youtubeId}?autoplay=1&rel=0`,
            title: era.film.title,
          }}
          label={era.film.title}
          meta={era.year}
          onClose={close}
        />
      ) : null}
    </main>
  );
}
