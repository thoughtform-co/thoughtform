"use client";

import { useRef } from "react";

import {
  AllMusings,
  BEAT_NAME,
  ReadButton,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";
import { COVER_KINDS, NoteCover, NoteThumb, type CoverKind } from "./NoteCover";

/**
 * v4 · CHAPTERS — the index, read like a book's contents.
 *
 * Built from: a game's chapter / mission select, read as the contents page of
 * a book; the Dragonfly writing list (large type, one line per entry); and
 * Vilimovský's MARKET DATA year selector (the open cell outlined, the rest
 * ruled).
 *
 * Every title is set whole, large, on one line. The open row (the newest, at
 * rest) grows DOWN into a FEATURE — ADR-121's accepted mechanic, one
 * transitioned property, turned ninety degrees.
 *
 * ⚠ ROUND TWO (owner, 2026-09-23: "I like V4 but I think it should be a bit
 * more visual. It should be clearer that it's a blog post. I think we don't
 * need the section length. For the opening I think we need something on the
 * right side, but I'm not sure about the current composition"):
 *   · the contents list and the Sections / Length readout are GONE;
 *   · the open row is a feature — the excerpt, the byline and the way in on
 *     the left, the note's COVER on the right, the two columns sharing a top
 *     and a floor;
 *   · a blog post is recognised by a picture, a byline and "min read", so each
 *     closed row carries its cover as a thumbnail and says "min read";
 *   · the cover is a knob (`?cover=dial|raster|field`) because the right-hand
 *     composition is the open question.
 */
export function Chapters({ posts, knobs }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const cover: CoverKind = COVER_KINDS.includes(knobs?.cover as CoverKind)
    ? (knobs?.cover as CoverKind)
    : "dial";
  const thumbs = knobs?.thumbs !== "0";

  return (
    <div
      className="mg mg--chapters"
      data-mg-root=""
      data-mg-v="v4"
      data-mg-cover={cover}
      data-mg-thumbs={thumbs ? "" : undefined}
      ref={ref}
    >
      <ol className="mg-ch__list" data-mg-keys="" aria-label="Musings">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <li key={p.slug} className="mg-ch__item" data-mg-slug={p.slug} data-mg-on={onAtRest(i)}>
              <a className="mg-ch__row" href={postHref(p.slug)} data-mg-slug={p.slug}>
                <span className="mg-ch__mark" aria-hidden="true" />
                <span className="mg-ch__title">{p.title}</span>
                {/* One right-set block, two lines: when, then what and how long.
                    Three columns cost the titles the width they are set in. */}
                <span className="mg-ch__meta">
                  <span className="mg-ch__date">{filed(p)}</span>
                  <span className="mg-ch__kind">
                    {beat ? BEAT_NAME[beat] : "Practice"} · {p.readingMinutes} min read
                  </span>
                </span>
                {thumbs ? <NoteThumb post={p} posts={posts} /> : null}
              </a>
              <div className="mg-ch__open">
                <div className="mg-ch__inner">
                  <div className="mg-ch__detail">
                    <div className="mg-ch__copy">
                      <p className="mg-ch__summary">{p.summary}</p>
                      <div className="mg-ch__sign">
                        <span className="mg-ch__byline">
                          <span className="mg-ch__by">By</span> {p.author}
                        </span>
                        <ReadButton post={p} className="mg-ch__read" />
                      </div>
                    </div>
                    <div className="mg-plate mg-ch__cover">
                      <NoteCover post={p} posts={posts} kind={cover} />
                    </div>
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
