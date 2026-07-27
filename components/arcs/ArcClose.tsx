import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcTitleText, arcTitleText } from "./chrome";

/**
 * ArcClose — the closing CTA band and the page foot in one: centered
 * station-voice title, lede, the landing `.hero__cta__btn` actions, and
 * a mono footer line + signature over a dashed rule. The bottom-left
 * wordmark (HUD chrome) is the page's brand foot — no separate footer.
 */
export function ArcClose({ section }: { section: ArcSectionOf<"close"> }) {
  return (
    <section
      id={section.id}
      className="arc-section arc-close"
      aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
    >
      <div className="arc-band arc-close__band arc-reveal">
        <h2 className="arc-title arc-close__title">
          <ArcTitleText title={section.head.title} />
        </h2>
        {section.head.sub ? <p className="arc-close__sub">{section.head.sub}</p> : null}
        <div className="hero__cta arc-close__cta">
          {section.actions.map((action) => (
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
        {section.footerLine || section.signature ? (
          <div className="arc-close__foot">
            {section.footerLine ? <span>{section.footerLine}</span> : null}
            {section.signature ? <span className="arc-close__sig">{section.signature}</span> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
