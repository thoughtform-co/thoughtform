"use client";

import { useEffect } from "react";

import { scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import { MANIFEST_ENTRIES, RAIL_ROWS } from "@/lib/rail-manifest/entries";
import {
  ACTIVE_IDX_ATTRIBUTES,
  ARC_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";

/**
 * RailManifestController — the left rail's brand-pillar rolodex
 * (ADR-031; curated to three rows in Update 6).
 *
 * The markup (a masked window holding a flow-stacked reel of the three
 * pillar rows — Arc / Services / Products) is injected at PARSE time by
 * `lib/v7-parse/railManifest.ts`, so the rail paints on first load with
 * no client reflow. This controller is a null-rendering component that
 * MUTATES that injected DOM — never `createRoot` into
 * `[data-rail-manifest-root]` (it would clobber the server skeleton).
 * Precedent: `useLandingScroll` writing `#depthIndicator`.
 *
 * The rolodex still tracks the FULL journey: `resolveActiveIdx` returns
 * an index into `MANIFEST_ENTRIES` (all ten sections), and each pillar
 * row derives its state from its own journey index vs that active index
 * — `upcoming` (ahead) / `active` (you're in it) / `seated` (passed).
 * The reel slides so the active / last-reached pillar sits at the
 * mid-rail anchor via one custom property (`--rail-manifest-idx`, a
 * 350ms detent glide; position stays a pure function of the active
 * index, never scroll-scrubbed). `data-dormant` hides the window until
 * the Arc — through the hero AND the thesis; the rolodex appears only
 * once the journey reaches the first pillar. `data-ready` is set
 * only after the first sync + a reflow flush so a mid-page reload paints
 * at the correct detent instead of sliding up from hero.
 *
 * activeIdx resolution (all existing single-writer attributes):
 *   1. `data-corridor-engaged` → the entry matching
 *      `data-corridor-phase` (thesis fallback — the WebGL fallback has
 *      no corridor writer);
 *   2. else `data-active-station` → its station entry;
 *   3. seam-gap fix: if that yields hero but the corridor mount sits
 *      above viewport-mid, the corridor has been PASSED → Arc.
 *
 * Wake sources: one MutationObserver on <html> + a passive scroll
 * listener that only works while in the hero/corridor regime (rule 3
 * is geometric) + resize. No rAF — states are attribute flips, motion
 * is CSS.
 */

interface RailManifestControllerProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function RailManifestController({ containerRef }: RailManifestControllerProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Absent shell (e.g. /claude-workshop parses a prototype without
    // the manifest nav) → clean no-op.
    const nav = container.querySelector<HTMLElement>("[data-rail-manifest-root]");
    if (!nav) return;
    const entries = Array.from(nav.querySelectorAll<HTMLButtonElement>(".rail-manifest__entry"));
    if (entries.length !== RAIL_ROWS.length) return;
    // Each rendered row's index back in the full journey — the basis for
    // its state (order-robust: resolve by id, not DOM position).
    const rowManifestIdx = entries.map((el) =>
      MANIFEST_ENTRIES.findIndex((e) => e.id === el.getAttribute("data-entry-id"))
    );
    if (rowManifestIdx.some((i) => i < 0)) return;

    const html = document.documentElement;
    let scrollRaf = 0;
    let activeIdx = -1; // forces the first update() to paint
    let seamWatch = true; // scroll listener works only in the hero/corridor regime

    const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const update = () => {
      const next = resolveActiveIdx(html);
      // The geometric rule needs scroll wake-ups only until services
      // takes over the attribute clock.
      seamWatch = next <= ARC_IDX;
      if (next === activeIdx) return;
      activeIdx = next;

      // Dormant until the Arc — the window stays hidden through the hero
      // AND the thesis; the rolodex appears only once you enter the Arc
      // (owner, 2026-07-13).
      if (next < ARC_IDX) nav.setAttribute("data-dormant", "");
      else nav.removeAttribute("data-dormant");

      // Reel focus — center the active pillar, or the last one reached
      // (clamped to the three rows), so travel past the pillars parks on
      // the final one. A pure function of the active index.
      const reached = rowManifestIdx.filter((e) => next >= e).length;
      const focus = Math.max(0, Math.min(entries.length - 1, reached - 1));
      nav.style.setProperty("--rail-manifest-idx", String(focus));

      entries.forEach((el, j) => {
        const e = rowManifestIdx[j];
        const state = next > e ? "seated" : next === e ? "active" : "upcoming";
        if (el.getAttribute("data-state") !== state) el.setAttribute("data-state", state);
        if (state === "active") el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });
    };

    // Click → scroll: the rolodex is diegetic navigation. Stations use
    // the HudNav canon; the Arc corridor phase lands a tuned fraction
    // into the mount runway. PRM jumps. Resolve the entry by id.
    const onClick = (ev: MouseEvent) => {
      const btn = (ev.target as HTMLElement).closest?.(".rail-manifest__entry");
      const id = btn?.getAttribute("data-entry-id");
      const entry = id ? MANIFEST_ENTRIES.find((e) => e.id === id) : undefined;
      if (!entry) return;
      scrollToManifestEntry(entry, prm());
    };

    const observer = new MutationObserver(update);
    observer.observe(html, {
      attributes: true,
      attributeFilter: [...ACTIVE_IDX_ATTRIBUTES],
    });

    // Rule 3 is geometric — attribute mutations alone can't see the
    // corridor mount crossing viewport-mid, so a passive scroll
    // listener re-resolves, gated to the hero/corridor regime and
    // rAF-coalesced.
    const onScroll = () => {
      if (!seamWatch || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    nav.addEventListener("click", onClick);
    update();
    // Enable transitions only after the first sync has been flushed —
    // a mid-page reload fades in at its detent, never slides from hero.
    void nav.offsetWidth;
    nav.setAttribute("data-ready", "");

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      nav.removeEventListener("click", onClick);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      nav.removeAttribute("data-ready");
    };
  }, [containerRef]);

  return null;
}
