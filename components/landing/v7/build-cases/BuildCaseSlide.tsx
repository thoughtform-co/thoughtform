"use client";

import { BuildCaseFrame } from "./BuildCaseFrame";
import { workflowLabel, type BuildCase } from "./buildCaseData";

interface BuildCaseSlideProps {
  study: BuildCase;
  index: number;
  /** Total slides in the section, drives the index counter. */
  total: number;
}

/**
 * A single editorial slide in the Build station. Alternates side per slide:
 *   - even index → copy left, frame right (variant a)
 *   - odd index  → frame left, copy right (variant b)
 *
 * Sparse readout — the screenshot is a clean plate with corner brackets,
 * head collapses to three lines (no boxed status pill), the workflow tag
 * is plain inline mono, capabilities are unbordered text, and the stack
 * is a single mono line ending with a quiet text-link CTA.
 */
export function BuildCaseSlide({ study, index, total }: BuildCaseSlideProps) {
  const variant: "a" | "b" = index % 2 === 0 ? "a" : "b";
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const statusLabel = study.status === "production" ? "● Production" : "◐ Work in progress";

  return (
    <article
      className={`build-case build-case--${study.id} build-case--${variant}`}
      data-build-case-index={index}
    >
      <header className="build-case__head">
        <div className="build-case__head__row">
          <span className="build-case__head__counter">{counter}</span>
          <span className="build-case__head__rule" aria-hidden="true" />
          <span className="build-case__head__domain">{study.domain}</span>
          <span className={`build-case__head__status build-case__head__status--${study.status}`}>
            {statusLabel}
          </span>
        </div>

        <div className="build-case__head__title">
          <h3 className="build-case__name">
            {study.name}
            <span aria-hidden="true">.</span>
          </h3>
          <p className="build-case__tagline">{study.tagline}</p>
        </div>

        <p className="build-case__subline">
          <em>{study.subline}</em>
        </p>
      </header>

      <BuildCaseFrame study={study} slideIndex={index} variant={variant} />

      <div className="build-case__body">
        <span className={`build-case__mode build-case__mode--${study.workflow}`}>
          ◇ {workflowLabel(study.workflow)}
        </span>
        <p className="build-case__body__text">{study.workflowBody}</p>

        <ul className="build-case__metrics" aria-label="Key metrics">
          {study.metrics.map((m) => (
            <li className="build-case__metric" key={m.label}>
              <span className="build-case__metric__v">{m.value}</span>
              <span className="build-case__metric__k">{m.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="build-case__caps" aria-label="Capabilities">
        {study.capabilities.map((cap) => (
          <li className="build-case__cap" key={cap.title}>
            <h4 className="build-case__cap__title">{cap.title}</h4>
            <p className="build-case__cap__body">{cap.body}</p>
          </li>
        ))}
      </ul>

      <footer className="build-case__foot">
        <p className="build-case__stack">
          <span className="build-case__stack__label">Built with</span>
          {study.stack.slice(0, 6).join(" · ")}
        </p>

        <a
          href={study.repoUrl}
          className="build-case__cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          View project detail
          <span className="build-case__cta__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </footer>
    </article>
  );
}
