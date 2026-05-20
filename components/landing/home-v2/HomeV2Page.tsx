"use client";

import { useEffect, useRef, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { DepthGatewayScene } from "./DepthGatewayScene";
import { useDepthScroll } from "./hooks/useDepthScroll";

/**
 * HomeV2Page — composition for the /test/home-v2 depth-gateway
 * experiment.
 *
 * Three layers stacked top-to-bottom:
 *
 *   1. Hero — copied from the v7 prototype markup so the entrance
 *      reads identically to production. Sticky 100vh, video
 *      background, wordmark + tagline. Uses v7 `.hero` CSS from
 *      `landing.css` (imported by the route page).
 *
 *   2. Depth stage — 300svh tall with a 100svh sticky interior. The
 *      sticky pane hosts the R3F canvas (one camera dolly through
 *      three "chambers" along -Z) plus an HTML overlay layer that
 *      paints the Definition text plane (translating Z+ on
 *      perspective) and the L/R chamber labels (projected from
 *      world positions onto screen by `ChamberLabels`).
 *
 *   3. Tail — placeholder normal-scroll sections so the page
 *      doesn't terminate abruptly. Future iteration will swap these
 *      for the v7 continuum / practice / build / services / about
 *      / contact content.
 *
 * The static fallback (no WebGL OR `prefers-reduced-motion`) flips
 * `data-fallback="true"` on the stage root; the canvas is hidden
 * and a stacked SVG/text version of the three chambers paints
 * instead (see `home-v2.css`).
 */
export function HomeV2Page() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [webglOK, setWebglOK] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useDepthScroll(stageRef);

  useEffect(() => {
    setWebglOK(probeWebGL());
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Set data-brandmark-mode="off" on the document root so the
  // global v7 brandmark canvas (if mounted via some other route or
  // import chain) doesn't paint over the home-v2 scene. The home-v2
  // canvas owns its own brandmark cloud end-to-end.
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-brandmark-mode");
    document.documentElement.setAttribute("data-brandmark-mode", "off");
    return () => {
      if (prev === null) document.documentElement.removeAttribute("data-brandmark-mode");
      else document.documentElement.setAttribute("data-brandmark-mode", prev);
    };
  }, []);

  const fallback = webglOK === false || reducedMotion;

  return (
    <div className="home-v2-root" data-theme="dark">
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
        </div>
      </section>

      {/* ═══ DEPTH STAGE (Chambers A → B → C) ═══ */}
      <div
        ref={stageRef}
        className="home-v2-stage"
        data-fallback={fallback ? "true" : "false"}
        aria-label="Depth gateway: Definition, Diagnostic, Intelligence Layer"
      >
        <div className="home-v2-stage__sticky">
          <div className="home-v2-stage__canvas">
            <DepthGatewayScene />
          </div>

          {/* HTML overlay layer. The Definition text plane uses CSS
              perspective + translateZ driven by --definition-* vars
              from useDepthScroll. The chamber labels use CSS
              positioning driven by --left-* / --right-* vars written
              by ChamberLabels in the canvas. */}
          <div className="home-v2-chamber-overlay" data-home-v2-overlay aria-hidden="true">
            {/* Definition text plane — left of frame, translates Z+
                toward and past the camera as Chamber A progresses. */}
            <div className="home-v2-overlay__definition">
              <div className="home-v2-overlay__definition-inner">
                <p className="home-v2-overlay__definition-eyebrow">02 — Thoughtform</p>
                <h2 className="home-v2-overlay__definition-title">
                  Most teams treat AI like <em>software.</em>
                </h2>
                <p className="home-v2-overlay__definition-body">
                  But intelligence isn&apos;t a tool to command — it&apos;s a substrate to navigate.
                  Thoughtform teaches teams how to read it, encode it, and build with it.
                </p>
              </div>
            </div>

            {/* Diagnostic eyebrow — anchored at bottom-centre,
                fades in across Chamber B alongside the orbital rings. */}
            <div className="home-v2-overlay__diagnostic">
              <p className="home-v2-overlay__diagnostic-eyebrow">03 — Diagnostic</p>
              <p className="home-v2-overlay__diagnostic-title">
                The missing layer between teams and AI.
              </p>
            </div>

            {/* Intelligence chamber labels — projected onto the L/R
                celestial-body positions by ChamberLabels. */}
            <div className="home-v2-overlay__chamber-label home-v2-overlay__chamber-label--left">
              <p className="home-v2-overlay__chamber-label-eyebrow">Sources</p>
              <p className="home-v2-overlay__chamber-label-title">Trusted Sources</p>
              <p className="home-v2-overlay__chamber-label-meta">Brand · Voice · Knowledge</p>
            </div>
            <div className="home-v2-overlay__chamber-label home-v2-overlay__chamber-label--right">
              <p className="home-v2-overlay__chamber-label-eyebrow">Surfaces</p>
              <p className="home-v2-overlay__chamber-label-title">Headless Surfaces</p>
              <p className="home-v2-overlay__chamber-label-meta">Cursor · Claude · Agents</p>
            </div>
          </div>

          {/* Debug HUD — progress readout. Hidden in static fallback
              because the chambers aren't being scrubbed. */}
          {!fallback && <StageHud />}

          {/* Static fallback — paints when WebGL is unavailable or
              prefers-reduced-motion is on. Three stacked content
              blocks that present the same Chamber A/B/C information
              without any 3D / dolly choreography. */}
          {fallback && <StageFallback />}
        </div>
      </div>

      {/* ═══ TAIL (normal scroll, placeholder) ═══ */}
      <div className="home-v2-tail">
        <section className="home-v2-tail__section">
          <p className="home-v2-tail__eyebrow">05 — Continuum</p>
          <h2 className="home-v2-tail__title">Navigate. Encode. Build. One continuous practice.</h2>
          <p className="home-v2-tail__body">
            The depth gateway above is the entry. From here the page scrolls normally — future
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

/** Tiny readout — shows progress and active chamber as a debug aid. */
function StageHud() {
  const transform = useDepthGatewayStore((s) => s.transform);
  const progressPct = Math.round(transform.progress * 100);
  return (
    <div className="home-v2-stage__hud" aria-hidden="true">
      <div className="home-v2-stage__hud-progress">{String(progressPct).padStart(2, "0")}%</div>
      <div>{transform.chamberId}</div>
    </div>
  );
}

/** Static stacked layout for no-WebGL / reduced-motion. */
function StageFallback() {
  return (
    <div className="home-v2-stage__fallback">
      <div className="home-v2-fallback__chamber">
        <img
          src="/logos/Thoughtform_Brandmark.svg"
          alt=""
          className="home-v2-fallback__brandmark"
          aria-hidden="true"
        />
        <p className="home-v2-overlay__definition-eyebrow">02 — Thoughtform</p>
        <h2 className="home-v2-overlay__definition-title">
          Most teams treat AI like <em>software.</em>
        </h2>
        <p className="home-v2-overlay__definition-body">
          But intelligence isn&apos;t a tool to command — it&apos;s a substrate to navigate.
        </p>
      </div>
      <div className="home-v2-fallback__chamber">
        <p className="home-v2-overlay__diagnostic-eyebrow">03 — Diagnostic</p>
        <h2 className="home-v2-overlay__definition-title">
          The missing layer between teams and AI.
        </h2>
      </div>
      <div className="home-v2-fallback__chamber">
        <p className="home-v2-overlay__chamber-label-eyebrow">04 — Intelligence layer</p>
        <h2 className="home-v2-overlay__definition-title">Sources, substrate, surfaces.</h2>
        <p className="home-v2-overlay__definition-body">
          Trusted sources of brand, voice, and knowledge feed an encoded substrate that surfaces
          through the tools your team already uses.
        </p>
      </div>
    </div>
  );
}
