"use client";

import { useEffect, useState } from "react";

import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import { ACTIVE_IDX_ATTRIBUTES, resolveActiveIdx } from "@/lib/rail-manifest/resolveActiveIdx";
import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/**
 * The journey position the rail instruments read (ADR-059).
 *
 * ⚠ WHY THIS IS NOT `useActiveSection`. That hook deliberately keys its
 * state on the readout ROW plus sub, so the Arc's four beats settle as one
 * section and the hero→corridor seam costs zero re-renders — which is
 * exactly right for the nav corner it feeds. The approach cluster needs the
 * opposite: it draws one mark PER BEAT, so it has to re-render on a change
 * `useActiveSection` is built to swallow. Widening that hook's state would
 * hand the nav corner three extra re-renders per corridor pass to serve a
 * consumer that did not exist when it was tuned.
 *
 * So this is a second, narrower reader of the SAME bus, with the same
 * machinery: `resolveActiveIdx` over the `<html>` attributes, woken by a
 * `MutationObserver` filtered to exactly the three attributes that resolver
 * reads, plus one passive rAF-coalesced scroll listener gated to the two
 * regimes where the attributes alone cannot tell (the hero/corridor seam,
 * which needs a rect read — `resolveActiveIdx` rule 3 — and `#services`,
 * where the casefile releases on scroll alone).
 *
 * NO NEW SCROLL WRITER (ADR-002). The writers stay `useLandingScroll`,
 * `useDepthScroll` and `CorridorStationHeaders`; this only ever reads.
 */

const LAST_CORRIDOR_IDX = (() => {
  let last = 0;
  MANIFEST_ENTRIES.forEach((e, i) => {
    if (e.kind === "corridor") last = i;
  });
  return last;
})();

const SERVICES_IDX = Math.max(
  0,
  MANIFEST_ENTRIES.findIndex((e) => e.id === "services")
);

/** ADR-056: the casefile owns `#services` until the offer is released. */
const proofOwnsServices = () => servicesRingProgressRef.current.proofRelease < 0.75;

export interface JourneyMarks {
  /** `MANIFEST_ENTRIES` index — per-beat, for the approach cluster. */
  activeIdx: number;
  /** `READOUT_SECTIONS` seat — row-level, for the dock cluster. */
  seat: number;
  /** The active row's label, for the right rail's vertical name. */
  label: string;
}

export function useJourneyMarks(enabled: boolean): JourneyMarks {
  const [marks, setMarks] = useState<JourneyMarks>(() => ({
    activeIdx: 0,
    seat: 0,
    label: READOUT_SECTIONS[0]?.label ?? "",
  }));

  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    let scrollRaf = 0;
    let watch = true;

    const update = () => {
      const activeIdx = resolveActiveIdx(html);
      watch = activeIdx <= LAST_CORRIDOR_IDX || activeIdx === SERVICES_IDX;
      const readout = sectionReadout(activeIdx, proofOwnsServices());
      const seat = READOUT_SECTIONS.findIndex((row) => row.id === readout.id);
      setMarks((prev) =>
        prev.activeIdx === activeIdx && prev.seat === seat
          ? prev
          : { activeIdx, seat, label: readout.label }
      );
    };

    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: [...ACTIVE_IDX_ATTRIBUTES] });

    const onScroll = () => {
      if (!watch || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  }, [enabled]);

  return marks;
}

/**
 * The CONTINUOUS channel — document scroll, published imperatively.
 *
 * Kept out of React entirely. These values change every frame, and the
 * telemetry that prints them is three text nodes; routing that through
 * state would re-render the whole instrument set on every scroll frame to
 * update nine characters. The lab learned the same thing and used a module
 * ref for it.
 *
 * Writes are delta-gated on the formatted STRING, not the number, so a
 * scroll that does not change the printed value costs nothing.
 */
export function useScrollReadouts(
  enabled: boolean,
  targets: {
    bearing: React.RefObject<HTMLElement | null>;
    local: React.RefObject<HTMLElement | null>;
  }
) {
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;

    const paint = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const scroll01 = Math.min(1, Math.max(0, window.scrollY / max));
      const pct = String(Math.round(scroll01 * 100)).padStart(3, "0");

      const bearingEl = targets.bearing.current;
      if (bearingEl && bearingEl.textContent !== pct) bearingEl.textContent = pct;

      // LOCAL is progress through the section currently holding the
      // viewport midline. Read off the live rect rather than a table: the
      // corridor and services runways change height as their lazy chunks
      // mount, and a cached table would print a stale fraction.
      const mid = window.innerHeight / 2;
      let localTxt = "0.00";
      for (const el of document.querySelectorAll<HTMLElement>(".station")) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid && r.height > 0) {
          localTxt = Math.min(1, Math.max(0, (mid - r.top) / r.height)).toFixed(2);
          break;
        }
      }
      const localEl = targets.local.current;
      if (localEl && localEl.textContent !== localTxt) localEl.textContent = localTxt;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(paint);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    paint();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, targets.bearing, targets.local]);
}
