import type { CSSProperties, Ref } from "react";

import { rackDate } from "@/lib/musings/cards";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingCover } from "./MusingCover";

/**
 * One post, as a card in the rack (ADR-119).
 *
 * The owner's reference for the CARD is the Cyberpunk 4ST store's centre
 * plate — "super clean and nice… with a thumbnail, a title, and a summary" —
 * and explicitly NOT its motion. So the order is the reference's: the picture
 * at the top, then the chrome line, then the name, then the sentence.
 *
 * ⚠ **ONE NOTCH, TOP-RIGHT.** His corner every time — the proof card
 * (ADR-097), the proposal plates (ADR-098 U5, where the bottom-left cut was
 * taken back out because it bit the line the reader was on) and the era
 * stage's record cards (ADR-082 U37). ⚠ **A CLIP CUTS A BORDER AND NEVER
 * STROKES ONE**, so the edge is a closed two-contour `evenodd` RING on
 * `::before` and the card itself is unclipped; the inner leg is
 * `ch − 0.586px`, because insetting a 45° cut by `d` shortens its leg by
 * `d(2 − √2)`.
 *
 * ⚠ **THE POSE IS WRITTEN BY THE WRITER, NOT RENDERED HERE.** `useMusingsScroll`
 * assigns `transform` / `opacity` / `filter` / `zIndex` per frame off
 * `rackMath`. This component renders ONCE per post and never re-renders on
 * scroll (ADR-002; the archived drawing this rack is lifted from called
 * `setState` in a rAF, which is a React re-render per frame across every
 * card). The only React-owned state is `isFront`, which changes at a DETENT —
 * a handful of times across the whole station.
 */
export function MusingCard({
  post,
  index,
  isFront,
  cardRef,
}: {
  post: MusingCardData;
  index: number;
  isFront: boolean;
  cardRef: Ref<HTMLAnchorElement>;
}) {
  return (
    <a
      ref={cardRef}
      className="mu-card"
      href={`/musings/${post.slug}`}
      data-mu-card={index}
      data-mu-front={isFront ? "" : undefined}
      /* Only the card in view is reachable, and only it takes a pointer:
         a rack of five overlapping 3D planes would otherwise put four
         invisible link targets over the one the reader can see. */
      tabIndex={isFront ? 0 : -1}
      aria-hidden={isFront ? undefined : true}
      style={{ "--mu-i": index } as CSSProperties}
    >
      <MusingCover slug={post.slug} date={post.date} tags={post.tags} />

      <span className="mu-card__body">
        <span className="mu-card__kicker">
          {rackDate(post.date)}
          <span className="mu-card__dot" aria-hidden="true">
            ·
          </span>
          {post.readingMinutes} min
        </span>
        <span className="mu-card__title">{post.title}</span>
        <span className="mu-card__lede">{post.summary}</span>
      </span>
    </a>
  );
}
