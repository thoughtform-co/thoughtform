"use client";

import { SERVICES } from "./serviceData";
import { ServiceCard } from "./ServiceCard";

/**
 * Renders the three "how we run it" terminal cards (Keynote /
 * Workshop / Embedded) as a sticky-stacking column inside the
 * Services station. Mounted via {@link ServicesPortal} into the
 * `[data-services-root]` placeholder declared in the v7 HTML
 * prototype.
 *
 * Sticky-stack behaviour is owned by `services.css` — each card is
 * `position: sticky` with an incremental `top` offset so successive
 * cards pin and stack on top of the previous one as the user scrolls
 * (Enerblock-style), using native scroll. No GSAP pin is needed.
 */
export function ServiceStack() {
  return (
    <div className="services__list" role="list">
      {SERVICES.map((service, i) => (
        <ServiceCard key={service.id} service={service} index={i} total={SERVICES.length} />
      ))}
    </div>
  );
}
