"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { V7CorridorText } from "@/lib/v7-parse";
import { BrandmarkGlyph } from "./BrandmarkGlyph";

/**
 * HeroHandoffCover — Active Theory / Hashgraph-class cover-plane swipe
 * (ADR-022 v6 final).
 *
 * An opaque viewport-sized plane carrying the Thoughtform first-read
 * copy + a compass-gate diagram clip-swipes UPWARD over the held hero
 * (`clip-path: inset((1 - --hero-cover) * 100%) 0 0 0` on
 * `.hero-handoff-plane`). The clip edge IS the reveal — opacity is
 * never the transition owner during the swipe. At `cover = 1` the band
 * gate clears, the plane drops to `display: none`, and the live
 * home-v2 corridor (armed at `paintProgress = 0`, risen to its final
 * parked position) takes the screen.
 *
 * Why the diagram is concentric AXIS-ALIGNED squares (not a rotated
 * diamond): the live corridor's parked frame is `ThoughtformCompassGate`
 * — 4 concentric axis-aligned square loops (outer two dawn, inner two
 * gold, dashed) around the compass brandmark, with NAVIGATE / ENCODE /
 * BUILD phase labels. Earlier iterations drew a single rotated dashed
 * diamond here, so the proxy → live swap at `cover = 1` visibly jumped
 * (diamond → concentric squares). Matching the gate's silhouette makes
 * the handoff land cleanly. Ring sizes mirror the gate's RING_RADII
 * ratios [0.75, 0.63, 0.52, 0.39] -> 100% / 84% / 69% / 52%.
 *
 * Layer stack (deck portalled into `main.stations`, within main's z:10):
 *
 *     z:3   .home-corridor-host        live corridor, armed (the reveal target)
 *     z:5   #hero[data-hero-handoff]   held; previous scene
 *     z:6   .hero-handoff-cover        the sweep plane (clip-swipe up)
 *             └── .hero-handoff-plane  opaque void + branded accents
 *                   ├── .hero-handoff__copy      Thoughtform left copy
 *                   └── .hero-handoff__diagram   compass gate (concentric squares)
 *
 * The deck is a SIBLING of `#hero` (not a descendant — `#hero` is parsed
 * `dangerouslySetInnerHTML` with `overflow: hidden` that would clip a
 * child). It reads the eased `--hero-cover` mirrored onto `<html>` by
 * `useLandingScroll`. `display: none` unless `<html data-hero-handoff>`
 * is set mid-band on capable devices; reduced-motion / <=960px skip it.
 *
 * The live corridor (ADR-018/021) is never transformed or reparented;
 * this proxy only mirrors its parked composition for the duration of
 * the swipe, then hands the screen to the real thing.
 */

interface HeroHandoffCoverProps {
  /** Corridor copy extracted from the v7 prototype HTML. The proxy
   *  reads `thoughtform.bridge / titleHtml / body1Html / body2Html /
   *  cta` so the swept-in copy matches what the live corridor renders
   *  at `paintProgress = 0`. */
  text: V7CorridorText;
  /** The parsed v7 root ref (from `LandingPage`). The deck is portalled
   *  into the `main.stations` element inside it so it shares the hero's
   *  stacking context. */
  containerRef: RefObject<HTMLDivElement | null>;
}

export function HeroHandoffCover({ text, containerRef }: HeroHandoffCoverProps) {
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const main = root.querySelector<HTMLElement>("main.stations");
    if (main) setMainEl(main);
  }, [containerRef]);

  if (!mainEl) return null;

  const tf = text.thoughtform;

  return createPortal(
    <div className="hero-handoff-cover" aria-hidden="true">
      <div className="hero-handoff-plane">
        <div className="hero-handoff__copy home-v2-copy-block home-v2-copy-block--thoughtform-left">
          <div className="home-v2-copy-bridge">{tf.bridge}</div>
          <h2 className="home-v2-copy-title" dangerouslySetInnerHTML={{ __html: tf.titleHtml }} />
          <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body1Html }} />
          <p className="home-v2-copy-body" dangerouslySetInnerHTML={{ __html: tf.body2Html }} />
          <div className="home-v2-copy-cta-row">
            <span className="home-v2-copy-cta">
              {tf.cta}{" "}
              <span className="home-v2-copy-cta__arrow" aria-hidden="true">
                →
              </span>
            </span>
          </div>
        </div>
        <div className="hero-handoff__diagram" aria-hidden="true">
          {/* 4 concentric axis-aligned square loops, mirroring the live
              ThoughtformCompassGate (outer two dawn, inner two gold). */}
          <span className="hero-handoff__ring hero-handoff__ring--1" />
          <span className="hero-handoff__ring hero-handoff__ring--2" />
          <span className="hero-handoff__ring hero-handoff__ring--3" />
          <span className="hero-handoff__ring hero-handoff__ring--4" />
          <span className="hero-handoff__crosshair" />
          <div className="hero-handoff__brandmark">
            <BrandmarkGlyph outline={false} />
          </div>
          <span className="hero-handoff__axis-label hero-handoff__axis-label--navigate">
            NAVIGATE
          </span>
          <span className="hero-handoff__axis-label hero-handoff__axis-label--encode">ENCODE</span>
          <span className="hero-handoff__axis-label hero-handoff__axis-label--build">BUILD</span>
        </div>
      </div>
    </div>,
    mainEl
  );
}
