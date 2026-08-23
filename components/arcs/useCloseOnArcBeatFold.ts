import { useEffect, useRef } from "react";

/**
 * Close an open lightbox when its beat leaves (ADR-072).
 *
 * The casefile's `useCloseOnCasefileFold` watches `data-proof-live` on the
 * services stage; a dossier beat on a terminal arc has the same problem one
 * level down — the plane irises shut on scroll, and a dialog that stayed
 * open over a departed beat would be playing over void. `MediaLightbox`'s
 * scroll lock already holds wheel and touch; this covers what it cannot
 * (a keyboard or programmatic scroll) by watching the beat's `data-sec-live`
 * — written by the terminal controller while the beat is between arrival
 * and release, removed the moment the fold completes or the beat scrolls
 * back out of view.
 *
 * No-ops when the console is not inside an `.arc-stage` (reveal motion,
 * the fallback tier): there is no fold to close against.
 */
export function useCloseOnArcBeatFold(
  rootRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  close: () => void
) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!active) return;
    const stage = rootRef.current?.closest<HTMLElement>(".arc-stage");
    if (!stage || !stage.hasAttribute("data-sec-live")) return;
    const observer = new MutationObserver(() => {
      if (!stage.hasAttribute("data-sec-live")) closeRef.current();
    });
    observer.observe(stage, { attributes: true, attributeFilter: ["data-sec-live"] });
    return () => observer.disconnect();
  }, [rootRef, active]);
}
