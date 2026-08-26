"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import { CHARACTER_ERAS } from "@/lib/voidwalker/characterEras";
import { setCharacterStageEra, setCharacterStageRect } from "@/lib/voidwalker/characterStageRef";

/**
 * useCharacterStageScroll — the single scroll writer for ADR-082's
 * character stage. Owns:
 *
 *   - `data-ch-ready` on the `.ch` root — the CSS mode switch. Absent
 *     is the rest state (era 0 painted, no motion), which is also the
 *     no-JS / reduced-motion / mobile state.
 *   - `--ch-p` (0..1) — runway progress.
 *   - `--ch-era-i` (integer 0..N-1) — current centred era.
 *   - `data-ch-era` — the current era id (for the smoke to `getBoundingClientRect`
 *     off the still).
 *   - `setCharacterStageEra(id)` — publishes to the R3F bus so the
 *     corridor's `CharacterStageActor` can mount the right mesh.
 *   - `setCharacterStageRect(rect)` — publishes the viewport rect so
 *     the mesh projects onto the frame.
 *
 * Gate: `(min-width: 961px) and (prefers-reduced-motion: no-preference)`.
 * Off-gate the hook does nothing — the DOM still renders the rest era
 * (era 0), so the mobile / PRM path is a clean rail of six frames.
 *
 * Sync writer: React `setCurrentEraIdx` is called on every era change
 * so the DOM copy updates. The scroll DOMs (CSS var + attribute) are
 * written from the same integer, so the two never disagree.
 */
export function useCharacterStageScroll(
  rootRef: RefObject<HTMLElement | null>,
  onEraChange: (i: number) => void
) {
  const eraCount = CHARACTER_ERAS.length;
  const lastIdxRef = useRef<number>(0);

  /** Scroll the page so the given era index becomes the centred one.
   *  Nudges the reader's scroll into the runway's fraction for `i`. */
  const scrollToEra = useCallback(
    (i: number) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const pageTop = rect.top + window.scrollY;
      const runwayH = rect.height;
      const vh = window.innerHeight || 1;
      const settled = runwayH - vh;
      if (settled <= 0) return;
      // Centre the era in the middle of its band.
      const t = eraCount > 1 ? (i + 0.5) / eraCount : 0.5;
      const y = pageTop + t * settled;
      window.scrollTo({ top: y, behavior: "smooth" });
    },
    [eraCount, rootRef]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    );

    let engaged = false;
    let raf = 0;
    let disposed = false;

    /** Find the `.ch` element inside the runway root. The scroll writer's
     *  root is the RUNWAY (`.ch-runway`, tall wrapper), but the CSS
     *  motion block reads `data-ch-ready` on the STAGE (`.ch`, pinned
     *  child). Cache the lookup — the DOM shape is stable through the
     *  hook's lifetime. */
    const chEl: HTMLElement | null = root.classList.contains("ch")
      ? root
      : root.querySelector<HTMLElement>(".ch");

    const clear = () => {
      chEl?.removeAttribute("data-ch-ready");
      chEl?.style.removeProperty("--ch-p");
      chEl?.style.removeProperty("--ch-era-i");
      // ⚠ Do NOT clear `data-ch-era` here — the DOM's rest state names
      // era 0, and that attribute is the fallback path's era too.
      setCharacterStageRect(null);
      setCharacterStageEra(null);
      engaged = false;
    };

    const write = () => {
      raf = 0;
      if (disposed) return;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const runwayH = rect.height;
      const settled = runwayH - vh;
      if (settled <= 0) {
        if (engaged) clear();
        return;
      }
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / settled));

      // The era index: split the runway into `eraCount` bands. Small
      // hysteresis so the boundary doesn't chatter (the ADR-070 pattern).
      const band = 1 / eraCount;
      let i = Math.floor(p / band);
      if (i < 0) i = 0;
      if (i >= eraCount) i = eraCount - 1;

      chEl?.setAttribute("data-ch-ready", "");
      chEl?.style.setProperty("--ch-p", p.toFixed(4));
      chEl?.style.setProperty("--ch-era-i", String(i));
      const era = CHARACTER_ERAS[i]!;
      chEl?.setAttribute("data-ch-era", era.id);

      // Publish the viewport rect to the R3F bus. `.ch-viewport` is
      // the DOM anchor; if it moved (scroll, resize, era swap) the
      // corridor actor needs the new rect same frame.
      const viewport = root.querySelector<HTMLElement>("[data-ch-viewport]");
      if (viewport) {
        const vr = viewport.getBoundingClientRect();
        setCharacterStageRect({
          left: vr.left,
          top: vr.top,
          width: vr.width,
          height: vr.height,
        });
      } else {
        setCharacterStageRect(null);
      }

      setCharacterStageEra(era.id);

      if (i !== lastIdxRef.current) {
        lastIdxRef.current = i;
        onEraChange(i);
      }

      engaged = true;
    };

    const schedule = () => {
      if (raf || disposed) return;
      raf = requestAnimationFrame(write);
    };

    const onScrollOrResize = () => {
      if (!media.matches) {
        if (engaged) clear();
        return;
      }
      schedule();
    };

    const onMediaChange = () => {
      if (media.matches) schedule();
      else clear();
    };

    // Initial write, then wire up.
    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    media.addEventListener?.("change", onMediaChange);

    // A ResizeObserver on the root catches the section's own height
    // changes (theme flips, font landing) without a per-frame layout
    // read.
    const ro = new ResizeObserver(() => schedule());
    ro.observe(root);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      media.removeEventListener?.("change", onMediaChange);
      ro.disconnect();
      clear();
    };
  }, [eraCount, onEraChange, rootRef]);

  return scrollToEra;
}
