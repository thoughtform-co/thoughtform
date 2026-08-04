import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { CaseFilm } from "@/lib/cases/types";

import { MediaLightbox, restoreFocusAfterUnmount, useCloseOnCasefileFold } from "./MediaLightbox";

/**
 * FilmsPlate — the above-the-line films as poster tiles, playing in a
 * lightbox.
 *
 * WHY A LIGHTBOX AND NOT INLINE. The full-height instrument gives both films
 * a legible uncropped poster, while the focus overlay remains the right place
 * for playback: it preserves the authored 16:9 frame and removes the casefile
 * chrome from the viewing experience.
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
