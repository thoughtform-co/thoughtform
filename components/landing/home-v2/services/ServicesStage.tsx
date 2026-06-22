"use client";

import { useRef } from "react";
import { SERVICES } from "./serviceData";
import { SERVICE_ORBITS } from "./celestialData";
import { ServicesBrandmarkField } from "./ServicesBrandmarkField";
import { ServicesOrbitMap } from "./ServicesOrbitMap";
import { ServiceCelestialCard } from "./ServiceCelestialCard";
import { useServicesStageScroll } from "../hooks/useServicesStageScroll";
import { useOrbitDrift } from "../hooks/useOrbitDrift";

/**
 * ServicesStage — the `#services` interaction as a retrofuturistic
 * celestial map. The brandmark particle core (the corridor "sun") parks
 * at center; a minimal SVG orrery (`ServicesOrbitMap`) draws one tilted
 * orbit per service around it, with a slowly drifting node on each
 * (`useOrbitDrift`). One HUD/terminal card (`ServiceCelestialCard`) is
 * revealed at a time, anchored at a fixed corner of the map.
 *
 * A `position: sticky` stage pins across a tall runway
 * (`.services-stage-root`, ~3×100vh — owned by `services.css`). As the
 * user scrolls, `useServicesStageScroll` flips `data-active-step` (0..2);
 * CSS reveals the matching card and lights up the matching orbit/node.
 * The centered particle sun is constant (gently breathing).
 *
 * Compositing (ADR-008 / ADR-021): the stage stays `background:
 * transparent` so the corridor-exit ambient interior-sphere particles
 * read behind the orbits — a sanctioned Rule 1 exception for `#services`.
 * All new layers live inside `.services-stage` (no fixed/sticky, no opaque
 * full-bleed background, no opacity animation on the stage wrapper).
 *
 * Mobile / reduced-motion (no corridor dock → no R3F sun): the 2D
 * `ServicesBrandmarkField` is the center, orbits are static/simplified,
 * and all cards stack (see `services.css`).
 *
 * Mounted via `ServicesPortal` into the `[data-services-root]` slot in
 * the v7 prototype HTML.
 */
export function ServicesStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  useServicesStageScroll(stageRef);
  useOrbitDrift(stageRef, SERVICE_ORBITS);

  return (
    <div className="services-stage" ref={stageRef} data-active-step="0">
      <div className="services-stage__items">
        {/* Center — 2D fallback footprint. Hidden on the dock-capable
            desktop path (CSS), where the R3F particle core projects here. */}
        <ServicesBrandmarkField />

        {/* The celestial orrery around the parked sun. */}
        <ServicesOrbitMap />

        {/* Service readouts — one revealed per active step (stacked on mobile). */}
        <div className="services-cards">
          {SERVICES.map((service, i) => (
            <ServiceCelestialCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
