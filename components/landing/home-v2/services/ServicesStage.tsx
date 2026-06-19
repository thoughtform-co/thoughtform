"use client";

import { useRef } from "react";
import { SERVICES } from "./serviceData";
import { ServicesBrandmarkField } from "./ServicesBrandmarkField";
import { useServicesStageScroll } from "../hooks/useServicesStageScroll";

/**
 * ServicesStage — the redesigned `#services` interaction (replaces the
 * sticky-stacking `ServiceStack`). Modelled on jasminadenner.com:
 *
 *   left service list  ·  centered particle brandmark  ·  right paragraph
 *
 * A `position: sticky` stage pins across a tall runway
 * (`.services-stage-root`, ~3×100vh — owned by `services.css`). As the
 * user scrolls, `useServicesStageScroll` flips `data-active-step` (0..2);
 * CSS moves the left-list highlight and crossfades the right paragraph.
 * The centered brandmark is constant (one mark, gently breathing).
 *
 * Layout note — three sibling cells (list · brandmark · copy) keep the
 * name spacing, the mark size, and the paragraph height fully decoupled:
 * `.services-stage__list` owns its own flex spacing, `.services-stage__copy`
 * grid-stacks its paragraphs in one cell, and the brandmark sizes itself
 * — so nothing stretches the others. On mobile the three cells stack into
 * a single centered column.
 *
 * Mounted via `ServicesPortal` into the `[data-services-root]` slot in
 * the v7 prototype HTML.
 */
export function ServicesStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  useServicesStageScroll(stageRef);

  return (
    <div className="services-stage" ref={stageRef} data-active-step="0">
      <div className="services-stage__items">
        <ServicesBrandmarkField />

        <div className="services-stage__list" aria-label="Services" role="list">
          {SERVICES.map((service, i) => (
            <span className="services-stage__name" data-i={i} role="listitem" key={service.id}>
              {service.name}
            </span>
          ))}
        </div>

        <div className="services-stage__copy">
          {SERVICES.map((service, i) => (
            <p className="services-stage__para" data-i={i} key={service.id}>
              {service.body}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
