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
 * The slide is intentionally low-chrome compared to the practice orbit —
 * it reads as a measured technical readout rather than a stage. All shape
 * grammar (corner brackets, hairlines, depth ladder) is inherited from the
 * v7 HUD vocabulary.
 */
export function BuildCaseSlide({ study, index, total }: BuildCaseSlideProps) {
  const variant: "a" | "b" = index % 2 === 0 ? "a" : "b";
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

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
            {study.status === "production" ? "● Production" : "◐ Work in progress"}
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
        {study.capabilities.map((cap, i) => (
          <li className="build-case__cap" key={cap.title}>
            <span className="build-case__cap__num" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h4 className="build-case__cap__title">{cap.title}</h4>
            <p className="build-case__cap__body">{cap.body}</p>
          </li>
        ))}
      </ul>

      <footer className="build-case__foot">
        <ul className="build-case__stack" aria-label="Stack">
          {study.stack.slice(0, 6).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <a
          href={study.repoUrl}
          className="build-case__cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          View project detail
          <span aria-hidden="true">→</span>
        </a>
      </footer>
    </article>
  );
}
