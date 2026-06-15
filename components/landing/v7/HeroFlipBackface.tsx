"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { V7CorridorText } from "@/lib/v7-parse";
import { BrandmarkGlyph } from "./BrandmarkGlyph";

/**
 * HeroFlipBackface — Thoughtform facade rendered on the BACK of the
 * hero flip card (ADR-022, enclose-then-flip rework).
 *
 * The hero (`#hero`, the wormhole `<video>`) acts as the FRONT face of
 * a two-faced flip; this component renders the matching back-face deck
 * (a void-black backdrop + facade) and **portals it into `main.stations`**
 * — the same stacking context the hero lives in. That lets us layer:
 *
 *     z:3  .home-corridor-host  (rising; live corridor parked frame)
 *     z:4  .hero-flip-backdrop  (void-black margin around the card)
 *     z:5  .hero-flip-back      (facade: copy + brandmark, rotateY+180)
 *     z:6  #hero[data-hero-flip] (front: live video, rotateY)
 *
 * within main's z:10 envelope. Putting the deck OUTSIDE main would
 * require its z to exceed 10, which would eclipse the live hero front
 * face — wrong. Portaling inside keeps front/back/backdrop in one
 * stacking context, so the front always paints over its backdrop and
 * the rotation reads as a true two-faced card.
 *
 * Critically, the deck is **siblings of `#hero`** inside `main.stations`,
 * NOT a descendant of `#hero` — the hero element lives inside parsed
 * `dangerouslySetInnerHTML` markup we don't mutate, and its
 * `overflow: hidden` would clip a child rotated card. As siblings the
 * card's two faces share `transform-origin: 50% 50%` and a matching
 * `perspective(1600px)`, with `backface-visibility: hidden` on each
 * so the browser swaps them at the 90° crossover.
 *
 * The corridor flythrough (ADR-018) is never rotated or reparented:
 * the back face is a STATIC DOM facade rendering the same
 * `text.thoughtform` source and the canonical `BrandmarkGlyph` SVG.
 * Over the last ~15% of `--hero-cover` the backdrop + facade fade
 * out, revealing the live corridor that has naturally pinned at
 * `paintProgress = 0` (its "armed" pre-paint state).
 *
 * The deck is `display: none` unless `<html data-hero-flip="1">` is
 * set by `useLandingScroll` mid-band on capable devices. Reduced-
 * motion / ≤960px paths skip the deck entirely.
 */

interface HeroFlipBackfaceProps {
  /** Corridor copy extracted from the v7 prototype HTML. The facade
   *  reads `thoughtform.bridge / titleHtml / body1Html / body2Html /
   *  cta` so it stays in sync with whatever the live corridor would
   *  render at `paintProgress = 0`. */
  text: V7CorridorText;
  /** The parsed v7 root ref (passed down from `LandingPage`). The
   *  deck is portalled into the `main.stations` element inside it so
   *  it shares the hero's stacking context. */
  containerRef: RefObject<HTMLDivElement | null>;
}

export function HeroFlipBackface({ text, containerRef }: HeroFlipBackfaceProps) {
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null);

  // Resolve the portal target after mount. `main.stations` is parsed
  // from the v7 prototype HTML, so it always exists on the production
  // homepage; on routes that don't include the v7 body the portal
  // simply never mounts (no error, no leak).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const main = root.querySelector<HTMLElement>("main.stations");
    if (main) setMainEl(main);
  }, [containerRef]);

  if (!mainEl) return null;

  const tf = text.thoughtform;

  return createPortal(
    <div className="hero-flip-deck" aria-hidden="true">
      <div className="hero-flip-backdrop" />
      <div className="hero-flip-back">
        <div className="hero-flip-back__inner">
          <div className="hero-flip-back__copy home-v2-copy-block home-v2-copy-block--thoughtform-left">
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
          <div className="hero-flip-back__diagram" aria-hidden="true">
            <div className="hero-flip-back__diagram-frame">
              <div className="hero-flip-back__brandmark">
                <BrandmarkGlyph outline={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    mainEl
  );
}
