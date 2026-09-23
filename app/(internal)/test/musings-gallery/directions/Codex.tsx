"use client";

import { useRef } from "react";

import {
  AllMusings,
  BEAT_NAME,
  BeatGlyph,
  Contents,
  CoverField,
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
 * v1 · CODEX — master and detail.
 *
 * Built from: the CP2077 codex/journal (Cyberpunk-3 — an entry list with ONE
 * solid-filled row, then the entry), Starfield's starmap panel (framed readout
 * rows), and this house's own `/arcs` log + dossier (ADR-118), which the owner
 * has read and kept. A blog index is a list; the reading pane is what makes it
 * a terminal rather than a web page.
 *
 * Left, the INDEX: one plate per note — its beat's mark outside the plate, the
 * filing date over the title inside it — outlined, the selected one FILLED
 * (ADR-089 U4: fill among outlines). Right, the DOSSIER: every note's is
 * rendered and one is shown, so a hover swaps nothing but an attribute.
 */
export function Codex({ posts }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);

  return (
    <div className="mg mg--codex" data-mg-root="" data-mg-v="v1" ref={ref}>
      <nav className="mg-cx__index" aria-label="Musings">
        <div className="mg-cx__head">
          <span>Index</span>
          <span>{posts.length} notes</span>
        </div>
        <ol className="mg-cx__list" data-mg-keys="">
          {posts.map((p, i) => {
            const beat = beatOfPost(p);
            return (
              <li key={p.slug} className="mg-cx__item">
                <a
                  className="mg-cx__row"
                  href={postHref(p.slug)}
                  data-mg-slug={p.slug}
                  data-mg-on={onAtRest(i)}
                >
                  <BeatGlyph beat={beat} className="mg-cx__glyph" />
                  <span className="mg-cx__plate">
                    <span className="mg-cx__kick">
                      {filed(p)}
                      <span className="mg-cx__beat">{beat ? BEAT_NAME[beat] : ""}</span>
                    </span>
                    <span className="mg-cx__title">{p.title}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
        <div className="mg-cx__foot">
          <AllMusings />
        </div>
      </nav>

      <div className="mg-cx__dossiers">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <article
              key={p.slug}
              className="mg-plate mg-cx__dossier"
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
              aria-label={p.title}
            >
              <header className="mg-band">
                <span className="mg-band__kick">
                  <BeatGlyph beat={beat} className="mg-band__glyph" />
                  {beat ? BEAT_NAME[beat] : "Practice"}
                </span>
                <span className="mg-band__meta">Filed {filed(p)}</span>
              </header>
              <div className="mg-cx__body">
                <h3 className="mg-cx__name">{p.title}</h3>
                <p className="mg-cx__summary">{p.summary}</p>
                <CoverField post={p} posts={posts} className="mg-cx__field" />
                <div className="mg-cx__record">
                  <Contents post={p} className="mg-cx__toc" />
                  <Readout post={p} className="mg-cx__readout" />
                </div>
              </div>
              <div className="mg-cx__go">
                <ReadButton post={p} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
