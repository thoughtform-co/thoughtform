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
  const [activeServiceId, setActiveServiceId] = useState<ServiceId>(SERVICES[0].id);
  const useHologramCanvas = useMediaQuery(
    "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
  );

  const setActiveByStep = useCallback((step: number) => {
    setActiveServiceId(SERVICES[step]?.id ?? SERVICES[0].id);
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
                density={0.96}
                entrance="scroll"
                entranceForm="wire"
                flyIn={1}
                opacity={0.92}
                pointSize={4.7}
                publishAnchors
                scale={0.72}
                scanGain={0.62}
                showShell
              />
              <EffectComposer>
                <Bloom
                  intensity={0.72}
                  luminanceThreshold={0.2}
                  luminanceSmoothing={0.9}
                  mipmapBlur
                />
              </EffectComposer>
            </Canvas>
          </div>
        ) : null}

        <ServicesBrandmarkField />
        <ServicesOrbitMap />

        <ServiceScanInterface activeServiceId={activeServiceId} onSelectService={selectService} />
      </div>
    </div>
  );
}
