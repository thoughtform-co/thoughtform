import { rackDate } from "@/lib/musings/cards";
import type { MusingCardData } from "@/lib/musings/types";

import { MusingCover } from "./MusingCover";

/**
 * One post, as a card in the row (ADR-121).
 *
 * The owner's reference for the CARD is the Cyberpunk 4ST store's centre
 * plate — "super clean and nice… with a thumbnail, a title, and a summary" —
 * so the order is the reference's: the picture at the top, then the chrome
 * line, then the name, then the sentence. The MECHANIC is Lighthouse HQ's
 * customer row (owner, 2026-09-23: "cards collapse open when you hover over
 * them … repurpose them and make them fit for our design language"): the card
 * under the pointer takes the row's free width and the rest collapse to
 * strips. That mechanic lives entirely in the sheet — `flex-grow` on
 * `data-mu-open` — and in the writer, which moves the attribute.
 *
 * ⚠ **`data-mu-open` IS RENDERED ON THE NEWEST POST, AND MOVED BY THE
 * WRITER.** The owner's rest state: the newest post is open, no timer. React
 * renders it on index 0 so a page with no script, a reduced-motion reader and
 * the server render all show the finished row; `useMusingsScroll` moves the
 * attribute on `pointerover` / `focusin` and puts it back on `pointerleave` —
 * one attribute write on an event, never React state (ADR-002). ⚠ React does
 * not touch a DOM attribute whose prop has not changed, so the writer's move
 * survives every re-render this component will ever see.
 *
 * ⚠ **EVERY CARD IS A REAL LINK AND EVERY CARD IS FOCUSABLE.** ADR-119's rack
 * gave cards 1..n `tabIndex={-1}` + `aria-hidden` so four invisible 3D planes
 * would not sit in the tab order — and on every parked rung the rail showed
 * those cards while hiding them from the keyboard, which was an a11y bug from
 * the first commit. There is nothing invisible in a flex row: focus opens a
 * card exactly as hover does, and a click on a strip navigates.
 *
 * ⚠ **ONE NOTCH, TOP-RIGHT.** His corner every time — the proof card
 * (ADR-097), the proposal plates (ADR-098 U5) and the era stage's record cards
 * (ADR-082 U37). ⚠ **A CLIP CUTS A BORDER AND NEVER STROKES ONE**, so the edge
 * is a closed two-contour `evenodd` RING on the face's `::before`; the inner
 * leg is `ch − 0.586px`.
 *
 * ⚠ **THE FACE IS STILL A SEPARATE SPAN.** The aperture (ADR-119 U1 §4, the
 * house's one pair of numbers) animates the face's `clip-path`, the glass and
 * the ring live on it, and the card itself is the flex item whose `flex-grow`
 * transitions — two elements, two jobs, and the animation never fights the
 * transition on one box.
 */
export function MusingCard({ post, index }: { post: MusingCardData; index: number }) {
  return (
    <a
      className="mu-card"
      href={`/musings/${post.slug}`}
      data-mu-open={index === 0 ? "" : undefined}
    >
      <span className="mu-card__front">
        <MusingCover slug={post.slug} date={post.date} tags={post.tags} />

        {/* ⚠ THE BODY IS LAID OUT AT THE OPEN WIDTH ON EVERY CARD (the sheet's
            `--mu-open-w`), and the face's overflow clips it while the card is
            a strip — so the text never reflows during the grow, it is
            UNCOVERED by the sweep. The strips show the head of each line, which
            is the reference's own read. */}
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
