"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useCallback, useEffect, useRef, useState } from "react";

import { ServicesHologramScene } from "./hologram";
import { ServicesPlateCluster } from "./ServicesPlateCluster";
import { SERVICES, type ServiceId } from "./serviceData";
import { useServicesStageScroll } from "../hooks/useServicesStageScroll";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { TENSOR_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { UNIFIED_SERVICES_ARMILLARY } from "../unifiedServicesInstrument";

/**
 * ServicesStage - the `#services` interaction as a section-owned holographic
 * instrument.
 *
 * Desktop renders the real Thoughtform brandmark hologram and service orbits
 * in one R3F scene. The scan notes and the expanded card are DOM overlays that
 * receive projected anchors from that scene. Mobile/reduced-motion keeps the
 * existing static brandmark + SVG orbit fallback and the same scan-card UI.
 *
 * This is intentionally NOT the retired fixed in-Services brandmark/pixel
 * choreography from ADR-021. No `data-services-brandmark`, no seam pixel field,
 * and no fixed viewport actor are reintroduced.
 */
export function ServicesStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeServiceId, setActiveServiceId] = useState<ServiceId>(SERVICES[0].id);
  const useHologramCanvas = useMediaQuery(
    "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
  );

  // Bridge the active service to the unified corridor instrument (the armillary
  // lives in the corridor canvas) so the active orbit ring still highlights in
  // the ambient backdrop behind the plates. Harmless when the flag is off.
  const setActiveServiceIdStore = useHologramConnectors((s) => s.setActiveServiceId);
  useEffect(() => {
    setActiveServiceIdStore(activeServiceId);
  }, [activeServiceId, setActiveServiceIdStore]);
  useEffect(() => () => setActiveServiceIdStore(null), [setActiveServiceIdStore]);

  // When the corridor supplies the unified instrument (desktop, flag on), the
  // section does NOT mount its own hologram canvas — the persistent corridor
  // brandmark + CorridorArmillary ARE the ambient backdrop the signal plates
  // sit on. Only the flag-off / lab path mounts the standalone canvas.
  const showServicesCanvas = useHologramCanvas && !UNIFIED_SERVICES_ARMILLARY;

  const setActiveByStep = useCallback((step: number) => {
    setActiveServiceId(SERVICES[step]?.id ?? SERVICES[0].id);
  }, []);

  // Click-to-scroll (proven ServiceScanInterface behavior): scroll owns the
  // open plate (the scroll hook maps runway progress → step), so a seed click
  // navigates the PAGE to the middle of that service's scroll segment instead
  // of forcing local state that the next scroll tick would overwrite. When the
  // runway has no travel (mobile / reduced-motion — the CSS drops the pin),
  // fall back to setting the state directly so taps still open seeds.
  const selectService = useCallback((serviceId: ServiceId) => {
    const index = SERVICES.findIndex((service) => service.id === serviceId);
    if (index < 0) return;
    // Inert layouts (mobile / reduced motion): the stage is a static stacked
    // accordion and the scroll hook parks the step, so a tap must set the open
    // plate directly — scrolling would do nothing (and the stacked content can
    // still give the runway rect > 100vh, so the travel check alone is not a
    // reliable gate; mirror useServicesStageScroll's isInert()).
    const inert =
      (window.matchMedia?.("(max-width: 960px)").matches ?? false) ||
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    const runway = stageRef.current?.parentElement; // .services-stage-root
    if (inert || !runway) {
      setActiveServiceId(serviceId);
      return;
    }
    const vh = window.innerHeight || 1;
    const rect = runway.getBoundingClientRect();
    const travel = rect.height - vh;
    if (travel <= 0) {
      setActiveServiceId(serviceId);
      return;
    }
    const targetY = window.scrollY + rect.top + ((index + 0.5) / SERVICES.length) * travel;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }, []);

  // Reads the corridor-exit dissipate → publishes `--svc-content-in` (cluster
  // entrance) + `--svc-arrive` on the stage, and maps the runway scroll to
  // `data-active-step` — the step that owns which plate is open.
  useServicesStageScroll(stageRef, setActiveByStep);

  return (
    <div className="services-stage" ref={stageRef} data-active-step="0">
      <div className="services-stage__items">
        {showServicesCanvas ? (
          <div className="services-hologram" aria-hidden="true">
            <Canvas
              camera={{ position: [0, 0, 3.65], fov: 38, near: 0.1, far: 100 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
            >
              <ServicesHologramScene
                activeServiceId={activeServiceId}
                accentColor={TENSOR_ACCENT}
                blending="normal"
                color={TENSOR_GOLD}
                density={0.9}
                depthStrutCount={2200}
                edgeThresholdDeg={5}
                entrance="scroll"
                entranceForm="wire"
                flyIn={1}
                opacity={0.74}
                pointSize={4.3}
                publishAnchors
                restTiltX={0}
                restTiltY={0}
                scale={0.72}
                scanGain={0.24}
                showShell
                shellCount={120}
                surfaceCount={160}
                wireCount={6800}
                wireStroke={0.084}
              />
              <EffectComposer>
                <Bloom
                  intensity={0.3}
                  luminanceThreshold={0.42}
                  luminanceSmoothing={0.9}
                  mipmapBlur
                />
              </EffectComposer>
            </Canvas>
          </div>
        ) : null}

        <ServicesPlateCluster
          activeServiceId={activeServiceId}
          expandedServiceId={activeServiceId}
          onSelectService={selectService}
        />
      </div>
    </div>
  );
}
