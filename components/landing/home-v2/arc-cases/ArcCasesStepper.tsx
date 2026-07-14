"use client";

/**
 * ArcCasesStepper — the accessible DOM control row for the in-canvas Arc
 * Cases Card (ADR-036). The card itself is a 3D object in the R3F canvas
 * (no DOM), so this compact fixed row is the reveal's keyboard/AT surface:
 * ◂ 01 02 03 04 ▸ centred below the card's screen region. It carries the
 * region id `arc-cases-terminal` so the CTA's existing
 * `aria-controls="arc-cases-terminal"` stays honest (the chip opens/steps
 * this region), with NO change to `ArcCasesTerminalCta`.
 *
 * It rides the shared arm LEVEL for its own opacity + `inert`: a small rAF
 * reads `arcCasesLevelRef.current.level` (written by the card's useFrame),
 * fades the row via a CSS custom property, and reconciles `inert` EVERY
 * frame (a store-driven re-render must never leave a stale inert behind —
 * the CTA-dock bug). Below the arrive threshold the row is closed and takes
 * no focus. Escape while armed disarms and refocuses the CTA (not a modal:
 * a bare window listener, no focus trap, scroll stays free).
 *
 * Self-gates on `ARC_CASES_MEDIA` (gate parity with the CSS hide) so it
 * never mounts off-desktop.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CASE_TOTAL, PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { ARC_CASES_MEDIA } from "../arcCasesCard";

/** Level at which the row becomes interactive / drops `inert` — matches the
 *  CTA dock's ARRIVE convention. Below it the card is mid-materialize or
 *  closed and the row should not take focus. */
const ARRIVE_LEVEL = 0.5;

function ArcCasesStepperRow() {
  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const step = useArcCasesStore((s) => s.step);
  const select = useArcCasesStore((s) => s.select);

  const rowRef = useRef<HTMLDivElement | null>(null);
  const lastOp = useRef(-1);

  // Own rAF — opacity + inert on the shared arm level. Redundant-write
  // suppression on opacity; inert reconciled EVERY frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const level = arcCasesLevelRef.current.level;
      const row = rowRef.current;
      if (!row) return;
      if (Math.abs(level - lastOp.current) > 0.002) {
        lastOp.current = level;
        row.style.opacity = level.toFixed(3);
      }
      row.toggleAttribute("inert", level < ARRIVE_LEVEL);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Escape while armed → disarm + refocus the CTA. Not a modal (no focus
  // trap / backdrop): a bare window listener that no-ops unless armed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !useArcCasesStore.getState().armed) return;
      useArcCasesStore.getState().disarm();
      document.querySelector<HTMLElement>('[aria-controls="arc-cases-terminal"]')?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Stable callback ref — seed inert on attach so the row starts closed
  // even before the first rAF tick reconciles it.
  const setRowRef = useCallback((el: HTMLDivElement | null) => {
    if (el) el.setAttribute("inert", "");
    rowRef.current = el;
  }, []);

  return (
    <div
      ref={setRowRef}
      id="arc-cases-terminal"
      role="region"
      aria-label="Production cases"
      data-open={armed ? "true" : "false"}
      className="home-v2-cases-stepper"
      style={{ opacity: 0 }}
    >
      <div className="home-v2-cases-stepper__inner" role="group" aria-label="Case selector">
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
            aria-label={`Case ${projectCase.index} of ${CASE_TOTAL} — ${projectCase.codename}`}
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

export function ArcCasesStepper() {
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
  return <ArcCasesStepperRow />;
}
