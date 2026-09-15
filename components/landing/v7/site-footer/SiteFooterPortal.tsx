"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SiteFooter } from "./SiteFooter";

interface SiteFooterPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link SiteFooter} into the `[data-site-footer-root]` placeholder
 * declared inside the `#contact` station in the v7 prototype HTML (ADR-105) —
 * the fourth of these seams, after `ServicesPortal`, `AboutStagePortal` and
 * `VoidwalkerPortal`.
 *
 * ⚠ **A NESTED ROOT, NOT A JSX SIBLING, AND BOTH REASONS ARE LOAD-BEARING.**
 * `useLandingScroll` collects `.station` elements from INSIDE the
 * `dangerouslySetInnerHTML` div, so a `<SiteFooter/>` rendered next to that
 * div would be invisible to it — `data-active-station` would never become
 * `contact` and the corner readout, the journey mark and the rail detent
 * would all go quiet. It would also sit outside `.stations`, which is the
 * stacking context the corridor cover's `z-index: 6` is measured in, and
 * outside the `~` sibling selector that applies it.
 *
 * ⚠ **AND IT IS WHAT KEEPS THE CONTACT FORM SAFE.** `LandingPage` hosts every
 * nested root, and a `LandingPage` re-render re-applies the innerHTML and
 * ORPHANS them — the services cards vanish with no error. A controlled input
 * re-rendering on each keystroke would be exactly that if the form lived in
 * `LandingPage`'s own tree. Inside a nested root its state cannot reach it.
 *
 * Deferred-macrotask unmount + root reuse: the `ServicesPortal` /
 * `VoidwalkerPortal` recipe verbatim (StrictMode / Fast Refresh safe — see
 * those files' comments).
 */
export function SiteFooterPortal({ containerRef }: SiteFooterPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-site-footer-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<SiteFooter />);

    return () => {
      const r = rootRef.current;
      timerRef.current = window.setTimeout(() => {
        if (rootRef.current === r) {
          r?.unmount();
          rootRef.current = null;
        }
        timerRef.current = null;
      }, 0);
    };
  }, [containerRef]);

  return null;
}
