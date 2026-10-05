import type { CSSProperties } from "react";

import type { ArcCardItem, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcCardsProps {
  section: ArcSectionOf<"cards">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcCards — numbered card grid (quiet plates on the void) + optional
 * tips strip and mono receipt/footnote lines. Absorbs the Shards card
 * species: stack cards (n/label/body), diagnosis cards, approach stages
 * (per-card receipt), Signal news cards (kicker/byline/href), and
 * studio-ad proof cards (image + metaRows).
 *
 * With `ledger` set (ADR-098 U2) the same cards render as the deck's fee
 * TABLE instead — see `ArcLedger`. The grid branch is byte-identical to
 * what shipped before the ledger existed.
 *
 * With `plates` set (ADR-143 U11) each card is the configuration board's lit
 * plate, opened up — see `ArcCardPlate`.
 *
 * Terminal rungs: cards rise from below in sequence, the tips strip
 * drifts in from the left as hairline chrome, and the receipt/footnote
 * land last — so on the fold they leave FIRST (the LIFO mirror).
 */
export function ArcCards({ section, index, motion = "reveal" }: ArcCardsProps) {
  const cols = section.columns ?? Math.min(4, Math.max(2, section.cards.length));
  return (
    <ArcBeat
      id={section.id}
      kind="cards"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="cards"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        {section.ledger ? (
          <ArcLedger section={section} columns={section.ledger.columns} motion={motion} />
        ) : (
          <>
            <div
              className={section.plates ? "arc-cards arc-cards--plates" : "arc-cards"}
              style={{ "--arc-cols": cols } as CSSProperties}
            >
              {section.cards.map((card, ci) => {
                if (section.plates) {
                  return (
                    <ArcCardPlate
                      key={card.id}
                      card={card}
                      tag={section.plates.tag}
                      index={ci}
                      motion={motion}
                    />
                  );
                }
                return (
                  <article
                    key={card.id}
                    className="arc-card-item arc-reveal"
                    {...rung(motion, ladder(0.16, 0.06, ci, 0.46), 0, 36)}
                  >
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
                        <img
                          src={card.image.src}
                          alt={card.image.alt}
                          loading="lazy"
                          decoding="async"
                        />
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
                );
              })}
            </div>
            {section.tips && section.tips.length > 0 ? (
              <div className="arc-tips">
                {section.tips.map((tip, ti) => (
                  <div
                    key={tip.id}
                    className="arc-tips__row arc-reveal"
                    {...rung(motion, ladder(0.44, 0.04, ti, 0.54), -28)}
                  >
                    <span className="arc-tips__tag">{tip.tag}</span>
                    <p className="arc-tips__body">{tip.body}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
        {section.receipt ? (
          <p className="arc-receipt arc-reveal" {...rung(motion, 0.5, 0, 22)}>
            {section.receipt}
          </p>
        ) : null}
        {section.footnote ? (
          <p className="arc-footnote arc-reveal" {...rung(motion, 0.56, 0, 22)}>
            {section.footnote}
          </p>
        ) : null}
      </div>
    </ArcBeat>
  );
}

/**
 * One of the two plates the team writes, opened up (ADR-143 U11): the
 * configuration board's lit plate (`ArcQuestions`, the `questions` kind) at
 * the size of a card. The same cut, wash, ring and tag, so the eye reads the
 * two as the board's two lit plates come forward; the part's NAME is promoted
 * to the heading (the board letters it as a 10px kicker, which on a card this
 * size read as too small), its question sits under it, then the answer and
 * the rows the plate holds.
 */
function ArcCardPlate({
  card,
  tag,
  index,
  motion,
}: {
  card: ArcCardItem;
  tag: string;
  index: number;
  motion: ArcMotion;
}) {
  const name = card.kicker ?? card.title;
  return (
    <article
      className="arc-plate arc-plate--pair arc-cplate arc-reveal"
      aria-label={name}
      data-cards-plate={card.id}
      {...rung(motion, ladder(0.16, 0.06, index, 0.46), 0, 36)}
    >
      <header className="arc-plate__head arc-cplate__head">
        <h3 className="arc-cplate__name">{name}</h3>
        <span className="arc-cplate__tag">{tag}</span>
        {card.kicker ? <p className="arc-cplate__question">{card.title}</p> : null}
      </header>
      <div className="arc-cplate__body">
        <p className="arc-cplate__answer">{card.body}</p>
        {card.metaRows && card.metaRows.length > 0 ? (
          <dl className="arc-cplate__rows">
            {card.metaRows.map((row) => (
              <div key={row.label} className="arc-cplate__row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </article>
  );
}

/**
 * ArcLedger (ADR-098 U2) — the deck's fee table. One row per card:
 * `kicker` is the phase, `body` what it buys, `title` the fee, under the
 * three authored head cells; the LAST card is the total row and takes the
 * plate ground. The tips sit BESIDE the table as bordered cards with a
 * gold left rule — the deck's own composition — rather than as the strip
 * the grid hangs beneath itself.
 *
 * ⚠ The total is positional, not flagged: the deck's own table ends on its
 * total and so does every ledger this renders. A fee table with no total
 * would be one row short of a table.
 */
function ArcLedger({
  section,
  columns,
  motion,
}: {
  section: ArcSectionOf<"cards">;
  columns: readonly [string, string, string];
  motion: ArcMotion;
}) {
  const last = section.cards.length - 1;
  return (
    <div className="arc-ledger">
      <table className="arc-ledger__table arc-reveal" {...rung(motion, 0.16, 0, 36)}>
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th key={column} scope="col" className={i === 2 ? "arc-ledger__fee" : undefined}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.cards.map((card, ci) => (
            <tr key={card.id} className={ci === last ? "arc-ledger__total" : undefined}>
              <th scope="row" className="arc-ledger__phase">
                {card.kicker ?? card.n}
              </th>
              <td className="arc-ledger__what">{card.body}</td>
              <td className="arc-ledger__fee">{card.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {section.tips && section.tips.length > 0 ? (
        <div className="arc-ledger__tips">
          {section.tips.map((tip, ti) => (
            <div
              key={tip.id}
              className="arc-ledger__tip arc-reveal"
              {...rung(motion, ladder(0.3, 0.06, ti, 0.5), 28)}
            >
              <span className="arc-ledger__tip-tag">{tip.tag}</span>
              <p className="arc-ledger__tip-body">{tip.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
