import type { CSSProperties } from "react";

import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

interface ArcCardsProps {
  section: ArcSectionOf<"cards">;
  index: number;
}

/**
 * ArcCards — numbered card grid (quiet plates on the void) + optional
 * tips strip and mono receipt/footnote lines. Absorbs the Shards card
 * species: stack cards (n/label/body), diagnosis cards, approach stages
 * (per-card receipt), Signal news cards (kicker/byline/href), and
 * studio-ad proof cards (image + metaRows).
 */
export function ArcCards({ section, index }: ArcCardsProps) {
  const cols = section.columns ?? Math.min(4, Math.max(2, section.cards.length));
  return (
    <section
      id={section.id}
      className="arc-section arc-sec"
      aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
    >
      <div className="arc-band">
        <ArcSectionHead head={section.head} kind="cards" index={index} sectionId={section.id} />
        <div className="arc-cards" style={{ "--arc-cols": cols } as CSSProperties}>
          {section.cards.map((card) => (
            <article key={card.id} className="arc-card-item arc-reveal">
              {card.n || card.kicker ? (
                <header className="arc-card-item__top">
                  {card.n ? <span className="arc-card-item__n">{card.n}</span> : null}
                  {card.kicker ? (
                    <span className="arc-card-item__kicker">{card.kicker}</span>
                  ) : null}
                </header>
              ) : null}
              {card.image ? (
                <span className="arc-card-item__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image.src} alt={card.image.alt} loading="lazy" decoding="async" />
                </span>
              ) : null}
              <h3 className="arc-card-item__title">
                {card.href ? (
                  <a href={card.href} target="_blank" rel="noreferrer">
                    {card.title}
                  </a>
                ) : (
                  card.title
                )}
              </h3>
              <p className="arc-card-item__body">{card.body}</p>
              {card.metaRows && card.metaRows.length > 0 ? (
                <dl className="arc-card-item__meta">
                  {card.metaRows.map((row) => (
                    <div key={row.label} className="arc-card-item__meta-row">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {card.receipt ? <p className="arc-card-item__receipt">{card.receipt}</p> : null}
              {card.byline ? <p className="arc-card-item__byline">{card.byline}</p> : null}
            </article>
          ))}
        </div>
        {section.tips && section.tips.length > 0 ? (
          <div className="arc-tips">
            {section.tips.map((tip) => (
              <div key={tip.id} className="arc-tips__row arc-reveal">
                <span className="arc-tips__tag">{tip.tag}</span>
                <p className="arc-tips__body">{tip.body}</p>
              </div>
            ))}
          </div>
        ) : null}
        {section.receipt ? <p className="arc-receipt arc-reveal">{section.receipt}</p> : null}
        {section.footnote ? <p className="arc-footnote arc-reveal">{section.footnote}</p> : null}
      </div>
    </section>
  );
}
