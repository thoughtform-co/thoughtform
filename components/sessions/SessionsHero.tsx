import type { SessionsPageModel } from "@/lib/sessions/page";
import {
  HERO_PHONE_MEDIA,
  HERO_PLATE_DARK,
  HERO_PLATE_DARK_FALLBACK,
  HERO_PLATE_DARK_PORTRAIT,
  HERO_PLATE_DARK_PORTRAIT_FALLBACK,
  HERO_PLATE_DARK_PORTRAIT_SIZE,
  HERO_PLATE_DARK_SIZE,
} from "@/lib/theme/heroPreload";

/**
 * The hero (ADR-150): the landing's own recipe — the `.hero__*` classes out
 * of landing.css, the Thought + Form plate, the boot, the glitch — with the
 * service's own copy and one live readout of the next morning.
 *
 * ⚠ THE `<picture>` IS ArcHero's, COPIED: the phone's portrait plate first
 * (the same media string the preload reads), AVIF over WebP, and
 * `loading="lazy"` on the dark `<img>` so the light theme — which
 * `display: none`s it and paints its own plate on `.hero__bg` (theme.css) —
 * never fetches the dark one.
 *
 * ⚠ `arc-hero` IS A HOOK, NOT A SKIN: it is the selector `useArcScroll`
 * writes `--hero-cover` and the curtain's visibility on. `arcs.css` is not
 * loaded on this route; the eyebrow and the gold emphasis are `hs-` rules.
 */
export function SessionsHero({ hero }: { hero: SessionsPageModel["hero"] }) {
  return (
    <section
      className="hero arc-hero hs-hero"
      id="hero"
      aria-label="Introduction"
      data-plate="gateway"
      data-hs-section="hero"
    >
      <div className="hero__bg" aria-hidden="true" data-parallax="0.03">
        <picture>
          <source
            media={HERO_PHONE_MEDIA}
            srcSet={HERO_PLATE_DARK_PORTRAIT}
            type="image/avif"
            width={HERO_PLATE_DARK_PORTRAIT_SIZE.width}
            height={HERO_PLATE_DARK_PORTRAIT_SIZE.height}
          />
          <source
            media={HERO_PHONE_MEDIA}
            srcSet={HERO_PLATE_DARK_PORTRAIT_FALLBACK}
            type="image/webp"
            width={HERO_PLATE_DARK_PORTRAIT_SIZE.width}
            height={HERO_PLATE_DARK_PORTRAIT_SIZE.height}
          />
          <source srcSet={HERO_PLATE_DARK} type="image/avif" />
          <img
            src={HERO_PLATE_DARK_FALLBACK}
            alt=""
            width={HERO_PLATE_DARK_SIZE.width}
            height={HERO_PLATE_DARK_SIZE.height}
            decoding="async"
            loading="lazy"
            fetchPriority="high"
          />
        </picture>
        <div className="hero__video__overlay" />
      </div>
      <div className="hero__content">
        <p className="hs-hero__eyebrow">{hero.eyebrow}</p>
        <h1 className="hero__headline">
          {hero.title.pre} <em>{hero.title.em}</em>
        </h1>
        <p className="hero__desc">{hero.lede}</p>
        <p className="hs-hero__readout" data-hs-readout>
          <span className="hs-hero__pip" aria-hidden="true" />
          {hero.readout}
        </p>
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
      </div>
    </section>
  );
}
