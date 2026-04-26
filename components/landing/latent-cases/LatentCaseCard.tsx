"use client";

import type { CSSProperties } from "react";
import type { LoopCaseStudy } from "./caseData";

interface LatentCaseCardProps {
  study: LoopCaseStudy;
  isActive: boolean;
  tabIndex?: number;
  style?: CSSProperties;
  className?: string;
}

const wfClass: Record<string, string> = {
  repair: "latent-case-card__hero-tag--repair",
  compress: "latent-case-card__hero-tag--compress",
  invent: "latent-case-card__hero-tag--invent",
};

const wfLabel: Record<string, string> = {
  repair: "Repair",
  compress: "Compress",
  invent: "Invent",
};

export function LatentCaseCard({
  study,
  isActive,
  tabIndex = 0,
  style,
  className = "",
}: LatentCaseCardProps) {
  return (
    <article
      className={`latent-case-card ${className}`.trim()}
      style={
        {
          ...style,
          ["--lc-accent" as string]: study.accentVar,
        } as CSSProperties
      }
      data-active={isActive ? "true" : "false"}
      tabIndex={isActive ? tabIndex : -1}
      aria-hidden={!isActive}
    >
      <header className="latent-case-card__strip">
        <span className="latent-case-card__idx">{study.index}</span>
        <span className="latent-case-card__eyebrow">{study.domainEyebrow}</span>
        <span
          className={`latent-case-card__status ${
            study.status === "production" ? "latent-case-card__status--prod" : ""
          }`}
        >
          {study.status === "production" ? "● Prod" : "◐ WIP"}
        </span>
      </header>

      <div className="latent-case-card__hero">
        <div className="latent-case-card__hero-grid" aria-hidden="true" />
        <div className="latent-case-card__hero-glyph" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className={`latent-case-card__hero-tag ${wfClass[study.workflowMode] ?? ""}`}>
          ◇ {wfLabel[study.workflowMode] ?? study.workflowMode}
        </span>
      </div>

      <div className="latent-case-card__body">
        <h2 className="latent-case-card__name">
          {study.name}
          <span aria-hidden="true">.</span>
        </h2>
        <div className="latent-case-card__tagline">{study.tagline}</div>
        <div className="latent-case-card__divider" aria-hidden="true" />
        <p className="latent-case-card__sub">{study.subline}</p>
      </div>

      <div className="latent-case-card__metrics">
        {study.metrics.map((m) => (
          <div key={m.label} className="latent-case-card__metric">
            <div className="latent-case-card__metric-v">{m.value}</div>
            <div className="latent-case-card__metric-k">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="latent-case-card__foot">
        <div className="latent-case-card__stack" aria-label="Stack">
          {study.stack.slice(0, 3).map((s) => (
            <span key={s}>{s}</span>
          ))}
          {study.stack.length > 3 && (
            <span className="latent-case-card__stack-more">+{study.stack.length - 3}</span>
          )}
        </div>
        <a
          className="latent-case-card__cta"
          href={study.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={isActive ? tabIndex : -1}
        >
          Open
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}
