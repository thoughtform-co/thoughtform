"use client";

import { useCallback, useRef, type CSSProperties } from "react";

import type { MusingCardData } from "@/lib/musings/types";

import { MusingCard } from "./MusingCard";
import { useMusingsScroll } from "./useMusingsScroll";

/**
 * `#musings` — the writing, as a rack you flip through (ADR-119).
 *
 * The owner's ask, 2026-09-22: the post in view is a clean card with a
 * thumbnail, a title and a summary; the others sit beside it ROTATED ABOUT
 * THE VERTICAL AXIS so their sides show — "a jukebox or rotodex … it really
 * feels like you're scrolling through a digital folder" — and the whole thing
 * comes into view as you scroll away from the era stage.
 *
 * Composition: the masthead on the editorial band, the rack under it, one way
 * out. The rig's geometry is `lib/musings/rackMath.ts` and the clock is
 * `useMusingsScroll`; this file is the arrangement and nothing else.
 *
 * ⚠ **THE STATION IS THE CORRIDOR'S OPAQUE COVER NOW** (ADR-119 §4, taking
 * the role from `#contact`, which held it under ADR-105). Two consequences
 * that are not this component's to fix but are its to know: the station keeps
 * `.station:not(.hero)`'s own `var(--void)` ground and stars — the handoff
 * guard asserts `alpha === 1` AND a background image, and a station whose
 * only ground is its content fails both — and `home-v2.css`'s cover rule and
 * `useCorridorExitScroll`'s next-station query must name `#musings` together
 * (ADR-030 §6's seam bug, on record as hit five times).
 *
 * ⚠ **THE PERSPECTIVE IS ON THE RIG AND THE IDLE YAW ON THE RACK**, one level
 * apart: `perspective` resolves against the element that declares it, so a
 * yaw on the same box swings every card's vanishing point with it and the
 * beat reads as leaning rather than as a rack turning.
 *
 * ⚠ **EVERY CARD RENDERS, ALWAYS, INCLUDING THE ONES POSED AT ZERO.** The
 * drawing this is lifted from returns `null` before its entry clock opens;
 * this station cannot, because it is the cover. The POSE is what hides a
 * card — parked behind, at opacity 0, on the side it left on, so a card
 * entering the rack travels in rather than fading in on the spot.
 */
export function MusingsStation({ posts }: { posts: readonly MusingCardData[] }) {
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  /* A stable per-index ref callback. A fresh closure each render makes React
     detach and re-attach every card's ref, and the writer would pose a stale
     array for a frame. */
  const setCard = useCallback(
    (i: number) => (el: HTMLAnchorElement | null) => {
      cardsRef.current[i] = el;
    },
    []
  );

  const { front } = useMusingsScroll(runwayRef, rootRef, cardsRef, posts.length);

  return (
    <div className="mu" ref={rootRef} style={{ "--mu-n": posts.length } as CSSProperties}>
      <div className="mu__runway" ref={runwayRef}>
        <div className="mu__stage">
          <div className="mu__head">
            <span className="mu__kicker">Musings</span>
            <h2 className="mu__title">Notes from the practice</h2>
          </div>

          {posts.length > 0 ? (
            <div className="mu__rig">
              <div className="mu__rack">
                {posts.map((post, i) => (
                  <MusingCard
                    key={post.slug}
                    post={post}
                    index={i}
                    isFront={i === front}
                    cardRef={setCard(i)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ⚠ NO POSTS IS A REAL STATE, AND IT MAY NOT BE A BLANK VIEWPORT.
               Every post on disk is a draft until one is published, and this
               station is an opaque full-screen cover either way — so with an
               empty rack it says so and keeps its way out. */
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
      </div>
    </div>
  );
}
