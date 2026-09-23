"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  AllMusings,
  Byline,
  Chip,
  FEED_RIDE_FROM,
  FEED_RIDE_TO,
  Meta,
  beatOfPost,
  feedShift,
  onAtRest,
  postHref,
  useLabSelect,
  type DirectionProps,
} from "./kit";
import { NoteCover, NoteThumb, coverKindOf } from "./NoteCover";

/**
 * v6 · FEATURE — Cohere's blog index, in the house material.
 *
 * Built from: cohere.com/blog (the owner's first reference for round three):
 * two columns at 2:1, the newest note as a FEATURE on the left — a large
 * picture, the category chip, a ~44px title, one line of dek, `SEP 11, 2026 •
 * 5 MIN READ` in mono — and on the right a FEED of the rest, hairline-ruled,
 * that scrolls while the feature stays.
 *
 * Here the pinned stage IS the sticky. Left, the feature: one folder plate
 * that is one link — the drawn cover at its top, the bracketed chip, the
 * title whole, the dek, the meta line, the byline and the way in. Right, the
 * feed: EVERY note as a ruled row (thumbnail · chip · title · meta), the one
 * in the feature carrying the lit mark, so the list never reflows and the
 * reader can go back to the newest. Hover or focus on a row moves the
 * feature; every feature pane is rendered and one is shown.
 *
 * ⚠ THE FEED RIDES THE RUNWAY WHEN IT OVERFLOWS ("the blog post scrolling
 * into view"). At three notes it fits and nothing moves. Past the box — five
 * at 1280, seven anywhere — the list translates by the station's own
 * progress (`--mg-p`, the shell's copy of the writer's formula) between the
 * row's arrival and just before it closes, so the feature stays put and the
 * feed scrolls with the page. `--mg-feed-over` is the measured overflow; the
 * shift itself is the sheet's arithmetic (`feedShift` in the kit is the same
 * expression, pinned by the test). Keyboard: a row focused outside the clip
 * scrolls the PAGE to the progress that brings it in — the browse band's own
 * precedent, a click pins the scroll.
 *
 * Not taken: Cohere's category chip row. A filter over three notes is chrome
 * promising a choice the archive cannot yet make.
 */

function useFeedRide(
  boxRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const box = boxRef.current;
    const list = listRef.current;
    if (!box || !list) return;
    const measure = () => {
      const over = Math.max(0, list.offsetHeight - box.clientHeight);
      box.style.setProperty("--mg-feed-over", `${Math.round(over)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(list);
    /* A row focused outside the clip box: scroll the page to the progress that
       brings it in. `p` maps onto the shift linearly, so it inverts. */
    const onFocus = (e: FocusEvent) => {
      const row =
        e.target instanceof HTMLElement ? e.target.closest<HTMLElement>(".mg-ft__item") : null;
      if (!row) return;
      const over = parseFloat(box.style.getPropertyValue("--mg-feed-over")) || 0;
      if (over <= 0) return;
      const rowTop = row.offsetTop;
      const rowBottom = rowTop + row.offsetHeight;
      /* `--mg-p` is a plain number the shell writes; the shift is the kit's own
         arithmetic, never a `calc()` read back off the sheet (a custom
         property is a string until something lays it out). */
      const p = parseFloat(getComputedStyle(box).getPropertyValue("--mg-p")) || 0;
      const seen = -feedShift(p, over);
      let need: number | null = null;
      if (rowBottom > seen + box.clientHeight) need = rowBottom - box.clientHeight;
      else if (rowTop < seen) need = rowTop;
      if (need == null) return;
      const t = Math.min(1, Math.max(0, need / over));
      const target = FEED_RIDE_FROM + t * (FEED_RIDE_TO - FEED_RIDE_FROM);
      const runway = box.closest<HTMLElement>(".mu")?.querySelector<HTMLElement>(".mu__runway");
      if (!runway) return;
      const vh = document.documentElement.clientHeight;
      const top = runway.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(1, runway.offsetHeight - vh);
      window.scrollTo({ top: Math.round(top + target * travel), behavior: "instant" });
    };
    box.addEventListener("focusin", onFocus);
    return () => {
      ro.disconnect();
      box.removeEventListener("focusin", onFocus);
    };
  }, [boxRef, listRef]);
}

export function Feature({ posts, knobs }: DirectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  useLabSelect(ref);
  useFeedRide(boxRef, listRef);
  const cover = coverKindOf(knobs?.cover, "dial");

  return (
    <div className="mg mg--feature" data-mg-root="" data-mg-v="v6" data-mg-cover={cover} ref={ref}>
      <div className="mg-ft__features">
        {posts.map((p, i) => {
          const beat = beatOfPost(p);
          /* ⚠ The PANE carries the slug and the state; the LINK inside it
             carries neither. Every feature is rendered and the hidden ones
             are `visibility: hidden`, so a `a[data-mg-slug]` on the pane
             would be the first match for its note — a hidden link the
             capture (and a reader's Tab) would land on instead of the feed's
             row. `useLabSelect` climbs to the pane's slug from anywhere in it. */
          return (
            <article
              key={p.slug}
              className="mg-plate mg-ft__feature"
              data-mg-slug={p.slug}
              data-mg-on={onAtRest(i)}
              aria-label={p.title}
            >
              <a className="mg-ft__link" href={postHref(p.slug)}>
                <span className="mg-ft__cover" aria-hidden="true">
                  <NoteCover post={p} posts={posts} kind={cover} />
                </span>
                <span className="mg-ft__copy">
                  <Chip beat={beat} className="mg-ft__chip" />
                  <span className="mg-ft__title">{p.title}</span>
                  <span className="mg-ft__dek">{p.summary}</span>
                  <span className="mg-ft__foot">
                    <span className="mg-ft__sign">
                      <Meta post={p} className="mg-ft__meta" />
                      <Byline post={p} className="mg-ft__byline" />
                    </span>
                    <span className="mg-ft__go">
                      Read the note
                      <span className="mg-read__arrow" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </a>
            </article>
          );
        })}
      </div>

      <div className="mg-ft__feed">
        <div className="mg-ft__feed-head">
          <span>Latest</span>
          <span>{posts.length} notes</span>
        </div>
        <div className="mg-ft__box" ref={boxRef}>
          <ol className="mg-ft__list" data-mg-keys="" ref={listRef}>
            {posts.map((p, i) => {
              const beat = beatOfPost(p);
              return (
                <li
                  key={p.slug}
                  className="mg-ft__item"
                  data-mg-slug={p.slug}
                  data-mg-on={onAtRest(i)}
                >
                  <a className="mg-ft__row" href={postHref(p.slug)} data-mg-slug={p.slug}>
                    <span className="mg-ft__thumb">
                      <NoteThumb post={p} posts={posts} />
                    </span>
                    <span className="mg-ft__text">
                      <Chip beat={beat} className="mg-ft__rowchip" />
                      <span className="mg-ft__rowtitle">{p.title}</span>
                      <Meta post={p} className="mg-ft__rowmeta" />
                    </span>
                    <span className="mg-ft__mark" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mg-ft__feed-foot">
          <AllMusings />
        </div>
      </div>
    </div>
  );
}
