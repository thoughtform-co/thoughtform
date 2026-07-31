import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { CaseFilm } from "@/lib/cases/types";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";

/**
 * FilmsPlate — the above-the-line films as poster tiles, playing in a
 * lightbox.
 *
 * WHY A LIGHTBOX AND NOT INLINE (owner, 2026-07-30). The plate rect is a
 * fixed, short band off the HUD rail (~690 x 240 at 1440x800), so two 16:9
 * films side by side land at ~310px wide. That is a thumbnail, not a film —
 * and the height constraint was also fighting the tile's own aspect ratio and
 * cropping the poster. The tiles are uncropped 16:9 posters now and the film
 * opens over the page at its true shape.
 *
 * NO `<video>` UNTIL A CLICK. The tile is a `next/image` poster, so a row
 * nobody opens costs zero video bytes and zero compositor layers (the beat's
 * layer budget was counted at ~14 in ADR-056 Update 4). The element is created
 * by the lightbox, already playing, and destroyed with it.
 *
 * The overlay itself lives in `MediaLightbox` — shared with the tool gallery,
 * because its portal / scroll-lock / focus-restore behaviours each took a
 * measurement to get right and a second copy would drift from them.
 */
export function FilmsPlate({ films }: { films: readonly CaseFilm[] }) {
  const [openSrc, setOpenSrc] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = films.find((f) => f.src === openSrc) ?? null;

  const close = useCallback(() => {
    setOpenSrc(null);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    restoreFocusAfterUnmount(target);
  }, []);

  useCloseOnCasefileFold(rootRef, open !== null, close);

  return (
    <div className="fl-plate fl-plate--films" ref={rootRef}>
      <ul className="fl-films">
        {films.map((film) => (
          <li className="fl-filmcell" key={film.src}>
            <button
              type="button"
              className="fl-film"
              aria-haspopup="dialog"
              aria-label={`Play ${film.label}`}
              onClick={(e) => {
                returnFocusRef.current = e.currentTarget;
                setOpenSrc(film.src);
              }}
            >
              <Image
                className="fl-film__poster"
                src={film.poster}
                alt=""
                width={1920}
                height={1080}
                sizes="420px"
              />
              <i className="fl-film__cue" aria-hidden="true" />
            </button>
            <span className="fl-filmcell__label">{film.label}</span>
            <span className="fl-filmcell__meta">{film.meta}</span>
          </li>
        ))}
      </ul>

      {open ? (
        <MediaLightbox src={open.src} label={open.label} meta={open.meta} onClose={close} />
      ) : null}
    </div>
  );
}
