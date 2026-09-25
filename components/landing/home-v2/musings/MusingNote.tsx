import type { CSSProperties } from "react";

import { rackDate } from "@/lib/musings/cards";
import { beatOf, type MusingBeat } from "@/lib/musings/cover";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingOrbit } from "./MusingOrbit";

/**
 * One note in the list (ADR-122 U2 — the gallery lab's v10, the LEDGER, the
 * owner's pick on 2026-09-25: "can you make V10 the design for the musing
 * section on our home page").
 *
 * A ruled row, one line: the state mark, the filing date in its own column,
 * the title, the beat as a bracketed chip, the length. The row under the
 * pointer OPENS downward into a compact feature — the excerpt with the byline
 * and the way in under it, indented to the title's own column, and the note's
 * drawn cover a square at the row's end.
 *
 * ⚠ **THE ROW LETTERS THE RECORD AND THE DRAWING DOES NOT** (ADR-122 U2). The
 * date, the beat and the length are in the row, an inch to the left of the
 * cover, so the cover carries no designation, no quarter label and no beat
 * mark — three said-twice defects at once, and the surface has removed a
 * console head, a foot and a designator for exactly that (ADR-064 U1).
 *
 * ⚠ **AND THE COVER HAS NO FRAME** (owner, same read: "the visual / diagram on
 * the right should not have a frame around it just the diagram"). No border,
 * no well, no notch: the drawing sits on the station's own ground, and the
 * capture fails a border or a background on `.mu-note__cover`.
 *
 * ⚠ **`data-mu-open` IS RENDERED ON THE NEWEST NOTE AND MOVED BY THE WRITER**
 * — the rest state (the newest open, no timer), so SSR, no script and reduced
 * motion show the finished list. React does not touch an attribute whose prop
 * has not changed, so the writer's move survives every re-render.
 *
 * ⚠ **EVERY NOTE IS A REAL LINK.** The row is the link; the way in repeats it
 * inside the open card, where the closed rows' copy is `visibility: hidden`
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
      <a className="mu-note__row" href={href}>
        <span className="mu-note__mark" aria-hidden="true" />
        <span className="mu-note__date">{rackDate(post.date)}</span>
        <span className="mu-note__title">{post.title}</span>
        <span className="mu-note__chip">
          <span className="mu-note__b" aria-hidden="true">
            [
          </span>
          {beat ? BEAT_NAME[beat] : "Practice"}
          <span className="mu-note__b" aria-hidden="true">
            ]
          </span>
        </span>
        <span className="mu-note__len">{post.readingMinutes} min</span>
      </a>
      <div className="mu-note__open">
        <div className="mu-note__inner">
          <div className="mu-note__detail">
            {/* ⚠ ONE STACK, SEATED AT THE TOP (the ledger's own round-four
                ruling): `space-between` put the way in on the row's floor and
                left the room between it and the excerpt as a hole. The air
                falls BELOW the block, where it is the row's. */}
            <div className="mu-note__copy">
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
            <div className="mu-note__cover" aria-hidden="true">
              <MusingOrbit post={post} posts={posts} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
