"use client";

interface HeroContentProps {
  tHeroToDef: number;
  tDefToManifesto: number;
}

/**
 * Hero overlay rendered inside the bridge-frame during the hero phase.
 *
 * Follows the Thoughtform design doctrine for the .co variant: *editorial,
 * sparse, atmospheric*. No boxed frame — copy anchors to the lower-left
 * quadrant and lets the gateway portal + rails do the visual framing.
 *
 * Hierarchy (per frontend-design skill):
 *   eyebrow (mono, dawn-50, diamond marker)
 *   tagline (sans-serif, dawn, gold italic emphasis on one phrase)
 *   ghost CTA (gold border, not filled — gold is wayfinding, not UI)
 *   readout strip (mono, thin divider above)
 *
 * Fades out as scroll advances the bridge-frame from hero → definition so
 * the existing morph flow stays intact.
 */
export function HeroContent({ tHeroToDef, tDefToManifesto }: HeroContentProps) {
  const fade = Math.max(0, 1 - tHeroToDef / 0.4) * (1 - tDefToManifesto);
  if (fade <= 0) return null;

  return (
    <div className="hero-v2" style={{ opacity: fade }} aria-hidden={fade < 0.5}>
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
