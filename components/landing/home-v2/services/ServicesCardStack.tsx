"use client";

import { SERVICES, type Service, type ServiceId } from "./serviceData";

/** Phase pill copy — expands the compact `ServicePhase` token. */
const PHASE_LABELS: Record<Service["phase"], string> = {
  navigate: "Navigate",
  "navigate-encode": "Navigate · Encode",
  all: "Navigate · Encode · Build",
};

export interface ServicesCardStackProps {
  /** The service the runway scroll is currently on (mirrors `data-active-step`). */
  activeServiceId: ServiceId;
  /** Jump the active service when a collapsed card is clicked / keyed. */
  onSelectService: (serviceId: ServiceId) => void;
}

/**
 * ServicesCardStack — the top-left scrollytelling stack (animejs-style).
 *
 * All three services live as a vertical stack anchored top-left. The card whose
 * index matches the stage's `[data-active-step]` is EXPANDED into a big title
 * (`name`) + tagline + paragraph + meta + CTA; the others COLLAPSE to a slim
 * index+name bar. Expand/collapse is owned by `services.css` keyed off
 * `.services-stage[data-active-step]`, so it stays in lock-step with the
 * scroll-driven step (and the per-service brandmark rotation, which reads the
 * same active service from `hologramConnectorStore`).
 *
 * The heads are buttons so the stack is keyboard-navigable: selecting a
 * collapsed card sets the active service (and the brandmark pose) without
 * requiring a scroll. On mobile / reduced-motion every card renders expanded
 * (see the media block in `services.css`).
 */
export function ServicesCardStack({ activeServiceId, onSelectService }: ServicesCardStackProps) {
  return (
    <div className="svc-stack" aria-label="Services">
      {SERVICES.map((service, index) => {
        const active = service.id === activeServiceId;
        return (
          <article
            key={service.id}
            className={`svc-stack__card${service.lead ? " svc-stack__card--lead" : ""}`}
            data-i={index}
            data-service={service.id}
          >
            <button
              type="button"
              className="svc-stack__head"
              aria-current={active ? "true" : undefined}
              aria-expanded={active}
              onClick={() => onSelectService(service.id)}
            >
              <span className="svc-stack__index">{service.index}</span>
              <span className="svc-stack__name">{service.name}</span>
            </button>

            <div className="svc-stack__detail">
              <p className="svc-stack__kicker">{service.kicker}</p>
              <p className="svc-stack__tagline">{service.tagline}</p>
              <p className="svc-stack__body">{service.body}</p>

              <dl className="svc-stack__meta">
                {service.meta.map((row) => (
                  <div className="svc-stack__meta-row" key={row.label}>
                    <dt className="svc-stack__meta-label">{row.label}</dt>
                    <dd className="svc-stack__meta-value">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <footer className="svc-stack__foot">
                <span className="svc-stack__phase">{PHASE_LABELS[service.phase]}</span>
                <a className="svc-stack__cta" href={service.ctaHref}>
                  {service.ctaLabel}
                  <span aria-hidden="true"> →</span>
                </a>
              </footer>
            </div>
          </article>
        );
      })}
    </div>
  );
}
