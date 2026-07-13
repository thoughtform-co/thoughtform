"use client";

/**
 * ArcCasesTerraceCta — the terrace's arming control + case stepper
 * (ADR-034). One fixed cluster bottom-right on the right-rail column
 * (under the `THE ARC · 03` register): the VIEW THE CASES ↔ CLOSE chip,
 * with the ◂ 01 02 03 04 ▸ stepper docking above it while armed.
 *
 * Drives its OWN opacity with its own rAF (the `CorridorProgressRail`
 * pattern — NOT the station-headers rAF): the cluster arrives with the
 * Build caption band and leaves on the epilogue BUILD_OUT band / the
 * dock. The stepper row additionally rides the terrace's damped level
 * (`arcCasesLevelRef`) so it materializes with the screen, not with the
 * click.
 *
 * Owns the AUTO-DISARM watcher (carried verbatim from the ADR-033 CTA):
 * scrolling out of the Build band closes the terrace — no scroll lock,
 * no new scroll writers (the ADR-032 guardrails).
 *
 * DOM order = focus order (CTA → prev → chips → next); the row renders
 * `column-reverse` so the stepper sits visually ABOVE the chip.
 */

import { useCallback, useEffect, useRef } from "react";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";

/** Cluster fade-in band on the paint clock — lands with the Build
 *  caption's arrival (station headers' BUILD_FADE_IN is [0.84, 0.91];
 *  the CTA trails it slightly so the chip never precedes its context). */
const CTA_FADE_IN: readonly [number, number] = [0.885, 0.915];

/** Opacity threshold at which the cluster becomes interactive (the
 *  station-headers TYPER_ARRIVE convention). */
const ARRIVE_OPACITY = 0.5;

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function ArcCasesTerraceCta() {
  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const toggle = useArcCasesStore((s) => s.toggle);
  const step = useArcCasesStore((s) => s.step);
  const select = useArcCasesStore((s) => s.select);

  const rowRef = useRef<HTMLDivElement | null>(null);
  const stepperRef = useRef<HTMLDivElement | null>(null);
  const last = useRef<{ rowOp: number; stepOp: number }>({ rowOp: -1, stepOp: -1 });

  // Own rAF — row opacity on the Build band, stepper opacity on the
  // terrace level. Redundant-write suppression like the progress rail.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const engaged = t.active || t.armed;
      const p = engaged ? t.paintProgress : 0;
      const buildOut = epilogueBand(t.epilogueProgress, "BUILD_OUT");
      const rowOp =
        engaged && !t.docked
          ? smoothstep(CTA_FADE_IN[0], CTA_FADE_IN[1], p) * Math.max(0, 1 - buildOut)
          : 0;
      const stepOp = arcCasesLevelRef.current.level;

      const prev = last.current;
      const row = rowRef.current;
      if (row) {
        if (Math.abs(rowOp - prev.rowOp) > 0.002) {
          prev.rowOp = rowOp;
          row.style.opacity = rowOp.toFixed(3);
        }
        // Inert reconciled EVERY frame (not inside the opacity-diff
        // gate): a React re-render re-attaching the ref must never
        // leave a stale inert behind the write-suppression.
        row.toggleAttribute("inert", rowOp < ARRIVE_OPACITY);
      }
      const stepper = stepperRef.current;
      if (stepper) {
        if (Math.abs(stepOp - prev.stepOp) > 0.002) {
          prev.stepOp = stepOp;
          stepper.style.opacity = stepOp.toFixed(3);
        }
        stepper.toggleAttribute("inert", stepOp < ARRIVE_OPACITY);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-disarm when the visitor scrolls out of the Build band (or the
  // corridor docks / disengages) — subscribe WITHOUT re-rendering; the
  // screen's band gate is the belt, this watcher is the suspenders.
  useEffect(() => {
    return useDepthGatewayStore.subscribe((state) => {
      if (!useArcCasesStore.getState().armed) return;
      const t = state.transform;
      const away = t.beat !== "intelligence" || t.epilogueProgress > 0.02 || t.docked || !t.active;
      if (away) useArcCasesStore.getState().disarm();
    });
  }, []);

  // STABLE callback refs — a fresh function identity would make React
  // detach/re-attach on every store-driven re-render and re-set the
  // initial inert (the bug the per-frame reconciliation above also
  // guards against).
  const setRowRef = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    rowRef.current = el;
  }, []);
  const setStepperRef = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    stepperRef.current = el;
  }, []);

  return (
    <div ref={setRowRef} className="home-v2-cases-cta-row" style={{ opacity: 0 }}>
      <button
        type="button"
        className="home-v2-copy-cta home-v2-cases-cta"
        data-armed={armed ? "true" : "false"}
        aria-expanded={armed}
        onClick={toggle}
      >
        {armed ? "CLOSE" : "VIEW THE CASES"}
        <span className="home-v2-copy-cta__chevrons" aria-hidden="true">
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
          <span className="home-v2-copy-cta__chev" />
        </span>
      </button>
      <div
        ref={setStepperRef}
        className="home-v2-cases-stepper"
        role="group"
        aria-label="Case selector"
        style={{ opacity: 0 }}
      >
        <button
          type="button"
          className="home-v2-cases-stepper__step"
          aria-label="Previous case"
          onClick={() => step(-1)}
        />
        {PROJECT_CASES.map((projectCase, i) => (
          <button
            key={projectCase.id}
            type="button"
            className="home-v2-cases-stepper__chip"
            aria-pressed={i === slot}
            aria-label={`Case ${projectCase.index} — ${projectCase.codename}`}
            onClick={() => select(i)}
          >
            {projectCase.index}
          </button>
        ))}
        <button
          type="button"
          className="home-v2-cases-stepper__step home-v2-cases-stepper__step--next"
          aria-label="Next case"
          onClick={() => step(1)}
        />
      </div>
    </div>
  );
}
