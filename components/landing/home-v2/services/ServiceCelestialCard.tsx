"use client";

import { CornerBracket } from "@/components/ui/CornerBracket";
import type { Service } from "./serviceData";

/** Phase pill copy — expands the compact `ServicePhase` token. */
const PHASE_LABELS: Record<Service["phase"], string> = {
  navigate: "Navigate",
  "navigate-encode": "Navigate · Encode",
  "encode-build": "Encode · Build",
  all: "Navigate · Encode · Build",
};

export interface ServiceCelestialCardProps {
  service: Service;
  /** 0-based index — matches the orbit `data-i` and the stage active step. */
  index: number;
}

/**
 * ServiceCelestialCard — one HUD/terminal readout for a service, anchored
 * at a fixed corner of the celestial map. One card is revealed at a time,
 * keyed off the stage's `[data-active-step]` in `services.css`; the active
 * service's orbit/node lights up on the map at the same time.
 *
 * Built from the shared `CornerBracket` primitive + the editorial frame in
 * `serviceData` (index · kicker · verb · tagline · body · meta rows ·
 * phase · CTA). The `lead` service (Workshop) takes a gold accent. Purely
 * presentational; visibility/transition is owned by CSS.
 */
export function ServiceCelestialCard({ service, index }: ServiceCelestialCardProps) {
  return (
    <article
      className={`service-celestial-card${service.lead ? " service-celestial-card--lead" : ""}`}
      data-i={index}
    >
      {/* Leader — a thin pointer from the card toward a region on the
          brandmark (NOT to an orbit body), so the orbits can drift freely.
          Positioned/angled in services.css; the pip end lands on the mark. */}
      <span className="service-celestial-card__leader" aria-hidden="true">
        <svg viewBox="0 0 120 64" width="120" height="64" fill="none">
          <line
            className="service-celestial-card__leader-line"
            x1="116"
            y1="56"
            x2="8"
            y2="9"
            stroke="var(--gold)"
            strokeWidth={1}
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            className="service-celestial-card__leader-pip"
            cx="8"
            cy="9"
            r="2.6"
            stroke="var(--gold)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M2 9 L5.4 9 M8 3 L8 6"
            stroke="var(--gold)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <circle cx="116" cy="56" r="1.4" fill="var(--gold)" stroke="none" />
        </svg>
      </span>

      <CornerBracket mode="four" armLength={14} thickness={1.5} color="var(--gold)" />

      <header className="service-celestial-card__head">
        <span className="service-celestial-card__index">{service.index}</span>
        <span className="service-celestial-card__dot" aria-hidden="true" />
        <span className="service-celestial-card__kicker">{service.kicker}</span>
      </header>

      <h3 className="service-celestial-card__verb">{service.verb}</h3>
      <p className="service-celestial-card__tagline">{service.tagline}</p>
      <p className="service-celestial-card__body">{service.body}</p>

      <dl className="service-celestial-card__meta">
        {service.meta.map((row) => (
          <div className="service-celestial-card__meta-row" key={row.label}>
            <dt className="service-celestial-card__meta-label">{row.label}</dt>
            <dd className="service-celestial-card__meta-value">{row.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="service-celestial-card__foot">
        <span className="service-celestial-card__phase">{PHASE_LABELS[service.phase]}</span>
        <a className="service-celestial-card__cta" href={service.ctaHref}>
          {service.ctaLabel}
          <span aria-hidden="true"> →</span>
        </a>
      </footer>
    </article>
  );
}
