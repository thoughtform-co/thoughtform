"use client";

import { useRef, type CSSProperties } from "react";

import {
  AllMusings,
  BEAT_NAME,
  ReadButton,
  Readout,
  beatOfPost,
  filed,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
  type GalleryPost,
} from "./kit";

/**
 * v5 · MEMORY MAP — derived from a seed, not a reference.
 *
 * The owner's procedure (2026-09-03): a random string decides the FORM, the
 * house decides the material and the law. The derivation, every rule traced to
 * a finding and every declined offer named, is
 * `docs/design/musings-gallery/seed-memory-map.md`. In one line: 128
 * characters = 8 × 16, so the archive is a field of 128 cells in eight rows of
 * sixteen, and every note takes cells in proportion to the WORDS it holds —
 * its sections subdividing its run. Area is the count (ADR-070 U23's own law,
 * one surface over). The selected note's cells light; its label is the link.
 */

export const MAP_COLS = 16;
export const MAP_ROWS = 8;
const CELLS = MAP_COLS * MAP_ROWS;

/** Largest-remainder shares of `total` over `weights`, each at least `min`. */
function shares(weights: readonly number[], total: number, min = 1): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * (total - min * weights.length));
  const out = raw.map((r) => Math.floor(r) + min);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0; k = (k + 1) % order.length, left -= 1) out[order[k][1]] += 1;
  return out;
}

interface Run {
  post: GalleryPost;
  start: number;
  length: number;
  /** Cell index at which each section begins, relative to the run. */
  sectionStarts: number[];
  /** The longest row segment: where the label is lettered. */
  label: { row: number; col: number; span: number };
}

export function layoutMap(posts: readonly GalleryPost[]): Run[] {
  const lengths = shares(
    posts.map((p) => p.outline.words),
    CELLS,
    Math.min(6, Math.floor(CELLS / Math.max(1, posts.length)))
  );
  let at = 0;
  return posts.map((post, i) => {
    const length = lengths[i];
    const start = at;
    at += length;
    const sections = post.outline.sections.map((s) => s.words);
    const secLens = shares(sections, length, length >= sections.length ? 1 : 0);
    const sectionStarts: number[] = [];
    let acc = 0;
    for (const l of secLens) {
      sectionStarts.push(acc);
      acc += l;
    }
    /* Row segments of the run, row-major; the label takes the longest. */
    let best = { row: 0, col: 0, span: 0 };
    for (let c = start; c < start + length; ) {
      const row = Math.floor(c / MAP_COLS);
      const col = c % MAP_COLS;
      const span = Math.min(MAP_COLS - col, start + length - c);
      if (span > best.span) best = { row, col, span };
      c += span;
    }
    return { post, start, length, sectionStarts, label: best };
  });
}

export function MemoryMap({ posts }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  useLabSelect(ref);
  const runs = layoutMap(posts);
  const words = posts.reduce((n, p) => n + p.outline.words, 0);

  return (
    <div className="mg mg--memory" data-mg-root="" data-mg-v="v5" ref={ref}>
      <section className="mg-plate mg-mm__map" aria-label="Musings, by the words each holds">
        <header className="mg-band">
          <span className="mg-band__kick">Archive</span>
          <span className="mg-band__meta">
            {posts.length} notes · {words} words
          </span>
        </header>
        <div className="mg-mm__scale" aria-hidden="true">
          {Array.from({ length: MAP_COLS + 1 }, (_, c) => (
            <span
              key={c}
              className={`mg-mm__tick${c % 4 === 0 ? " mg-mm__tick--q" : ""}`}
              style={{ left: `${(c / MAP_COLS) * 100}%` }}
            />
          ))}
        </div>
        <div
          className="mg-mm__grid"
          style={{ "--mg-cols": MAP_COLS, "--mg-rows": MAP_ROWS } as CSSProperties}
        >
          {runs.flatMap((r, i) =>
            Array.from({ length: r.length }, (_, k) => {
              const c = r.start + k;
              const sec = r.sectionStarts.filter((s) => s <= k).length - 1;
              return (
                <span
                  key={`${r.post.slug}-${k}`}
                  className="mg-mm__cell"
                  data-mg-slug={r.post.slug}
                  data-mg-on={onAtRest(i)}
                  data-post-start={k === 0 ? "" : undefined}
                  data-sec-start={k > 0 && r.sectionStarts.includes(k) ? "" : undefined}
                  data-alt={i % 2 ? "" : undefined}
                  data-sec={sec % 2 ? "b" : "a"}
                  style={{
                    gridRow: Math.floor(c / MAP_COLS) + 1,
                    gridColumn: (c % MAP_COLS) + 1,
                  }}
                  aria-hidden="true"
                />
              );
            })
          )}
          {runs.map((r, i) => (
            <a
              key={r.post.slug}
              className="mg-mm__label"
              href={postHref(r.post.slug)}
              data-mg-slug={r.post.slug}
              data-mg-on={onAtRest(i)}
              data-narrow={r.label.span < 4 ? "" : undefined}
              style={{
                gridRow: r.label.row + 1,
                gridColumn: `${r.label.col + 1} / span ${r.label.span}`,
              }}
            >
              <span className="mg-mm__date">{filed(r.post)}</span>
              <span className="mg-mm__title">{r.post.title}</span>
            </a>
          ))}
        </div>
      </section>

      <div className="mg-mm__readouts">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          return (
            <article
              key={p.slug}
              className="mg-plate mg-mm__readout"
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
              aria-label={p.title}
            >
              <div className="mg-mm__text">
                <span className="mg-mm__kick">
                  {beat ? BEAT_NAME[beat] : "Practice"} · Filed {filed(p)}
                </span>
                <h3 className="mg-mm__name">{p.title}</h3>
                <p className="mg-mm__summary">{p.summary}</p>
              </div>
              <Readout post={p} className="mg-mm__rows" />
              <div className="mg-mm__go">
                <ReadButton post={p} />
                <AllMusings className="mg-mm__all" />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
