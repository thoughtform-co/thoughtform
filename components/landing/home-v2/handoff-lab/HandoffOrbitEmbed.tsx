"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { HANDOFF_SCENARIOS, HANDOFF_SERVICES } from "./content";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * useEmbeddedServicesScroll — single rAF scroll watcher for the
 * production-embedded orbit handoff.
 *
 * The embed lives BELOW the main HomeCorridor on the homepage. The
 * corridor's own epilogue already paints the sphere + labs title
 * ("AND THE LABS ARE SPENDING BILLIONS…"), so the embed deliberately
 * drops the duplicate 3D runway/pivot and starts at the services
 * layer. With no R3F scene of its own, it never writes the shared
 * depth store — it only scrubs the artifact settle/rotate.
 *
 * The instrument is docked from the first frame (CSS), so the section
 * opens directly on its content — kicker, headline, and readouts —
 * instead of a leading approach runway or a centred-arrival beat.
 * `--handoff-progress` is a plain section-scroll scrub that only drives
 * the slow artifact rotation.
 */
function useEmbeddedServicesScroll(servicesRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let frame = 0;
    let disposed = false;

    const write = () => {
      frame = 0;
      if (disposed) return;

      const services = servicesRef.current;
      if (!services) return;

      const vh = window.innerHeight || 1;
      const servicesRect = services.getBoundingClientRect();
      const travel = Math.max(1, servicesRect.height - vh);
      const sectionProgress = clamp01(-servicesRect.top / travel);
      const servicesInView = servicesRect.top < vh && servicesRect.bottom > 0;
      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
      const corridorFallback =
        document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true";
      const dockCapable = !reducedMotion && !mobile && !corridorFallback;
      const docked = dockCapable && servicesInView && servicesRect.top <= vh * 0.92;

      services.style.setProperty("--handoff-progress", sectionProgress.toFixed(4));
      if (docked) {
        document.documentElement.setAttribute("data-corridor-docked", "true");
      } else {
        document.documentElement.removeAttribute("data-corridor-docked");
      }

      // ONLY own the dock channel. The corridor's `useDepthScroll`
      // remains the sole writer of progress / paintProgress /
      // epilogueProgress — having both hooks write epilogueProgress made
      // the two rAF loops fight every frame, which read as the sphere
      // jittering/pulsing during the handoff. The scene painters read
      // `docked` and hold a fixed pose themselves, so we never need to
      // overwrite the epilogue scrub here.
      const store = useDepthGatewayStore.getState();
      const prev = store.transform;
      const nextDockProgress = docked ? sectionProgress : 0;
      if (prev.docked !== docked || Math.abs(prev.dockProgress - nextDockProgress) > 0.0005) {
        store.setTransform({ ...prev, docked, dockProgress: nextDockProgress });
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
      document.documentElement.removeAttribute("data-corridor-docked");
      const store = useDepthGatewayStore.getState();
      store.setTransform({
        ...store.transform,
        docked: false,
        dockProgress: 0,
      });
    };
  }, [servicesRef]);
}

export function HandoffOrbitEmbed() {
  const servicesRef = useRef<HTMLElement>(null);
  const meta = HANDOFF_SCENARIOS.orbit;

  useEmbeddedServicesScroll(servicesRef);

  return (
    <div
      className="handoff-lab handoff-lab--embedded home-v2-root"
      data-theme="dark"
      data-scenario="orbit"
    >
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
