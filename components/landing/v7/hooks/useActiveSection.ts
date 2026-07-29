"use client";

import { useEffect, useState } from "react";

import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import {
  ACTIVE_IDX_ATTRIBUTES,
  LAST_CORRIDOR_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";
import { sectionReadout, type SectionReadout } from "@/lib/rail-manifest/sectionLabel";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/** The section plus its live subsection, if the section has one. */
export interface ActiveSection extends SectionReadout {
  /** Lowercase subsection name, or `null` where the section has none. */
  sub: string | null;
}

/** The Arc beats that read as subsections. `thesis` is a corridor phase
 *  but not a beat — it shows no sub, exactly as the retired menu did. */
const ARC_BEATS = new Set(["navigate", "encode", "build"]);

const SERVICES_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "services");

/**
 * Resolve the subsection for a journey index (ADR-055 Update 2).
 *
 * The Arc's beat comes free: `resolveActiveIdx` already resolved the
 * corridor phase into its own manifest entry, so the beat is just that
 * entry's `corridorPhase` — no second attribute read, and `thesis` falls
 * out as "no sub" on its own.
 *
 * Services reads the ring's front card instead, because which service is
 * in front changes on SCROLL with no attribute mutation to observe (the
 * reason the caller keeps its scroll listener awake there). `ringMath`
 * and `ringProgressRef` are three-free on purpose, so this cannot drag
 * the WebGL stack into the landing's First Load JS.
 */
/**
 * Does the proof casefile own the `#services` beat right now (ADR-056)?
 *
 * Reads `proofRelease` — "who owns this beat" — and NOT `proofPresence`,
 * which is the casefile's painted-opacity envelope and would make the corner
 * flicker along with the panel's own fade. Since 2026-07-29 the release
 * overlaps the casefile's fold rather than following an empty stage, so this
 * threshold is a reading on the release ramp and must be retuned WITH the
 * ramp's edges: 0.75 lands the flip at proofP ≈ 0.87, just as the fold
 * finishes at 0.88 — the label turns over with nothing on screen left to
 * contradict it. (The earlier 0.5 named the same moment on the narrower
 * 0.70-start ramp; kept at 0.5 after round 2 widened the ramp to 0.62, the
 * corner would print "SERVICES" over a casefile still at ~0.7 opacity.)
 *
 * Its resting value is 1, so an unwritten ref, the flag-off path, mobile and
 * reduced motion all fall through to the offer's row with no branch.
 */
const PROOF_OWNS_BELOW = 0.75;
const proofOwnsServices = () => servicesRingProgressRef.current.proofRelease < PROOF_OWNS_BELOW;

function resolveSub(idx: number): string | null {
  const entry = MANIFEST_ENTRIES[idx];
  if (!entry) return null;
  if (entry.kind === "corridor") {
    const phase = entry.corridorPhase ?? "";
    return ARC_BEATS.has(phase) ? phase : null;
  }
  if (entry.id === "services") {
    // While the casefile holds the stage there is no front card to name —
    // the detail slot falls back to the journey position, which is the
    // honest readout for a beat with no sub-position of its own.
    if (proofOwnsServices()) return null;
    // `verb` is the display name and deliberately does NOT match `id`
    // (serviceData.ts) — print the verb, never the id.
    const verb = SERVICES[activeServiceForProgress(servicesRingProgressRef.current.progress)]?.verb;
    return verb ? verb.toLowerCase() : null;
  }
  return null;
}

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
 * The one scroll listener is passive, rAF-coalesced, and gated to the
 * two regimes that need it: the hero/corridor seam (where only a rect
 * read can tell that the corridor was passed — `resolveActiveIdx` rule
 * 3) and `#services` (where the front card advances on scroll alone).
 * That is the retired menu's `watch` expression exactly.
 *
 * State is keyed on the readout's ROW id plus the sub, not the manifest
 * index, so the corridor's four beats settle as one section and the
 * hero→corridor seam costs zero re-renders.
 */
export function useActiveSection(): ActiveSection {
  const [section, setSection] = useState<ActiveSection>(() => ({
    ...sectionReadout(0),
    sub: null,
  }));

  useEffect(() => {
    const html = document.documentElement;
    let scrollRaf = 0;
    let watch = true;

    const update = () => {
      const idx = resolveActiveIdx(html);
      watch = idx <= LAST_CORRIDOR_IDX || idx === SERVICES_IDX;
      const readout = sectionReadout(idx, proofOwnsServices());
      const sub = resolveSub(idx);
      setSection((prev) =>
        prev.id === readout.id && prev.sub === sub ? prev : { ...readout, sub }
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
  }, []);

  return section;
}
