import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * MediaLightbox — one film or walkthrough, over the page, at its own shape.
 *
 * Extracted from `FilmsPlate` (2026-07-31) so the tool gallery reuses it
 * rather than growing a second copy. That is not tidiness: the two behaviours
 * below each took a measurement to get right, and a second hand-written
 * lightbox would have re-introduced both.
 *
 *   1. IT MUST PORTAL TO `document.body`. `.fl-case` carries the ADR-056 iris
 *      (`clip-path`), a translating arrival ladder and an `overflow: hidden`
 *      plate. An overlay inside that subtree is clipped by all three, and
 *      `position: fixed` does not save it — a clipped or transformed ancestor
 *      becomes the containing block.
 *   2. `overflow: hidden` IS NOT A SCROLL LOCK. Measured: the page still
 *      scrolled 739px under it. It suppresses the scrollbar; the non-passive
 *      `wheel` / `touchmove` handlers are what actually hold the page. Keys
 *      are left alone — focus is inside the dialog, where space and arrows
 *      belong to the video's own controls.
 *
 * The caller owns the open/closed state and focus restore, because only the
 * caller knows which trigger to send focus back to. See `restoreFocusAfterUnmount`.
 */
interface MediaLightboxProps {
  /** A self-hosted file. Ignored when `embed` is passed. */
  src?: string;
  /**
   * An EMBEDDED player instead of a file (ADR-074 U2 — the through-line's
   * Save The Expanse film, on the owner's own channel).
   *
   * ⚠ ADDITIVE ON PURPOSE. `FilmsPlate`, `ToolGallery` and the portfolio
   * arc's `ArcDossierConsole` all render this component, and
   * `tests/lib/tool-gallery-markup.test.tsx` pins that markup byte-for-byte
   * — so the `src` path below must stay exactly what it was. This branch is
   * the only thing a caller without `embed` can notice, which is nothing.
   *
   * ⚠ The `src` must be an origin `frame-src` allows (`lib/security/headers.mjs`
   * names one: `youtube-nocookie.com`). A URL from anywhere else renders
   * today, because the CSP still ships report-only, and dies the day it is
   * enforced — check the console, not the picture.
   */
  embed?: { src: string; title: string };
  /** Mono caps line above the video, e.g. "Smug Owl · Loop ATL". */
  label: string;
  /** Second half of that line, e.g. "16:9 master · 30 sec". */
  meta?: string;
  onClose: () => void;
}

/**
 * Focus restore helper for lightbox callers.
 *
 * Focusing the trigger synchronously loses a race: React tears the portal down
 * on the following commit, and removing the focused node hands focus to
 * `<body>` — undoing the restore. Measured exactly that. Wait a frame.
 */
export function restoreFocusAfterUnmount(el: HTMLElement | null) {
  if (!el) return;
  requestAnimationFrame(() => el.focus());
}

/**
 * The walkthrough's open/closed state, with the focus contract baked in.
 *
 * Extracted from `ToolGallery` (ADR-072) so the portfolio arc's dossier
 * beats and the casefile's tools plate open the SAME lightbox the same way:
 * `open(trigger)` captures the button synchronously (the event target is
 * gone by the time the dialog closes), `close()` unmounts and then hands
 * focus back one frame late — see `restoreFocusAfterUnmount`.
 */
export function useWalkthrough() {
  const [watching, setWatching] = useState(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback((trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setWatching(true);
  }, []);

  const close = useCallback(() => {
    setWatching(false);
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    restoreFocusAfterUnmount(target);
  }, []);

  return { watching, open, close };
}

/**
 * Close an open lightbox when the casefile folds.
 *
 * The plane irises shut on scroll (ADR-056 Update 1). If anything moves the
 * stage out from under an open film — a programmatic jump, or a fling that
 * beats the scroll lock — the overlay goes with it rather than playing over a
 * departed surface. Watches the same `data-proof-live` attribute the sheet
 * gates `will-change` on, so there are no per-frame reads.
 *
 * Lives here rather than in each plate so the two callers cannot drift, and
 * takes a ref INSIDE the casefile rather than querying the document, because
 * the lightbox itself is portalled out of that subtree.
 */
export function useCloseOnCasefileFold(
  rootRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  close: () => void
) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!active) return;
    const stage = rootRef.current?.closest<HTMLElement>(".services-stage");
    if (!stage) return;
    const observer = new MutationObserver(() => {
      if (!stage.hasAttribute("data-proof-live")) closeRef.current();
    });
    observer.observe(stage, { attributes: true, attributeFilter: ["data-proof-live"] });
    return () => observer.disconnect();
  }, [rootRef, active]);
}

/**
 * The measured modal shell: focus in, Escape out, and a REAL scroll lock.
 *
 * Extracted so the expanded map (ADR-062) reuses it rather than becoming the
 * second hand-written lightbox `rules/proof.md` forbids. Two traps are baked
 * in here and cost a measurement each:
 *
 *   · `overflow: hidden` on `<html>` IS NOT A SCROLL LOCK — the page still
 *     scrolled 739px. Non-passive `wheel`/`touchmove` `preventDefault` is
 *     what actually holds it.
 *   · Escape listens in the CAPTURE phase, because the corridor has its own
 *     Escape handlers and the innermost dialog has to answer first.
 *
 * Returns the ref to put on the dialog element.
 */
export function useDialogShell(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const close = useCallback(() => closeRef.current(), []);

  useEffect(() => {
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onKey, true);

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
      document.removeEventListener("keydown", onKey, true);
      doc.style.overflow = prevOverflow;
      doc.style.paddingRight = prevPad;
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
    };
  }, [close]);

  return { dialogRef, close };
}

export function MediaLightbox({ src, embed, label, meta, onClose }: MediaLightboxProps) {
  const { dialogRef, close } = useDialogShell(onClose);

  return createPortal(
    <div
      className="fl-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      ref={dialogRef}
      /* Backdrop dismiss, guarded on the target being the backdrop itself —
         so a click that lands on the frame, or a drag that starts on the
         scrubber and releases out here, does not close. `mousedown` rather
         than `click` for the same reason. */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="fl-lightbox__frame">
        <span className="fl-lightbox__label">
          {label}
          {meta ? (
            <>
              <i aria-hidden="true"> · </i>
              {meta}
            </>
          ) : null}
        </span>
        {embed ? (
          /* The embedded player. It carries the SAME class as the video so
             the 16:9 / max-height / object-fit rules hold one shape for both,
             and it is only ever constructed here — inside a dialog the
             reader opened — so nothing third-party loads on the landing
             until a click. `allow` names autoplay because the src asks for
             it; `fullscreen` because the player's own control needs it. */
          <iframe
            className="fl-lightbox__video"
            src={embed.src}
            title={embed.title}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video
            className="fl-lightbox__video"
            src={src}
            controls
            autoPlay
            playsInline
            aria-label={label}
            onEnded={close}
          />
        )}
        <button type="button" className="fl-lightbox__close" onClick={close}>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
