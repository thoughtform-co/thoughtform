import type { ArcDef } from "@/lib/arcs/types";

import { ArcTitleText } from "./chrome";

/**
 * ArcHero — the landing hero recipe on an arc detail page. Reuses the
 * production `.hero__*` classes verbatim (landing.css): full-viewport
 * departing curtain, static photo background with `data-parallax`
 * drift, left-anchored copy that dissolves on `--hero-cover`. The card
 * itself never fades or transforms (ADR-008 — it is the opaque curtain
 * over the fixed backdrop); only `.hero__content` moves.
 *
 * ADR-075 finished the port: the plate is declared (`hero.plate`), the
 * copy BOOTS like the landing's (`useHeroBoot`, mounted by `ArcShell`),
 * and the curtain has its seam — the first beat is held still while this
 * card scrolls off it (`data-arc-entry`, `useArcScroll` + arcs.css).
 * The hero stays in FLOW to get that: a sticky card would freeze its own
 * `--py` drift and desync nothing else in exchange.
 */
export function ArcHero({ hero }: { hero: ArcDef["hero"] }) {
  const gateway = hero.plate === "gateway";
  return (
    <section
      className="hero arc-hero"
      id="hero"
      aria-label="Introduction"
      /* ⚠ THE LIGHT PLATE IS A GLOBAL RULE ON `.hero__bg` (theme.css) —
         it paints `Gateway_v2-light.webp` and hides the `<img>` for ANY
         hero on the site. Until ADR-075 an arc therefore showed its own
         key visual in dark and the LANDING's in light, with nothing
         saying so. A hero that owns its plate declares it here and
         arcs.css hands the image back in light. */
      data-plate={gateway ? "gateway" : "own"}
    >
      <div className="hero__bg" aria-hidden="true" data-parallax="0.03">
        {gateway ? (
          /* The landing's own delivery, verbatim (ADR-058 U2): AVIF over
             WebP in dark, `loading="lazy"` so the light theme — which
             `display: none`s this img — never fetches the dark plate. */
          <picture>
            <source srcSet="/images/Gateway_v1b.avif" type="image/avif" />
            <img
              src={hero.image.src}
              alt=""
              width={hero.image.width}
              height={hero.image.height}
              decoding="async"
              loading="lazy"
              fetchPriority="high"
            />
          </picture>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={hero.image.src}
            alt=""
            width={hero.image.width}
            height={hero.image.height}
            decoding="async"
          />
        )}
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
