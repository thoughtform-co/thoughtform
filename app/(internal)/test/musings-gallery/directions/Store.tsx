"use client";

import { useRef, type CSSProperties } from "react";

import {
  AllMusings,
  BEAT_NAME,
  BeatGlyph,
  Contents,
  EssayShape,
  beatOfPost,
  filed,
  headed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";

/**
 * v3 · TERMINAL STORE — the gallery, done properly.
 *
 * Built from: Vilimovský's STORE ACCESS monitor (Cyberpunk-Panel-3 — a row of
 * uniform cards, a large emblem in each, a small meta block at the foot), the
 * CP2077 4ST store (the chosen card ELABORATES in place rather than being
 * highlighted), Marathon's armory (corner labels, one meta line on the card),
 * and the Brand Codex's STACK archetype (claim · field · name).
 *
 * The classic form, kept honest: equal portrait cards, one per note, every
 * card a link. The field draws the record — the Arc beat's mark inside a
 * machined diamond, and under it the essay's shape — and the card the reader
 * is on OPENS: a panel wipes down over the emblem with the summary and the
 * readout. No sibling moves, nothing reflows, nothing fades.
 */
export function Store({ posts }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);

  return (
    <div
      className="mg mg--store"
      data-mg-root=""
      data-mg-v="v3"
      data-mg-many={posts.length > 4 ? "" : undefined}
      ref={ref}
      style={{ "--mg-n": posts.length } as CSSProperties}
    >
      <div className="mg-st__rack" data-mg-keys="">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <a
              key={p.slug}
              className="mg-st__card"
              href={postHref(p.slug)}
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
            >
              <span className="mg-plate mg-st__face">
                <span className="mg-st__kick">
                  <span>{filed(p)}</span>
                  <span>{p.readingMinutes} min</span>
                </span>
                <span className="mg-st__field">
                  <span className="mg-st__emblem" aria-hidden="true">
                    <span className="mg-st__diamond">
                      <BeatGlyph beat={beat} className="mg-st__glyph" />
                    </span>
                    <span className="mg-st__beat">{beat ? BEAT_NAME[beat] : "Practice"}</span>
                    {/* The reference's foot block: two readings off the record,
                        set small, where the store card letters its meta. */}
                    <span className="mg-st__meta">
                      <span>
                        <b>{headed(p).length}</b> sections
                      </span>
                      <span>
                        <b>{p.outline.words}</b> words
                      </span>
                    </span>
                  </span>
                  <span className="mg-st__more">
                    <span className="mg-st__summary">{p.summary}</span>
                    <Contents post={p} className="mg-st__toc" />
                    <span className="mg-st__cue" aria-hidden="true">
                      Read the note
                      <span className="mg-read__arrow" />
                    </span>
                  </span>
                </span>
                <EssayShape post={p} lettered={false} className="mg-st__shape" />
                <span className="mg-st__title">{p.title}</span>
              </span>
            </a>
          );
        })}
      </div>
      <div className="mg-st__foot">
        <AllMusings />
      </div>
    </div>
  );
}
