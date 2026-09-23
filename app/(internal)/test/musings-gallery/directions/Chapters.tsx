"use client";

import { useRef } from "react";

import {
  AllMusings,
  Byline,
  Chip,
  Meta,
  ReadButton,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";
import { NoteCover, NoteThumb, coverKindOf } from "./NoteCover";

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
 *
 * ⚠ ROUND FOUR (owner, 2026-09-23, on rounds two and three: "I actually like
 * V4 the best … enhance it and really make it better, and make two more
 * variants where the design of the cards is a bit tighter"). ONE component,
 * three VARIANTS, so the comparison is between the cards' design alone:
 *   · `default` (v4), enhanced: the row's meta is the round-three chip and
 *     meta line (`[ NAVIGATE ]` over `14 SEP 2026 · 1 MIN READ`), the open
 *     feature is shorter (its cap 400 → 320px) with the copy seated at the
 *     TOP as one stack — the hole between the excerpt and the way in is gone —
 *     and the cover fills the right column edge to edge.
 *   · `ledger` (v10), tighter ROWS: one line per note — the mark, the date in
 *     its own column, the title at 26–32px, the chip, the length — no
 *     thumbnails; the open row is a compact feature, the cover a small square
 *     at the row's end, the way in a compact button.
 *   · `cards` (v11), tighter CARDS: every note is a folder plate (the notch,
 *     the lip), 8px apart — thumbnail, title and meta on one card; the open
 *     card grows into a horizontal feature, the copy on the left and the
 *     cover a square at the card's height on the right.
 */

export type ChaptersVariant = "default" | "ledger" | "cards";

const VARIANT_ID: Record<ChaptersVariant, string> = { default: "v4", ledger: "v10", cards: "v11" };

export function Chapters({
  posts,
  knobs,
  variant = "default",
}: DirectionProps & { variant?: ChaptersVariant }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const cover = coverKindOf(knobs?.cover, "dial");
  /* The ledger has no thumbnails; a card's thumbnail is its identity mark, so
     it is not a knob there; the default keeps `?thumbs=0`. */
  const thumbs = variant === "cards" || (variant === "default" && knobs?.thumbs !== "0");

  return (
    <div
      className="mg mg--chapters"
      data-mg-root=""
      data-mg-v={VARIANT_ID[variant]}
      data-mg-variant={variant}
      data-mg-cover={cover}
      data-mg-thumbs={thumbs ? "" : undefined}
      ref={ref}
    >
      <ol className="mg-ch__list" data-mg-keys="" aria-label="Musings">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <li
              key={p.slug}
              className={`mg-ch__item${variant === "cards" ? " mg-plate mg-ch__card" : ""}`}
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
            >
              <a className="mg-ch__row" href={postHref(p.slug)} data-mg-slug={p.slug}>
                {variant === "cards" ? (
                  /* The card: the thumbnail leads, the title and the meta line
                     stack beside it, the chip closes the row. */
                  <>
                    <span className="mg-ch__well">
                      <NoteThumb post={p} posts={posts} />
                    </span>
                    <span className="mg-ch__text">
                      <span className="mg-ch__title">{p.title}</span>
                      <Meta post={p} className="mg-ch__line" />
                    </span>
                    <Chip beat={beat} className="mg-ch__chip" />
                  </>
                ) : variant === "ledger" ? (
                  /* The ledger: one line — mark · date · title · chip · length. */
                  <>
                    <span className="mg-ch__mark" aria-hidden="true" />
                    <span className="mg-ch__date">{filed(p)}</span>
                    <span className="mg-ch__title">{p.title}</span>
                    <Chip beat={beat} className="mg-ch__chip" />
                    <span className="mg-ch__len">{p.readingMinutes} min</span>
                  </>
                ) : (
                  <>
                    <span className="mg-ch__mark" aria-hidden="true" />
                    <span className="mg-ch__title">{p.title}</span>
                    {/* One right-set block, two lines: the beat, then when and
                        how long. Three columns cost the titles their width. */}
                    <span className="mg-ch__meta">
                      <Chip beat={beat} className="mg-ch__chip" />
                      <Meta post={p} className="mg-ch__line" />
                    </span>
                    {thumbs ? <NoteThumb post={p} posts={posts} /> : null}
                  </>
                )}
              </a>
              <div className="mg-ch__open">
                <div className="mg-ch__inner">
                  <div className="mg-ch__detail">
                    <div className="mg-ch__copy">
                      <p className="mg-ch__summary">{p.summary}</p>
                      <div className="mg-ch__sign">
                        <Byline post={p} className="mg-ch__byline" />
                        <ReadButton post={p} className="mg-ch__read" />
                      </div>
                    </div>
                    <div
                      className={`mg-ch__cover${variant === "cards" ? "" : " mg-plate"}`}
                      aria-hidden="true"
                    >
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

/** v10 — the rows tightened into a ledger. */
export function ChaptersLedger(props: DirectionProps) {
  return <Chapters {...props} variant="ledger" />;
}

/** v11 — the rows tightened into cards. */
export function ChaptersCards(props: DirectionProps) {
  return <Chapters {...props} variant="cards" />;
}
