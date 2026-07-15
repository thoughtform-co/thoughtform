"use client";

/**
 * ArcCasesHitLayer — the transparent DOM hit surface for the in-canvas Arc
 * Cases Card (ADR-036/041; pager restructured in the ADR-041 addendum). The
 * card face — including the pager (01 02 03 04) and the ✕ close — is BAKED
 * into the card texture; this layer is invisible <button>s welded over the
 * card's screen projection so those baked glyphs are clickable (the corridor
 * canvas is `pointer-events: none`; every corridor click goes through DOM).
 * It replaces the retired floating `ArcCasesStepper` row.
 *
 * Structure:
 *   - a region wrapper (`#arc-cases-terminal`) that is NOT tracked; its own
 *     rAF rides the card's phased `cardPresence` for opacity + `inert`, so the
 *     controls can't arrive (or take focus) before the card materializes. It
 *     keeps the region id the sigil's `aria-controls` + the Escape-refocus
 *     query target (ADR-041), and its opacity is the smoke ORDERING probe.
 *   - a tracked frame (`data-world-anchor="intelligence.casesHit"`) that
 *     `useWorldDomTracker` positions on the card centre and `gateCasesHit`
 *     sizes to the projected card rect + banks with the gyro. Its children are
 *     positioned by `CASE_CARD_HIT_REGIONS` percentages so they land on the
 *     baked pager ordinals + ✕.
 *
 * Keyboard: ←/→ step cases; Escape disarms + refocuses the sigil. Not a modal
 * (no focus trap / backdrop; scroll stays free). Self-gates on
 * `ARC_CASES_MEDIA` (gate parity with the CSS hide + the sigil/card gates).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CASE_CARD_HIT_REGIONS } from "./caseCardBake";
import { CASE_TOTAL, PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { ARC_CASES_MEDIA } from "../arcCasesCard";

/** Card-presence at which the controls become interactive / drop `inert`. */
const ARRIVE_LEVEL = 0.5;

/** A normalized `CASE_CARD_HIT_REGIONS` rect → `data-hit-*` attrs. `gateCasesHit`
 *  (sceneGeom) reads them each frame and projects the baked-glyph centre through
 *  the mirror camera to viewport px, so the button stays welded to its glyph. */
function hitData(r: { x: number; y: number; w: number; h: number }) {
  return { "data-hit-x": r.x, "data-hit-y": r.y, "data-hit-w": r.w, "data-hit-h": r.h };
}

function ArcCasesHitLayerInner() {
  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const select = useArcCasesStore((s) => s.select);
  const disarm = useArcCasesStore((s) => s.disarm);

  const regionRef = useRef<HTMLDivElement | null>(null);
  const lastOp = useRef(-1);

  // Own rAF — opacity + inert on the card's phased presence. Redundant-write
  // suppression on opacity; inert reconciled EVERY frame (the stale-inert
  // guard). The region opacity doubles as the smoke ORDERING probe (a
  // cardPresence proxy), so it must keep being written here.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const presence = arcCasesLevelRef.current.cardPresence;
      const region = regionRef.current;
      if (!region) return;
      if (Math.abs(presence - lastOp.current) > 0.002) {
        lastOp.current = presence;
        region.style.opacity = presence.toFixed(3);
      }
      region.toggleAttribute("inert", presence < ARRIVE_LEVEL);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Keyboard while armed: ←/→ step cases, Escape disarms + refocuses the
  // sigil. Not a modal (no focus trap / backdrop): a bare window listener
  // that no-ops unless armed. Reads the store live to avoid stale closures.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!useArcCasesStore.getState().armed) return;
      if (e.key === "Escape") {
        useArcCasesStore.getState().disarm();
        document.querySelector<HTMLElement>('[aria-controls="arc-cases-terminal"]')?.focus();
      } else if (e.key === "ArrowRight") {
        useArcCasesStore.getState().step(1);
      } else if (e.key === "ArrowLeft") {
        useArcCasesStore.getState().step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Stable callback ref — seed inert on attach so the region starts closed
  // even before the first rAF tick reconciles it.
  const setRegionRef = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    regionRef.current = el;
  }, []);

  return (
    <div
      ref={setRegionRef}
      id="arc-cases-terminal"
      role="region"
      aria-label="Production cases"
      data-open={armed ? "true" : "false"}
      className="home-v2-cases-hit"
      style={{ opacity: 0 }}
    >
      <div
        className="home-v2-cases-hit__frame"
        data-world-anchor="intelligence.casesHit"
        data-anchor-origin="center"
        role="group"
        aria-label="Case selector"
      >
        {PROJECT_CASES.map((projectCase, i) => (
          <button
            key={projectCase.id}
            type="button"
            className="home-v2-cases-hit__pager"
            {...hitData(CASE_CARD_HIT_REGIONS.pager[i])}
            aria-pressed={i === slot}
            aria-label={`Case ${projectCase.index} of ${CASE_TOTAL} — ${projectCase.codename}`}
            onClick={() => select(i)}
          />
        ))}
        <button
          type="button"
          className="home-v2-cases-hit__close"
          {...hitData(CASE_CARD_HIT_REGIONS.close)}
          aria-label="Close the production cases"
          onClick={disarm}
        />
      </div>
    </div>
  );
}

export function ArcCasesHitLayer() {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(ARC_CASES_MEDIA);
    const update = () => setCapable(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!capable) return null;
  return <ArcCasesHitLayerInner />;
}
