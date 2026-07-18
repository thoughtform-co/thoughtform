"use client";

import { useEffect, useRef } from "react";

import { NAVIGATE_FRAME, SCENE_DOTS } from "./stations";

/**
 * NavigateFrame — a faithful STATIC reproduction of the corridor's
 * parked "Navigate" viewport, with no scroll machinery and no WebGL.
 *
 * The title band and caption reticle use the REAL production classes
 * (`.home-v2-station-header*`, `.home-v2-reticle*`) authored at their
 * end-state: `is-armed` opens the reticle aperture and rides the corner
 * crosses out, and the three elements the RAF loop normally fades in
 * (station header, caption card, support paragraph) get inline
 * `opacity: 1`. The right-rail Arc register is deliberately OMITTED —
 * the left menu is its replacement (lab decision).
 *
 * The backdrop is a CSS approximation of the latent-field starscape:
 * void base, a soft central gold glow, the NavigateGate's warm-white
 * ellipse + gold centre diamond, and a deterministic dawn dot scatter.
 */
export function NavigateFrame({ hudHtml, showDiamond }: { hudHtml: string; showDiamond: boolean }) {
  const hudRef = useRef<HTMLDivElement>(null);

  // The parse-injected rail-manifest skeleton keeps its detent diamond
  // hidden until `data-ready`. Reveal it (at the Navigate detent) only
  // when the lab toggle asks — otherwise the rail is pure tick-ladder
  // context and the menu owns the "you are here" signal.
  useEffect(() => {
    const root = hudRef.current?.querySelector<HTMLElement>("[data-rail-manifest-root]");
    if (!root) return;
    if (showDiamond) {
      root.setAttribute("data-ready", "true");
      root.style.setProperty("--rail-diamond-top", "31%");
    } else {
      root.removeAttribute("data-ready");
      root.style.removeProperty("--rail-diamond-top");
    }
  }, [showDiamond, hudHtml]);

  return (
    <>
      {/* ── Backdrop approximation ── */}
      <div className="sml-scene" aria-hidden="true">
        <i className="sml-scene__glow" />
        <i className="sml-scene__ring" />
        <i className="sml-scene__gate" />
        {SCENE_DOTS.map((d) => (
          <i
            key={d.id}
            className="sml-scene__dot"
            style={{ left: `${d.x}%`, top: `${d.y}%`, opacity: d.o, width: d.s, height: d.s }}
          />
        ))}
      </div>

      {/* ── Real v7 HUD chrome (rails + ticks + brackets + wordmark) ── */}
      <div
        ref={hudRef}
        className="sml__hud home-v2-hud-root"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      {/* ── Frame copy — production classes, authored end-state ── */}
      <div className="home-v2-station-headers">
        <div
          className="home-v2-station-header home-v2-station-header--split"
          style={{ opacity: 1 }}
        >
          <div className="home-v2-station-header__head">
            <div className="home-v2-station-header__headgroup">
              <div className="home-v2-station-header__console home-v2-station-header__console--title">
                <h2
                  className="home-v2-station-header__title"
                  dangerouslySetInnerHTML={{ __html: NAVIGATE_FRAME.titleHtml }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="home-v2-caption-card is-armed" data-station="nav" style={{ opacity: 1 }}>
          <div className="home-v2-reticle">
            <i className="home-v2-reticle__glass" aria-hidden="true" />
            <i className="home-v2-reticle__frame-x" aria-hidden="true" />
            <i className="home-v2-reticle__frame-y" aria-hidden="true" />
            <i className="home-v2-reticle__cross is-tl" aria-hidden="true" />
            <i className="home-v2-reticle__cross is-tr" aria-hidden="true" />
            <i className="home-v2-reticle__cross is-bl" aria-hidden="true" />
            <i className="home-v2-reticle__cross is-br" aria-hidden="true" />
            <span className="home-v2-reticle__coord" aria-hidden="true">
              <span>{NAVIGATE_FRAME.coordRef}</span> <b>/ {NAVIGATE_FRAME.coordT}</b>
            </span>
            <i className="home-v2-reticle__rail" aria-hidden="true" />
            <div className="home-v2-reticle__meta" aria-hidden="true">
              <span className="home-v2-reticle__lead" />
              <span className="home-v2-reticle__mi">
                <span className="home-v2-caption-diamond" />
                <span>{NAVIGATE_FRAME.kicker}</span>
                <span className="home-v2-caption-sep" />
                <span>{NAVIGATE_FRAME.callsign}</span>
                <span className="home-v2-caption-sep" />
                <span className="home-v2-reticle__status">{NAVIGATE_FRAME.status}</span>
              </span>
              <span className="home-v2-reticle__lead" />
            </div>
            <div className="home-v2-reticle__body">
              <div className="home-v2-caption-copy">
                <p
                  className="home-v2-station-header__support"
                  style={{ opacity: 1 }}
                  dangerouslySetInnerHTML={{ __html: NAVIGATE_FRAME.supportHtml }}
                />
              </div>
            </div>
            <div className="home-v2-reticle__pips" aria-hidden="true">
              <span className="home-v2-caption-diamond is-dim" />
              <span className="home-v2-caption-diamond" />
              <span className="home-v2-caption-diamond is-dim" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
