import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { CaseFilm } from "@/lib/cases/types";

/**
 * FilmsPlate — the above-the-line films as poster tiles, playing in a
 * lightbox.
 *
 * WHY A LIGHTBOX AND NOT INLINE (owner, 2026-07-30). The plate rect is a
 * fixed, short band off the HUD rail (~690 x 240 at 1440x800), so two 16:9
 * films side by side land at ~315px wide. That is a thumbnail, not a film —
 * and worse, the height constraint fought the tile's own aspect ratio and
 * cropped it. The tiles are now uncropped 16:9 posters and the film opens
 * over the page at its true shape.
 *
 * IT MUST PORTAL TO `document.body`. `.fl-case` carries the ADR-056 iris —
 * a scrubbed `clip-path` closing toward a centre slit — plus a translating
 * arrival ladder and `overflow: hidden` on the plate. An overlay rendered
 * inside that subtree is clipped by all three, and `position: fixed` does
 * not save it: a clipped or transformed ancestor becomes its containing
 * block. Portalling is not a style preference here, it is the only thing
 * that works.
 *
 * STILL NO `<video>` UNTIL A CLICK. Same contract as before — the tile is a
 * `next/image` poster, so a row nobody opens costs zero video bytes and zero
 * compositor layers (the beat's layer budget was counted at ~14 in ADR-056
 * Update 4). The element is created by the lightbox, already playing, and
 * destroyed with it.
 */
export function FilmsPlate({ films }: { films: readonly CaseFilm[] }) {
  const [openSrc, setOpenSrc] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  /* No `mounted` guard before the portal: the whole casefile lives inside
     the nested `createRoot` that `ServicesPortal` spins up in an effect, so
     this tree never server-renders and `document.body` is always there. The
     usual SSR dance would be cargo cult here. */
  const open = films.find((f) => f.src === openSrc) ?? null;

  const close = useCallback(() => {
    setOpenSrc(null);
    /* Focus returns to the tile that opened this — but only AFTER the portal
       has unmounted. Focusing synchronously here loses the race: React tears
       the dialog down on the following commit, and removing the focused node
       hands focus to <body>, undoing the restore. Measured exactly that. */
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    requestAnimationFrame(() => target?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    // Capture phase: the corridor has its own Escape handlers, and this
    // dialog is the innermost thing on screen, so it answers first.
    document.addEventListener("keydown", onKey, true);

    // The casefile folds on scroll (ADR-056 Update 1). If anything scrolls
    // the stage out from under an open film — a programmatic jump, or a
    // fling that beats the lock — drop the lightbox with it rather than
    // leave a film playing over a departed surface. Same attribute the sheet
    // gates `will-change` on; no per-frame reads.
    const stage = rootRef.current?.closest<HTMLElement>(".services-stage");
    const observer = stage
      ? new MutationObserver(() => {
          if (!stage.hasAttribute("data-proof-live")) close();
        })
      : null;
    if (stage && observer) {
      observer.observe(stage, { attributes: true, attributeFilter: ["data-proof-live"] });
    }

    return () => {
      document.removeEventListener("keydown", onKey, true);
      observer?.disconnect();
    };
  }, [open, close]);

  /* Scroll lock. The film is a 30-second read on a scroll-driven page, where
     a stray wheel event would fold the casefile out from behind the overlay.
     `scrollY` is deliberately left alone (no position:fixed swap), so every
     corridor clock resumes exactly where it was on close.

     `overflow: hidden` on <html> is NOT sufficient on its own — measured: the
     document still scrolled 739px under it. So the wheel and touch events are
     what actually hold the lock, and the overflow rule is only there to drop
     the scrollbar. Non-passive listeners are required to be able to
     preventDefault, and they exist solely while the dialog is open. Keys are
     left alone: focus is inside the dialog, where space and arrows belong to
     the video's own controls. */
  useEffect(() => {
    if (!open) return;
    const doc = document.documentElement;
    const gap = window.innerWidth - doc.clientWidth;
    const prevOverflow = doc.style.overflow;
    const prevPad = doc.style.paddingRight;
    doc.style.overflow = "hidden";
    if (gap > 0) doc.style.paddingRight = `${gap}px`;

    const block = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });

    return () => {
      doc.style.overflow = prevOverflow;
      doc.style.paddingRight = prevPad;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
    };
  }, [open]);

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

      {open
        ? createPortal(
            <div
              className="fl-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={open.label}
              tabIndex={-1}
              ref={dialogRef}
              /* Backdrop dismiss, guarded on the target being the backdrop
                 itself — so a click that lands on the frame, or a drag that
                 starts on the scrubber and releases out here, does not
                 close. `mousedown` rather than `click` for the same reason. */
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) close();
              }}
            >
              <div className="fl-lightbox__frame">
                <span className="fl-lightbox__label">
                  {open.label}
                  <i aria-hidden="true"> · </i>
                  {open.meta}
                </span>
                <video
                  className="fl-lightbox__video"
                  src={open.src}
                  controls
                  autoPlay
                  playsInline
                  aria-label={open.label}
                  onEnded={close}
                />
                <button type="button" className="fl-lightbox__close" onClick={close}>
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
