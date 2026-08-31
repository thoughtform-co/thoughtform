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

/* ⚠ THE FIGURE IS A TAB, AND THAT IS WHAT DELETES THE DOSSIER SEAT (owner,
   2026-08-31). The shipped phone layout stacks identity → figure → rail →
   modes → a fixed dossier seat, and the seat is the problem: it takes a
   fixed slice of a phone screen so the figure gets what is left and the
   reading gets a box. Making the avatar the FIRST STOP means one area
   serves both — the hologram at full generosity on its own tab, the record
   at full generosity on the others — and nothing needs a reserved seat.

   RECORD is two panels (facts + press) because those are one reading; SCOPE
   and TRANSMISSION are one each. The desktop shows all four at once and has
   no use for this state at all, which is why it is CSS that decides whether
   the tabs mean anything (ADR-083: keep every node mounted, phone
   visibility is a stylesheet decision). */
/* ⚠ THE FIGURE STOP IS A MARK, THE OTHER THREE ARE WORDS, AND THAT IS THE
   POINT (owner, 2026-08-31: "do we need those tabs above if we have
   corresponding avatars at the bottom?"). They were never redundant — the
   band picks WHICH ERA, the row picks WHAT YOU READ about it — but both were
   drawn as a full-width row of equal cells with a gold active state, so they
   rhymed and read as one control said twice. Setting the figure apart as a
   glyph breaks that: a mark beside three words is plainly not another row of
   stops, and the three words are then unambiguously READINGS.

   ⚠ SELECTING AN ERA DOES NOT RESET THE VIEW, deliberately. The tighter
   version of this idea was to drop the figure stop entirely and let the band
   mean "show me this era's figure" — but then switching era while reading
   RECORD would throw the reading away, and comparing the same reading across
   eras is the thing a five-stop band is FOR. The band changes who, the row
   changes what, and the glyph is the standing way back. */
const MOBILE_READINGS = ["record", "scope", "transmission"] as const;
type MobileTab = "figure" | (typeof MOBILE_READINGS)[number];

/**
 * The figure mark: a standing figure over its projector plane, on the
 * particle-icon grammar (`thoughtform-design/references/particle-icon-grammar.md`)
 * — rect-only, a 7×7 grid at integer cells, no text node, no pictogram.
 * The DISC carries the signal because the disc is the gold object on the real
 * stage; the body is skeleton. 14px is the grammar's compact rung, and the
 * 2× viewBox keeps every edge on a device pixel.
 */
function FigureGlyph() {
  return (
    <svg className="vdl__tab__glyph" viewBox="0 0 7 7" width="14" height="14" aria-hidden="true">
      {/* head · shoulders · torso · legs — the skeleton. ⚠ A WHOLE CELL OF
          AIR UNDER THE HEAD: packed into consecutive rows the five rects
          merge into one blob at 14px and the figure stops being readable as
          a figure. */}
      <rect className="vdl__tab__sk" x="3" y="0" width="1" height="1" />
      <rect className="vdl__tab__sk" x="2" y="2" width="3" height="1" />
      <rect className="vdl__tab__sk" x="3" y="3" width="1" height="1" />
      <rect className="vdl__tab__sk" x="2" y="4" width="1" height="1" />
      <rect className="vdl__tab__sk" x="4" y="4" width="1" height="1" />
      {/* the projector plane — the signal */}
      <rect className="vdl__tab__sig" x="1" y="6" width="5" height="1" />
    </svg>
  );
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
  /* ⚠ NULL UNTIL TOUCHED, because an inline style beats every stylesheet
     rule including a media query. Seeded at 64 the knob wrote
     `--vdl-chip: 64px` onto the root on first paint and the phone rung's own
     `clamp(44px, 13vw, 56px)` never applied — the band rendered at desktop
     size on a 375px screen, which is the exact thing the slider exists to
     let the owner judge. A lab knob may not defeat the default it is there
     to explore. */
  const [chip, setChip] = useState<number | null>(null);
  const [rail, setRail] = useState(0.12);
  const [bust, setBust] = useState(0.34);
  const [tab, setTab] = useState<MobileTab>("figure");
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

  /* ⚠ A TRANSMISSION IS A REAL RECORD, NEVER A PLACEHOLDER. Reset during the
     deliberate selection event rather than repairing state in an effect: the
     target era is known here, so the reader never sees an empty active tab
     (the production rule in `HoloEraPanels.selectEra`). */
  const pick = (i: number) => {
    const next = CHARACTER_ERAS[i];
    if (tab === "transmission" && !next?.film) setTab("record");
    setEraIdx(i);
    setEpoch((e) => e + 1);
  };

  return (
    <main
      className="vdl"
      style={
        {
          ...(chip === null ? null : { "--vdl-chip": `${chip}px` }),
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
          <span className="vdl__lbl">chip {chip === null ? "auto" : `${chip}px`}</span>
          <input
            type="range"
            min={44}
            max={120}
            step={2}
            value={chip ?? 64}
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

      <section className="vdl__sheet" data-vdl-era={era.id} data-vdl-tab={tab}>
        <header className="vdl__mast">
          <p className="vdl__mast__kicker">
            <span>{eraPositionLabel(eraIdx)}</span>
            <span>{era.year}</span>
          </p>
          <h1 className="vdl__mast__title">{era.wardrobe}</h1>
        </header>

        {/* ── THE TAB ROW (phone only) ─────────────────────────────────
            Four slim text stops on one line, divided by hairline ticks and
            bounded above and below by full-width rules — the SAME datum
            grammar the desktop rails use, one scale down, so the two
            breakpoints read as one instrument rather than two designs.
            No icon chits: they were the heaviest thing on the phone mockup
            and this row has to be the quietest. */}
        <nav className="vdl__tabs" aria-label="Era view">
          {/* The mark, outside the word group. Its accessible name is spoken
              because a glyph has none — the visual differentiation may not
              cost a screen reader the label. */}
          <button
            type="button"
            className="vdl__tab vdl__tab--figure"
            data-on={tab === "figure"}
            aria-pressed={tab === "figure"}
            aria-label="Figure"
            onClick={() => setTab("figure")}
          >
            <FigureGlyph />
          </button>

          {MOBILE_READINGS.map((t) => {
            const unavailable = t === "transmission" && !era.film;
            return (
              <button
                key={t}
                type="button"
                className="vdl__tab"
                data-on={t === tab}
                aria-pressed={t === tab}
                disabled={unavailable}
                onClick={() => setTab(t)}
              >
                {t}
                {unavailable ? <span className="vdl__tab__note">no film</span> : null}
              </button>
            );
          })}
        </nav>

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
