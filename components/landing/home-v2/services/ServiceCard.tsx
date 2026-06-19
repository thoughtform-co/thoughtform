"use client";

import { PHASE_LABELS, type Service } from "./serviceData";
import { ServiceSigilField } from "./ServiceSigilField";
import { useReveal } from "./useReveal";

interface ServiceCardProps {
  service: Service;
  /** 0-based card index in the stack. */
  index: number;
  /** Total cards in the stack — drives the "01 / 03" counter. */
  total: number;
}

/**
 * One terminal-grammar service card in the Services stack.
 *
 * Layout — single wide horizontal panel with the SVR shape (45° corner
 * notch, hard corners):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ [particle visual]   │ // 01 · KEYNOTE                        │
 *   │                     │ THE LOOP AS ARGUMENT                   │
 *   │                     │ Install the frame in a room.           │
 *   │                     │                                        │
 *   │                     │ Runs   — Navigate, as story.           │
 *   │                     │ Shape  — 30–90 minutes. NL or EN.      │
 *   │                     │ Leaves — A shared language ...         │
 *   │                     │                                        │
 *   │                     │ [Book a keynote →]                     │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Sticky-stack behaviour: each card pins to a `top` offset that grows
 * with `index`, so successive cards stack on top of the previous one
 * as the user scrolls (Enerblock-style). Stack offset is exposed as
 * the `--svc-stack-i` CSS var so `services.css` can drive the
 * incremental sticky `top`.
 *
 * Mirrors the rhythm of `BuildCaseSlide` (counter + rule + domain row
 * → name → tagline → meta `dl` rows) but for a sticky stack instead
 * of a free-flow editorial column.
 */
export function ServiceCard({ service, index, total }: ServiceCardProps) {
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  // Per-card scroll-reveal (the cards are portaled, so the global
  // `[data-m]` observer never sees them). CSS owns the fade/rise.
  const { ref: cardRef, inView } = useReveal<HTMLElement>();

  return (
    <article
      ref={cardRef}
      className={`svc-card${service.lead ? " svc-card--lead" : ""}`}
      data-service-id={service.id}
      data-service-index={index}
      data-in={inView ? "true" : "false"}
      style={{ ["--svc-stack-i" as string]: String(index) }}
    >
      {/* Hairline header strip with mono counter + phase pill. */}
      <header className="svc-card__header" aria-hidden="true">
        <span className="svc-card__counter">{counter}</span>
        <span className="svc-card__rule" />
        <span className="svc-card__phase">{PHASE_LABELS[service.phase]}</span>
      </header>

      <div className="svc-card__body">
        {/* Left — particle sigil (card-scoped 2D canvas). */}
        <div className="svc-card__visual">
          <ServiceSigilField shapeKey={service.shapeKey} accent={service.lead === true} />
        </div>

        {/* Right — copy column. */}
        <div className="svc-card__copy">
          <p className="svc-card__index">
            <span aria-hidden="true">{"//"}</span> {service.index} &middot; {service.verb}
          </p>
          <p className="svc-card__kicker">{service.kicker}</p>
          <h3 className="svc-card__tagline">{service.tagline}</h3>
          <p className="svc-card__lede">{service.body}</p>

          <dl className="svc-card__meta">
            {service.meta.map((row) => (
              <div className="svc-card__meta__row" key={row.label}>
                <dt className="svc-card__meta__label">{row.label}</dt>
                <dd className="svc-card__meta__value">{row.value}</dd>
              </div>
            ))}
          </dl>

          <a className="svc-card__cta" href={service.ctaHref}>
            <span className="svc-card__cta__label">{service.ctaLabel}</span>
            <span className="svc-card__cta__arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
