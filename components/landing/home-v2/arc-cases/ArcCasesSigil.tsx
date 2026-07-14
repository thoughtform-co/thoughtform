"use client";

/**
 * ArcCasesSigil — the "VIEW THE CASES" trigger (ADR-041, supersedes the
 * ADR-035/036 `ArcCasesTerminalCta` chip). A world-anchored DOM marker
 * welded to the sphere's FRONT POLE, where the two edge-on gimbal rings
 * cross. It rides the same `useWorldDomTracker` pipeline as the SOURCES /
 * SURFACES chips (anchor `intelligence.sigil` in `COPY_ANCHORS`): the
 * tracker writes its `translate3d` + perspective scale, and `gateSigil`
 * (sceneGeom) writes its opacity — fading it IN as the notes settle and
 * OUT as the card materializes on the same axis and covers it. So this
 * component owns only the button, its pulse, and its interactivity.
 *
 * WHY DOM (not in-canvas): the corridor canvas is `pointer-events: none`
 * with zero R3F click handlers — every corridor click goes through a DOM
 * overlay. A world-anchored marker that banks and scales WITH the geometry
 * reads as part of the instrument (like the Encode cardinal markers), so
 * there's no "floating chrome" cost and a real <button> gets aria + focus
 * for free. (The ADR-036 "floating" objection was about a large fixed
 * viewport-centred PANEL, not a welded marker.)
 *
 * Carried verbatim from the retired chip:
 *   - `aria-controls="arc-cases-terminal"` + `aria-expanded` (the stepper's
 *     Escape handler queries that exact selector to refocus this trigger);
 *   - EVERY-FRAME `inert` reconciliation via its own rAF (a store-driven
 *     re-render must never leave a stale inert behind — the CTA-dock bug);
 *   - a stable callback ref that seeds `inert` on attach;
 *   - the auto-disarm watcher (scroll out of the Build band closes the
 *     reveal — no scroll lock, no new scroll writers; the ADR-032
 *     guardrails). The card's band gate is the belt, this is the suspenders.
 *
 * The inert gate reads the SHARED `sigilSettle` (notes-settled) WITHOUT the
 * card-fade, so while the card is open the marker is visually hidden (opacity
 * ~0 from `gateSigil`) but stays focusable — Escape returns focus here. A
 * `data-armed` attribute drops mouse `pointer-events` while open (CSS), so the
 * invisible marker never catches a phantom click over the card; closing is
 * owned by the stepper's CLOSE. Self-gates on `ARC_CASES_MEDIA` (gate parity
 * with the CSS hide + the card/stepper gates) so it never mounts off-desktop.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { sigilSettle } from "@/lib/arc-cases/arcCasesMath";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedAccretionLayers } from "../DepthGatewayScene/motionFollower";
import { ARC_CASES_MEDIA } from "../arcCasesCard";

/** Settle factor at which the marker becomes interactive / drops `inert`.
 *  Below it the notes are still moving (or the beat has left) and the
 *  trigger should take no focus. */
const ARM_SETTLE = 0.5;

function ArcCasesSigilButton() {
  const armed = useArcCasesStore((s) => s.armed);
  const toggle = useArcCasesStore((s) => s.toggle);

  const hostRef = useRef<HTMLDivElement | null>(null);

  // Own rAF — reconcile `inert` off the SHARED settle gate (notes landed +
  // parked at the Build beat), NOT the host's live opacity: opacity folds in
  // the card-fade, but the trigger must stay focusable while the card is open
  // so Escape can return focus to it. Reconciled EVERY frame (a store-driven
  // re-render must never leave a stale inert behind — the CTA-dock bug).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const host = hostRef.current;
      if (!host) return;
      const t = useDepthGatewayStore.getState().transform;
      const parked = t.beat === "intelligence" && t.active && !t.docked;
      const settle = sigilSettle(getSmoothedAccretionLayers().stack);
      host.toggleAttribute("inert", !parked || settle < ARM_SETTLE);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-disarm when the visitor scrolls out of the Build band (or the
  // corridor docks / disengages) — subscribe WITHOUT re-rendering; the card's
  // band gate is the belt, this watcher is the suspenders. (Moved verbatim
  // from the retired `ArcCasesTerminalCta`.)
  useEffect(() => {
    return useDepthGatewayStore.subscribe((state) => {
      if (!useArcCasesStore.getState().armed) return;
      const t = state.transform;
      const away = t.beat !== "intelligence" || t.epilogueProgress > 0.02 || t.docked || !t.active;
      if (away) useArcCasesStore.getState().disarm();
    });
  }, []);

  // STABLE callback ref — a fresh function identity would make React
  // detach/re-attach on every store-driven re-render and re-seed the initial
  // inert (the bug the per-frame reconciliation above also guards against).
  const setHostRef = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    hostRef.current = el;
  }, []);

  return (
    <div
      ref={setHostRef}
      className="home-v2-cases-sigil"
      data-world-anchor="intelligence.sigil"
      data-anchor-origin="center"
      data-armed={armed ? "true" : "false"}
      style={{ opacity: 0 }}
    >
      <button
        type="button"
        className="home-v2-cases-sigil__btn"
        aria-label="View the production cases"
        aria-expanded={armed}
        aria-controls="arc-cases-terminal"
        onClick={toggle}
      >
        <span className="home-v2-cases-sigil__pulse" aria-hidden="true" />
        <span className="home-v2-cases-sigil__mark" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ArcCasesSigil() {
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
  return <ArcCasesSigilButton />;
}
