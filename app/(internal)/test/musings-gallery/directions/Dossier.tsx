"use client";

import { useRef } from "react";

import {
  AllMusings,
  BEAT_NAME,
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
import { NoteCover, coverKindOf } from "./NoteCover";
import { RasterCover } from "./RasterCover";

/**
 * v15 · v16 · THE CODEX, TIGHTENED — the index on the left, one card on the
 * right (owner, 2026-09-24, on v1: "I kind of like it but maybe we can refine
 * it … better versions that are tighter. The visual at the center should be
 * the thumbnail, of course, but with the dither glitch effects we have for
 * our other pictures as well").
 *
 * What v1 carried that this does not: the contents list, the Sections / Length
 * readout and the year strip (round two had already ruled the section length
 * out), and a dossier stretched to the floor around a field of dots. The card
 * is as tall as what it says, and the two columns share a top.
 *
 * ⚠ THE CARD'S VISUAL IS THE INDEX ROW'S THUMBNAIL, at two sizes — one
 * drawing (`NoteCover` at the chosen kind), stripped by `@container mg-cv` in
 * the row and whole in the card, where it rests as GLYPHS and resolves on the
 * card (ADR-112's treatment, `RasterCover`; `?raster=0` shows it clean).
 *
 * Two index grammars, so the choice is the list's alone:
 *   · `cards`  (v15) — v13's closed folder cards: thumbnail, title, meta line;
 *                the open note's lip rises to gold.
 *   · `plates` (v16) — v1's own: outlined plates, the open one FILLED (ADR-089
 *                U4, fill among outlines), the thumbnail outside the plate
 *                where v1 hung its beat glyph.
 */
export type DossierIndex = "cards" | "plates";

export function Dossier({ posts, knobs, index }: DirectionProps & { index: DossierIndex }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const cover = coverKindOf(knobs?.cover, "orbit");
  const raster = knobs?.raster !== "0";

  return (
    <div
      className="mg mg--dossier"
      data-mg-root=""
      data-mg-v={index === "cards" ? "v15" : "v16"}
      data-mg-index={index}
      data-mg-cover={cover}
      ref={ref}
    >
      <nav className="mg-ds__index" aria-label="Musings">
        <ol className="mg-ds__list" data-mg-keys="">
          {posts.map((p, i) => {
            const beat = beatOfPost(p);
            return (
              <li
                key={p.slug}
                className={`mg-ds__item${index === "cards" ? " mg-plate" : ""}`}
                data-mg-slug={p.slug}
                data-mg-on={onAtRest(i)}
              >
                <a
                  className="mg-ds__row"
                  href={postHref(p.slug)}
                  data-mg-slug={p.slug}
                  data-mg-on={onAtRest(i)}
                >
                  <span className="mg-ds__thumb mg-cvbox" aria-hidden="true">
                    <NoteCover post={p} posts={posts} kind={cover} />
                  </span>
                  {index === "cards" ? (
                    <span className="mg-ds__text">
                      <span className="mg-ds__title">{p.title}</span>
                      <Meta post={p} className="mg-ds__line" />
                    </span>
                  ) : (
                    <span className="mg-ds__plate">
                      <span className="mg-ds__kick">
                        {filed(p)}
                        <span>{beat ? BEAT_NAME[beat] : "Practice"}</span>
                      </span>
                      <span className="mg-ds__title">{p.title}</span>
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
        <div className="mg-ds__foot">
          <AllMusings />
        </div>
      </nav>

      <div className="mg-ds__cards">
        {posts.map((p, i) => (
          <article
            key={p.slug}
            className="mg-plate mg-ds__card"
            data-mg-slug={p.slug}
            data-mg-on={onAtRest(i)}
            data-mg-raster-host=""
            aria-label={p.title}
          >
            <header className="mg-band">
              <Chip beat={beatOfPost(p)} className="mg-ds__chip" />
              <Meta post={p} className="mg-band__meta" />
            </header>
            <div className="mg-ds__stage mg-cvbox">
              {raster ? (
                <RasterCover post={p} posts={posts} kind={cover} />
              ) : (
                <NoteCover post={p} posts={posts} kind={cover} />
              )}
            </div>
            <div className="mg-ds__body">
              <h3 className="mg-ds__name">{p.title}</h3>
              <p className="mg-ds__summary">{p.summary}</p>
              <div className="mg-ds__sign">
                <Byline post={p} />
                <ReadButton post={p} className="mg-ds__read" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** v15 — the index as v13's folder cards. */
export function DossierCards(props: DirectionProps) {
  return <Dossier {...props} index="cards" />;
}

/** v16 — the index as v1's plates, tightened. */
export function DossierPlates(props: DirectionProps) {
  return <Dossier {...props} index="plates" />;
}
