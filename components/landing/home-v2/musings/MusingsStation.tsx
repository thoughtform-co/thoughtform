"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

import { MUSINGS_COORDS, MUSINGS_MASTHEAD, MUSINGS_TITLE_TEXT } from "@/lib/musings/mastheadData";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingCard } from "./MusingCard";
import { useMusingsScroll } from "./useMusingsScroll";

/**
 * `#musings` — the writing, as a row that opens on hover (ADR-121).
 *
 * The owner, 2026-09-23, on ADR-119's 3D row read live: _"what we currently
 * have looks ugly, so I want to remove the jukebox carousel thing because it's
 * not working. I just want to do something simpler."_ The reference is
 * Lighthouse HQ's customer row — a flex row in which the card under the
 * pointer grows wide and the rest collapse to narrow strips — re-cut in the
 * house material: glass, the notch, the gold lip. At rest the NEWEST post is
 * open; no timer.
 *
 * Composition: the masthead on the editorial band, the row under it, one way
 * out. The head's decode is `lib/musings/headDecode.ts`, the arrival
 * `lib/musings/arrive.ts`, the clock `useMusingsScroll`; this file is the
 * arrangement and nothing else. The row has NO geometry module any more —
 * the mechanic is one transitioned `flex-grow` in the sheet.
 *
 * ⚠ **ON THE STAGE RUNG THE STATION IS TRANSPARENT AND `.mu__band` IS THE
 * COVER** (ADR-119 U1 §1): the corridor stays alive behind the whole beat and
 * dies on the band. Off it the station is opaque again and is its own cover.
 *
 * ⚠ **THE ROW IS ONE REF AND THE WRITER DELEGATES.** No per-card refs, no
 * per-card poses: `useMusingsScroll` listens on the row for `pointerover` /
 * `focusin` and moves `data-mu-open` to the card under them.
 *
 * ⚠ **EVERY CARD RENDERS, ALWAYS.** The attribute is what opens a card; the
 * arrival's aperture is what hides one.
 *
 * ⚠ **`gallery` IS A LAB SEAM, AND PRODUCTION NEVER FILLS IT.** Given a node,
 * it takes the place of the row AND the way out, so a direction in
 * `/test/musings-gallery` is judged under the REAL head, pinned stage, decode
 * and arrival stamps rather than a copy of them. Omitted, the render is
 * byte-identical (`musings-row.test.ts` pins that `MusingsPortal` passes
 * nothing). `!== undefined`, never `??`: `null` is a direction that draws
 * nothing, and must stay distinguishable from no direction at all. With no row
 * mounted the writer's card handlers find no row and do nothing.
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
  const bandRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);

  useMusingsScroll(runwayRef, rootRef, rowRef, posts.length, bandRef);

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
            <>
              {posts.length > 0 ? (
                /* ⚠ ONE FLEX ROW, AND THE CARDS ARE ITS DIRECT CHILDREN — the
                   writer queries `:scope > .mu-card` and the sheet's `--mu-open-w`
                   is solved off this box's own inline size. A wrapper between the
                   two would change both answers silently. */
                <div className="mu__row" ref={rowRef}>
                  {posts.map((post, i) => (
                    <MusingCard key={post.slug} post={post} index={i} />
                  ))}
                </div>
              ) : (
                /* ⚠ NO POSTS IS A REAL STATE, AND IT MAY NOT BE A BLANK VIEWPORT.
                   Every post on disk is a draft until one is published, and this
                   station is an opaque full-screen cover either way — so with an
                   empty row it says so and keeps its way out. */
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
            </>
          )}
        </div>
      </div>

      {/* ⚠ THE BAND IS THE STATION'S OPAQUE END, AND IT DOES TWO JOBS (ADR-119
          U1 §4). On the stage rung the station itself is TRANSPARENT over the
          live corridor, so something has to (a) be the corridor's kill edge —
          an opaque surface that fills the frame, which is the only property
          `about-voidwalker-handoff-boundaries` actually asserts — and (b) be
          the thing that lifts off the held footer, which is what the reveal
          means. One 100svh full-bleed box is both, and the two edges are the
          same rect by construction rather than by two tuned numbers.

          ⚠ It is `display: none` off the stage rung: at 961–1100, under PRM and
          on the phone the STATION is opaque again and is its own cover, and a
          second opaque viewport there would be a blank screen nobody asked for. */}
      <div className="mu__band" ref={bandRef} aria-hidden="true" />
    </div>
  );
}
