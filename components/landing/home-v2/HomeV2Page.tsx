"use client";

import { useEffect, useRef, useState } from "react";
import type { V7CorridorText } from "@/lib/v7-parse";
import { probeWebGL } from "@/lib/webgl/probe";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { CopyAnchors } from "./CopyAnchors";
import { DepthGatewayScene } from "./DepthGatewayScene";
import { useDepthScroll } from "./hooks/useDepthScroll";
import { ProjectedBrandmarkActor } from "./ProjectedBrandmarkActor";

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
 * HomeV2Page — depth-corridor composition (ADR-018, world-owned
 * rebuild).
 *
 * Operating model: ONE 3D scene. `DepthGatewayScene` is the single
 * R3F canvas hosting all four world-rigid gate groups (Thoughtform
 * compass, Diagnostic orbits, Interstitial waypoint, Intelligence
 * sphere) plus the inter-gate ring debris. The camera flies through
 * them on one continuous path.
 *
 * Copy is pure DOM TEXT: `CopyAnchors` renders titles, bodies, label
 * pills, and side body labels tagged with `data-world-anchor` IDs.
 * `useWorldDomTracker` (driven by the same camera path as the R3F
 * scene) projects each named world anchor to screen pixels every
 * frame and writes inline `transform` + `opacity` to the matching
 * DOM element. Result: copy and labels travel with their gates as
 * the camera approaches and passes.
 *
 * The brandmark is a pure 3D-projected vector via
 * `ProjectedBrandmarkActor`. No DOM-dock pinning. Its world
 * position is rigidly co-located with each gate's centre, so the
 * homepage-fidelity "brandmark inside the diamond" composition is
 * structural, not calibrated per breakpoint.
 *
 * The v7 HUD chrome is mounted once at page root (position: fixed
 * elements from the prototype) so rails + depth ticks + wordmark
 * persist across hero, stage, and tail.
 */
export function HomeV2Page({ hudHtml, bodyClass, text }: HomeV2PageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [webglOK, setWebglOK] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [smallViewport, setSmallViewport] = useState(false);

  useDepthScroll(stageRef);

  useEffect(() => {
    setWebglOK(probeWebGL());
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    const syncViewport = () => setSmallViewport(window.innerWidth < 760);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  // Suppress the global v7 brandmark canvas (if mounted elsewhere
  // in this render tree) so it doesn't paint over the home-v2 scene.
  // The home-v2 actor owns the brandmark end-to-end on this route.
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-brandmark-mode");
    document.documentElement.setAttribute("data-brandmark-mode", "off");
    return () => {
      if (prev === null) document.documentElement.removeAttribute("data-brandmark-mode");
      else document.documentElement.setAttribute("data-brandmark-mode", prev);
    };
  }, []);

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

  const fallback = webglOK === false || reducedMotion || smallViewport;
  const mode = fallback ? "fallback" : "corridor";

  return (
    <div
      ref={rootRef}
      className={`home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-home-v2-mode={mode}
    >
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
        </div>
      </section>

      {/* ═══ DEPTH STAGE ═══
          Sticky 100svh interior; the R3F canvas, copy overlay, and
          fallback live inside the same sticky cell. There is NO v7
          section grid stack any more — the world owns the layout. */}
      <div
        ref={stageRef}
        className="home-v2-stage"
        data-fallback={fallback ? "true" : "false"}
        aria-label="Depth corridor: Thoughtform, Diagnostic, Intelligence layer"
      >
        <div className="home-v2-stage__sticky">
          {!fallback && (
            <div className="home-v2-stage__canvas">
              <DepthGatewayScene />
            </div>
          )}

          {/* Copy + label overlay — DOM text positioned by
              `useWorldDomTracker` (mounted inside `CopyAnchors`). */}
          {!fallback && <CopyAnchors text={text} />}

          {/* Debug HUD — progress + active beat readout. */}
          {!fallback && <StageHud />}

          {/* Static fallback (no WebGL / reduced motion). */}
          {fallback && (
            <div className="home-v2-stage__fallback">
              <FallbackCorridor text={text} />
            </div>
          )}
        </div>
      </div>

      {/* Projected brandmark — primary brandmark painter for the
          corridor. Pure 3D world projection; rigidly co-located
          with each gate's centre. */}
      {!fallback && <ProjectedBrandmarkActor />}

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

/** Tiny readout — shows progress + active beat as a debug aid. */
function StageHud() {
  const transform = useDepthGatewayStore((s) => s.transform);
  const progressPct = Math.round(transform.progress * 100);
  return (
    <div className="home-v2-stage__hud" aria-hidden="true">
      <div className="home-v2-stage__hud-progress">{String(progressPct).padStart(2, "0")}%</div>
      <div>{transform.beat}</div>
    </div>
  );
}

/** Simple stacked-text fallback — paints the corridor copy in plain
 *  flow when WebGL or motion is unavailable. */
function FallbackCorridor({ text }: { text: V7CorridorText }) {
  return (
    <div className="home-v2-fallback-text">
      <section>
        <p className="home-v2-fallback-text__bridge">{text.thoughtform.bridge}</p>
        <h2 dangerouslySetInnerHTML={{ __html: text.thoughtform.titleHtml }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body1Html }} />
        <p dangerouslySetInnerHTML={{ __html: text.thoughtform.body2Html }} />
      </section>
      <section>
        <h2 dangerouslySetInnerHTML={{ __html: text.diagnostic.titleHtml }} />
        <p>{text.diagnostic.bridge}</p>
        <ul>
          {text.diagnostic.labels.map((label) => (
            <li key={label.id}>
              <span>{label.n}</span> {label.tag}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 dangerouslySetInnerHTML={{ __html: text.intelligence.titleHtml }} />
        <p dangerouslySetInnerHTML={{ __html: text.intelligence.ledeHtml }} />
        <p>
          {text.intelligence.leftLabel} · {text.intelligence.rightLabel}
        </p>
      </section>
    </div>
  );
}
