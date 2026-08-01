import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcDecodeTitle, ArcTypeCopy } from "./ArcDecodeText";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

/**
 * ArcClose — the closing CTA band and the page foot in one: centered
 * station-voice title, lede, the landing `.hero__cta__btn` actions, and
 * a mono footer line + signature over a dashed rule. The bottom-left
 * wordmark (HUD chrome) is the page's brand foot — no separate footer.
 *
 * Terminal: this beat NEVER pins (see `alwaysFlow`) — there is nothing
 * after it to hand off to, and a fold with nothing behind it reads as
 * the page eating itself. It keeps the arrival ladder and the decode.
 */
export function ArcClose({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"close">;
  motion?: ArcMotion;
}) {
  return (
    <ArcBeat
      id={section.id}
      kind="close"
      className="arc-section arc-close"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div
        className="arc-band arc-close__band arc-reveal"
        {...(motion === "terminal" ? { "data-arc-still": "" } : {})}
      >
        <ArcDecodeTitle
          title={section.head.title}
          motion={motion}
          className="arc-title arc-close__title"
        />
        {section.head.sub ? (
          <ArcTypeCopy text={section.head.sub} motion={motion} className="arc-close__sub" />
        ) : null}
        <div className="hero__cta arc-close__cta" {...rung(motion, 0.3, 0, 26)}>
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
          <div className="arc-close__foot" {...rung(motion, 0.48, 0, 18)}>
            {section.footerLine ? <span>{section.footerLine}</span> : null}
            {section.signature ? <span className="arc-close__sig">{section.signature}</span> : null}
          </div>
        ) : null}
      </div>
    </ArcBeat>
  );
}
