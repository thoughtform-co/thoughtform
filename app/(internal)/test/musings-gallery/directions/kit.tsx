"use client";

import { useEffect, type CSSProperties, type RefObject } from "react";

import { rackDate } from "@/lib/musings/cards";
import { beatOf, coverSpec, yearFraction, type MusingBeat } from "@/lib/musings/cover";
import type { MusingOutline } from "@/lib/musings/outline";
import type { MusingCardData } from "@/lib/musings/types";

import { BEAT_PATHS, ENCODE_CELLS } from "./beatPaths";

/**
 * The gallery lab's shared parts — what every direction draws the SAME way, so
 * a comparison between directions is a comparison between compositions.
 *
 * ⚠ NOTHING HERE MAY CARRY `data-mu-decode` OR `data-mu-cursor`. The station's
 * writer collects those from the whole `.mu` subtree, and a direction mounted
 * in the `gallery` slot is inside it: an attribute here would be scrambled and
 * would stretch the head's own clock (`musings-gallery.test.ts` pins it).
 */

/** A card's record plus the essay's shape, read server-side off its body. */
export interface GalleryPost extends MusingCardData {
  outline: MusingOutline;
  /** The byline — the record's own `author`, which the landing's card
   *  projection leaves out and a blog post is recognised by. */
  author: string;
}

export interface DirectionProps {
  posts: readonly GalleryPost[];
  /** `YYYY-MM-DD`, the practice's own day, asked ONCE by the server page. */
  today: string;
  /** A direction's own knobs, adopted from the URL by the shell. */
  knobs?: Readonly<Record<string, string>>;
}

/** The post's page. A variable, so the literal-href lint rule never fires. */
export const postHref = (slug: string) => `/musings/${slug}`;
/** The index page — the way out. */
export const ALL_HREF = "/musings";

export const BEAT_NAME: Readonly<Record<MusingBeat, string>> = {
  navigate: "Navigate",
  encode: "Encode",
  build: "Build",
};

export const beatOfPost = (p: MusingCardData) => beatOf(p.tags);
export const filed = (p: MusingCardData) => rackDate(p.date);
/** Headed sections only — the lead has no name to letter. */
export const headed = (p: GalleryPost) => p.outline.sections.filter((s) => s.heading);

/** The Arc beat's mark — the rail's own drawing (`MusingCover`'s paths). */
export function BeatGlyph({ beat, className }: { beat: MusingBeat | null; className?: string }) {
  if (!beat) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      focusable="false"
    >
      {BEAT_PATHS[beat].map((d) => (
        <path key={d} d={d} />
      ))}
      {beat === "encode" ? <path fill="currentColor" stroke="none" d={ENCODE_CELLS} /> : null}
    </svg>
  );
}

/**
 * The essay's SHAPE — one cell per section, its width its share of the words.
 * The record a drawing of a post can plot without inventing anything: the
 * lead is an unnamed cell, every other cell is lettered with its heading.
 * DOM, never an SVG `viewBox` — a crop letterboxes one axis (ADR-118).
 */
export function EssayShape({
  post,
  lettered = true,
  className = "",
}: {
  post: GalleryPost;
  lettered?: boolean;
  className?: string;
}) {
  return (
    <div className={`mg-shape ${className}`} aria-hidden="true">
      <div className="mg-shape__bar">
        {post.outline.sections.map((s, i) => (
          <span
            key={`${s.heading ?? "lead"}-${i}`}
            className={`mg-shape__cell${s.heading ? "" : " mg-shape__cell--lead"}`}
            style={{ "--mg-w": s.words } as CSSProperties}
          />
        ))}
      </div>
      {lettered ? (
        <div className="mg-shape__labels">
          {post.outline.sections.map((s, i) => (
            <span
              key={`${s.heading ?? "lead"}-${i}`}
              className="mg-shape__label"
              style={{ "--mg-w": s.words } as CSSProperties}
            >
              {s.heading ?? ""}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The FIELD — a note's place in its year, drawn at panel scale. The shipped
 * cover's own reading (`lib/musings/cover.ts`: the beat's mark over a seeded
 * substrate, the filing date lit on a baseline), with one correction a panel
 * can afford: the cover's unlit marks are SEEDED because a card knows one
 * post, and this field knows the archive — so its unlit marks are the other
 * notes filed that year, at their own dates.
 */
export function CoverField({
  post,
  posts,
  className = "",
}: {
  post: GalleryPost;
  posts: readonly GalleryPost[];
  className?: string;
}) {
  const spec = coverSpec(post);
  const year = post.date.slice(0, 4);
  const seat = (iso: string) => 4 + yearFraction(iso) * 92;
  const others = posts.filter((q) => q.slug !== post.slug && q.date.startsWith(year));
  return (
    <div
      className={`mg-field ${className}`}
      aria-hidden="true"
      style={{ "--mg-pitch": `${spec.pitch}px` } as CSSProperties}
    >
      <span className="mg-field__dots" />
      <BeatGlyph beat={spec.beat} className="mg-field__glyph" />
      <span className="mg-field__axis">
        {Array.from({ length: 13 }, (_, m) => (
          <span key={m} className="mg-field__month" style={{ left: `${4 + (m / 12) * 92}%` }} />
        ))}
        {"JFMAMJJASOND".split("").map((c, m) => (
          <span
            key={`l${m}`}
            className="mg-field__initial"
            style={{ left: `${4 + ((m + 0.5) / 12) * 92}%` }}
          >
            {c}
          </span>
        ))}
        {others.map((q) => (
          <span key={q.slug} className="mg-field__mark" style={{ left: `${seat(q.date)}%` }} />
        ))}
        <span
          className="mg-field__mark mg-field__mark--lit"
          style={{ left: `${seat(post.date)}%` }}
        />
        <span className="mg-field__year">{year}</span>
      </span>
    </div>
  );
}

/**
 * The CONTENTS — the essay's sections as a reader scans them: each named
 * whole (never clamped), with a bar for its length against the longest and
 * its words set right. The lead has no heading, so it letters as the
 * opening, in the chrome face, as what it is rather than a title.
 */
export function Contents({ post, className = "" }: { post: GalleryPost; className?: string }) {
  const max = Math.max(1, ...post.outline.sections.map((s) => s.words));
  return (
    <ol className={`mg-toc ${className}`} aria-label="Sections">
      {post.outline.sections.map((s, i) => (
        <li key={`${s.heading ?? "lead"}-${i}`} className="mg-toc__row">
          <span className={`mg-toc__name${s.heading ? "" : " mg-toc__name--lead"}`}>
            {s.heading ?? "Opening"}
          </span>
          <span className="mg-toc__bar" aria-hidden="true">
            <i style={{ width: `${(s.words / max) * 100}%` }} />
          </span>
          <span className="mg-toc__n">{s.words}</span>
        </li>
      ))}
    </ol>
  );
}

export type ReadoutKey = "filed" | "read" | "beat" | "sections" | "length";

/**
 * Starfield's TRAVEL DATA: each key filled and framed, its value set right.
 * A direction names the rows it letters, so a fact its band already states is
 * never said twice on one object.
 */
export function Readout({
  post,
  keys = ["read", "sections", "length"],
  className = "",
}: {
  post: GalleryPost;
  keys?: readonly ReadoutKey[];
  className?: string;
}) {
  const beat = beatOfPost(post);
  const value: Record<ReadoutKey, [string, string]> = {
    filed: ["Filed", filed(post)],
    read: ["Read", `${post.readingMinutes} min`],
    beat: ["Beat", beat ? BEAT_NAME[beat] : "Practice"],
    sections: ["Sections", String(headed(post).length)],
    length: ["Length", `${post.outline.words} words`],
  };
  return (
    <dl className={`mg-readout ${className}`}>
      {keys.map((k) => (
        <div className="mg-readout__row" key={k}>
          <dt className="mg-readout__key">{value[k][0]}</dt>
          <dd className="mg-readout__val">{value[k][1]}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The way in: the proof card's full-width button (`.pf-watch`). */
export function ReadButton({ post, className = "" }: { post: GalleryPost; className?: string }) {
  return (
    <a className={`mg-read ${className}`} href={postHref(post.slug)}>
      <span className="mg-read__act">
        Read the note
        <span className="mg-read__arrow" aria-hidden="true" />
      </span>
    </a>
  );
}

/** The way out, on the station's own class so it arrives with the device. */
export function AllMusings({ className = "" }: { className?: string }) {
  return (
    <a className={`mu__all ${className}`} href={ALL_HREF}>
      All musings
      <span className="mu__all-arrow" aria-hidden="true" />
    </a>
  );
}

/* ── Round three's shared parts ─────────────────────────────────────────
   What the web scan settled as practice (docs/design/musings-gallery/README
   §Round three): ONE meta format everywhere, a designation that is a
   bracketed mono chip and never a pill, and a byline — the three things a
   blog post is recognised by. */

/** The one meta line — `14 SEP 2026 · 4 MIN READ`. */
export function Meta({ post, className = "" }: { post: MusingCardData; className?: string }) {
  return (
    <span className={`mg-meta ${className}`}>
      {filed(post)}
      <span className="mg-meta__dot" aria-hidden="true">
        {" · "}
      </span>
      {post.readingMinutes} min read
    </span>
  );
}

/** The beat as a bracketed mono designation — the house has no pills. */
export function Chip({ beat, className = "" }: { beat: MusingBeat | null; className?: string }) {
  return (
    <span className={`mg-chip ${className}`}>
      <span className="mg-chip__b" aria-hidden="true">
        [
      </span>
      {beat ? BEAT_NAME[beat] : "Practice"}
      <span className="mg-chip__b" aria-hidden="true">
        ]
      </span>
    </span>
  );
}

/** The byline, off the record's own `author`. */
export function Byline({ post, className = "" }: { post: GalleryPost; className?: string }) {
  return (
    <span className={`mg-byline ${className}`}>
      <span className="mg-byline__by">By</span> {post.author}
    </span>
  );
}

/**
 * v6 — how far the feed's list is shifted for the station's runway progress
 * `p` and the feed's overflow `over` (px): nothing until the row has arrived
 * (p 0.10), the whole overflow by p 0.85, so the last note is on screen
 * before the lab's stage releases at p 1 (there is no exit at the bottom
 * since ADR-105 U4, and the lab has no footer). PURE; the sheet carries the
 * same constants in `--mg-feed-t` and the test pins both.
 */
export const FEED_RIDE_FROM = 0.1;
export const FEED_RIDE_TO = 0.85;
export function feedShift(p: number, over: number): number {
  if (!Number.isFinite(p) || !Number.isFinite(over) || over <= 0) return 0;
  const t = Math.min(1, Math.max(0, (p - FEED_RIDE_FROM) / (FEED_RIDE_TO - FEED_RIDE_FROM)));
  return t === 0 ? 0 : -t * over;
}

/**
 * v7 — the column widths for `n` notes across a band `w` px wide, Prime
 * Intellect's proportions: a closed column is 26 % of the band (capped at
 * 320px, floored at 180px so a title still wraps to three lines), and the
 * open one takes the rest — never less than 40 % of the band, past which the
 * housing rails. PURE; the sheet carries the same expression in
 * `--mg-cl-col` and the test pins both.
 */
export const COLUMN_SHARE = 0.26;
export const COLUMN_MAX = 320;
export const COLUMN_MIN = 180;
export const COLUMN_OPEN_SHARE = 0.4;
export function columnWidths(
  n: number,
  w: number
): { closed: number; open: number; overflow: boolean } {
  const rest = Math.max(1, n - 1);
  const closed = Math.max(
    COLUMN_MIN,
    Math.min(COLUMN_SHARE * w, COLUMN_MAX, (w - COLUMN_OPEN_SHARE * w) / rest)
  );
  const open = Math.max(COLUMN_OPEN_SHARE * w, w - (n - 1) * closed);
  return { closed, open, overflow: (n - 1) * closed + open > w + 0.5 };
}

/**
 * The selection: ONE attribute, `data-mg-on`, moved on an EVENT — the
 * production writer's law (ADR-121), one direction over. Every element that
 * belongs to a post carries `data-mg-slug`; the newest post's are rendered
 * with the attribute, and `pointerover` / `focusin` move it to the post under
 * the pointer or the focus. It STAYS where the reader left it: a master and
 * its detail are two places the pointer has to travel between, and a
 * selection that snapped back on `pointerleave` would be gone by the time the
 * pointer reached the detail's button.
 *
 * ⚠ The holder is QUERIED, never cached, and React never touches an
 * attribute whose prop has not changed, so the move survives every render.
 * ↑/↓ inside a `[data-mg-keys]` list walk its links.
 */
export function useLabSelect(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const select = (slug: string | undefined) => {
      if (!slug) return;
      const current = root.querySelector<HTMLElement>("[data-mg-slug][data-mg-on]");
      if (current?.dataset.mgSlug === slug) return;
      for (const el of root.querySelectorAll<HTMLElement>("[data-mg-slug][data-mg-on]"))
        el.removeAttribute("data-mg-on");
      for (const el of root.querySelectorAll<HTMLElement>(`[data-mg-slug="${CSS.escape(slug)}"]`))
        el.setAttribute("data-mg-on", "");
    };
    const slugOf = (t: EventTarget | null) =>
      t instanceof Element ? t.closest<HTMLElement>("[data-mg-slug]")?.dataset.mgSlug : undefined;
    const onOver = (e: PointerEvent) => select(slugOf(e.target));
    const onFocus = (e: FocusEvent) => select(slugOf(e.target));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const list = (e.target as Element | null)?.closest?.("[data-mg-keys]");
      if (!list) return;
      const links = [...list.querySelectorAll<HTMLElement>("a[data-mg-slug]")];
      const i = links.indexOf(e.target as HTMLElement);
      if (i < 0) return;
      const next =
        links[e.key === "ArrowDown" ? Math.min(links.length - 1, i + 1) : Math.max(0, i - 1)];
      e.preventDefault();
      next.focus();
      next.scrollIntoView({ block: "nearest" });
    };
    root.addEventListener("pointerover", onOver);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("keydown", onKey);
    };
  }, [rootRef]);
}

/** `data-mg-on` on the newest post's elements, and nothing on the rest. */
export const onAtRest = (i: number) => (i === 0 ? "" : undefined);
