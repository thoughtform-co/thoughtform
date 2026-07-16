"use client";

import { useEffect } from "react";

import { scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import { computeDetentTable } from "@/lib/rail-manifest/detentTable";
import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES, manifestTitle } from "@/lib/rail-manifest/entries";
import {
  ACTIVE_IDX_ATTRIBUTES,
  LAST_CORRIDOR_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";

/**
 * RailManifestController — the left rail's journey marker (ADR-031;
 * Update 9 replaced the three-pillar rolodex with ONE detent diamond).
 *
 * The skeleton (a single diamond `<button>` + a hidden title chip) is
 * injected at PARSE time by `lib/v7-parse/railManifest.ts`, so the rail
 * paints on first load with no client reflow. This controller is a
 * null-rendering component that MUTATES that injected DOM — never
 * `createRoot` into `[data-rail-manifest-root]` (it would clobber the
 * server skeleton). Precedent: `useLandingScroll` writing `#depthIndicator`.
 *
 * The diamond snaps to one vertical detent per journey entry, spaced
 * PROPORTIONAL to each section's real scroll distance (the long WebGL
 * corridor takes a tall slice; short stations cluster). Positions come from
 * a layout-computed table (`computeDetentTable`, reusing the click-nav
 * offset recipe) rebuilt on mount / resize / late content — NEVER per scroll
 * frame. So the diamond's `top` stays a pure function of the active index
 * (ADR-031 "no scroll writer" invariant); scroll only re-resolves WHICH
 * index is active (the seam-gap geometric rule 3). It glides between detents
 * on the one allowed tween (350ms), gated behind `data-ready` so a mid-page
 * reload paints at its detent instead of sliding from hero.
 *
 * On hover / focus the diamond reveals the active entry's title — but only
 * when it has one (`data-has-title`; `hero` and future title-less
 * interstitials reveal nothing). Reveal is pure CSS; the diamond is a real
 * `<button>` so keyboard focus works, and a click re-centers the active
 * section.
 *
 * activeIdx resolution (all existing single-writer `<html>` attributes):
 *   1. `data-corridor-engaged` → the entry matching `data-corridor-phase`
 *      (Update 9: BEAT granularity — thesis / navigate / encode / build;
 *      thesis fallback — the WebGL fallback has no corridor writer);
 *   2. else `data-active-station` → its station entry;
 *   3. seam-gap fix: if that yields hero but the corridor mount sits above
 *      viewport-mid, the corridor has been PASSED → its last beat (Build).
 *
 * Wake sources: a MutationObserver on <html> (active index) + a passive
 * scroll listener gated to the hero/corridor regime (rule 3 is geometric) +
 * resize / load / ResizeObserver (detent table only). No rAF paint loop.
 */

interface RailManifestControllerProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function RailManifestController({ containerRef }: RailManifestControllerProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Absent shell (e.g. /claude-workshop parses a prototype without the
    // manifest nav) → clean no-op.
    const nav = container.querySelector<HTMLElement>("[data-rail-manifest-root]");
    if (!nav) return;
    const diamond = nav.querySelector<HTMLButtonElement>(".rail-manifest__diamond");
    const titleEl = nav.querySelector<HTMLElement>(".rail-manifest__title");
    if (!diamond || !titleEl) return;

    const html = document.documentElement;
    let scrollRaf = 0;
    let layoutRaf = 0;
    let activeIdx = -1; // forces the first update() to paint
    let seamWatch = true; // scroll listener works only in the hero/corridor regime
    let detents = computeDetentTable();

    const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    // Position write — the diamond's `top` is a pure function of the active
    // index into the layout-computed table. A null detent (target absent)
    // holds the last position rather than snapping to hero.
    const applyPosition = () => {
      const t = detents[activeIdx >= 0 ? activeIdx : 0];
      if (t == null) return;
      nav.style.setProperty("--rail-diamond-top", `${(t * 100).toFixed(3)}%`);
    };

    // Rebuild the detent table from live layout — mount / resize / late
    // content only, NEVER on scroll (ADR-031 no-scroll-writer invariant).
    const recompute = () => {
      detents = computeDetentTable();
      applyPosition();
    };
    const scheduleRecompute = () => {
      if (layoutRaf) return;
      layoutRaf = requestAnimationFrame(() => {
        layoutRaf = 0;
        recompute();
      });
    };

    const update = () => {
      const next = resolveActiveIdx(html);
      // The geometric rule needs scroll wake-ups only until services takes
      // over the attribute clock.
      seamWatch = next <= LAST_CORRIDOR_IDX;
      if (next === activeIdx) return;
      activeIdx = next;
      // Re-measure on each DISCRETE beat change (belt-and-suspenders with
      // the rAF/ResizeObserver recompute): a handful of layout reads per
      // journey, never per frame, so the detent the diamond glides to is
      // always current even if layout moved since the last observer tick.
      detents = computeDetentTable();
      applyPosition();

      const entry = MANIFEST_ENTRIES[activeIdx];
      const title = entry ? manifestTitle(entry) : null;
      titleEl.textContent = title ?? "";
      diamond.setAttribute("aria-label", title ? `Journey position: ${title}` : "Journey position");
      // CSS gates the hover/focus reveal on this — title-less entries never
      // reveal a chip.
      nav.toggleAttribute("data-has-title", !!title);
    };

    // Click — the diamond marks where you are; a click re-centers the active
    // section (harmless self-scroll that gives the focusable control an
    // action). PRM jumps.
    const onClick = () => {
      const entry = activeIdx >= 0 ? MANIFEST_ENTRIES[activeIdx] : undefined;
      if (entry) scrollToManifestEntry(entry, prm());
    };

    const observer = new MutationObserver(update);
    observer.observe(html, {
      attributes: true,
      attributeFilter: [...ACTIVE_IDX_ATTRIBUTES],
    });

    // Rule 3 is geometric — attribute mutations alone can't see the corridor
    // mount crossing viewport-mid, so a passive scroll listener re-resolves,
    // gated to the hero/corridor regime and rAF-coalesced. It re-resolves the
    // active index ONLY; it never re-reads the detent geometry.
    const onScroll = () => {
      if (!seamWatch || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleRecompute);
    window.addEventListener("load", scheduleRecompute);
    nav.addEventListener("click", onClick);

    // Late layout — the WebGL corridor mount + Services portal cards finalize
    // their height after first paint, which shifts every detent. Recompute
    // when the document body (or the corridor mount) resizes. No feedback
    // loop: `recompute` only reads layout and writes a CSS var on the rail.
    const ro = new ResizeObserver(scheduleRecompute);
    ro.observe(document.body);
    const mount = document.getElementById(CORRIDOR_MOUNT_ID);
    if (mount) ro.observe(mount);

    update();
    // Re-measure after layout settles, then enable transitions only after
    // that first sync is flushed — a mid-page reload paints at its detent,
    // never slides from hero.
    requestAnimationFrame(() => {
      recompute();
      void nav.offsetWidth;
      nav.setAttribute("data-ready", "");
    });

    return () => {
      observer.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleRecompute);
      window.removeEventListener("load", scheduleRecompute);
      nav.removeEventListener("click", onClick);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      if (layoutRaf) cancelAnimationFrame(layoutRaf);
      nav.removeAttribute("data-ready");
    };
  }, [containerRef]);

  return null;
}
