import type { CSSProperties } from "react";

import { rackDate } from "@/lib/musings/cards";
import { beatOf, type MusingBeat } from "@/lib/musings/cover";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingOrbit } from "./MusingOrbit";

/**
 * One note in the list (ADR-122 — the gallery lab's v17, the owner's pick:
 * "Let's go for V17").
 *
 * A folder card: the note's title set large on one line (v4's scale — "what I
 * like about v4 still is the big title size") over its one meta line, the
 * beat as a bracketed chip, and its drawn cover in the card's last column.
 * The OPEN card grows: the cover column widens from the thumbnail to the
 * feature, the excerpt unrolls under the title, and the byline and the way in
 * sit on the cover's floor (the owner: "the call to action and the author
 * should be aligned to the bottom of that visual").
 *
 * ⚠ **ONE COVER, TWO SIZES.** The cover is ONE element seated across both of
 * the card's rows; the thumbnail IS the feature's cover, grown — nothing
 * appears beside it (ADR-069's persistent object). ⚠ **AND NO FRAME OF ITS
 * OWN** (owner: "we already have an overarching frame") — the drawing sits on
 * the card's glass.
 *
 * ⚠ **`data-mu-open` IS RENDERED ON THE NEWEST NOTE AND MOVED BY THE WRITER**
 * — the rest state (the newest open, no timer), so SSR, no script and reduced
 * motion show the finished list. React does not touch an attribute whose prop
 * has not changed, so the writer's move survives every re-render.
 *
 * ⚠ **EVERY NOTE IS A REAL LINK.** The row is the link; the way in repeats it
 * inside the open card, where the closed cards' copy is `visibility: hidden`
 * and so out of the tab order.
 *
 * ⚠ **`--mu-slot` IS THE ARRIVAL'S STAGGER**, the note's place in the list —
 * the one per-note value the sheet reads.
 */

const BEAT_NAME: Readonly<Record<MusingBeat, string>> = {
  navigate: "Navigate",
  encode: "Encode",
  build: "Build",
};

export function MusingNote({
  post,
  posts,
  index,
}: {
  post: MusingCardData;
  posts: readonly MusingCardData[];
  index: number;
}) {
  const href = `/musings/${post.slug}`;
  const beat = beatOf(post.tags);
  return (
    <li
      className="mu-note"
      data-mu-open={index === 0 ? "" : undefined}
      style={{ "--mu-slot": index } as CSSProperties}
    >
      <div className="mu-note__cover" aria-hidden="true">
        <MusingOrbit post={post} posts={posts} />
      </div>
      <a className="mu-note__row" href={href}>
        <span className="mu-note__text">
          <span className="mu-note__title">{post.title}</span>
          <span className="mu-note__meta">
            {rackDate(post.date)}
            <span className="mu-note__dot" aria-hidden="true">
              ·
            </span>
            {post.readingMinutes} min read
          </span>
        </span>
        <span className="mu-note__chip">
          <span className="mu-note__b" aria-hidden="true">
            [
          </span>
          {beat ? BEAT_NAME[beat] : "Practice"}
          <span className="mu-note__b" aria-hidden="true">
            ]
          </span>
        </span>
      </a>
      <div className="mu-note__open">
        <div className="mu-note__inner">
          <div className="mu-note__detail">
            <p className="mu-note__lede">{post.summary}</p>
            <div className="mu-note__sign">
              <span className="mu-note__by">
                <span className="mu-note__by-k">By</span> {post.author}
              </span>
              <a className="mu-note__read" href={href}>
                Read the note
                <span className="mu-note__arrow" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
