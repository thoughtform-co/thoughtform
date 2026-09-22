"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

import {
  eraMediaKindLabel,
  eraMediaStill,
  type CharacterEraMedia,
} from "@/lib/voidwalker/characterEras";

/**
 * EraMediaStack — the TRANSMISSION seat's pile of glass folder cards
 * (ADR-082 U31, owner 2026-09-21).
 *
 *   "there may be cases where I have multiple videos, and I want them to be
 *    stacked a bit … The video needs to live inside a card, including the
 *    title … the cards need to be stacked … the sort of glass effect like we
 *    have in the services section when all the cards collapse … it's not just
 *    videos. It can support every type of asset, image or video."
 *
 * One CARD per asset, every card the same object: a folder — a tab, a 45°
 * slant, a square body — cut from one silhouette, glass clipped to it, a gold
 * lip drawn as a closed ring. The FRONT card carries the asset's frame and its
 * title INSIDE the body (his own worry about a title in the notch: "if the
 * title is too long, that may not work" — so the tab letters a DESIGNATION,
 * which is always short, and the title wraps where there is room for it).
 * The cards behind it are empty folders.
 *
 * ⚠ EVERY FOLDER IS THE SAME FOLDER (ADR-082 U34, owner 2026-09-22: "every
 * folder looks the same. The notch is the same in every structure … stack it
 * from a different vantage point"). U31 fanned the tabs along one top edge —
 * a wide `FILM 01` in front, narrow index tabs behind it — so a count showed
 * and the cards stopped reading as files. Now every tab letters the same
 * thing in the same place (`■ KIND NN`, flush at its own card's top-left), and
 * the PILE shows the depth: each card behind stands one tab height up and a
 * step to the left, so its tab reads whole above the card in front of it.
 * What says "this one is open" is that it is in front, and its mark is lit.
 * Picking a card rotates the pile.
 *
 * ⚠ A BACK CARD RENDERS NO BODY. The front card is glass, so whatever a card
 * behind it paints shows through the padding round the frame and under the
 * title as a smear one step up and to the right. The proof stack learned this
 * first ("the front glass looks onto an empty folder", ADR-097).
 *
 * ⚠ CONTROLLED. `front` lives in `HoloDatumPanels`, derived from `{era, i}`,
 * so a scroll-scrubbed era change resets the pile with no effect and no
 * second writer; this component holds no state at all.
 *
 * ⚠ EVERY TAB STAYS A `<button>` IN EVERY STATE, the front one included
 * (`aria-pressed`, the phone view switch's own idiom one row up). Turning the
 * chosen tab into a label would unmount the element that holds focus at the
 * moment it is pressed, and focus would fall to `<body>`.
 *
 * ⚠ NO `<video>` AND NO `<iframe>` ARE MOUNTED HERE, EVER — the casefile's
 * poster-first law. A card frames a STILL (`eraMediaStill`); the player is
 * built inside `MediaLightbox`, after a click, by the caller.
 */

export interface EraMediaStackProps {
  items: readonly CharacterEraMedia[];
  /** Index of the card at the front of the pile. Out of range falls to 0. */
  front: number;
  onFront: (index: number) => void;
  /** The front card's frame was pressed; `trigger` is where focus returns. */
  onOpen: (trigger: HTMLElement) => void;
  idPrefix: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The cue in the frame's square well: a play triangle for a film, four corner
 * ticks for a still. Rect- and polygon-only on a 7×7 lattice, the station's
 * own glyph grammar (`FigureGlyph`, `PressArrow`, `EraMarkSvg`).
 * ⚠ SQUARE, NOT ROUND. There are no circles on this station but the reticle,
 * and the filled diamond one row down means "you are here".
 */
function MediaCue({ kind }: { kind: CharacterEraMedia["kind"] }) {
  return (
    <span className="vwd__mcard__cue" aria-hidden="true">
      <svg viewBox="0 0 7 7" width="14" height="14" focusable="false">
        {kind === "image" ? (
          <>
            <path d="M0 0h3v1H1v2H0z" />
            <path d="M7 0H4v1h2v2h1z" />
            <path d="M0 7h3V6H1V4H0z" />
            <path d="M7 7H4V6h2V4h1z" />
          </>
        ) : (
          <path d="M2 1l4 2.5L2 6z" />
        )}
      </svg>
    </span>
  );
}

export function EraMediaStack({ items, front, onFront, onOpen, idPrefix }: EraMediaStackProps) {
  const count = items.length;
  if (count === 0) return null;
  const frontIndex = front >= 0 && front < count ? front : 0;
  /* ⚠ THE INDEX LETTERS ONLY WHERE THERE IS A PILE. `FILM 01` on the only card
     an era holds is an ordinal with nothing to order — and the count itself is
     never lettered at all: the tabs stacked above the front one ARE the count,
     so `01/03` would be the surface saying it twice. */
  const piled = count > 1;

  return (
    <div
      className="vwd__mstack"
      role="group"
      aria-label={piled ? `Transmissions, ${count} on record` : "Transmission"}
      data-vwd-media-count={count}
      style={{ "--vwd-mn": count } as CSSProperties}
    >
      {items.map((item, i) => {
        /* How many cards stand in front of this one. Cyclic, so choosing a
           card ROTATES the pile instead of pulling one folder out of it. */
        const depth = (i - frontIndex + count) % count;
        const isFront = depth === 0;
        const kind = eraMediaKindLabel(item);
        const bodyId = `${idPrefix}-media-${i}`;
        const focus = item.focus ?? [0.5, 0.5];

        return (
          <div
            key={`${item.kind}-${i}`}
            className="vwd__mcard"
            data-vwd-media-depth={depth}
            data-vwd-media-kind={item.kind}
            style={{ "--vwd-md": depth } as CSSProperties}
          >
            <button
              type="button"
              className="vwd__mcard__tab"
              aria-pressed={isFront}
              aria-controls={isFront ? bodyId : undefined}
              aria-label={`${kind} ${i + 1} of ${count}: ${item.title}`}
              onClick={() => {
                if (!isFront) onFront(i);
              }}
            >
              {/* One notch, one lettering, on every card: only the mark's state
                  (lit on the open folder) says which one is in front. */}
              <span className="vwd__mcard__mark" aria-hidden="true" />
              <span className="vwd__mcard__kind">{kind}</span>
              {piled ? <span className="vwd__mcard__idx">{pad2(i + 1)}</span> : null}
            </button>

            {isFront ? (
              <div className="vwd__mcard__body" id={bodyId}>
                {/* The title LEADS the frame (owner, 2026-09-21, ADR-082 U32):
                    a name read before the picture it names, in the station's
                    capitals face. */}
                <p className="vwd__mcard__title">{item.title}</p>
                <button
                  type="button"
                  className="vwd__mcard__frame"
                  aria-haspopup="dialog"
                  aria-label={`${item.kind === "image" ? "View" : "Play"}: ${item.title}`}
                  onClick={(e) => onOpen(e.currentTarget)}
                >
                  {/* Keyed on the still so a rotation decodes the new plate
                      rather than repainting the old one under a new src (the
                      casefile's films plate, same reason). `fill` + `cover`:
                      the card shows a WINDOW; the whole asset is the dialog's.
                      ⚠ `unoptimized` (ADR-082 U35): a rotated card's still is a
                      fresh request, and one stuck optimizer job (one file, one
                      width, one format) left it BLACK for good with nothing
                      erroring — the owner's "some of them don't have a
                      thumbnail". The posters are already 960×540 and pinned
                      under 120 KB, so there is nothing to optimise; served
                      straight from /public, a card cannot wait on a job. */}
                  <Image
                    key={eraMediaStill(item)}
                    className="vwd__mcard__still"
                    src={eraMediaStill(item)}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 700px) 100vw, 368px"
                    style={{ objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%` }}
                  />
                  <MediaCue kind={item.kind} />
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
