"use client";

import { useRef } from "react";

import {
  AllMusings,
  BEAT_NAME,
  BeatGlyph,
  Byline,
  ReadButton,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";
import { NoteCover, coverKindOf } from "./NoteCover";

/**
 * v8 · TRANSMISSIONS — a comms panel: the manifest, then the open message.
 *
 * Built from two game screens read this pass: Starfield's ship crew ROSTER (a
 * table with a mono header row — NAME · ASSIGNMENT · SKILLS — the selected row
 * filled light, the rest dim; sparse rows in a tall panel are on-grammar) and
 * Cyberpunk 2077's NEW MESSAGES panel (the sender's glyph in a square well,
 * `From` / `Subject` as a framed header, the body in one measure, the whole
 * thing chamfered). A comms panel reads as RECEIVED, not published — which is
 * what "notes from the practice" are.
 *
 * Stacked, full band width. On top, the MANIFEST: `STAMP · BEAT · SUBJECT ·
 * LENGTH` in mono, one row per note, the title in sans (never uppercase, it
 * wraps), the lit row taking a dawn wash and the gold mark — never a gold
 * fill across the band. Below, the TRANSMISSION: one folder plate taking the
 * rest of the device — a band lettering the stamp, the sender WELL with the
 * beat's glyph large, the framed-key header (`FROM` · `RE` · `STAMP` ·
 * `LENGTH`, Starfield's status-sheet rows), the body at the reading measure,
 * the byline and the way in; and, where the device is wide enough, the drawn
 * cover as the SIGNAL panel on the right (`?cover=`, default `raster` — the
 * scanline register fits a transmission). Every transmission is rendered and
 * one is shown.
 */
export function Transmissions({ posts, knobs }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const cover = coverKindOf(knobs?.cover, "raster");

  return (
    <div
      className="mg mg--transmissions"
      data-mg-root=""
      data-mg-v="v8"
      data-mg-cover={cover}
      ref={ref}
    >
      <div className="mg-tx__manifest">
        <div className="mg-tx__head" aria-hidden="true">
          <span />
          <span>Stamp</span>
          <span>Beat</span>
          <span>Subject</span>
          <span className="mg-tx__head-len">Length</span>
        </div>
        <ol className="mg-tx__list" data-mg-keys="" aria-label="Musings">
          {posts.map((p, i) => {
            const beat = beatOfPost(p);
            return (
              <li
                key={p.slug}
                className="mg-tx__item"
                data-mg-slug={p.slug}
                data-mg-on={onAtRest(i)}
              >
                <a className="mg-tx__row" href={postHref(p.slug)} data-mg-slug={p.slug}>
                  <span className="mg-tx__mark" aria-hidden="true" />
                  <span className="mg-tx__stamp">{filed(p)}</span>
                  <span className="mg-tx__beat">{beat ? BEAT_NAME[beat] : "Practice"}</span>
                  <span className="mg-tx__subject">{p.title}</span>
                  <span className="mg-tx__len">{p.readingMinutes} min</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mg-tx__panes">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <article
              key={p.slug}
              className="mg-plate mg-tx__pane"
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
              aria-label={p.title}
            >
              <header className="mg-band">
                <span className="mg-band__kick">
                  <BeatGlyph beat={beat} className="mg-band__glyph" />
                  Transmission
                </span>
                <span className="mg-band__meta">{filed(p)}</span>
              </header>
              <div className="mg-tx__body">
                <div className="mg-tx__well" aria-hidden="true">
                  <BeatGlyph beat={beat} className="mg-tx__well-glyph" />
                </div>
                <div className="mg-tx__message">
                  <dl className="mg-readout mg-tx__header">
                    <div className="mg-readout__row">
                      <dt className="mg-readout__key">From</dt>
                      <dd className="mg-readout__val">The practice</dd>
                    </div>
                    <div className="mg-readout__row">
                      <dt className="mg-readout__key">Re</dt>
                      <dd className="mg-readout__val mg-readout__val--wrap">{p.title}</dd>
                    </div>
                    <div className="mg-readout__row">
                      <dt className="mg-readout__key">Beat</dt>
                      <dd className="mg-readout__val">{beat ? BEAT_NAME[beat] : "Practice"}</dd>
                    </div>
                    <div className="mg-readout__row">
                      <dt className="mg-readout__key">Length</dt>
                      <dd className="mg-readout__val">{p.readingMinutes} min read</dd>
                    </div>
                  </dl>
                  <p className="mg-tx__text">{p.summary}</p>
                  <div className="mg-tx__sign">
                    <Byline post={p} className="mg-tx__byline" />
                    <ReadButton post={p} className="mg-tx__read" />
                  </div>
                </div>
                <div className="mg-tx__signal" aria-hidden="true">
                  <NoteCover post={p} posts={posts} kind={cover} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mg-tx__way">
        <AllMusings />
      </div>
    </div>
  );
}
