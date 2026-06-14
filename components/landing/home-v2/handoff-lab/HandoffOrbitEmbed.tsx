"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { HANDOFF_SCENARIOS, HANDOFF_SERVICES } from "./content";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Corridor epilogueProgress at/after which the live sphere docks as a
 *  fixed backdrop. Chosen so the billions title is essentially up
 *  (TITLE_IN ends 0.74) and the camera has all but landed before the
 *  instrument is held — the start of the deliberate DWELL on the landed
 *  sphere, BEFORE the services copy begins to rise. Engaging here (rather
 *  than off this section's own position) is what opens a clean hold:
 *  the canvas is promoted absolute → fixed while the stage is still
 *  sticky-pinned, so the switch is seamless, and the sphere then stays
 *  put as the stage scrolls out beneath the rising cover. */
const DOCK_ENGAGE_EP = 0.72;

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
      const reducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      const mobile = window.matchMedia?.("(max-width: 960px)").matches ?? false;
      const corridorFallback =
        document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true";
      const dockCapable = !reducedMotion && !mobile && !corridorFallback;

      // Dock OFF the corridor epilogue (sphere landed + billions title up),
      // NOT off this section's scroll position. Holding the sphere as a
      // fixed backdrop from `DOCK_ENGAGE_EP` onward is what opens the
      // dwell: the instrument is locked the moment the landing resolves,
      // so the climax holds a clean viewport before this copy rises. Stays
      // docked until the section has fully scrolled past (into continuum)
      // or the user scrolls back up into the live epilogue (ep drops).
      const ep = useDepthGatewayStore.getState().transform.epilogueProgress;
      const docked = dockCapable && ep >= DOCK_ENGAGE_EP && servicesRect.bottom > 0;

      // Cover progress — how far this opaque services plane has risen over
      // the viewport: 0 when its top sits at the viewport bottom, 1 once it
      // covers the full viewport. Drives the SPHERE recede (the docked
      // canvas scale + fade in home-v2.css) and the billions cross-fade —
      // the parallax depth at the seam. Written on <html> so the fixed
      // canvas + the corridor headers can read it.
      const cover = clamp01((vh - servicesRect.top) / vh);

      services.style.setProperty("--handoff-progress", sectionProgress.toFixed(4));
      document.documentElement.style.setProperty("--handoff-cover", cover.toFixed(4));
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
      document.documentElement.style.removeProperty("--handoff-cover");
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
