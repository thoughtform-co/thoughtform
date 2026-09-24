"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { MUSINGS_COORDS, MUSINGS_MASTHEAD, MUSINGS_TITLE_TEXT } from "@/lib/musings/mastheadData";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingNote } from "./MusingNote";
import { useMusingsScroll } from "./useMusingsScroll";

/**
 * `#musings` — the writing, as a LIST of notes that opens on hover (ADR-122).
 *
 * The owner, 2026-09-24, after six rounds of the gallery lab: "Let's go for
 * V17 and maybe we can show more, maybe 5 in total. Implement this on our
 * homepage." v17 is v4's contents page — every title whole and large — cut
 * into the house's folder cards (v13's framing: "I'm not really a fan of
 * horizontal dividers that don't close"), each card carrying its drawn cover
 * unframed in its last column, drawn in the register of the About drawing.
 * At rest the NEWEST note is open; no timer.
 *
 * Composition: the masthead on the editorial band, the notes under it, one
 * way out. The head's decode is `lib/musings/headDecode.ts`, the arrival
 * `lib/musings/arrive.ts`, the clock `useMusingsScroll`; this file is the
 * arrangement and nothing else. The list's sizing is solved from the count in
 * the sheet (the rows share what the open card leaves), never measured here.
 *
 * ⚠ **ON THE STAGE RUNG THE STATION IS TRANSPARENT AND THE FOOTER IS THE
 * COVER** (ADR-119 U1 §1 → ADR-105 U4): the corridor stays alive behind the
 * whole beat and dies under the footer as it rises over the pinned stage. The
 * 100svh `.mu__band` that used to end the station was one viewport of empty
 * stars, and it is deleted. Off the stage rung the station is opaque and the
 * corridor has already died at the era stage.
 *
 * ⚠ **THE LIST IS ONE REF AND THE WRITER DELEGATES.** No per-note refs:
 * `useMusingsScroll` listens on the list for `pointerover` / `focusin` and
 * moves `data-mu-open` to the note under them — and leaves it there.
 *
 * ⚠ **`gallery` IS A LAB SEAM, AND PRODUCTION NEVER FILLS IT.** Given a node,
 * it takes the place of the notes AND the way out, so a direction in
 * `/test/musings-gallery` is judged under the REAL head, pinned stage, decode
 * and arrival stamps rather than a copy of them. Omitted, the render is
 * byte-identical (`musings-row.test.ts` pins that `MusingsPortal` passes
 * nothing). `!== undefined`, never `??`: `null` is a direction that draws
 * nothing, and must stay distinguishable from no direction at all. With no
 * list mounted the writer's note handlers find no list and do nothing.
 */
export function MusingsStation({
  posts,
  gallery,
}: {
  posts: readonly MusingCardData[];
  gallery?: ReactNode;
}) {
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);

  useMusingsScroll(runwayRef, rootRef, listRef, posts.length);

  return (
    <div className="mu" ref={rootRef} style={{ "--mu-n": posts.length } as CSSProperties}>
      <div className="mu__runway" ref={runwayRef}>
        <div className="mu__stage">
          {/* ⚠ THE SERVICES MASTHEAD'S GRAMMAR, COPIED (ADR-119 U1, owner:
              "the services section has the typography, font size, etc., that
              we want"). Two columns sharing one top line — the title left
              under its designation and origin cross, the brief right under
              its own designation and the single gold state chip — each block
              on a masked dot-grid lift with a coordinate stamp dropped under
              its foot. The record and the stamps are `lib/musings/
              mastheadData.ts`; the strings are authored uppercase and this
              sheet declares no `text-transform` (ADR-092). */}
          <header className="mu__head">
            <div className="mu__head-lead">
              <i className="mu__grid" aria-hidden="true" />
              <i className="mu__mark mu__mark--origin" aria-hidden="true" />
              <span className="mu__desig" aria-hidden="true" data-mu-decode="scramble">
                {MUSINGS_MASTHEAD.desigTitle}
              </span>
              {/* ⚠ THE ACCESSIBLE NAME IS THE UNDECODED TITLE. The scramble
                  writes `textContent`, so a reader reaching the heading
                  mid-decode would be given the shuffle; an `aria-label` on the
                  heading overrides its contents and is stable for the whole
                  beat. The paragraph needs no equivalent — the typewriter only
                  truncates, so every frame of it is real prose. */}
              {/* ⚠ THE DECODED RUN IS AN INNER SPAN, NOT THE LINE. The decode
                  writes `textContent`, which would wipe a sibling — so the
                  line holds the run AND the CRT cursor, and the cursor hangs
                  on the line (`data-mu-cursor`, lit by `data-live`) the way
                  `ServicesMasthead` hangs its own. `data-mu-order` is the
                  line's stagger slot: 0.18s apart, services' own number. */}
              <h2 className="mu__title" aria-label={MUSINGS_TITLE_TEXT}>
                {MUSINGS_MASTHEAD.titleLines.map((line, i) => (
                  <span
                    key={line.text}
                    className={`mu__title-line${line.em ? " mu__title-line--em" : ""}`}
                    data-mu-cursor=""
                  >
                    <span data-mu-decode="scramble" data-mu-order={i}>
                      {line.text}
                    </span>
                    <span className="mu__cursor" aria-hidden="true">
                      █
                    </span>
                  </span>
                ))}
              </h2>
              <span className="mu__coord" aria-hidden="true">
                {MUSINGS_COORDS[0]}
              </span>
            </div>
            <div className="mu__head-brief">
              <i className="mu__grid" aria-hidden="true" />
              <span className="mu__desig" aria-hidden="true" data-mu-decode="scramble">
                {MUSINGS_MASTHEAD.desigBrief}
              </span>
              <span className="mu__state" aria-hidden="true" data-mu-decode="scramble">
                {MUSINGS_MASTHEAD.state}
              </span>
              {/* ⚠ GHOST AND LIVE, services' own pair: the hidden ghost holds
                  the paragraph's whole box in flow and the typed layer is
                  ABSOLUTE over it, so the typewriter never reflows the head —
                  a growing box under a pinned stage is layout churn the scroll
                  anchor answers by nudging the page. */}
              <p className="mu__brief" data-mu-cursor="">
                <span className="mu__brief-ghost" aria-hidden="true">
                  {MUSINGS_MASTHEAD.brief}
                </span>
                <span className="mu__brief-typed">
                  <span data-mu-decode="type">{MUSINGS_MASTHEAD.brief}</span>
                  <span className="mu__cursor" aria-hidden="true">
                    █
                  </span>
                </span>
              </p>
              <span className="mu__coord mu__coord--r" aria-hidden="true">
                {MUSINGS_COORDS[1]}
              </span>
              <i className="mu__mark mu__mark--close" aria-hidden="true" />
            </div>
          </header>

          {gallery !== undefined ? (
            gallery
          ) : (
            /* ⚠ ONE BOX FOR THE NOTES AND THE WAY OUT. On the pinned rung it is
               the size container the list's rows are solved in — the rows
               share what the open card and the way out leave of it — so the
               way out lives inside it, not beside it. */
            <div className="mu__notes">
              {posts.length > 0 ? (
                /* ⚠ THE NOTES ARE THE LIST'S DIRECT CHILDREN — the writer
                   queries `:scope > .mu-note`, and a wrapper between the two
                   would change its answer silently. */
                <ol className="mu__list" ref={listRef} aria-label="Musings">
                  {posts.map((post, i) => (
                    <MusingNote key={post.slug} post={post} posts={posts} index={i} />
                  ))}
                </ol>
              ) : (
                /* ⚠ NO POSTS IS A REAL STATE, AND IT MAY NOT BE A BLANK VIEWPORT.
                   Every post on disk is a draft until one is published, and this
                   station is an opaque full-screen cover either way — so with an
                   empty list it says so and keeps its way out. */
                <p className="mu__empty">The first notes are being written.</p>
              )}

              <div className="mu__foot">
                {/* ⚠ A PLAIN `<a>`, AND `next/link` IS NOT AN OPTION HERE. This
                    station renders inside a nested `createRoot`, which does NOT
                    inherit React context from the tree that mounted it — so
                    `Link` has no App Router context to read and its client
                    navigation cannot work. Every internal link on the site
                    footer, mounted the same way one station down, is a plain
                    anchor for the same reason; there the rule simply does not
                    fire because the href arrives as a variable. A full document
                    navigation is the correct behaviour out of a detached root. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a className="mu__all" href="/musings">
                  All musings
                  <span className="mu__all-arrow" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
