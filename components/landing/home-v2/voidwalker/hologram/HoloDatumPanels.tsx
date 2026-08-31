"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import {
  CHARACTER_ERAS,
  eraPressBeatIds,
  resolveCharacterEraHologram,
  type CharacterEraHologram,
} from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, vwPlain, type VwPress } from "@/lib/voidwalker/voidwalkerData";

import { eraPositionLabel, type HoloEraIdentityRefs } from "./HoloEraPanels";

/**
 * HoloDatumPanels — the D2 "datum rails" composition (owner's wave-2 pick,
 * 2026-08-31), behind `VOIDWALKER_DATUM_STAGE`.
 *
 * ⚠ NOTHING IS DRAWN TO THE FIGURE. Wave 1 tied each panel to the hologram
 * with a leader line landing on a shoulder or a knee, and the owner's read
 * was that the line CLAIMS a relationship the record does not have — "it
 * implies scope is linked to my shoulder, and that's not really the case".
 * The connection is made by SHARED STRUCTURE instead: two construction rails
 * run the full width behind the figure and every panel head sits ON one of
 * them, plus a ground datum extending from the projector disc. Alignment
 * carries what the leader line was claiming, and it claims nothing false.
 *
 * ⚠ THE HEADS AND BODIES ARE SEPARATE GRID ITEMS, and that is what makes the
 * rails exact. A panel spanning both rows would put its underline wherever
 * its own box landed and the rail behind it would be a near-miss; head in the
 * head row, body in the body row, rail spanning 1/-1 with `align-self: end`,
 * so the three share a boundary by construction rather than by tuning.
 *
 * ⚠ THE ERAS MOVED FROM THE HUD GUTTER TO A BAND AT THE FOOT. ADR-082 U9 put
 * the scrubber on the left rail precisely so it cost no column; this spends a
 * band on it instead, deliberately, because the owner's ruling is that the
 * selector reads as character-select on BOTH breakpoints. The gutter is left
 * empty rather than refilled.
 *
 * ⚠ THE FIGURE ARRIVES AS A NODE. `VoidwalkerHologram` still owns `HoloFigure`
 * and its materialize epoch — this composition only decides where the figure
 * sits, because on this layout it sits INSIDE the stage grid rather than
 * beside it, and the handoff target on the slot must not move house.
 *
 * ⚠ THE THREE HANDOFF TARGETS ARE LOAD-BEARING. The About→Voidwalker receiver
 * publishes `data-vw-handoff="ready"` only when `portrait` (the slot, in the
 * figure node), `dossier` (the top-left seat, SCOPE here) and `era-title` (the
 * mast heading) all measure. Losing any one silently disarms the `-120svh`
 * station overlap rather than erroring.
 */

/* ⚠ THE FIGURE STOP IS A MARK, THE OTHER THREE ARE WORDS (owner: "do we need
   those tabs above if we have corresponding avatars at the bottom?"). They
   were never redundant — the band picks WHICH ERA, the row picks WHAT YOU
   READ about it — but both were drawn as a full-width row of equal cells with
   a gold active state, so they rhymed and read as one control said twice. A
   mark beside three words is plainly not another row of stops.

   ⚠ SELECTING AN ERA DOES NOT RESET THE VIEW. The tighter version was to drop
   the figure stop and let the band mean "show me this era's figure", but
   switching era while reading RECORD would throw the reading away — and
   comparing one reading across eras is what a five-stop band is FOR. */
const MOBILE_READINGS = ["record", "scope", "transmission"] as const;
type DatumTab = "figure" | (typeof MOBILE_READINGS)[number];

/**
 * The figure mark: a standing figure over its projector plane, on the
 * particle-icon grammar — rect-only, a 7×7 grid at integer cells, the 14px
 * compact rung, no text node and no pictogram. The DISC carries the signal
 * because the disc is the gold object on the stage itself.
 */
function FigureGlyph() {
  return (
    <svg className="vwd__tab__glyph" viewBox="0 0 7 7" width="14" height="14" aria-hidden="true">
      {/* ⚠ A WHOLE CELL OF AIR UNDER THE HEAD — packed into consecutive rows
          the rects merge into one blob at 14px. */}
      <rect className="vwd__tab__sk" x="3" y="0" width="1" height="1" />
      <rect className="vwd__tab__sk" x="2" y="2" width="3" height="1" />
      <rect className="vwd__tab__sk" x="3" y="3" width="1" height="1" />
      <rect className="vwd__tab__sk" x="2" y="4" width="1" height="1" />
      <rect className="vwd__tab__sk" x="4" y="4" width="1" height="1" />
      <rect className="vwd__tab__sig" x="1" y="6" width="5" height="1" />
    </svg>
  );
}

/** Where a chip's square crop sits on the 720×1280 frame. Azeroth's 0.2352
 *  against the canonical 0.122 is a 130px difference on the source, so
 *  cropping both the same way puts one era's chin where another's eyes are. */
function bustHeadAnchor(hologram: CharacterEraHologram): number {
  return hologram.headY;
}

function PressItem({ press }: { press: VwPress }) {
  const year = press.date ? press.date.slice(0, 4) : null;
  const body = (
    <>
      <span className="vwd__press__meta">
        <span className="vwd__press__outlet">{press.outlet}</span>
        {year ? <span className="vwd__press__year">{year}</span> : null}
      </span>
      <span className="vwd__press__headline">{press.headline}</span>
    </>
  );
  if (!press.href) return <div className="vwd__press">{body}</div>;
  return (
    <a className="vwd__press" href={press.href} target="_blank" rel="noreferrer noopener">
      {body}
    </a>
  );
}

export interface HoloDatumPanelsProps {
  selectedEraIndex: number;
  onSelectEra: (index: number) => void;
  identityRefs?: HoloEraIdentityRefs;
  idPrefix?: string;
  /** `HoloFigure` plus the projector base, placed inside the stage grid. */
  figure: ReactNode;
}

export function HoloDatumPanels({
  selectedEraIndex,
  onSelectEra,
  identityRefs,
  idPrefix = "voidwalker",
  figure,
}: HoloDatumPanelsProps) {
  const era = CHARACTER_ERAS[selectedEraIndex] ?? CHARACTER_ERAS[0];
  const activeEraIndex = CHARACTER_ERAS.indexOf(era);
  const panelId = `${idPrefix}-datum-panel`;
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [tab, setTab] = useState<DatumTab>("figure");

  const kicker = eraPositionLabel(activeEraIndex);
  const beat = VOIDWALKER_BEATS.find((b) => b.id === era.beatId);
  const facts = era.facts ?? [];

  const byId = new Map(VOIDWALKER_BEATS.map((b) => [b.id, b]));
  const press = eraPressBeatIds(era)
    .map((id) => byId.get(id)?.press)
    .filter((p): p is VwPress => Boolean(p));

  const { watching, open, close } = useWalkthrough();

  /* A transmission is a real record, never a placeholder. Reset during the
     deliberate selection event rather than repairing state in an effect: the
     target era is known here and the reader never sees an empty active tab. */
  const selectEra = (index: number) => {
    const next = CHARACTER_ERAS[index];
    if (tab === "transmission" && !next?.film) setTab("record");
    onSelectEra(index);
  };

  const selectAndFocus = (index: number) => {
    selectEra(index);
    chipRefs.current[index]?.focus();
  };

  /* Roving focus, horizontal only — the band is one row, so ADR-082's ±3
     grid jump has nothing to jump over here. */
  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = CHARACTER_ERAS.length;
    let next: number | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = (index - 1 + count) % count;
        break;
      case "ArrowRight":
        next = (index + 1) % count;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectAndFocus(next);
  };

  return (
    <section className="vwd__sheet" data-vwd-era={era.id} data-vwd-tab={tab}>
      <header className="vwd__mast" data-vwh-region="identity">
        <p className="vwd__mast__kicker">
          {/* The decode is DESTRUCTIVE — it writes `textContent` — so each
              line carries a transparent in-flow GHOST that holds the box and
              an absolutely overlaid LIVE span as the ref target. Both classes
              are the production sheet's, shared with the other composition. */}
          <span className="vwh__decode-line" aria-label={kicker}>
            <span className="vwh__decode-ghost" data-copy={kicker} aria-hidden="true" />
            <span className="vwh__decode-live" aria-hidden="true" ref={identityRefs?.kicker}>
              {kicker}
            </span>
          </span>
          <span className="vwh__decode-line" aria-label={era.year}>
            <span className="vwh__decode-ghost" data-copy={era.year} aria-hidden="true" />
            <span className="vwh__decode-live" aria-hidden="true" ref={identityRefs?.year}>
              {era.year}
            </span>
          </span>
        </p>
        <h2
          className="vwd__mast__title vwh__decode-line"
          aria-label={era.wardrobe}
          data-vwh-handoff-target="era-title"
          data-vwh-region="era-title"
          data-testid="voidwalker-era-title"
        >
          <span className="vwh__decode-ghost" data-copy={era.wardrobe} aria-hidden="true" />
          <span className="vwh__decode-live" aria-hidden="true" ref={identityRefs?.title}>
            {era.wardrobe}
          </span>
        </h2>
      </header>

      {/* The phone's reading switch. Absent on desktop, where all four panels
          are on screen at once and a tab state would change nothing. */}
      <nav className="vwd__tabs" aria-label="Era view">
        <button
          type="button"
          className="vwd__tab vwd__tab--figure"
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
              className="vwd__tab"
              data-on={t === tab}
              aria-pressed={t === tab}
              disabled={unavailable}
              onClick={() => setTab(t)}
            >
              {t}
              {unavailable ? <span className="vwd__tab__note">no film</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="vwd__stage" id={panelId}>
        {/* THE TWO CONSTRUCTION RAILS — full width, edge to edge, passing
            behind the figure. Each sits on the bottom edge of a head row,
            which is where every head's own rule already is. */}
        <div className="vwd__rail" data-rail="upper" aria-hidden="true" />
        <div className="vwd__rail" data-rail="lower" aria-hidden="true" />

        {/* ── UPPER LEFT · SCOPE ─────────────────────────────────────
            ⚠ Carries the `dossier` handoff target: it holds the top-left
            seat the About dossier flies into, and that target follows the
            SEAT, not the content. */}
        <p className="vwd__head" data-cell="ul">
          <span className="vwd__head__kicker">Scope</span>
        </p>
        <div
          className="vwd__body"
          data-cell="ul"
          data-vwh-handoff-target="dossier"
          data-vwh-region="scope"
        >
          <p className="vwd__motto">{era.motto}</p>
          <p className="vwd__prose">{beat ? vwPlain(beat.body) : era.motto}</p>
        </div>

        {/* ── UPPER RIGHT · FACTS ────────────────────────────────── */}
        <p className="vwd__head" data-cell="ur">
          <span className="vwd__head__kicker">Facts</span>
          <span className="vwd__head__tag">{era.short}</span>
        </p>
        <div className="vwd__body" data-cell="ur" data-vwh-region="record">
          <dl className="vwd__facts">
            {facts.map((f) => (
              <div className="vwd__facts__row" key={f.k}>
                <dt className="vwd__facts__k">{f.k}</dt>
                <dd className="vwd__facts__v">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── LOWER LEFT · TRANSMISSION ──────────────────────────── */}
        <p className="vwd__head" data-cell="ll">
          <span className="vwd__head__kicker">Transmission</span>
          {era.film?.duration ? <span className="vwd__head__tag">{era.film.duration}</span> : null}
        </p>
        <div className="vwd__body" data-cell="ll" data-vwh-region="transmission">
          {era.film ? (
            <button
              type="button"
              className="vwd__film"
              onClick={(e) => open(e.currentTarget)}
              aria-haspopup="dialog"
              aria-label={`Play: ${era.film.title}`}
            >
              <span className="vwd__film__frame">
                <img
                  className="vwd__film__poster"
                  src={era.film.poster}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className="vwd__film__play" aria-hidden="true" />
              </span>
              <span className="vwd__film__title">{era.film.title}</span>
            </button>
          ) : (
            /* An absent film is a real reading, not an empty slot. */
            <div className="vwd__film-empty">
              <span className="vwd__film-empty__frame" aria-hidden="true" />
              <span className="vwd__film-empty__note">No film on record</span>
            </div>
          )}
        </div>

        {/* ── LOWER RIGHT · ON RECORD ────────────────────────────── */}
        <p className="vwd__head" data-cell="lr">
          <span className="vwd__head__kicker">On record</span>
          {press.length > 0 ? (
            <span className="vwd__head__tag">
              {String(press.length).padStart(2, "0")} {press.length === 1 ? "item" : "items"}
            </span>
          ) : null}
        </p>
        <div className="vwd__body" data-cell="lr" data-vwh-region="on-record">
          <div className="vwd__press-stack">
            {press.map((p) => (
              <PressItem key={`${p.outlet}-${p.headline.slice(0, 24)}`} press={p} />
            ))}
          </div>
        </div>

        {/* ── THE FIGURE ─────────────────────────────────────────────
            The `.vwh` wrapper carries the token block and the slot rules;
            this sheet flattens its grid so `.vwh__column` fills the cell.
            ⚠ NEVER `data-vwh-ready` here — the slot would take
            `opacity: var(--vwh-morph, 0)` and vanish. */}
        <div className="vwd__figure">
          <div className="vwh vwd__vwh" data-vwh-era={era.id}>
            {figure}
          </div>
        </div>

        {/* THE GROUND DATUM — the projector's own plane, extended edge to
            edge. The figure column ends on this line, so the disc sits ON it
            rather than floating above a drawn rule. */}
        <div className="vwd__ground" aria-hidden="true" />
      </div>

      {/* ── THE ERA BAND ─────────────────────────────────────────────
          Five hairline-framed chips, the year lettered inside the top-left
          corner and the name beneath the bust. Selection takes gold on the
          frame, the name and a filled diamond — colour AND elaboration
          together here because the chip is the control, not a card in a set. */}
      <nav
        className="vwd__band"
        aria-label="Era"
        role="tablist"
        data-vwh-region="era-selector"
        data-testid="voidwalker-era-selector"
      >
        {CHARACTER_ERAS.map((item, i) => {
          const selected = i === activeEraIndex;
          const bust = resolveCharacterEraHologram(item);
          return (
            <button
              key={item.id}
              id={`${idPrefix}-era-tab-${item.id}`}
              ref={(node) => {
                chipRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              className="vwd__chip"
              aria-controls={panelId}
              aria-selected={selected}
              aria-label={`${item.year} — ${item.wardrobe}`}
              tabIndex={selected ? 0 : -1}
              data-on={selected}
              data-vwh-era-tab={item.id}
              onClick={() => selectEra(i)}
              onKeyDown={(event) => onChipKeyDown(event, i)}
            >
              <span className="vwd__chip__frame">
                <img
                  className="vwd__chip__bust"
                  src={bust.posterPath}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ "--bust-head": bustHeadAnchor(bust) } as React.CSSProperties}
                />
                <span className="vwd__chip__year">{item.year}</span>
              </span>
              <span className="vwd__chip__name">{item.short}</span>
              <span className="vwd__chip__mark" aria-hidden="true" />
            </button>
          );
        })}
      </nav>

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
    </section>
  );
}
