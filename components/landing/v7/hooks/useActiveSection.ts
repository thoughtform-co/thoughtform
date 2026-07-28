"use client";

import { useEffect, useState } from "react";

import {
  ACTIVE_IDX_ATTRIBUTES,
  LAST_CORRIDOR_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";
import { sectionReadout, type SectionReadout } from "@/lib/rail-manifest/sectionLabel";

/**
 * The live journey position for the nav-corner readout (ADR-055).
 *
 * Lifted verbatim out of the retired `CorridorSectionMenu`: the active
 * index comes from the shared `resolveActiveIdx` over the existing
 * `<html>` attribute bus, woken by a `MutationObserver` on exactly the
 * three attributes that resolver reads. No new scroll writer (ADR-002) —
 * the writers stay `useLandingScroll` / `useDepthScroll` /
 * `CorridorStationHeaders`.
 *
 * The one scroll listener is the seam-gap rule's cost: between corridor
 * disengage and the services crossing, `data-active-station` lags at
 * "hero" and only a rect read can tell that the corridor was passed
 * (`resolveActiveIdx` rule 3). It is passive, rAF-coalesced, and gated
 * off the moment the reader is past the corridor — the same `watch`
 * discipline the menu used. The menu additionally watched inside
 * #services / #proof to track SUBSECTIONS; those retired with it, so the
 * corridor gate is all that remains.
 *
 * State is keyed on the readout's ROW id, not the manifest index, so the
 * corridor's four beats settle as one state and the hero→corridor seam
 * costs zero re-renders.
 */
export function useActiveSection(): SectionReadout {
  const [readout, setReadout] = useState<SectionReadout>(() => sectionReadout(0));

  useEffect(() => {
    const html = document.documentElement;
    let scrollRaf = 0;
    let watch = true;

    const update = () => {
      const idx = resolveActiveIdx(html);
      watch = idx <= LAST_CORRIDOR_IDX;
      const next = sectionReadout(idx);
      setReadout((prev) => (prev.id === next.id ? prev : next));
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
  }, []);

  return readout;
}
