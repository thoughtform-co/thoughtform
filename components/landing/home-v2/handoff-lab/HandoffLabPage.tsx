"use client";

import { useEffect, useRef, type RefObject } from "react";
import { resolveBeat } from "@/lib/home-v2/corridorMap";
import { INITIAL_TRANSFORM, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { DepthGatewayScene } from "../DepthGatewayScene";
import { ProjectedBrandmarkActor } from "../ProjectedBrandmarkActor";
import {
  HANDOFF_EXIT,
  HANDOFF_PIVOT,
  HANDOFF_SCENARIOS,
  HANDOFF_SERVICES,
  type HandoffScenarioId,
} from "./content";

interface HandoffLabPageProps {
  hudHtml: string;
  bodyClass: string;
  scenario: HandoffScenarioId;
}

const EPILOGUE_MIN = 0.58;
const EPILOGUE_MAX = 1;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function useHudNav(rootRef: RefObject<HTMLDivElement | null>) {
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
    return () => navBtn.removeEventListener("click", toggle);
  }, [rootRef]);
}

/**
 * useHandoffScroll — single rAF scroll watcher for the whole lab page
 * (ADR-002: batch every rect read into one frame).
 *
 * Channels written per frame:
 *
 *  - depth store: corridor frozen at progress 1, epilogue scrubbed
 *    across the runway. Engagement drops once the services layer has
 *    fully covered the scene so the R3F frameloop can idle.
 *  - `--handoff-epilogue-progress` on the runway (pivot copy fade).
 *  - `--handoff-cover-progress` on the lab root — the orbit
 *    approach-cover: how far the services layer has slid over the
 *    still-pinned 3D scene (0 = scene alone, 1 = fully covered).
 *  - `--handoff-progress` on the services section (artifact settle,
 *    veil release, collapse choreography).
 */
function useHandoffScroll(
  rootRef: RefObject<HTMLDivElement | null>,
  runwayRef: RefObject<HTMLElement | null>,
  servicesRef: RefObject<HTMLElement | null>,
  scenario: HandoffScenarioId
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

      // Orbit overlaps the services layer one viewport over the pinned
      // scene (negative margin in CSS). Exclude that cover window from
      // the epilogue scrub so the billions/pivot beat completes exactly
      // when the cover transition starts.
      const coverWindow = scenario === "orbit" ? vh : 0;
      const travel = Math.max(1, runwayRect.height - vh - coverWindow);
      const local = clamp01(-runwayRect.top / travel);
      const cover = scenario === "orbit" ? clamp01((vh - servicesRect.top) / vh) : 0;
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
        docked: false,
        dockProgress: 0,
        seamMorph: 0,
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
  }, [rootRef, runwayRef, servicesRef, scenario]);
}

export function HandoffLabPage({ hudHtml, bodyClass, scenario }: HandoffLabPageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const runwayRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const meta = HANDOFF_SCENARIOS[scenario];

  useHudNav(rootRef);
  useHandoffScroll(rootRef, runwayRef, servicesRef, scenario);

  return (
    <div
      ref={rootRef}
      id="handoff-top"
      className={`handoff-lab home-v2-root ${bodyClass}`}
      data-theme="dark"
      data-scenario={scenario}
    >
      <div
        className="home-v2-hud-root handoff-lab__hud"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      <section
        ref={runwayRef}
        className="handoff-lab__epilogue"
        aria-label="Frozen corridor epilogue"
      >
        <div className="handoff-lab__epilogue-sticky">
          <div className="handoff-lab__scene">
            <DepthGatewayScene />
          </div>
          {/* Push-back dim — additive layer over the canvas, driven by
              the cover progress so the 3D space visibly recedes while
              the services layer slides over it. Never an opacity fade
              on the shield wrapper itself (ADR-008 rule 3). */}
          <div className="handoff-lab__scene-dim" aria-hidden="true" />
          <ProjectedBrandmarkActor />
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
        aria-label={`${meta.label}: services handoff test`}
      >
        {scenario === "orbit" && (
          /* Approach stage — the intelligence-layer artifact (orbits +
             brandmark only; no sources, no surfaces) arrives centred
             over the receding 3D scene during the cover window, then
             glides right into the instrument slot and stays pinned
             while the service readouts scroll past on the left. */
          <aside
            className="handoff-lab__artifact handoff-lab__artifact--stage"
            aria-label="Intelligence layer artifact"
          >
            <div className="handoff-lab__artifact-stage-inner">
              <ArtifactShell scenario={scenario} />
              <p>INTELLIGENCE LAYER / JUDGMENT HALF</p>
            </div>
          </aside>
        )}

        <div className="handoff-lab__scenario-head">
          <p className="handoff-lab__kicker">{meta.label}</p>
          <h2>{meta.title}</h2>
          <p>{meta.thesis}</p>
          <span>{meta.borrow}</span>
        </div>

        {scenario === "veil" && (
          <div className="handoff-lab__veil" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}

        <div className="handoff-lab__services-grid">
          {scenario !== "orbit" && <Artifact scenario={scenario} />}

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

        <div className="handoff-lab__dock">
          <div>
            <p className="handoff-lab__kicker">{HANDOFF_EXIT.eyebrow}</p>
            <h3>{HANDOFF_EXIT.title}</h3>
            <p>{HANDOFF_EXIT.body}</p>
          </div>
          <a href="#handoff-top" aria-label="Return to the top of this handoff lab">
            Re-run
          </a>
        </div>
      </section>
    </div>
  );
}

function ArtifactShell({ scenario }: { scenario: HandoffScenarioId }) {
  return (
    <div className="handoff-lab__artifact-shell" data-artifact-scenario={scenario}>
      <span className="handoff-lab__artifact-orbit handoff-lab__artifact-orbit--outer" />
      <span className="handoff-lab__artifact-orbit handoff-lab__artifact-orbit--mid" />
      <span className="handoff-lab__artifact-orbit handoff-lab__artifact-orbit--inner" />
      <span className="handoff-lab__artifact-band handoff-lab__artifact-band--a" />
      <span className="handoff-lab__artifact-band handoff-lab__artifact-band--b" />
      <BrandmarkGlyph className="handoff-lab__artifact-mark" outline={false} />
    </div>
  );
}

function Artifact({ scenario }: { scenario: HandoffScenarioId }) {
  return (
    <aside className="handoff-lab__artifact" aria-label="Intelligence layer artifact">
      <ArtifactShell scenario={scenario} />
      <p>INTELLIGENCE LAYER / JUDGMENT HALF</p>
    </aside>
  );
}
