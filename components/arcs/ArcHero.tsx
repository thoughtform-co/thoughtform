import type { ArcDef } from "@/lib/arcs/types";

import { ArcTitleText } from "./chrome";

/**
 * ArcHero — the landing hero recipe on an arc detail page. Reuses the
 * production `.hero__*` classes verbatim (landing.css): full-viewport
 * departing curtain, static photo background with `data-parallax`
 * drift, left-anchored copy that dissolves on `--hero-cover`. The card
 * itself never fades or transforms (ADR-008 — it is the opaque curtain
 * over the fixed backdrop); only `.hero__content` moves.
 */
export function ArcHero({ hero }: { hero: ArcDef["hero"] }) {
  return (
    <section className="hero arc-hero" id="hero" aria-label="Introduction">
      <div className="hero__bg" aria-hidden="true" data-parallax="0.03">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.image.src}
          alt=""
          width={hero.image.width}
          height={hero.image.height}
          decoding="async"
        />
        <div className="hero__video__overlay" />
      </div>
      <div className="hero__content">
        {hero.eyebrow ? <p className="arc-hero__eyebrow">{hero.eyebrow}</p> : null}
        <h1 className="hero__headline">
          <ArcTitleText title={hero.title} />
        </h1>
        <p className="hero__desc">{hero.lede}</p>
        {hero.actions && hero.actions.length > 0 ? (
          <div className="hero__cta">
            {hero.actions.map((action) => (
              <a
                key={action.id}
                className={`hero__cta__btn ${
                  action.primary ? "hero__cta__btn--primary" : "hero__cta__btn--ghost"
                }`}
                href={action.href}
              >
                {action.label}
                <span className="hero__cta__arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
