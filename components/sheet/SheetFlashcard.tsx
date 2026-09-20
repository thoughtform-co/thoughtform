import Link from "next/link";
import type { CSSProperties } from "react";

import type { SheetFlashcard as SheetFlashcardDef } from "@/lib/sheet/types";

import { dataAttrs } from "./SheetCells";

/**
 * The flashcard (ADR-114): the services-card composition in DOM — kicker
 * and title at the TOP, the figure in the MIDDLE, the paragraph at the
 * BOTTOM — on the proof card's chamfered housing with its gold lip. Three
 * registers (claim · field · chrome) and no fourth; the photograph is taken
 * into the duotone and a dot veil resolves it on hover. The whole card is
 * one link.
 */
export function SheetFlashcard({ card }: { card: SheetFlashcardDef }) {
  const fig = card.figure;
  return (
    <Link
      href={card.href}
      className="sh-card"
      aria-label={`${card.kicker}: ${card.title}`}
      {...dataAttrs(card.data)}
    >
      <span className="sh-card__head">
        <span className="sh-card__kicker">{card.kicker}</span>
        <span className="sh-card__title">{card.title}</span>
      </span>
      <span className="sh-card__fig" aria-hidden="true">
        {fig.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={`sh-card__img${fig.treatment === "plain" ? "" : " sh-fig--duotone"}`}
            src={fig.src}
            alt=""
            width={fig.width}
            height={fig.height}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="sh-fig__mark" style={{ "--seed": fig.seed ?? 0 } as CSSProperties} />
        )}
        <span className="sh-card__veil" />
      </span>
      <span className="sh-card__body">
        <span className="sh-card__p">{card.body}</span>
      </span>
    </Link>
  );
}
