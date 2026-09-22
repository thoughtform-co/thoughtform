import type { CSSProperties, Ref } from "react";

import { rackDate } from "@/lib/musings/cards";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingCover } from "./MusingCover";

/**
 * One post, as a card in the row (ADR-119, U2).
 *
 * The owner's reference for the CARD is the Cyberpunk 4ST store's centre
 * plate — "super clean and nice… with a thumbnail, a title, and a summary" —
 * and explicitly NOT its motion. So the order is the reference's: the picture
 * at the top, then the chrome line, then the name, then the sentence.
 *
 * ⚠ **A FLAT PANE, AND ONE OBJECT.** U1 gave each card a second plane — a
 * spine a quarter turn from the face — and he read the pair as a shelf he did
 * not want (U2: "I don't want a physical shelf … I don't want any
 * skeuomorphism"). The row tips whole cards about X; there is nothing to show
 * but the face.
 *
 * ⚠ **ONE NOTCH, TOP-RIGHT.** His corner every time — the proof card
 * (ADR-097), the proposal plates (ADR-098 U5) and the era stage's record cards
 * (ADR-082 U37). ⚠ **A CLIP CUTS A BORDER AND NEVER STROKES ONE**, so the edge
 * is a closed two-contour `evenodd` RING on `::before`; the inner leg is
 * `ch − 0.586px`.
 *
 * ⚠ **THE POSE IS WRITTEN BY THE WRITER, NOT RENDERED HERE.** `useMusingsScroll`
 * assigns `transform` and `zIndex` per frame off `rowMath`. This component
 * renders ONCE per post and never re-renders on scroll (ADR-002). The only
 * React-owned state is `isFront`, which changes at a DETENT.
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
      {/* The FACE. Every grouping property lives here and none on the pivot
          above: `overflow`, `clip-path`, `opacity` and `filter` each force
          `transform-style: flat` on the element that declares them (CSS
          Transforms 2 sec. 3). The face has no 3D children of its own, so it
          may carry all four; the pivot stays a transform and nothing else, so
          the card keeps its place in the row's one 3D context. */}
      <span className="mu-card__front">
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
      </span>
    </a>
  );
}
