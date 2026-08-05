"use client";

import { createPortal } from "react-dom";

import { useDialogShell } from "../MediaLightbox";

/**
 * THE EXPAND OVERLAY (ADR-062 Outstanding 1).
 *
 * The panel view suppresses annotation because 611x390 cannot hold it. This
 * is where that annotation lives — the same three sheets, at `full` detail,
 * plus sheet 01's parts index.
 *
 * IT PORTALS TO `document.body`, for the reason `MediaLightbox` documents
 * and `rules/proof.md` restates: `.fl-case` carries the ADR-056 iris
 * `clip-path`, a translating arrival ladder and an `overflow: hidden`
 * plate, and a clipped or transformed ancestor becomes the containing block
 * even for `position: fixed`.
 *
 * IT REUSES `useDialogShell` rather than hand-rolling one. That is the rule
 * `rules/proof.md` states outright — the measured Escape capture, the real
 * scroll lock (`overflow: hidden` on `<html>` is NOT one; the page still
 * scrolled 739px) and the focus entry each cost a measurement, and a second
 * hand-written lightbox re-introduces all three.
 *
 * ⚠ THE INNER ROOT KEEPS `.fl-imap`. Every colour on these sheets routes
 * through a custom property declared there, and the light-mode rows in
 * `theme.css` select on it — a portalled overlay that dropped the class
 * would render the drawing in the dark palette on a light page.
 */

interface Props {
  onClose: () => void;
  sheet: string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
}

export function MapExpanded({ onClose, sheet, onKeyDown, children }: Props) {
  const { dialogRef, close } = useDialogShell(onClose);

  return createPortal(
    <div
      className="fl-imap-scrim"
      role="dialog"
      aria-modal="true"
      aria-label="Work-to-intelligence map, expanded"
      tabIndex={-1}
      ref={dialogRef}
      /* Backdrop dismiss, guarded on the target being the backdrop itself,
         so a drag that starts on the drawing and releases out here does not
         close the sheet. `mousedown` for the same reason. */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="fl-imap fl-imap--full" data-sheet={sheet} onKeyDown={onKeyDown}>
        {children}
      </div>
    </div>,
    document.body
  );
}
