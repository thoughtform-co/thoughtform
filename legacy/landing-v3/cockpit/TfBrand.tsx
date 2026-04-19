"use client";

/**
 * Thoughtform brand block — shown in the bridge-frame during the definition
 * phase. Mirrors v5 Clean Bridge section-2 left column:
 *
 *   ◆ THOUGHTFORM
 *   / θɔːtfɔːrm · THAWT-form /
 *
 *   We teach teams to work with AI the way it actually works —
 *   then help them encode it and build with it.
 *
 *   AI isn't software to install. It's a strange intelligence to navigate.
 *   The teams who thrive learn to work with it instead of fighting it.
 *
 *   [ See the thesis → ]   [ Services ]
 *
 * Parent controls opacity + pointer-events via the surrounding phase wrapper.
 */
export function TfBrand() {
  return (
    <div className="tf-brand">
      <div className="tf-brand__meta">
        <span className="tf-brand__label">
          <span className="tf-brand__diamond" aria-hidden="true" />
          Thoughtform
        </span>
        <span className="tf-brand__phonetic">/ θɔːtfɔːrm · THAWT-form /</span>
      </div>

      <h2 className="tf-brand__headline">
        We teach teams to work with AI <em>the way it actually works</em> — then help them encode it
        and build with it.
      </h2>

      <p className="tf-brand__body">
        AI isn&apos;t software to install. It&apos;s a strange intelligence to navigate. The teams
        who thrive learn to work with it instead of fighting it.
      </p>

      <div className="tf-brand__cta">
        <a href="#continuum" className="tf-brand__btn tf-brand__btn--primary">
          See the thesis
          <span className="tf-brand__btn-arrow" aria-hidden="true" />
        </a>
        <a href="#services" className="tf-brand__btn tf-brand__btn--ghost">
          Services
        </a>
      </div>
    </div>
  );
}
