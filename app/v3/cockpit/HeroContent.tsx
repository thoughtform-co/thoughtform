"use client";

/**
 * Hero block — Origin · 01 eyebrow + tagline + ghost CTA + readouts.
 *
 * Renders inside the bridge-frame at the bottom-left during the hero phase.
 * The parent controls visibility (opacity + pointer-events) via a wrapper —
 * HeroContent is now pure layout with no fade logic of its own.
 */
export function HeroContent() {
  return (
    <div className="hero-v2">
      <div className="hero-v2__eyebrow">
        <span className="hero-v2__eyebrow-diamond" aria-hidden="true" />
        <span className="hero-v2__eyebrow-label">Origin</span>
        <span className="hero-v2__eyebrow-sep">·</span>
        <span className="hero-v2__eyebrow-index">01</span>
      </div>

      <h1 className="hero-v2__tagline">
        The interface for navigating
        <br />
        <em>human–AI collaboration.</em>
      </h1>

      <div className="hero-v2__cta">
        <a href="#services" className="hero-v2__btn">
          Begin navigation
          <span className="hero-v2__btn-arrow" aria-hidden="true" />
        </a>
      </div>

      <div className="hero-v2__meta">
        <div className="hero-v2__readout">
          <span className="hero-v2__readout-l">Phonetic</span>
          <span className="hero-v2__readout-v">θɔːtfɔːrm</span>
        </div>
        <div className="hero-v2__readout">
          <span className="hero-v2__readout-l">Build</span>
          <span className="hero-v2__readout-v">2026.04 · v3</span>
        </div>
      </div>
    </div>
  );
}
