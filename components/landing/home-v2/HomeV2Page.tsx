"use client";

import { useRef } from "react";
import type { V7CorridorText } from "@/lib/v7-parse";
import { HomeCorridor } from "./HomeCorridor";

interface HomeV2PageProps {
  /** v7 HUD chrome HTML (gateway, hud rails, nav, status). Fed by
   *  `sliceV7Sections` in the route's server component. */
  hudHtml: string;
  /** Body class lifted from the v7 prototype (theme + density). */
  bodyClass: string;
  /** Structured corridor copy extracted from the v7 prototype HTML. */
  text: V7CorridorText;
}

/**
 * HomeV2Page — depth-corridor composition for /test/home-v2 (ADR-018).
 *
 * Composes the v7 HUD chrome + a sticky video hero + the world-owned
 * `HomeCorridor` 3D stage + placeholder tail sections. The hero and
 * tail are route-specific scaffolding so the corridor reads as a
 * standalone showcase; production wires the same `HomeCorridor`
 * shell into the v7 LandingPage between #hero and #buildQuote.
 *
 * The corridor itself owns its 3D flow, brandmark, copy projection,
 * and HUD readouts — see `HomeCorridor.tsx` and ADR-018 for the
 * complete operating model.
 */
export function HomeV2Page({ hudHtml, bodyClass, text }: HomeV2PageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // The HUD hamburger nav was retired per the Brand Codex hero
  // contract — no `.hud__nav` ships in the sliced hudHtml any more.

  return (
    <div ref={rootRef} className={`home-v2-root ${bodyClass}`} data-theme="dark">
      {/* v7 HUD chrome — `.gateway` + `.hud` rails + corner brackets. */}
      <div
        className="home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* ═══ HERO ═══ */}
      <section className="station hero" id="hero" data-station="hero" data-screen-label="01 Hero">
        <div className="hero__video" aria-hidden="true">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/thoughtform-key-visual-2-poster.jpg"
            disablePictureInPicture
            disableRemotePlayback
          >
            <source src="/videos/thoughtform-key-visual-2-web.mp4" type="video/mp4" />
          </video>
          <div className="hero__video__overlay" />
        </div>

        {/* Hero gateway analysis — production-parity. Cockpit-style
            leader lines from the key-visual throat to framed callout
            readouts, borrowing the older definition-section principle
            where linework analyzes the brandmark/sigil. Hidden under
            960px via the same CSS rule that hides .hud__brandmark on
            mobile. */}
        <div className="hero__diagram" aria-hidden="true">
          <svg className="hero__analysis-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              className="hero__analysis-line hero__analysis-line--01"
              d="M58 43 L67 31 L74 31"
              pathLength="1"
            />
            <path
              className="hero__analysis-line hero__analysis-line--02"
              d="M58 43 L67 43 L74 43"
              pathLength="1"
            />
            <path
              className="hero__analysis-line hero__analysis-line--03"
              d="M58 43 L67 56 L74 56"
              pathLength="1"
            />
          </svg>
          <span className="hero__analysis-origin" />
          <div className="hero__analysis-card hero__analysis-card--01">
            <span className="hero__analysis-card__node" />
            <h3>NAVIGATE</h3>
            <p>Read the signal before choosing the route.</p>
          </div>
          <div className="hero__analysis-card hero__analysis-card--02">
            <span className="hero__analysis-card__node" />
            <h3>ENCODE</h3>
            <p>Turn the work&apos;s judgment into reusable substrate.</p>
          </div>
          <div className="hero__analysis-card hero__analysis-card--03">
            <span className="hero__analysis-card__node" />
            <h3>BUILD</h3>
            <p>Shape capability the team can keep operating.</p>
          </div>
        </div>

        <div className="hero__content">
          <div className="hero__wordmark">
            <img
              src="/logos/Thoughtform_Wordmark_Lockup-Vertical%20%28Dual%29.svg"
              alt="Thoughtform"
            />
          </div>
          <p className="hero__tagline">
            AI capability, built <em>inside the work.</em>
          </p>
        </div>
      </section>

      {/* ═══ DEPTH CORRIDOR ═══
          The world-owned 3D stage. Shared with the production home
          page (mounted inside `LandingPage` via portal there). */}
      <HomeCorridor text={text} debug />

      {/* ═══ TAIL (normal scroll, placeholder) ═══ */}
      <div className="home-v2-tail">
        <section className="home-v2-tail__section">
          <p className="home-v2-tail__eyebrow">05 — Continuum</p>
          <h2 className="home-v2-tail__title">Navigate. Encode. Build. One continuous practice.</h2>
          <p className="home-v2-tail__body">
            The depth corridor above is the entry. From here the page scrolls normally — future
            iterations will pick up the v7 continuum, practice, build cases, and services sections.
          </p>
        </section>
        <section className="home-v2-tail__section">
          <p className="home-v2-tail__eyebrow">06 — Practice</p>
          <h2 className="home-v2-tail__title">What we do, in three motions.</h2>
          <p className="home-v2-tail__body">
            Navigate the substrate, encode the patterns that matter, build the surfaces your team
            uses every day.
          </p>
        </section>
      </div>
    </div>
  );
}
