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
 *      three "chambers" along -Z) plus an HTML overlay layer
 *      that reuses the v7 typography classes (`.tri__title`,
 *      `.miss__label`, `.ilayer__caption`, etc.) so the v2 page
 *      reads as a direct descendant of the production landing
 *      rather than a generic restyle.
 *
 *   3. Tail — placeholder normal-scroll sections so the page
 *      doesn't terminate abruptly. Future iteration will swap these
 *      for the v7 continuum / practice / build / services / about
 *      / contact content.
 *
 * The static fallback (no WebGL OR `prefers-reduced-motion`) flips
 * `data-fallback="true"` on the stage root; the canvas is hidden
 * and a stacked version of the three chambers paints instead.
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

          {/* HTML overlay layer. Uses the v7 typography classes via
              `landing.css` (imported by the route). Per-chamber
              opacity is gated by CSS vars written by useDepthScroll
              so each chamber's content only paints during its
              window. Brandmark + body screen positions are written
              by ChamberLabels in the R3F canvas. */}
          <div className="home-v2-chamber-overlay" data-home-v2-overlay aria-hidden="true">
            {/* ───── Chamber A — Definition ─────
                v7 `.tri__left` copy + IPA pronunciation, projected
                on a CSS-perspective plane that translates Z+ toward
                the viewer as Chamber A progresses. */}
            <div className="home-v2-overlay__definition">
              <div className="home-v2-overlay__definition-inner">
                <div className="tri__ipa tri__ipa--noun">THOUGHTFORM /θɔːtfɔːrm · THAWT-form/</div>
                <h2 className="tri__title">
                  AI collapsed the distance between <em>thought</em> and <em>form</em>.
                </h2>
                <p className="tri__title tri__title--secondary">
                  But the layer between how your team works and what AI can do is missing.
                </p>
                <p className="tri__title tri__title--secondary">
                  We build it with your team and <em>train them to own it</em>.
                </p>
              </div>
            </div>

            {/* ───── Chamber B — Diagnostic ─────
                Header text (v7 `.miss__title` + `.miss__bridge`) at
                the top of the stage, plus four `.miss__label` pills
                orbiting the brandmark. Pill positions are computed
                from the projected brandmark screen position
                (`--brand-x` / `--brand-y` / `--brand-r`) so they
                stay locked to the cloud as the camera dollies. */}
            <div className="home-v2-overlay__diagnostic">
              <header className="home-v2-overlay__diagnostic-head">
                <p className="miss__bridge">Diagnostic · Same pattern, four ways.</p>
                <h2 className="miss__title">
                  The missing layer is rarely <em>the model.</em>
                </h2>
              </header>

              <div className="home-v2-overlay__diagnostic-pills">
                <div className="miss__label home-v2-pill home-v2-pill--01">
                  <span className="miss__label-pip" aria-hidden="true" />
                  <span className="miss__label-n">01</span>
                  <span className="miss__label-tag">Brand voice drifts across every channel.</span>
                </div>
                <div className="miss__label home-v2-pill home-v2-pill--02">
                  <span className="miss__label-pip" aria-hidden="true" />
                  <span className="miss__label-n">02</span>
                  <span className="miss__label-tag">
                    Creative briefs arrive without the thinking.
                  </span>
                </div>
                <div className="miss__label home-v2-pill home-v2-pill--03">
                  <span className="miss__label-pip" aria-hidden="true" />
                  <span className="miss__label-n">03</span>
                  <span className="miss__label-tag">Every product concept looks feasible.</span>
                </div>
                <div className="miss__label home-v2-pill home-v2-pill--04">
                  <span className="miss__label-pip" aria-hidden="true" />
                  <span className="miss__label-n">04</span>
                  <span className="miss__label-tag">Customer service depends on who picks up.</span>
                </div>
              </div>
            </div>

            {/* ───── Chamber C — Intelligence Layer ─────
                v7 `.ilayer__head` (title + lede) at the top of the
                stage, three HUD captions on the L / mid / R bodies
                (v7 `.ilayer__caption` rail+num+title), and the
                substrate readout (Rules / Examples / Sources /
                Loops) inside the morphed sphere. */}
            <div className="home-v2-overlay__ilayer">
              <header className="home-v2-overlay__ilayer-head">
                <h2 className="ilayer__title">
                  The fix is an <em>intelligence layer.</em>
                </h2>
                <p className="ilayer__lede">
                  An operating layer between how your team works and what AI does.{" "}
                  <em>Encoded once.</em> Inherited by every surface.
                </p>
              </header>

              {/* Left chamber — Trusted sources */}
              <section className="home-v2-overlay__ilayer-chamber home-v2-overlay__ilayer-chamber--left">
                <div className="ilayer__caption ilayer__caption--below">
                  <span className="ilayer__caption__rail" aria-hidden="true" />
                  <span className="ilayer__caption__num">01</span>
                  <h3 className="ilayer__caption__title">Trusted sources</h3>
                </div>
              </section>

              {/* Mid chamber — Encoded substrate (caption above the
                  morphed brandmark sphere). */}
              <section className="home-v2-overlay__ilayer-chamber home-v2-overlay__ilayer-chamber--mid">
                <div className="ilayer__caption ilayer__caption--above">
                  <span className="ilayer__caption__rail" aria-hidden="true" />
                  <span className="ilayer__caption__num">02</span>
                  <h3 className="ilayer__caption__title">Encoded substrate</h3>
                </div>
              </section>

              {/* Right chamber — Headless surfaces */}
              <section className="home-v2-overlay__ilayer-chamber home-v2-overlay__ilayer-chamber--right">
                <div className="ilayer__caption ilayer__caption--below">
                  <span className="ilayer__caption__rail" aria-hidden="true" />
                  <span className="ilayer__caption__num">03</span>
                  <h3 className="ilayer__caption__title">Headless surfaces</h3>
                </div>
              </section>

              {/* Substrate readout — 2x2 instrument card grid sitting
                  below the substrate sphere. Lands after the morph
                  completes so the user reads the brandmark→sphere
                  transform first. */}
              <div className="home-v2-overlay__ilayer-readout">
                <div className="home-v2-overlay__ilayer-readout-cell">
                  <span className="ilayer__substrate-readout__key">Rules</span>
                  <span className="ilayer__substrate-readout__val">How the team decides</span>
                </div>
                <div className="home-v2-overlay__ilayer-readout-cell">
                  <span className="ilayer__substrate-readout__key">Examples</span>
                  <span className="ilayer__substrate-readout__val">What good looks like</span>
                </div>
                <div className="home-v2-overlay__ilayer-readout-cell">
                  <span className="ilayer__substrate-readout__key">Sources</span>
                  <span className="ilayer__substrate-readout__val">Data it reads</span>
                </div>
                <div className="home-v2-overlay__ilayer-readout-cell">
                  <span className="ilayer__substrate-readout__key">Loops</span>
                  <span className="ilayer__substrate-readout__val">Who confirms what</span>
                </div>
              </div>
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

/** Static stacked layout for no-WebGL / reduced-motion. Reuses the
 *  v7 typography classes so the fallback reads as the real page,
 *  just without the camera dolly. */
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
        <div className="tri__ipa tri__ipa--noun">THOUGHTFORM /θɔːtfɔːrm · THAWT-form/</div>
        <h2 className="tri__title">
          AI collapsed the distance between <em>thought</em> and <em>form</em>.
        </h2>
        <p className="tri__title tri__title--secondary">
          But the layer between how your team works and what AI can do is missing.
        </p>
      </div>
      <div className="home-v2-fallback__chamber">
        <p className="miss__bridge">Diagnostic · Same pattern, four ways.</p>
        <h2 className="miss__title">
          The missing layer is rarely <em>the model.</em>
        </h2>
      </div>
      <div className="home-v2-fallback__chamber">
        <h2 className="ilayer__title">
          The fix is an <em>intelligence layer.</em>
        </h2>
        <p className="ilayer__lede">
          An operating layer between how your team works and what AI does. <em>Encoded once.</em>{" "}
          Inherited by every surface.
        </p>
      </div>
    </div>
  );
}
