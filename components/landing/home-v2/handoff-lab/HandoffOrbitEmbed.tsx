"use client";

import { useEffect, useRef, type RefObject } from "react";
import { resolveBeat } from "@/lib/home-v2/corridorMap";
import { INITIAL_TRANSFORM, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { DepthGatewayScene } from "../DepthGatewayScene";
import { HANDOFF_PIVOT, HANDOFF_SCENARIOS, HANDOFF_SERVICES } from "./content";

const EPILOGUE_MIN = 0.58;
const EPILOGUE_MAX = 1;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function useEmbeddedHandoffScroll(
  rootRef: RefObject<HTMLDivElement | null>,
  runwayRef: RefObject<HTMLElement | null>,
  servicesRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    let frame = 0;
    let disposed = false;
    const html = document.documentElement;

    const write = () => {
      frame = 0;
      if (disposed) return;

      const root = rootRef.current;
      const runway = runwayRef.current;
      const services = servicesRef.current;
      if (!root || !runway || !services) return;

      const vh = window.innerHeight || 1;
      const runwayRect = runway.getBoundingClientRect();
      const servicesRect = services.getBoundingClientRect();
      const coverWindow = vh;
      const travel = Math.max(1, runwayRect.height - vh - coverWindow);
      const local = clamp01(-runwayRect.top / travel);
      const cover = clamp01((vh - servicesRect.top) / vh);
      const servicesTravel = Math.max(1, servicesRect.height - vh);
      const sectionProgress = clamp01(-servicesRect.top / servicesTravel);
      const epilogueProgress = EPILOGUE_MIN + (EPILOGUE_MAX - EPILOGUE_MIN) * local;
      const covered = cover >= 0.999;
      const visible = runwayRect.bottom > 0 && runwayRect.top < vh && !covered;
      const { gateProgress } = resolveBeat(1);

      useDepthGatewayStore.getState().setTransform({
        progress: 1,
        beat: "intelligence",
        gateProgress,
        active: visible,
        armed: false,
        paintProgress: 1,
        epilogueProgress,
        velocity: 0,
      });

      runway.style.setProperty("--handoff-epilogue-progress", local.toFixed(4));
      root.style.setProperty("--handoff-cover-progress", cover.toFixed(4));
      services.style.setProperty("--handoff-progress", sectionProgress.toFixed(4));

      if (visible) {
        html.setAttribute("data-corridor-engaged", "true");
        html.setAttribute("data-corridor-epilogue", "true");
        html.setAttribute("data-brandmark-mode", "off");
      } else {
        html.removeAttribute("data-corridor-engaged");
        html.removeAttribute("data-corridor-epilogue");
        html.removeAttribute("data-brandmark-mode");
      }
    };

    const requestWrite = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      html.removeAttribute("data-corridor-engaged");
      html.removeAttribute("data-corridor-epilogue");
      html.removeAttribute("data-brandmark-mode");
      useDepthGatewayStore.getState().setTransform(INITIAL_TRANSFORM);
    };
  }, [rootRef, runwayRef, servicesRef]);
}

export function HandoffOrbitEmbed() {
  const rootRef = useRef<HTMLDivElement>(null);
  const runwayRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const meta = HANDOFF_SCENARIOS.orbit;

  useEmbeddedHandoffScroll(rootRef, runwayRef, servicesRef);

  return (
    <div
      ref={rootRef}
      className="handoff-lab handoff-lab--embedded home-v2-root"
      data-theme="dark"
      data-scenario="orbit"
    >
      <section
        ref={runwayRef}
        className="handoff-lab__epilogue"
        aria-label="Frozen corridor epilogue"
      >
        <div className="handoff-lab__epilogue-sticky">
          <div className="handoff-lab__scene">
            <DepthGatewayScene />
          </div>
          <div className="handoff-lab__scene-dim" aria-hidden="true" />
          <div className="handoff-lab__pivot" aria-hidden="true">
            <p className="handoff-lab__kicker">{HANDOFF_PIVOT.eyebrow}</p>
            <h1>{HANDOFF_PIVOT.title}</h1>
            <p>{HANDOFF_PIVOT.body}</p>
          </div>
        </div>
      </section>

      <section
        ref={servicesRef}
        className="handoff-lab__services"
        aria-label={`${meta.label}: services handoff`}
      >
        <aside
          className="handoff-lab__artifact handoff-lab__artifact--stage"
          aria-label="Intelligence layer artifact"
        >
          <div className="handoff-lab__artifact-stage-inner">
            <OrbitArtifactShell />
            <p>THE LAYER / TEAM-OWNED</p>
          </div>
        </aside>

        <div className="handoff-lab__scenario-head">
          <p className="handoff-lab__kicker">{meta.label}</p>
          <h2>{meta.title}</h2>
          <p>{meta.thesis}</p>
          <span>{meta.borrow}</span>
        </div>

        <div className="handoff-lab__services-grid">
          <div className="handoff-lab__service-flow">
            {HANDOFF_SERVICES.map((service) => (
              <article key={service.id} className="handoff-lab__service" data-service={service.id}>
                <div className="handoff-lab__service-meta">
                  <span>{service.index}</span>
                  <strong>{service.verb}</strong>
                  <em>{service.readout}</em>
                </div>
                <h3>{service.title}</h3>
                <p className="handoff-lab__service-line">{service.line}</p>
                <p>{service.body}</p>
                <dl>
                  <div>
                    <dt>Format</dt>
                    <dd>{service.engagement}</dd>
                  </div>
                  <div>
                    <dt>Proof</dt>
                    <dd>{service.proof}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function OrbitArtifactShell() {
  return (
    <div className="handoff-lab__artifact-shell" data-artifact-scenario="orbit">
      <span className="handoff-lab__artifact-orbit handoff-lab__artifact-orbit--outer" />
      <span className="handoff-lab__artifact-orbit handoff-lab__artifact-orbit--mid" />
      <span className="handoff-lab__artifact-orbit handoff-lab__artifact-orbit--inner" />
      <span className="handoff-lab__artifact-band handoff-lab__artifact-band--a" />
      <span className="handoff-lab__artifact-band handoff-lab__artifact-band--b" />
    </div>
  );
}
