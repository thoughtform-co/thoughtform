import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcSignalProps {
  section: ArcSectionOf<"signal">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcSignal — what the market is paying for (ADR-136): the Moira workshop's
 * clippings, ported by hand. Two columns in the board's order — the context,
 * then the evaluations — and two dated clippings under each, so it reads in
 * one glance.
 *
 * ⚠ A CARD IS A CLIPPING. A panel with the name set as a wordmark and the
 * figure in its corner, then the headline, a dek with its figures in weight,
 * and where and when it was published. The whole card links to its source.
 * It is the house plate (`.arc-plate`), so it takes the cut corner and the
 * ring; no logo files, no italic.
 *
 * ⚠ THE FIGURES ARE THE RECORD'S. A clipping is a dated row, so its corner,
 * kicker, title, dek and date may carry digits; the column heads and the
 * card's mark and tag may not (the registry pins the split).
 *
 * ⚠ SERVER, NO STATE. `data-signal-*` only; the cards open in a new tab.
 */
export function ArcSignal({ section, index, motion = "reveal" }: ArcSignalProps) {
  const { columns, caption } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="signal"
      className="arc-section arc-sec arc-sec--signal"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="signal"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-signal" data-signal-figure="">
          <div className="arc-signal__cols">
            {columns.map((col, ci) => (
              <div key={col.id} className="arc-signal__col" data-signal-plate={col.plate}>
                <header className="arc-signal__head arc-reveal" {...rung(motion, 0.14 + ci * 0.04)}>
                  <span className="arc-signal__label">{col.label}</span>
                  <span className="arc-signal__line">{col.line}</span>
                </header>
                <ol className="arc-signal__cards">
                  {col.cards.map((c, i) => (
                    <li
                      key={c.id}
                      className="arc-plate arc-signal__card arc-reveal"
                      data-signal-card={c.id}
                      {...rung(motion, ladder(0.2 + ci * 0.04, 0.08, i, 0.5), 0, 24)}
                    >
                      <a
                        className="arc-signal__link"
                        href={c.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="arc-signal__thumb" aria-hidden="true">
                          <span className="arc-signal__mark">{c.mark}</span>
                          <span className="arc-signal__corner">{c.corner}</span>
                          <span className="arc-signal__tag">{c.tag}</span>
                        </span>
                        <span className="arc-signal__body">
                          <span className="arc-signal__kicker">{c.kicker}</span>
                          <span className="arc-signal__title">{c.title}</span>
                          <span className="arc-signal__dek">
                            {c.dek.map((p, pi) =>
                              p.strong ? (
                                <strong key={pi}>{p.text}</strong>
                              ) : (
                                <span key={pi}>{p.text}</span>
                              )
                            )}
                          </span>
                          <span className="arc-signal__byline">
                            <span className="arc-signal__source">{c.source}</span>
                            <span className="arc-signal__date">{c.date}</span>
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <figcaption className="arc-signal__caption arc-reveal" {...rung(motion, 0.42)}>
            {caption}
          </figcaption>
        </figure>
      </div>
    </ArcBeat>
  );
}
