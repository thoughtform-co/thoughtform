"use client";

/**
 * ArcCasesCue — the "VIEW THE CASES" trigger (ADR-042, supersedes the ADR-041
 * sphere-welded `ArcCasesSigil`). A subtle dotted-leader + label that docks
 * DIRECTLY UNDER the Build station title ("BUILD ON THE LAYER"), where the
 * pre-ADR-041 chip lived. It rides the Build header's `__head` band (the RAF in
 * `CorridorStationHeaders` fades that container in on the Build beat and out on
 * the epilogue), so the cue inherits the station's scroll-in / scroll-out for
 * free — this component owns only the button, its arm gate, and its
 * interactivity.
 *
 * WHY IT MOVED OFF THE SPHERE (ADR-042). The compass sigil welded to the
 * sphere's front pole read as out of place — a piece of chrome inscribed on the
 * instrument rather than a call to act. The owner asked for a quiet label under
 * the Build phase (which is where the Arc's three moves — Navigate / Encode /
 * Build — resolve), a dotted line with text under it that coaxes the click. So
 * the trigger returns to the DOM header layer; the world-anchor (`intelligence.
 * sigil` + `gateSigil`) and `SIGIL_Z` are retired. The reveal itself (ADR-036
 * in-canvas card, ADR-041 phased fold→card ordering) is UNCHANGED.
 *
 * Carried verbatim from the sigil (and originally the retired chip):
 *   - `aria-controls="arc-cases-terminal"` + `aria-expanded` (the stepper's
 *     Escape handler queries that exact selector to refocus this trigger);
 *   - EVERY-FRAME `inert` reconciliation via its own rAF (a store-driven
 *     re-render must never leave a stale inert behind — the CTA-dock bug);
 *   - a stable callback ref that seeds `inert` on attach;
 *   - the auto-disarm watcher (scroll out of the Build band closes the reveal —
 *     no scroll lock, no new scroll writers; the ADR-032 guardrails).
 *
 * The arm gate is the SHARED `sigilSettle` (sources/surfaces notes settled) at
 * the Build park: below it the cue is `inert` (not focusable/clickable) and CSS
 * fades it to nothing, so the reveal can't be armed before the frame it lands in
 * exists. UNLIKE the sigil, the cue sits at the TOP of the viewport, clear of
 * the centred card — so it stays fully interactive while armed (click again to
 * close, Escape to close + refocus). Self-gates on `ARC_CASES_MEDIA` (gate
 * parity with the CSS hide + the card/stepper gates) so it never mounts
 * off-desktop.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { sigilSettle } from "@/lib/arc-cases/arcCasesMath";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedAccretionLayers } from "../DepthGatewayScene/motionFollower";
import { ARC_CASES_MEDIA } from "../arcCasesCard";

/** Settle factor at which the cue becomes interactive / drops `inert` and
 *  fades in. Below it the notes are still moving (or the beat has left) and the
 *  trigger should take no focus and offer no click. */
const ARM_SETTLE = 0.5;

function ArcCasesCueButton() {
  const armed = useArcCasesStore((s) => s.armed);
  const toggle = useArcCasesStore((s) => s.toggle);

  const hostRef = useRef<HTMLDivElement | null>(null);

  // Own rAF — reconcile `inert` + the `is-armable` fade off the SHARED settle
  // gate (notes landed + parked at the Build beat). Reconciled EVERY frame (a
  // store-driven re-render must never leave a stale inert behind — the CTA-dock
  // bug). The cue is at the top of the viewport, clear of the card, so unlike
  // the sigil it stays armable (focusable + clickable) while the card is open,
  // which is what lets a second click / Escape close it.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const host = hostRef.current;
      if (!host) return;
      const t = useDepthGatewayStore.getState().transform;
      const parked = t.beat === "intelligence" && t.active && !t.docked;
      const settle = sigilSettle(getSmoothedAccretionLayers().stack);
      const armable = parked && settle >= ARM_SETTLE;
      host.toggleAttribute("inert", !armable);
      host.classList.toggle("is-armable", armable);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-disarm when the visitor scrolls out of the Build band (or the corridor
  // docks / disengages) — subscribe WITHOUT re-rendering; the card's band gate
  // is the belt, this watcher is the suspenders. (Moved verbatim from the
  // sigil, and originally the retired `ArcCasesTerminalCta`.)
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
    <div ref={setHostRef} className="home-v2-cases-cue" data-armed={armed ? "true" : "false"}>
      {/* The subtle dotted leader — a hairline dashed rule dropping from the
          Build title down to the label, tying the invitation to the phase. */}
      <span className="home-v2-cases-cue__leader" aria-hidden="true" />
      <button
        type="button"
        className="home-v2-cases-cue__btn"
        aria-label="View the production cases"
        aria-expanded={armed}
        aria-controls="arc-cases-terminal"
        onClick={toggle}
      >
        <span className="home-v2-cases-cue__label">See tools</span>
      </button>
    </div>
  );
}

export function ArcCasesCue() {
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
  return <ArcCasesCueButton />;
}
