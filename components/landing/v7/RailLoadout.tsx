"use client";

import { useEffect } from "react";

import { scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import {
  chargeForActiveIdx,
  LOADOUT_RESOURCES,
  loadoutState,
  loadoutStatusWord,
} from "@/lib/rail-manifest/loadout";
import {
  ACTIVE_IDX_ATTRIBUTES,
  ARC_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";

/**
 * RailLoadoutController — the left rail's resource loadout (ADR-031
 * follow-up).
 *
 * A persistent module bay at the FOOT of the left rail showing the three
 * core resources — Arc, Services, Tools — as pluggable modules that seat
 * as the reader reaches each section, over a charge gauge that fills like
 * a fuel meter. It is the RailManifest twin: the markup is injected at
 * PARSE time by `lib/v7-parse/railLoadout.ts` (sockets faded + empty on
 * first paint), and this null-rendering controller MUTATES that DOM —
 * never `createRoot` into `[data-rail-loadout-root]` (it would clobber
 * the server skeleton).
 *
 * Everything derives from ONE integer, the shared `resolveActiveIdx`
 * (identical resolution to the rolodex — same seam-gap rule, no drift):
 *   - per socket: `data-state` (upcoming / active / seated) + a status
 *     `aria-label` + `aria-current` on the active one;
 *   - on the nav: `--loadout-charge` (0..3, the gauge fill) and
 *     `data-dormant` while hero is active (faded, empty sockets — the
 *     hero canon of a dormant instrument).
 * `data-ready` is set only after the first sync + a reflow flush so a
 * mid-page reload paints at the correct charge instead of animating up.
 *
 * Wake sources mirror the rolodex: one MutationObserver on <html> + a
 * passive scroll listener that works only while in the hero/corridor
 * regime (the geometric seam rule) + resize. No rAF — states are
 * attribute flips, motion is CSS.
 */

interface RailLoadoutControllerProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function RailLoadoutController({ containerRef }: RailLoadoutControllerProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Absent shell (e.g. /claude-workshop parses a prototype without the
    // loadout nav) → clean no-op.
    const nav = container.querySelector<HTMLElement>("[data-rail-loadout-root]");
    if (!nav) return;
    const sockets = Array.from(nav.querySelectorAll<HTMLButtonElement>(".rail-loadout__socket"));
    if (sockets.length !== LOADOUT_RESOURCES.length) return;
    // Align each DOM socket to its resource by id (order-robust).
    const resourceForSocket = sockets.map((el) =>
      LOADOUT_RESOURCES.find((r) => r.entry.id === el.getAttribute("data-entry-id"))
    );
    if (resourceForSocket.some((r) => !r)) return;

    const html = document.documentElement;
    let scrollRaf = 0;
    let activeIdx = -1; // forces the first update() to paint
    let seamWatch = true; // scroll listener works only in the hero/corridor regime

    const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const update = () => {
      const next = resolveActiveIdx(html);
      // The geometric seam rule needs scroll wake-ups only until services
      // takes over the attribute clock.
      seamWatch = next <= ARC_IDX;
      if (next === activeIdx) return;
      activeIdx = next;

      // Charge gauge + hero dormancy — both pure functions of next.
      nav.style.setProperty("--loadout-charge", String(chargeForActiveIdx(next)));
      if (next === 0) nav.setAttribute("data-dormant", "");
      else nav.removeAttribute("data-dormant");

      sockets.forEach((el, i) => {
        const resource = resourceForSocket[i]!;
        const state = loadoutState(resource.manifestIdx, next);
        if (el.getAttribute("data-state") !== state) el.setAttribute("data-state", state);
        const label = `${resource.name} — ${loadoutStatusWord(state)}`;
        if (el.getAttribute("aria-label") !== label) el.setAttribute("aria-label", label);
        if (state === "active") el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });
    };

    // Click → scroll: the loadout is diegetic navigation, shared with the
    // rolodex. Stations scrollIntoView; the Arc corridor phase lands a
    // tuned fraction into the mount runway. PRM jumps.
    const onClick = (ev: MouseEvent) => {
      const btn = (ev.target as HTMLElement).closest?.(".rail-loadout__socket");
      const id = btn?.getAttribute("data-entry-id");
      const resource = id ? LOADOUT_RESOURCES.find((r) => r.entry.id === id) : undefined;
      if (!resource) return;
      scrollToManifestEntry(resource.entry, prm());
    };

    const observer = new MutationObserver(update);
    observer.observe(html, {
      attributes: true,
      attributeFilter: [...ACTIVE_IDX_ATTRIBUTES],
    });

    // The seam rule is geometric — attribute mutations alone can't see the
    // corridor mount crossing viewport-mid, so a passive scroll listener
    // re-resolves, gated to the hero/corridor regime and rAF-coalesced.
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
    // Enable transitions only after the first sync has been flushed — a
    // mid-page reload paints at its charge, never animates from empty.
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
