"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * useArcScroll — the ONE scroll writer for an arc page (ADR-002: one
 * writer per page; ADR-052). Replicates the landing's hero-curtain
 * channels for a standalone route:
 *
 *   · `--hero-lift` on <html> — LINEAR scrollY/vh; the HUD rail/corner
 *     clip-paths (landing.css) uncover the frame chrome in lockstep
 *     with the hero's bottom edge. Detail pages only — the overview has
 *     no hero curtain and pins `--hero-lift: 1` statically on its root.
 *   · `--hero-cover` on the hero element — smootherstep copy dissolve
 *     (removed under reduced motion, mirroring the CSS gate).
 *   · `--py` per [data-parallax] element (the landing formula).
 *   · `.hud__brand` `is-collapsed` at scrollY > 0.5·vh — the HudNav
 *     pattern: a class on the element, never a root attribute.
 *   · `data-arc-scrolled` on the root past 1vh — the header's gate.
 *   · `visibility` on the hero card past the curtain, and
 *     `data-arc-entry` on <html> while the card still covers any of the
 *     viewport — the ADR-022 v8 curtain, ported in ADR-075. The first
 *     beat's PLANE is held still against that flag while this card
 *     scrolls off it; the card is the mover, exactly as on the landing.
 *
 * Never writes corridor channels (`--svc-*`, `data-corridor-*`, …).
 *
 * `onFrame` is how the ADR-057 beat clocks stay inside this one writer:
 * the terminal controller owns the beat registry and the decode, but it
 * adds NO listener of its own — it runs as the tail of this frame.
 */
interface ArcScrollOptions {
  variant: "index" | "detail";
  rootRef: RefObject<HTMLElement | null>;
  /** Stable callback run at the end of every frame (scrollY, vh). */
  onFrame?: (scrollY: number, vh: number) => void;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/** Viewports past which the hero card is released from the paint
 *  (useLandingScroll.ts's own value — one curtain, one number). */
const HERO_CURTAIN_RELEASE_VH = 1.35;

export function useArcScroll({ variant, rootRef, onFrame }: ArcScrollOptions) {
  const rafId = useRef<number | null>(null);
  const collapsedRef = useRef(false);
  const scrolledRef = useRef(false);
  const entryRef = useRef(false);
  const reduceQuery = useRef<MediaQueryList | null>(null);

  const frame = useCallback(() => {
    rafId.current = null;
    const root = rootRef.current;
    if (!root) return;
    const scrollY = window.scrollY;
    const vh = window.innerHeight || 1;
    reduceQuery.current ??= window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduceMotion = reduceQuery.current.matches;

    if (variant === "detail") {
      // Linear — the clip edge must track the hero's 1:1 scroll
      // (useLandingScroll.ts:160-170; smootherstep is deliberately NOT
      // used here).
      const raw = clamp01(scrollY / vh);
      document.documentElement.style.setProperty("--hero-lift", raw.toFixed(4));

      const hero = root.querySelector<HTMLElement>(".arc-hero");
      if (hero) {
        if (reduceMotion) {
          hero.style.removeProperty("--hero-cover");
        } else {
          const cover = raw * raw * raw * (raw * (raw * 6 - 15) + 10);
          hero.style.setProperty("--hero-cover", cover.toFixed(4));
        }
        // THE CURTAIN'S RELEASE (useLandingScroll's `writeHeroCurtainLift`,
        // same constants). `.hero` is z-index 4 and `.arc-section` is 1, so
        // the card outranks every section on the page — off-screen is not
        // enough on its own, and a held first plane means the card and a
        // section now share the viewport at the seam.
        hero.style.visibility =
          scrollY >= vh - 0.5 || scrollY > vh * HERO_CURTAIN_RELEASE_VH ? "hidden" : "";
      }

      if (!reduceMotion) {
        const viewportCenter = scrollY + vh / 2;
        root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || "0") || 0;
          const rect = el.getBoundingClientRect();
          const elCenter = scrollY + rect.top + rect.height / 2;
          el.style.setProperty("--py", `${(-(elCenter - viewportCenter) * speed).toFixed(1)}px`);
        });
      }

      const scrolledPast = scrollY > vh;
      if (scrolledPast !== scrolledRef.current) {
        scrolledRef.current = scrolledPast;
        if (scrolledPast) root.setAttribute("data-arc-scrolled", "true");
        else root.removeAttribute("data-arc-scrolled");
      }
    }

    // Wordmark dock (both variants) — threshold crossings only.
    const collapsed = scrollY > vh * 0.5;
    if (collapsed !== collapsedRef.current) {
      collapsedRef.current = collapsed;
      root.querySelector(".hud__brand")?.classList.toggle("is-collapsed", collapsed);
    }

    onFrame?.(scrollY, vh);
  }, [rootRef, variant, onFrame]);

  /**
   * THE ENTRY FLAG, WRITTEN SYNCHRONOUSLY — not from the rAF (ADR-075).
   *
   * It switches the first beat's plane between `fixed` and flow, which is
   * a LAYER-MODE change: one frame of lag shows a gap at the handoff. The
   * landing's `syncCorridorEntryState` runs synchronously for the same
   * reason. One rect read per scroll event, and only threshold crossings
   * touch the DOM.
   *
   * The condition is the card's own bottom edge: while any of it still
   * covers the viewport the beat behind it is held. The CSS gates the
   * rest — terminal motion only, and never a beat taller than the
   * viewport (a tall stage centres its plane in a box bigger than the
   * fixed cell, so the two positions would not agree at the handoff).
   */
  const syncEntry = useCallback(() => {
    if (variant !== "detail") return;
    const hero = rootRef.current?.querySelector<HTMLElement>(".arc-hero");
    if (!hero) return;
    const covering = hero.getBoundingClientRect().bottom > 0;
    if (covering === entryRef.current) return;
    entryRef.current = covering;
    const doc = document.documentElement;
    if (covering) doc.setAttribute("data-arc-entry", "");
    else doc.removeAttribute("data-arc-entry");
  }, [rootRef, variant]);

  const onScroll = useCallback(() => {
    syncEntry();
    if (rafId.current !== null) return;
    rafId.current = window.requestAnimationFrame(frame);
  }, [frame, syncEntry]);

  // First frame before paint — otherwise the rails flash unclipped (or
  // clipped) for a frame on load at a restored scroll position.
  useLayoutEffect(() => {
    syncEntry();
    frame();
  }, [frame, syncEntry]);

  useEffect(() => {
    // Captured at setup — the cleanup must release the node this effect
    // actually wired, not whatever the ref points at during teardown.
    const root = rootRef.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
      if (variant === "detail") {
        document.documentElement.style.removeProperty("--hero-lift");
        document.documentElement.removeAttribute("data-arc-entry");
      }
      if (root) {
        root.removeAttribute("data-arc-scrolled");
        root.querySelector(".hud__brand")?.classList.remove("is-collapsed");
      }
    };
  }, [onScroll, rootRef, variant]);
}
