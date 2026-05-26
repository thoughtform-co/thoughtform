"use client";

import { useEffect, useRef } from "react";
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

  // HUD hamburger nav — wire the bare minimum from v7 LandingPage so
  // the menu can open / close.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const navEl = root.querySelector<HTMLElement>(".hud__nav");
    const navBtn = root.querySelector<HTMLButtonElement>(".hud__nav__btn");
    if (!navEl || !navBtn) return;
    const toggle = () => {
      navEl.classList.toggle("is-open");
    };
    navBtn.addEventListener("click", toggle);
    return () => {
      navBtn.removeEventListener("click", toggle);
    };
  }, []);

  return (
    <div ref={rootRef} className={`home-v2-root ${bodyClass}`} data-theme="dark">
      {/* v7 HUD chrome — `.gateway` + `.hud` rails + `.hud__nav`. */}
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
          <p className="hero__subline">
            We help teams navigate AI, encode how they work,
            <br />
            and build tools they can own.
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
