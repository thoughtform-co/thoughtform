"use client";

/**
 * ArcCasesTerminal — the fixed DOM terminal overlay (ADR-035). Replaces
 * the ADR-034 terrace screen: NO camera channel, NO in-canvas slab, NO
 * terrain shroud. The reveal is a pure DOM overlay unfurled by a CSS
 * clip-path transition, its two halves converging to the centre seam.
 *
 * Responsibilities:
 *   1. Capability gate — matchMedia on `ARC_CASES_MEDIA` (gate parity
 *      with the CSS hide of the dock + this overlay); renders `null`
 *      when not capable so mobile/reduced-motion never mounts it.
 *   2. The SINGLE writer of `arcCasesLevelRef` — its own rAF damps the
 *      arm level toward `armed ? 1 : 0`, multiplies by the scroll-owned
 *      Build-band factor (`bandGetter`), writes `level`, reconciles the
 *      panel's `inert` every frame, and resets `level` to 0 on unmount.
 *   3. Unfurl — a `is-open` class toggled off the store `armed` (React
 *      subscription). Content stays mounted; the closed panel is hidden
 *      by a zero-JS delayed `visibility` transition + `inert`. No JS
 *      motion drives the panel geometry (CSS clip-path owns it).
 *   4. Keyboard — `Escape` while open disarms and refocuses the CTA.
 *      NOT a modal: no focus trap, no backdrop, scroll stays free.
 *
 * DOM order = visual order = focus order: two genuine content halves
 * (no duplication) — left = the case screenshot, right = the meta header
 * + body + the case stepper. Content swap is `key={activeCase.id}` + a
 * 0.18s fade-in keyframe (a crossfade-on-step read; no queue,
 * retarget-safe — rapid stepping just remounts the keyed content).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { CASE_TOTAL, PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { arcBandFactor, dampLevel } from "@/lib/arc-cases/arcCasesMath";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import { smootherstep } from "@/lib/services-ring/ringMath";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "../DepthGatewayScene/motionFollower";
import { ARC_CASES_MEDIA } from "../arcCasesTerminal";

/** Level threshold at which the panel becomes interactive / drops
 *  `inert` — matches the CTA dock's ARRIVE convention. Below it the
 *  panel is mid-sweep or closed and should not take focus. */
const ARRIVE_LEVEL = 0.5;

/**
 * Production band assembly — carried verbatim from the retired
 * `ArcCasesTerraceGate.terraceBand()`:
 *   `arcBandFactor(paintProgress, epilogue)` — Build-band rise ×
 *     epilogue kill (the ADR-033 exclusivity contract vs the services
 *     ring, unchanged), ×
 *   `(1 − smootherstep(0, 0.15, dissipate))` — the corridor-exit
 *     zoom-dissipate guard: the instant the exit dissipate engages the
 *     reveal is gone, long before the services ring enters.
 * The lab passes `() => 1` to isolate the arm envelope.
 */
function terminalBand(): number {
  const { paintProgress } = useDepthGatewayStore.getState().transform;
  const dissipateGuard = 1 - smootherstep(0, 0.15, getSmoothedDissipate());
  return arcBandFactor(paintProgress, getSmoothedEpilogueProgress()) * dissipateGuard;
}

/**
 * The overlay itself — mounted only when capable (all per-frame hooks
 * live here so the capability gate can early-return `null` cleanly).
 */
function ArcCasesTerminalOverlay({ bandGetter }: { bandGetter: () => number }) {
  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const step = useArcCasesStore((s) => s.step);
  const select = useArcCasesStore((s) => s.select);

  const sectionRef = useRef<HTMLElement | null>(null);
  const armDamp = useRef(0);

  // The SINGLE level writer. dt from rAF timestamps clamped [0, 0.1]
  // (frameloop toggles / idle resumes can't destabilize the damp);
  // residual snapping keeps the branch boundaries exact (BEST-PRACTICES
  // "snap them"). `level` = damped arm × the scroll-owned band, so the
  // readers (labels, caption) never re-derive the band.
  useEffect(() => {
    let raf = 0;
    let lastTime: number | null = null;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastTime === null ? 0 : Math.max(0, Math.min(0.1, (now - lastTime) / 1000));
      lastTime = now;

      const target = useArcCasesStore.getState().armed ? 1 : 0;
      let damped = dampLevel(armDamp.current, target, dt);
      if (damped < 0.001) damped = 0;
      else if (damped > 0.999) damped = 1;
      armDamp.current = damped;

      const level = damped * bandGetter();
      arcCasesLevelRef.current.level = level;

      // Inert reconciled EVERY frame — a store-driven re-render must
      // never leave a stale inert behind. Below the arrive threshold the
      // panel is closed or mid-sweep and takes no focus.
      const section = sectionRef.current;
      if (section) section.toggleAttribute("inert", level < ARRIVE_LEVEL);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      arcCasesLevelRef.current.level = 0;
    };
  }, [bandGetter]);

  // Escape while open → disarm + refocus the CTA. Not a modal (no focus
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

  // Stable callback ref — seed inert on attach so the panel starts
  // closed even before the first rAF tick reconciles it.
  const setSectionRef = useCallback((el: HTMLElement | null) => {
    if (el) el.setAttribute("inert", "");
    sectionRef.current = el;
  }, []);

  const activeCase = PROJECT_CASES[slot] ?? PROJECT_CASES[0];

  return (
    <section
      ref={setSectionRef}
      id="arc-cases-terminal"
      role="region"
      aria-label="Production cases"
      className={armed ? "home-v2-cases-terminal is-open" : "home-v2-cases-terminal"}
      data-open={armed ? "true" : "false"}
    >
      {/* Left half — the case screenshot. Clips from its outer (left)
          edge toward the centre seam; the front rides the opening edge. */}
      <div className="home-v2-cases-terminal__half home-v2-cases-terminal__half--media">
        <span className="home-v2-cases-terminal__front" aria-hidden="true" />
        <span className="home-v2-cases-terminal__cross is-tl" aria-hidden="true" />
        <span className="home-v2-cases-terminal__cross is-bl" aria-hidden="true" />
        <figure key={activeCase.id} className="home-v2-cases-terminal__shot">
          {/* Plain img (not next/image): the source is the same static
              asset the terrace bake sampled; CSS owns the gold treatment
              now (v1 approximation of the retired LUT — owner iterates). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeCase.image.src} alt={activeCase.image.alt} />
        </figure>
      </div>

      {/* Right half — meta header, body, stepper. Clips from its outer
          (right) edge toward the centre seam. */}
      <div className="home-v2-cases-terminal__half home-v2-cases-terminal__half--meta">
        <span className="home-v2-cases-terminal__front" aria-hidden="true" />
        <span className="home-v2-cases-terminal__cross is-tr" aria-hidden="true" />
        <span className="home-v2-cases-terminal__cross is-br" aria-hidden="true" />
        <div key={activeCase.id} className="home-v2-cases-terminal__meta">
          <header className="home-v2-cases-terminal__meta-head">
            <span className="home-v2-cases-terminal__codename">{activeCase.codename}</span>
            <span className="home-v2-cases-terminal__ident">
              {activeCase.index} / {CASE_TOTAL} · {activeCase.status}
            </span>
          </header>
          <p className="home-v2-cases-terminal__mode">
            {activeCase.mode} · {activeCase.tagline}
          </p>
          {activeCase.metric && (
            <p className="home-v2-cases-terminal__metric">
              <b>{activeCase.metric.value}</b> {activeCase.metric.label}
            </p>
          )}
          <h3 className="home-v2-cases-terminal__title">
            {activeCase.title.map((seg, i) =>
              seg.em ? <em key={i}>{seg.text}</em> : <span key={i}>{seg.text}</span>
            )}
          </h3>
          <ul className="home-v2-cases-terminal__stack" aria-label="Stack">
            {activeCase.stack.slice(0, 6).map((tech) => (
              <li key={tech} className="home-v2-cases-terminal__stack-chip">
                {tech}
              </li>
            ))}
          </ul>
        </div>
        {/* Footer stepper — the right-rail signature re-homed: diamond
            prev/next, active chip gold + underline. DOM order = focus
            order (prev → chips → next). Not keyed — its aria-pressed just
            re-targets on step; only the meta content above crossfades. */}
        <div className="home-v2-cases-terminal__stepper" role="group" aria-label="Case selector">
          <button
            type="button"
            className="home-v2-cases-terminal__step"
            aria-label="Previous case"
            onClick={() => step(-1)}
          />
          {PROJECT_CASES.map((projectCase, i) => (
            <button
              key={projectCase.id}
              type="button"
              className="home-v2-cases-terminal__chip"
              aria-pressed={i === slot}
              aria-label={`Case ${projectCase.index} — ${projectCase.codename}`}
              onClick={() => select(i)}
            >
              {projectCase.index}
            </button>
          ))}
          <button
            type="button"
            className="home-v2-cases-terminal__step home-v2-cases-terminal__step--next"
            aria-label="Next case"
            onClick={() => step(1)}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Capability gate — matchMedia on `ARC_CASES_MEDIA` (== the CSS hide of
 * the dock + overlay; gate parity). Renders `null` when not capable so
 * the overlay (and its rAF) never exist off-desktop. `bandGetter`
 * defaults to the production band assembly; the lab passes `() => 1`.
 */
export function ArcCasesTerminal({ bandGetter = terminalBand }: { bandGetter?: () => number }) {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(ARC_CASES_MEDIA);
    const update = () => setCapable(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!capable) return null;
  return <ArcCasesTerminalOverlay bandGetter={bandGetter} />;
}
