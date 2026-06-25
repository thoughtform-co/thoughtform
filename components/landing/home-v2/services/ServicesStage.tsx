"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useCallback, useRef, useState } from "react";

import { SERVICE_ORBITS } from "./celestialData";
import { ServiceScanInterface } from "./ServiceScanInterface";
import { ServicesBrandmarkField } from "./ServicesBrandmarkField";
import { ServicesHologramScene } from "./hologram";
import { ServicesOrbitMap } from "./ServicesOrbitMap";
import { SERVICES, type ServiceId } from "./serviceData";
import { useOrbitDrift } from "../hooks/useOrbitDrift";
import { useServicesStageScroll } from "../hooks/useServicesStageScroll";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

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
  const itemsRef = useRef<HTMLDivElement>(null);
  const expandedServiceRef = useRef<ServiceId | null>(null);
  const [activeServiceId, setActiveServiceId] = useState<ServiceId>(SERVICES[0].id);
  const [expandedServiceId, setExpandedServiceId] = useState<ServiceId | null>(null);
  const useHologramCanvas = useMediaQuery(
    "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
  );

  const setActiveByStep = useCallback((step: number) => {
    if (expandedServiceRef.current) return;
    setActiveServiceId(SERVICES[step]?.id ?? SERVICES[0].id);
  }, []);

  const updateExpandedService = useCallback((serviceId: ServiceId | null) => {
    expandedServiceRef.current = serviceId;
    setExpandedServiceId(serviceId);
  }, []);

  const selectService = useCallback((serviceId: ServiceId) => {
    setActiveServiceId(serviceId);
    const index = SERVICES.findIndex((service) => service.id === serviceId);
    if (index >= 0) {
      stageRef.current?.setAttribute("data-active-step", String(index));
    }
  }, []);

  useServicesStageScroll(stageRef, setActiveByStep);
  useOrbitDrift(stageRef, SERVICE_ORBITS);

  return (
    <div className="services-stage" ref={stageRef} data-active-step="0">
      <div className="services-stage__items" ref={itemsRef}>
        {useHologramCanvas ? (
          <div className="services-hologram" aria-hidden="true">
            <Canvas
              camera={{ position: [0, 0, 3.65], fov: 38, near: 0.1, far: 100 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
            >
              <ServicesHologramScene
                activeServiceId={activeServiceId}
                accentColor="#dcc176"
                blending="normal"
                color="#b08b42"
                density={0.9}
                depthStrutCount={2200}
                edgeThresholdDeg={5}
                entrance="scroll"
                entranceForm="wire"
                flyIn={1}
                opacity={0.74}
                pointSize={4.3}
                publishAnchors
                // Frontal rest pose (ADR-023/025 2026-06-25 harmonization):
                // the corridor in-sphere brandmark is head-on (its sword is
                // aligned to the substrate sphere's vertical gimbal orbit), so
                // the production Services wireframe drops its 3/4 rest tilt to
                // match — the corridor → Services handoff has no rotation pop.
                // Pointer-look (default 0.12) stays, so the mark is still
                // explorable head-on. The lab keeps the 3/4 default pose.
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

        <ServicesBrandmarkField />
        <ServicesOrbitMap />

        <ServiceScanInterface
          activeServiceId={activeServiceId}
          expandedServiceId={expandedServiceId}
          onExpandedServiceChange={updateExpandedService}
          onSelectService={selectService}
        />
      </div>
    </div>
  );
}
