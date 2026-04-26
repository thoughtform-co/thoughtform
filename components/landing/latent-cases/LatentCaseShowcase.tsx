"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { LOOP_CASE_STUDIES } from "./caseData";
import { CaseOrbitStage } from "./CaseOrbitStage";
import { LatentExitPlane } from "./LatentExitPlane";
import { LatentGatewayStage } from "./LatentGatewayStage";
import { LatentTopology } from "./LatentTopology";
import { useLatentCaseScroll } from "./useLatentCaseScroll";

export function LatentCaseShowcase() {
  const trackRef = useRef<HTMLElement | null>(null);
  const scroll = useLatentCaseScroll(trackRef);
  const [narrow, setNarrow] = useState(false);
  const [caseNudge, setCaseNudge] = useState(0);
  const prevActive = useRef(scroll.activeCaseIndex);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (prevActive.current !== scroll.activeCaseIndex) {
      prevActive.current = scroll.activeCaseIndex;
      setCaseNudge(0);
    }
  }, [scroll.activeCaseIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest("a,button,input,textarea,select")) return;
      const n = LOOP_CASE_STUDIES.length;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCaseNudge((k) => (k + 1) % n);
      } else {
        e.preventDefault();
        setCaseNudge((k) => (k - 1 + n) % n);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayCaseIndex =
    (scroll.activeCaseIndex + caseNudge + LOOP_CASE_STUDIES.length) % LOOP_CASE_STUDIES.length;

  // Editorial surface that peels away to expose the gateway
  const surfaceStyle: CSSProperties = {
    opacity: Math.max(0, 1 - scroll.surfaceReveal),
    transform: `translate3d(0, ${(1 - scroll.surfaceReveal) * 6}%, 0)`,
  };

  // Phase label for HUD (helps debugging + reads as instrument feedback)
  const phaseLabel = (() => {
    const t = scroll.trackProgress;
    if (t < 0.2) return "Approaching surface";
    if (t < 0.4) return "Frontal approach";
    if (t < 0.56) return "Tunnel transit";
    if (t < 0.64) return "Exit plane";
    if (t < 0.72) return "Cases docking";
    if (t < 0.82) return "Fan to orbit";
    if (t < 0.95) return "Cycling cases";
    return "Egress";
  })();

  return (
    <div className="latent-case-showcase">
      <header className="latent-case-showcase__top">
        <span className="latent-case-showcase__title">Latent · Case showcase</span>
        <span className="latent-case-showcase__readout">
          δ{" "}
          {Math.round(scroll.trackProgress * 100)
            .toString()
            .padStart(2, "0")}{" "}
          · brg{" "}
          {Math.round(scroll.orbitCycle * 360)
            .toString()
            .padStart(3, "0")}
        </span>
        <a href="/test">← Test index</a>
      </header>

      <section className="latent-case-showcase__intro">
        <h1>Scroll through the gateway</h1>
        <p>
          Approach the gateway, fly through it, emerge in the latent space — case studies arrive
          from depth, orbit in formation, then recede. Loop creative-tech tools: Vesper, Mímir,
          Babylon, Heimdall.
        </p>
        <p style={{ color: "var(--dawn-50)", fontSize: "var(--type-sm)" }}>
          Internal route — blocked in production builds by middleware. Use ← / → to step through
          cases.
        </p>
      </section>

      <section
        ref={trackRef}
        className="latent-case-showcase__track"
        aria-label="Latent scroll track"
        tabIndex={-1}
      >
        <div className="latent-case-showcase__sticky">
          <div className="latent-case-showcase__backdrop" aria-hidden="true" />

          <LatentTopology
            emerge={scroll.latentEmerge}
            drift={scroll.orbitCycle}
            reduceMotion={scroll.reduceMotion}
          />

          <LatentGatewayStage
            tunnelScroll={scroll.tunnelScroll}
            scale={scroll.gatewayScale}
            opacity={scroll.gatewayOpacity}
          />

          <LatentExitPlane intensity={scroll.exitPlane} reduceMotion={scroll.reduceMotion} />

          {/* Vignette to keep cards readable + suggest atmospheric depth */}
          <div className="latent-case-showcase__vignette" aria-hidden="true" />

          {/* Surface lid — covers everything until the user starts scrolling in */}
          <div className="latent-case-showcase__surface" style={surfaceStyle} aria-hidden="true" />

          <div className="latent-case-showcase__hud" aria-hidden="true">
            <div className="latent-case-showcase__hud-row">
              <span className="latent-case-showcase__hud-k">phase</span>
              <span className="latent-case-showcase__hud-v">{phaseLabel}</span>
            </div>
            <div className="latent-case-showcase__hud-row">
              <span className="latent-case-showcase__hud-k">depth</span>
              <span className="latent-case-showcase__hud-v">
                {(scroll.tunnelScroll * 9.99).toFixed(2)}
              </span>
            </div>
            {scroll.reduceMotion && (
              <div className="latent-case-showcase__hud-row">
                <span className="latent-case-showcase__hud-k">motion</span>
                <span className="latent-case-showcase__hud-v">reduced</span>
              </div>
            )}
          </div>

          <div
            className="latent-case-showcase__hud latent-case-showcase__hud--right"
            aria-hidden="true"
          >
            <div className="latent-case-showcase__hud-row">
              <span className="latent-case-showcase__hud-k">tgt</span>
              <span className="latent-case-showcase__hud-v">
                {String(displayCaseIndex + 1).padStart(2, "0")} / 04
              </span>
            </div>
            <div className="latent-case-showcase__hud-row">
              <span className="latent-case-showcase__hud-k">case</span>
              <span className="latent-case-showcase__hud-v">
                {LOOP_CASE_STUDIES[displayCaseIndex]?.name.toUpperCase()}
              </span>
            </div>
          </div>

          <CaseOrbitStage
            activeCaseIndex={displayCaseIndex}
            orbitCycle={scroll.orbitCycle}
            caseEntry={scroll.caseEntry}
            orbitFanOut={scroll.orbitFanOut}
            reduceMotion={scroll.reduceMotion}
            narrowViewport={narrow}
          />
        </div>
      </section>

      <section className="latent-case-showcase__outro">
        <h2>Next</h2>
        <p>
          Choreography sign-off → port section after Practice on the v7 landing. See{" "}
          <code>docs/LATENT_CASE_SHOWCASE.md</code>.
        </p>
      </section>
    </div>
  );
}
