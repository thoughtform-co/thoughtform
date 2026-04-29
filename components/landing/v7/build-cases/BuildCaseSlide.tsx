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
 * One Build slide in the v7 landing. The composition is fixed (no a/b
 * alternation): a large title column on the LEFT and a vertical
 * information card on the RIGHT.
 *
 * The orientation intentionally mirrors the Practice section, whose
 * `.approach__chamber` puts the sticky orbit on the left and the phase
 * copy on the right. By inverting that here, Build and Practice rhyme
 * by mirror rather than by repeat.
 *
 * The right-hand card stacks: hero plate (corner brackets) → Overview →
 * Mode → Stack → "View project detail" link. Metrics and capabilities
 * are kept in `buildCaseData.ts` for a future detail page but are
 * intentionally not rendered on the landing slide ("more concise" per
 * the redesign brief).
 */
export function BuildCaseSlide({ study, index, total }: BuildCaseSlideProps) {
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const statusLabel = study.status === "production" ? "● Production" : "◐ Work in progress";

  return (
    <article className={`build-case build-case--${study.id}`} data-build-case-index={index}>
      <header className="build-case__title">
        <div className="build-case__title__row">
          <span className="build-case__title__counter">{counter}</span>
          <span className="build-case__title__rule" aria-hidden="true" />
          <span className="build-case__title__domain">{study.domain}</span>
          <span className="build-case__title__tail" aria-hidden="true" />
        </div>

        <h3 className="build-case__name">
          {study.name}
          <span aria-hidden="true">.</span>
        </h3>

        <p className="build-case__tagline">{study.tagline}</p>

        <p className="build-case__subline">
          <em>{study.subline}</em>
        </p>

        <p className={`build-case__status build-case__status--${study.status}`}>{statusLabel}</p>
      </header>

      <div className="build-case__bridge" aria-hidden="true">
        <span className="build-case__bridge__diamond" />
      </div>

      <div className="build-case__card">
        <BuildCaseFrame study={study} slideIndex={index} />

        <dl className="build-case__card__rows">
          <div className="build-case__card__row">
            <dt className="build-case__card__label">Overview</dt>
            <dd className="build-case__card__value">{study.workflowBody}</dd>
          </div>

          <div className="build-case__card__row">
            <dt className="build-case__card__label">Mode</dt>
            <dd
              className={`build-case__card__value build-case__card__value--mode build-case__card__value--mode-${study.workflow}`}
            >
              ◇ {workflowLabel(study.workflow)}
            </dd>
          </div>

          <div className="build-case__card__row">
            <dt className="build-case__card__label">Stack</dt>
            <dd className="build-case__card__value build-case__card__value--stack">
              {study.stack.slice(0, 6).join(" · ")}
            </dd>
          </div>
        </dl>

        <a
          href={study.repoUrl}
          className="build-case__card__cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          View project detail
          <span className="build-case__card__cta__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>
    </article>
  );
}
