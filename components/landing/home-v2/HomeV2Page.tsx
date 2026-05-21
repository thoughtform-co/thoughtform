"use client";

import { useEffect, useRef, useState } from "react";
import { probeWebGL } from "@/lib/webgl/probe";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { DepthGatewayScene } from "./DepthGatewayScene";
import { useDepthScroll } from "./hooks/useDepthScroll";
import { ProjectedBrandmarkActor } from "./ProjectedBrandmarkActor";

interface HomeV2PageProps {
  /** v7 HUD chrome HTML (gateway, hud rails, nav, status). Fed by
   *  `sliceV7Sections` in the route's server component. */
  hudHtml: string;
  /** Per-section breakdown from `sliceV7Sections` — already in source
   *  order. Each entry carries the v7 station markup, untouched. */
  sections: { id: string; html: string }[];
  /** Body class lifted from the prototype (theme + density). */
  bodyClass: string;
}

/** Map section ids to chamber letters so CSS opacity vars + the
 *  brandmark dock lookup share one indirection table. */
const CHAMBER_BY_SECTION_ID: Record<string, "A" | "B" | "C"> = {
  definition: "A",
  "missing-layer": "B",
  "intelligence-layer": "C",
};

/**
 * HomeV2Page — depth-corridor composition (ADR-018).
 *
 * Mounts three v7 station sections (definition / missing-layer /
 * intelligence-layer) stacked inside the sticky depth stage. The
 * sections now contribute COPY ONLY — titles, ledes, label pills,
 * chamber captions. The diagram visuals (sigil compass, miss
 * orbital SVG, ilayer triad SVG) are hidden in corridor mode via
 * a `[data-home-v2-mode="corridor"]` CSS gate; their geometry is
 * rendered by the R3F `GatewayWorld` instead, in world space, so
 * the camera can approach + pass each gate.
 *
 * The PRIMARY brandmark painter is the
 * `ProjectedBrandmarkActor` — a `position: fixed` inline SVG mark
 * whose viewport rect is computed each frame from the brandmark's
 * world position projected through the same camera path used by
 * the R3F scene. During the intelligence beat's substrate morph
 * the actor cuts off (`display: none`) and the `BrandmarkPointCloud`
 * covers the same silhouette before morphing to the Fibonacci
 * sphere (ADR-017 substrate-cut pattern).
 *
 * The v7 HUD chrome is mounted once at page root (position: fixed
 * elements from the prototype) so rails + depth ticks + wordmark
 * persist across hero, stage, and tail.
 */
export function HomeV2Page({ hudHtml, sections, bodyClass }: HomeV2PageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
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

  // Set data-brandmark-mode="off" on the document root so the global
  // v7 brandmark canvas (if mounted elsewhere in this render tree)
  // doesn't paint over the home-v2 scene. The home-v2 R3F owns the
  // brandmark cloud end-to-end on this route.
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-brandmark-mode");
    document.documentElement.setAttribute("data-brandmark-mode", "off");
    return () => {
      if (prev === null) document.documentElement.removeAttribute("data-brandmark-mode");
      else document.documentElement.setAttribute("data-brandmark-mode", prev);
    };
  }, []);

  // HUD hamburger nav — wire the bare minimum from v7 LandingPage so
  // the menu can open/close. Smooth-scroll on nav links is skipped
  // (the v2 stage is a sticky scrub, not a section anchor target).
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

  // Force-reveal v7 [data-m] elements inside the stage. The
  // production page wires `useRevealMotion` (IntersectionObserver
  // adding `.is-in`) to drive these transitions; we skip that hook
  // on v2 because the sections are stacked & cross-faded by chamber
  // progress, not section-entry observers. Without this, every
  // [data-m] element would stay at its hidden start state.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(".home-v2-stage [data-m]").forEach((el) => {
      el.classList.add("is-in");
    });
    root.querySelectorAll<HTMLElement>(".home-v2-stage [data-m-group]").forEach((el) => {
      el.classList.add("is-in");
    });
  }, [sections]);

  const fallback = webglOK === false || reducedMotion;
  const mode = fallback ? "fallback" : "corridor";

  return (
    <div
      ref={rootRef}
      className={`home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-home-v2-mode={mode}
    >
      {/* v7 HUD chrome — .gateway + .hud rails + .hud__nav. All of
          this is `position: fixed` in landing.css so it lives at
          viewport regardless of where we mount it. */}
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

      {/* ═══ DEPTH STAGE (Chambers A → B → C) ═══
          Sticky 100svh interior; each chamber section is the v7
          markup wrapped in an absolutely-positioned div so they
          stack in the same viewport rect and cross-fade by chamber
          progress. */}
      <div
        ref={stageRef}
        className="home-v2-stage"
        data-fallback={fallback ? "true" : "false"}
        aria-label="Depth gateway: Definition, Diagnostic, Intelligence Layer"
      >
        <div className="home-v2-stage__sticky">
          {sections.map((s) => {
            const chamber = CHAMBER_BY_SECTION_ID[s.id] ?? "A";
            return (
              <div
                key={s.id}
                className="home-v2-section"
                data-chamber={chamber}
                data-section-id={s.id}
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            );
          })}

          {/* R3F canvas — paints the depth-corridor world (static
              stars, scroll streaks, world-space diagram gates, and
              the substrate-morph cover) BEHIND the chamber copy
              layers. The brandmark itself is painted by the DOM-side
              ProjectedBrandmarkActor mounted at page root, so it
              composites above the canvas without z-index gymnastics. */}
          <div className="home-v2-stage__canvas">
            <DepthGatewayScene />
          </div>

          {/* Debug HUD — progress + active chamber readout. */}
          {!fallback && <StageHud />}

          {/* Static fallback (no WebGL / reduced motion) — paint a
              stacked plain-text version of the three chambers so
              the route is still readable. */}
          {fallback && (
            <div className="home-v2-stage__fallback">
              <p>
                Depth gateway requires WebGL. The three chambers (Definition, Diagnostic,
                Intelligence Layer) are also reachable from the production homepage.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Projected vector brandmark — primary brandmark painter for
          the corridor (ADR-018). Mounted at page root so its
          `position: fixed` shell sits above the R3F canvas and the
          chamber DOM. Renders nothing during the substrate-morph
          window — the R3F point cloud covers the silhouette then. */}
      {!fallback && <ProjectedBrandmarkActor />}

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

/** Tiny readout — shows progress + active chamber as a debug aid. */
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
