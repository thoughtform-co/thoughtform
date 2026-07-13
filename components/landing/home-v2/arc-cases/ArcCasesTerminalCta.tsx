"use client";

/**
 * ArcCasesTerminalCta — the terminal's arming chip (ADR-035). Just the
 * chip now; the stepper moved INTO the overlay (its right half's
 * footer), so this component carries no stepper.
 *
 * Mounted by `CorridorStationHeaders` as the bld station's
 * `afterContent`, so it renders centered UNDER the "BUILD ON THE LAYER."
 * title (in-flow inside `.home-v2-station-header__head`), not on the
 * right-rail column (the ADR-034 position, retired).
 *
 * Drives its OWN opacity with its own rAF (the `CorridorProgressRail`
 * pattern — NOT the station-headers rAF): the dock arrives with the
 * Build caption band and leaves on the epilogue BUILD_OUT band / the
 * dock. Carries verbatim from the retired `ArcCasesTerraceCta`:
 *   - own-rAF opacity `CTA_FADE_IN × (1 − BUILD_OUT) × engaged × !docked`;
 *   - EVERY-FRAME inert reconciliation (a React re-render re-attaching
 *     the ref must never leave a stale inert behind the write-
 *     suppression — a real bug found in build-out);
 *   - a stable callback ref that seeds inert on attach;
 *   - the auto-disarm watcher (`beat !== "intelligence" ||
 *     epilogueProgress > 0.02 || docked || !active`) — scrolling out of
 *     the Build band closes the terminal (no scroll lock, no new scroll
 *     writers — the ADR-032 guardrails). The overlay's band gate is the
 *     belt; this watcher is the suspenders.
 */

import { useCallback, useEffect, useRef } from "react";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";

/** Dock fade-in band on the paint clock — lands with the Build
 *  caption's arrival (station headers' BUILD_FADE_IN is [0.84, 0.91];
 *  the CTA trails it slightly so the chip never precedes its context). */
const CTA_FADE_IN: readonly [number, number] = [0.885, 0.915];

/** Opacity threshold at which the dock becomes interactive (the
 *  station-headers TYPER_ARRIVE convention). */
const ARRIVE_OPACITY = 0.5;

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function ArcCasesTerminalCta() {
  const armed = useArcCasesStore((s) => s.armed);
  const toggle = useArcCasesStore((s) => s.toggle);

  const dockRef = useRef<HTMLDivElement | null>(null);
  const last = useRef<{ dockOp: number }>({ dockOp: -1 });

  // Own rAF — dock opacity on the Build band. Redundant-write
  // suppression like the progress rail.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const engaged = t.active || t.armed;
      const p = engaged ? t.paintProgress : 0;
      const buildOut = epilogueBand(t.epilogueProgress, "BUILD_OUT");
      const dockOp =
        engaged && !t.docked
          ? smoothstep(CTA_FADE_IN[0], CTA_FADE_IN[1], p) * Math.max(0, 1 - buildOut)
          : 0;

      const prev = last.current;
      const dock = dockRef.current;
      if (dock) {
        if (Math.abs(dockOp - prev.dockOp) > 0.002) {
          prev.dockOp = dockOp;
          dock.style.opacity = dockOp.toFixed(3);
        }
        // Inert reconciled EVERY frame (not inside the opacity-diff
        // gate): a React re-render re-attaching the ref must never
        // leave a stale inert behind the write-suppression.
        dock.toggleAttribute("inert", dockOp < ARRIVE_OPACITY);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-disarm when the visitor scrolls out of the Build band (or the
  // corridor docks / disengages) — subscribe WITHOUT re-rendering; the
  // overlay's band gate is the belt, this watcher is the suspenders.
  useEffect(() => {
    return useDepthGatewayStore.subscribe((state) => {
      if (!useArcCasesStore.getState().armed) return;
      const t = state.transform;
      const away = t.beat !== "intelligence" || t.epilogueProgress > 0.02 || t.docked || !t.active;
      if (away) useArcCasesStore.getState().disarm();
    });
  }, []);

  // STABLE callback ref — a fresh function identity would make React
  // detach/re-attach on every store-driven re-render and re-set the
  // initial inert (the bug the per-frame reconciliation above also
  // guards against).
  const setDockRef = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    dockRef.current = el;
  }, []);

  return (
    <div ref={setDockRef} className="home-v2-cases-cta-dock" style={{ opacity: 0 }}>
      <button
        type="button"
        className="home-v2-copy-cta home-v2-cases-cta"
        data-armed={armed ? "true" : "false"}
        aria-expanded={armed}
        aria-controls="arc-cases-terminal"
        onClick={toggle}
      >
        {armed ? "CLOSE" : "VIEW THE CASES"}
        <span className="home-v2-copy-cta__chevrons" aria-hidden="true">
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
        </span>
      </button>
    </div>
  );
}
