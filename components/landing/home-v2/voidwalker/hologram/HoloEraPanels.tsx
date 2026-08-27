"use client";

import { useRef, useState, type KeyboardEvent, type RefObject } from "react";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import { CHARACTER_ERAS, eraPressBeatIds, type CharacterEra } from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS, type VwPress, type VwSegment } from "@/lib/voidwalker/voidwalkerData";

/**
 * HoloEraPanels — the instrument panels that flank the hologram.
 *
 * ⚠ THE SLOT ORDER IS THE SAME ON EVERY ERA, AND THAT IS THE WHOLE
 * POINT (owner, 2026-08-26). The first cut put the artefact drawing at
 * the top of the right stack, so `genai` — whose drawing is wide — threw
 * its own copy around and read nothing like `thoughtform`, which has no
 * drawing at all. The rail's six stops have to read as one instrument
 * being retuned, not six different layouts.
 *
 *   LEFT  (the record)   FACTS · ON RECORD · ARTEFACT
 *   RIGHT (the era)      BIO   · TRANSMISSION
 *
 * Optional slots keep their footprint on capable desktop so switching
 * eras cannot reshape the sheet. They collapse only in the normal-flow
 * responsive presentation; an absent slot is never filled with fake data.
 *
 * ⚠ THE WIRE DRAWINGS ARE PARKED, NOT PORTED (owner, 2026-08-26). The
 * ADR-074 plates are authored in container-query units against a
 * ~500px+ timeline plate; in this 240px side column their labels
 * overlapped their own panel head and the drawing spilled its border —
 * measured, shipped, and rightly shouted at. They return only with a
 * home wide enough to letter at their floors (the landscape scene's
 * lower band is the candidate), never squeezed into a side stack.
 */

function plain(segments: readonly VwSegment[]): string {
  return segments.map((s) => (typeof s === "string" ? s : "em" in s ? s.em : s.mark)).join("");
}

const MOBILE_DOSSIER_MODES = ["record", "scope", "transmission"] as const;
type MobileDossierMode = (typeof MOBILE_DOSSIER_MODES)[number];

export function eraPositionLabel(index: number, count = CHARACTER_ERAS.length): string {
  return `ERA / ${String(index + 1).padStart(2, "0")} OF ${String(count).padStart(2, "0")}`;
}

export interface HoloEraIdentityRefs {
  kicker: RefObject<HTMLSpanElement | null>;
  title: RefObject<HTMLSpanElement | null>;
  year: RefObject<HTMLSpanElement | null>;
}

export interface HoloEraPanelsProps {
  selectedEraIndex: number;
  onSelectEra: (index: number) => void;
  identityRefs?: HoloEraIdentityRefs;
  idPrefix?: string;
}

/**
 * One section: kicker + thin rule + content, bare on the void. No card,
 * no wash, no lit bar — the second review's ruling ("no boxes"): the
 * rule under the head is the only line a section owns, and space does
 * the rest.
 */
function Panel({
  kicker,
  tag,
  handoffTarget,
  mobilePanel,
  children,
}: {
  kicker: string;
  tag?: string;
  handoffTarget?: "dossier";
  mobilePanel?: MobileDossierMode;
  children: React.ReactNode;
}) {
  return (
    <article
      className="vwh__panel"
      data-vwh-handoff-target={handoffTarget}
      data-vwh-mobile-panel={mobilePanel}
    >
      <p className="vwh__panel__head">
        <span className="vwh__panel__kicker">{kicker}</span>
        {tag ? <span className="vwh__panel__tag">{tag}</span> : null}
      </p>
      {children}
    </article>
  );
}

/** The dotted-leader data rows — the era's facts, in the record's own
 *  phrasings (see `CharacterEraFact`). */
function Facts({ era }: { era: CharacterEra }) {
  const facts = era.facts ?? [];
  if (facts.length === 0) return null;
  return (
    <Panel kicker="Facts" tag={era.short} handoffTarget="dossier" mobilePanel="record">
      <dl className="vwh__facts">
        {facts.map((f) => (
          <div className="vwh__facts__row" key={f.k}>
            <dt className="vwh__facts__k">{f.k}</dt>
            <dd className="vwh__facts__v">{f.v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** A press card: the outlet in a boxed chip, the headline as prose, the
 *  date on a dashed meta row. Linked when the record has a public URL. */
function PressCard({ press }: { press: VwPress }) {
  const year = press.date ? press.date.slice(0, 4) : null;
  const body = (
    <>
      <p className="vwh__press__headline">{press.headline}</p>
      <p className="vwh__press__meta">
        <span className="vwh__press__outlet">{press.outlet}</span>
        {year ? <span className="vwh__press__date">{year}</span> : null}
      </p>
    </>
  );
  if (!press.href) return <div className="vwh__press">{body}</div>;
  return (
    <a className="vwh__press" href={press.href} target="_blank" rel="noreferrer noopener">
      {body}
    </a>
  );
}

export function HoloEraPanels({
  selectedEraIndex,
  onSelectEra,
  identityRefs,
  idPrefix = "voidwalker",
}: HoloEraPanelsProps) {
  const era = CHARACTER_ERAS[selectedEraIndex] ?? CHARACTER_ERAS[0];
  const activeEraIndex = CHARACTER_ERAS.indexOf(era);
  const activeTabId = `${idPrefix}-era-tab-${era.id}`;
  const panelId = `${idPrefix}-era-panel`;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mobileMode, setMobileMode] = useState<MobileDossierMode>("record");
  const kicker = eraPositionLabel(activeEraIndex);
  const beat = VOIDWALKER_BEATS.find((b) => b.id === era.beatId);

  // Every press card this era speaks for — its own beat by default, or
  // the span it stands in for (`the-crowd` covers four 2016-18 beats).
  const byId = new Map(VOIDWALKER_BEATS.map((b) => [b.id, b]));
  const press = eraPressBeatIds(era)
    .map((id) => byId.get(id)?.press)
    .filter((p): p is VwPress => Boolean(p));

  /**
   * ⚠ THE PLAYER IS BUILT ONLY AFTER A CLICK, and it is the site's ONE
   * third-party frame (`youtube-nocookie.com`, named in `frame-src` by
   * `lib/security/headers.mjs`). `MediaLightbox` portals to
   * `document.body` because this stage clips and transforms — a
   * `position: fixed` overlay inside it would be contained by it — and
   * focus returns to the trigger one frame late, which is the timing
   * React's portal unmount forces.
   */
  const { watching, open, close } = useWalkthrough();

  /* A transmission is a real record, never a placeholder. Reset during the
     deliberate selection event instead of repairing state in an effect: the
     target era is known here and the reader never sees an empty active seat. */
  const selectEra = (index: number) => {
    const nextEra = CHARACTER_ERAS[index];
    if (mobileMode === "transmission" && !nextEra?.film) setMobileMode("record");
    onSelectEra(index);
  };

  const selectAndFocus = (index: number) => {
    selectEra(index);
    tabRefs.current[index]?.focus();
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = CHARACTER_ERAS.length;
    let next: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        next = (index - 1 + count) % count;
        break;
      case "ArrowRight":
        next = (index + 1) % count;
        break;
      case "ArrowUp":
        if (window.matchMedia("(max-width: 700px)").matches) return;
        next = (index - 3 + count) % count;
        break;
      case "ArrowDown":
        if (window.matchMedia("(max-width: 700px)").matches) return;
        next = (index + 3) % count;
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
    <>
      <nav
        className="vwh__rail vwh__era-selector"
        aria-label="Era"
        role="tablist"
        data-vwh-region="era-selector"
        data-testid="voidwalker-era-selector"
      >
        {CHARACTER_ERAS.map((item, index) => {
          const selected = index === activeEraIndex;
          return (
            <button
              key={item.id}
              id={`${idPrefix}-era-tab-${item.id}`}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              className="vwh__pip"
              aria-controls={panelId}
              aria-selected={selected}
              aria-label={`${item.year} — ${item.wardrobe}`}
              tabIndex={selected ? 0 : -1}
              data-on={selected}
              data-vwh-era-tab={item.id}
              onClick={() => selectEra(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span className="vwh__pip__year">{item.year}</span>
              <span className="vwh__pip__name">{item.short}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="vwh__tabpanel"
        id={panelId}
        role="tabpanel"
        aria-labelledby={activeTabId}
        data-vwh-mobile-mode={mobileMode}
        data-vwh-era-panel={era.id}
        data-vwh-region="era-panel"
        data-testid="voidwalker-era-panel"
      >
        <header className="vwh__mast" data-vwh-region="identity">
          <p className="vwh__mast__kicker vwh__decode-line" aria-label={kicker}>
            <span className="vwh__decode-ghost" data-copy={kicker} aria-hidden="true" />
            <span className="vwh__decode-live" aria-hidden="true" ref={identityRefs?.kicker}>
              {kicker}
            </span>
          </p>
          <h2
            className="vwh__mast__title vwh__decode-line"
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
          <p className="vwh__mast__year vwh__decode-line" aria-label={era.year}>
            <span className="vwh__decode-ghost" data-copy={era.year} aria-hidden="true" />
            <span className="vwh__decode-live" aria-hidden="true" ref={identityRefs?.year}>
              {era.year}
            </span>
          </p>
        </header>

        <div className="vwh__mobile-modes" role="group" aria-label="Dossier view">
          {MOBILE_DOSSIER_MODES.map((mode) => {
            const active = mobileMode === mode;
            const unavailable = mode === "transmission" && !era.film;
            return (
              <button
                key={mode}
                type="button"
                className="vwh__mobile-mode"
                data-on={active || undefined}
                aria-pressed={active}
                disabled={unavailable}
                onClick={() => setMobileMode(mode)}
              >
                {mode}
              </button>
            );
          })}
        </div>

        <div className="vwh__side" data-side="l" data-vwh-region="record">
          <Facts era={era} />

          <div
            className="vwh__panel-slot"
            data-slot="on-record"
            data-empty={press.length === 0}
            data-vwh-region="on-record"
            data-vwh-mobile-panel="record"
            aria-hidden={press.length === 0 || undefined}
          >
            {press.length > 0 ? (
              <Panel kicker="On record">
                <div className="vwh__press-stack">
                  {press.map((p) => (
                    <PressCard key={`${p.outlet}-${p.headline.slice(0, 24)}`} press={p} />
                  ))}
                </div>
              </Panel>
            ) : null}
          </div>
        </div>

        <div className="vwh__side" data-side="r" data-vwh-region="scope">
          {/* The era itself: who this version was, and what it did. The
              record's own prose — this is not the #about bio restated. */}
          <Panel kicker="Scope" mobilePanel="scope">
            <p className="vwh__panel__motto">{era.motto}</p>
            <p className="vwh__panel__body">{beat ? plain(beat.body) : era.motto}</p>
            <p className="vwh__panel__foot">
              <span className="vwh__panel__foot__k">Loadout</span>
              <span className="vwh__panel__foot__v">{era.loadout}</span>
            </p>
          </Panel>

          <div
            className="vwh__panel-slot"
            data-slot="transmission"
            data-empty={!era.film}
            data-vwh-region="transmission"
            data-vwh-mobile-panel="transmission"
            aria-hidden={!era.film || undefined}
          >
            {era.film ? (
              <Panel kicker="Transmission">
                {/* The poster IS the affordance: the video's own frame under
                    the hologram's scanline, a play ring in the middle, the
                    title on the caption bar. The whole figure is the button. */}
                <button
                  type="button"
                  className="vwh__film"
                  onClick={(e) => open(e.currentTarget)}
                  aria-haspopup="dialog"
                  aria-label={`Play: ${era.film.title}`}
                >
                  <span className="vwh__film__frame">
                    <img
                      className="vwh__film__poster"
                      src={era.film.poster}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="vwh__film__scan" aria-hidden="true" />
                    <span className="vwh__film__play" aria-hidden="true" />
                  </span>
                  <span className="vwh__film__bar">
                    <span className="vwh__film__title">{era.film.title}</span>
                    {era.film.duration ? (
                      <span className="vwh__film__dur">{era.film.duration}</span>
                    ) : null}
                  </span>
                </button>
              </Panel>
            ) : null}
          </div>
        </div>
      </div>

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
    </>
  );
}
