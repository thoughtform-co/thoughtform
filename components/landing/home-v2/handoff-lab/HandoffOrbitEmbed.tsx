"use client";

import { useEffect, useRef, type RefObject } from "react";
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

      services.style.setProperty("--handoff-progress", sectionProgress.toFixed(4));
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
