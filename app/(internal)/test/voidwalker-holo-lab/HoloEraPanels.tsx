"use client";

import {
  MediaLightbox,
  useWalkthrough,
} from "@/components/landing/home-v2/services/casefile/MediaLightbox";
import { eraPressBeatIds, type CharacterEra } from "@/lib/voidwalker/characterEras";
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
 * An absent slot COLLAPSES; it never reorders and it is never filled
 * with a substitute. An era without a film simply has no transmission,
 * and the eye still finds the bio in the same place.
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

/**
 * One section: kicker + thin rule + content, bare on the void. No card,
 * no wash, no lit bar — the second review's ruling ("no boxes"): the
 * rule under the head is the only line a section owns, and space does
 * the rest.
 */
function Panel({
  kicker,
  tag,
  children,
}: {
  kicker: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="vwh__panel">
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
    <Panel kicker="Facts" tag={era.short}>
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

export function HoloEraPanels({ era }: { era: CharacterEra }) {
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

  return (
    <>
      <div className="vwh__side" data-side="l">
        <Facts era={era} />

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

      <div className="vwh__side" data-side="r">
        {/* The era itself: who this version was, and what it did. The
            record's own prose — this is not the #about bio restated. */}
        <Panel kicker="Era">
          <p className="vwh__panel__title">{era.wardrobe}</p>
          <p className="vwh__panel__motto">{era.motto}</p>
          <p className="vwh__panel__body">{beat ? plain(beat.body) : era.motto}</p>
          <p className="vwh__panel__foot">
            <span className="vwh__panel__foot__k">Loadout</span>
            <span className="vwh__panel__foot__v">{era.loadout}</span>
          </p>
        </Panel>

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
