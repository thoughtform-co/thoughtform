"use client";

import { useRef } from "react";

import {
  AllMusings,
  BeatGlyph,
  Chip,
  Meta,
  beatOfPost,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";
import { NoteCover, coverKindOf } from "./NoteCover";

/**
 * v7 · COLUMNS — Prime Intellect's customer stories: the row that collapses
 * LESS.
 *
 * Built from: primeintellect.ai's Customer Stories (the owner's second
 * reference for round three): ONE housing with n cards as columns sharing
 * 1px seams; the open one ~47 % wide and carrying the picture, the others
 * ~26.5 % each with NO picture — the logo top-left, the tag chip and a
 * two-line title at the foot. The closed cards keep their whole title, which
 * is the owner's point against the shipped row's 120px strips.
 *
 * Here: the folder plate is the housing (TR notch, gold lip), the columns
 * share hairline seams (cell edges of one device, never a rule of the page's
 * own), and the widths are `columnWidths()` in the kit — a closed column is
 * 26 % of the band (320px cap, 180px floor), the open one takes the rest,
 * never less than 40 %. At three notes on the 1200px band: 576 / 312 / 312.
 * At five: 480 / 180 × 4. At seven the floor overflows the band and the
 * housing becomes a horizontal rail — stated, not hidden.
 *
 * ⚠ THE TEXT NEVER REFLOWS DURING THE GROW (ADR-121's law, kept the other
 * way round): the foot — chip, title, meta — is laid out at the CLOSED width
 * on every column, open or not, so the title's wrap is a property of the
 * copy alone; the growth uncovers the PICTURE, which sits behind the foot on
 * the open column only. Closed columns carry the beat's glyph top-left
 * (Prime Intellect's logo slot) and no picture: that is what keeps them
 * readable at 26 %.
 *
 * Knobs: `?cover=` (default `dial` — the instrument reads as a picture where
 * the dot field read as the shipped row's cover; `field` and `raster` stay a
 * switch away); `?dek=1` adds the summary to the open card's foot (Prime
 * Intellect has none; "clearer that it's a blog post" is one switch away).
 */
export function Columns({ posts, knobs }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const cover = coverKindOf(knobs?.cover, "dial");
  const dek = knobs?.dek === "1";

  return (
    <div
      className="mg mg--columns"
      data-mg-root=""
      data-mg-v="v7"
      data-mg-cover={cover}
      data-mg-dek={dek ? "" : undefined}
      ref={ref}
    >
      <div className="mg-plate mg-cl__housing">
        <ol className="mg-cl__row" data-mg-keys="" aria-label="Musings">
          {posts.map((p, i) => {
            const beat = beatOfPost(p);
            return (
              <li
                key={p.slug}
                className="mg-cl__col"
                data-mg-slug={p.slug}
                data-mg-on={onAtRest(i)}
              >
                <a
                  className="mg-cl__card"
                  href={postHref(p.slug)}
                  data-mg-slug={p.slug}
                  aria-label={p.title}
                >
                  <span className="mg-cl__picture" aria-hidden="true">
                    <NoteCover post={p} posts={posts} kind={cover} />
                  </span>
                  <BeatGlyph beat={beat} className="mg-cl__glyph" />
                  <span className="mg-cl__foot">
                    <Chip beat={beat} className="mg-cl__chip" />
                    <span className="mg-cl__title">{p.title}</span>
                    {dek ? <span className="mg-cl__dek">{p.summary}</span> : null}
                    <Meta post={p} className="mg-cl__meta" />
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mg-cl__way">
        <AllMusings />
      </div>
    </div>
  );
}
