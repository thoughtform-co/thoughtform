"use client";

import { useRef } from "react";

import {
  AllMusings,
  BEAT_NAME,
  BeatGlyph,
  Contents,
  ReadButton,
  Readout,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";

/**
 * v4 · CHAPTERS — the index, read like a book's contents.
 *
 * Built from: a game's chapter / mission select, read as the contents page of
 * a book; the Dragonfly writing list (large type, one line per entry); and
 * Vilimovský's MARKET DATA year selector (the open cell outlined, the rest
 * ruled).
 *
 * Every title is set whole, large, on one line — the strips of the current
 * row cut them mid-word, and a title is the one thing on this station a reader
 * came for. The open row (the newest, at rest) grows DOWN to show its note:
 * the summary, the essay's shape, the readout and the way in. It is ADR-121's
 * own accepted mechanic — one transitioned property, the text laid out at its
 * final width so nothing reflows — turned ninety degrees.
 */
export function Chapters({ posts }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);

  return (
    <div className="mg mg--chapters" data-mg-root="" data-mg-v="v4" ref={ref}>
      <ol className="mg-ch__list" data-mg-keys="" aria-label="Musings">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <li key={p.slug} className="mg-ch__item" data-mg-slug={p.slug} data-mg-on={onAtRest(i)}>
              <a className="mg-ch__row" href={postHref(p.slug)} data-mg-slug={p.slug}>
                <span className="mg-ch__mark" aria-hidden="true" />
                <span className="mg-ch__title">{p.title}</span>
                <span className="mg-ch__beat">
                  <BeatGlyph beat={beat} className="mg-ch__glyph" />
                  {beat ? BEAT_NAME[beat] : "Practice"}
                </span>
                <span className="mg-ch__date">{filed(p)}</span>
                <span className="mg-ch__min">{p.readingMinutes} min</span>
              </a>
              <div className="mg-ch__open">
                <div className="mg-ch__inner">
                  <div className="mg-ch__detail">
                    <p className="mg-ch__summary">{p.summary}</p>
                    <div className="mg-ch__record">
                      <Contents post={p} className="mg-ch__toc" />
                      <Readout post={p} keys={["sections", "length"]} className="mg-ch__rows" />
                    </div>
                    <ReadButton post={p} className="mg-ch__read" />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mg-ch__foot">
        <AllMusings />
      </div>
    </div>
  );
}
