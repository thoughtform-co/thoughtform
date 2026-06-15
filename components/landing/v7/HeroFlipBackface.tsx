"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { V7CorridorText } from "@/lib/v7-parse";
import { BrandmarkGlyph } from "./BrandmarkGlyph";

/**
 * HeroFlipBackface — Thoughtform back window revealed by the hero
 * depth-window sweep (ADR-022 v5, KPR depth-window pivot).
 *
 * The hero (`#hero`, the wormhole `<video>`) is the FRONT window of a
 * KPR-style depth-window sweep: it encloses into a beveled silhouette,
 * recedes back in Z, drifts left, and fades. This component renders
 * the matching back deck — a void-black surround + the Thoughtform
 * back window — and **portals it into `main.stations`**, the same
 * stacking context the hero lives in. That lets us layer:
 *
 *     z:3    .home-corridor-host      (rising; live corridor parked frame)
 *     z:4    .hero-flip-backdrop      (radial void surround)
 *     z:4    .hero-flip-enclosure     (four closing void planes)
 *     z:5    .hero-flip-back-window   (Thoughtform window: copy + brandmark)
 *     z:6    #hero[data-hero-flip]    (front window: live video)
 *
 * within main's z:10 envelope. Putting the deck OUTSIDE main would
 * require its z to exceed 10, which would eclipse the live hero front
 * window — wrong. Portaling inside keeps front/back/backdrop in one
 * stacking context, so the front always paints over its backdrop and
 * the depth recede reads as a true window receding.
 *
 * The deck is **siblings of `#hero`** inside `main.stations`, NOT a
 * descendant of `#hero` — the hero element lives inside parsed
 * `dangerouslySetInnerHTML` markup we don't mutate, and its
 * `overflow: hidden` would clip a child window during transform. As
 * siblings, both windows share `transform-origin: 50% 50%` and use
 * matching beveled `clip-path: polygon(...)` silhouettes driven by
 * the shared `--bevel` variable.
 *
 * The corridor flythrough (ADR-018) is never rotated or reparented.
 * The Thoughtform window is a fixed, screen-facing DOM facade that
 * renders the same `text.thoughtform` source and the canonical
 * `BrandmarkGlyph` SVG; its inner copy + diagram **counter-translate
 * the window's drift** so they read as a deeper plane than the bevel
 * (the KPR "rotates slower than the card" depth signature). At the
 * very end of `--hero-cover` the deck fades out via the hairline
 * `--back-fade` clock, revealing the live corridor that has been
 * armed at `paintProgress = 0` throughout the band.
 *
 * History: v2-v4 used a two-faced 180deg flip with a hollow rotating
 * aperture shell (`.hero-flip-back` rim + glaze) sitting in front of
 * a counter-rotating window. Live KPR inspection (1440x900) confirmed
 * KPR does NOT flip — it sweeps and scales beveled-corner windows with
 * content that parallaxes inside them. v5 drops the shell and the
 * literal 180deg rotation in favor of the depth-window sweep model.
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
      <div className="hero-flip-enclosure" aria-hidden="true">
        <span className="hero-flip-enclosure__plane hero-flip-enclosure__plane--top" />
        <span className="hero-flip-enclosure__plane hero-flip-enclosure__plane--right" />
        <span className="hero-flip-enclosure__plane hero-flip-enclosure__plane--bottom" />
        <span className="hero-flip-enclosure__plane hero-flip-enclosure__plane--left" />
      </div>
      <div className="hero-flip-back-window">
        <div className="hero-flip-back-window__inner">
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
            <div className="hero-flip-back__depth-grid" />
            <div className="hero-flip-back__diagram-frame">
              <div className="hero-flip-back__brandmark">
                <BrandmarkGlyph outline={false} />
              </div>
              <span className="hero-flip-back__axis-label hero-flip-back__axis-label--navigate">
                NAVIGATE
              </span>
              <span className="hero-flip-back__axis-label hero-flip-back__axis-label--encode">
                ENCODE
              </span>
              <span className="hero-flip-back__axis-label hero-flip-back__axis-label--build">
                BUILD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    mainEl
  );
}
